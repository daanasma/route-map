<script lang="ts">
import { onMounted, ref } from 'vue';
import maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default {
  name: 'Map',
  setup() {
    const mapContainer = ref<HTMLElement | null>(null); // Reference to map container

    onMounted(() => {
      if (!mapContainer.value) return;

      // Initialize the map
      const map = new maplibre.Map({
        container: mapContainer.value, // The div to render the map in
        style: 'https://demotiles.maplibre.org/style.json', // Map style (you can change it to a different one)
        center: [-72.5, 42], // Initial map center [lng, lat]
        zoom: 6, // Initial zoom level
      });

      // Define the route coordinates (as an example, New York to Boston)
      const routeCoordinates = [
        [-74.5, 40],
        [-73.6, 41],
        [-72.5, 42],
        [-71.1, 42.4],
      ];

      // Add the route as a line on the map
      map.on('load', () => {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates,
            },
          },
        });

        // Add a line layer for the route
        map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#ff0000', // Route line color
            'line-width': 5, // Route line width
          },
        });
      });
    });

    return {
      mapContainer,
    };
  },
};
</script>

<template>
  <div ref="mapContainer" class="w-full h-full bg-blue-200 flex items-center justify-center">
  </div>
</template>

<style scoped></style>
