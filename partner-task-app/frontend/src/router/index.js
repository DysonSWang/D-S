import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('@/layouts/GuideLayout.vue'),
    redirect: '/guide/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'GuideDashboard',
        component: () => import('@/views/guide/Dashboard.vue')
      },
      {
        path: 'partners',
        name: 'GuidePartners',
        component: () => import('@/views/guide/Partners.vue')
      },
      {
        path: 'tasks',
        name: 'GuideTasks',
        component: () => import('@/views/guide/Tasks.vue')
      },
      {
        path: 'checkins',
        name: 'GuideCheckins',
        component: () => import('@/views/guide/Checkins.vue')
      }
    ]
  },
  {
    path: '/grower',
    name: 'Grower',
    component: () => import('@/layouts/GrowerLayout.vue'),
    redirect: '/grower/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'GrowerDashboard',
        component: () => import('@/views/grower/Dashboard.vue')
      },
      {
        path: 'tasks',
        name: 'GrowerTasks',
        component: () => import('@/views/grower/Tasks.vue')
      },
      {
        path: 'cottage',
        name: 'Cottage',
        component: () => import('@/views/cottage/CottageView.vue')
      },
      {
        path: 'shop',
        name: 'DecorationShop',
        component: () => import('@/views/cottage/Shop.vue')
      },
      {
        path: 'rewards',
        name: 'Rewards',
        component: () => import('@/views/grower/Rewards.vue')
      }
    ]
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
