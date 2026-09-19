<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Copy,
  Check,
  Plus,
  Sun,
  Moon,
  BookOpen,
  LayoutDashboard
} from 'lucide-vue-next';
import type { EndpointConfig } from '@audithook/shared-types';
import AuditHookLogo from './AuditHookLogo.vue';
import { useTheme } from '../composables/useTheme';

const props = defineProps<{
  endpoints: EndpointConfig[];
  activeEndpointId: string;
  currentEndpoint: EndpointConfig | null;
  isConnected: boolean;
  totalEventsCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:activeEndpointId', id: string): void;
  (e: 'open-create-modal'): void;
}>();

const route = useRoute();
const { isDark, toggleTheme } = useTheme();
const copied = ref(false);

const isDocsPage = computed(() => {
  return route.path === '/docs';
});

const ingestUrl = computed(() => {
  const origin = window.location.origin;
  const endpoint = props.activeEndpointId === 'all' ? 'default' : props.activeEndpointId;
  return `${origin}/ingest/${endpoint}`;
});

function copyIngestUrl() {
  navigator.clipboard.writeText(ingestUrl.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}
</script>

<template>
  <header class="h-14 border-b border-slate-600/80 dark:border-slate-600/80 light:border-slate-300 bg-zinc-950 dark:bg-zinc-950 light:bg-white px-4 flex items-center justify-between z-20 select-none">
    <div class="flex items-center space-x-5">
      <router-link to="/" class="flex items-center space-x-2.5 hover:opacity-90 transition">
        <AuditHookLogo :size="24" />
        <span class="text-sm font-semibold tracking-tight text-white dark:text-white light:text-slate-900 font-mono">AuditHook</span>
      </router-link>

      <div class="h-4 w-[1px] bg-slate-800 dark:bg-slate-800 light:bg-slate-200"></div>

      <div v-if="!isDocsPage" class="flex items-center space-x-2">
        <select
          :value="activeEndpointId"
          @change="emit('update:activeEndpointId', ($event.target as HTMLSelectElement).value)"
          class="bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 hover:border-slate-700 dark:hover:border-slate-700 light:hover:border-slate-400 text-slate-300 dark:text-slate-300 light:text-slate-800 text-xs rounded px-2 py-1 focus:outline-none focus:border-emerald-500 transition font-mono"
        >
          <option value="all">All Endpoints (*)</option>
          <option v-for="ep in endpoints" :key="ep.id" :value="ep.id">
            {{ ep.name }} ({{ ep.id }})
          </option>
        </select>
        <button
          @click="emit('open-create-modal')"
          class="p-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition"
          title="Create endpoint"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
      </div>

      <div v-else class="text-xs font-mono text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center space-x-2">
        <span class="px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300">
          Documentation & Setup Guide
        </span>
      </div>
    </div>

    <div class="flex items-center space-x-3">
      <div v-if="!isDocsPage" class="flex items-center bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded px-2.5 py-1 text-xs">
        <span class="text-slate-500 dark:text-slate-500 light:text-slate-500 mr-2 font-mono">Ingest</span>
        <code class="text-emerald-400 dark:text-emerald-400 light:text-emerald-600 font-mono text-xs max-w-sm truncate">{{ ingestUrl }}</code>
        <button
          @click="copyIngestUrl"
          class="ml-2 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition flex items-center"
          title="Copy Ingest URL"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-400 light:text-emerald-600" />
          <Copy v-else class="w-3.5 h-3.5" />
        </button>
      </div>

      <div v-if="!isDocsPage" class="flex items-center space-x-2 px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-xs">
        <span class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-emerald-500' : 'bg-rose-500'"></span>
        <span class="text-[11px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-600">{{ isConnected ? 'stream active' : 'reconnecting' }}</span>
      </div>

      <div v-if="!isDocsPage" class="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 font-mono pl-1">
        {{ totalEventsCount }} requests
      </div>

      <router-link
        v-if="!isDocsPage"
        to="/docs"
        class="px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition flex items-center space-x-1.5 text-xs font-mono"
        title="View Documentation"
      >
        <BookOpen class="w-3.5 h-3.5 text-sky-400 dark:text-sky-400 light:text-sky-600" />
        <span>Docs</span>
      </router-link>

      <router-link
        v-else
        to="/"
        class="px-2.5 py-1 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition flex items-center space-x-1.5 text-xs font-mono"
        title="Back to Workbench"
      >
        <LayoutDashboard class="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-400 light:text-emerald-600" />
        <span>Workbench</span>
      </router-link>

      <button
        @click="toggleTheme"
        class="p-1.5 rounded bg-slate-900 dark:bg-slate-900 light:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <Sun v-if="isDark" class="w-3.5 h-3.5 text-amber-400" />
        <Moon v-else class="w-3.5 h-3.5 text-indigo-500" />
      </button>
    </div>
  </header>
</template>
