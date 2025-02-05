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



// Helper function to convert feature arrays to a GeoJSON FeatureCollection
const ArrayToGeoJSON = (featuresArray) => {
  return {
    type: 'FeatureCollection',
    features: featuresArray
  };
}

export default {
  name: 'Map',
  setup() {
    const mapContainer = ref(null);
    const route = useRoute(); // Get the current route (with query params)
    const startedLayerLoad = ref(false);
    const map = ref(null); // The map instance
    const routeStatus = useRouteInfoStore();
    let hoveredStateId = null;

    const renderLayers = () => {
      if (!startedLayerLoad.value) {
        const routeLines = routeStatus.getFilteredFeatures('route', 'line')
        const routePoints = routeStatus.getFilteredFeatures('route', 'point')

        startedLayerLoad.value = true;
        console.log("Start rendering all layers. lines:", routeLines, 'points:',  routePoints)
        // Add the route as a GeoJSON source
        map.value.on('load', () => {
          // Add route source and layer
          map.value.addSource('routelines', {type: 'geojson', data: ArrayToGeoJSON(routeLines)});
          map.value.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'routelines',
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
          map.value.addSource('routepoints', {type: 'geojson', data: ArrayToGeoJSON(routePoints)});
          map.value.addLayer({
            id: 'route-point',
            type: 'circle',
            source: 'routepoints',
            paint: {
              'circle-radius': 8,
              'circle-color': '#065809', // Green color for stops
            },
          })

          const layers = ['route-point', 'route-line']; // List of layer IDs

          layers.forEach(layer => {
            // Change the cursor to a pointer when the mouse is over the places layer.
            map.value.on('mouseenter', layer, () => {
              map.value.getCanvas().style.cursor = 'pointer';
            });
            // Change it back to a pointer when it leaves.
            map.value.on('mouseleave', layer, () => {
              map.value.getCanvas().style.cursor = '';
            });

            map.value.on('click', layer, (e) => {
              console.log('Map: Clicked on', e.features[0])
              if (layer == 'route-line') {
                const featuresAtPoint = map.value.queryRenderedFeatures(e.point, {
                  layers: ['route-point'],
                });
                // If there are any features in the 'points-layer', skip handling route clicks
                if (featuresAtPoint.length > 0) {
                  console.log('Map: Clicked near a point, ignoring route click handler');
                  return;
                }
                routeStatus.setActiveStep(e.features[0].properties['route_sequence_id'])
              }
              if (layer == 'route-point') {
                routeStatus.setActiveStep(e.features[0].properties['route_sequence_id'])
              }
            });

            map.value.on('mousemove', layer, (e) => {
              if (e.features.length > 0) {
                if (hoveredStateId) {
                  map.value.setFeatureState({source: 'routelines', id: hoveredStateId},
                      {hover: true}
                  );
                }
                hoveredStateId = e.features[0].id;
                map.value.setFeatureState(
                    {source: 'routelines', id: hoveredStateId},
                    {hover: true}
                );
              }
            })

            map.value.on('mouseleave', layer, () => {
              if (hoveredStateId) {
                map.value.setFeatureState(
                    {source: 'routelines', id: hoveredStateId},
                    {hover: false}
                );
              }
              hoveredStateId = null;
            });



          })
        })
       if (routeStatus.activeFeature) {
         fitMapToFeature(routeStatus.activeFeature)
       }
       else {
         console.log("Map: there is no active feature..")
       }
      }
    }

    /**
     * Calculate the bounding box for a FeatureCollection
     * @param {object} featureCollection - A GeoJSON FeatureCollection
     * @returns {maplibregl.LngLatBounds} - The bounding box for the collection
     */
    function getFeatureCollectionBoundingBox(featureCollection) {
      console.log('featureCollection', featureCollection)
      // Extract all coordinates from all features
      const allCoordinates = featureCollection.flatMap(feature =>
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
      fitMapToBounds(bounds, {padding: 20, maxZoom: 12})
    }

    function zoomToFullRoute() {
      console.debug('Map: zooming to full route.')
      if (routeStatus.routeData) {
        // Get bounding box for the full route
        const routeFeatures = routeStatus.getFilteredFeatures('route', 'line');
        const bounds = getFeatureCollectionBoundingBox(routeFeatures);
        // todo this might be a problem if there are points outside.
        fitMapToBounds(bounds, {
          padding: 20, // Add padding around the route
          maxZoom: 12  // Optional: Set a max zoom level
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
  const mapStyleOutdoors= {
            'version': 8,
            'sources': {
                'raster-tiles': {
                    'type': 'raster',
                    'tiles': [
                        'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=fb850d9821794c8294f74fea04afc0f0' // todo clean this up!
                    ],
                    'tileSize': 256,
                    'attribution':
                        '<a href="https://www.thunderforest.com/" target="_blank">&copy; Thunderforest</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
                }
            },
            'layers': [
                {
                    'id': 'simple-tiles',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 0,
                    'maxzoom': 22
                }
            ]
        }

    // Initialize the map when the component is mounted
    onMounted(async () => {
      console.log('mounted', mapContainer.value)
      if (mapContainer.value) {
        // Initialize the map
        map.value = new maplibre.Map({
          container: mapContainer.value,
          style: mapStyleOutdoors,
          // style: 'https://tiles.openfreemap.org/styles/positron',
          center: [-72.4200, -47.4800], // Coordinates for Valencia, Spain
          zoom: 7,
          attributionControl: false,
          renderMode: '2d' // fallback to canvas 2D

        });
        console.log("Map: created map")
        map.value.style.cursor = 'pointer'
        addMapControls(map.value);// Add controls



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
            renderLayers()
          }
        }
    )
    watch(
        () => (routeStatus.activeFeature),
        (newValue, oldValue) => {
          console.log('Map: active feature changed.')
          if (newValue) {
            console.log('Map: zooming to active feature. Step feature:', newValue)
            fitMapToFeature(routeStatus.activeFeature)
            // zoomToFeature(routeStatus.activeFeature)
            //renderLayers(newValue)
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
  <div ref="mapContainer" class="w-full h-full flex items-center justify-center">

  </div>
</template>

<style scoped>

</style>
