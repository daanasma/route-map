// src/composables/useIsMobile.ts
import { ref, onMounted, onUnmounted } from "vue";
import { log } from '../debug/debug.js';

export function useIsTablet(breakpoint= 1024) {
  const isTablet = ref(false);

  const checkScreenSize = () => {
    isTablet.value = window.innerWidth <= breakpoint;
    //log('tabletcomposable: check screen size, istablet? ', isTablet.value, window.innerWidth, breakpoint)

  };

  onMounted(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
  });

  onUnmounted(() => {
    log('tabletcomposable: removing event listener')
    window.removeEventListener("resize", checkScreenSize);
  });

  return {
    isTablet,
  };
}
