// src/config/mapconfig.js
const lineWidth = [
    'interpolate',
    ['linear'],
    ['zoom'],
    8, 3,
    10, 4,
    13, 8,
    16, 12,
    19, 12
]
const lineOpacity = [
    'interpolate',
    ['linear'],
    ['zoom'],
    8, 0.8,
    10, 0.6,
    16, 0.4,
]
const sizeMapMarkers = 0.25;
const mainColor = '#065809';
const poiColor = "#2f2d2d";

export default {
    configuredRoutes: {
        'carretera-austral': {
            id: 'carretera-austral',
            theme: 'light',
            panelRightSide: 333,
            isRoute: true,
            mainColor: '#065809',
            poiColor: "#2f2d2d",
            basemap: `maptiler-topo-4`,
            center: [-72.4200, -47.4800],
            zoom: 7,
            maxZoomFocus: 13,
            useHillshade: false
        },
        'paris-roubaix': {
            id: 'paris-roubaix',
            theme: 'light',
            isRoute: true,
            mainColor: '#065809',
            poiColor: "#2f2d2d",
            basemap: 'openfreemap-liberty',
            center: [3.44495, 50.051],
            zoom: 8,
            maxZoomFocus: 18,
            useHillshade: true
        },
        'valencia-city': {
            id: 'valencia-city',
            theme: 'light',
            isRoute: true,
            mainColor: '#065809',
            poiColor: "#2f2d2d",
            basemap: 'maptiler-topo-4',
            center: [-0.375, 39.473],
            zoom: 15,
            maxZoomFocus: 18,
            useHillshade: true
        }
    },

    // Default map style URL (could be a custom Mapbox or MapLibre style URL)
    basemap: 'https://tiles.openfreemap.org/styles/positron',
    mainColor: mainColor,
    poiColor: poiColor,
    sizeMapMarkers,
    iconMap: { //https://labs.mapbox.com/maki-icons/
        national_park: 'park-alt1',
        town: 'building',
        tower: 'castle',
        port: 'ferry',
        finish: 'racetrack',
        start: 'racetrack-cycling',
        trainstation: 'rail',
        munument: 'monument',
        forest: 'park',
        park: 'park',
        default: 'star',
        castle: 'castle',
        religious_christian: 'religious-christian',
        campsite: 'campsite',
        restaurant: 'restaurant',
        supermarket: 'grocery'
    },
    // Default map center [longitude, latitude]

    // Default map zoom level

    // Layer configurations (you can expand this with more options in the future)
    layerConfigs: {
        'line': {
            'route-line-ferry': {
                color: '#1a9379',
                width: lineWidth,
                opacity: lineOpacity,
                dasharray: [1, 1],
            },
            'route-line-road-asphalt': {
                color: mainColor,
                opacity: lineOpacity,
                width: lineWidth,
            },
            'route-line-road-cobblestones': {
                color: '#000000',
                opacity: lineOpacity,
                width: lineWidth,
            },
            'route-line-road-gravel': {
                color: '#333333',
                opacity: lineOpacity,
                width: lineWidth,
            },
            'route-line-default': {
                color: '#000000',
                opacity: lineOpacity,
                width: lineWidth
            }
        },
        'point': {
            'route-point': {
                radius: 8,
                color: '#065809',
            }
        }
    },

    // Other configuration values, such as bounds, padding, etc.
    fitBoundsPadding: 20,
};
