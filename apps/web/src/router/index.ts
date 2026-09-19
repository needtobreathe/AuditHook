import { createRouter, createWebHistory } from 'vue-router';
import WorkbenchPage from '../pages/WorkbenchPage.vue';
import DocsPage from '../pages/DocsPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'workbench',
      component: WorkbenchPage
    },
    {
      path: '/docs',
      name: 'docs',
      component: DocsPage
    }
  ]
});
