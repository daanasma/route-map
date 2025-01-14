import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/Home.vue';  // Now the Home page is in the views folder
import About from '../views/About.vue';  // About page in the views folder

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
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
