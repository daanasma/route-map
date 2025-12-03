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
<script>
import {useIsTablet} from "../composables/useIsTablet.js";
import {useRouteInfoStore} from "@/stores/routestatus.js";
import {watch, ref, onMounted} from "vue";
import {useSwipe} from "@vueuse/core";
import CardSlider from '../components/CardSlider.vue';
import DetailInfoPanel from "../components/DetailInfoPanel.vue";
import {storeToRefs} from 'pinia'
import { log } from '../debug/debug.js';

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
      log('Swipe or Button: Previous Stop activated!');
      routeStatus.previousStep()
    };
    const activateNextStop = () => {
      log("Swipe or Button: Next Stop activated!");
      routeStatus.nextStep()
    };

    const activateOverview = () => {
      routeStatus.setActiveTopic('overview', true)
    }


    watch(
        () => (routeStatus.stopId), // Watch the stopId in the Pinia store
        (newStopId, oldStopId) => {
          log(`Panel: Stop ID changed from ${oldStopId} to ${newStopId}`);

          // Handle any side effects or actions you need based on stopId change
        }
    );

    watch(
        () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
        (newTopic, oldTopic) => {
          log(`Panel: active topic changed from ${oldTopic} to ${newTopic}`);
        },
        // {immediate: true} // todo check impact of this
    );
    watch(
        () => (routeStatus.routeData), // Watch the stopId in the Pinia store
        (newValue, oldValue) => {
          log('Panel: routedata: Loaded routecards to create panel.:', newValue);
          routeCards.value = routeStatus.routeSequence
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
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color-contrast);
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
  background-color: var(--background-color-contrast);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-around;
}


</style>
