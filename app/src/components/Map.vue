<script>
import {onMounted, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useCorrectBasePath} from '@/composables/useCorrectBasePath.js';

const {getFilePath} = useCorrectBasePath();
import { useRouteStatusStore } from '../stores/routestatus.js';



    // Load GeoJSON data asynchronously
const loadGeoJsonData = async () => {
  // Form correct path for GeoJSON files
  const routeGeoJsonPath = getFilePath('geojson/route.geojson');
  const stopsGeoJsonPath = getFilePath('geojson/stops.geojson');

  try {
    const routeData = await fetch(routeGeoJsonPath).then((res) => res.json());
    const stopsData = await fetch(stopsGeoJsonPath).then((res) => res.json());

    return { routeData, stopsData };
  } catch (err) {
    console.error('Error loading GeoJSON data', err);
    return { routeData: null, stopsData: null };
  }
};


export default {
  name: 'Map',
  setup() {
    const mapContainer = ref(null);
    const route = useRoute(); // Get the current route (with query params)
    const map = ref(null); // The map instance
    const mapLoaded = ref(false); // Flag to check if map and component are fully loaded
    const routeStatus = useRouteStatusStore();

    // Initialize the map when the component is mounted
    onMounted(async () => {
      // Load GeoJSON data for the route and stops
      const { routeData, stopsData } = await loadGeoJsonData();
      console.log('routeData')
      console.log(routeData)
        if (mapContainer.value) {
          // Initialize the map
          map.value = new maplibre.Map({
            container: mapContainer.value,
            style: 'https://tiles.openfreemap.org/styles/positron',
            center: [-0.3815, 39.4735], // Coordinates for Valencia, Spain
            zoom: 14,
          });


          // Add the route as a GeoJSON source
          map.value.on('load', () => {
            // Add route source and layer
            map.value.addSource('route', {type: 'geojson', data: routeData});
            map.value.addLayer({
              id: 'route-layer',
              type: 'line',
              source: 'route',
              paint: {
                'line-color': '#ff0000',
                'line-width': 5,
              },
            });

            // Add stops source and layer
            map.value.addSource('stops', {type: 'geojson', data: stopsData});
            map.value.addLayer({
              id: 'stops-layer',
              type: 'circle',
              source: 'stops',
              paint: {
                'circle-radius': 8,
                'circle-color': '#00ff00', // Green color for stops
              },
            })
            mapLoaded.value = true;
          });
        }
      })

    // Watch for changes in the query parameters (stopId)
    watch(
      () => routeStatus.stopId, // Watch the stopId in the Pinia store
      (newStopId, oldStopId) => {
        console.log(`Stop ID changed from ${oldStopId} to ${newStopId}`);
        console.log('Do something in the map')
        // Handle any side effects or actions you need based on stopId change
      }
    );

    // Function to find a stop by its ID
    function findStopById(stopId) {
      console.log('going to stop!')
      //const stopsData = map.value.getSource('stops')
      console.log(stopsData)
      return stopsData.find((stop) => stop.properties.id === stopId);
    }
    return {
      mapContainer,
    };
  },
};
</script>

<template>
  <div ref="mapContainer" class="w-full h-full bg-blue-200 flex items-center justify-center">
    <!-- Map container remains the same -->
  </div>
</template>

<style scoped>
/* Kept the original CSS intact */
</style>
