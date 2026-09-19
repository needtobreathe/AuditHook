<script setup lang="ts">
import { ref } from 'vue';
import { X, Radio } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'create', data: { id?: string; name: string; targetUrl: string; autoForward: boolean }): void;
}>();

const name = ref('');
const id = ref('');
const targetUrl = ref('http://localhost:3000/webhook');
const autoForward = ref(false);
const error = ref('');

function handleSubmit() {
  if (!name.value.trim()) {
    error.value = 'Please enter an endpoint name';
    return;
  }

  emit('create', {
    name: name.value.trim(),
    id: id.value.trim() ? id.value.trim() : undefined,
    targetUrl: targetUrl.value.trim() || 'http://localhost:3000/webhook',
    autoForward: autoForward.value
  });

  name.value = '';
  id.value = '';
  targetUrl.value = 'http://localhost:3000/webhook';
  autoForward.value = false;
  error.value = '';
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-slate-700 dark:border-slate-800 light:border-slate-300 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-700 dark:border-slate-800 light:border-slate-200 pb-3">
        <h3 class="text-base font-semibold text-white dark:text-white light:text-slate-900 flex items-center space-x-2">
          <Radio class="w-4 h-4 text-indigo-400" />
          <span>New Webhook Endpoint</span>
        </h3>
        <button @click="emit('close')" class="text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div v-if="error" class="p-2.5 rounded bg-rose-950/50 dark:bg-rose-950/50 light:bg-rose-100 border border-rose-800/80 dark:border-rose-800/80 light:border-rose-300 text-rose-300 dark:text-rose-300 light:text-rose-800 text-xs">
        {{ error }}
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium mb-1">Endpoint Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. Stripe Payment Listener"
            class="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-md px-3 py-2 text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        <div>
          <label class="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium mb-1">
            Endpoint ID <span class="text-slate-500 font-normal">(Optional slug)</span>
          </label>
          <input
            v-model="id"
            type="text"
            placeholder="e.g. stripe-dev"
            class="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-md px-3 py-2 text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div>
          <label class="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium mb-1">Target Localhost URL</label>
          <input
            v-model="targetUrl"
            type="text"
            placeholder="http://localhost:3000/webhook"
            class="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-md px-3 py-2 text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div class="pt-2 flex items-center space-x-2">
          <input
            id="autoForward"
            v-model="autoForward"
            type="checkbox"
            class="rounded bg-slate-950 dark:bg-slate-950 light:bg-slate-100 border-slate-800 dark:border-slate-800 light:border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label for="autoForward" class="text-slate-300 dark:text-slate-300 light:text-slate-700 cursor-pointer">
            Automatically forward new incoming webhooks to target URL
          </label>
        </div>
      </div>

      <div class="flex items-center justify-end space-x-3 pt-3 border-t border-slate-700 dark:border-slate-800 light:border-slate-200">
        <button
          @click="emit('close')"
          class="px-3 py-2 rounded-md bg-slate-800 dark:bg-slate-800 light:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 text-xs font-medium"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          class="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md"
        >
          Create Endpoint
        </button>
      </div>
    </div>
  </div>
</template>
