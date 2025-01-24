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
      <div data-key="overview" class="overview-card bg-gray-800 text-white subsection-title" ><h1>Carretera Austral</h1> </div>
      <div
        v-for="card in cards"
        :key="card.id"
        :data-key="card.id"
        :class="['card', { expanded: expandedCard === card.id }]"
        @click="toggleCard(card.id, $event)"
      >
        <div class="text-center">
          <h3 class="text-xl font-bold">Card {{ card.id }}</h3>
          <p>card.properties</p>
          <p class="text-gray-600">Click to expand</p>
        </div>
        <button
          class="minimize-btn"
          v-show="expandedCard === card.id">
          ✕
        </button>
      </div>
      <div data-key="breakdown" class="overview-card bg-gray-800 text-white subsection-title"><h1>The end</h1> </div>

    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, watch, onUnmounted} from 'vue'
import {useRouteInfoStore} from "@/stores/routestatus.js";


const props = defineProps({
  cards: {
    type: Array,
    required: true
  }
})
const routeStatus = useRouteInfoStore();
const expandedCard = ref(null)
const currentCard = ref(null)
const cardsContainer = ref(null)
const isFirstCard = ref(false)
const isLastCard = ref(false)

const emit = defineEmits(['card-changed'])

const isElementInCenter = (element, container) => {
  const elementRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const containerCenter = containerRect.left + containerRect.width / 2
  return Math.abs(elementRect.left + elementRect.width / 2 - containerCenter) < elementRect.width / 3
}
const handleScroll = () => {
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

        currentCard.value = null;
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

const goToStart = () => {
  const firstCard = cardsContainer.value?.firstElementChild
  if (firstCard) {
    firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
const goToEnd = () => {
  const lastCard = cardsContainer.value?.lastElementChild
  if (lastCard) {
    lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
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

const toggleCard = (cardId) => {
  console.log('togglecard', cardId, routeStatus.stopId)
  if (cardId === routeStatus.stopId) {
      expandedCard.value = expandedCard.value === cardId ? null : cardId
  }
  else {
    goToCardById(cardId)
  }
}

onMounted(() => {
  if (cardsContainer.value) {
    console.log('cardsContainer.value', cardsContainer.value)
    handleScroll()
    cardsContainer.value.addEventListener('scroll', () => {
      clearTimeout(window.scrollTimeout)
      window.scrollTimeout = setTimeout(handleScroll, 150)
    })
  }
  if (routeStatus.activeTopic === 'stop') {
    goToCardById(routeStatus.stopId)
  }
})

// Clean up
onUnmounted(() => {
  if (window.scrollTimeout) {
    clearTimeout(window.scrollTimeout)
  }
})
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

/* Buttons */
.navigation-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
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
  gap: 3%;
  -webkit-overflow-scrolling: touch;
  align-items: center;
  height: 100%;
}

/* Individual Card */
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
  //transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card.expanded {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 95%;
  height: 70vh;
  z-index: 100;
  //transition: transform 0.2s ease, box-shadow 0.2s ease;
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
  justify-content: center;
  cursor: pointer;
}
</style>
