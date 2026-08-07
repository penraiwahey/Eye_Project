<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import {
  Users,
  HardHat,
  ReceiptText,
  TriangleAlert,
  ScanBarcode,
  Loader2,
  ArrowRight,
  PackageCheck,
  BarChart3,
} from '@lucide/vue'

const auth = useAuthStore()
const stats = ref({ userCount: null, technicianCount: null, lowStockCount: null, withdrawalsToday: null })
const loading = ref(true)

const recentWithdrawals = ref([])
const recentLoading = ref(true)

const lowStockItems = ref([])
const lowStockLoading = ref(true)

const topItems = ref([])
const topItemsLoading = ref(true)
const topItemsMax = ref(1)

function initialsOf(name) {
  return (name ?? '?').slice(0, 1).toUpperCase()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

const cards = [
  { key: 'withdrawalsToday', label: 'เบิกวันนี้', icon: ReceiptText },
  { key: 'lowStockCount', label: 'อุปกรณ์ใกล้หมด', icon: TriangleAlert, warn: true },
  { key: 'technicianCount', label: 'ช่างที่ใช้งานอยู่', icon: HardHat },
  { key: 'userCount', label: 'ผู้ใช้ระบบทั้งหมด', icon: Users },
]

onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard/stats')
    stats.value = data
  } finally {
    loading.value = false
  }
})

onMounted(async () => {
  try {
    const { data } = await api.get('/withdrawals', { params: { pageSize: 5 } })
    recentWithdrawals.value = data.withdrawals
  } finally {
    recentLoading.value = false
  }
})

onMounted(async () => {
  try {
    const { data } = await api.get('/equipment', { params: { lowStock: true, limit: 5 } })
    lowStockItems.value = data.equipment
  } finally {
    lowStockLoading.value = false
  }
})

