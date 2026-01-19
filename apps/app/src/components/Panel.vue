<template>
  <div class="layout-container">
    <!-- Header -->
    <header v-if="!isTablet && routeStatus.routeData">
      <BreadCrumb />
    </header>

    <!-- Content -->
    <CardSlider
      v-if="isTablet && routeStatus.routeData"
      :cards="routeCards"
      :isMobile="true"
    />
    <DetailInfoPanel v-if="!isTablet && routeStatus.routeData" />

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

<script setup>
import { ref, watch } from 'vue';
import { useIsTablet } from '../composables/useIsTablet.js';
import { useRouteInfoStore } from '@repo/common/stores/routestatus.js';
import CardSlider from '../components/CardSlider.vue';
import DetailInfoPanel from '../components/DetailInfoPanel.vue';
import BreadCrumb from '@/components/BreadCrumb.vue';
import { log } from '../debug/debug.js';

const { isTablet } = useIsTablet();
const routeStatus = useRouteInfoStore();
const routeCards = ref([]);

const activatePreviousStop = () => {
  log('Swipe or Button: Previous Stop activated!');
  routeStatus.previousStep();
};

const activateNextStop = () => {
  log('Swipe or Button: Next Stop activated!');
  routeStatus.nextStep();
};

const activateOverview = () => {
  routeStatus.setActiveTopic('overview');
  routeStatus.triggerMapRefresh();
};

// Watch stopId changes
watch(
  () => routeStatus.stopId,
  (newStopId, oldStopId) => {
    log(`Panel: Stop ID changed from ${oldStopId} to ${newStopId}`);
  }
);

// Watch activeTopic changes
watch(
  () => routeStatus.activeTopic,
  (newTopic, oldTopic) => {
    log(`Panel: active topic changed from ${oldTopic} to ${newTopic}`);
  }
);

// Watch routeData changes
watch(
  () => routeStatus.routeData,
  (newValue) => {
    log('Panel: routedata: Loaded routecards to create panel:', newValue);
    routeCards.value = routeStatus.routeSequence;
  }
);
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
  justify-content: end;
  background-color: var(--background-color-contrast);
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
