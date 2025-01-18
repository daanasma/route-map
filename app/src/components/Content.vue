<script >
import { useIsMobile } from "../composables/useIsMobile";
import {useRouteInfoStore} from "@/stores/routestatus.js";
import {watch, ref, onMounted} from "vue";
import {storeToRefs } from 'pinia'
export default {
  setup() {
    const { isMobile } = useIsMobile(); // Call the composable
    let showWhat = ref('overview');
    const routeStatus = useRouteInfoStore();
    let dataReady = ref(false)
    const activatePreviousStop = () => {
      console.log('Button was clicked!');
      routeStatus.previousStop()
    };
    const activateNextStop = () => {
      console.log('Button was clicked!');
      routeStatus.nextStop()
    };


    function showStopPanel () {
       const showIt = typeof activeStop.valueOf() != "undefined"
      console.log('showIt', showIt)
      return showIt
    }

    watch(
        () => (routeStatus.stopId), // Watch the stopId in the Pinia store
        (newStopId, oldStopId) => {
          console.log(`content: Stop ID changed from ${oldStopId} to ${newStopId}`);
          routeStatus.activeTopic = 'stop'
          showWhat.value = 'stop'
          // Handle any side effects or actions you need based on stopId change
        }
    );

    watch(
        () => (routeStatus.activeFeature), // Watch the stopId in the Pinia store
        (newStopId, oldStopId) => {
          console.log(`content: Stop ID changed from ${oldStopId} to ${newStopId}`);
          routeStatus.activeTopic = 'stop'
          showWhat.value = 'stop'
          dataReady.value = true
          // Handle any side effects or actions you need based on stopId change
        }
    );

    return {
      isMobile,
      routeStatus,
      dataReady,
      activatePreviousStop,
      activateNextStop,
    };
  },
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header v-if="!isMobile"  class="h-16 bg-gray-800 text-white subsection-title flex items-center justify-center">
      Carretera Austral Explorer
    </header>

    <!-- Content -->
    <main class="flex-grow bg-gray-100 flex items-center justify-center ">
  <div v-if="(routeStatus.activeTopic === 'stop') && (dataReady == true)" class="w-full max-w-lg h-full ml-4">
    <h2 class=" text-xl font-bold text-gray-800 mb-4  ">{{ routeStatus.activeFeature.properties.name }}</h2>

    <p class="text-gray-600 mb-2">{{ routeStatus.activeFeature.properties.description }}</p>
  </div>


    </main>

    <!-- Footer Navigation -->
    <footer  class="h-16 bg-gray-800 text-white flex items-center justify-around">
      <button class="p-2 bg-blue-500 rounded" @click="activatePreviousStop">Previous</button>
      <button class="p-2 bg-blue-500 rounded" @click="activatePreviousStop">Show </button>

      <button class="p-2 bg-blue-500 rounded" @click="activateNextStop">Next</button>
    </footer>
  </div>
</template>

<style scoped></style>
