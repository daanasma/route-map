// src/composables/useMapLayers.js

import {ref} from 'vue';
import {useRouteInfoStore} from '../stores/routestatus.js';
import mapConfig from '../config/mapConfig.js';
import {LngLatBounds} from "maplibre-gl"; // Import map configuration
import { log } from '@/debug/debug.js';

const mapRef = ref(null)
const labelFont = {
    'text-color': '#000',
    'text-halo-color': '#fff',
    'text-halo-width': 2,
}

export function setMap(mapInstance) {
  mapRef.value = mapInstance;
}

export function useMapHelpers() {
  const routeStatus = useRouteInfoStore();
    function fitMapToFeatureList(features) {
        if (!mapRef.value || !routeStatus.routeData) return;
        const bounds = getFeaturesBoundingBox(features);
        mapRef.value.fitBounds(bounds,
            {
                padding: mapConfig.fitBoundsPadding,
                maxZoom: mapConfig.configuredRoutes[routeStatus.mapId].maxZoomFocus
            });
        log('Fit map to bounds of provided features list')
    };

    function zoomToFullRoute() {
      log('Map: zooming to full route.')
        fitMapToFeatureList(routeStatus.routeFeatures);
        log("Zoomed to full route!")
      };

  return { zoomToFullRoute, fitMapToFeatureList };
}
const ArrayToGeoJSON = (features) => {
    return {
        type: 'FeatureCollection',
        features
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
        const coords = feature.geometry.coordinates;

        switch (feature.geometry.type) {
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
                console.warn(`Unsupported geometry type: ${feature.geometry.type}`);
        }
    });
    log('UseMapLayers: found bounds for all features in this step', bounds)
    return bounds;
}

    // Fit map to the active feature

