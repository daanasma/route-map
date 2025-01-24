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
    const { isTablet } = useIsTablet(); // Call the composable

    const routeStatus = useRouteInfoStore();
    const dataReady = ref(false)


    // const cards = ref(Array.from({ length: 5 }, (_, i) => ({ id: i + 1 })));
    const cards = ref([]);

    const activatePreviousStop = () => {
      console.log('Button was clicked!');
      routeStatus.previousStop()
    };
    const activateNextStop = () => {
      console.log("Swipe or Button: Next Stop activated!");
      routeStatus.nextStop()
    };

    const activateOverview = () => {
      routeStatus.setActiveTopic('overview')
      // routeStatus.refreshNeeded = true;
      console.log('set routestatus to overview and refresh!', routeStatus.refreshNeeded)
    }

    function showStopPanel () {
       const showIt = typeof activeStop.valueOf() != "undefined"
      console.log('showIt', showIt)
      return showIt
    }

    watch(
        () => (routeStatus.stopId), // Watch the stopId in the Pinia store
        (newStopId, oldStopId) => {
          console.log(`content: Stop ID changed from ${oldStopId} to ${newStopId}`);

          // Handle any side effects or actions you need based on stopId change
        }
    );

    watch(
        () => (routeStatus.activeFeature), // Watch the stopId in the Pinia store
        (newStopId, oldStopId) => {
          console.log(`content: Stop ID changed from ${oldStopId} to ${newStopId}`);
          routeStatus.activeTopic = 'stop'
          dataReady.value = true
          // Handle any side effects or actions you need based on stopId change
        }
    );
    watch(
        () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
        (newTopic, oldTopic) => {
          console.log(`content: active topic changed from ${oldTopic} to ${newTopic}`);
          }, {immediate:true}
    );
    watch(
        () => (routeStatus.stopData), // Watch the stopId in the Pinia store
        (newValue, oldValue) => {
          console.log('stopdata: refresh needed:',  newValue.features);
          cards.value = [
            { id: 1, title: "Card 1", content: "This is card 1" },
            { id: 2, title: "Card 2", content: "This is card 2" },
            { id: 3, title: "Card 3", content: "This is card 3" },
            { id: 4, title: "Card 4", content: "This is card 4" },
            { id: 5, title: "Card 5", content: "This is card 5" },
            { id: 6, title: "Card 6", content: "This is card 6" },
          ]
          //cards.value = newValue.features
                }
    );

    return {
      isTablet,
      routeStatus,
      dataReady,
      activatePreviousStop,
      activateNextStop,
      activateOverview,
      cards,
    };
  },
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header v-if="!isTablet" class="h-16 bg-gray-800 text-white subsection-title flex items-center justify-center">
      Carretera Austral Explorer
    </header>
  <CardSlider
    v-if="isTablet"
    :cards="cards"
    :isMobile="true"
  />
<!--  <div v-if="isMobile" class="cards-wrapper">-->
<!--    &lt;!&ndash; Navigation Buttons &ndash;&gt;-->
<!--    <button id="prevBtn" @click="scroll(-1)" class="navigation-btn">Previous</button>-->
<!--    <button id="nextBtn" @click="scroll(1)" class="navigation-btn">Next</button>-->

<!--    &lt;!&ndash; Cards Container &ndash;&gt;-->
<!--    <div-->
<!--      id="cardsContainer"-->
<!--      ref="cardsContainer"-->
<!--      class="flex overflow-x-scroll snap-x snap-mandatory space-x-4"-->
<!--      @scroll="handleScroll"-->
<!--      @touchstart="handleTouchStart"-->
<!--      @touchend="handleTouchEnd"-->
<!--    >-->
<!--      <div-->
<!--        v-for="card in cards"-->
<!--        :key="card.id"-->
<!--        :id="`card-${card.id}`"-->
<!--        :class="['scroll-snap-center card-transition flex-shrink-0 w-[90vw] h-32 bg-white ' +-->
<!--         'rounded-lg shadow-md flex items-center justify-center cursor-pointer hover:shadow-lg', { expanded: expandedCard === card.id }]"-->
<!--        @click="toggleCard(card.id, $event)"-->
<!--      >-->
<!--        <div class="text-center">-->
<!--          <h3 class="text-xl font-bold">Card {{ card.id }}</h3>-->
<!--          <p class="text-gray-600">Click to expand</p>-->
<!--        </div>-->
<!--        <button-->
<!--          class="minimize-btn hidden absolute top-4 right-4-->
<!--          bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center"-->
<!--          v-show="expandedCard === card.id"-->
<!--          @click.stop="toggleCard(card.id, $event)"-->
<!--        >-->
<!--          ✕-->
<!--        </button>-->
<!--      </div>-->
<!--    </div>-->


<!--  </div>-->
    <!-- Content -->
    <main v-if="!isTablet" class="flex-grow bg-gray-100 flex items-center justify-center ">
  <div v-if="(routeStatus.activeTopic === 'stop') && (dataReady == true)" class="w-full max-w-lg h-full ml-4">
    <h2 class=" text-xl font-bold text-gray-800 mb-4  ">{{ routeStatus.activeFeature.properties.name }}</h2>

    <p class="text-gray-600 mb-2">{{ routeStatus.activeFeature.properties.description }}</p>
  </div>


    </main>

    <!-- Footer Navigation -->
    <footer v-if="!isTablet"  class="h-16 bg-gray-800 text-white flex items-center justify-around">
      <button class="p-2 bg-blue-500 rounded"
              @click="activatePreviousStop">Previous</button>
      <button class="p-2 bg-blue-500 rounded"
              @click="activateOverview">Show full Route </button>

      <button class="p-2 bg-blue-500 rounded" @click="activateNextStop">Next</button>
    </footer>
  </div>
</template>

<style scoped></style>
