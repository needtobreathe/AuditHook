<script setup lang="ts">
import { ref, computed } from 'vue';
import { Play, RotateCw, Clock } from 'lucide-vue-next';
import type { DeliveryAttempt, EndpointConfig, WebhookEvent } from '@audithook/shared-types';

const props = defineProps<{
  event: WebhookEvent | null;
  currentEndpoint: EndpointConfig | null;
  isReplaying: boolean;
}>();

const emit = defineEmits<{
  (e: 'replay', eventId: string, customUrl?: string): void;
  (e: 'update-target', url: string): void;
  (e: 'toggle-auto-forward', val: boolean): void;
}>();

const targetInput = ref('');
const isEditingTarget = ref(false);

const latestAttempt = computed<DeliveryAttempt | null>(() => {
  if (!props.event?.deliveryAttempts?.length) return null;
  return props.event.deliveryAttempts[0];
});

const previousAttempts = computed<DeliveryAttempt[]>(() => {
  if (!props.event?.deliveryAttempts || props.event.deliveryAttempts.length <= 1) return [];
  return props.event.deliveryAttempts.slice(1);
});

function handleReplay() {
  if (!props.event) return;
  emit('replay', props.event.id);
}

function startEditing() {
  targetInput.value = props.currentEndpoint?.targetUrl || 'http://localhost:3000/webhook';
  isEditingTarget.value = true;
}

function saveTarget() {
  if (targetInput.value.trim()) {
    emit('update-target', targetInput.value.trim());
  }
  isEditingTarget.value = false;
}

function isSuccess(statusCode?: number) {
  return statusCode !== undefined && statusCode >= 200 && statusCode < 400;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}
</script>

