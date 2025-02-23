// src/composables/useMapLayers.js

import { ref } from 'vue';
import { useRouteInfoStore } from '../stores/routestatus.js';
import mapConfig from '../config/mapConfig.js';
import {LngLatBounds} from "maplibre-gl"; // Import map configuration


const ArrayToGeoJSON = (featuresArray) => {
  return {
    type: 'FeatureCollection',
    features: featuresArray
  };
}

export function useMapLayers(map) {
  const routeStatus = useRouteInfoStore();
  const startedLayerLoad = ref(false);
  let hoveredStateId = null;

  const getRouteLayerStyles = () => [
    {
      id: 'route-line-ferry',
      type: 'line',
      source: 'routelines',
      filter: ['==', ['get', 'transport_type'], 'ferry'],
      paint: {
        'line-color': mapConfig.layerConfigs['route-line-ferry'].color,
        'line-width': mapConfig.layerConfigs['route-line-ferry'].width,
        'line-dasharray': mapConfig.layerConfigs['route-line-ferry'].dasharray,
      },
    },
    {
      id: 'route-line-road',
      type: 'line',
      source: 'routelines',
      filter: ['==', ['get', 'transport_type'], 'road'],
      paint: {
        'line-color': mapConfig.layerConfigs['route-line-road'].color,
        'line-width': mapConfig.layerConfigs['route-line-road'].width,
      },
    },
    {
      id: 'route-line-default',
      type: 'line',
      source: 'routelines',
      filter: ['!', ['match', ['get', 'transport_type'], ['ferry', 'road'], true, false]],
      paint: {
        'line-color': mapConfig.layerConfigs['route-line-default'].color,
        'line-width': mapConfig.layerConfigs['route-line-default'].width,
        'line-dasharray': mapConfig.layerConfigs['route-line-default'].dasharray,
      },
    },
  ];

  // Function to add the layers to the map, now accepting data as parameters
  const renderLayers = () => {
    const routeLines = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'route'
        && feature.type === 'line')
    console.log('routeLines', routeLines)
    const routePoints = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'route'
        && feature.type === 'point')
    // const routeLines = routeStatus.getFilteredFeatures('route', 'line')
    // const routePoints = routeStatus.getFilteredFeatures('route', 'point')
        const extraPoints = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'extra'
        && feature.type === 'point')

    if (!startedLayerLoad.value) {
      startedLayerLoad.value = true;
      console.log("Start rendering all layers. lines:", routeLines, 'points:', routePoints);
      console.log("map", map);
        // Add route source and layers
        map.value.on('load', () => {
          map.value.addSource('routelines', {type: 'geojson', data: ArrayToGeoJSON(routeLines)});

          // Add layer styles based on the map configuration
          getRouteLayerStyles().forEach(layer => {
            map.value.addLayer(layer);
          });

          // Add stops source and layer
          map.value.addSource('routepoints', {type: 'geojson', data: ArrayToGeoJSON(routePoints)});
          map.value.addLayer({
            id: 'route-point',
            type: 'circle',
            source: 'routepoints',
            paint: {
              'circle-radius': mapConfig.layerConfigs['route-point'].radius,
              'circle-color': mapConfig.layerConfigs['route-point'].color,
            },
          });

          const layers = ['route-point', 'route-line-road', 'route-line-ferry', 'route-line'];

          layers.forEach(layer => {
            // Add interactivity (hover, click, etc.)
            map.value.on('mouseenter', layer, () => {
              map.value.getCanvas().style.cursor = 'pointer';
            });

            map.value.on('mouseleave', layer, () => {
              map.value.getCanvas().style.cursor = '';
            });

            map.value.on('click', layer, (e) => {
              console.log('Map: Clicked on', e.features[0]);
              if (layer.includes('route-line')) {
                const featuresAtPoint = map.value.queryRenderedFeatures(e.point, {
                  layers: ['route-point'],
                });

                if (featuresAtPoint.length > 0) {
                  console.log('Map: Clicked near a point, ignoring route click handler');
                  return;
                }
                routeStatus.setActiveStep(e.features[0].properties['route_sequence_id']);
              }

              if (layer === 'route-point') {
                routeStatus.setActiveStep(e.features[0].properties['route_sequence_id']);
              }
            });

          });

          if (routeStatus.activeFeature) {
            fitMapToFeature(routeStatus.activeFeature);
          } else {
            console.log("Map: there is no active feature..");
          }
        })
  };}

  // Fit map to the active feature
  const fitMapToFeature = (feature) => {
    const bounds = getFeatureBoundingBox(feature);
    map.value.fitBounds(bounds, { padding: mapConfig.fitBoundsPadding, maxZoom: mapConfig.maxZoom });
  };

  // Get feature bounding box
  const getFeatureBoundingBox = (feature) => {
    const coordinates = feature.geometry.coordinates;
    const bounds = new LngLatBounds();
    coordinates.forEach((coord) => {
      if (Array.isArray(coord) && coord.length === 2) {
        bounds.extend(coord);
      }
    });
    return bounds;
  };

  // Return render function to be used in the component
  return {
    renderLayers,
  };
}
