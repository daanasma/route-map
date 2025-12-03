<template>
    <div v-for="(message, index) in logMessages" :key="index">
      <v-snackbar
        v-model="message.visible"
        :timeout="3000"
        location="top"
        :style="{ top: `${index * 60}px` }"
        @update:modelValue="removeMessage(message.id)"
      >
        {{ message.text }}
        <template v-slot:actions>
          <v-btn color="blue" variant="text" @click="message.visible = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </div>
  <div class="cards-wrapper">
    <!-- Navigation Buttons -->
    <button v-if="!isFirstCard" id="prevBtn" @click="scrollWithButton(-1)" class="navigation-btn">‹</button>
    <button v-if="!isLastCard" id="nextBtn" @click="scrollWithButton(1)" class="navigation-btn">›</button>

    <!-- Cards Container -->
    <div
      ref="cardsContainer"
      class="cards-container"
      @scroll="handleScroll"
    >
      <div data-key="overview" class="card overview-card">
        <h1>{{ routeStatus.routeMetadata.title }}</h1>
      </div>

      <!-- Original Cards -->
      <div
        v-for="card in cards"
        :key="card.route_step"
        :data-key="card.route_step"
        :class="['card', { expanded: expandedCard === card.route_step }]"
        @click="expandCard(card)"
        class="content-card"
      >
        <div class="text-center">
          <h3>{{ card.title }}</h3>
          <p>Click to expand</p>

        </div>
      </div>

      <div data-key="breakdown" class="card overview-card">
        <h1>The end</h1>
      </div>
    </div>
  </div>

<!--  <vue-bottom-sheet-->
<!--        ref="DetailsBottomSheet"-->
<!--        :max-height="600"-->
<!--        :max-width="1024"-->
<!--        :can-swipe="overlayCollapsable"-->
<!--    >-->
<!--   <DetailInfoPanel @scrollStateChanged="handleScrollStateChange" />-->
<!--  </vue-bottom-sheet>-->

<!--  https://github.com/megaarmos/vue-spring-bottom-sheet-->
  <BottomSheet
    ref="DetailsBottomSheet"
    :can-swipe-close="overlayCollapsable"
    :swipe-close-threshold="'15%'"
    :snap-points="['50%', instinctHeight]"
    header-class="sheet-header"
    content-class="sheet-content"
    footer-class="sheet-footer"
    @instinct-height="(n) => (instinctHeight = n)"
    @click="DetailsBottomSheet.snapToPoint(2)"
  >
    <template #header>
      <h2>{{ expandedCardData?.title || 'Details' }}</h2>
    </template>

    <DetailInfoPanel @scrollStateChanged="handleScrollStateChange" />

<!--    <template #footer>-->
<!--      Footer?-->
<!--    </template>-->
  </BottomSheet>

</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouteInfoStore } from '@/stores/routestatus.js';
import DetailInfoPanel from "@/components/DetailInfoPanel.vue";
import BottomSheet from '@douxcode/vue-spring-bottom-sheet';
import '@douxcode/vue-spring-bottom-sheet/dist/style.css';
import { log } from '@/debug/debug.js';

const props = defineProps({
  cards: {
    type: Array,
    required: true,
  },
  isMobile: Boolean,
});
const instinctHeight = ref();

const DetailsBottomSheet = ref(null)
const routeStatus = useRouteInfoStore();
const expandedCard = ref(null);

const expandedCardData = ref(null);
const currentCard = ref(null);
const cardsContainer = ref(null);
const isFirstCard = ref(false);
const isLastCard = ref(false);
const startY = ref(0);

const minHeight = 30;
const currentCardHeight = ref(70);
const cardTransition = ref('height 0.3s ease');
const dragThreshold = 150;
const showOverlay = ref(true);
const overlayCollapsable = ref(true);
const snackbar = ref(false);
const logMessages = ref([]);
const maxHeight = ref(50)

  let scrollTimeout = null;
const logSnackbar = (message) => {
      logMessages.value.push({ text: message, visible: true });
      log(message);
};
    const removeMessage = (id) => {
      logMessages.value = logMessages.value.filter((msg) => msg.id !== id);
    };


const handleScrollStateChange = (isScrolled) => {
  overlayCollapsable.value = !isScrolled
};

const expandCard = (card) => {
  if (card.route_step === routeStatus.activeStepId) {
    expandedCard.value = card.route_step;
    expandedCardData.value = card;
    DetailsBottomSheet.value?.open();
    log("Card should expand now.")
  } else {
    goToCardById(card.route_step);
  }
};

const closeExpandedCard = () => {
  DetailsBottomSheet.value?.close()
  log('Closed expanded card')
};

const isElementInCenter = (element, container) => {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const containerCenter = containerRect.left + containerRect.width / 2;
  return Math.abs(elementRect.left + elementRect.width / 2 - containerCenter) < elementRect.width / 3;
};

