<template>
<div ref="mapContainer" class="map-container"></div>
</template>


<script>
import {onMounted, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import maplibre, {
  AttributionControl,
  GeolocateControl,
  NavigationControl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { log } from '../debug/debug.js';

import {useRouteInfoStore} from '../stores/routestatus.js';

import { useMapLayers, useMapHelpers, getFeaturesBoundingBox, setMap} from '../composables/useMapLayers';
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
    const { elevationTrackerPoint } = useElevationHover();
    const {zoomToFullRoute, fitMapToFeatureList} = useMapHelpers()

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
      log("Map: basemap", baseMapConfig.basemapMap[thisRouteConfig.basemap])

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
        setMap(map.value)
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

    // watch changes in topic
    watch(
        () => ([routeStatus.activeTopic, routeStatus.refreshMapTrigger]),
        ([newtopic, trig1], [oldtopic, trig2]) => {
          if (oldtopic !== newtopic) {
            log(`Map: active topic changed to: ${newtopic}`);
            if (newtopic === 'overview') {
              zoomToFullRoute()
            }
          }
          else if (trig1 !== trig2) {
            log(`Map: Refresh trigger detected`);
            if (newtopic === 'overview') {
              zoomToFullRoute()
            }
            else if (newtopic === 'route') {
              fitMapToFeatureList(routeStatus.activeStepFeatures)
            }
            else if (newtopic === 'featuredetail') {
              console.log('routeStatus.activeFeatureData', routeStatus.activeFeatureData)
              console.log('routeStatus.activeFeatureId', routeStatus.activeFeatureId )
              fitMapToFeatureList(routeStatus.activeFeatureData)
            }
          }
        }
    );

    // watch changes in alldata (on load mainly)
    watch(
        () => ([routeStatus.routeData, map.value]),
        ([newData, newMap], oldValue) => {
          if (newData && newMap) {
            log('Map: map or routedata changed -> there is both a map and routedata so we can add the routeData')
            const { renderLayers } = useMapLayers(map);
            renderLayers();

          }}
    )
    // watch changes in step id

    watch(
        () => (routeStatus.activeStepId),
        (newValue, oldValue) => {
          log('Map: active route step changed.', oldValue, 'new', newValue)
          if (newValue && routeStatus.activeTopic === 'route') {
            log('Map: zooming to active route step. Step id:', newValue, routeStatus.activeStepFeatures)
            fitMapToFeatureList(routeStatus.activeStepFeatures)
          }
        }
    )


        watch(
        () => (routeStatus.activeFeatureId),
        (newValue, oldValue) => {
          log('Map: active feature changed.', oldValue, 'new', newValue)
          if (newValue) {
            log('Map: zooming to active feature. Step feature:', newValue, routeStatus.activeFeatureData)
            fitMapToFeatureList(routeStatus.activeFeatureData)
          }
        }
    )

// Update on hover
watch(elevationTrackerPoint, (point) => {
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
