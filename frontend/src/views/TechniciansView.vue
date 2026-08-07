<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { confirmAction } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  HardHat,
  UserCheck,
  UserX,
  PackageSearch,
  Search,
} from '@lucide/vue'

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const technicians = ref([])
const loading = ref(true)
const errorMessage = ref('')

const searchQuery = ref('')
const statusFilter = ref('')

const modalRef = ref(null)
const editingId = ref(null)
const form = reactive({ name: '', active: true })
const formError = ref('')
const saving = ref(false)

const summary = computed(() => ({
  total: technicians.value.length,
  active: technicians.value.filter((t) => t.active).length,
  inactive: technicians.value.filter((t) => !t.active).length,
}))

const filteredTechnicians = computed(() => {
  return technicians.value.filter((tech) => {
    if (statusFilter.value === 'active' && !tech.active) return false
    if (statusFilter.value === 'inactive' && tech.active) return false
    if (searchQuery.value && !tech.name.toLowerCase().includes(searchQuery.value.trim().toLowerCase())) return false
    return true
  })
})

const hasActiveFilters = computed(() => Boolean(searchQuery.value || statusFilter.value))

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
}

function toggleStatusFilter(status) {
  statusFilter.value = statusFilter.value === status ? '' : status
}

async function loadTechnicians() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await api.get('/technicians', { params: { includeInactive: true } })
    technicians.value = data.technicians
  } catch {
    errorMessage.value = 'โหลดรายชื่อช่างไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingId.value = null
  form.name = ''
  form.active = true
  formError.value = ''
  modalRef.value?.showModal()
}

function openEditModal(tech) {
  editingId.value = tech.id
  form.name = tech.name
  form.active = tech.active
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
      await api.put(`/technicians/${editingId.value}`, form)
      toast.success('บันทึกข้อมูลช่างเรียบร้อยแล้ว')
    } else {
      await api.post('/technicians', { name: form.name })
      toast.success('เพิ่มช่างเรียบร้อยแล้ว')
    }
    closeModal()
    await loadTechnicians()
  } catch (err) {
    formError.value = err.response?.data?.message ?? 'บันทึกข้อมูลไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function deleteTechnician(tech) {
  const ok = await confirmAction({
    title: 'ลบช่างนี้ใช่หรือไม่',
    message: `"${tech.name}" จะถูกลบออกจากรายชื่อช่างอย่างถาวร`,
    confirmText: 'ลบช่าง',
  })
  if (!ok) return
  try {
    await api.delete(`/technicians/${tech.id}`)
    await loadTechnicians()
    toast.success(`ลบช่าง "${tech.name}" เรียบร้อยแล้ว`)
  } catch (err) {
    errorMessage.value = err.response?.data?.message ?? 'ลบช่างไม่สำเร็จ'
  }
}

onMounted(loadTechnicians)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-display text-xl font-bold text-base-content">รายชื่อช่าง</h2>
        <p class="mt-1 text-sm text-base-content/50">รายชื่อช่างที่เลือกได้ตอนเบิกอุปกรณ์</p>
      </div>
      <button v-if="isAdmin" class="btn btn-primary" @click="openCreateModal">
        <Plus class="h-4 w-4" :stroke-width="2.5" />
        เพิ่มช่าง
      </button>
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
          <HardHat class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ช่างทั้งหมด</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.total }}</p>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors"
        :class="statusFilter === 'active' ? 'border-success bg-success/10' : 'border-base-300 bg-base-100 hover:border-success/40'"
        @click="toggleStatusFilter('active')"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
          <UserCheck class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ใช้งานอยู่</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.active }}</p>
        </div>
      </button>
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors"
        :class="statusFilter === 'inactive' ? 'border-base-content/30 bg-base-200' : 'border-base-300 bg-base-100 hover:border-base-content/20'"
        @click="toggleStatusFilter('inactive')"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-base-200 text-base-content/50">
          <UserX class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ปิดใช้งาน</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.inactive }}</p>
        </div>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
      <label class="input input-bordered input-sm flex min-w-[200px] flex-1 items-center gap-2">
        <Search class="h-3.5 w-3.5 text-base-content/40" :stroke-width="2" />
        <input v-model="searchQuery" type="text" class="grow" placeholder="ค้นหาชื่อช่าง" />
      </label>
      <button v-if="hasActiveFilters" type="button" class="btn btn-ghost btn-sm text-base-content/50" @click="clearFilters">
        ล้างตัวกรอง
      </button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-base-content/40">
              <th>ชื่อช่าง</th>
              <th>สถานะ</th>
              <th v-if="isAdmin" class="text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="isAdmin ? 3 : 2" class="py-12 text-center">
                <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
              </td>
            </tr>
            <tr v-else-if="technicians.length === 0">
              <td :colspan="isAdmin ? 3 : 2" class="py-14 text-center text-base-content/40">
                <HardHat class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ยังไม่มีรายชื่อช่าง
              </td>
            </tr>
            <tr v-else-if="filteredTechnicians.length === 0">
              <td :colspan="isAdmin ? 3 : 2" class="py-14 text-center text-base-content/40">
                <PackageSearch class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ไม่พบช่างที่ตรงกับเงื่อนไข
                <button type="button" class="link mx-auto mt-1 block text-brand-600" @click="clearFilters">
                  ล้างตัวกรอง
                </button>
              </td>
            </tr>
            <tr v-for="tech in filteredTechnicians" :key="tech.id" class="hover:bg-base-200/60">
              <td>
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
                  >
                    {{ tech.name.slice(0, 1).toUpperCase() }}
                  </span>
                  <span class="font-medium text-base-content">{{ tech.name }}</span>
                </div>
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="tech.active ? 'bg-success/10 text-success' : 'bg-base-200 text-base-content/50'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="tech.active ? 'bg-success' : 'bg-base-content/30'"></span>
                  {{ tech.active ? 'ใช้งานอยู่' : 'ปิดใช้งาน' }}
                </span>
              </td>
              <td v-if="isAdmin" class="text-right">
                <div class="flex justify-end gap-1">
                  <button class="btn btn-square btn-ghost btn-sm" aria-label="แก้ไข" @click="openEditModal(tech)">
                    <Pencil class="h-4 w-4" :stroke-width="2" />
                  </button>
                  <button
                    class="btn btn-square btn-ghost btn-sm text-error hover:bg-error/10"
                    aria-label="ลบ"
                    @click="deleteTechnician(tech)"
                  >
                    <Trash2 class="h-4 w-4" :stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="!loading && filteredTechnicians.length > 0"
        class="border-t border-base-300 px-4 py-2.5 text-xs text-base-content/40"
      >
        แสดง {{ filteredTechnicians.length }} จาก {{ technicians.length }} รายการ
      </div>
    </div>

    <dialog ref="modalRef" class="modal">
      <div class="modal-box">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="font-display text-lg font-bold text-base-content">
            {{ editingId ? 'แก้ไขช่าง' : 'เพิ่มช่าง' }}
          </h3>
          <button type="button" class="btn btn-square btn-ghost btn-sm" @click="closeModal">
            <X class="h-4 w-4" :stroke-width="2" />
          </button>
        </div>

        <form @submit.prevent="submitForm" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่อช่าง</legend>
            <input v-model="form.name" type="text" required class="input input-bordered w-full" />
          </fieldset>

          <label v-if="editingId" class="flex items-center gap-2">
            <input v-model="form.active" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="text-sm text-base-content/70">ใช้งานอยู่ (ปิดเพื่อซ่อนจากหน้าเบิกโดยไม่ลบประวัติ)</span>
          </label>

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
  </div>
</template>
