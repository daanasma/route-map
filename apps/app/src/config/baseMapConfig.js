const maptilerKey = import.meta.env.VITE_MAPTILER_KEY
export default {
    basemapMap: {
        'maptiler-topo-4': {
            'type': 'json',
            'url': `https://api.maptiler.com/maps/topo-v4/style.json?key=${maptilerKey}`
        },
        'osm-be-raster': {
            'type': 'raster',
            url: "https://tile.openstreetmap.be/osmbe/{z}/{x}/{y}.png",
            attributions: 'Tiles: Champs-Libres. | Data: <a href="https://www.openstreetmap.org/copyright/en">OpenStreetMap</a>',
            minzoom: 0,
            maxzoom: 18
        },
            'openfreemap-liberty': {
            'type': 'json',
            'url': `https://tiles.openfreemap.org/styles/liberty`
        }
    }
    //
}
