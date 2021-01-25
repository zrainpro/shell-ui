import { createRouter, createWebHistory } from 'vue-router'
import Manage from '../views/manage/index.vue';

const routes = [
  {
    path: '/',
    redirect: () => '/manage',
  },
  {
    path: '/manage',
    name: '脚本管理',
    component: Manage
  },
  {
    path: '/manage/create',
    name: '创建脚本',
    component: () => import('../views/manage/edit/index')
  },
  {
    path: '/manage/edit/:id',
    name: '修改脚本',
    component: () => import('../views/manage/edit/index')
  },
  {
    path: '/shell',
    name: 'Shell',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('../views/About.vue')
  },
  {
    path: '/setting',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
