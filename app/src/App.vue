<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import Map from './components/Map.vue';
import Content from './components/Content.vue';
</script>

<template>
    <div class="w-full h-screen flex flex-col md:flex-row">
    <!-- Map Component Section -->
    <div class="w-full md:w-7/10 h-7/10 md:h-full">
      <Map />
    </div>

    <!-- Content Component Section -->
    <div class="w-full md:w-3/10 h-3/10 md:h-full">
      <Content />
    </div>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
