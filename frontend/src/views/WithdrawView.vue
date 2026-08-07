<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import api from '@/lib/api'
import BarcodeScannerModal from '@/components/BarcodeScannerModal.vue'
import { confirmAction } from '@/composables/useConfirm'
import {
  ScanBarcode,
  Camera,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileDown,
  RotateCcw,
  UserRound,
  PackageSearch,
} from '@lucide/vue'

const STORAGE_KEY = 'withdraw.technicianId'

const step = ref('pick-technician') // 'pick-technician' | 'scan' | 'receipt'
const technicians = ref([])
const technicianLoading = ref(true)
const selectedTechnicianId = ref(null)

const barcodeInput = ref('')
const barcodeInputRef = ref(null)
const scanError = ref('')
const scanLoading = ref(false)

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
let searchDebounce = null

const scannerOpen = ref(false)

const cart = ref([])
const confirmError = ref('')
const confirming = ref(false)
const lastReceipt = ref(null)

const selectedTechnician = computed(() =>
  technicians.value.find((t) => t.id === selectedTechnicianId.value),
)

const totalItems = computed(() => cart.value.reduce((sum, item) => sum + item.qty, 0))

async function loadTechnicians() {
  technicianLoading.value = true
  try {
    const { data } = await api.get('/technicians')
    technicians.value = data.technicians
  } finally {
    technicianLoading.value = false
  }
}

function pickTechnician(id) {
  selectedTechnicianId.value = id
  sessionStorage.setItem(STORAGE_KEY, String(id))
  step.value = 'scan'
  focusBarcodeInput()
}

async function changeTechnician() {
  if (cart.value.length > 0) {
    const ok = await confirmAction({
      title: 'เปลี่ยนช่างผู้เบิกใช่หรือไม่',
      message: `รายการที่สแกนไว้ ${totalItems.value} ชิ้นจะถูกล้างทิ้งทั้งหมด`,
      confirmText: 'เปลี่ยนช่าง',
    })
    if (!ok) return
  }

  selectedTechnicianId.value = null
  sessionStorage.removeItem(STORAGE_KEY)
  cart.value = []
  step.value = 'pick-technician'
}

function focusBarcodeInput() {
  nextTick(() => barcodeInputRef.value?.focus())
}

function addToCart(equipment) {
  const existing = cart.value.find((item) => item.equipmentId === equipment.id)
  if (existing) {
    if (existing.qty >= equipment.stockQty) {
      scanError.value = `"${equipment.name}" มีสต็อกคงเหลือ ${equipment.stockQty} ${equipment.unit} เท่านั้น`
      return
    }
    existing.qty += 1
  } else {
    cart.value.push({
      equipmentId: equipment.id,
      barcode: equipment.barcode,
      name: equipment.name,
      unit: equipment.unit,
      stockQty: equipment.stockQty,
      qty: 1,
    })
  }
  scanError.value = ''
}

async function handleBarcodeSubmit() {
  const code = barcodeInput.value.trim()
  if (!code) return

  scanLoading.value = true
  scanError.value = ''
  try {
    const { data } = await api.get(`/equipment/lookup/${encodeURIComponent(code)}`)
    addToCart(data.equipment)
  } catch (err) {
    scanError.value = err.response?.data?.message ?? 'ไม่พบอุปกรณ์รหัสนี้'
  } finally {
    barcodeInput.value = ''
    scanLoading.value = false
    focusBarcodeInput()
  }
}

function handleSearchInput() {
  clearTimeout(searchDebounce)
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }
  searchDebounce = setTimeout(async () => {
    searching.value = true
    try {
      const { data } = await api.get('/equipment', { params: { q } })
      searchResults.value = data.equipment
    } finally {
      searching.value = false
    }
  }, 300)
}

function selectSearchResult(equipment) {
  addToCart(equipment)
  searchQuery.value = ''
  searchResults.value = []
  focusBarcodeInput()
}

