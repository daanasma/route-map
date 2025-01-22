<script setup >
import Map from '../components/Map.vue';
import Content from '../components/Content.vue';
import {watch, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import { useRouteInfoStore } from '../stores/routestatus.js';
const route = useRoute(); // Get the current route (with query params)
const router = useRouter();
const routeStatus = useRouteInfoStore();
watch(
    () => route.query.stop,
    (newStopId) => {
      if (newStopId) {
        console.log(`Home: new stop! ${newStopId}`)
        // Find the stop based on the stopId
        routeStatus.setStop(newStopId)
        routeStatus.activeTopic = 'stop'
        console.log('Home: set routeStatus.activeTopic', routeStatus.activeTopic)
      }
    },
    {immediate: true} // Call immediately on initial load
);


onMounted(() => {
  router.isReady().then(() => {
    routeStatus.setUrlReadyToUpdate();
  });
});

</script>

<template>
    <div class="w-full h-dvh flex flex-col lg:flex-row">
    <!-- Map Component Section -->
    <div class="w-full lg:w-7/10 h-7/10 lg:h-full ">
      <Map />
    </div>

    <!-- Content Component Section -->
    <div class="w-full lg:w-3/10 h-3/10 lg:h-full">
      <Content />
    </div>
  </div>
</template>

<style scoped>
</style>
