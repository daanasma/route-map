// src/config/mapconfig.js

const lineWidth = [
        'interpolate',
        ['linear'],
        ['zoom'],
        8, 3,
        10, 4,
        13, 8,
        16, 12,
        19, 16
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
            isRoute: true,
            mainColor: '#065809',
            poiColor: "#2f2d2d",
            basemap: 'https://tiles.openfreemap.org/styles/positron',
            center: [-72.4200, -47.4800],
            zoom: 7,
            maxZoomFocus: 13

        },
        'paris-roubaix': {
            id: 'paris-roubaix',
            theme: 'light',
            isRoute: true,
            mainColor: '#065809',
            poiColor: "#2f2d2d",
            basemap: 'https://tiles.openfreemap.org/styles/positron',
            center: [3.44495,50.051],
            zoom: 8,
            maxZoomFocus: 18
        },
        'valencia-city': {
            id: 'valencia-city',
            theme: 'light',
            isRoute: true,
            mainColor: '#065809',
            poiColor: "#2f2d2d",
            basemap: 'https://tiles.openfreemap.org/styles/positron',
            center: [-0.375 ,39.471],
            zoom: 14,
            maxZoomFocus: 18
        }
    },

  // Default map style URL (could be a custom Mapbox or MapLibre style URL)
  basemap: 'https://tiles.openfreemap.org/styles/positron',
    mainColor: mainColor,
    poiColor: poiColor,
    sizeMapMarkers,
  iconMap: {
      national_park: 'park-alt1',
      town: 'building',
      port: 'ferry',
      finish: 'racetrack',
      start: 'racetrack-cycling',
      trainstation: 'rail',
      forest: 'park',
      default: 'star',
      castle: 'castle',
  },
  // Default map center [longitude, latitude]

  // Default map zoom level

  // Layer configurations (you can expand this with more options in the future)
  layerConfigs: {
    'route-line-ferry': {
      color: '#1a9379',
      width: lineWidth ,
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
      width: lineWidth
    },
    'route-point': {
      radius: 8,
      color: '#065809',
    },
  },

  // Other configuration values, such as bounds, padding, etc.
  fitBoundsPadding: 20,
};
