import { ref, computed, watch } from 'vue';
import type { DeliveryAttempt, EndpointConfig, TelemetryMessage, WebhookEvent } from '@audithook/shared-types';

const isConnected = ref(false);
const events = ref<WebhookEvent[]>([]);
const endpoints = ref<EndpointConfig[]>([]);
const activeEndpointId = ref<string>('all');
const selectedEventId = ref<string | null>(null);

const searchQuery = ref('');
const selectedMethod = ref<string>('ALL');
const selectedStatus = ref<string>('ALL');
const isReplaying = ref(false);

let eventSource: EventSource | null = null;

export function useTelemetry() {
  const currentEndpoint = computed(() => {
    if (activeEndpointId.value === 'all') return endpoints.value[0] || null;
    return endpoints.value.find((e) => e.id === activeEndpointId.value) || null;
  });

  const filteredEvents = computed(() => {
    return events.value.filter((event) => {
      if (activeEndpointId.value !== 'all' && event.endpointId !== activeEndpointId.value) {
        return false;
      }

      if (selectedMethod.value !== 'ALL' && event.method !== selectedMethod.value) {
        return false;
      }

      if (selectedStatus.value !== 'ALL' && event.status !== selectedStatus.value) {
        return false;
      }

      if (searchQuery.value.trim().length > 0) {
        const query = searchQuery.value.toLowerCase().trim();
        const idMatch = event.id.toLowerCase().includes(query);
        const pathMatch = event.path.toLowerCase().includes(query);
        const originMatch = (event.sourceOrigin || '').toLowerCase().includes(query);
        const ipMatch = event.ip.includes(query);
        const payloadMatch = typeof event.payload === 'string'
          ? event.payload.toLowerCase().includes(query)
          : JSON.stringify(event.payload).toLowerCase().includes(query);

        return idMatch || pathMatch || originMatch || ipMatch || payloadMatch;
      }

      return true;
    });
  });

  const selectedEvent = computed(() => {
    if (!selectedEventId.value) return filteredEvents.value[0] || null;
    return events.value.find((e) => e.id === selectedEventId.value) || filteredEvents.value[0] || null;
  });

  function selectEvent(id: string) {
    selectedEventId.value = id;
  }

  async function fetchEndpoints() {
    try {
      const res = await fetch('/api/endpoints');
      if (res.ok) {
        endpoints.value = await res.json();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchEvents() {
    try {
      const endpointParam = activeEndpointId.value !== 'all' ? `?endpointId=${activeEndpointId.value}` : '';
      const res = await fetch(`/api/events${endpointParam}`);
      if (res.ok) {
        events.value = await res.json();
        if (!selectedEventId.value && events.value.length > 0) {
          selectedEventId.value = events.value[0].id;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function createEndpoint(data: { id?: string; name: string; targetUrl: string; autoForward: boolean }) {
    const res = await fetch('/api/endpoints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create endpoint');
    }
    const created = await res.json();
    await fetchEndpoints();
    activeEndpointId.value = created.id;
    return created;
  }

  async function updateEndpointConfig(id: string, updates: Partial<EndpointConfig>) {
    const res = await fetch(`/api/endpoints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updated = await res.json();
      const index = endpoints.value.findIndex((e) => e.id === id);
      if (index !== -1) {
        endpoints.value[index] = updated;
      }
    }
  }

  async function replayEvent(eventId: string, customTargetUrl?: string, customHeaders?: Record<string, string>, customPayload?: any) {
    isReplaying.value = true;
    try {
      const res = await fetch('/api/dispatch/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          targetUrl: customTargetUrl,
          customHeaders,
          customPayload
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.event) {
          const index = events.value.findIndex((e) => e.id === eventId);
          if (index !== -1) {
            events.value[index] = data.event;
          }
        }
        return data.attempt as DeliveryAttempt;
      }
    } finally {
      isReplaying.value = false;
    }
  }

  async function clearAllEvents() {
    const endpointParam = activeEndpointId.value !== 'all' ? `?endpointId=${activeEndpointId.value}` : '';
    await fetch(`/api/events${endpointParam}`, { method: 'DELETE' });
    if (activeEndpointId.value === 'all') {
      events.value = [];
    } else {
      events.value = events.value.filter((e) => e.endpointId !== activeEndpointId.value);
    }
    selectedEventId.value = null;
  }

  function connectSse() {
    if (eventSource) {
      eventSource.close();
    }

    const streamUrl = activeEndpointId.value !== 'all'
      ? `/api/telemetry/stream?endpointId=${activeEndpointId.value}`
      : `/api/telemetry/stream`;

    eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      isConnected.value = true;
    };

    eventSource.onmessage = (event) => {
      try {
        const msg: TelemetryMessage = JSON.parse(event.data);
        handleTelemetryMessage(msg);
      } catch {}
    };

    eventSource.onerror = () => {
      isConnected.value = false;
      eventSource?.close();
      setTimeout(connectSse, 3000);
    };
  }

  function handleTelemetryMessage(msg: TelemetryMessage) {
    if (msg.type === 'EVENT_CREATED') {
      const newEvent = msg.data as WebhookEvent;
      const exists = events.value.some((e) => e.id === newEvent.id);
      if (!exists) {
        events.value.unshift(newEvent);
        if (!selectedEventId.value) {
          selectedEventId.value = newEvent.id;
        }
      }
    } else if (msg.type === 'DELIVERY_UPDATED') {
      const { eventId, status, attempt } = msg.data;
      const target = events.value.find((e) => e.id === eventId);
      if (target) {
        target.status = status;
        target.deliveryAttempts.unshift(attempt);
      }
    } else if (msg.type === 'ENDPOINT_UPDATED') {
      const updated = msg.data as EndpointConfig;
      const index = endpoints.value.findIndex((e) => e.id === updated.id);
      if (index !== -1) {
        endpoints.value[index] = updated;
      }
    } else if (msg.type === 'ENDPOINT_CREATED') {
      const created = msg.data as EndpointConfig;
      const exists = endpoints.value.some((e) => e.id === created.id);
      if (!exists) {
        endpoints.value.push(created);
      }
    } else if (msg.type === 'EVENTS_CLEARED') {
      const { endpointId } = msg.data;
      if (endpointId === 'all' || endpointId === activeEndpointId.value) {
        events.value = [];
        selectedEventId.value = null;
      }
    }
  }

  watch(activeEndpointId, () => {
    fetchEvents();
    connectSse();
  });

  return {
    isConnected,
    events,
    filteredEvents,
    endpoints,
    currentEndpoint,
    activeEndpointId,
    selectedEventId,
    selectedEvent,
    searchQuery,
    selectedMethod,
    selectedStatus,
    isReplaying,
    selectEvent,
    fetchEndpoints,
    fetchEvents,
    createEndpoint,
    updateEndpointConfig,
    replayEvent,
    clearAllEvents,
    connectSse
  };
}
