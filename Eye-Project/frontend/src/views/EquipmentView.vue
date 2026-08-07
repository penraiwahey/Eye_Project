<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { renderBarcodeSvg, printBarcode } from '@/lib/barcodePrint'
import { categoryVisual } from '@/lib/categoryVisual'
import { confirmAction } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  Boxes,
  Layers,
  PackageSearch,
  Sparkles,
  Barcode,
  Printer,
  Search,
  Upload,
  FileUp,
  CheckCircle2,
  History,
  RotateCcw,
} from '@lucide/vue'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const equipment = ref([])
const loading = ref(true)
const errorMessage = ref('')

const searchQuery = ref('')
const categoryFilter = ref('')
const lowStockOnly = ref(false)

const modalRef = ref(null)
const editingId = ref(null)
const form = reactive({
  barcode: '',
  name: '',
  category: '',
  compatibleModels: '',
  unit: 'ชิ้น',
  stockQty: 0,
  lowStockThreshold: 5,
})
const formError = ref('')
const saving = ref(false)
const generatingBarcode = ref(false)

const barcodeModalRef = ref(null)
const barcodeSvgContainer = ref(null)
const barcodeModalItem = ref(null)

const importModalRef = ref(null)
const importFile = ref(null)
const importing = ref(false)
const importError = ref('')
const importResult = ref(null)

const categories = computed(() => {
  const set = new Set(equipment.value.map((e) => e.category).filter(Boolean))
  return [...set].sort()
})

const summary = computed(() => ({
  skuCount: equipment.value.length,
  totalUnits: equipment.value.reduce((sum, e) => sum + e.stockQty, 0),
  lowStockCount: equipment.value.filter((e) => e.isLowStock).length,
}))

