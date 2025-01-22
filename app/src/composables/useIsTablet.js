// src/composables/useIsMobile.ts
import { ref, onMounted, onUnmounted } from "vue";

export function useIsTablet(breakpoint= 1024) {
  const isTablet = ref(false);

  const checkScreenSize = () => {
    isTablet.value = window.innerWidth <= breakpoint;
  };

  onMounted(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", checkScreenSize);
  });

  return {
    isTablet,
  };
}
