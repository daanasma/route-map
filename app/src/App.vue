<script setup>
import { onMounted } from 'vue';
import { useRouteInfoStore } from './stores/routestatus.js';

const routeStore = useRouteInfoStore();

onMounted(() => {
  routeStore.loadRouteData(); // Fetch the route data on app load
});


</script>

<template>
  <div >
    <router-view /> <!-- Renders the current route (either Home or About) -->
    <div v-if="routeStore.loading">Loading route data...</div>
    <div v-else-if="routeStore.error">Error: {{ routeStore.error }}</div>
  </div>
</template>

<style>




</style>
