<script setup lang="ts">
import { ref, onMounted } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import NewEndpointModal from './components/NewEndpointModal.vue';
import { useTelemetry } from './composables/useTelemetry';
import { useTheme } from './composables/useTheme';

const isCreateModalOpen = ref(false);
const { initTheme } = useTheme();

const {
  isConnected,
  events,
  endpoints,
  currentEndpoint,
  activeEndpointId,
  fetchEndpoints,
  fetchEvents,
  createEndpoint,
  connectSse
} = useTelemetry();

onMounted(async () => {
  initTheme();
  await fetchEndpoints();
  await fetchEvents();
  connectSse();
});

async function handleCreateEndpoint(data: { id?: string; name: string; targetUrl: string; autoForward: boolean }) {
  await createEndpoint(data);
  isCreateModalOpen.value = false;
}
</script>

<template>
  <div class="min-h-screen bg-zinc-950 dark:bg-zinc-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 flex flex-col font-sans overflow-hidden">
    <HeaderBar
      :endpoints="endpoints"
      :active-endpoint-id="activeEndpointId"
      :current-endpoint="currentEndpoint"
      :is-connected="isConnected"
      :total-events-count="events.length"
      @update:active-endpoint-id="activeEndpointId = $event"
      @open-create-modal="isCreateModalOpen = true"
    />

    <router-view />

    <NewEndpointModal
      :is-open="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @create="handleCreateEndpoint"
    />
  </div>
</template>
