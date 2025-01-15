<script setup >
import Map from '../components/Map.vue';
import Content from '../components/Content.vue';
import {watch} from "vue";
import {useRoute} from "vue-router";
import { useRouteStatusStore } from '../stores/routestatus.js';

const route = useRoute(); // Get the current route (with query params)
const routeStatus = useRouteStatusStore();
watch(
    () => route.query.stop,
    (newStopId) => {
      if (newStopId) {
        console.log(`new stop! ${newStopId}`)
        // Find the stop based on the stopId
        routeStatus.setStop(newStopId)
      }
    },
    {immediate: true} // Call immediately on initial load
);


</script>

<template>
    <div class="w-full h-screen flex flex-col md:flex-row">
    <!-- Map Component Section -->
    <div class="w-full md:w-7/10 h-7/10 md:h-full">
      <Map />
    </div>

    <!-- Content Component Section -->
    <div class="w-full md:w-3/10 h-3/10 md:h-full">
      <Content />
    </div>
  </div>
</template>

<style scoped>
</style>
