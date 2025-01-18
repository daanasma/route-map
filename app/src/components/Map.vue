<script>
import {onMounted, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import maplibre, {GeolocateControl, GlobeControl, TerrainControl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useCorrectBasePath} from '@/composables/useCorrectBasePath.js';

const {getFilePath} = useCorrectBasePath();
import {useRouteInfoStore} from '../stores/routestatus.js';
import { useUpdateQueryParam } from '../composables/useQueryParams';



// Load GeoJSON data asynchronously
const loadGeoJsonData = async () => {
  // Form correct path for GeoJSON files
  const routeGeoJsonPath = getFilePath('geojson/route.geojson.min');
  const stopsGeoJsonPath = getFilePath('geojson/stops.geojson.min');

  try {
    const routeData = await fetch(routeGeoJsonPath).then((res) => res.json());
    const stopsData = await fetch(stopsGeoJsonPath).then((res) => res.json());

    return {routeData, stopsData};
  } catch (err) {
    console.error('Error loading GeoJSON data', err);
    return {routeData: null, stopsData: null};
  }
};


export default {
  name: 'Map',
  setup() {
    const mapContainer = ref(null);
    const route = useRoute(); // Get the current route (with query params)
    const map = ref(null); // The map instance
    const mapLoaded = ref(false); // Flag to check if map and component are fully loaded
    const routeStatus = useRouteInfoStore();
    let hoveredStateId = null;
    // Get the function from the composable
    const { updateQueryParam } = useUpdateQueryParam();

    function findStopById(stopId) {
      return new Promise((resolve, reject) => {
        const stop = routeStatus.stopData.features.find((stop) => stop.properties.index == stopId);
        if (stop) {
          resolve(stop); // Resolve with the stop
        } else {
          reject(new Error(`Stop with ID ${stopId} not found`)); // Reject if not found
        }
      })
    }

    function zoomToFeature(feature) {
      const coordinates = feature.geometry.coordinates; // Get feature coordinates
      map.value.flyTo({
        center: coordinates,
        zoom: 10, // Adjust zoom level as needed
        essential: true, // This ensures the animation respects user preferences
      });
    }

    function goToActiveStop() {
      let activeStop = routeStatus.stopId
      if (activeStop) {
        findStopById(activeStop)
            .then(zoomToFeature)
            .catch(error => console.error(error.message));
      }

    }

    // Initialize the map when the component is mounted
    onMounted(async () => {
      // Load GeoJSON data for the route and stops
      const allData = await loadGeoJsonData();
      console.log('routeData', allData)

      // Set store
      routeStatus.segmentData = allData.routeData
      routeStatus.stopData = allData.stopsData
      routeStatus.calculateMaxIds();

      if (mapContainer.value) {
        // Initialize the map
        map.value = new maplibre.Map({
          container: mapContainer.value,
          style: 'https://tiles.openfreemap.org/styles/positron',
          center: [-72.4200, -48.4800], // Coordinates for Valencia, Spain
          zoom: 9,

        });
        map.value.style.cursor = 'pointer'

        // Add the route as a GeoJSON source
        map.value.on('load', () => {
          // Add route source and layer
          map.value.addSource('route', {type: 'geojson', data: routeStatus.segmentData});
          map.value.addLayer({
            id: 'route-layer',
            type: 'line',
            source: 'route',
            paint: {
              'line-color': '#082305',
              'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    8,
                    5
                ],
              'line-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    0.6,
                    0.4
                ]
            },
          });

          // Add stops source and layer
          map.value.addSource('stops', {type: 'geojson', data: routeStatus.stopData});
          map.value.addLayer({
            id: 'stops-layer',
            type: 'circle',
            source: 'stops',
            paint: {
              'circle-radius': 8,
              'circle-color': '#065809', // Green color for stops
            },
          })



          mapLoaded.value = true;

          if (routeStatus.stopId) {
            console.log('routeStatus.stopId', routeStatus.stopId)
            goToActiveStop()
          }
        });
        map.value.on('mousemove', 'route-layer', (e) => {
          if (e.features.length > 0) {
            if (hoveredStateId) {
              map.value.setFeatureState( {source: 'route', id: hoveredStateId},
                  {hover: true}
              );
            }
            hoveredStateId = e.features[0].id;
            map.value.setFeatureState(
                    {source: 'route', id: hoveredStateId},
                    {hover: true}
                );
          }
        })
        map.value.on('mouseleave', 'route-layer', () => {
            if (hoveredStateId) {
                map.value.setFeatureState(
                    {source: 'route', id: hoveredStateId},
                    {hover: false}
                );
            }
            hoveredStateId = null;
        });

        // Add controls
        map.value.addControl(new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }));

        // Experiment
        /*
                map.value.addControl(new GlobeControl())
                // Use a different source for terrain and hillshade layers, to improve render quality
                map.value.addSource('terrainSource', {
                  type: 'raster-dem',
                  url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
                  tileSize: 256
                })
                map.value.addSource('hillshadeSource', {
                  type: 'raster-dem',
                  url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
                  tileSize: 256
                })
                map.value.addLayer({
                  id: 'hills',
                  type: 'hillshade',
                  source: 'hillshadeSource',
                  layout: {visibility: 'visible'},
                  paint: {'hillshade-shadow-color': '#473B24'}
                })
                map.value.addControl(new TerrainControl({
                  source: "terrainSource"
                }));
        */
      }
    })

    // Watch for changes in the query parameters (stopId)
    watch(
        () => routeStatus.stopId, // Watch the stopId in the Pinia store
        (newStopId, oldStopId) => {
          console.log(`Stop ID changed from ${oldStopId} to ${newStopId}`);
          updateQueryParam('stop', newStopId)
          console.log('Do something in the map')
          goToActiveStop()

          // Handle any side effects or actions you need based on stopId change
        }
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

<style scoped>

</style>
