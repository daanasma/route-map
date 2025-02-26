// src/composables/useMapLayers.js

import {ref} from 'vue';
import {useRouteInfoStore} from '../stores/routestatus.js';
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

    // const getRoutePointStyles = () => [
    //   {
    //     id: 'route-point',
    //     type: 'circle',
    //     source: 'routepoints',
    //     paint: {
    //       'circle-radius': mapConfig.layerConfigs['route-point'].radius,
    //       'circle-color': mapConfig.layerConfigs['route-point'].color,
    //     },
    //   }
    // ];

    const getRoutePointStyles = () => [
        {
            id: 'route-point',
            type: 'symbol',
            source: 'routepoints',
            layout: {
                'icon-image': [
                    'match',
                    ['get', 'poi_type'],  // Get the 'poi_type' property from GeoJSON
                    ...Object.entries(mapConfig.iconMap)
                        .flatMap(([key, value]) => [key, `${value}_${mapConfig.mainColor}`]), // Append string dynamically
                    `${mapConfig.iconMap.default}_${mapConfig.mainColor}`, // Default icon if no match is found
                ],

                'icon-size': mapConfig.sizeMapMarkers, // Adjust size if necessary
            },
        },
    ];
    const getExtraPoiStyles = () => [
        {
            id: 'extra-poi',
            type: 'symbol',
            source: 'extrapoints',
            layout: {
                'icon-image': [
                    'match',
                    ['get', 'poi_type'],  // Get the 'poi_type' property from GeoJSON
                    ...Object.entries(mapConfig.iconMap)
                        .flatMap(([key, value]) => [key, `${value}_${mapConfig.poiColor}`]), // Append string dynamically
                    `${mapConfig.iconMap.default}_${mapConfig.poiColor}`, // Default icon if no match is found
                ],
                'icon-size': mapConfig.sizeMapMarkers, // Adjust size if necessary
            },
        },
    ];

    // Function to add the layers to the map, now accepting data as parameters
    const renderLayers = () => {
        const loadedLayers = [];
        const routeLines = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'route'
            && feature.type === 'line')
        console.log('routeLines', routeLines)
        const routePoints = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'route'
            && feature.type === 'point')

        const extraPoints = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'extra'
            && feature.type === 'point')

        if (!startedLayerLoad.value) {
            startedLayerLoad.value = true;
            console.log("Start rendering all layers. lines:", routeLines, 'points:', routePoints);
            // Add route source and layers
            map.value.on('load', () => {
                // Add Route lines
                map.value.addSource('routelines', {type: 'geojson', data: ArrayToGeoJSON(routeLines)});
                getRouteLayerStyles().forEach(layer => {
                    map.value.addLayer(layer);
                    loadedLayers.push(layer.id);
                });

                // Add Route points
                map.value.addSource('routepoints', {type: 'geojson', data: ArrayToGeoJSON(routePoints)});
                getRoutePointStyles().forEach(layer => {
                    map.value.addLayer(layer);
                    loadedLayers.push(layer.id);
                })

                map.value.addSource('extrapoints', {type: 'geojson', data: ArrayToGeoJSON(extraPoints)});

                // For each feature, log its properties
              [mapConfig.poiColor, mapConfig.mainColor].forEach((color) => {

                Object.values(mapConfig.iconMap).forEach(async (icon) => {
                    let label = `${icon}_${color}`
                    let iconUrl = `../icons/${color.replace('#', 'c')}/${icon}.png`
                    //let iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/201408_cat.png'

                    console.log("start adding icon: ", label, "\t", iconUrl)
                    let image = await map.value.loadImage(iconUrl);
                    if (map.value.hasImage(label)) map.value.removeImage(label);
                    map.value.addImage(label, image.data);

                });
              })
                getExtraPoiStyles().forEach(layer => {
                    console.log('xtraPOI', layer)
                    map.value.addLayer(layer);
                });
                const layers = ['route-point', 'route-line-road', 'route-line-ferry', 'route-line'];

                loadedLayers.forEach(layer => {
                    // Add interactivity (hover, click, etc.)
                    map.value.on('mouseenter', layer, () => {
                        map.value.getCanvas().style.cursor = 'pointer';
                    });
                    map.value.on('mouseleave', layer, () => {
                        map.value.getCanvas().style.cursor = '';
                    });

                    map.value.on('click', layer, (e) => {
                        console.log('Map: Clicked on', e.features[0]);
                        // Checking if the click is near a point. If so, prioritize that.
                        if (layer.includes('route-line')) {
                            const featuresAtPoint = map.value.queryRenderedFeatures(e.point, {
                                layers: ['route-point'],
                                hitTolerance: 10
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
        }
        ;
    }

    // Fit map to the active feature
    const fitMapToFeature = (feature) => {
        const bounds = getFeatureBoundingBox(feature);
        map.value.fitBounds(bounds, {padding: mapConfig.fitBoundsPadding, maxZoom: mapConfig.maxZoom});
    };

    // Get feature bounding box
    const getFeatureBoundingBox = (feature) => {
        let coordinates = feature.geometry.coordinates;
        if (feature.type === "point") {
            coordinates = [coordinates]
        }
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
