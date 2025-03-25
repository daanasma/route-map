<template>
  <div class="content-wrapper" ref="contentWrapper" @scroll="logScroll">
    <div v-if="routeStatus.activeTopic === 'overview'">
          <h2>{{ routeStatus.routeMetadata.title }}</h2>
          <p>{{ routeStatus.routeMetadata.description }}</p>
          <img :src="routeStatus.routeMetadata.banner" alt="Route Banner">
              <ElevationProfile :elevation-data="routeStatus.getFullRouteElevation" />

        </div>
        <div v-if="routeStatus.activeTopic === 'route'">
          <h2>{{ routeStatus.activeFeature.properties.title }}</h2>
          <div v-if="routeStatus.activeFeature.properties.route_length_meters">
          <h5>{{ formattedDistance }}</h5>
          </div>
        <ElevationProfile v-if="routeStatus.activeFeature.type === 'line'"
           :elevation-data="routeStatus.activeFeature.elevation"
        />

          <v-carousel
              v-if="routeStatus.activeFeature.images?.length"
              :show-arrows="routeStatus.activeFeature.images.length > 1"
              :height="300"
                @touchstart.stop
                @touchmove.stop
          >
            <v-carousel-item
                v-for="(image, index) in routeStatus.activeFeature.images"

                :key="index"
                :src=image
                cover
            ></v-carousel-item>
          </v-carousel>
          <div class="content-actual-content">
            <h3>
              Summary
            </h3>

          <p>{{ routeStatus.activeFeature.properties.description }}</p>
                    <!-- Elevation Profile with Test Data -->
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
            Aldus PageMaker including versions of Lorem Ipsum.
          </div>
          <div>
            <h3>
            Why do we use it?
            </h3>
            <p>
            It is a long established fact that a reader will be distracted by the readable content of a page when
            looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of
            letters, as opposed to using 'Content here, content here', making it look like readable English. Many
            desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a
            search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved
            over the years, sometimes by accident, sometimes on purpose (injected humour and the like).
</p>

          </div>
        </div>
</div>
        </div>
      </div>

</template>



<script>
import { useRouteInfoStore } from '../stores/routestatus.js';
import { ref, watch, onMounted } from 'vue';
import ElevationProfile from '@/components/ElevationProfile.vue'; // Adjust path if needed

export default {
  components: { ElevationProfile }, // Register the component
  setup() {
    const routeStatus = useRouteInfoStore();
    const contentWrapper = ref(null); // Ref to the content-wrapper element
    watch(
      () => routeStatus.activeFeature, // Watch for changes in activeFeature
      (newVal, oldVal) => {
        if (newVal !== oldVal && contentWrapper.value) {
          contentWrapper.value.scrollTop = 0; // Scroll to the top
        }
      },
      { immediate: true } // Ensure it triggers immediately when the component is mounted
    );

        // Function to handle map updates from ElevationProfile interaction
    const updateMapPoint = (point) => {
      console.log("Update map to:", point);
      // Here you can integrate it with your MapLibre instance
    };
    return {
      routeStatus,
      contentWrapper,
      updateMapPoint
    }

  },
  computed : {
    formattedDistance() {
      let distance = Math.round(this.routeStatus.activeFeature.properties.route_length_meters / 10) * 10; // Round to nearest 10m
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
