import {createRouter, createWebHistory} from "vue-router";
import Home from '../views/Home.vue';  // Now the Home page is in the views folder
import About from '../views/About.vue';  // About page in the views folder
import DemoList from '../views/DemoList.vue';
import {useSettingsStore} from '../stores/settings';

const routes = [
    {
        path: '/',  // Root path also redirects to /map
        redirect: '/demo',  // Redirects to the map view
    },
    {
        path: '/map',  // Root path also redirects to /map
        redirect: '/demo',  // Redirects to the map view
    },
    {
        path: '/demo',
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

router.beforeEach((to, from, next) => {
    const settingsStore = useSettingsStore();


    // Controleer de parameter in de NIEUWE URL (to.query)
    if (to.query.debugmode === '1') {
        console.log('debugmode param = 1')
        settingsStore.setDebugMode(true);
    } else if (to.query.debugmode === '0') {
        settingsStore.setDebugMode(false);
                console.log('debugmode param = 0')

    }
    else {
        console.log('debugmode set from claimlord')
        settingsStore.initializeFromStorage()
    }

    // Als de parameter niet aanwezig is, behoudt de store de huidige (sessionStorage) status

    // // Optioneel: Verwijder de parameter uit de URL na verwerking
    // if (to.query.debugmode) {
    //     const newQuery = {...to.query};
    //     delete newQuery.debugmode;
    //     next({path: to.path, query: newQuery, replace: true});
    // } else {
    //     next();
    // }
    next();
});
export default router;
