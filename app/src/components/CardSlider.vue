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
        :key="card.properties.route_sequence_id"
        :data-key="card.properties.route_sequence_id"
        :class="['card', { expanded: expandedCard === card.properties.route_sequence_id }]"
        @click="expandCard(card)"
      >
<!--        todo: click on start and end let it scroll!-->
        <div class="text-center">
          <h3 class="text-xl font-bold">{{ card.properties.title}}</h3>
          <p class="text-gray-400">Click to expand</p>
        </div>
      </div>


    <!-- Expanded Card Overlay -->
    <div
      v-if="expandedCardData"
      class="expanded-card-overlay"
      @click.self="closeExpandedCard"
    >
      <div class="expanded-card"
           :style="{ height: `${currentCardHeight}vh`, transition: cardTransition }" >
        <div class="card-title sticky-header"
        @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd">
        <button class="minimize-btn" @click.stop="closeExpandedCard">✕</button>
        <h2>{{ routeStatus.activeFeature.properties.title }}</h2>
        </div>
        <div class="card-content">

        <p>{{ routeStatus.activeFeature.properties.description }}</p>
            <img
              v-if="routeStatus.activeFeature.images?.length"
              :src="'img/' + routeStatus.activeFeature.images[0]"
              class="max-w-full h-auto rounded-lg mb-4"
              alt="Feature Image"
            >
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
            Where does it come from?

            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical
            Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at
            Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem
            Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable
            source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes
            of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular
            during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in
            section 1.10.32.
          </div>
        </div>
                  </div>

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
const startY= ref(0)
const initialHeight = 70 // default height in vh
const minHeight= 30 // minimized height in vh
const currentCardHeight= ref(70)
const cardTransition = ref("height 0.3s ease")
const dragThreshold = 100 // Threshold in pixels to trigger minimize

// Expand the card (show overlay)
const expandCard = (card) => {
  if (card.properties.route_sequence_id === routeStatus.activeStep) {

        expandedCard.value = card.properties.route_sequence_id; // Track the expanded card ID
        expandedCardData.value = card; // Pass the card data to the overlay
      }
  else {
    goToCardById(card.properties.route_sequence_id)
  }
};

// Close the expanded card
const closeExpandedCard = () => {
  expandedCard.value = null; // Reset the expanded card ID
  expandedCardData.value = null; // Clear the overlay data
  currentCardHeight.value = 70
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
    console.log('Cardslider: centeredCard', centeredCard)
    const cardId = centeredCard.getAttribute('data-key')
    const cardIndex = cards.indexOf(centeredCard)
    console.log('Cardslider: cardId', cardId, 'index', cardIndex)
    isFirstCard.value = cardId === 'overview'
    isLastCard.value = cardId === 'breakdown'
    console.log(isFirstCard.value)

    if (isFirstCard.value) {
        console.log('route start')
        routeStatus.setActiveTopic('overview', true)
        currentCard.value = 'overview';
        routeStatus.setActiveStep(null);
      }
    else if (isLastCard.value) {
        console.log('route end')
        routeStatus.setActiveTopic('overview', true)
        currentCard.value = 'breakdown';
        routeStatus.setActiveStep(null);
      }

    else if (currentCard.value !== cardId) {
      routeStatus.setActiveTopic('route')
      currentCard.value = cardId
      console.log('going to ', cardId)
      routeStatus.setActiveStep(cardIndex)

    }
  }
}

const goToCardById = (cardId) => {
  console.log('Cardslider: go to card by id', cardId)
  if (!cardsContainer.value) {
    console.log('Cardslider: no cardscontainer.. going back')
    return
  }

  const targetCard = Array.from(cardsContainer.value.children)
    .find(card => card.getAttribute('data-key') === cardId.toString())
  console.log("targetcard", targetCard)
  console.log("cardcontainer", Array.from(cardsContainer.value.children))

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

const navigateCardsWithKeyArrows = (event) => {
      if (event.key === 'ArrowLeft' && !isFirstCard.value) {
        scrollWithButton(-1);
      } else if (event.key === 'ArrowRight' && !isLastCard.value) {
        scrollWithButton(1);
      } else if (event.key === 'ArrowDown' && expandedCard.value) {
        closeExpandedCard();
      } else if (event.key === 'ArrowUp' && !expandedCard.value) {
        console.log("currentcard -> expand!!", currentCard.value)

        expandCard(props.cards[currentCard.value - 1]);
      }
    }


    const onTouchStart = (event) => {
      startY.value = event.touches[0].clientY;
      cardTransition.value = "none"; // Disable animation during drag
    }

    const onTouchMove = (event) => {
      const currentY = event.touches[0].clientY;
      const dragDistance = currentY - startY.value;
        console.log(dragDistance)

      if (dragDistance > 0) {
        // Reduce card height based on drag
        currentCardHeight.value = Math.max(
          minHeight,
          initialHeight - dragDistance * 0.2
        );
      }
    }
    const onTouchEnd = () => {
      // Restore or minimize based on drag distance
      if (currentCardHeight.value < initialHeight - dragThreshold * 0.2) {
        currentCardHeight.value = minHeight;
        setTimeout(closeExpandedCard, 300); // Close after animation
      } else {
        currentCardHeight.value = initialHeight;
      }
      cardTransition.value = "height 0.3s ease"; // Restore transition
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
  if (routeStatus.activeTopic === 'route') {
    console.log('Cardslider: mounted, topic=route -> go to card')
    goToCardById(routeStatus.activeStep)
  }

  window.addEventListener('keydown', navigateCardsWithKeyArrows);
})


// Clean up
onUnmounted(() => {
  if (window.scrollTimeout) {
    clearTimeout(window.scrollTimeout)
  }
  window.removeEventListener('keydown', navigateCardsWithKeyArrows);
})

  watch(
      () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
      (newTopic, oldTopic) => {
        console.log(`Cardslider: active topic changed from ${oldTopic} to ${newTopic}`);
        if (newTopic === 'route') {
          goToCardById(routeStatus.activeStep)
        }
        }
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
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
  transition: background-color 0.3s ease;
}
.sticky-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 100;
  border-bottom: 1px solid #e0e0e0;
  padding-top: 0.5rem;
  padding-left: 1rem;
  padding-bottom: 10px;

}

.card-content {
    padding: 1rem;

}

/* Expanded Card */
.expanded-card {
  background-color: white;
  width: 100%;
  height: 70vh;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: scroll;
  border-radius: 16px 16px 0 0;
  transition: height 0.3s ease;
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
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content:center ;
  cursor: pointer;
}
</style>