function handleScanDecode(code) {
  scannerOpen.value = false
  barcodeInput.value = code
  handleBarcodeSubmit()
}

function incrementQty(item) {
  if (item.qty >= item.stockQty) return
  item.qty += 1
}

function decrementQty(item) {
  if (item.qty <= 1) return
  item.qty -= 1
}

function removeItem(item) {
  cart.value = cart.value.filter((i) => i.equipmentId !== item.equipmentId)
}

async function confirmWithdrawal() {
  const ok = await confirmAction({
    title: 'ยืนยันการเบิกอุปกรณ์ใช่หรือไม่',
    message: `เบิกอุปกรณ์ ${totalItems.value} ชิ้น (${cart.value.length} รายการ) ให้ "${selectedTechnician.value?.name}" — สต็อกจะถูกตัดออกทันทีเมื่อยืนยัน`,
    confirmText: 'ยืนยันการเบิก',
    tone: 'primary',
  })
  if (!ok) return

  confirmError.value = ''
  confirming.value = true
  try {
    const { data } = await api.post('/withdrawals', {
      technicianId: selectedTechnicianId.value,
      items: cart.value.map((item) => ({ equipmentId: item.equipmentId, qty: item.qty })),
    })
    lastReceipt.value = data.withdrawal
    cart.value = []
    step.value = 'receipt'
  } catch (err) {
    confirmError.value = err.response?.data?.message ?? 'ยืนยันการเบิกไม่สำเร็จ'
  } finally {
    confirming.value = false
  }
}

function startNewWithdrawal() {
  lastReceipt.value = null
  step.value = 'scan'
  focusBarcodeInput()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })
}

onMounted(async () => {
  await loadTechnicians()
  const stored = sessionStorage.getItem(STORAGE_KEY)
  if (stored && technicians.value.some((t) => t.id === Number(stored))) {
    selectedTechnicianId.value = Number(stored)
    step.value = 'scan'
    focusBarcodeInput()
  }
})

