<!-- components/DebugOverlay.vue -->
<template>
  <!-- Toon de overlay alleen als de debug mode aan staat in settings store -->
  <div v-if="settingsStore.isDebugMode"
       :class="['debug-overlay', { collapsed: isCollapsed }]">

    <!-- Klikbare header om in/uit te klappen -->
    <strong @click="toggleCollapse" class="overlay-header">
      Route Info Store State
      <span>{{ isCollapsed ? '[+]' : '[-]' }}</span>
    </strong>

    <!-- De inhoud die verborgen wordt bij inklappen -->
    <pre v-if="!isCollapsed">{{ storeState }}</pre>
  </div>
</template>

<script setup>
import { useRouteInfoStore } from '../stores/routestatus.js';
import { useSettingsStore } from '../stores/settings.js';
import { computed, ref } from 'vue';

const routeInfoStore = useRouteInfoStore();
const settingsStore = useSettingsStore();

// Nieuwe state variabele om de inklapstatus bij te houden
const isCollapsed = ref(true);

// Functie om de status te wisselen
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
};

// Converteer de store state naar een simpel object voor weergave
const storeState = computed(() => ({
  mapId: routeInfoStore.mapId,
  theme: routeInfoStore.theme,
  routeData: routeInfoStore.routeData ? 'Loaded (' + routeInfoStore.routeData.sequence.length + ' steps)' : 'null',
  loading: routeInfoStore.loading,
  activeStepId: routeInfoStore.activeStepId,
  activeTopic: routeInfoStore.activeTopic,
  appVersion: __APP_VERSION__,
}));

// showOverlay ref is niet langer nodig, we gebruiken isDebugMode en isCollapsed
</script>

<style scoped>
.debug-overlay {
  position: fixed;
  top: 40px;
  left: 10px;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.8); /* Iets donkerder zodat tekst beter leesbaar is */
  color: white;
  padding: 10px;
  border-radius: 5px;
  max-height: 50vh;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  /* pointer-events: none; <-- Verwijderd, we willen er nu op kunnen klikken! */
}

/* Stijl voor de klikbare header */
.overlay-header {
  cursor: pointer; /* Toon een handje bij hover */
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none; /* Voorkom selectie van tekst bij snel klikken */
}

.debug-overlay pre {
  margin: 10px 0 0 0; /* Extra marge boven de inhoud na de header */
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
