<script>
import {onMounted, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import maplibre, {
  AttributionControl,
  GeolocateControl,
  GlobeControl,
  LngLatBounds,
  NavigationControl,
  Popup,
  TerrainControl
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {useCorrectBasePath} from '@/composables/useCorrectBasePath.js';

const {getFilePath} = useCorrectBasePath();
import {useRouteInfoStore} from '../stores/routestatus.js';
import {useUpdateQueryParam} from '../composables/useQueryParams';


// Load GeoJSON data asynchronously
const loadGeoJsonDataPROD = async () => {
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

const loadGeoJsonData = async () => {
  // Form correct path for GeoJSON files
  const routeGeoJsonPath = getFilePath('geojson/route.geojson.min');
  const stopsGeoJsonPath = getFilePath('geojson/stops.geojson.min');

  // Timeout utility
  const withTimeout = (promise, timeout) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeout)
      ),
    ]);

  try {
    // Fetch with timeout
    const routeData = await withTimeout(fetch(routeGeoJsonPath).then((res) => res.json()), 500);
    const stopsData = await withTimeout(fetch(stopsGeoJsonPath).then((res) => res.json()), 500);

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
    const routeStatus = useRouteInfoStore();
    let hoveredStateId = null;
    // Get the function from the composable
    const {updateQueryParam} = useUpdateQueryParam();

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
      let activeStop = routeStatus.stopId;
      // routeStatus.activeTopic = 'stop';
      routeStatus.setStop(routeStatus.stopId)

      if (activeStop) {
        findStopById(activeStop)
            .then(zoomToFeature)
            .catch(error => console.error(error.message));
      }
    }

/**
 * Calculate the bounding box for a FeatureCollection
 * @param {object} featureCollection - A GeoJSON FeatureCollection
 * @returns {maplibregl.LngLatBounds} - The bounding box for the collection
 */
function getFeatureCollectionBoundingBox(featureCollection) {
    // Extract all coordinates from all features
    const allCoordinates = featureCollection.features.flatMap(feature =>
        feature.geometry.coordinates
    );

  // Create a 'LngLatBounds' with both corners at the first coordinate.
  const bounds = new LngLatBounds(
      allCoordinates[0],
      allCoordinates[0]
  );
  // Extend the 'LngLatBounds' to include every coordinate in the bounds result.
  for (const coord of allCoordinates) {
    bounds.extend(coord);
  }

    return bounds;
}

/**
 * Calculate the bounding box for a single feature
 * @param {object} feature - A GeoJSON Feature
 * @returns {maplibregl.LngLatBounds} - The bounding box for the feature
 */
function getFeatureBoundingBox(feature) {
    const coordinates = feature.geometry.coordinates.flat(); // Extract coordinates
    const bounds = coordinates.reduce((bounds, coord) => {
        if (Array.isArray(coord) && coord.length === 2) {
            return bounds.extend(coord); // Pass valid [lng, lat]
        }
        return bounds;
    }, new LngLatBounds(coordinates[0], coordinates[0]));

    return bounds;
}

/**
 * Zoom the map to fit the entire route
 */
