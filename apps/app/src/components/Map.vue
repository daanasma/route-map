<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import maplibre, {
  AttributionControl,
  GeolocateControl,
  NavigationControl,
} from 'maplibre-gl';
import ZoomToRouteControl from '../utils/maplibre/ZoomToRouteControl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { log } from '../debug/debug.js';
import { useRouteInfoStore } from '../stores/routestatus.js';
import {
  useMapLayers,
  useMapHelpers,
  setMap,
} from '../composables/useMapLayers';
import { useElevationHover } from '@/composables/useElevationHover';
import mapConfig from '@/config/mapConfig.js';
import baseMapConfig from '@/config/baseMapConfig.js';

const mapContainer = ref(null);
const route = useRoute();
const map = ref(null);
const routeStatus = useRouteInfoStore();
const { elevationTrackerPoint } = useElevationHover();
const { zoomToFullRoute, fitMapToFeatureList } = useMapHelpers();

function addMapControls(mapInstance) {
  mapInstance.addControl(
    new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    })
  );

  mapInstance.addControl(
    new NavigationControl({
      visualizePitch: true,
      visualizeRoll: true,
      showZoom: true,
      showCompass: false,
    }),
    'bottom-right'
  );

  mapInstance.addControl(
    new AttributionControl({
      compact: true,
    }),
    'top-left'
  );

  mapInstance.addControl(new ZoomToRouteControl(zoomToFullRoute), 'top-right');
}

function addHillshadeLayer(mapInstance) {
  if (!mapInstance || mapInstance.getLayer('hillshade')) return;

  mapInstance.addSource('hillshadeSource', {
    type: 'raster-dem',
    tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
    encoding: 'terrarium',
    tileSize: 512,
    attribution: '<a href="https://mapterhorn.com/attribution">© Mapterhorn</a>',
    maxzoom: 14,
  });

  mapInstance.addLayer({
    id: 'hillshade',
    type: 'hillshade',
    source: 'hillshadeSource',
    paint: {
      'hillshade-exaggeration': 1,
      'hillshade-shadow-color': '#000000',
      'hillshade-highlight-color': '#FFFFFF',
      'hillshade-accent-color': '#000000',
      'hillshade-illumination-direction': 335,
    },
  });
}

function initializeMap() {
  if (!mapContainer.value) return;

  const thisRouteConfig = mapConfig.configuredRoutes[routeStatus.mapId];
  log('Map: basemap', baseMapConfig.basemapMap[thisRouteConfig.basemap]);

  map.value = new maplibre.Map({
    container: mapContainer.value,
    style: baseMapConfig.basemapMap[thisRouteConfig.basemap].url,
    center: thisRouteConfig.center,
    zoom: thisRouteConfig.zoom,
    scrollZoom: {
      speed: 2,
      smooth: true,
    },
    attributionControl: false,
    renderMode: '2d',
  });

  log('Map: created map');
  setMap(map.value);
  map.value.style.cursor = 'pointer';
  addMapControls(map.value);

  map.value.on('load', () => {
    map.value.resize();
    if (thisRouteConfig.useHillshade) {
      addHillshadeLayer(map.value);
    }
  });
}

onMounted(() => {
  log('Map: mounted', mapContainer.value);
  initializeMap();
});

// Watch active topic and refresh trigger
watch(
  () => [routeStatus.activeTopic, routeStatus.refreshMapTrigger],
  ([newTopic, newTrigger], [oldTopic, oldTrigger]) => {
    const topicChanged = oldTopic !== newTopic;
    const triggerChanged = newTrigger !== oldTrigger;

    if (topicChanged) {
      log(`Map: active topic changed to: ${newTopic}`);

      if (newTopic === 'overview') {
        zoomToFullRoute();
      } else if (newTopic === 'route' && oldTopic === 'featuredetail') {
        fitMapToFeatureList(routeStatus.activeStepFeatures);
      }
    } else if (triggerChanged) {
      log('Map: Refresh trigger detected');

      if (newTopic === 'overview') {
        zoomToFullRoute();
      } else if (newTopic === 'route') {
        fitMapToFeatureList(routeStatus.activeStepFeatures);
      } else if (newTopic === 'featuredetail') {
        log('routeStatus.activeFeatureData', routeStatus.activeFeatureData);
        fitMapToFeatureList(routeStatus.activeFeatureData);
      }
    }
  }
);

// Watch route data and map initialization
watch(
  () => [routeStatus.routeData, map.value],
  ([newData, newMap]) => {
    if (newData && newMap) {
      log('Map: map or routedata changed -> there is both a map and routedata so we can add the routeData');
      const { renderLayers } = useMapLayers(map);
      renderLayers();
    }
  }
);

// Watch active step changes
watch(
  () => routeStatus.activeStepId,
  (newValue, oldValue) => {
    log('Map: active route step changed.', oldValue, 'new', newValue);

    if (newValue && routeStatus.activeTopic === 'route') {
      log('Map: zooming to active route step. Step id:', newValue, routeStatus.activeStepFeatures);
      fitMapToFeatureList(routeStatus.activeStepFeatures);
    }
  }
);

// Watch active feature changes
watch(
  () => routeStatus.activeFeatureId,
  (newValue, oldValue) => {
    log('Map: active feature changed.', oldValue, 'new', newValue);

    if (newValue) {
      log('Map: zooming to active feature. Step feature:', newValue, routeStatus.activeFeatureData);
      fitMapToFeatureList(routeStatus.activeFeatureData);
    }
  }
);

// Watch elevation hover point
watch(elevationTrackerPoint, (point) => {
  if (!map.value) return;

  const hoverSource = map.value.getSource('hover-point');
  if (!hoverSource) return;

  hoverSource.setData({
    type: 'FeatureCollection',
    features: point
      ? [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [point.lng, point.lat],
            },
          },
        ]
      : [],
  });
});
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
