<script setup>
import { onMounted , watch} from 'vue';
import { useRoute } from 'vue-router';
import { useRouteInfoStore } from './stores/routestatus.js';
const route = useRoute();
const routeStore = useRouteInfoStore();

watch(
  () => route.params.map_id,
  (newMapId) => {
    if (newMapId) {
      routeStore.setMapId(newMapId);
      routeStore.loadRouteData(); // Load route data when `mapId` updates
    }
  },
  { immediate: true } // Runs on component mount
);


// Load data on app startup if `mapId` exists
onMounted(() => {
  if (routeStore.mapId) {
    routeStore.loadRouteData();
  }
});

</script>

<template>
  <div >
    <router-view /> <!-- Renders the current route (either Home or About) -->
    <div v-if="routeStore.loading">Loading route data...</div>
    <div v-else-if="routeStore.error">Error: {{ routeStore.error }}</div>
  </div>
</template>

<style scoped>


</style>
