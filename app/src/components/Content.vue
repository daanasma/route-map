<script>
import {useIsTablet} from "../composables/useIsTablet.js";
import {useRouteInfoStore} from "@/stores/routestatus.js";
import {watch, ref, onMounted} from "vue";
import {useSwipe} from "@vueuse/core";
import CardSlider from '../components/CardSlider.vue';

import {storeToRefs} from 'pinia'

export default {
  components: {
    CardSlider,
  },
  setup() {
    const {isTablet} = useIsTablet(); // Call the composable
    const routeStatus = useRouteInfoStore();


    // const cards = ref(Array.from({ length: 5 }, (_, i) => ({ id: i + 1 })));
    const routeCards = ref([]);

    const activatePreviousStop = () => {
      console.log('Swipe or Button: Previous Stop activated!');
      routeStatus.previousStep()
    };
    const activateNextStop = () => {
      console.log("Swipe or Button: Next Stop activated!");
      routeStatus.nextStep()
    };

    const activateOverview = () => {
      routeStatus.setActiveTopic('overview', true)
    }


    watch(
        () => (routeStatus.stopId), // Watch the stopId in the Pinia store
        (newStopId, oldStopId) => {
          console.log(`content: Stop ID changed from ${oldStopId} to ${newStopId}`);

          // Handle any side effects or actions you need based on stopId change
        }
    );

    watch(
        () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
        (newTopic, oldTopic) => {
          console.log(`content: active topic changed from ${oldTopic} to ${newTopic}`);
        }, {immediate: true}
    );
    watch(
        () => (routeStatus.routeData), // Watch the stopId in the Pinia store
        (newValue, oldValue) => {
          console.log('content: routedata: refresh needed:', newValue);
          routeCards.value = routeStatus.getAllRouteFeatures
        }
    );

    return {
      isTablet,
      routeStatus,
      activatePreviousStop,
      activateNextStop,
      activateOverview,
      routeCards,
    };
  },
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header v-if="!isTablet && routeStatus.routeData"
            class="h-16 bg-gray-800 text-white subsection-title flex items-center justify-center">
      {{ routeStatus.routeMetadata.title }}
    </header>

    <!-- Content -->
    <!-- Mobile -->

    <CardSlider
        v-if="isTablet && routeStatus.routeData"
        :cards="routeCards"
        :isMobile="true"
    />
    <!-- Desktop -->
    <main class="flex-grow bg-gray-100 flex items-center justify-center ">
      <div v-if="(!isTablet && routeStatus.routeData)" class="w-full max-w-lg h-full ml-4">
        <div v-if="routeStatus.activeTopic === 'overview'">
          <h2 class=" text-xl font-bold text-gray-800 mb-4  ">{{ routeStatus.routeMetadata.title }}</h2>

          <p class="text-gray-600 mb-2">{{ routeStatus.routeMetadata.description }}</p>
          <img :src=routeStatus.routeMetadata.banner class="max-w-full h-auto"  alt="Route Banner">

        </div>
        <div v-if="routeStatus.activeTopic === 'route'">
          <h2 class=" text-xl font-bold text-gray-800 mb-4  ">{{ routeStatus.activeFeature.properties.title }}</h2>
            <img
              v-if="routeStatus.activeFeature.images?.length"
              :src="'img/' + routeStatus.activeFeature.images[0]"
              class="max-w-full h-auto rounded-lg mb-4"
              alt="Feature Image"
            >
          <p class="text-gray-600 mb-2">{{ routeStatus.activeFeature.properties.description }}</p>
        </div>
      </div>


    </main>

    <!-- Footer Navigation -->
    <footer v-if="!isTablet" class="h-16 bg-gray-800 text-white flex items-center justify-around">
      <button class="p-2 bg-blue-500 rounded"
              @click="activatePreviousStop">Previous
      </button>
      <button class="p-2 bg-blue-500 rounded"
              @click="activateOverview">Show full Route
      </button>

      <button class="p-2 bg-blue-500 rounded" @click="activateNextStop">Next</button>
    </footer>
  </div>
</template>

<style scoped></style>
