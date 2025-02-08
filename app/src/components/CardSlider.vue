<template>
        <vue-bottom-sheet
          ref="myBottomSheet"
          :max-height="600"
          :max-width="1024"
          :can-swipe="overlayCollapsable"
      >
     <DetailInfoPanel @scrollStateChanged="handleScrollStateChange" />
  </vue-bottom-sheet>

  <div class="cards-wrapper">
    <!-- Navigation Buttons -->
    <button v-if="!isFirstCard" id="prevBtn" @click="scrollWithButton(-1)" class="navigation-btn">‹</button>
    <button v-if="!isLastCard" id="nextBtn" @click="scrollWithButton(1)" class="navigation-btn">›</button>


    <!-- Cards Container -->
    <div
      ref="cardsContainer"
      class="cards-container"
      @scrollend="handleScroll"
    >
      <div data-key="overview" class="overview-card">
        <h1>Carretera Austral</h1>
      </div>

      <!-- Original Cards -->
      <div
        v-for="card in cards"
        :key="card.properties.route_sequence_id"
        :data-key="card.properties.route_sequence_id"
        :class="['card', { expanded: expandedCard === card.properties.route_sequence_id }]"
        @touchstart.stop.prevent="expandCard(card)"
        @click="expandCard(card)"
      >
        <div class="text-center">
          <h3>{{ card.properties.title }}</h3>
          <p>Click to expand</p>

        </div>
      </div>

      <div data-key="breakdown" class="overview-card">
        <h1>The end</h1>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouteInfoStore } from '@/stores/routestatus.js';
import DetailInfoPanel from "@/components/DetailInfoPanel.vue";
import VueBottomSheet from "@webzlodimir/vue-bottom-sheet";
import  "@webzlodimir/vue-bottom-sheet/dist/style.css";

const props = defineProps({
  cards: {
    type: Array,
    required: true,
  },
  isMobile: Boolean,
});
const myBottomSheet = ref(null)
const routeStatus = useRouteInfoStore();
const expandedCard = ref(null);
const expandedCardDiv = ref(null);
const expandedCardData = ref(null);
const currentCard = ref(null);
const cardsContainer = ref(null);
const isFirstCard = ref(false);
const isLastCard = ref(false);
const startY = ref(0);
const initialHeight = 70;
const minHeight = 30;
const currentCardHeight = ref(70);
const cardTransition = ref('height 0.3s ease');
const dragThreshold = 150;
const showOverlay = ref(true);
const overlayCollapsable = ref(true);

const maxHeight = ref(50)

const open = () => {
}

const close = () => {
  bottomSheet.value.close()
}


const handleScrollStateChange = (isScrolled) => {
  console.log("Isscrolled????", isScrolled);
  overlayCollapsable.value = !isScrolled
  // console.log(panel.scrollTop)
};

const expandCard = (card) => {
  if (card.properties.route_sequence_id === routeStatus.activeStep) {
    expandedCard.value = card.properties.route_sequence_id;
    expandedCardData.value = card;
      myBottomSheet.value.open();
    console.log("Card should expand now.")
  } else {
    goToCardById(card.properties.route_sequence_id);
  }
};

const closeExpandedCard = () => {
  expandedCard.value = null;
  expandedCardData.value = null;
  currentCardHeight.value = initialHeight;
};

const isElementInCenter = (element, container) => {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const containerCenter = containerRect.left + containerRect.width / 2;
  return Math.abs(elementRect.left + elementRect.width / 2 - containerCenter) < elementRect.width / 3;
};

const handleScroll = () => {
  if (!cardsContainer.value) return;

  const cards = Array.from(cardsContainer.value.children);
  const centeredCard = cards.find((card) => isElementInCenter(card, cardsContainer.value));

  if (centeredCard) {
    const cardId = centeredCard.getAttribute('data-key');
    const cardIndex = cards.indexOf(centeredCard);
    isFirstCard.value = cardId === 'overview';
    isLastCard.value = cardId === 'breakdown';

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
};

const debouncedHandleScroll = () => {
  clearTimeout(window.scrollTimeout);
  window.scrollTimeout = setTimeout(handleScroll, 150);
};

const goToCardById = (cardId) => {
  if (!cardsContainer.value) return;

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

const onTouchStart = (event) => {
  startY.value = event.touches[0].clientY;
  cardTransition.value = 'none';
};

const onTouchMove = (event) => {
  const currentY = event.touches[0].clientY;
  const dragDistance = currentY - startY.value;
  if (dragDistance > 0) {
    currentCardHeight.value = Math.max(minHeight, initialHeight - dragDistance * 0.2);
  }
};

const onTouchEnd = () => {
  if (currentCardHeight.value < initialHeight - dragThreshold * 0.2) {
    currentCardHeight.value = minHeight;
    setTimeout(closeExpandedCard, 300);
  } else {
    currentCardHeight.value = initialHeight;
  }
  cardTransition.value = 'height 0.3s ease';
};

onMounted(() => {
  if (cardsContainer.value) {
    handleScroll();
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
  background-color: #f0f0f0;
}

.navigation-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 2;
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
  scroll-snap-type: x mandatory;
  gap: 1rem;
  -webkit-overflow-scrolling: touch;
  height: 100%;
    width: 100%;
    position: relative;
}

/* Card */
.card {
  flex-shrink: 0;
  scroll-snap-align: center;
  width: 50%;
  margin: 1rem 3%;
  height: 86%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card-content img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.card-content {
    padding: 1rem;
}


.overview-card {
  flex-shrink: 0;
  scroll-snap-align: center;
  width: 80%;
  max-width: 600px;
  height: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content:center ;
  cursor: pointer;
  background-color: var(--background-color-contrast);
  color: white;
}

</style>
