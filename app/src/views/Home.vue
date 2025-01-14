<script setup >
import Map from '../components/Map.vue';
import Content from '../components/Content.vue';
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
</style>
