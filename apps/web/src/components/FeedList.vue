<script setup lang="ts">
import {
  Search,
  Trash2,
  Inbox
} from 'lucide-vue-next';
import type { HttpMethod, WebhookEvent, WebhookStatus } from '@audithook/shared-types';

defineProps<{
  events: WebhookEvent[];
  selectedEventId: string | null;
  searchQuery: string;
  selectedMethod: string;
  selectedStatus: string;
}>();

const emit = defineEmits<{
  (e: 'select-event', id: string): void;
  (e: 'update:searchQuery', val: string): void;
  (e: 'update:selectedMethod', val: string): void;
  (e: 'update:selectedStatus', val: string): void;
  (e: 'clear-events'): void;
}>();

const methods = ['ALL', 'POST', 'GET', 'PUT', 'DELETE'];

function getMethodStyle(method: HttpMethod) {
  switch (method) {
    case 'POST':
      return 'text-emerald-400 font-bold';
    case 'GET':
      return 'text-sky-400 font-bold';
    case 'PUT':
    case 'PATCH':
      return 'text-amber-400 font-bold';
    case 'DELETE':
      return 'text-rose-400 font-bold';
    default:
      return 'text-slate-400 font-bold';
  }
}

function getDeliveryStatusTag(status: WebhookStatus, deliveryAttempts?: any[]) {
  const latestAttempt = deliveryAttempts?.[0];
  if (status === 'FORWARDED' && latestAttempt?.statusCode) {
    return {
      text: `${latestAttempt.statusCode}`,
      class: 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60'
    };
  }
  if (status === 'FAILED') {
    return {
      text: latestAttempt?.statusCode ? `${latestAttempt.statusCode}` : 'ERR',
      class: 'text-rose-400 bg-rose-950/60 border border-rose-800/60'
    };
  }
  return {
    text: 'PEND',
    class: 'text-amber-400 bg-amber-950/50 border border-amber-800/50'
  };
}

function formatExactTime(dateString: string): string {
  const d = new Date(dateString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
</script>

<template>
  <aside class="w-[380px] h-[calc(100vh-3.5rem)] flex flex-col border-r border-slate-800/80 bg-slate-950 select-none shrink-0 font-mono text-xs">
    <div class="p-2.5 border-b border-slate-800/80 space-y-2 bg-slate-900/40">
      <div class="relative">
        <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
        <input
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Filter requests..."
          class="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
        />
      </div>

      <div class="flex items-center justify-between pt-0.5">
        <div class="flex items-center space-x-1">
          <button
            v-for="m in methods"
            :key="m"
            @click="emit('update:selectedMethod', m)"
            :class="[
              'px-1.5 py-0.5 rounded text-[10px] transition',
              selectedMethod === m
                ? 'bg-slate-800 text-slate-200 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            ]"
          >
            {{ m }}
          </button>
        </div>

        <button
          @click="emit('clear-events')"
          class="p-1 rounded text-slate-500 hover:text-rose-400 transition"
          title="Clear log"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto divide-y divide-slate-900">
      <div
        v-if="events.length === 0"
        class="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-sans"
      >
        <Inbox class="w-8 h-8 mb-2 stroke-[1.2] text-slate-600" />
        <p class="text-xs font-medium text-slate-400">Waiting for requests</p>
        <p class="text-[11px] text-slate-600 mt-1">
          Incoming webhooks on your ingest URL will appear here in real-time.
        </p>
      </div>

      <div
        v-for="ev in events"
        :key="ev.id"
        @click="emit('select-event', ev.id)"
        :class="[
          'px-3 py-2 transition cursor-pointer flex flex-col space-y-1 border-l-2',
          selectedEventId === ev.id
            ? 'bg-slate-900 border-l-emerald-500'
            : 'hover:bg-slate-900/50 border-l-transparent'
        ]"
      >
        <div class="flex items-center justify-between leading-none">
          <div class="flex items-center space-x-2">
            <span :class="['text-[11px] tracking-tight', getMethodStyle(ev.method)]">
              {{ ev.method }}
            </span>
            <span
              v-if="ev.sourceOrigin"
              class="text-[10px] text-slate-400 px-1 py-0.2 rounded bg-slate-900 border border-slate-800"
            >
              {{ ev.sourceOrigin }}
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <span :class="['text-[10px] px-1.5 py-0.5 rounded font-mono', getDeliveryStatusTag(ev.status, ev.deliveryAttempts).class]">
              {{ getDeliveryStatusTag(ev.status, ev.deliveryAttempts).text }}
            </span>
            <span class="text-[10px] text-slate-500">
              {{ formatSize(ev.contentLength) }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-0.5">
          <p class="text-[11px] text-slate-300 truncate max-w-[220px]">
            {{ ev.path }}
          </p>
          <span class="text-[10px] text-slate-500">
            {{ formatExactTime(ev.receivedAt) }}
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
