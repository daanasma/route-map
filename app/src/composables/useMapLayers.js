// src/composables/useMapLayers.js

import {ref} from 'vue';
import {useRouteInfoStore} from '../stores/routestatus.js';
import mapConfig from '../config/mapConfig.js';
import {LngLatBounds} from "maplibre-gl"; // Import map configuration



const labelFont = {
    'text-color': '#000',
    'text-halo-color': '#fff',
    'text-halo-width': 2,
}

const ArrayToGeoJSON = (featuresArray) => {
    return {
        type: 'FeatureCollection',
        features: featuresArray.map(f => f.feature)
    };
}

/**
 * Calculate the bounding box for an array of line features
 * @param {object[]} featureArray - Array of GeoJSON LineString or MultiLineString features
 * @returns {maplibregl.LngLatBounds} - Bounding box encompassing all lines
 */
export function getFeaturesBoundingBox(featureArray) {
    const bounds = new LngLatBounds();

    featureArray.forEach(feature => {
        const theFeat = feature.feature;
        const coords = theFeat.geometry.coordinates;

        switch (theFeat.geometry.type) {
            case "Point":
                bounds.extend(coords);
                break;
            case "LineString":
                coords.forEach(coord => bounds.extend(coord));
                break;
            case "MultiLineString":
                coords.flat().forEach(coord => bounds.extend(coord));
                break;
            default:
                console.warn(`Unsupported geometry type: ${theFeat.geometry.type}`);
        }
    });
    console.log('UseMapLayers: found bounds for all features in this step', bounds)
    return bounds;
}

