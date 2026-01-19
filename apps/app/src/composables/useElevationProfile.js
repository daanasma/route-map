import { computed } from 'vue';
import {storeToRefs} from "pinia";
import {useRouteInfoStore} from "@/stores/routestatus.js";

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


export function useSegmentElevation() {
  const routeStatus = useRouteInfoStore();
  const { activeStepId } = storeToRefs(routeStatus);

  const segmentElevationData = computed(() => {
    if (!activeStepId.value) return null;
    const data = routeStatus.segmentElevation(activeStepId.value);

    if (data.length === 0) return null;

    // Reset distance to start from 0 for this segment
    const startDistance = data[0].distance_along_line;
    return data.map(point => ({
      ...point,
      distance_along_line: point.distance_along_line - startDistance
    }));
  });

  return {
    segmentElevationData
  };
}
