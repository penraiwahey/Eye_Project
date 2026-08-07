<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import api from '@/lib/api'
import { ArrowLeft, Loader2, UserRound } from '@lucide/vue'

const route = useRoute()
const stockReceipt = ref(null)
const loading = ref(true)
const errorMessage = ref('')

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/stock-receipts/${route.params.id}`)
    stockReceipt.value = data.stockReceipt
  } catch {
    errorMessage.value = 'ไม่พบใบรับเข้านี้'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-4">
    <RouterLink to="/stock-receipts" class="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content">
      <ArrowLeft class="h-4 w-4" :stroke-width="2" />
      กลับไปหน้าประวัติการรับเข้า
    </RouterLink>

    <div v-if="loading" class="py-16 text-center">
      <Loader2 class="mx-auto h-6 w-6 animate-spin text-base-content/30" :stroke-width="2" />
    </div>

    <div v-else-if="errorMessage" class="rounded-2xl border border-base-300 bg-base-100 p-8 text-center text-base-content/50">
      {{ errorMessage }}
    </div>

    <div v-else class="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
      <h2 class="font-display text-xl font-bold text-base-content">{{ stockReceipt.receiptNo }}</h2>
      <p class="mt-1 flex items-center gap-1.5 text-sm text-base-content/50">
        <UserRound class="h-4 w-4" :stroke-width="2" />
        บันทึกโดย {{ stockReceipt.User?.name ?? '-' }}
      </p>
      <p class="mt-2 text-sm text-base-content/40">{{ formatDateTime(stockReceipt.createdAt) }}</p>
      <p v-if="stockReceipt.note" class="mt-2 rounded-lg bg-base-200 px-3 py-2 text-sm text-base-content/70">
        หมายเหตุ: {{ stockReceipt.note }}
      </p>

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
              <tr v-for="item in stockReceipt.items" :key="item.id">
                <td class="text-base-content/50">{{ item.barcode }}</td>
                <td>{{ item.name }}</td>
                <td class="text-right font-medium whitespace-nowrap text-success">+{{ item.qty }} {{ item.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between text-sm font-semibold text-base-content">
        <span>รวมทั้งหมด</span>
        <span>{{ stockReceipt.totalItems }} ชิ้น</span>
      </div>
    </div>
  </div>
</template>