function zoomToFullRoute() {
    console.debug('Map: zooming to full route.')
    if (routeStatus.segmentData && routeStatus.stopData) {
        // Get bounding box for the full route
        const bounds = getFeatureCollectionBoundingBox(routeStatus.segmentData);

        // Fit the map to the calculated bounds
        map.value.fitBounds(bounds, {
            padding: 20, // Add padding around the route
            maxZoom: 12  // Optional: Set a max zoom level
        });
        console.log("Zoomed to full route!")
    }
}

    // Initialize the map when the component is mounted
    onMounted(async () => {
      // Load GeoJSON data for the route and stops
      const allData = await loadGeoJsonData();
      console.log('Map: finished loading routeData', allData)

      // Set store
      routeStatus.setSegmentData((allData.routeData))
      routeStatus.setStopData((allData.stopsData))
      routeStatus.calculateMaxIds();

      if (mapContainer.value) {
        // Initialize the map
        map.value = new maplibre.Map({
          container: mapContainer.value,
          style: 'https://tiles.openfreemap.org/styles/positron',
          center: [-72.4200, -47.4800], // Coordinates for Valencia, Spain
          zoom: 7,
          attributionControl: false

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
          if (routeStatus.activeTopic === 'overview') {
            zoomToFullRoute()
          }

          if (routeStatus.stopId) {
            console.log('routeStatus.stopId', routeStatus.stopId)
            goToActiveStop()
          }
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.value.on('mouseenter', 'stops-layer', () => {
          map.value.getCanvas().style.cursor = 'pointer';
        });

        const layers = ['stops-layer', 'route-layer']; // List of layer IDs

        layers.forEach(layer => {
          // Change the cursor to a pointer when the mouse is over the places layer.
          map.value.on('mouseenter', layer, () => {
            map.value.getCanvas().style.cursor = 'pointer'; });
          // Change it back to a pointer when it leaves.
          map.value.on('mouseleave', layer, () => {
            map.value.getCanvas().style.cursor = ''; });

        map.value.on('click', layer, (e) => {
          console.log('Clicked on', e.features[0])
          if (layer == 'route-layer') {
          const featuresAtPoint = map.value.queryRenderedFeatures(e.point, {
              layers: ['stops-layer'], // Replace with your points layer name
          });
          // If there are any features in the 'points-layer', skip handling route clicks
          if (featuresAtPoint.length > 0) {
              console.log('Clicked near a point, ignoring route click handler');
              return;
          }
          console.log('handle route here!')
          }
          if (layer == 'stops-layer') {
            routeStatus.setStop(e.features[0].id + 1)
          }
        });

        // map.value.on('mousemove', layer, (e) => {
        //   if (e.features.length > 0) {
        //     if (hoveredStateId) {
        //       map.value.setFeatureState({source: 'route', id: hoveredStateId},
        //           {hover: true}
        //       );
        //     }
        //     hoveredStateId = e.features[0].id;
        //     map.value.setFeatureState(
        //         {source: 'route', id: hoveredStateId},
        //         {hover: true}
        //     );
        //   }
        // })

        // map.value.on('mouseleave', layer, () => {
        //   if (hoveredStateId) {
        //     map.value.setFeatureState(
        //         {source: 'route', id: hoveredStateId},
        //         {hover: false}
        //     );
        //   }
        //   hoveredStateId = null;
        // });


        });

        // Add controls
        map.value.addControl(new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }));

        map.value.addControl(new NavigationControl({
          visualizePitch: true,
          visualizeRoll: true,
          showZoom: true,
          showCompass: false,

        }), 'bottom-right');
        map.value.addControl(new AttributionControl({
        compact: true,

    }), "bottom-left");
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
          console.log(`Map: Stop ID changed from ${oldStopId} to ${newStopId}`);
          if (newStopId){
          updateQueryParam('stop', newStopId)
          goToActiveStop()
          }
          // Handle any side effects or actions you need based on stopId change
        }
    );


    watch(
        () => (routeStatus.activeTopic), // Watch the stopId in the Pinia store
        (newValue, oldValue) => {
          if (oldValue !== newValue) {
            console.log(`Home: refresh needed because active topic changed to: ${newValue}`);
            if (newValue === 'overview') {
              zoomToFullRoute()
            }
          }
        }
    );


    watch(
        () => routeStatus.refreshNeeded,
        (now, before) => {
          if (routeStatus.refreshNeeded === true) {
             console.debug('Map: refreshNeeded changed', routeStatus.activeTopic, before, '-->', now)

            if (routeStatus.activeTopic === 'overview') {
            console.debug('Map: Refresh needed and routeStatus = overview.');
            zoomToFullRoute()
            }
            else{
              console.log('Map: do stuff')
            }
            routeStatus.refreshNeeded = false
          // Handle any side effects or actions you need based on stopId change
          }
        }
    );


    return {
      mapContainer,
    };
  },
};
</script>

<template>
  <div ref="mapContainer" class="w-full h-full flex items-center justify-center">

  </div>
</template>

<style scoped>

</style>
