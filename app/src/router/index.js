import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/Home.vue';  // Now the Home page is in the views folder
import About from '../views/About.vue';  // About page in the views folder

const routes = [
  {
    path: '/',  // Root path also redirects to /map
    redirect: '/map',  // Redirects to the map view
  },
  {
    path: '/map',
    name: 'Home',
    component: Home,
    props: (route) => ({
      stop: route.query.stop,
      step: route.query.step,
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
  history: createWebHistory(),
  routes,
});

export default router;
