<script>
import {onMounted, ref} from 'vue';
import { useCorrectBasePath } from '@/composables/useCorrectBasePath.js';


import maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
const { getFilePath } = useCorrectBasePath();

// Form correct path for GeoJSON files
const routeGeoJsonPath = getFilePath('geojson/route.geojson');  // Form path for route GeoJSON
const stopsGeoJsonPath = getFilePath('geojson/stops.geojson');  // Form path for stops GeoJSON


export default {
  name: 'Map',
  setup() {
    const mapContainer = ref(null);
          console.log('in map before mount')

    onMounted(async () => {
      console.log('in map')
      if (mapContainer.value) {
      // Initialize the map
      const map = new maplibre.Map({
        container: mapContainer.value, // The div to render the map in

      style: 'https://tiles.openfreemap.org/styles/positron',
        center: [-0.3815, 39.4735], // Coordinates for Valencia, Spain
        zoom: 14,
      });
  // Log the paths to verify
    console.log('Route GeoJSON Path:', routeGeoJsonPath);
    console.log('Stops GeoJSON Path:', stopsGeoJsonPath);
      // Load GeoJSON data for the route
      const routeData = await fetch(routeGeoJsonPath).then((res) => res.json());
      const stopsData = await fetch(stopsGeoJsonPath).then((res) => res.json());

      // Add the route to the map
      map.on('load', () => {
        // Add the route as a GeoJSON source
        map.addSource('route', {
          type: 'geojson',
          data: routeData,
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

        // Add the stops as a GeoJSON source
        map.addSource('stops', {
          type: 'geojson',
          data: stopsData,
        });

        // Add a point layer for the stops
        map.addLayer({
          id: 'stops-layer',
          type: 'circle',
          source: 'stops',
          paint: {
            'circle-radius': 8,
            'circle-color': '#00ff00', // Stop color
          },
        });
      });
    }}
    );


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
