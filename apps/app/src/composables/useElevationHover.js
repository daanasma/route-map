import { ref } from 'vue';

// Shared reactive state (singleton)
const elevationTrackerPoint = ref(null);

export function useElevationHover() {
  const setHoveredPoint = (data) => {
    elevationTrackerPoint.value = data;
  };

  const clearHoveredPoint = () => {
    elevationTrackerPoint.value = null;
  };

  return {
    elevationTrackerPoint,
    setHoveredPoint,
    clearHoveredPoint
  };
}
