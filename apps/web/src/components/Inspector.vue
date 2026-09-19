<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Terminal,
  Download,
  Check,
  ChevronDown,
  ChevronRight,
  Database
} from 'lucide-vue-next';
import type { HttpMethod, WebhookEvent } from '@audithook/shared-types';
import JsonView from './JsonView.vue';

const props = defineProps<{
  event: WebhookEvent | null;
}>();

const curlCopied = ref(false);
const showHeaders = ref(true);
const headerSearch = ref('');

function getMethodBadgeClass(method: HttpMethod) {
  switch (method) {
    case 'POST':
      return 'text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60';
    case 'GET':
      return 'text-sky-500 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800/60';
    case 'PUT':
    case 'PATCH':
      return 'text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60';
    case 'DELETE':
      return 'text-rose-500 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800/60';
    default:
      return 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800';
  }
}

const headerEntries = computed(() => {
  if (!props.event?.headers) return [];
  const entries = Object.entries(props.event.headers);
  if (!headerSearch.value.trim()) return entries;
  const q = headerSearch.value.toLowerCase().trim();
  return entries.filter(([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q));
});

function generateCurl(): string {
  if (!props.event) return '';
  const parts = ['curl', `-X ${props.event.method}`];
  const url = `${window.location.origin}${props.event.path}`;
  parts.push(`"${url}"`);

  for (const [k, v] of Object.entries(props.event.headers || {})) {
    if (!['host', 'content-length'].includes(k.toLowerCase())) {
      parts.push(`-H "${k}: ${v}"`);
    }
  }

  if (['POST', 'PUT', 'PATCH'].includes(props.event.method) && props.event.payload) {
    const raw = typeof props.event.payload === 'string'
      ? props.event.payload
      : JSON.stringify(props.event.payload);
    parts.push(`-d '${raw.replace(/'/g, "\\'")}'`);
  }

  return parts.join(' \\\n  ');
}

function copyCurl() {
  navigator.clipboard.writeText(generateCurl());
  curlCopied.value = true;
  setTimeout(() => {
    curlCopied.value = false;
  }, 2000);
}

function exportJson() {
  if (!props.event) return;
  const blob = new Blob([JSON.stringify(props.event, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const originTag = props.event.sourceOrigin ? `${props.event.sourceOrigin.toLowerCase()}-` : '';
  a.download = `audithook-${originTag}${props.event.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <main class="flex-1 h-[calc(100vh-3.5rem)] flex flex-col bg-zinc-950 dark:bg-zinc-950 light:bg-white overflow-hidden select-none font-mono text-xs">
    <div v-if="!event" class="flex-1 flex flex-col items-center justify-center text-slate-500 font-sans">
      <Database class="w-10 h-10 stroke-[1.2] text-slate-600 dark:text-slate-700 light:text-slate-300 mb-2" />
      <p class="text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600">Select a request to inspect</p>
    </div>

    <template v-else>
      <div class="p-3 border-b border-slate-600/80 dark:border-slate-600/80 light:border-slate-300 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-slate-100 flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <span :class="['px-1.5 py-0.5 rounded text-xs font-bold', getMethodBadgeClass(event.method)]">
            {{ event.method }}
          </span>
          <span class="text-xs text-slate-200 dark:text-slate-200 light:text-slate-900 font-semibold select-text">
            {{ event.path }}
          </span>
          <span
            v-if="event.sourceOrigin"
            class="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300"
          >
            {{ event.sourceOrigin }}
          </span>
        </div>

        <div class="flex items-center space-x-1.5">
          <button
            @click="copyCurl"
            class="px-2 py-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition flex items-center space-x-1 text-xs"
          >
            <Check v-if="curlCopied" class="w-3 h-3 text-emerald-400" />
            <Terminal v-else class="w-3 h-3 text-slate-400 dark:text-slate-400 light:text-slate-600" />
            <span>{{ curlCopied ? 'cURL Copied' : 'cURL' }}</span>
          </button>

          <button
            @click="exportJson"
            class="px-2 py-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition flex items-center space-x-1 text-xs"
            title="Download JSON"
          >
            <Download class="w-3 h-3 text-emerald-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div class="px-3 py-1.5 bg-slate-900/20 dark:bg-slate-900/20 light:bg-slate-50 border-b border-slate-600/80 dark:border-slate-600/80 light:border-slate-300 flex items-center space-x-6 text-[11px] text-slate-500 dark:text-slate-500 light:text-slate-600">
        <div>
          <span>ID:</span>
          <span class="ml-1 text-slate-400 dark:text-slate-400 light:text-slate-700 select-text">{{ event.id }}</span>
        </div>
        <div>
          <span>IP:</span>
          <span class="ml-1 text-slate-400 dark:text-slate-400 light:text-slate-700 select-text">{{ event.ip }}</span>
        </div>
        <div>
          <span>Time:</span>
          <span class="ml-1 text-slate-400 dark:text-slate-400 light:text-slate-700 select-text">{{ new Date(event.receivedAt).toISOString() }}</span>
        </div>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="border-b border-slate-600/80 dark:border-slate-600/80 light:border-slate-300 bg-slate-900/30 dark:bg-slate-900/30 light:bg-slate-100">
          <div
            @click="showHeaders = !showHeaders"
            class="px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/50 dark:hover:bg-slate-900/50 light:hover:bg-slate-200"
          >
            <div class="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">
              <ChevronDown v-if="showHeaders" class="w-3 h-3 text-slate-500" />
              <ChevronRight v-else class="w-3 h-3 text-slate-500" />
              <span>Headers ({{ Object.keys(event.headers || {}).length }})</span>
            </div>

            <div v-if="showHeaders" @click.stop class="flex items-center">
              <input
                v-model="headerSearch"
                type="text"
                placeholder="Filter headers..."
                class="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded px-2 py-0.5 text-[10px] text-slate-300 dark:text-slate-300 light:text-slate-900 placeholder-slate-500 focus:outline-none w-48"
              />
            </div>
          </div>

          <div v-if="showHeaders" class="max-h-48 overflow-y-auto border-t border-slate-600/70 dark:border-slate-600/70 light:border-slate-300 divide-y divide-slate-850 dark:divide-slate-850 light:divide-slate-200 bg-zinc-950/60 dark:bg-zinc-950/60 light:bg-white">
            <div
              v-for="[key, val] in headerEntries"
              :key="key"
              class="px-3 py-1 flex items-center justify-between text-[11px] hover:bg-zinc-900/60 dark:hover:bg-zinc-900/60 light:hover:bg-slate-50"
            >
              <span class="text-indigo-400 dark:text-indigo-400 light:text-indigo-600 font-medium w-1/3 truncate select-text">{{ key }}</span>
              <span class="text-slate-300 dark:text-slate-300 light:text-slate-700 w-2/3 truncate select-text pl-4">{{ val }}</span>
            </div>
          </div>
        </div>

        <div v-if="event.query && Object.keys(event.query).length > 0" class="border-b border-slate-600/80 dark:border-slate-600/80 light:border-slate-300 bg-slate-900/20 dark:bg-slate-900/20 light:bg-slate-50 px-3 py-1.5">
          <div class="text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase mb-1">Query Parameters</div>
          <div class="space-y-0.5">
            <div v-for="[qk, qv] in Object.entries(event.query)" :key="qk" class="flex text-[11px]">
              <span class="text-sky-400 dark:text-sky-400 light:text-sky-600 font-medium w-1/4 select-text">{{ qk }}</span>
              <span class="text-slate-300 dark:text-slate-300 light:text-slate-700 w-3/4 select-text">{{ qv }}</span>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col p-2">
          <div class="text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase px-1 py-1 flex items-center justify-between">
            <span>Payload</span>
          </div>
          <div class="flex-1 overflow-hidden">
            <JsonView :data="event.payload" />
          </div>
        </div>
      </div>
    </template>
  </main>
</template>
