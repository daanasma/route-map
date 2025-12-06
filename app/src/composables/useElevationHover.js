import { ref } from 'vue';

// Shared reactive state (singleton)
const hoveredPoint = ref(null);

export function useElevationHover() {
  const setHoveredPoint = (data) => {
    hoveredPoint.value = data;
  };

  const clearHoveredPoint = () => {
    hoveredPoint.value = null;
  };

  return {
    hoveredPoint,
    setHoveredPoint,
    clearHoveredPoint
  };
}
