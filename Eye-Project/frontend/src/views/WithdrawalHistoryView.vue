<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/api'
import {
  Search,
  Loader2,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Layers,
  PackageSearch,
} from '@lucide/vue'

const withdrawals = ref([])
const technicians = ref([])
const loading = ref(true)
const total = ref(0)
const pageSize = 20

const summary = ref({ totalWithdrawals: 0, totalItemsWithdrawn: 0, withdrawalsThisMonth: 0 })

const filters = reactive({
  technicianId: '',
  dateFrom: '',
  dateTo: '',
  receiptNo: '',
})
const page = ref(1)

let debounceTimer = null

const hasActiveFilters = computed(
  () => Boolean(filters.technicianId || filters.dateFrom || filters.dateTo || filters.receiptNo),
)

function initialsOf(name) {
  return (name ?? '?').slice(0, 1).toUpperCase()
}

async function loadTechnicians() {
  const { data } = await api.get('/technicians', { params: { includeInactive: true } })
  technicians.value = data.technicians
}

async function loadSummary() {
  const { data } = await api.get('/withdrawals/summary')
  summary.value = data
}

async function loadWithdrawals() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize }
    if (filters.technicianId) params.technicianId = filters.technicianId
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo
    if (filters.receiptNo) params.receiptNo = filters.receiptNo

    const { data } = await api.get('/withdrawals', { params })
    withdrawals.value = data.withdrawals
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadWithdrawals, 300)
}

function clearFilters() {
  filters.technicianId = ''
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.receiptNo = ''
  onFilterChange()
}

function goToPage(next) {
  const maxPage = Math.max(Math.ceil(total.value / pageSize), 1)
  if (next < 1 || next > maxPage) return
  page.value = next
  loadWithdrawals()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(async () => {
  await Promise.all([loadTechnicians(), loadSummary(), loadWithdrawals()])
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-display text-xl font-bold text-base-content">ประวัติการเบิก</h2>
      <p class="mt-1 text-sm text-base-content/50">ดูรายการใบเบิกอุปกรณ์ทั้งหมด กรองตามช่างหรือช่วงวันที่ได้</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ReceiptText class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ใบเบิกทั้งหมด</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.totalWithdrawals }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Layers class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ชิ้นที่เบิกไปทั้งหมด</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.totalItemsWithdrawn }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <CalendarDays class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ใบเบิกเดือนนี้</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.withdrawalsThisMonth }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">ช่าง</legend>
        <select v-model="filters.technicianId" class="select select-bordered select-sm w-full" @change="onFilterChange">
          <option value="">ทั้งหมด</option>
          <option v-for="t in technicians" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">จากวันที่</legend>
        <input v-model="filters.dateFrom" type="date" class="input input-bordered input-sm w-full" @change="onFilterChange" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">ถึงวันที่</legend>
        <input v-model="filters.dateTo" type="date" class="input input-bordered input-sm w-full" @change="onFilterChange" />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">เลขที่ใบเบิก</legend>
        <label class="input input-bordered input-sm flex w-full items-center gap-2">
          <Search class="h-3.5 w-3.5 text-base-content/40" :stroke-width="2" />
          <input v-model="filters.receiptNo" type="text" class="grow" placeholder="WD..." @input="onFilterChange" />
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
              <th>เลขที่ใบเบิก</th>
              <th>ช่าง</th>
              <th>วันที่</th>
              <th class="text-right">จำนวนรวม</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="py-12 text-center">
                <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
              </td>
            </tr>
            <tr v-else-if="withdrawals.length === 0">
              <td colspan="5" class="py-14 text-center text-base-content/40">
                <PackageSearch class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ไม่พบใบเบิกที่ตรงกับเงื่อนไข
                <button v-if="hasActiveFilters" type="button" class="link mx-auto mt-1 block text-brand-600" @click="clearFilters">
                  ล้างตัวกรอง
                </button>
              </td>
            </tr>
            <tr v-for="w in withdrawals" :key="w.id" class="hover:bg-base-200/60" :class="{ 'opacity-50': w.voided }">
              <td>
                <div class="flex items-center gap-2">
                  <span class="rounded-md bg-base-200 px-2 py-1 font-mono text-xs font-medium text-base-content">
                    {{ w.receiptNo }}
                  </span>
                  <span
                    v-if="w.voided"
                    class="inline-flex items-center rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error"
                  >
                    ยกเลิกแล้ว
                  </span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-2.5">
                  <span
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
                  >
                    {{ initialsOf(w.Technician?.name) }}
                  </span>
                  <span class="text-base-content">{{ w.Technician?.name }}</span>
                </div>
              </td>
              <td class="text-base-content/60">{{ formatDateTime(w.createdAt) }}</td>
              <td class="text-right">
                <span class="inline-flex items-center rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/70">
                  {{ w.totalItems }} ชิ้น
                </span>
              </td>
              <td class="text-right">
                <RouterLink :to="`/withdrawals/${w.id}`" class="btn btn-ghost btn-sm">ดูรายละเอียด</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && withdrawals.length > 0" class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 px-4 py-3">
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
