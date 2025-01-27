<template>
  <div class="cards-wrapper">
    <!-- Navigation Buttons -->
    <button v-if="!isFirstCard" id="prevBtn" @click="scrollWithButton(-1)" class="navigation-btn">‹</button>
    <button v-if="!isLastCard"id="nextBtn" @click="scrollWithButton(1)" class="navigation-btn">›</button>

    <!-- Cards Container -->
    <div
      ref="cardsContainer"
      class="cards-container"
      @scrollend="handleScroll"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div data-key="overview" class="overview-card bg-gray-800 text-white subsection-title" >
        <h1>Carretera Austral</h1> </div>
      <!-- Original Cards -->
      <div
        v-for="card in cards"
        :key="card.id"
        :data-key="card.id"
        :class="['card', { expanded: expandedCard === card.id }]"
        @click="expandCard(card)"
      >
<!--        todo: click on start and end let it scroll!-->
        <div class="text-center">
          <h3 class="text-xl font-bold">Card {{ card.id }}</h3>
          <p>Card properties here</p>
          <p class="text-gray-600">Click to expand</p>
        </div>
      </div>


    <!-- Expanded Card Overlay -->
    <div
      v-if="expandedCardData"
      class="expanded-card-overlay"
      @click.self="closeExpandedCard"
    >
      <div class="expanded-card">
        <button class="minimize-btn" @click.stop="closeExpandedCard">✕</button>
        <h2>Expanded Card {{ expandedCardData.id }}</h2>
        <p>More details about the card...</p>
        <div class="carousel-container">
          <img :src="currentImageSrc" alt="Carousel Image" class="carousel-image"/>
        </div>
        <ul>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
          <div>bla</div>
        </ul>
      </div>
    </div>
    <div data-key="breakdown" class="overview-card bg-gray-800 text-white subsection-title"><h1>The end</h1> </div>

    </div>
  </div>

</template>

<script setup>
import {ref, onMounted, watch, onUnmounted} from 'vue'
import {useRouteInfoStore} from "@/stores/routestatus.js";

const currentImageSrc = `/img/stops/1_voh/voh_air_view.JPG`;
const props = defineProps({
  cards: {
    type: Array,
    required: true
  }
})
const routeStatus = useRouteInfoStore();
const expandedCard = ref(null); // Currently expanded card ID
const expandedCardData = ref(null); // Data for the expanded card
const currentCard = ref(null)
const cardsContainer = ref(null)
const isFirstCard = ref(false)
const isLastCard = ref(false)

const emit = defineEmits(['card-changed'])

// Expand the card (show overlay)
const expandCard = (card) => {
  if (card.id === routeStatus.stopId) {

  expandedCard.value = card.id; // Track the expanded card ID
  expandedCardData.value = card; // Pass the card data to the overlay
      }
  else {
    goToCardById(card.id)
  }
};

// Close the expanded card
const closeExpandedCard = () => {
  expandedCard.value = null; // Reset the expanded card ID
  expandedCardData.value = null; // Clear the overlay data
};
const isElementInCenter = (element, container) => {
  const elementRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const containerCenter = containerRect.left + containerRect.width / 2

  const returnVal = Math.abs(elementRect.left + elementRect.width / 2 - containerCenter) < elementRect.width / 3
  return returnVal
}
const handleScroll = async () => {
  console.debug('Cardslider: handle scroll')
  if (!cardsContainer.value) return

  const cards = Array.from(cardsContainer.value.children)

  const centeredCard = cards.find(card => isElementInCenter(card, cardsContainer.value))
  if (centeredCard) {
    console.log('centeredCard', centeredCard)
    const cardId = centeredCard.getAttribute('data-key')
    const cardIndex = cards.indexOf(centeredCard)
    console.log('cardId', cardId, 'index', cardIndex)
    isFirstCard.value = cardId === 'overview'
    isLastCard.value = cardId === 'breakdown'
    console.log(isFirstCard.value)

    if (isFirstCard.value) {
        console.log('route start')
        emit('route-start')
        routeStatus.setActiveTopic('overview')

        currentCard.value = 'overview';
      }
    else if (isLastCard.value) {
        console.log('route end')
        routeStatus.setActiveTopic('overview')
        emit('route-end')
        currentCard.value = 'breakdown';
      }

    else if (currentCard.value !== cardId) {
      routeStatus.setActiveTopic('stop')

      currentCard.value = cardId
      console.log('going to ', cardId)
      emit('card-changed', cardId)
      routeStatus.setStop(cardId)

    }
  }
}

