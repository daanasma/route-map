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

import {useRouteInfoStore} from '../stores/routestatus.js';
import {useUpdateQueryParam} from '../composables/useQueryParams';
import { useMapLayers } from '../composables/useMapLayers';
import mapConfig from "@/config/mapConfig.js";
import basemapConfig from "@/config/basemapConfig.js";

// Helper function to convert feature arrays to a GeoJSON FeatureCollection

export default {
  name: 'Map',
  setup() {
    const mapContainer = ref(null);
    const route = useRoute(); // Get the current route (with query params)
    const startedLayerLoad = ref(false);
    const map = ref(null); // The map instance
    const routeStatus = useRouteInfoStore();
    let hoveredStateId = null;


    /**
     * Calculate the bounding box for a FeatureCollection
     * @param {object} featureCollection - A GeoJSON FeatureCollection
     * @returns {maplibregl.LngLatBounds} - The bounding box for the collection
     */
    function getFeatureCollectionBoundingBox(featureCollection) {
      console.log('featureCollection', featureCollection)
      // Extract all coordinates from all features
      const allCoordinates = featureCollection.flatMap(feature =>
          feature.feature.geometry.coordinates
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
      const coordinates = feature.geometry.coordinates; // Extract coordinates
      // Initialize an empty LngLatBounds object
  // Initialize an empty bounds object
  const bounds = new LngLatBounds();

  if (feature.geometry.type === "Point") {
    // Directly extend the bounds with the single point
    bounds.extend(coordinates);
  } else {
    // Reduce for multi-coordinate features
    coordinates.forEach((coord) => {
      if (Array.isArray(coord) && coord.length === 2) {
        bounds.extend(coord);
      }
    });
  }      return bounds;
    }


    /**
     * Zoom the map to fit the entire route
     */

    function fitMapToBounds(bounds, options) {
      console.log("fitting map to bounds", bounds)
      map.value.fitBounds(bounds, options);
    }
    function fitMapToFeature(feature) {
      console.log("Fitting map to feature", feature)
        const bounds = getFeatureBoundingBox(feature);
      console.log("GOT BOUNDS", bounds)
      fitMapToBounds(bounds, {
        padding: 20,
        maxZoom: mapConfig.configuredRoutes[routeStatus.mapId].maxZoomFocus})
    }

    function zoomToFullRoute() {
      console.debug('Map: zooming to full route.')
      if (routeStatus.routeData) {
        // Get bounding box for the full route
        const routeFeatures = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'route'
        && feature.type === 'line')

        const bounds = getFeatureCollectionBoundingBox(routeFeatures);
        // todo this might be a problem if there are points outside.
        fitMapToBounds(bounds, {
          padding: 20, // Add padding around the route
          // maxZoom: 12  // Optional: Set a max zoom level
        })
        // Fit the map to the calculated bounds
        console.log("Zoomed to full route!")
      }
    }

    function addMapControls(map) {
      map.addControl(new GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }));
        map.addControl(new NavigationControl({
          visualizePitch: true,
          visualizeRoll: true,
          showZoom: true,
          showCompass: false,

        }), 'bottom-right');
        map.addControl(new AttributionControl({
          compact: true,
        }), "top-left");

    }

    function addHillshadeLayer(map) {
      if (!map) return

      // avoid adding it twice
      if (map.getLayer('hillshade')) return

      // add raster-dem source
      map.addSource('hillshadeSource', {
        type: 'raster-dem',
        tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
        encoding: 'terrarium', // or 'mapbox' depending on source
        tileSize: 512,
        attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
        maxzoom: 14 // stop requesting tiles beyond zoom 14
      })

      // add hillshade layer
      map.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'hillshadeSource',
        paint: {
          'hillshade-exaggeration': 1, // adjust vertical exaggeration
          'hillshade-shadow-color': '#000000',
          'hillshade-highlight-color': '#FFFFFF',
          'hillshade-accent-color': '#000000',
          'hillshade-illumination-direction': 335
        },
      })
    }


    // Initialize the map when the component is mounted
    onMounted(async () => {
      console.log('Map: mounted', mapContainer.value)
      if (mapContainer.value) {
        // Initialize the map
        let thisRouteConfig = mapConfig.configuredRoutes[routeStatus.mapId];
      console.log("map: basemap", basemapConfig.basemapMap[thisRouteConfig.basemap])

        map.value = new maplibre.Map({
          container: mapContainer.value,
          //style: mapStyleOutdoors,
          style: basemapConfig.basemapMap[thisRouteConfig.basemap].url,
          center: thisRouteConfig.center, // Coordinates for Valencia, Spain
          zoom: thisRouteConfig.zoom,
          scrollZoom: {
            speed: 2, // Default is 1. Increase for faster zoom, decrease for slower zoom
            smooth: true, // Enables smooth zooming
          },
          attributionControl: false,
          renderMode: '2d' // fallback to canvas 2D
        });
        console.log("Map: created map")
        map.value.style.cursor = 'pointer'
        addMapControls(map.value);// Add controls
        map.value.on('load', () => {
          map.value.resize()
          zoomToFullRoute()
          if (thisRouteConfig.useHillshade) {
            addHillshadeLayer(map.value)
          }

        })
      }
    })

    watch(
        () => ([routeStatus.activeTopic, routeStatus.refreshNeeded]), // Watch the stopId in the Pinia store
        ([newtopic, refreshneeded], [oldtopic, oldrefreshneeded]) => {
          if (oldtopic !== newtopic || refreshneeded) {
            console.log(`Map: refresh needed because active topic changed to: ${newtopic}`);
            if (newtopic === 'overview' & refreshneeded) {
              zoomToFullRoute()
              routeStatus.refreshNeeded = false;
            }
          }
        }
    );
    watch(
        () => ([routeStatus.routeData, map.value]),
        ([newData, newMap], oldValue) => {
          console.log('Map: map or routedata changed.')
          if (newData && newMap) {
            console.log('Map: there is a map so we can add the routeData')
            const { renderLayers } = useMapLayers(map);
            renderLayers();
          }}
    )
    watch(
        () => (routeStatus.activeFeature),
        (newValue, oldValue) => {
          console.log('Map: active feature changed.')
          if (newValue) {
            console.log('Map: zooming to active feature. Step feature:', newValue)
            fitMapToFeature(routeStatus.activeFeature)
          }
        }
    )
    ;


    return {
      mapContainer,
    };
  },
};
</script>

<template>
<div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
