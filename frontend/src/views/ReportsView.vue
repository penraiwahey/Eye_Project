<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { categoryVisual } from '@/lib/categoryVisual'
import AppLogo from '@/components/AppLogo.vue'
import { BarChart3, Loader2, PackageSearch, Printer, ListOrdered, Award } from '@lucide/vue'

const auth = useAuthStore()

const period = ref('month')
const items = ref([])
const loading = ref(true)
const generatedAt = ref(new Date())

const maxQty = computed(() => Math.max(1, ...items.value.map((i) => i.totalQty)))

const periodLabel = computed(() =>
  period.value === 'month'
    ? new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    : 'ทั้งหมด (ทุกช่วงเวลา)',
)

const topItem = computed(() => items.value[0] ?? null)

async function loadReport() {
  loading.value = true
  try {
    const { data } = await api.get('/withdrawals/top-items', { params: { period: period.value, limit: 10 } })
    items.value = data.items
    generatedAt.value = new Date()
  } finally {
    loading.value = false
  }
}

function formatQty(n) {
  return n.toLocaleString('th-TH')
}

function shareOfTop(item) {
  return Math.round((item.totalQty / maxQty.value) * 100)
}

function printReport() {
  window.print()
}

watch(period, loadReport)
onMounted(loadReport)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3 print:hidden">
      <div>
        <h2 class="font-display text-xl font-bold text-base-content">รายงาน</h2>
        <p class="mt-1 text-sm text-base-content/50">อุปกรณ์ที่ถูกเบิกมากที่สุด ช่วยตัดสินใจสั่งซื้อ</p>
      </div>
      <button
        type="button"
        class="btn btn-sm gap-2"
        :disabled="loading || items.length === 0"
        @click="printReport"
      >
        <Printer class="h-4 w-4" :stroke-width="2" />
        พิมพ์ / บันทึก PDF
      </button>
    </div>

    <!-- Print-only masthead: gives the sheet a proper letterhead when handed to a customer -->
    <div class="hidden print:block">
      <div class="flex items-start justify-between border-b border-base-300 pb-4">
        <AppLogo />
        <div class="text-right text-xs text-base-content/50">
          <p>พิมพ์เมื่อ {{ generatedAt.toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' }) }}</p>
          <p v-if="auth.user">โดย {{ auth.user.name ?? auth.user.email }}</p>
        </div>
      </div>
      <h1 class="font-display mt-4 text-lg font-bold text-base-content">รายงานอุปกรณ์ที่เบิกบ่อยที่สุด</h1>
      <p class="text-sm text-base-content/60">ช่วงเวลา: {{ periodLabel }}</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3 print:break-inside-avoid print:grid-cols-3 print:gap-3">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm print:rounded-none print:shadow-none">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 print:hidden">
            <ListOrdered class="h-5 w-5" :stroke-width="2" />
          </span>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">รายการที่แสดง</p>
            <p class="font-display text-2xl font-bold tabular-nums text-base-content">
              <Loader2 v-if="loading" class="h-5 w-5 animate-spin text-base-content/30" />
              <template v-else>{{ items.length }}</template>
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm print:rounded-none print:shadow-none">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 print:hidden">
            <Award class="h-5 w-5" :stroke-width="2" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">อันดับ 1</p>
            <p class="truncate font-display text-base font-bold text-base-content" :title="topItem?.name">
              <Loader2 v-if="loading" class="h-5 w-5 animate-spin text-base-content/30" />
              <template v-else-if="topItem">{{ topItem.name }} · {{ formatQty(topItem.totalQty) }} {{ topItem.unit }}</template>
              <template v-else>-</template>
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm print:rounded-none print:shadow-none">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 print:hidden">
            <BarChart3 class="h-5 w-5" :stroke-width="2" />
          </span>
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ช่วงเวลา</p>
            <p class="font-display text-base font-bold text-base-content">{{ periodLabel }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div class="flex flex-wrap items-center justify-between gap-3 p-5 pb-4 print:hidden">
        <h3 class="flex items-center gap-2 font-display font-bold text-base-content">
          <BarChart3 class="h-5 w-5 text-brand-600" :stroke-width="2" />
          อุปกรณ์ที่เบิกบ่อยที่สุด
        </h3>
        <div class="join">
          <button
            type="button"
            class="btn btn-sm join-item"
            :class="period === 'month' ? 'btn-primary' : 'btn-ghost'"
            @click="period = 'month'"
          >
            เดือนนี้
          </button>
          <button
            type="button"
            class="btn btn-sm join-item"
            :class="period === 'all' ? 'btn-primary' : 'btn-ghost'"
            @click="period = 'all'"
          >
            ทั้งหมด
          </button>
        </div>
      </div>

      <div v-if="loading" class="py-14 text-center print:hidden">
        <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
      </div>

      <div v-else-if="items.length === 0" class="py-14 text-center text-base-content/40">
        <PackageSearch class="mx-auto mb-2 h-8 w-8 print:hidden" :stroke-width="1.5" />
        ยังไม่มีข้อมูลการเบิกในช่วงนี้
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-base-content/40 print:text-[10px]">
              <th class="w-10">#</th>
              <th>อุปกรณ์</th>
              <th class="w-2/5">ระดับการเบิก</th>
              <th class="text-right">จำนวน</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="item.barcode" class="print:break-inside-avoid">
              <td>
                <span
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold tabular-nums"
                  :class="index < 3 ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-base-300 text-base-content/40'"
                >
                  {{ index + 1 }}
                </span>
              </td>
              <td>
                <div class="flex min-w-0 items-center gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg print:hidden"
                    :class="categoryVisual(item.category).chip"
                  >
                    <component :is="categoryVisual(item.category).icon" class="h-4 w-4" :stroke-width="2" />
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-base-content" :title="item.name">{{ item.name }}</p>
                    <p class="truncate text-xs text-base-content/40">
                      #{{ item.barcode }}<span v-if="item.category"> · {{ item.category }}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td>
                <div class="h-2 overflow-hidden rounded-full border border-base-300 bg-base-200">
                  <div class="h-full rounded-full bg-brand-600" :style="{ width: `${shareOfTop(item)}%` }"></div>
                </div>
                <p class="mt-1 text-xs tabular-nums text-base-content/35">{{ shareOfTop(item) }}% ของอันดับ 1</p>
              </td>
              <td class="text-right whitespace-nowrap">
                <span class="text-sm font-semibold tabular-nums text-base-content">{{ formatQty(item.totalQty) }}</span>
                <span class="text-xs text-base-content/40"> {{ item.unit }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