const goToCardById = (cardId) => {
  console.log('Cardslider: go to card by id', cardId)
  if (!cardsContainer.value) return

  const targetCard = Array.from(cardsContainer.value.children)
    .find(card => card.getAttribute('data-key') === cardId.toString())

  if (!targetCard) return

  const containerWidth = cardsContainer.value.offsetWidth
  const cardRect = targetCard.getBoundingClientRect()
  const scrollLeft = cardsContainer.value.scrollLeft + cardRect.left -
    (containerWidth - cardRect.width) / 2

  cardsContainer.value.scrollTo({
    left: scrollLeft,
    behavior: 'smooth'
  })
}

const scrollWithButton = (direction) => {
  console.log('scroll with button', cardsContainer.value)
  if (!cardsContainer.value) return

  const currentIndex = parseInt(currentCard.value) || 0
  let nextIndex = currentIndex + direction
  const cards = Array.from(cardsContainer.value.children)
  if (currentCard.value === 'breakdown' & direction == -1) {
    nextIndex = cards.length - 2 // because the end card is also in the container.
  }
  if (nextIndex >= 0 && nextIndex < cards.length) {
    goToCardById(cards[nextIndex].getAttribute('data-key'))
  }
}


onMounted(() => {
  console.log("Cardslider: mounted. routestatus:", routeStatus.activeTopic)
  if (cardsContainer.value) {
    console.log('cardsContainer.value', cardsContainer.value)
    //handleScroll()
    cardsContainer.value.addEventListener('scroll', () => {
      clearTimeout(window.scrollTimeout)
      window.scrollTimeout = setTimeout(handleScroll, 150)
    })
  }
  if (routeStatus.activeTopic === 'stop') {
    console.log('Cardslider: mounted, topic=stop -> go to card')
    goToCardById(routeStatus.stopId)
  }
})


// Clean up
onUnmounted(() => {
  if (window.scrollTimeout) {
    clearTimeout(window.scrollTimeout)
  }
})

  watch(
      () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
      (newTopic, oldTopic) => {
        console.log(`Cardslider: active topic changed from ${oldTopic} to ${newTopic}`);
        if (newTopic === 'stop') {
          goToCardById(routeStatus.stopId)
        }
        },
  );

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
  left: 10px;
}

#nextBtn {
  right: 10px;
}

/* Cards Container */
.cards-container {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  gap: 1rem;
  -webkit-overflow-scrolling: touch;
  height: 100%;
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

/* Expanded Card Overlay */
.expanded-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: flex-end; /* Align to the bottom */
  justify-content: center; /* Center horizontally */
  z-index: 100;
}

/* Expanded Card */
.expanded-card {
  background-color: white;
  //border-radius: 12px 12px 0 0; /* Rounded corners on the top */
  width: 100%; /* Set width to 95% */
  height: 70vh;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: scroll;
}
/* Minimize Button */
.minimize-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background-color: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.carousel-container {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.carousel-image {
  max-width: 90%; /* Makes the image max 90% of the container's width */
  height: auto; /* Adjusts height to maintain aspect ratio */
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.overview-card {

  flex-shrink: 0;
  scroll-snap-align: center;
  width: 80%;
  max-width: 600px;
  height: 100%;
  //border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content:center ;
  cursor: pointer;
}
</style>
