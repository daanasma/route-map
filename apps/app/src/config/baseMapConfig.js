const maptilerKey = import.meta.env.VITE_MAPTILER_KEY
export default {
    basemapMap: {
        'maptiler-topo-4': {
            'type': 'json',
            'url': `https://api.maptiler.com/maps/topo-v4/style.json?key=${maptilerKey}`
        },
        'openfreemap-liberty': {
            'type': 'json',
            'url': `https://tiles.openfreemap.org/styles/liberty`
        }
    }
    //
}
