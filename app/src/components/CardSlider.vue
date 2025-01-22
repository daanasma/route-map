<template>
  <div v-if="isMobile" class="cards-wrapper">
    <!-- Navigation Buttons -->
    <button id="prevBtn" @click="scroll(-1)" class="navigation-btn">‹</button>
    <button id="nextBtn" @click="scroll(1)" class="navigation-btn">›</button>

    <!-- Cards Container -->
    <div
      ref="cardsContainer"
      class="cards-container"
      @scroll="handleScroll"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div class="overview-card bg-gray-800 text-white subsection-title"><h1>Route title</h1> </div>
      <div
        v-for="card in cards"
        :key="card.id"
        :class="['card', { expanded: expandedCard === card.id }]"
        @click="toggleCard(card.id, $event)"
      >
        <div class="text-center">
          <h3 class="text-xl font-bold">Card {{ card.id }}</h3>
          <p class="text-gray-600">Click to expand</p>
        </div>
        <button
          class="minimize-btn"
          v-show="expandedCard === card.id"
          @click.stop="toggleCard(card.id, $event)"
        >
          ✕
        </button>
      </div>
            <div class="overview-card bg-gray-800 text-white subsection-title"><h1>The end</h1> </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isMobile = ref(true)
const cards = ref([
  { id: 1 },
  { id: 2 },
  { id: 3 },
  { id: 4 },
  { id: 5 }
])
const expandedCard = ref(null)
const cardWidth = 44 // Set to 44% width as per your requirement
const gap = 3 // 3% gap between cards

const toggleCard = (cardId) => {
  if (expandedCard.value === cardId) {
    expandedCard.value = null
  } else {
    expandedCard.value = cardId
  }
}

const scroll = (direction) => {
  const cardsContainer = document.querySelector('.cards-container')
  const cardWidthPx = cardsContainer.offsetWidth * (cardWidth / 100)
  const scrollAmount = cardWidthPx + (cardsContainer.offsetWidth * (gap / 100))

  // Scroll by the calculated amount, ensuring smooth scroll behavior
  cardsContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' })
}

const handleScroll = () => {
  // Handle custom scroll logic
}

const handleTouchStart = () => {
  // Handle touch start logic
}

const handleTouchEnd = () => {
  // Handle touch end logic
}
</script>

<style scoped>
/* Wrapper for cards and navigation buttons */
.cards-wrapper {
  position: relative;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
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
}

/* Individual Card */
.card {
  flex-shrink: 0;
  scroll-snap-align: center;
  width: 44%;
  margin: 1rem 3%;
  height: 160px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card.expanded {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 95%;
  height: 70vh;
  z-index: 100;
  transition: all 0.3s ease;
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
  height: 250px;
  //border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
