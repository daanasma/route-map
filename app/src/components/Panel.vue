<script>
import {useIsTablet} from "../composables/useIsTablet.js";
import {useRouteInfoStore} from "@/stores/routestatus.js";
import {watch, ref, onMounted} from "vue";
import {useSwipe} from "@vueuse/core";
import CardSlider from '../components/CardSlider.vue';
import DetailInfoPanel from "../components/DetailInfoPanel.vue";
import {storeToRefs} from 'pinia'

export default {
  components: {
    DetailInfoPanel,
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
  <div class="layout-container">
    <!-- Header -->
    <header v-if="!isTablet && routeStatus.routeData">
      {{ routeStatus.routeMetadata.title }}
    </header>

    <!-- Content -->

    <CardSlider v-if="isTablet && routeStatus.routeData" :cards="routeCards" :isMobile="true" />
    <DetailInfoPanel v-if="!isTablet && routeStatus.routeData" ></DetailInfoPanel>

    <!-- Desktop Content -->
    <!-- Footer Navigation -->
    <footer v-if="!isTablet" class="footer">
      <div v-if="routeStatus.activeTopic === 'overview'">
        <button @click="activateNextStop">Start route</button>
      </div>
      <div v-else>
        <button @click="activatePreviousStop">Previous</button>
        <button @click="activateOverview">Show full Route</button>
        <button @click="activateNextStop">Next</button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: row;
  height: 100%;
}

@media (min-width: 1024px) {
.layout-container {
  flex-direction: column;
}
}

header {
  height: 4rem;
  background-color: #1f2937; /* bg-gray-800 */
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content {
  flex-grow: 1;
  background-color: #f3f4f6; /* bg-gray-100 */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0;
  height: calc(100dvh - 8rem);
}


p {
  color: #4b5563; /* text-gray-600 */
  margin-bottom: 0.5rem;
}


footer {
  height: 4rem;
  background-color: #1f2937; /* bg-gray-800 */
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

button {
  padding: 0.5rem;
  background-color: #3b82f6; /* bg-blue-500 */
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
}

</style>