<template>
  <aside class="w-[380px] h-[calc(100vh-3.5rem)] flex flex-col border-l border-slate-800/80 bg-slate-950 select-none shrink-0 font-mono text-xs overflow-hidden">
    <div class="p-3 border-b border-slate-800/80 bg-slate-900/40 space-y-2.5 shrink-0">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Dispatch Target</span>
        <button
          v-if="currentEndpoint"
          @click="emit('toggle-auto-forward', !currentEndpoint.autoForward)"
          :class="[
            'px-2 py-0.5 rounded text-[10px] transition border',
            currentEndpoint.autoForward
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60'
              : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
          ]"
        >
          auto-forward {{ currentEndpoint.autoForward ? 'on' : 'off' }}
        </button>
      </div>

      <div>
        <div v-if="!isEditingTarget" class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5">
          <code class="text-slate-300 text-[11px] truncate select-text">
            {{ currentEndpoint?.targetUrl || 'http://localhost:3000/webhook' }}
          </code>
          <button @click="startEditing" class="text-[10px] text-slate-500 hover:text-slate-200 ml-2 shrink-0">
            edit
          </button>
        </div>
        <div v-else class="flex items-center space-x-1.5">
          <input
            v-model="targetInput"
            @keydown.enter="saveTarget"
            @keydown.esc="isEditingTarget = false"
            class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
            autofocus
          />
          <button @click="saveTarget" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs">
            Save
          </button>
        </div>
      </div>

      <button
        @click="handleReplay"
        :disabled="!event || isReplaying"
        class="w-full py-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition disabled:opacity-40"
      >
        <RotateCw v-if="isReplaying" class="w-3.5 h-3.5 animate-spin" />
        <Play v-else class="w-3 h-3 fill-current text-emerald-400" />
        <span>{{ isReplaying ? 'Sending...' : 'Replay to Localhost' }}</span>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="!latestAttempt" class="p-6 text-center text-slate-500 font-sans">
        <Clock class="w-7 h-7 text-slate-700 mx-auto mb-2 stroke-[1.2]" />
        <p class="text-xs font-medium text-slate-400">Not yet dispatched</p>
        <p class="text-[11px] text-slate-600 mt-1">
          Replay this event to forward it to your local server.
        </p>
      </div>

      <template v-else>
        <div class="p-3 border-b border-slate-800/80 space-y-2">
          <div class="flex items-center justify-between">
            <span
              class="text-sm font-bold font-mono"
              :class="isSuccess(latestAttempt.statusCode) ? 'text-emerald-400' : 'text-rose-400'"
            >
              {{ latestAttempt.statusCode ? `${latestAttempt.statusCode} ${latestAttempt.statusText || ''}` : 'Connection Failed' }}
            </span>
            <div class="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>{{ latestAttempt.responseTimeMs }}ms</span>
              <span class="text-slate-600">·</span>
              <span>{{ formatTime(latestAttempt.timestamp) }}</span>
            </div>
          </div>

          <div v-if="latestAttempt.error" class="text-[11px] text-rose-400 bg-rose-950/20 rounded border border-rose-900/40 px-2 py-1.5">
            {{ latestAttempt.error }}
          </div>
        </div>

        <div v-if="latestAttempt.responseBody" class="border-b border-slate-800/80">
          <div class="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase">Response Body</div>
          <pre class="px-3 pb-3 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap select-text max-h-52">{{ latestAttempt.responseBody }}</pre>
        </div>

        <div v-if="latestAttempt.responseHeaders && Object.keys(latestAttempt.responseHeaders).length > 0" class="border-b border-slate-800/80">
          <div class="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase">Response Headers</div>
          <div class="divide-y divide-slate-800/60 max-h-32 overflow-y-auto">
            <div
              v-for="[rk, rv] in Object.entries(latestAttempt.responseHeaders)"
              :key="rk"
              class="px-3 py-0.5 flex justify-between text-[10px]"
            >
              <span class="text-slate-500 truncate max-w-[120px]">{{ rk }}</span>
              <span class="text-slate-300 truncate max-w-[180px] select-text">{{ rv }}</span>
            </div>
          </div>
        </div>

        <div class="border-b border-slate-800/80">
          <div class="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Attempt History</span>
            <span class="text-slate-600">{{ event?.deliveryAttempts.length || 0 }} total</span>
          </div>

          <div class="divide-y divide-slate-800/50">
            <div
              class="px-3 py-2 flex items-center justify-between"
            >
              <div class="flex items-center space-x-2">
                <span
                  class="font-bold text-[11px]"
                  :class="isSuccess(latestAttempt.statusCode) ? 'text-emerald-400' : 'text-rose-400'"
                >
                  {{ latestAttempt.statusCode || 'ERR' }}
                </span>
                <span class="text-[10px] text-slate-500 px-1 bg-slate-900 rounded border border-slate-800">latest</span>
              </div>
              <div class="flex items-center space-x-2 text-[10px] text-slate-500">
                <span>{{ latestAttempt.responseTimeMs }}ms</span>
                <span>{{ formatTime(latestAttempt.timestamp) }}</span>
              </div>
            </div>

            <div
              v-for="att in previousAttempts"
              :key="att.id"
              class="px-3 py-2 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity cursor-default"
            >
              <div class="flex items-center space-x-2">
                <span
                  class="font-bold text-[11px]"
                  :class="isSuccess(att.statusCode) ? 'text-emerald-400' : 'text-rose-400'"
                >
                  {{ att.statusCode || 'ERR' }}
                </span>
                <span v-if="att.error" class="text-[10px] text-rose-400 truncate max-w-[140px]">{{ att.error }}</span>
              </div>
              <div class="flex items-center space-x-2 text-[10px] text-slate-500">
                <span>{{ att.responseTimeMs }}ms</span>
                <span>{{ formatTime(att.timestamp) }}</span>
              </div>
            </div>

            <div
              v-if="!event?.deliveryAttempts.length"
              class="px-3 py-3 text-[11px] text-slate-600 text-center"
            >
              No previous attempts
            </div>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>
