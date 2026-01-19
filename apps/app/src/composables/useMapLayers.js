// src/composables/useMapLayers.js

import {ref} from 'vue';
import {useRouteInfoStore} from "@repo/common";
import mapConfig from '../config/mapConfig.js';
import {LngLatBounds} from "maplibre-gl"; // Import map configuration
import {log} from '@/debug/debug.js';

const mapRef = ref(null)
const labelFont = {
    'text-color': '#000',
    'text-halo-color': '#fff',
    'text-halo-width': 2,
}

export function setMap(mapInstance) {
    mapRef.value = mapInstance;
}

export function setFeatureHighlights (map) {
    const routeStatus = useRouteInfoStore();

    const idsToSelect = routeStatus.featuresToFocus.map(f => f.id);
    let filter;
    if (idsToSelect.length) {
        filter = ['in', 'id', ...idsToSelect];
    }
    else {
        filter = ['==', ['id'], -1]
    }
    //todo add points here :)
    ['focused-line', 'focused-point'].forEach(item => {
        map.value.setFilter(
            item,
            filter
        );
    })
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

        setFeatureHighlights(mapRef); // todo this shouldnt be here :)

    };

    function zoomToFullRoute() {
        log('Map: zooming to full route.')
        fitMapToFeatureList(routeStatus.routeFeatures);
        log("Zoomed to full route!")
    };

    return {
        zoomToFullRoute,
        fitMapToFeatureList
    };
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

    const getFocusedPointStyles = () => {
        return [
            {
                id: 'focused-point',
                type: 'circle',
                source: 'allpoints',
                filter: ['==', ['id'], -1], // nothing selected initially
            paint: {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8,  18,
                    12, 28,
                    16, 38
                ],
                'circle-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8,  0.35,
                    12, 0.55,
                    16, 0.65
                ],
                'circle-blur': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8,  0.6,
                    16, 0.9
                ],
                'circle-color': mapConfig.highLightColor
                }
            }
        ]
    };
    const getPoiStyles = (variation) => {
        const poiConfig = {
            'routepoints': {
                source: 'routepoints',
                iconColor: mapConfig.mainColor,
                iconSize: mapConfig.sizeMapMarkers,
                showLabel: true,
                textSize: 12,
                paint: labelFont,
            },
            'extrapoints': {
                source: 'extrapoints',
                iconColor: mapConfig.poiColor,
                iconSize: mapConfig.sizeMapMarkers,
                showLabel: false,
                paint: labelFont,
            },
        };

        const cfg = poiConfig[variation] || poiConfig.route; // fallback

      const layer = {
        id: variation,
        type: 'symbol',
        source: cfg.source,
        layout: {
          'icon-image': [
            'match',
            ['get', 'poi_type'],
            ...Object.entries(mapConfig.iconMap).flatMap(([key, value]) => [key, `${value}_${cfg.iconColor}`]),
            `${mapConfig.iconMap.default}_${cfg.iconColor}`,
          ],
          'icon-size': cfg.iconSize,
          ...(cfg.showLabel
            ? {
                'text-field': ['get', 'title'],
                'text-font': ['Noto Sans Regular'],
                'text-size': cfg.textSize,
                'text-offset': [3.5, -2.5],
                'text-anchor': 'top'
              }
            : {}),
        }

      };

      // only add paint if it exists
      if (cfg.paint) layer.paint = cfg.paint;
      return [layer];
    };

    const getFocusedLineStyles = () => {
        let cfg = mapConfig.layerConfigs.line;
        return [
            {
                id: 'focused-line',
                type: 'line',
                source: 'alllines',
                filter: ['==', ['id'], -1], // matches nothing initially
            paint: {
                'line-color': mapConfig.highLightColor,

                'line-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8,  9,
                    12, 10,
                    16, 15
                ],

                'line-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8,  0.35,
                    12, 0.55,
                    16, 0.7
                ],

                // soft glow effect
                'line-blur': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    8,  0.8,
                    16, 1.5
                ]
            }
            }
        ]
    };

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
        if (!routeStatus?.routeData) {
            return;
        }
        const loadedLayers = [];
        const routeLines = routeStatus.getFilteredFeatures(feature => feature.topic === 'route'
            && feature.type === 'line')
        const routePoints = routeStatus.getFilteredFeatures(feature => feature.topic === 'route'
            && feature.type === 'point')
        const extraPoints = routeStatus.getFilteredFeatures(feature => feature.topic === 'extra'
            && feature.type === 'point')
        const extraLines = routeStatus.getFilteredFeatures(feature => feature.topic === 'extra'
            && feature.type === 'line')

        const allLines = routeStatus.getFilteredFeatures(feature => feature.type === 'line')
        const allPoints = routeStatus.getFilteredFeatures(feature => feature.type === 'point')

        if (!startedLayerLoad.value) {
            startedLayerLoad.value = true;
            log("Start rendering all layers. lines:", routeLines, 'points:', routePoints);
            // Add route source and layers
            map.value.on('load', () => {

                // Add icons to map
                [mapConfig.poiColor,mapConfig.mainColor,mapConfig.hoverColor,mapConfig.highLightColor]
                    .forEach((color) => {
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
                map.value.addSource('alllines', {type: 'geojson', data: ArrayToGeoJSON(allLines)});
                map.value.addSource('allpoints', {type: 'geojson', data: ArrayToGeoJSON(allPoints)});

                getFocusedLineStyles().forEach(layer => {
                    log('Maplayers -> Adding Focused lines', layer)
                    map.value.addLayer(layer);
                    //loadedLayers.push({'part_of_step': false, 'layer_id': layer.id});
                });

                getFocusedPointStyles().forEach(layer => {
                    log('Maplayers -> Adding Focused points', layer)
                    map.value.addLayer(layer);
                    //loadedLayers.push({'part_of_step': false, 'layer_id': layer.id});
                });

                log('Maplayers - added Focus layers')


                getPoiStyles('extrapoints').forEach(layer => {
                    log('Maplayers -> extra poi', layer)
                    map.value.addLayer(layer);
                    loadedLayers.push({'part_of_step': false, 'layer_id': 'extrapoints'});
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
                getPoiStyles('routepoints').forEach(layer => {
                    map.value.addLayer(layer);
                    loadedLayers.push({'part_of_step': true, 'layer_id': 'routepoints'});
                })

                log('Maplayers: added all sources and layers -> route');


                const layers = ['routepoints', 'route-line-road', 'route-line-ferry', 'route-line'];
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

    const addElevationPointer = () => {
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
            let layerId = layer.layer_id
            // Hover effects
            map.value.on('mouseenter', layerId, () => {
                map.value.getCanvas().style.cursor = 'pointer';
            });
            map.value.on('mouseleave', layerId, () => {
                map.value.getCanvas().style.cursor = '';
            });

            // click handler
            map.value.on('click', layerId, (e) => {
                let theFeat = e.features[0];
                log(`Maplayers: (pos: ${layer.part_of_step}) Clicked on`, theFeat);
                if (layer.part_of_step) {
                    let featureStepId = theFeat.properties['route_sequence_id']
                    let newStep = true;
                    if (String(routeStatus.activeStepId) === String(featureStepId)) {
                        newStep = false
                    }

                    // Checking if the click is near a point. If so, prioritize that.
                    if (layerId.includes('line')) {
                        const featuresAtPoint = map.value.queryRenderedFeatures(e.point, {
                            layers: ['routepoints'],
                            hitTolerance: 10
                        });

                        if (featuresAtPoint.length > 0) {
                            log('Map: Clicked near a point, ignoring route click handler');
                            return;
                        }
                        if (newStep) {
                            routeStatus.setActiveStep(featureStepId)
                        }
                        ;
                    }
                    // For point clicks
                    if (layerId.includes('point')) {
                        console.log("Point clicked. properties:", theFeat.properties)
                        if (newStep) {
                            routeStatus.setActiveStep(featureStepId)
                        }
                        ;
                    }

                    if (!newStep) {
                        routeStatus.setActiveFeature(theFeat.properties.id)
                    }
                } else {
                    routeStatus.setActiveStep(null);
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

    // Return render function to be used in the component
    return {
        renderLayers,
    };
}
