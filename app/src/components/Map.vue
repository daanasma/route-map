<template>
<div ref="mapContainer" class="map-container"></div>
</template>


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
import { log } from '../debug/debug.js';

import {useRouteInfoStore} from '../stores/routestatus.js';

import {useUpdateQueryParam} from '../composables/useQueryParams';
import { useMapLayers, getFeaturesBoundingBox, fitMapToFeature} from '../composables/useMapLayers';
import { useElevationHover } from '@/composables/useElevationHover';

import mapConfig from "@/config/mapConfig.js";
import baseMapConfig from "@/config/baseMapConfig.js";

export default {
  name: 'Map',
  setup() {
    const mapContainer = ref(null);
    const route = useRoute(); // Get the current route (with query params)
    const map = ref(null); // The map instance
    const routeStatus = useRouteInfoStore();
    const { hoveredPoint } = useElevationHover();

    let hoverMarker = null;

    /**
     * Zoom the map to fit the entire route
     */

    function fitMapToBounds(bounds, options) {
      log("Map: fitting map to bounds", bounds)
      map.value.fitBounds(bounds, options);
    }
    function fitMapToFeatureList(featureList) {
      log("Fitting map to feature", featureList)
        const bounds = getFeaturesBoundingBox(featureList);
      fitMapToBounds(bounds, {
        padding: 20,
        maxZoom: mapConfig.configuredRoutes[routeStatus.mapId].maxZoomFocus}
      )
    }

    function zoomToFullRoute() {
      log('Map: zooming to full route.')
      if (routeStatus.routeData) {
        const bounds = getFeaturesBoundingBox(routeStatus.routeFeatures);
        fitMapToBounds(bounds, {
          padding: 20, // Add padding around the route
          // maxZoom: 12  // Optional: Set a max zoom level
        })
        // Fit the map to the calculated bounds
        log("Zoomed to full route!")
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
      log('Map: mounted', mapContainer.value)
      if (mapContainer.value) {
        // Initialize the map
        let thisRouteConfig = mapConfig.configuredRoutes[routeStatus.mapId];
      log("map: basemap", baseMapConfig.basemapMap[thisRouteConfig.basemap])

        map.value = new maplibre.Map({
          container: mapContainer.value,
          //style: mapStyleOutdoors,
          style: baseMapConfig.basemapMap[thisRouteConfig.basemap].url,
          center: thisRouteConfig.center, // Coordinates for Valencia, Spain
          zoom: thisRouteConfig.zoom,
          scrollZoom: {
            speed: 2, // Default is 1. Increase for faster zoom, decrease for slower zoom
            smooth: true, // Enables smooth zooming
          },
          attributionControl: false,
          renderMode: '2d' // fallback to canvas 2D
        });
        log("Map: created map")
        map.value.style.cursor = 'pointer'
        addMapControls(map.value);// Add controls
        map.value.on('load', () => {
          map.value.resize()
          if (thisRouteConfig.useHillshade) {
            addHillshadeLayer(map.value)
          }
          // Add source and layer once when map loads

        })
      }
    })

    watch(
        () => ([routeStatus.activeTopic, routeStatus.refreshMapTrigger]), // Watch the stopId in the Pinia store
        ([newtopic, trig1], [oldtopic, trig2]) => {
          if (oldtopic !== newtopic) {
            log(`Map: active topic changed to: ${newtopic}`);
            if (newtopic === 'overview') {
              zoomToFullRoute()
            }
          }
          else if (trig1 !== trig2) {
            if (newtopic === 'overview') {
              zoomToFullRoute()
            }
            else {
                          fitMapToFeatureList(routeStatus.activeStepFeatures)

            }
          }
        }
    );
    watch(
        () => ([routeStatus.routeData, map.value]),
        ([newData, newMap], oldValue) => {
          if (newData && newMap) {
            log('Map: map or routedata changed -> there is both a map and routedata so we can add the routeData')
            const { renderLayers } = useMapLayers(map);
            renderLayers();

          }}
    )
    watch(
        () => (routeStatus.activeStepId),
        (newValue, oldValue) => {
          log('Map: active feature changed.', oldValue, 'new', newValue)
          if (newValue) {
            log('Map: zooming to active feature. Step feature:', newValue)
            log('routeStatus.activeStepFeatures', routeStatus.activeStepFeatures)
            fitMapToFeatureList(routeStatus.activeStepFeatures)
          }
        }
    )

// Update on hover
watch(hoveredPoint, (point) => {
  if (point) {
    map.value.getSource('hover-point').setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        }
      }]
    });
  } else {
    map.value.getSource('hover-point').setData({
      type: 'FeatureCollection',
      features: []
    });
  }
});

    ;
    return {
      mapContainer,
    };
  },
};
</script>


<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
