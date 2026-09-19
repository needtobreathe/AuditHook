<script setup lang="ts">
import { ref, onMounted } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import FeedList from './components/FeedList.vue';
import Inspector from './components/Inspector.vue';
import DeliveryTerminal from './components/DeliveryTerminal.vue';
import NewEndpointModal from './components/NewEndpointModal.vue';
import { useTelemetry } from './composables/useTelemetry';

const isCreateModalOpen = ref(false);

const {
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
} = useTelemetry();

onMounted(async () => {
  await fetchEndpoints();
  await fetchEvents();
  connectSse();
});

async function handleCreateEndpoint(data: { id?: string; name: string; targetUrl: string; autoForward: boolean }) {
  await createEndpoint(data);
  isCreateModalOpen.value = false;
}

function handleUpdateTargetUrl(url: string) {
  if (currentEndpoint.value) {
    updateEndpointConfig(currentEndpoint.value.id, { targetUrl: url });
  }
}

function handleToggleAutoForward(val: boolean) {
  if (currentEndpoint.value) {
    updateEndpointConfig(currentEndpoint.value.id, { autoForward: val });
  }
}

function handleReplay(eventId: string, customUrl?: string) {
  replayEvent(eventId, customUrl);
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
    <HeaderBar
      :endpoints="endpoints"
      :active-endpoint-id="activeEndpointId"
      :current-endpoint="currentEndpoint"
      :is-connected="isConnected"
      :total-events-count="events.length"
      @update:active-endpoint-id="activeEndpointId = $event"
      @open-create-modal="isCreateModalOpen = true"
    />

    <div class="flex-1 flex overflow-hidden">
      <FeedList
        :events="filteredEvents"
        :selected-event-id="selectedEventId"
        :search-query="searchQuery"
        :selected-method="selectedMethod"
        :selected-status="selectedStatus"
        @select-event="selectEvent"
        @update:search-query="searchQuery = $event"
        @update:selected-method="selectedMethod = $event"
        @update:selected-status="selectedStatus = $event"
        @clear-events="clearAllEvents"
      />

      <Inspector
        :event="selectedEvent"
      />

      <DeliveryTerminal
        :event="selectedEvent"
        :current-endpoint="currentEndpoint"
        :is-replaying="isReplaying"
        @replay="handleReplay"
        @update-target="handleUpdateTargetUrl"
        @toggle-auto-forward="handleToggleAutoForward"
      />
    </div>

    <NewEndpointModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateEndpoint"
    />
  </div>
</template>
