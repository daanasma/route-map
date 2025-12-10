<template>
  <div class="content-wrapper" ref="contentWrapper" @scroll="logScroll">

    <div id="content-details">

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

      <div v-if="routeStatus.activeTopic === 'route' " class="">
        <h2 v-if="!isTablet">{{ routeStatus.activeStepData.title }}</h2>
            <li v-for="item in featureParts" :key="item.id">
              feat: {{ item.properties.title }}
            </li>

        <p v-if="routeStatus.activeStepLengthKm > 0">
          Distance: {{ routeStatus.activeStepLengthKm }}km
        </p>
        <ElevationProfile
        v-if="segmentElevationData !== null"
        :elevation-data="segmentElevationData"
        />

        <v-carousel hide-delimiters
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
        <v-divider  :thickness="1"></v-divider>

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

      <div v-if="routeStatus.activeTopic === 'featuredetail' " class="">
        <h2 v-if="!isTablet">feature activated!</h2>
        {{routeStatus.activeFeatureData}}
      </div>

    </div>

  </div>

</template>


<script setup>
import {useRouteInfoStore} from '../stores/routestatus.js';
import {computed, ref, watch} from 'vue';
import ElevationProfile from '@/components/ElevationProfile.vue';
import {log} from '@/debug/debug.js';
import {useIsTablet} from "@/composables/useIsTablet.js";
import { useSegmentElevation } from '@/composables/useElevationProfile.js';

const emit = defineEmits(['scrollStateChanged']);

const routeStatus = useRouteInfoStore();
const contentWrapper = ref(null);
const feat = ref();
const {isTablet} = useIsTablet();
const {segmentElevationData} = useSegmentElevation();

const isScrolled = ref(false);

const featureParts = computed (() => {
  const af = routeStatus.activeFeatureData;
  console.log('-------------af ', af)
  return af
})

const formattedDistance = computed(() => {
  let distance = Math.round(routeStatus.activeFeatures.properties.route_length_meters / 10) * 10;
  return distance < 300
      ? `${distance}m`
      : `${(distance / 1000).toFixed(1)}km`;
});

const logScroll = (event) => {
  const panel = event.target;
  const isNowScrolled = panel.scrollTop > 0;

  if (isScrolled.value !== isNowScrolled) {
    isScrolled.value = isNowScrolled;
    emit('scrollStateChanged', isScrolled.value);
  }
};

watch(
  () => routeStatus.activeStep,
  (newVal, oldVal) => {
    log(('DetailInfoPanel -> activestep', routeStatus.activeStep));
    if (newVal !== oldVal && contentWrapper.value) {
      contentWrapper.value.scrollTop = 0;
    }
  },
  {immediate: true}
);

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
  carousel-controls-size: 10px;
}

#content-details {
  padding-left: 10px
}

@media (min-width: 1024px) {
  #content-details {
  padding-top: 10px
}

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
