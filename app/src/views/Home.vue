<template>
  <div class="app-container">
    <!-- Map Component Section -->
    <div class="map-section">
      <Map/>
    </div>

    <!-- Content Component Section -->
    <div class="content-section">
      <Content/>
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
const router = useRouter();

const routeStatus = useRouteInfoStore();
const {clearQueryParams, updateQueryParam} = useUpdateQueryParam();


watch(
    () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
    (newValue, oldValue) => {
      if (oldValue !== newValue) {
        log(`Home: refresh needed because active topic changed to: ${newValue}`);
        if (newValue === 'overview') {
          clearQueryParams()
        }
      }
    }
);

watch(
    () => route.query.step,
    (newStepId) => {
      if (newStepId) {
        log(`Home: new route step! ${newStepId}`)
        routeStatus.setActiveStep(newStepId); // Find the stop based on the stopId
      }
      else {
        log(`Home: no new route step so going to overview!`)

        routeStatus.setActiveTopic('overview')
      }
    },
    {immediate: true} // Call immediately on initial load
);
watch(
    () => (routeStatus.activeStepId),
    (newValue, oldValue) => {
      log('Home: active step changed.')
      if (newValue) {
        log('Home: Updating query parameter. Step id:', newValue)
        updateQueryParam('step', routeStatus.activeStepId)
        // zoomToFeature(routeStatus.activeFeature)
        //renderLayers(newValue)
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
  height: 70%;
}

@media (min-width: 1024px) {
  .map-section {
    width: 70%;
    height: 100%;

  }
}

.content-section {
  width: 100%;
  height: 30%;
}

@media (min-width: 1024px) {
  .content-section {
    width: 30%;
    height: 100%;
  }
}
</style>
