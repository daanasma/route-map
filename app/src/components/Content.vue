<script >
import { useIsMobile } from "../composables/useIsMobile";
import {useRouteInfoStore} from "@/stores/routestatus.js";
import {watch, ref, onMounted} from "vue";
import { useSwipe } from "@vueuse/core";

import {storeToRefs } from 'pinia'
export default {
  setup() {
    const { isMobile } = useIsMobile(); // Call the composable
    const showWhat = ref('overview');
    const routeStatus = useRouteInfoStore();
    const dataReady = ref(false)
    const swipeTarget = ref(null); // Target element for swipe detection
    const activatePreviousStop = () => {
      console.log("Swipe or Button: Previous Stop activated!");
      routeStatus.previousStop()
    };
    const activateNextStop = () => {
      console.log("Swipe or Button: Next Stop activated!");
      routeStatus.nextStop()
    };

    const activateOverview = () => {
      routeStatus.activeTopic = 'overview';
      routeStatus.refreshNeeded = true;
      console.log('set routestatus to overview and refresh!', routeStatus.refreshNeeded)
    }

    function showStopPanel () {
       const showIt = typeof activeStop.valueOf() != "undefined"
      console.log('showIt', showIt)
      return showIt
    }

    onMounted(() => {
      // Swipe Detection
      const { onSwipeLeft, onSwipeRight } = useSwipe(swipeTarget, {
        threshold: 50, // Minimum swipe distance in pixels
        onSwipeLeft: () => {
          console.log("Swiped left!");
          activateNextStop();
        },
        onSwipeRight: () => {
          console.log("Swiped right!");
          activatePreviousStop();
        },
      });
    });

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
      activateOverview,
      swipeTarget,
    };
  },
};
</script>

<template>
  <div class="flex flex-col h-full" ref="swipeTarget">
    <!-- Header -->
    <header   class="h-16 bg-gray-800 text-white subsection-title flex items-center justify-center">
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
    <footer v-if="!isMobile" class="h-16 bg-gray-800 text-white flex items-center justify-around">
      <button class="p-2 bg-blue-500 rounded" @click="activatePreviousStop">Previous</button>
      <button class="p-2 bg-blue-500 rounded" @click="activateOverview">Show full Route </button>

      <button class="p-2 bg-blue-500 rounded" @click="activateNextStop">Next</button>
    </footer>
  </div>
</template>

<style scoped></style>
