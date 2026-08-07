<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/lib/api'
import {
  ArrowLeft,
  Loader2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  X,
} from '@lucide/vue'

const imports = ref([])
const loading = ref(true)
const total = ref(0)
const pageSize = 20
const page = ref(1)

const errorsModalRef = ref(null)
const errorsModalItem = ref(null)

function initialsOf(name) {
  return (name ?? '?').slice(0, 1).toUpperCase()
}

async function loadImports() {
  loading.value = true
  try {
    const { data } = await api.get('/equipment/imports', { params: { page: page.value, pageSize } })
    imports.value = data.imports
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function goToPage(next) {
  const maxPage = Math.max(Math.ceil(total.value / pageSize), 1)
  if (next < 1 || next > maxPage) return
  page.value = next
  loadImports()
}

function openErrorsModal(item) {
  errorsModalItem.value = item
  errorsModalRef.value?.showModal()
}

function closeErrorsModal() {
  errorsModalRef.value?.close()
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(loadImports)
</script>

<template>
  <div class="space-y-6">
    <div>
      <RouterLink to="/equipment" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content">
        <ArrowLeft class="h-4 w-4" :stroke-width="2" />
        กลับไปหน้าคลังอุปกรณ์
      </RouterLink>
      <h2 class="mt-2 font-display text-xl font-bold text-base-content">ประวัติการนำเข้า CSV</h2>
      <p class="mt-1 text-sm text-base-content/50">รายการไฟล์ที่เคยนำเข้าอุปกรณ์ทั้งหมด</p>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-base-content/40">
              <th>ไฟล์</th>
              <th>ผู้นำเข้า</th>
              <th>ผลลัพธ์</th>
              <th>วันที่</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="py-12 text-center">
                <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
              </td>
            </tr>
            <tr v-else-if="imports.length === 0">
              <td colspan="5" class="py-14 text-center text-base-content/40">
                <FileSpreadsheet class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ยังไม่เคยนำเข้าไฟล์ CSV
              </td>
            </tr>
            <tr v-for="item in imports" :key="item.id" class="hover:bg-base-200/60">
              <td>
                <div class="flex items-center gap-2 text-base-content">
                  <FileSpreadsheet class="h-4 w-4 shrink-0 text-base-content/40" :stroke-width="2" />
                  <span class="max-w-xs truncate">{{ item.fileName }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-2.5">
                  <span
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700"
                  >
                    {{ initialsOf(item.User?.name) }}
                  </span>
                  <span class="text-base-content">{{ item.User?.name ?? '-' }}</span>
                </div>
              </td>
              <td>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    <CheckCircle2 class="h-3 w-3" :stroke-width="2.5" />
                    สร้างใหม่ {{ item.createdCount }}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    อัปเดต {{ item.updatedCount }}
                  </span>
                  <button
                    v-if="item.errorCount > 0"
                    type="button"
                    class="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning hover:bg-warning/20"
                    @click="openErrorsModal(item)"
                  >
                    <AlertTriangle class="h-3 w-3" :stroke-width="2.5" />
                    ข้าม {{ item.errorCount }}
                  </button>
                </div>
              </td>
              <td class="whitespace-nowrap text-base-content/60">{{ formatDateTime(item.createdAt) }}</td>
              <td class="text-right">
                <button
                  v-if="item.errorCount > 0"
                  type="button"
                  class="btn btn-ghost btn-sm"
                  @click="openErrorsModal(item)"
                >
                  ดูข้อผิดพลาด
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && imports.length > 0" class="flex flex-wrap items-center justify-between gap-2 border-t border-base-300 px-4 py-3">
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

    <dialog ref="errorsModalRef" class="modal">
      <div class="modal-box max-w-md">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="font-display text-lg font-bold text-base-content">แถวที่ข้ามในไฟล์นี้</h3>
          <button type="button" class="btn btn-square btn-ghost btn-sm" @click="closeErrorsModal">
            <X class="h-4 w-4" :stroke-width="2" />
          </button>
        </div>
        <p class="mb-3 truncate text-sm text-base-content/50">{{ errorsModalItem?.fileName }}</p>
        <ul class="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-warning/20 bg-warning/10 p-3 text-sm text-warning">
          <li v-for="(err, i) in errorsModalItem?.errors" :key="i">{{ err }}</li>
        </ul>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