export function useMapLayers(map) {
    const routeStatus = useRouteInfoStore();

    const startedLayerLoad = ref(false);
    let hoveredStateId = null;

    const getRouteLayerStyles = () =>
        Object.entries(mapConfig.layerConfigs.line)
            .map(([id, config]) => {
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
    const getExtraLineStyles = () => {
        let cfg = mapConfig.layerConfigs.line;
        return [
            {
                id: 'route-line-ferryx',
                type: 'line',
                source: 'extralines',
                filter: ['==', ['get', 'transport_type'], 'ferry'],
                paint: {
                    'line-color': cfg['route-line-ferry'].color,
                    'line-width': cfg['route-line-ferry'].width,
                    'line-dasharray': cfg['route-line-ferry'].dasharray,
                    'line-opacity': cfg['route-line-ferry'].opacity

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
                    'line-color': cfg['route-line-road-asphalt'].color,
                    'line-width': cfg['route-line-road-asphalt'].width,
                    'line-opacity': cfg['route-line-road-asphalt'].opacity
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
                    'line-color': cfg['route-line-road-cobblestones'].color,
                    'line-width': cfg['route-line-road-cobblestones'].width,
                    'line-opacity': cfg['route-line-road-cobblestones'].opacity

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
                    'line-color': cfg['route-line-road-asphalt'].color,
                    'line-width': cfg['route-line-road-asphalt'].width,
                    'line-opacity': cfg['route-line-road-asphalt'].opacity
                },
            }
        ]
    };

    // Function to add the layers to the map
    const renderLayers = () => {
    if (!routeStatus?.routeData) {  return;}
    const loadedLayers = [];
        const routeLines = routeStatus.getFilteredFeatures(feature => feature.topic === 'route'
            && feature.type === 'line')
        const routePoints = routeStatus.getFilteredFeatures(feature => feature.topic === 'route'
            && feature.type === 'point')
        const extraPoints = routeStatus.getFilteredFeatures(feature => feature.topic === 'extra'
            && feature.type === 'point')
        const extraLines = routeStatus.getFilteredFeatures(feature => feature.topic === 'extra'
            && feature.type === 'line')

        if (!startedLayerLoad.value) {
            startedLayerLoad.value = true;
            log("Start rendering all layers. lines:", routeLines, 'points:', routePoints);
            // Add route source and layers
            map.value.on('load', () => {

                                // Add icons to map
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
                log('Maplayers: Added all icons to map')

                map.value.addSource('routelines', {type: 'geojson', data: ArrayToGeoJSON(routeLines)});
                map.value.addSource('routepoints', {type: 'geojson', data: ArrayToGeoJSON(routePoints)});
                map.value.addSource('extrapoints', {type: 'geojson', data: ArrayToGeoJSON(extraPoints)});
                map.value.addSource('extralines', {type: 'geojson', data: ArrayToGeoJSON(extraLines)});

                                getExtraPoiStyles().forEach(layer => {
                    log('Maplayers -> extra poi', layer)
                    map.value.addLayer(layer);
                    loadedLayers.push({'part_of_step': false, 'layer_id': layer.id});
                });
                getExtraLineStyles().forEach(layer => {
                    log('Maplayers -> extra line', layer)
                    map.value.addLayer(layer);
                    loadedLayers.push({'part_of_step': false, 'layer_id': layer.id});
                });
                log('Maplayers - added Non-route layers')


                // Add Route lines
                getRouteLayerStyles().forEach(layer => {
                    map.value.addLayer(layer);
                    loadedLayers.push({'part_of_step': true, 'layer_id': layer.id});
                });
                // Add Route points
                getRoutePointStyles().forEach(layer => {
                    map.value.addLayer(layer);
                    loadedLayers.push({'part_of_step': true, 'layer_id': layer.id});
                })

                log('Maplayers: added all sources and layers -> route');




                const layers = ['route-point', 'route-line-road', 'route-line-ferry', 'route-line'];
                log("Maplayers -> loaded layers:", loadedLayers)
                addMapHandlers(loadedLayers)
                createMapLabels();
                addElevationPointer()
                routeStatus.triggerMapRefresh()
                log('Maplayers - Finished rendering layers!')
            })

        }
        ;
    }

    const addElevationPointer = () =>{
        map.value.addSource('hover-point', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        map.value.addLayer({
            id: 'hover-point-layer',
            type: 'circle',
            source: 'hover-point',
            paint: {
                'circle-radius': 6,
                'circle-color': '#000000',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });
    }

    const addMapHandlers = (loadedLayers) => {
        log('MapLayers -> start adding event handlers')
        loadedLayers.forEach(layer => {
            let partOfStep = layer.part_of_step
            let layerId = layer.layer_id
            // Add interactivity (hover, click, etc.)
            map.value.on('mouseenter', layerId, () => {
                map.value.getCanvas().style.cursor = 'pointer';
            });
            map.value.on('mouseleave', layerId, () => {
                map.value.getCanvas().style.cursor = '';
            });

            map.value.on('click', layerId, (e) => {
                let theFeat = e.features[0];

                log('Maplayers: Clicked on', theFeat);
                // Checking if the click is near a point. If so, prioritize that.
                if (partOfStep) {
                    let featureStepId = theFeat.properties['route_sequence_id']
                    let newStep = true;
                    if (String(routeStatus.activeStepId) === String(featureStepId)) {
                        newStep = false
                    }

                    if (layerId.includes('line')) {
                        const featuresAtPoint = map.value.queryRenderedFeatures(e.point, {
                            layers: ['route-point'],
                            hitTolerance: 10
                        });

                        if (featuresAtPoint.length > 0) {
                            log('Map: Clicked near a point, ignoring route click handler');
                            return;
                        }
                        if (newStep) {
                            routeStatus.setActiveStep(featureStepId)
                        };
                    }
                    if (layerId.includes('point')) {
                        console.log("propz clicked", theFeat.properties)
                        if (newStep) { routeStatus.setActiveStep(featureStepId) };
                    }
                    if (!newStep) {
                        routeStatus.setActiveFeature(theFeat.properties.id)
                    }
            }
                else {
                    routeStatus.setActiveFeature(theFeat.properties.id)
                }
            });


        });
        log('MapLayers -> finished adding event handlers')

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
        log('Maplayers - Added labels to map')
    }

    // Get feature bounding box
    // Return render function to be used in the component
    return {
        renderLayers,
    };
}
