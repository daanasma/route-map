import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/Home.vue';  // Now the Home page is in the views folder
import About from '../views/About.vue';  // About page in the views folder

const routes = [
  {
    path: '/',  // Root path also redirects to /route-map
    redirect: '/map',  // Redirects to the map view
  },
  {
    path: '/map',  // The map view is available at /route-map
    name: 'Home',
    component: Home,
    props: (route) => ({
      stop: route.query.stop,
      segment: route.query.segment,
    }),
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