const filteredEquipment = computed(() => {
  return equipment.value.filter((item) => {
    if (lowStockOnly.value && !item.isLowStock) return false
    if (categoryFilter.value && item.category !== categoryFilter.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.trim().toLowerCase()
      const haystack = `${item.name} ${item.barcode} ${item.category ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

const hasActiveFilters = computed(() => Boolean(searchQuery.value || categoryFilter.value || lowStockOnly.value))

function clearFilters() {
  searchQuery.value = ''
  categoryFilter.value = ''
  lowStockOnly.value = false
}

async function loadEquipment() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await api.get('/equipment')
    equipment.value = data.equipment
  } catch {
    errorMessage.value = 'โหลดข้อมูลอุปกรณ์ไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.barcode = ''
  form.name = ''
  form.category = ''
  form.compatibleModels = ''
  form.unit = 'ชิ้น'
  form.stockQty = 0
  form.lowStockThreshold = 5
}

function openCreateModal() {
  editingId.value = null
  resetForm()
  formError.value = ''
  modalRef.value?.showModal()
}

function openEditModal(item) {
  editingId.value = item.id
  form.barcode = item.barcode
  form.name = item.name
  form.category = item.category ?? ''
  form.compatibleModels = item.compatibleModels ?? ''
  form.unit = item.unit
  form.stockQty = item.stockQty
  form.lowStockThreshold = item.lowStockThreshold
  formError.value = ''
  modalRef.value?.showModal()
}

function closeModal() {
  modalRef.value?.close()
}

async function submitForm() {
  formError.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/equipment/${editingId.value}`, form)
      toast.success('บันทึกข้อมูลอุปกรณ์เรียบร้อยแล้ว')
    } else {
      await api.post('/equipment', form)
      toast.success('เพิ่มอุปกรณ์เรียบร้อยแล้ว')
    }
    closeModal()
    await loadEquipment()
  } catch (err) {
    formError.value = err.response?.data?.message ?? 'บันทึกข้อมูลไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function generateBarcode() {
  generatingBarcode.value = true
  try {
    const { data } = await api.get('/equipment/generate-barcode')
    form.barcode = data.barcode
  } finally {
    generatingBarcode.value = false
  }
}

function openBarcodeModal(item) {
  barcodeModalItem.value = item
  barcodeModalRef.value?.showModal()
  nextTick(() => {
    if (!barcodeSvgContainer.value) return
    barcodeSvgContainer.value.innerHTML = ''
    barcodeSvgContainer.value.appendChild(renderBarcodeSvg(item.barcode))
  })
}

function closeBarcodeModal() {
  barcodeModalRef.value?.close()
}

function handlePrintBarcode() {
  if (!barcodeModalItem.value) return
  printBarcode(barcodeModalItem.value.barcode, barcodeModalItem.value.name)
}

function openImportModal() {
  importFile.value = null
  importError.value = ''
  importResult.value = null
  importModalRef.value?.showModal()
}

function closeImportModal() {
  importModalRef.value?.close()
}

function handleImportFileChange(e) {
  importFile.value = e.target.files[0] ?? null
}

async function submitImport() {
  if (!importFile.value) return

  const ok = await confirmAction({
    title: 'ยืนยันนำเข้าไฟล์นี้ใช่หรือไม่',
    message: `ระบบจะสร้าง/อัปเดตอุปกรณ์ตามข้อมูลในไฟล์ "${importFile.value.name}"`,
    confirmText: 'นำเข้า',
    tone: 'primary',
  })
  if (!ok) return

  importError.value = ''
  importResult.value = null
  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    const { data } = await api.post('/equipment/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    importResult.value = data
    await loadEquipment()
  } catch (err) {
    importError.value = err.response?.data?.message ?? 'นำเข้าไฟล์ไม่สำเร็จ'
  } finally {
    importing.value = false
  }
}

function resetImportForm() {
  importFile.value = null
  importError.value = ''
  importResult.value = null
}

async function deleteItem(item) {
  const ok = await confirmAction({
    title: 'ลบอุปกรณ์นี้ใช่หรือไม่',
    message: `"${item.name}" จะถูกลบออกจากคลังอย่างถาวร`,
    confirmText: 'ลบอุปกรณ์',
  })
  if (!ok) return
  try {
    await api.delete(`/equipment/${item.id}`)
    await loadEquipment()
    toast.success(`ลบอุปกรณ์ "${item.name}" เรียบร้อยแล้ว`)
  } catch (err) {
    errorMessage.value = err.response?.data?.message ?? 'ลบอุปกรณ์ไม่สำเร็จ'
  }
}

onMounted(loadEquipment)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-display text-xl font-bold text-base-content">คลังอุปกรณ์</h2>
        <p class="mt-1 text-sm text-base-content/50">รายการอุปกรณ์และสต็อกคงเหลือทั้งหมด</p>
      </div>
      <div v-if="isAdmin" class="flex gap-2">
        <button class="btn btn-outline" @click="openImportModal">
          <Upload class="h-4 w-4" :stroke-width="2" />
          นำเข้า CSV
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus class="h-4 w-4" :stroke-width="2.5" />
          เพิ่มอุปกรณ์
        </button>
      </div>
    </div>

    <div
      v-if="errorMessage"
      role="alert"
      class="flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
    >
      <AlertCircle class="h-4 w-4 shrink-0" :stroke-width="2" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Boxes class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">รายการทั้งหมด</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.skuCount }} SKU</p>
        </div>
      </div>
      <div class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Layers class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">จำนวนหน่วยรวม</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.totalUnits }}</p>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors"
        :class="
          lowStockOnly
            ? 'border-warning bg-warning/10'
            : 'border-base-300 bg-base-100 hover:border-warning/40'
        "
        @click="lowStockOnly = !lowStockOnly"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <AlertCircle class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ใกล้หมด</p>
          <p class="font-display text-xl font-bold tabular-nums" :class="summary.lowStockCount > 0 ? 'text-warning' : 'text-base-content'">
            {{ summary.lowStockCount }}
          </p>
        </div>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
      <label class="input input-bordered input-sm flex min-w-[200px] flex-1 items-center gap-2">
        <Search class="h-3.5 w-3.5 text-base-content/40" :stroke-width="2" />
        <input v-model="searchQuery" type="text" class="grow" placeholder="ค้นหาชื่อ บาร์โค้ด หรือหมวดหมู่" />
      </label>
      <select v-model="categoryFilter" class="select select-bordered select-sm w-full sm:w-48">
        <option value="">ทุกหมวดหมู่</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="btn btn-ghost btn-sm text-base-content/50"
        @click="clearFilters"
      >
        ล้างตัวกรอง
      </button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-base-content/40">
              <th>อุปกรณ์</th>
              <th>บาร์โค้ด</th>
              <th>สต็อกคงเหลือ</th>
              <th class="text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="py-12 text-center">
                <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
              </td>
            </tr>
            <tr v-else-if="equipment.length === 0">
              <td colspan="4" class="py-14 text-center text-base-content/40">
                <Boxes class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ยังไม่มีอุปกรณ์ในคลัง
              </td>
            </tr>
            <tr v-else-if="filteredEquipment.length === 0">
              <td colspan="4" class="py-14 text-center text-base-content/40">
                <PackageSearch class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ไม่พบอุปกรณ์ที่ตรงกับเงื่อนไข
                <button type="button" class="link block mx-auto mt-1 text-brand-600" @click="clearFilters">
                  ล้างตัวกรอง
                </button>
              </td>
            </tr>
            <tr v-for="item in filteredEquipment" :key="item.id" class="hover:bg-base-200/60">
              <td>
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    :class="categoryVisual(item.category).badge"
                  >
                    <component :is="categoryVisual(item.category).icon" class="h-4 w-4" :stroke-width="2" />
                  </span>
                  <div class="min-w-0">
                    <p class="max-w-md truncate font-medium text-base-content" :title="item.name">{{ item.name }}</p>
                    <span
                      v-if="item.category"
                      class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="categoryVisual(item.category).chip"
                    >
                      {{ item.category }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap font-mono text-xs text-base-content/50">{{ item.barcode }}</td>
              <td class="whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <span
                    class="h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="item.isLowStock ? 'bg-warning' : 'bg-success'"
                  ></span>
                  <span class="font-medium" :class="item.isLowStock ? 'text-warning' : 'text-base-content'">
                    {{ item.stockQty }} {{ item.unit }}
                  </span>
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button class="btn btn-square btn-ghost btn-sm" aria-label="บาร์โค้ด" @click="openBarcodeModal(item)">
                    <Barcode class="h-4 w-4" :stroke-width="2" />
                  </button>
                  <template v-if="isAdmin">
                    <button class="btn btn-square btn-ghost btn-sm" aria-label="แก้ไข" @click="openEditModal(item)">
                      <Pencil class="h-4 w-4" :stroke-width="2" />
                    </button>
                    <button
                      class="btn btn-square btn-ghost btn-sm text-error hover:bg-error/10"
                      aria-label="ลบ"
                      @click="deleteItem(item)"
                    >
                      <Trash2 class="h-4 w-4" :stroke-width="2" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="!loading && filteredEquipment.length > 0"
        class="border-t border-base-300 px-4 py-2.5 text-xs text-base-content/40"
      >
        แสดง {{ filteredEquipment.length }} จาก {{ equipment.length }} รายการ
      </div>
    </div>

    <dialog ref="modalRef" class="modal">
      <div class="modal-box max-w-lg">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="font-display text-lg font-bold text-base-content">
            {{ editingId ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์' }}
          </h3>
          <button type="button" class="btn btn-square btn-ghost btn-sm" @click="closeModal">
            <X class="h-4 w-4" :stroke-width="2" />
          </button>
        </div>

        <form @submit.prevent="submitForm" class="space-y-3">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">บาร์โค้ด</legend>
              <div class="flex gap-2">
                <input v-model="form.barcode" type="text" required class="input input-bordered w-full" />
                <button
                  type="button"
                  class="btn btn-square btn-outline shrink-0"
                  title="สร้างรหัสอัตโนมัติ"
                  :disabled="generatingBarcode"
                  @click="generateBarcode"
                >
                  <Loader2 v-if="generatingBarcode" class="h-4 w-4 animate-spin" :stroke-width="2" />
                  <Sparkles v-else class="h-4 w-4" :stroke-width="2" />
                </button>
              </div>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">หมวดหมู่</legend>
              <input v-model="form.category" type="text" class="input input-bordered w-full" list="category-suggestions" />
              <datalist id="category-suggestions">
                <option v-for="c in categories" :key="c" :value="c" />
              </datalist>
            </fieldset>
          </div>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่ออุปกรณ์</legend>
            <input v-model="form.name" type="text" required class="input input-bordered w-full" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">รุ่นเครื่องที่ใช้ได้</legend>
            <textarea v-model="form.compatibleModels" rows="2" class="textarea textarea-bordered w-full"></textarea>
          </fieldset>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">หน่วยนับ</legend>
              <input v-model="form.unit" type="text" required class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">สต็อก</legend>
              <input v-model.number="form.stockQty" type="number" min="0" required class="input input-bordered w-full" />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">แจ้งเตือนเมื่อเหลือ</legend>
              <input v-model.number="form.lowStockThreshold" type="number" min="0" required class="input input-bordered w-full" />
            </fieldset>
          </div>

          <div
            v-if="formError"
            role="alert"
            class="flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
          >
            <AlertCircle class="h-4 w-4 shrink-0" :stroke-width="2" />
            <span>{{ formError }}</span>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="closeModal">ยกเลิก</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" :stroke-width="2" />
              บันทึก
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <dialog ref="barcodeModalRef" class="modal">
      <div class="modal-box max-w-sm text-center">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-display text-lg font-bold text-base-content">บาร์โค้ดอุปกรณ์</h3>
          <button type="button" class="btn btn-square btn-ghost btn-sm" @click="closeBarcodeModal">
            <X class="h-4 w-4" :stroke-width="2" />
          </button>
        </div>

        <p class="mb-3 truncate text-sm text-base-content/60">{{ barcodeModalItem?.name }}</p>

        <div ref="barcodeSvgContainer" class="flex justify-center rounded-xl border border-base-300 bg-white p-4"></div>

        <button type="button" class="btn btn-primary mt-4 w-full" @click="handlePrintBarcode">
          <Printer class="h-4 w-4" :stroke-width="2" />
          พิมพ์บาร์โค้ด
        </button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <dialog ref="importModalRef" class="modal">
      <div class="modal-box max-w-md">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-display text-lg font-bold text-base-content">นำเข้าอุปกรณ์จาก CSV</h3>
          <button type="button" class="btn btn-square btn-ghost btn-sm" @click="closeImportModal">
            <X class="h-4 w-4" :stroke-width="2" />
          </button>
        </div>

        <template v-if="!importResult">
          <p class="text-sm text-base-content/60">
            ไฟล์ CSV ต้องมีหัวคอลัมน์: <code class="text-xs">barcode, name, category, compatibleModels, unit, stockQty, lowStockThreshold</code>
            — ถ้า barcode มีอยู่แล้วจะอัปเดตข้อมูล (ไม่แตะสต็อกถ้าไม่ระบุ), ถ้ายังไม่มีจะสร้างรายการใหม่
          </p>

          <label class="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-base-300 p-6 text-center hover:border-brand-400">
            <FileUp class="h-6 w-6 text-base-content/40" :stroke-width="1.5" />
            <span class="text-sm text-base-content/60">
              {{ importFile ? importFile.name : 'เลือกไฟล์ .csv' }}
            </span>
            <input type="file" accept=".csv,text/csv" class="hidden" @change="handleImportFileChange" />
          </label>

          <div
            v-if="importError"
            role="alert"
            class="mt-3 flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
          >
            <AlertCircle class="h-4 w-4 shrink-0" :stroke-width="2" />
            <span>{{ importError }}</span>
          </div>

          <div class="modal-action items-center justify-between">
            <RouterLink to="/equipment/imports" class="link flex items-center gap-1.5 text-sm text-brand-600">
              <History class="h-3.5 w-3.5" :stroke-width="2" />
              ดูประวัติการนำเข้า
            </RouterLink>
            <div class="flex gap-2">
              <button type="button" class="btn btn-ghost" @click="closeImportModal">ปิด</button>
              <button type="button" class="btn btn-primary" :disabled="!importFile || importing" @click="submitImport">
                <Loader2 v-if="importing" class="h-4 w-4 animate-spin" :stroke-width="2" />
                นำเข้า
              </button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="py-2 text-center">
            <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 class="h-7 w-7" :stroke-width="2" />
            </span>
            <h4 class="mt-3 font-display text-lg font-bold text-base-content">นำเข้าสำเร็จ</h4>
            <p class="mt-1 text-sm text-base-content/50">
              สร้างใหม่ {{ importResult.created }} รายการ · อัปเดต {{ importResult.updated }} รายการ
            </p>
          </div>

          <div
            v-if="importResult.errors.length > 0"
            class="mt-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2.5 text-left text-sm text-warning"
          >
            <p class="font-medium">ข้ามไป {{ importResult.errors.length }} แถว:</p>
            <ul class="mt-1 max-h-32 list-inside list-disc space-y-0.5 overflow-y-auto">
              <li v-for="(err, i) in importResult.errors" :key="i">{{ err }}</li>
            </ul>
          </div>

          <div class="modal-action items-center justify-between">
            <RouterLink to="/equipment/imports" class="link flex items-center gap-1.5 text-sm text-brand-600">
              <History class="h-3.5 w-3.5" :stroke-width="2" />
              ดูประวัติการนำเข้า
            </RouterLink>
            <div class="flex gap-2">
              <button type="button" class="btn btn-ghost" @click="closeImportModal">ปิด</button>
              <button type="button" class="btn btn-primary" @click="resetImportForm">
                <RotateCcw class="h-4 w-4" :stroke-width="2" />
                นำเข้าไฟล์อื่น
              </button>
            </div>
          </div>
        </template>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
