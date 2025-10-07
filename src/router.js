import {createRouter, createWebHashHistory} from "vue-router";

const BASE_TITLE = "Miso-Tools | ";
const routes = [
    {
        name: "Home",
        path: "/",
        component: () => import("./components/pages/home.vue"),
        meta: {title: BASE_TITLE + "Home"},
    },
    {
        name: "ColorPicker",
        path: "/color_picker",
        component: () => import("./components/pages/color_picker.vue"),
        meta: {title: BASE_TITLE + "Color Picker"},
    },
    {
        name: "NotFound",
        path: "/:pathMatch(.*)*",
        component: () => import("./components/pages/not_found.vue"),
        meta: {title: BASE_TITLE + "404 Not Found"},
    },
];

const router = new createRouter({
    history: createWebHashHistory(),
    routes,
});

const DEFAULT_TITLE = "Miso-Tools";
router.afterEach((to, from) => {
    document.title = to.meta.title || DEFAULT_TITLE;
});

export default router;
