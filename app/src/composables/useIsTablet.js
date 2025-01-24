// src/composables/useIsMobile.ts
import { ref, onMounted, onUnmounted } from "vue";

export function useIsTablet(breakpoint= 1024) {
  const isTablet = ref(false);

  const checkScreenSize = () => {
    isTablet.value = window.innerWidth <= breakpoint;
    //console.log('tabletcomposable: check screen size, istablet? ', isTablet.value, window.innerWidth, breakpoint)

  };

  onMounted(() => {
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
  });

  onUnmounted(() => {
    console.log('tabletcomposable: removing event listener')
    window.removeEventListener("resize", checkScreenSize);
  });

  return {
    isTablet,
  };
}
