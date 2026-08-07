<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { X, CameraOff } from '@lucide/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'decode'])

const READER_ID = 'barcode-scanner-reader'
let scanner = null
const cameraError = ref('')

async function startScanner() {
  cameraError.value = ''
  try {
    scanner = new Html5Qrcode(READER_ID)
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 160 } },
      (decodedText) => {
        emit('decode', decodedText)
      },
      () => {},
    )
  } catch {
    cameraError.value = 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการเข้าถึงกล้องของเบราว์เซอร์'
  }
}

async function stopScanner() {
  if (scanner) {
    try {
      await scanner.stop()
      scanner.clear()
    } catch {
      // ignore stop errors if the camera was never fully started
    }
    scanner = null
  }
}

function close() {
  emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      requestAnimationFrame(startScanner)
    } else {
      stopScanner()
    }
  },
)

onBeforeUnmount(stopScanner)
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div class="w-full max-w-sm rounded-2xl bg-base-100 p-4 shadow-xl">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="font-display font-bold text-base-content">สแกนบาร์โค้ด</h3>
        <button type="button" class="btn btn-square btn-ghost btn-sm" @click="close">
          <X class="h-4 w-4" :stroke-width="2" />
        </button>
      </div>

      <div :id="READER_ID" class="overflow-hidden rounded-xl bg-neutral"></div>

      <div v-if="cameraError" class="mt-3 flex items-center gap-2 text-sm text-error">
        <CameraOff class="h-4 w-4 shrink-0" :stroke-width="2" />
        <span>{{ cameraError }}</span>
      </div>
      <p v-else class="mt-3 text-center text-xs text-base-content/40">เล็งกล้องไปที่บาร์โค้ดอุปกรณ์</p>
    </div>
  </div>
</template>
