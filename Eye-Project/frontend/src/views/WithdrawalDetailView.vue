<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { confirmAction } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import { ArrowLeft, FileDown, Loader2, UserRound, Ban, AlertTriangle } from '@lucide/vue'

const route = useRoute()
const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.role === 'admin')

const withdrawal = ref(null)
const loading = ref(true)
const errorMessage = ref('')
const voiding = ref(false)
const voidError = ref('')

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })
}

async function loadWithdrawal() {
  loading.value = true
  try {
    const { data } = await api.get(`/withdrawals/${route.params.id}`)
    withdrawal.value = data.withdrawal
  } catch {
    errorMessage.value = 'ไม่พบใบเบิกนี้'
  } finally {
    loading.value = false
  }
}

async function handleVoid() {
  const ok = await confirmAction({
    title: 'ยกเลิกใบเบิกนี้ใช่หรือไม่',
    message: `สต็อกอุปกรณ์ทั้งหมด ${withdrawal.value.totalItems} ชิ้นในใบเบิกนี้จะถูกคืนกลับเข้าคลังทันที`,
    confirmText: 'ยกเลิกใบเบิก',
  })
  if (!ok) return

  voidError.value = ''
  voiding.value = true
  try {
    const { data } = await api.post(`/withdrawals/${withdrawal.value.id}/void`)
    withdrawal.value = data.withdrawal
    toast.success('ยกเลิกใบเบิกเรียบร้อยแล้ว')
  } catch (err) {
    voidError.value = err.response?.data?.message ?? 'ยกเลิกใบเบิกไม่สำเร็จ'
  } finally {
    voiding.value = false
  }
}

onMounted(loadWithdrawal)
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-4">
    <RouterLink to="/withdrawals" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content">
      <ArrowLeft class="h-4 w-4" :stroke-width="2" />
      กลับไปหน้าประวัติการเบิก
    </RouterLink>

    <div v-if="loading" class="py-16 text-center">
      <Loader2 class="mx-auto h-6 w-6 animate-spin text-base-content/30" :stroke-width="2" />
    </div>

    <div v-else-if="errorMessage" class="rounded-2xl border border-base-300 bg-base-100 p-8 text-center text-base-content/50">
      {{ errorMessage }}
    </div>

    <div v-else class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
      <div
        v-if="withdrawal.voided"
        class="mb-4 flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
      >
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" :stroke-width="2" />
        <span>ใบเบิกนี้ถูกยกเลิกแล้ว เมื่อ {{ formatDateTime(withdrawal.voidedAt) }} (สต็อกถูกคืนเข้าคลังแล้ว)</span>
      </div>

      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-display text-xl font-bold text-base-content">{{ withdrawal.receiptNo }}</h2>
            <span
              v-if="withdrawal.voided"
              class="inline-flex items-center rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error"
            >
              ยกเลิกแล้ว
            </span>
          </div>
          <p class="mt-1 flex items-center gap-1.5 text-sm text-base-content/50">
            <UserRound class="h-4 w-4" :stroke-width="2" />
            {{ withdrawal.Technician?.name }}
          </p>
        </div>
        <div class="flex shrink-0 gap-2">
          <a
            :href="`/api/withdrawals/${withdrawal.id}/pdf`"
            target="_blank"
            rel="noopener"
            class="btn btn-outline btn-sm"
          >
            <FileDown class="h-4 w-4" :stroke-width="2" />
            PDF
          </a>
          <button
            v-if="isAdmin && !withdrawal.voided"
            type="button"
            class="btn btn-outline btn-error btn-sm"
            :disabled="voiding"
            @click="handleVoid"
          >
            <Loader2 v-if="voiding" class="h-4 w-4 animate-spin" :stroke-width="2" />
            <Ban v-else class="h-4 w-4" :stroke-width="2" />
            ยกเลิกใบเบิก
          </button>
        </div>
      </div>

      <div
        v-if="voidError"
        class="mt-3 flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
      >
        <AlertTriangle class="h-4 w-4 shrink-0" :stroke-width="2" />
        <span>{{ voidError }}</span>
      </div>

      <p class="mt-2 text-sm text-base-content/40">{{ formatDateTime(withdrawal.createdAt) }}</p>

      <div class="mt-5 overflow-hidden rounded-xl border border-base-300">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr class="text-xs uppercase tracking-wide text-base-content/40">
                <th>บาร์โค้ด</th>
                <th>รายการ</th>
                <th class="text-right">จำนวน</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in withdrawal.items" :key="item.id">
                <td class="text-base-content/50">{{ item.barcode }}</td>
                <td>{{ item.name }}</td>
                <td class="text-right font-medium whitespace-nowrap">{{ item.qty }} {{ item.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between text-sm font-semibold text-base-content">
        <span>รวมทั้งหมด</span>
        <span>{{ withdrawal.totalItems }} ชิ้น</span>
      </div>
    </div>
  </div>
</template>
