import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersView.vue'),
        },
        {
          path: 'withdraw',
          name: 'withdraw',
          component: () => import('@/views/WithdrawView.vue'),
        },
        {
          path: 'withdrawals',
          name: 'withdrawals',
          component: () => import('@/views/WithdrawalHistoryView.vue'),
        },
        {
          path: 'withdrawals/:id',
          name: 'withdrawal-detail',
          component: () => import('@/views/WithdrawalDetailView.vue'),
        },
        {
          path: 'equipment',
          name: 'equipment',
          component: () => import('@/views/EquipmentView.vue'),
        },
        {
          path: 'technicians',
          name: 'technicians',
          component: () => import('@/views/TechniciansView.vue'),
        },
        {
          path: 'equipment/imports',
          name: 'equipment-imports',
          component: () => import('@/views/ImportHistoryView.vue'),
          meta: { adminOnly: true },
        },
        {
          path: 'receive-stock',
          name: 'receive-stock',
          component: () => import('@/views/ReceiveStockView.vue'),
          meta: { adminOnly: true },
        },
        {
          path: 'stock-receipts',
          name: 'stock-receipts',
          component: () => import('@/views/StockReceiptHistoryView.vue'),
          meta: { adminOnly: true },
        },
        {
          path: 'stock-receipts/:id',
          name: 'stock-receipt-detail',
          component: () => import('@/views/StockReceiptDetailView.vue'),
          meta: { adminOnly: true },
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/ReportsView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.checked) {
    await auth.fetchCurrentUser()
  }

  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.adminOnly && auth.user?.role !== 'admin') {
    return { name: 'dashboard' }
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
