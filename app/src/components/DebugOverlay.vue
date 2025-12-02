<!-- components/DebugOverlay.vue -->
<template>
  <div v-if="settingsStore.isDebugMode" class="debug-overlay">
    <strong>Route Info Store State:</strong>
    <pre>{{ storeState }}</pre>
  </div>
</template>

<script setup>
import { useRouteInfoStore } from '../stores/routestatus.js'; // Pas het pad aan
import { useSettingsStore } from '../stores/settings.js'; // Pas het pad aan
import { computed, ref } from 'vue';

const routeInfoStore = useRouteInfoStore();
const settingsStore = useSettingsStore();

// Converteer de store state naar een simpel object voor weergave
const storeState = computed(() => ({
  mapId: routeInfoStore.mapId,
  theme: routeInfoStore.theme,
  routeData: routeInfoStore.routeData ? 'Loaded (' + routeInfoStore.routeData.sequence.length + ' steps)' : 'null',
  loading: routeInfoStore.loading,
  activeStepId: routeInfoStore.activeStepId,
  activeTopic: routeInfoStore.activeTopic,
}));

// Optioneel: Voeg een manier toe om de overlay te verbergen/tonen (bijv. via localStorage of een knop)
const showOverlay = ref(true); // Zet deze altijd op true zoals gevraagd
</script>

<style scoped>
.debug-overlay {
  position: fixed;
  top: 40px;
  left: 10px;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  padding: 10px;
  border-radius: 5px;
  max-height: 50vh;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  pointer-events: none; /* Zorgt ervoor dat je kunt klikken op elementen eronder */
}

.debug-overlay pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
