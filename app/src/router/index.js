import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/Home.vue';  // Now the Home page is in the views folder
import About from '../views/About.vue';  // About page in the views folder
import DemoList from '../views/DemoList.vue';

const routes = [
  {
    path: '/',  // Root path also redirects to /map
    redirect: '/map',  // Redirects to the map view
  },
      {
    path: '/map',
    name: 'DemoList',
    component: DemoList,
  },

  {
    path: '/map/:map_id',
    name: 'Home',
    component: Home,
    props: (route) => ({
      mapId: route.params.map_id,  // Pass map_id as a prop
      step: route.query.step,
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
