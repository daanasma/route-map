<template>
  <div ref="mapContainer" class="map map-container"></div>
</template>

<script setup>
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import {fromLonLat} from 'ol/proj.js';

import { ref, onMounted } from 'vue'


const mapContainer = ref(null)
const map = ref(null)

function initializeMap() {
  if (!mapContainer.value) return
  if (map.value) return

  map.value = new Map({
    target: mapContainer.value,
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
    ],
    view: new View({
      center: fromLonLat([5, 51]),
      zoom: 12,
    }),
  })
}
onMounted(() => {
  console.log('Map: mounted', mapContainer.value);
  initializeMap();
  map.value.updateSize()
});


</script>

<style scoped>
.map {
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}

</style>