export function useMapLayers(map) {
    const routeStatus = useRouteInfoStore();

    const startedLayerLoad = ref(false);
    let hoveredStateId = null;

    // Fit map to the active feature
    const fitMapToFeature = (features) => {
        const bounds = getFeaturesBoundingBox(features);
        console.log(bounds)
        map.value.fitBounds(bounds, {padding: mapConfig.fitBoundsPadding, maxZoom: mapConfig.configuredRoutes[routeStatus.mapId].maxZoomFocus});
    };


    const getRouteLayerStyles = () =>
        Object.entries(mapConfig.layerConfigs).map(([id, config]) => {
            const parts = id.replace('route-line-', '').split('-'); // e.g. "road-asphalt"
            const transport_type = parts[0];
            const subtype = parts[1];

            // Build filter
            let filter;
            if (transport_type === 'default') {
                filter = ['!', ['match', ['get', 'transport_type'], ['ferry', 'road'], true, false]];
            } else if (subtype) {
                filter = ['all', ['==', ['get', 'transport_type'], transport_type], ['==', ['get', 'subtype'], subtype]];
            } else {
                filter = ['==', ['get', 'transport_type'], transport_type];
            }

            return {
                id,
                type: 'line',
                source: 'routelines',
                filter,
                paint: {
                    'line-color': config.color,
                    'line-width': config.width,
                    ...(config.dasharray && {'line-dasharray': config.dasharray}),
                    ...(config.opacity !== undefined && {'line-opacity': config.opacity}),
                },
            };
        });


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

                'icon-size': mapConfig.sizeMapMarkers,
                // Label properties
                'text-field': ['get', 'title'],  // Or any other property
                'text-font': ['Noto Sans Regular'],
                'text-size': 12,
                'text-offset': [3.5, -2.5],       // Push label above icon
                'text-anchor': 'top',          // Anchor label above point
            },
            paint: labelFont
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
    const getExtraLineStyles = () => [
        {
            id: 'route-line-ferryx',
            type: 'line',
            source: 'extralines',
            filter: ['==', ['get', 'transport_type'], 'ferry'],
            paint: {
                'line-color': mapConfig.layerConfigs['route-line-ferry'].color,
                'line-width': mapConfig.layerConfigs['route-line-ferry'].width,
                'line-dasharray': mapConfig.layerConfigs['route-line-ferry'].dasharray,
                'line-opacity': mapConfig.layerConfigs['route-line-ferry'].opacity

            },
        },
        {
            id: 'route-line-roadx-asphalt',
            type: 'line',
            source: 'extralines',
            filter: [
                'all',
                ['==', ['get', 'transport_type'], 'road'],
                ['==', ['get', 'subtype'], 'asphalt']
            ],
            paint: {
                'line-color': mapConfig.layerConfigs['route-line-road-asphalt'].color,
                'line-width': mapConfig.layerConfigs['route-line-road-asphalt'].width,
                'line-opacity': mapConfig.layerConfigs['route-line-road-asphalt'].opacity
            },
        },
        {
            id: 'route-line-roadx-cobblestones',
            type: 'line',
            source: 'extralines',
            filter: [
                'all',
                ['==', ['get', 'transport_type'], 'road'],
                ['==', ['get', 'subtype'], 'cobblestones']
            ],
            paint: {
                'line-color': mapConfig.layerConfigs['route-line-road-cobblestones'].color,
                'line-width': mapConfig.layerConfigs['route-line-road-cobblestones'].width,
                'line-opacity': mapConfig.layerConfigs['route-line-road-cobblestones'].opacity

            },
        },
        {
            id: 'route-line-defaultx',
            type: 'line',
            source: 'extralines',
            filter: [
                'all',
                ['==', ['get', 'transport_type'], 'road'],
                ['!', ['match', ['get', 'subtype'], ['asphalt', 'cobblestones'], true, false]]
            ],
            paint: {
                'line-color': mapConfig.layerConfigs['route-line-road-asphalt'].color,
                'line-width': mapConfig.layerConfigs['route-line-road-asphalt'].width,
                'line-opacity': mapConfig.layerConfigs['route-line-road-asphalt'].opacity
            },
        }
    ];

    // Function to add the layers to the map,  accepting data as parameters
    const renderLayers = () => {
        const loadedLayers = [];
        const routeLines = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'route'
            && feature.type === 'line')
        const routePoints = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'route'
            && feature.type === 'point')

        const extraPoints = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'extra'
            && feature.type === 'point')
        const extraLines = routeStatus.getFilteredAndSortedFeatures(feature => feature.topic === 'extra'
            && feature.type === 'line')

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
                map.value.addSource('extralines', {type: 'geojson', data: ArrayToGeoJSON(extraLines)});

                console.log('added sources');

                // For each feature, log its properties
                [mapConfig.poiColor, mapConfig.mainColor].forEach((color) => {
                    Object.values(mapConfig.iconMap).forEach(async (icon) => {
                        let label = `${icon}_${color}`
                        let iconUrl = `../icons/${color.replace('#', 'c')}/${icon}.png`
                        //let iconUrl = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/201408_cat.png'

                        let image = await map.value.loadImage(iconUrl);
                        if (map.value.hasImage(label)) map.value.removeImage(label);
                        map.value.addImage(label, image.data);
                    });
                })
                getExtraPoiStyles().forEach(layer => {
                    //console.log('xtraPOI', layer)
                    map.value.addLayer(layer);
                });
                getExtraLineStyles().forEach(layer => {
                    console.log('xtraline', layer)
                    map.value.addLayer(layer);
                });

                console.log('maplayers -> start adding pointers')
                const layers = ['route-point', 'route-line-road', 'route-line-ferry', 'route-line'];
                console.log("loadedLayers", loadedLayers)

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

                // Add LAbels
                console.log('routeStatus.activeFeatures', routeStatus.activeFeatures)
                if (routeStatus.activeFeatures) {
                    fitMapToFeature(routeStatus.activeFeatures);
                } else {
                    console.log("Map: there is no active feature..");
                }
                createMapLabels();

            })
        }
        ;
    }

    const createMapLabels = () => {
        map.value.addLayer({
            id: 'routelines-labels',
            type: 'symbol',
            source: 'routelines',
            layout: {
                'symbol-placement': 'line',
                'text-field': ['get', 'title'],
                'text-font': ['Noto Sans Regular'],
                'text-size': 12,
            },
            paint: labelFont,
        });
    }

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
