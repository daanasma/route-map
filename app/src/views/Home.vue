<template>
  <div v-if="routeStatus.panelRightSide"class="app-container">
    <!-- Map Component Section -->

    <!-- Content Component Section -->

      <div class="map-section">
        <Map/>
      </div>
      <div class="content-section">
        <Content/>
      </div>
  </div>
  <div v-else class="app-container">
      <div class="content-section">
        <Content/>
      </div>
      <div class="map-section">
        <Map/>
      </div>
    </div>

</template>


<script setup>
import { log } from '../debug/debug.js';
import Map from '../components/Map.vue';
import Content from '../components/Panel.vue';
import {watch, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useRouteInfoStore} from '../stores/routestatus.js';
import {useUpdateQueryParam} from "@/composables/useQueryParams.js";

const route = useRoute(); // Get the current route (with query params)

const routeStatus = useRouteInfoStore();
const {clearQueryParams, updateQueryParam, updateQueryParams} = useUpdateQueryParam();


watch(
    () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
    (newValue, oldValue) => {
      if (oldValue !== newValue) {
        log(`Home: Active topic changed to: ${newValue}`);
        if (newValue === 'overview') {
          updateQueryParams({
            step: null,
            feature: null
          })
        }
      }
    }
);

watch(
  () => route.query,
  (query) => {
    let hasSelection = false;

    if (query.step) {
      if (routeStatus.activeStepId !== query.step) {
        routeStatus.setActiveStep(query.step);
      }
      hasSelection = true;
    } else if (routeStatus.activeStepId) {
      routeStatus.setActiveStep(null);
    }

    if (query.feature) {
      if (routeStatus.activeFeatureId !== query.feature) {
        routeStatus.setActiveFeature(query.feature);
      }
      hasSelection = true;
    } else if (routeStatus.activeFeatureId) {
      routeStatus.setActiveFeature(null);
    }

    if (!hasSelection && routeStatus.activeTopic !== 'overview') {
      routeStatus.setActiveTopic('overview');
    }
  },
  { immediate: true }
);

watch(
    () => (routeStatus.activeStepId),
    (newValue, oldValue) => {
      log('Home: active step changed.')
      if (newValue) {
        log('Home: Updating query parameter. Step id:', newValue)
        updateQueryParam('step', newValue)
        if (routeStatus.activeTopic !== 'featuredetail') {
          updateQueryParam('feature', null)
          routeStatus.setActiveFeature(null)
        }
      }
    }
)

watch(
    () => (routeStatus.activeFeatureId),
    (newValue, oldValue) => {
      log('Home: active feature changed.')
      if (newValue) {
        updateQueryParams({
          'feature': newValue,
          'step': routeStatus.activeStepId
        })
        log('Home: Updating query parameter feature. feature id:', newValue)
      }
    }
)


</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100dvh;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  /* lg breakpoint */
  .app-container {
    flex-direction: row;

  }
}

.map-section {
  width: 100%;
  height: 80%;
}

@media (min-width: 1024px) {
  .map-section {
    width: 60%;
    height: 100%;

  }
}

.content-section {
  width: 100%;
  height: 20%;
}

@media (min-width: 1024px) {
  .content-section {
    width: 40%;
    height: 100%;
  }
}
</style>