onMounted(async () => {
  try {
    const { data } = await api.get('/withdrawals/top-items', { params: { period: 'month', limit: 5 } })
    topItems.value = data.items
    topItemsMax.value = Math.max(1, ...data.items.map((i) => i.totalQty))
  } finally {
    topItemsLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-display text-xl font-bold text-base-content">
        สวัสดี, {{ auth.user?.name ?? auth.user?.email }}
      </h2>
      <p class="mt-1 text-sm text-base-content/50">ภาพรวมของระบบจัดการหลังบ้านวันนี้</p>
    </div>

    <RouterLink
      to="/withdraw"
      class="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white shadow-sm transition-transform sm:p-6 hover:scale-[1.01]"
    >
      <div class="flex min-w-0 items-center gap-3 sm:gap-4">
        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:h-12 sm:w-12">
          <ScanBarcode class="h-5 w-5 sm:h-6 sm:w-6" :stroke-width="2" />
        </span>
        <div class="min-w-0">
          <p class="font-display text-base font-bold sm:text-lg">เบิกอุปกรณ์</p>
          <p class="truncate text-sm text-white/70">สแกนบาร์โค้ดเพื่อเริ่มเบิกอุปกรณ์ให้ช่าง</p>
        </div>
      </div>
      <ArrowRight class="h-5 w-5 shrink-0" :stroke-width="2" />
    </RouterLink>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="card in cards" :key="card.key" class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div class="flex items-center gap-3">
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl"
            :class="card.warn && stats[card.key] > 0 ? 'bg-warning/10 text-warning' : 'bg-brand-50 text-brand-600'"
          >
            <component :is="card.icon" class="h-5 w-5" :stroke-width="2" />
          </span>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">{{ card.label }}</p>
            <p class="font-display text-2xl font-bold tabular-nums" :class="card.warn && stats[card.key] > 0 ? 'text-warning' : 'text-base-content'">
              <Loader2 v-if="loading" class="h-5 w-5 animate-spin text-base-content/30" />
              <template v-else>{{ stats[card.key] }}</template>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="flex items-center gap-2 font-display font-bold text-base-content">
            <ReceiptText class="h-5 w-5 text-brand-600" :stroke-width="2" />
            การเบิกล่าสุด
          </h3>
          <RouterLink to="/withdrawals" class="link text-sm font-medium text-brand-600 no-underline hover:underline">
            ดูทั้งหมด
          </RouterLink>
        </div>

        <div v-if="recentLoading" class="py-10 text-center">
          <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
        </div>
        <div v-else-if="recentWithdrawals.length === 0" class="py-10 text-center text-sm text-base-content/40">
          ยังไม่มีการเบิกอุปกรณ์
        </div>
        <ul v-else class="space-y-1">
          <li v-for="w in recentWithdrawals" :key="w.id">
            <RouterLink
              :to="`/withdrawals/${w.id}`"
              class="flex items-center gap-3 rounded-xl px-2 py-2 -mx-2 transition-colors hover:bg-base-200/60"
              :class="{ 'opacity-50': w.voided }"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
              >
                {{ initialsOf(w.Technician?.name) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-base-content">{{ w.Technician?.name }}</p>
                <p class="truncate text-xs text-base-content/40">{{ formatDateTime(w.createdAt) }} · {{ w.receiptNo }}</p>
              </div>
              <span
                v-if="w.voided"
                class="shrink-0 rounded-full bg-error/10 px-2.5 py-1 text-xs font-medium text-error"
              >
                ยกเลิกแล้ว
              </span>
              <span v-else class="shrink-0 rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/70">
                {{ w.totalItems }} ชิ้น
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="flex items-center gap-2 font-display font-bold text-base-content">
            <TriangleAlert class="h-5 w-5 text-warning" :stroke-width="2" />
            อุปกรณ์ใกล้หมด
          </h3>
          <RouterLink to="/equipment" class="link text-sm font-medium text-brand-600 no-underline hover:underline">
            ดูคลังอุปกรณ์
          </RouterLink>
        </div>

        <div v-if="lowStockLoading" class="py-10 text-center">
          <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
        </div>
        <div v-else-if="lowStockItems.length === 0" class="flex flex-col items-center gap-2 py-10 text-center text-sm text-base-content/40">
          <PackageCheck class="h-8 w-8 text-success/60" :stroke-width="1.5" />
          สต็อกอุปกรณ์ทั้งหมดอยู่ในระดับปกติ
        </div>
        <ul v-else class="space-y-1">
          <li v-for="item in lowStockItems" :key="item.id">
            <div class="flex items-center gap-3 rounded-xl px-2 py-2 -mx-2">
              <span class="h-2 w-2 shrink-0 rounded-full bg-warning"></span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-base-content" :title="item.name">{{ item.name }}</p>
                <p class="truncate text-xs text-base-content/40">#{{ item.barcode }}</p>
              </div>
              <span class="shrink-0 text-sm font-semibold tabular-nums text-warning">
                {{ item.stockQty }} / {{ item.lowStockThreshold }} {{ item.unit }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h3 class="flex items-center gap-2 font-display font-bold text-base-content">
          <BarChart3 class="h-5 w-5 text-brand-600" :stroke-width="2" />
          เบิกบ่อยที่สุดเดือนนี้
        </h3>
        <RouterLink to="/reports" class="link text-sm font-medium text-brand-600 no-underline hover:underline">
          ดูรายงานฉบับเต็ม
        </RouterLink>
      </div>

      <div v-if="topItemsLoading" class="py-10 text-center">
        <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
      </div>
      <div v-else-if="topItems.length === 0" class="py-10 text-center text-sm text-base-content/40">
        ยังไม่มีข้อมูลการเบิกในเดือนนี้
      </div>
      <ul v-else class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <li v-for="item in topItems" :key="item.barcode" class="min-w-0">
          <div class="mb-1 flex items-baseline justify-between gap-2">
            <span class="truncate text-sm font-medium text-base-content" :title="item.name">{{ item.name }}</span>
            <span class="shrink-0 text-sm font-semibold tabular-nums text-base-content">
              {{ item.totalQty }} {{ item.unit }}
            </span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-base-200">
            <div class="h-full rounded-full bg-brand-600" :style="{ width: `${(item.totalQty / topItemsMax) * 100}%` }"></div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
