<template>
  <div class="content-wrapper" ref="contentWrapper" @scroll="logScroll">
    <div>breadcrumb</div>
    <div v-if="routeStatus.activeTopic === 'overview'">
      <h2>{{ routeStatus.routeMetadata.title }}</h2>
      <p>{{ routeStatus.routeMetadata.description }}</p>
      <ElevationProfile
      v-if="routeStatus.fullRouteElevation !== null"
      :elevation-data="routeStatus.fullRouteElevation.data"
      />

      <p><b>Total distance:</b> {{ routeStatus.routeLengthKm }}km</p>
      <p><b>Difficulty:</b> {{ routeStatus.routeMetadata.difficulty_level }}</p>


      <img :src="routeStatus.routeMetadata.banner" alt="Route Banner">
      <p>{{ routeStatus.routeMetadata.description_long }}</p>


    </div>

    <div v-if="routeStatus.activeTopic === 'route'">

      <h2 v-if="!isTablet">{{ routeStatus.activeStepData.title }}</h2>
      <p v-if="routeStatus.activeStepLengthKm > 0">
        Distance: {{ routeStatus.activeStepLengthKm }}km
      </p>
      <!--        <ElevationProfile v-if="routeStatus.activeFeatures.type === 'line'"-->
      <!--           :elevation-data="routeStatus.activeFeatures.elevation"-->
      <!--        />-->

      <v-carousel
          v-if="routeStatus.activeStepData.images?.length"
          :key="routeStatus.activeStepData.route_step"
          :show-arrows="routeStatus.activeStepData.images.length > 1"
          :height="300"
          @touchstart.stop
          @touchmove.stop

      >
        <v-carousel-item
            v-for="(image, index) in routeStatus.activeStepData.images"
            :key="index"
            :src=image
            cover
        ></v-carousel-item>
      </v-carousel>
      <div class="content-actual-content">
        <h3>
          Summary
        </h3>

        <p>{{ routeStatus.activeStepData.summary }}</p>

        <div>
          <div>
            <h3>
              Lorum Ipsum?
            </h3>

            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like
            Aldus PageMaker including versions of Lorem Ipsum.
          </div>
        </div>
      </div>
    </div>
  </div>

</template>


<script>
import {useRouteInfoStore} from '../stores/routestatus.js';
import {ref, watch} from 'vue';
import ElevationProfile from '@/components/ElevationProfile.vue'; // Adjust path if needed
import {log} from '@/debug/debug.js';
import {useIsTablet} from "@/composables/useIsTablet.js";

export default {
  components: {ElevationProfile}, // Register the component
  setup() {
    const routeStatus = useRouteInfoStore();
    const contentWrapper = ref(null); // Ref to the content-wrapper element
    const {isTablet} = useIsTablet(); // Call the composable

    watch(
        () => routeStatus.activeStep, // Watch for changes in activeStep
        (newVal, oldVal) => {
          log(('DetailInfoPanel -> activestep', routeStatus.activeStep))
          if (newVal !== oldVal && contentWrapper.value) {
            contentWrapper.value.scrollTop = 0; // Scroll to the top
          }
        },
        {immediate: true} // Ensure it triggers immediately when the component is mounted
    );

    // Function to handle map updates from ElevationProfile interaction
    const updateMapPoint = (point) => {
      log("Update map to:", point);
      // Here you can integrate it with your MapLibre instance
    };
    return {
      isTablet,
      routeStatus,
      contentWrapper,
      updateMapPoint
    }

  },
  computed: {
    formattedDistance() {
      let distance = Math.round(this.routeStatus.activeFeatures.properties.route_length_meters / 10) * 10; // Round to nearest 10m
      return distance < 300
          ? `${distance}m`  // Show in meters if < 3km
          : `${(distance / 1000).toFixed(1)}km`; // Show in km with 1 decimal
    }
  },
  data() {
    return {
      isScrolled: false,  // Tracks whether scrollTop is > 0 or not
    };
  },
  methods: {
    logScroll(event) {
      const panel = event.target;
      const isNowScrolled = panel.scrollTop > 0;

      // Emit only when scroll state changes between 0 and >0
      if (this.isScrolled !== isNowScrolled) {
        this.isScrolled = isNowScrolled;
        this.$emit('scrollStateChanged', this.isScrolled); // Emit scroll state to parent
      }
    },
  },
};
</script>

<style lang="scss">
@use '../styles/settings';

.v-btn--size-default {
  --v-btn-height: 20px !important;
}

.content-wrapper {
  overflow-y: auto;
  max-height: 100%;
  height: 100%;
  padding: 40px;
  carousel-controls-size: 10px;

}

.content-actual-content {
  max-height: 100%;
  overflow: visible;

}

img {
  max-width: 100%;
  height: auto;
}

</style>