const handleScroll = () => {
  if (scrollTimeout) clearTimeout(scrollTimeout);
  // logSnackbar(`handle scroll`)
  scrollTimeout = setTimeout(() => {
    log("Scroll ended! 🎉");
    // logic for selecting the active card
    if (!cardsContainer.value) return;

    const cards = Array.from(cardsContainer.value.children);
    const centeredCard = cards.find((card) => isElementInCenter(card, cardsContainer.value));

    if (centeredCard) {
      console.log('centeredcard', centeredCard)

      const cardId = centeredCard.getAttribute('data-key');
      // logSnackbar(`got centered card ${cardId}`)
      console.log('centeredcard ID', cardId)

      const cardIndex = cards.indexOf(centeredCard);
      isFirstCard.value = cardId === 'overview';
      isLastCard.value = cardId === 'breakdown';
      console.log('isFirstCard', isFirstCard.value)

      if (isFirstCard.value) {
        routeStatus.setActiveTopic('overview', true);
        currentCard.value = 'overview';
        routeStatus.setActiveStep(null);
      } else if (isLastCard.value) {
        routeStatus.setActiveTopic('overview', true);
        currentCard.value = 'breakdown';
        routeStatus.setActiveStep(null);
      } else if (currentCard.value !== cardId) {
        routeStatus.setActiveTopic('route');
        currentCard.value = cardId;
        routeStatus.setActiveStep(cardIndex);
      }
    }
  }, 100); // Adjust delay as needed

};

const debouncedHandleScroll = () => {
  clearTimeout(window.scrollTimeout);
  window.scrollTimeout = setTimeout(handleScroll, 150);
};

const goToCardById = (cardId) => {
  if (!cardsContainer.value) return;
  log('go to card by id -> ', cardId)
  const targetCard = Array.from(cardsContainer.value.children).find(
    (card) => card.getAttribute('data-key') === cardId.toString()
  );
  if (!targetCard) return;

  const containerWidth = cardsContainer.value.offsetWidth;
  const cardRect = targetCard.getBoundingClientRect();
  const scrollLeft =
    cardsContainer.value.scrollLeft + cardRect.left - (containerWidth - cardRect.width) / 2;

  cardsContainer.value.scrollTo({ left: scrollLeft, behavior: 'smooth' });
};

const scrollWithButton = (direction) => {
  if (!cardsContainer.value) return;

  const currentIndex = parseInt(currentCard.value) || 0;
  let nextIndex = currentIndex + direction;
  const cards = Array.from(cardsContainer.value.children);

  if (currentCard.value === 'breakdown' && direction === -1) {
    nextIndex = cards.length - 2;
  }
  if (nextIndex >= 0 && nextIndex < cards.length) {
    goToCardById(cards[nextIndex].getAttribute('data-key'));
  }
};
const preventScroll = (event) => {
  if (Math.abs(event.touches[0].clientX - startX.value) > Math.abs(event.touches[0].clientY - startY.value)) {
    event.preventDefault(); // Prevent Safari from overriding touch behavior
  }
};
const navigateCardsWithKeyArrows = (event) => {
  if (event.key === 'ArrowLeft' && !isFirstCard.value) {
    scrollWithButton(-1);
  } else if (event.key === 'ArrowRight' && !isLastCard.value) {
    scrollWithButton(1);
  } else if (event.key === 'ArrowDown' && expandedCard.value) {
    closeExpandedCard();
  } else if (event.key === 'ArrowUp' && !expandedCard.value) {
    expandCard(props.cards[currentCard.value - 1]);
  }
};

watch(
    () => routeStatus.activeStepId, // Watch for changes in activeFeature
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        if (!isLastCard | !isFirstCard) {
          goToCardById(newVal); // Scroll to the new kid

        }
      }
    },
    { immediate: true } // Ensure it triggers immediately when the component is mounted
  );


onMounted(() => {
  log("Cardslider - mounted", routeStatus)
  // if (cardsContainer.value) {
  //   cardsContainer.value.addEventListener("touchmove", preventScroll, { passive: false });
  // }

  if (routeStatus.activeStepId) {
    goToCardById(routeStatus.activeStepId);
  }
  else {
    isFirstCard.value = true;
  }
  window.addEventListener('keydown', navigateCardsWithKeyArrows);
});

onUnmounted(() => {
  window.removeEventListener('keydown', navigateCardsWithKeyArrows);
});
</script>

<style scoped>


/* Wrapper for cards and navigation buttons */
.cards-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  overflow: hidden;

}

.navigation-btn {
  display: flex;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.navigation-btn:hover {
  background-color: #e0e0e0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

#prevBtn {
  left: 1rem;
}

#nextBtn {
  right: 1rem;
}

/* Cards Container */
.cards-container {
  display: flex;
  overflow-x: scroll;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  gap: 0.5rem;
  height: 100%;
  width: 100%;
  position: relative;
  background-color: transparent;

}

/* Card */
.card {
  display: flex;

  flex-shrink: 0;
  scroll-snap-align: center;
  height: 86%;
  background-color: white;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.overview-card {
  width: 80%;
  max-width: 900px;
  height: 100%;
  background-color: var(--background-color-contrast);
  color: white;
  box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.5);
}


.content-card {
  width: 70%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  margin: 1rem 3%;
    box-shadow: 1px 4px 6px 1.5px rgba(0, 0, 0, 0.15);

  border-radius: 12px;
  background-color: #ffffff; /* Use pure white (fully opaque) */
}

.content-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  background-color: rgb(252, 252, 252)
}



/* Add margin between snackbars */
.stacked-snackbar {
  margin-top: 50px;
}

/* Bottom Sheet Custom Styling */
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sheet-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

</style>
<style>
:root {
  --vsbs-backdrop-bg: rgba(0, 0, 0, 0.3);
  --vsbs-shadow-color: rgba(89, 89, 89, 0.3);
  --vsbs-background: #fff;
  --vsbs-border-radius: 20px;
  --vsbs-outer-border-color: transparent;
  --vsbs-max-width: 1024px;
  --vsbs-border-color: rgba(46, 59, 66, 0.125);
  --vsbs-padding-x: 24px;
  --vsbs-handle-background: rgba(0, 0, 0, 0.28);
}


</style>
