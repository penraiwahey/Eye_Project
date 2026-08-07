<script setup>
import { ref, computed, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
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
  RotateCcw,
  PackagePlus,
  History,
} from '@lucide/vue'

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
const note = ref('')
const confirmError = ref('')
const confirming = ref(false)
const lastReceipt = ref(null)

const totalItems = computed(() => cart.value.reduce((sum, item) => sum + item.qty, 0))

function focusBarcodeInput() {
  nextTick(() => barcodeInputRef.value?.focus())
}

function addToCart(equipment) {
  const existing = cart.value.find((item) => item.equipmentId === equipment.id)
  if (existing) {
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
  item.qty += 1
}

function decrementQty(item) {
  if (item.qty <= 1) return
  item.qty -= 1
}

function removeItem(item) {
  cart.value = cart.value.filter((i) => i.equipmentId !== item.equipmentId)
}

async function confirmReceive() {
  const ok = await confirmAction({
    title: 'ยืนยันรับเข้าสต็อกใช่หรือไม่',
    message: `รับเข้าอุปกรณ์ ${totalItems.value} ชิ้น (${cart.value.length} รายการ) เข้าคลัง`,
    confirmText: 'ยืนยันรับเข้า',
    tone: 'primary',
  })
  if (!ok) return

  confirmError.value = ''
  confirming.value = true
  try {
    const { data } = await api.post('/stock-receipts', {
      note: note.value.trim() || null,
      items: cart.value.map((item) => ({ equipmentId: item.equipmentId, qty: item.qty })),
    })
    lastReceipt.value = data.stockReceipt
    cart.value = []
    note.value = ''
  } catch (err) {
    confirmError.value = err.response?.data?.message ?? 'บันทึกการรับเข้าไม่สำเร็จ'
  } finally {
    confirming.value = false
  }
}

function startNewReceive() {
  lastReceipt.value = null
  focusBarcodeInput()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-display text-xl font-bold text-base-content">รับเข้าสต็อก</h2>
        <p class="mt-1 text-sm text-base-content/50">สแกนหรือค้นหาอุปกรณ์ที่ต้องการเพิ่มเข้าคลัง</p>
      </div>
      <RouterLink to="/stock-receipts" class="link flex items-center gap-1.5 text-sm text-brand-600">
        <History class="h-4 w-4" :stroke-width="2" />
        ดูประวัติการรับเข้า
      </RouterLink>
    </div>

    <div v-if="!lastReceipt" class="grid gap-6 lg:grid-cols-5">
      <div class="space-y-4 lg:order-2 lg:col-span-2">
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

        <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <label class="mb-2 block text-sm font-medium text-base-content/70">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            v-model="note"
            rows="2"
            placeholder="เช่น ซื้อจากร้าน A, restock ประจำเดือน"
            class="textarea textarea-bordered w-full focus:textarea-primary"
          ></textarea>
        </div>
      </div>

      <div class="lg:order-1 lg:col-span-3">
        <div class="flex h-full flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h3 class="mb-3 font-display font-bold text-base-content">รายการรับเข้า ({{ totalItems }} ชิ้น)</h3>

          <div v-if="cart.length === 0" class="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-base-content/40">
            <PackagePlus class="h-8 w-8" :stroke-width="1.5" />
            <p class="text-sm">ยังไม่มีรายการ — สแกนหรือค้นหาอุปกรณ์เพื่อเพิ่ม</p>
          </div>

          <ul v-else class="flex-1 space-y-2 overflow-y-auto">
            <li v-for="item in cart" :key="item.equipmentId" class="rounded-lg border border-base-300 p-3">
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
              @click="confirmReceive"
            >
              <Loader2 v-if="confirming" class="h-4 w-4 animate-spin" :stroke-width="2" />
              ยืนยันรับเข้าสต็อก
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mx-auto max-w-lg">
      <div class="rounded-2xl border border-base-300 bg-base-100 p-6 text-center shadow-sm">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 class="h-7 w-7" :stroke-width="2" />
        </span>
        <h3 class="mt-4 font-display text-lg font-bold text-base-content">รับเข้าสต็อกสำเร็จ</h3>
        <p class="mt-1 text-sm text-base-content/50">เลขที่ใบรับเข้า {{ lastReceipt.receiptNo }}</p>

        <div class="mt-5 rounded-xl border border-base-300 text-left">
          <div class="space-y-1 border-b border-base-300 p-4 text-sm">
            <p class="text-base-content/50">วันที่: <span class="font-medium text-base-content">{{ formatDateTime(lastReceipt.createdAt) }}</span></p>
            <p v-if="lastReceipt.note" class="text-base-content/50">หมายเหตุ: <span class="font-medium text-base-content">{{ lastReceipt.note }}</span></p>
          </div>
          <ul class="divide-y divide-base-300">
            <li v-for="item in lastReceipt.items" :key="item.id" class="flex items-center justify-between px-4 py-2.5 text-sm">
              <span class="truncate pr-2 text-base-content/80">{{ item.name }}</span>
              <span class="shrink-0 font-medium text-base-content">+{{ item.qty }} {{ item.unit }}</span>
            </li>
          </ul>
          <div class="flex items-center justify-between border-t border-base-300 p-4 text-sm font-semibold">
            <span>รวมทั้งหมด</span>
            <span>{{ lastReceipt.totalItems }} ชิ้น</span>
          </div>
        </div>

        <button type="button" class="btn btn-primary mt-5 w-full" @click="startNewReceive">
          <RotateCcw class="h-4 w-4" :stroke-width="2" />
          รับเข้ารายการใหม่
        </button>
      </div>
    </div>

    <BarcodeScannerModal :open="scannerOpen" @close="scannerOpen = false" @decode="handleScanDecode" />
  </div>
</template>
