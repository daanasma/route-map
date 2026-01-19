<template>
  <div class="app-container">
      <div class="content-section">
        <Content/>
      </div>
      <div class="map-section">
        <Map/>
      </div>
    </div>
</template>


<script setup>
import Map from '../components/Map.vue';
import Content from '../components/Panel.vue';

</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100dvh;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  /* lg breakpoint */
  .app-container {
    flex-direction: row;

  }
}

.map-section {
  width: 100%;
  height: 80%;
}

@media (min-width: 1024px) {
  .map-section {
    width: 60%;
    height: 100%;

  }
}

.content-section {
  width: 100%;
  height: 20%;
}

@media (min-width: 1024px) {
  .content-section {
    width: 40%;
    height: 100%;
  }
}
</style>
