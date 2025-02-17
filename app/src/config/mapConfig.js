// src/config/mapconfig.js

export default {
  // Default map style URL (could be a custom Mapbox or MapLibre style URL)
  style: 'https://tiles.openfreemap.org/styles/positron',

  // Default map center [longitude, latitude]
  defaultCenter: [-72.4200, -47.4800],

  // Default map zoom level
  defaultZoom: 7,

  // Layer configurations (you can expand this with more options in the future)
  layerConfigs: {
    'route-line-ferry': {
      color: '#404040',
      width:  [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 2,
        13, 3,
        16, 5,
        19, 8
      ],
      dasharray: [2, 2],
    },
    'route-line-road': {
      color: '#082305',
      opacity: 0.5,
      width: [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 2,
        13, 3,
        16, 5,
        19, 8
      ],
    },
    'route-line-default': {
      color: '#000000',
      width: 5,
      dasharray: [3, 1],
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
