<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Search,
  Trash2,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-vue-next';
import type { HttpMethod, WebhookEvent, WebhookStatus } from '@audithook/shared-types';

const props = defineProps<{
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
  (e: 'export-all'): void;
}>();

const methods = ['ALL', 'POST', 'GET', 'PUT', 'DELETE'];
const currentPage = ref(1);
const pageSize = ref(25);

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.events.length / pageSize.value));
});

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return props.events.slice(start, start + pageSize.value);
});

watch([() => props.events.length, () => props.searchQuery, () => props.selectedMethod, () => props.selectedStatus], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = 1;
  }
});

function goToPrevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function goToNextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function getMethodStyle(method: HttpMethod) {
  switch (method) {
    case 'POST':
      return 'text-emerald-500 dark:text-emerald-400 font-bold';
    case 'GET':
      return 'text-sky-500 dark:text-sky-400 font-bold';
    case 'PUT':
    case 'PATCH':
      return 'text-amber-500 dark:text-amber-400 font-bold';
    case 'DELETE':
      return 'text-rose-500 dark:text-rose-400 font-bold';
    default:
      return 'text-slate-500 dark:text-slate-400 font-bold';
  }
}

function getDeliveryStatusTag(status: WebhookStatus, deliveryAttempts?: any[]) {
  const latestAttempt = deliveryAttempts?.[0];
  if (status === 'FORWARDED' && latestAttempt?.statusCode) {
    return {
      text: `${latestAttempt.statusCode}`,
      class: 'text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60'
    };
  }
  if (status === 'FAILED') {
    return {
      text: latestAttempt?.statusCode ? `${latestAttempt.statusCode}` : 'ERR',
      class: 'text-rose-500 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/60'
    };
  }
  return {
    text: 'PEND',
    class: 'text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800/50'
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
  <aside class="w-[380px] h-[calc(100vh-3.5rem)] flex flex-col border-r-2 border-slate-600/80 dark:border-slate-600/80 bg-zinc-950 dark:bg-zinc-950 light:bg-white select-none shrink-0 font-mono text-xs">
    <div class="p-2.5 border-b border-slate-600/80 dark:border-slate-600/80 space-y-2 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-slate-100">
      <div class="relative">
        <Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
        <input
          :value="searchQuery"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Filter requests..."
          class="w-full bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-slate-700 dark:focus:border-slate-700 light:focus:border-slate-400"
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
                ? 'bg-slate-800 dark:bg-slate-800 light:bg-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-900 font-semibold'
                : 'text-slate-500 dark:text-slate-500 light:text-slate-600 hover:text-slate-300 dark:hover:text-slate-300 light:hover:text-slate-900'
            ]"
          >
            {{ m }}
          </button>
        </div>

        <div class="flex items-center space-x-1">
          <button
            @click="emit('export-all')"
            class="p-1 rounded text-slate-500 dark:text-slate-500 light:text-slate-600 hover:text-emerald-400 dark:hover:text-emerald-400 light:hover:text-emerald-600 transition"
            title="Export all events as JSON"
          >
            <Download class="w-3.5 h-3.5" />
          </button>
          <button
            @click="emit('clear-events')"
            class="p-1 rounded text-slate-500 dark:text-slate-500 light:text-slate-600 hover:text-rose-400 dark:hover:text-rose-400 light:hover:text-rose-600 transition"
            title="Clear log"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto divide-y divide-slate-900 dark:divide-slate-900 light:divide-slate-200">
      <div
        v-if="events.length === 0"
        class="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500 font-sans"
      >
        <Inbox class="w-8 h-8 mb-2 stroke-[1.2] text-slate-600 dark:text-slate-600 light:text-slate-400" />
        <p class="text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600">Waiting for requests</p>
        <p class="text-[11px] text-slate-600 dark:text-slate-600 light:text-slate-400 mt-1">
          Incoming webhooks on your ingest URL will appear here in real-time.
        </p>
      </div>

      <div
        v-for="ev in paginatedEvents"
        :key="ev.id"
        @click="emit('select-event', ev.id)"
        :class="[
          'px-3 py-2 transition cursor-pointer flex flex-col space-y-1 border-l-2',
          selectedEventId === ev.id
            ? 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border-l-emerald-500'
            : 'hover:bg-slate-900/50 dark:hover:bg-slate-900/50 light:hover:bg-slate-50 border-l-transparent'
        ]"
      >
        <div class="flex items-center justify-between leading-none">
          <div class="flex items-center space-x-2">
            <span :class="['text-[11px] tracking-tight', getMethodStyle(ev.method)]">
              {{ ev.method }}
            </span>
            <span
              v-if="ev.sourceOrigin"
              class="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 px-1 py-0.2 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300"
            >
              {{ ev.sourceOrigin }}
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <span :class="['text-[10px] px-1.5 py-0.5 rounded font-mono', getDeliveryStatusTag(ev.status, ev.deliveryAttempts).class]">
              {{ getDeliveryStatusTag(ev.status, ev.deliveryAttempts).text }}
            </span>
            <span class="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600">
              {{ formatSize(ev.contentLength) }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-0.5">
          <p class="text-[11px] text-slate-300 dark:text-slate-300 light:text-slate-700 truncate max-w-[220px]">
            {{ ev.path }}
          </p>
          <span class="text-[10px] text-slate-500 dark:text-slate-500 light:text-slate-600">
            {{ formatExactTime(ev.receivedAt) }}
          </span>
        </div>
      </div>
    </div>

    <div class="h-10 px-3 border-t border-slate-600/80 dark:border-slate-600/80 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-slate-100 flex items-center justify-between shrink-0 text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600">
      <div class="flex items-center space-x-1.5">
        <span>{{ events.length }} total</span>
        <span class="text-slate-600 dark:text-slate-600 light:text-slate-300">|</span>
        <select
          v-model.number="pageSize"
          class="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-300 dark:text-slate-300 light:text-slate-800 focus:outline-none"
        >
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
          <option :value="100">100 / page</option>
        </select>
      </div>

      <div class="flex items-center space-x-2">
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <div class="flex items-center space-x-0.5">
          <button
            @click="goToPrevPage"
            :disabled="currentPage <= 1"
            class="p-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 dark:border-slate-800 light:border-slate-300 transition"
            title="Previous page"
          >
            <ChevronLeft class="w-3 h-3" />
          </button>
          <button
            @click="goToNextPage"
            :disabled="currentPage >= totalPages"
            class="p-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 dark:border-slate-800 light:border-slate-300 transition"
            title="Next page"
          >
            <ChevronRight class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>