watch(step, (value) => {
  if (value === 'scan') focusBarcodeInput()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-display text-xl font-bold text-base-content">เบิกอุปกรณ์</h2>
      <p class="mt-1 text-sm text-base-content/50">สแกนหรือค้นหาอุปกรณ์ที่ต้องการเบิกออกจากคลัง</p>
    </div>

    <!-- Step: pick technician -->
    <div v-if="step === 'pick-technician'" class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
      <h3 class="mb-4 flex items-center gap-2 font-display font-bold text-base-content">
        <UserRound class="h-5 w-5 text-brand-600" :stroke-width="2" />
        เลือกชื่อช่างผู้เบิก
      </h3>

      <div v-if="technicianLoading" class="py-10 text-center">
        <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
      </div>
      <div v-else-if="technicians.length === 0" class="py-10 text-center text-sm text-base-content/40">
        ยังไม่มีรายชื่อช่างในระบบ — ให้แอดมินเพิ่มที่หน้า "รายชื่อช่าง" ก่อน
      </div>
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="tech in technicians"
          :key="tech.id"
          type="button"
          class="flex flex-col items-center gap-2 rounded-xl border border-base-300 p-4 text-center transition-colors hover:border-brand-500 hover:bg-brand-50"
          @click="pickTechnician(tech.id)"
        >
          <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
            {{ tech.name.slice(0, 1).toUpperCase() }}
          </span>
          <span class="text-sm font-medium text-base-content">{{ tech.name }}</span>
        </button>
      </div>
    </div>

    <!-- Step: scan + cart -->
    <div v-else-if="step === 'scan'" class="grid gap-6 lg:grid-cols-5">
      <div class="space-y-4 lg:order-2 lg:col-span-2">
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <div class="flex min-w-0 items-center gap-2 text-sm text-base-content/60">
            <UserRound class="h-4 w-4 shrink-0" :stroke-width="2" />
            <span class="truncate">ช่างผู้เบิก: <span class="font-semibold text-base-content">{{ selectedTechnician?.name }}</span></span>
          </div>
          <button type="button" class="link shrink-0 text-sm text-brand-600" @click="changeTechnician">เปลี่ยนช่าง</button>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <label class="mb-2 flex items-center gap-2 text-sm font-medium text-base-content/70">
            <ScanBarcode class="h-4 w-4" :stroke-width="2" />
            สแกนบาร์โค้ด (เครื่องสแกน USB หรือกรอกรหัสด้วยมือ)
          </label>
          <div class="flex gap-2">
            <input
              ref="barcodeInputRef"
              v-model="barcodeInput"
              type="text"
              autofocus
              placeholder="สแกนหรือพิมพ์รหัสบาร์โค้ดแล้วกด Enter"
              class="input input-bordered flex-1 focus:input-primary"
              @keyup.enter="handleBarcodeSubmit"
            />
            <button type="button" class="btn btn-square btn-outline" @click="scannerOpen = true">
              <Camera class="h-4 w-4" :stroke-width="2" />
            </button>
          </div>
          <div v-if="scanLoading" class="mt-2 flex items-center gap-2 text-sm text-base-content/40">
            <Loader2 class="h-3.5 w-3.5 animate-spin" :stroke-width="2" />
            กำลังค้นหา...
          </div>
          <div v-else-if="scanError" class="mt-2 flex items-center gap-2 text-sm text-error">
            <AlertCircle class="h-3.5 w-3.5 shrink-0" :stroke-width="2" />
            {{ scanError }}
          </div>
        </div>

        <div class="relative rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <label class="mb-2 flex items-center gap-2 text-sm font-medium text-base-content/70">
            <Search class="h-4 w-4" :stroke-width="2" />
            ค้นหาด้วยชื่ออุปกรณ์
          </label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="พิมพ์ชื่ออุปกรณ์เพื่อค้นหา"
            class="input input-bordered w-full focus:input-primary"
            @input="handleSearchInput"
          />
          <ul
            v-if="searchQuery && (searching || searchResults.length > 0)"
            class="absolute inset-x-5 z-10 mt-1 max-h-64 overflow-y-auto rounded-lg border border-base-300 bg-base-100 shadow-lg"
          >
            <li v-if="searching" class="px-3 py-3 text-center text-sm text-base-content/40">
              <Loader2 class="mx-auto h-4 w-4 animate-spin" :stroke-width="2" />
            </li>
            <li v-else-if="searchResults.length === 0" class="px-3 py-3 text-center text-sm text-base-content/40">
              ไม่พบอุปกรณ์
            </li>
            <li v-for="item in searchResults" :key="item.id">
              <button
                type="button"
                class="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-base-200"
                @click="selectSearchResult(item)"
              >
                <span>
                  <span class="block font-medium text-base-content">{{ item.name }}</span>
                  <span class="text-xs text-base-content/40">{{ item.barcode }} · คงเหลือ {{ item.stockQty }} {{ item.unit }}</span>
                </span>
                <Plus class="mt-0.5 h-4 w-4 shrink-0 text-brand-600" :stroke-width="2" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="lg:order-1 lg:col-span-3">
        <div class="flex h-full flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h3 class="mb-3 font-display font-bold text-base-content">รายการเบิก ({{ totalItems }} ชิ้น)</h3>

          <div v-if="cart.length === 0" class="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-base-content/40">
            <PackageSearch class="h-8 w-8" :stroke-width="1.5" />
            <p class="text-sm">ยังไม่มีรายการ — สแกนหรือค้นหาอุปกรณ์เพื่อเพิ่ม</p>
          </div>

          <ul v-else class="flex-1 space-y-2 overflow-y-auto">
            <li
              v-for="item in cart"
              :key="item.equipmentId"
              class="rounded-lg border border-base-300 p-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-base-content">{{ item.name }}</p>
                  <p class="text-xs text-base-content/40">{{ item.barcode }}</p>
                </div>
                <button type="button" class="btn btn-square btn-ghost btn-sm text-error" @click="removeItem(item)">
                  <Trash2 class="h-4 w-4" :stroke-width="2" />
                </button>
              </div>
              <div class="mt-2 flex items-center justify-between">
                <div class="join">
                  <button type="button" class="btn btn-sm join-item" @click="decrementQty(item)">
                    <Minus class="h-3.5 w-3.5" :stroke-width="2.5" />
                  </button>
                  <span class="join-item flex w-10 items-center justify-center border-y border-base-300 text-sm font-semibold">
                    {{ item.qty }}
                  </span>
                  <button type="button" class="btn btn-sm join-item" @click="incrementQty(item)">
                    <Plus class="h-3.5 w-3.5" :stroke-width="2.5" />
                  </button>
                </div>
                <span class="text-xs text-base-content/40">{{ item.unit }} · คงเหลือ {{ item.stockQty }}</span>
              </div>
            </li>
          </ul>

          <div class="mt-4 space-y-2 border-t border-base-300 pt-4">
            <div
              v-if="confirmError"
              class="flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error"
            >
              <AlertCircle class="h-4 w-4 shrink-0" :stroke-width="2" />
              <span>{{ confirmError }}</span>
            </div>
            <button
              type="button"
              class="btn btn-primary w-full"
              :disabled="cart.length === 0 || confirming"
              @click="confirmWithdrawal"
            >
              <Loader2 v-if="confirming" class="h-4 w-4 animate-spin" :stroke-width="2" />
              ยืนยันการเบิก
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Step: receipt -->
    <div v-else-if="step === 'receipt' && lastReceipt" class="mx-auto max-w-lg">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-6 text-center shadow-sm">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 class="h-7 w-7" :stroke-width="2" />
        </span>
        <h3 class="mt-4 font-display text-lg font-bold text-base-content">เบิกอุปกรณ์สำเร็จ</h3>
        <p class="mt-1 text-sm text-base-content/50">เลขที่ใบเบิก {{ lastReceipt.receiptNo }}</p>

        <div class="mt-5 rounded-xl border border-base-300 text-left">
          <div class="space-y-1 border-b border-base-300 p-4 text-sm">
            <p class="text-base-content/50">ช่างผู้เบิก: <span class="font-medium text-base-content">{{ lastReceipt.Technician?.name }}</span></p>
            <p class="text-base-content/50">วันที่: <span class="font-medium text-base-content">{{ formatDateTime(lastReceipt.createdAt) }}</span></p>
          </div>
          <ul class="divide-y divide-base-300">
            <li v-for="item in lastReceipt.items" :key="item.id" class="flex items-center justify-between px-4 py-2.5 text-sm">
              <span class="truncate pr-2 text-base-content/80">{{ item.name }}</span>
              <span class="shrink-0 font-medium text-base-content">{{ item.qty }} {{ item.unit }}</span>
            </li>
          </ul>
          <div class="flex items-center justify-between border-t border-base-300 p-4 text-sm font-semibold">
            <span>รวมทั้งหมด</span>
            <span>{{ lastReceipt.totalItems }} ชิ้น</span>
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-2 sm:flex-row">
          <a
            :href="`/api/withdrawals/${lastReceipt.id}/pdf`"
            target="_blank"
            rel="noopener"
            class="btn btn-outline flex-1"
          >
            <FileDown class="h-4 w-4" :stroke-width="2" />
            ดาวน์โหลด PDF
          </a>
          <button type="button" class="btn btn-primary flex-1" @click="startNewWithdrawal">
            <RotateCcw class="h-4 w-4" :stroke-width="2" />
            เบิกรายการใหม่
          </button>
        </div>
      </div>
    </div>

    <BarcodeScannerModal
      :open="scannerOpen"
      @close="scannerOpen = false"
      @decode="handleScanDecode"
    />
  </div>
</template>
