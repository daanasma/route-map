<template>
  <div class="cards-wrapper">
    <!-- Navigation Buttons -->
    <button @click="scroll(-1)" class="navigation-btn">Previous</button>
    <button @click="scroll(1)" class="navigation-btn">Next</button>

    <!-- Cards Container -->
    <div
      ref="cardsContainer"
      class="flex overflow-x-scroll snap-x snap-mandatory space-x-4"
      @scroll="handleScroll"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div
        v-for="card in cards"
        :key="card.id"
        :id="`card-${card.id}`"
        :class="['scroll-snap-center card-transition flex-shrink-0 w-[90vw] h-32 bg-white ' +
         'rounded-lg shadow-md flex items-center justify-center cursor-pointer hover:shadow-lg', { expanded: expandedCard === card.id }]"
        @click="toggleCard(card.id, $event)"
      >
        <div class="text-center">
          <h3 class="text-xl font-bold">Card {{ card.title }}</h3>
          <p class="text-gray-600">{{ card.description }}</p>
        </div>
        <button
          class="minimize-btn hidden absolute top-4 right-4
          bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center"
          v-show="expandedCard === card.id"
          @click.stop="toggleCard(card.id, $event)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'CardSlider',
  props: {
    cards: {
      type: Array,
      required: true,
    },
    isMobile: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const cardsContainer = ref(null);
    const expandedCard = ref(null);
    const touchStartX = ref(0);
    let scrollTimeout;

    const scroll = (direction) => {
      const container = cardsContainer.value;
      const scrollAmount = container.offsetWidth * 0.9;
      container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    };

    const toggleCard = (cardId) => {
      expandedCard.value = expandedCard.value === cardId ? null : cardId;
    };

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const container = cardsContainer.value;
        const scrollLeft = container.scrollLeft;
        const cardWidth = container.offsetWidth * 0.9;
        const targetScroll = Math.round(scrollLeft / cardWidth) * cardWidth;
        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        });
      }, 150);
    };

    const handleTouchStart = (e) => {
      touchStartX.value = e.touches[0].pageX;
    };

    const handleTouchEnd = (e) => {
      const diffX = touchStartX.value - e.changedTouches[0].pageX;
      const container = cardsContainer.value;
      const cardWidth = container.offsetWidth * 0.9;
      const currentScroll = container.scrollLeft;
      let targetScroll;

      if (Math.abs(diffX) > 50) {
        targetScroll =
          diffX > 0
            ? Math.ceil(currentScroll / cardWidth) * cardWidth
            : Math.floor(currentScroll / cardWidth) * cardWidth;
      } else {
        targetScroll = Math.round(currentScroll / cardWidth) * cardWidth;
      }

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    };

    return {
      cardsContainer,
      expandedCard,
      touchStartX,
      scroll,
      toggleCard,
      handleScroll,
      handleTouchStart,
      handleTouchEnd,
    };
  },
};
</script>

<style scoped>
.cards-wrapper {
  position: relative;
}

.navigation-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  background: gray;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  cursor: pointer;
}

.navigation-btn:first-of-type {
  left: 0;
}

.navigation-btn:last-of-type {
  right: 0;
}

.flex {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 1rem;
  padding: 1rem;
}

.scroll-snap-center {
  scroll-snap-align: center;
}

.card-transition {
  transition: all 0.3s ease-in-out;
}

.expanded {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 70vh;
  z-index: 100;
}

.minimize-btn {
  display: none;
}

.expanded .minimize-btn {
  display: flex;
}
</style>
