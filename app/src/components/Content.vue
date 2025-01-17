<script >
import { useIsMobile } from "../composables/useIsMobile";
import {useRouteInfoStore} from "@/stores/routestatus.js";

export default {
  setup() {
    const { isMobile } = useIsMobile(); // Call the composable
    const routeStatus = useRouteInfoStore();
    const activatePreviousStop = () => {
      console.log('Button was clicked!');
      routeStatus.previousStop()
    };
    const activateNextStop = () => {
      console.log('Button was clicked!');
      routeStatus.nextStop()
    };
    return {
      isMobile,
      activatePreviousStop,
      activateNextStop,
    };
  },
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header v-if="!isMobile"  class="h-16 bg-gray-800 text-white subsection-title flex items-center justify-center">
      Carretera Austral Explorer
    </header>

    <!-- Content -->
    <main class="flex-grow bg-gray-100 flex items-center justify-center">
      Content Section
    </main>

    <!-- Footer Navigation -->
    <footer  class="h-16 bg-gray-800 text-white flex items-center justify-around">
      <button class="p-2 bg-blue-500 rounded" @click="activatePreviousStop">Previous</button>
      <button class="p-2 bg-blue-500 rounded" @click="activateNextStop">Next</button>
    </footer>
  </div>
</template>

<style scoped></style>
