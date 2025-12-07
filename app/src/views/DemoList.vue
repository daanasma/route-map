<template>
  <div>
    <h1>Route map demo's</h1>
    <section>
      <p>
        Welcome! This project is dedicated to exploring and sharing the beauty and
        adventure of various routes.
      </p>
      <p>
        Currently the following routes are available:
      </p>

      <ul>
        <li v-for="route in routes" :key="route.id">
          - <a :href="`/map/${route.id}`">
            <strong>{{ route.id }}</strong>
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>

<script>
import { ref } from "vue";
import mapConfig from '@/config/mapConfig.js'
import { log } from '../debug/debug.js';

export default {
  setup() {
    const routes = mapConfig.configuredRoutes;
    log(routes)
    const name = ref("");
    const email = ref("");
    const message = ref("");
    const isSubmitted = ref(false);
    return {
      routes
    };
  },
};
</script>

<style scoped>




</style>
