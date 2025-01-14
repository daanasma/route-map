<script >
import { useIsMobile } from "../composables/useIsMobile";

export default {
  setup() {
    const { isMobile } = useIsMobile(); // Call the composable

    return {
      isMobile,
    };
  },
};
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header v-if="!isMobile"  class="h-16 bg-gray-800 text-white flex items-center justify-center">
      Header
    </header>

    <!-- Content -->
    <main class="flex-grow bg-gray-100 flex items-center justify-center">
      Content Section
    </main>

    <!-- Footer Navigation -->
    <footer v-if="!isMobile" class="h-16 bg-gray-800 text-white flex items-center justify-around">
      <button class="p-2 bg-blue-500 rounded">Nav 1</button>
      <button class="p-2 bg-blue-500 rounded">Nav 2</button>
      <button class="p-2 bg-blue-500 rounded">Nav 3</button>
    </footer>
  </div>
</template>

<style scoped></style>
