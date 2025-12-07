import { computed } from 'vue';

export function useElevationProfile(features) {
    return computed(() => {
        const points = [];
        let accumulatedDistance = 0;

        features.forEach(feature => {
            if (!feature.elevation) return;

            const adjusted = feature.elevation.map(p => ({
                ...p,
                distance_along_line: p.distance_along_line + accumulatedDistance
            }));

            if (adjusted.length) {
                accumulatedDistance = adjusted[adjusted.length - 1].distance_along_line;
            }

            points.push(...adjusted);
        });

        if (!points.length) return { data: [], summary: {} };

        const elevations = points.map(p => p.elevation).filter(e => e != null);
        const summary = {
            totalDistance: points[points.length - 1]?.distance_along_line || 0,
            minElevation: Math.min(...elevations),
            maxElevation: Math.max(...elevations),
            totalAscent: points.reduce((acc, p, i, arr) => i === 0 ? 0 : acc + Math.max(0, p.elevation - arr[i-1].elevation), 0),
            totalDescent: points.reduce((acc, p, i, arr) => i === 0 ? 0 : acc + Math.max(0, arr[i-1].elevation - p.elevation), 0)
        };

        return { data: points, summary };
    });
}
