<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { confirmAction } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import AppLogo from '@/components/AppLogo.vue'
import {
  LayoutDashboard,
  Users,
  Menu,
  LogOut,
  ScanBarcode,
  ReceiptText,
  Boxes,
  HardHat,
  PackagePlus,
  BarChart3,
} from '@lucide/vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const isAdmin = computed(() => auth.user?.role === 'admin')

const allNavItems = [
  { to: '/', name: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, match: ['dashboard'] },
  { to: '/withdraw', name: 'withdraw', label: 'เบิกอุปกรณ์', icon: ScanBarcode, match: ['withdraw'] },
  {
    to: '/withdrawals',
    name: 'withdrawals',
    label: 'ประวัติการเบิก',
    icon: ReceiptText,
    match: ['withdrawals', 'withdrawal-detail'],
  },
  {
    to: '/receive-stock',
    name: 'receive-stock',
    label: 'รับเข้าสต็อก',
    icon: PackagePlus,
    match: ['receive-stock', 'stock-receipts', 'stock-receipt-detail'],
    adminOnly: true,
  },
  { to: '/equipment', name: 'equipment', label: 'คลังอุปกรณ์', icon: Boxes, match: ['equipment'] },
  { to: '/technicians', name: 'technicians', label: 'รายชื่อช่าง', icon: HardHat, match: ['technicians'] },
  { to: '/reports', name: 'reports', label: 'รายงาน', icon: BarChart3, match: ['reports'] },
  { to: '/users', name: 'users', label: 'ผู้ใช้งาน', icon: Users, match: ['users'] },
]

const navItems = computed(() => allNavItems.filter((item) => !item.adminOnly || isAdmin.value))

const pageTitle = computed(
  () => allNavItems.find((item) => item.match.includes(route.name))?.label ?? 'รายละเอียดใบเบิก',
)

const initials = computed(() => {
  const source = auth.user?.name ?? auth.user?.email ?? '?'
  return source.slice(0, 1).toUpperCase()
})

const drawerOpen = ref(false)
watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
  },
)

async function handleLogout() {
  const ok = await confirmAction({
    title: 'ออกจากระบบใช่หรือไม่',
    message: 'คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งานต่อ',
    confirmText: 'ออกจากระบบ',
    tone: 'primary',
  })
  if (!ok) return

  await auth.logout()
  toast.success('ออกจากระบบเรียบร้อยแล้ว')
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="drawer lg:drawer-open">
    <input id="admin-drawer" v-model="drawerOpen" type="checkbox" class="drawer-toggle" />

    <div class="drawer-content flex flex-col bg-base-200 print:bg-white">
      <header
        class="navbar sticky top-0 z-10 gap-2 border-b border-base-300 bg-base-100/90 px-3 backdrop-blur sm:px-4 print:hidden"
      >
        <label for="admin-drawer" class="btn btn-square btn-ghost shrink-0 lg:hidden">
          <Menu class="h-5 w-5" :stroke-width="2" />
        </label>

        <h1 class="font-display min-w-0 flex-1 truncate text-base font-bold text-base-content sm:text-lg">
          {{ pageTitle }}
        </h1>

        <div class="flex shrink-0 items-center gap-2 px-1 py-1.5 sm:px-2">
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
          >
            {{ initials }}
          </span>
          <span class="hidden text-sm font-medium text-base-content/80 sm:inline">
            {{ auth.user?.name ?? auth.user?.email }}
          </span>
        </div>
      </header>

      <main class="flex-1 p-4 sm:p-6 print:p-0">
        <router-view />
      </main>
    </div>

    <div class="drawer-side z-20 print:hidden">
      <label for="admin-drawer" class="drawer-overlay"></label>
      <aside class="flex min-h-full w-64 flex-col bg-navy-950 text-white">
        <div class="px-5 py-6">
          <AppLogo variant="light" />
        </div>

        <ul class="menu flex-1 gap-1 px-3">
          <li v-for="item in navItems" :key="item.to">
            <router-link
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              :class="{ '!bg-brand-600 !text-white shadow-lg shadow-brand-600/20': item.match.includes(route.name) }"
            >
              <component :is="item.icon" class="h-4 w-4" :stroke-width="2" />
              {{ item.label }}
            </router-link>
          </li>
        </ul>

        <div class="border-t border-white/10 p-3">
          <div class="flex items-center gap-3 rounded-lg px-2 py-2">
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white"
            >
              {{ initials }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-white">{{ auth.user?.name }}</p>
              <p class="truncate text-xs text-white/40">{{ auth.user?.email }}</p>
            </div>
          </div>
          <button
            class="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4" :stroke-width="2" />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
