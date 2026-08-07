<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/api'
import {
  Search,
  Loader2,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Layers,
} from '@lucide/vue'

const stockReceipts = ref([])
const loading = ref(true)
const total = ref(0)
const pageSize = 20

const filters = reactive({ dateFrom: '', dateTo: '', receiptNo: '' })
const page = ref(1)

let debounceTimer = null

const hasActiveFilters = computed(() => Boolean(filters.dateFrom || filters.dateTo || filters.receiptNo))

function initialsOf(name) {
  return (name ?? '?').slice(0, 1).toUpperCase()
}

async function loadStockReceipts() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo
    if (filters.receiptNo) params.receiptNo = filters.receiptNo

    const { data } = await api.get('/stock-receipts', { params })
    stockReceipts.value = data.stockReceipts
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadStockReceipts, 300)
}

function clearFilters() {
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.receiptNo = ''
  onFilterChange()
}

function goToPage(next) {
  const maxPage = Math.max(Math.ceil(total.value / pageSize), 1)
  if (next < 1 || next > maxPage) return
  page.value = next
  loadStockReceipts()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadStockReceipts)
</script>

<template>
  <div class="space-y-6">
    <div>
      <RouterLink to="/receive-stock" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" />
        กลับไปหน้ารับเข้าสต็อก
      </RouterLink>
      <h2 class="mt-2 font-display text-xl font-bold text-base-content">ประวัติการรับเข้าสต็อก</h2>
      <p class="mt-1 text-sm text-base-content/50">ดูรายการรับเข้าอุปกรณ์ทั้งหมด กรองตามช่วงวันที่ได้</p>
    </div>

    <div class="grid gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">จากวันที่</legend>
        <input v-model="filters.dateFrom" type="date" class="input input-bordered input-sm w-full" @change="onFilterChange" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">ถึงวันที่</legend>
        <input v-model="filters.dateTo" type="date" class="input input-bordered input-sm w-full" @change="onFilterChange" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">เลขที่ใบรับเข้า</legend>
        <label class="input input-bordered input-sm flex w-full items-center gap-2">
          <Search class="h-3.5 w-3.5 text-base-content/40" :stroke-width="2" />
          <input v-model="filters.receiptNo" type="text" class="grow" placeholder="RC..." @input="onFilterChange" />
        </label>
      </fieldset>
      <div v-if="hasActiveFilters" class="flex items-end">
        <button type="button" class="btn btn-ghost btn-sm text-base-content/50" @click="clearFilters">ล้างตัวกรอง</button>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-base-content/40">
              <th>เลขที่ใบรับเข้า</th>
              <th>ผู้บันทึก</th>
              <th>หมายเหตุ</th>
              <th>วันที่</th>
              <th class="text-right">จำนวนรวม</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="py-12 text-center">
                <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
              </td>
            </tr>
            <tr v-else-if="stockReceipts.length === 0">
              <td colspan="6" class="py-14 text-center text-base-content/40">
                <PackageSearch class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ไม่พบใบรับเข้าที่ตรงกับเงื่อนไข
              </td>
            </tr>
            <tr v-for="r in stockReceipts" :key="r.id" class="hover:bg-base-200/60">
              <td>
                <span class="rounded-md bg-base-200 px-2 py-1 font-mono text-xs font-medium text-base-content">
                  {{ r.receiptNo }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-2.5">
                  <span
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
                  >
                    {{ initialsOf(r.User?.name) }}
                  </span>
                  <span class="text-base-content">{{ r.User?.name ?? '-' }}</span>
                </div>
              </td>
              <td class="max-w-xs truncate text-base-content/60">{{ r.note || '-' }}</td>
              <td class="whitespace-nowrap text-base-content/60">{{ formatDateTime(r.createdAt) }}</td>
              <td class="text-right">
                <span class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                  <Layers class="h-3 w-3" :stroke-width="2.5" />
                  +{{ r.totalItems }}
                </span>
              </td>
              <td class="text-right">
                <RouterLink :to="`/stock-receipts/${r.id}`" class="btn btn-ghost btn-sm">ดูรายละเอียด</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && stockReceipts.length > 0" class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 px-4 py-3">
        <p class="text-sm text-base-content/50">ทั้งหมด {{ total }} รายการ</p>
        <div v-if="total > pageSize" class="join">
          <button type="button" class="btn btn-sm join-item" :disabled="page <= 1" @click="goToPage(page - 1)">
            <ChevronLeft class="h-4 w-4" :stroke-width="2" />
          </button>
          <span class="join-item btn btn-sm btn-disabled">หน้า {{ page }}</span>
          <button
            type="button"
            class="btn btn-sm join-item"
            :disabled="page >= Math.ceil(total / pageSize)"
            @click="goToPage(page + 1)"
          >
            <ChevronRight class="h-4 w-4" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
