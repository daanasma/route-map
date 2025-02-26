// src/config/mapconfig.js

const lineWidth = [
        'interpolate',
        ['linear'],
        ['zoom'],
        8, 2,
        10, 4,
        13, 4,
        16, 10,
        19, 12
      ]
const sizeMapMarkers = 0.25;
const mainColor = '#065809';
const poiColor = "#2f2d2d";

export default {
  // Default map style URL (could be a custom Mapbox or MapLibre style URL)
  style: 'https://tiles.openfreemap.org/styles/positron',
    mainColor: mainColor,
    poiColor: poiColor,
    sizeMapMarkers,
  iconMap: {
    national_park: 'park-alt1',
    town: 'building',
      port: 'ferry',
    default: 'star'
  },
  // Default map center [longitude, latitude]
  defaultCenter: [-72.4200, -47.4800],

  // Default map zoom level
  defaultZoom: 7,

  // Layer configurations (you can expand this with more options in the future)
  layerConfigs: {
    'route-line-ferry': {
      color: '#1a9379',
      width: lineWidth ,
      dasharray: [1, 1],
    },
    'route-line-road': {
      color: mainColor,
      opacity: 0.5,
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
  maxZoom: 12,
};
