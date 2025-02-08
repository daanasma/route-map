<script setup >
import Map from '../components/Map.vue';
import Content from '../components/Panel.vue';
import {watch, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import { useRouteInfoStore } from '../stores/routestatus.js';
import { useUpdateQueryParam } from "@/composables/useQueryParams.js";

const route = useRoute(); // Get the current route (with query params)
const router = useRouter();

const routeStatus = useRouteInfoStore();
const { clearQueryParams, updateQueryParam } = useUpdateQueryParam();

watch(
    () => route.query.stop,
    (newStopId) => {
      if (newStopId) {
        console.log(`Home: new stop! ${newStopId}`)
        // Find the stop based on the stopId
        routeStatus.setStop(newStopId)
      }
    },
    {immediate: true} // Call immediately on initial load
);

watch(
    () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
    (newValue, oldValue) => {
      if (oldValue !== newValue) {
        console.log(`Home: refresh needed because active topic changed to: ${newValue}`);
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
        console.log(`Home: new route step! ${newStepId}`)
        // Find the stop based on the stopId
        routeStatus.setActiveStep(newStepId);
      }
    },
    {immediate: true} // Call immediately on initial load
);
    watch(
        () => (routeStatus.activeStep),
        (newValue, oldValue) => {
          console.log('Map: active step changed.')
          if (newValue) {
            console.log('Map: zooming to active feature. Step id:', newValue)
            updateQueryParam('step', routeStatus.activeStep)
            // zoomToFeature(routeStatus.activeFeature)
            //renderLayers(newValue)
          }
        }
    )

onMounted(() => {
  router.isReady().then(() => {
    routeStatus.setUrlReadyToUpdate();
  });
});

</script>

<template>
  <div class="app-container" >
    <!-- Map Component Section -->
    <div class="map-section">
      <Map />
    </div>

    <!-- Content Component Section -->
    <div class="content-section" >
      <Content />
    </div>
  </div>
</template>
<style>


.app-container {
  width: 100%;
  height: 100dvh;
  max-height: 100%;
  display: flex;
        -ms-overflow-y: hidden;

}

@media (min-width: 1024px) { /* lg breakpoint */
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
