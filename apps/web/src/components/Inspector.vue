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

const showHeaders = ref(true);
const curlCopied = ref(false);
const headerSearch = ref('');

function getMethodBadgeClass(method: HttpMethod) {
  switch (method) {
    case 'POST':
      return 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60';
    case 'GET':
      return 'text-sky-400 bg-sky-950/60 border border-sky-800/60';
    case 'PUT':
    case 'PATCH':
      return 'text-amber-400 bg-amber-950/60 border border-amber-800/60';
    case 'DELETE':
      return 'text-rose-400 bg-rose-950/60 border border-rose-800/60';
    default:
      return 'text-slate-300 bg-slate-800 border border-slate-700';
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
  a.download = `webhook-${props.event.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <main class="flex-1 h-[calc(100vh-3.5rem)] flex flex-col bg-slate-950 overflow-hidden select-none font-mono text-xs">
    <div v-if="!event" class="flex-1 flex flex-col items-center justify-center text-slate-500 font-sans">
      <Database class="w-10 h-10 stroke-[1.2] text-slate-700 mb-2" />
      <p class="text-xs font-medium text-slate-400">Select a request to inspect</p>
    </div>

    <template v-else>
      <div class="p-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <span :class="['px-1.5 py-0.5 rounded text-xs font-bold', getMethodBadgeClass(event.method)]">
            {{ event.method }}
          </span>
          <span class="text-xs text-slate-200 font-semibold select-text">
            {{ event.path }}
          </span>
          <span
            v-if="event.sourceOrigin"
            class="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800"
          >
            {{ event.sourceOrigin }}
          </span>
        </div>

        <div class="flex items-center space-x-1.5">
          <button
            @click="copyCurl"
            class="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center space-x-1 text-xs"
          >
            <Check v-if="curlCopied" class="w-3 h-3 text-emerald-400" />
            <Terminal v-else class="w-3 h-3 text-slate-400" />
            <span>{{ curlCopied ? 'cURL Copied' : 'cURL' }}</span>
          </button>

          <button
            @click="exportJson"
            class="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
            title="Download JSON"
          >
            <Download class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div class="px-3 py-1.5 bg-slate-900/20 border-b border-slate-800/80 flex items-center space-x-6 text-[11px] text-slate-500">
        <div>
          <span>ID:</span>
          <span class="ml-1 text-slate-400 select-text">{{ event.id }}</span>
        </div>
        <div>
          <span>IP:</span>
          <span class="ml-1 text-slate-400 select-text">{{ event.ip }}</span>
        </div>
        <div>
          <span>Time:</span>
          <span class="ml-1 text-slate-400 select-text">{{ new Date(event.receivedAt).toISOString() }}</span>
        </div>
      </div>

      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="border-b border-slate-800/80 bg-slate-900/30">
          <div
            @click="showHeaders = !showHeaders"
            class="px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-900/50"
          >
            <div class="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400 uppercase">
              <ChevronDown v-if="showHeaders" class="w-3 h-3 text-slate-500" />
              <ChevronRight v-else class="w-3 h-3 text-slate-500" />
              <span>Headers ({{ Object.keys(event.headers || {}).length }})</span>
            </div>

            <div v-if="showHeaders" @click.stop class="flex items-center">
              <input
                v-model="headerSearch"
                type="text"
                placeholder="Filter headers..."
                class="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none w-48"
              />
            </div>
          </div>

          <div v-if="showHeaders" class="max-h-48 overflow-y-auto border-t border-slate-800/80 divide-y divide-slate-850 bg-slate-950/60">
            <div
              v-for="[key, val] in headerEntries"
              :key="key"
              class="px-3 py-1 flex items-center justify-between text-[11px] hover:bg-slate-900/40"
            >
              <span class="text-indigo-400 font-medium w-1/3 truncate select-text">{{ key }}</span>
              <span class="text-slate-300 w-2/3 truncate select-text pl-4">{{ val }}</span>
            </div>
          </div>
        </div>

        <div v-if="event.query && Object.keys(event.query).length > 0" class="border-b border-slate-800/80 bg-slate-900/20 px-3 py-1.5">
          <div class="text-[11px] font-semibold text-slate-400 uppercase mb-1">Query Parameters</div>
          <div class="space-y-0.5">
            <div v-for="[qk, qv] in Object.entries(event.query)" :key="qk" class="flex text-[11px]">
              <span class="text-sky-400 font-medium w-1/4 select-text">{{ qk }}</span>
              <span class="text-slate-300 w-3/4 select-text">{{ qv }}</span>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col p-2">
          <div class="text-[11px] font-semibold text-slate-400 uppercase px-1 py-1 flex items-center justify-between">
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
