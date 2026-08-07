<script setup>
import { CheckCircle2, AlertCircle, Info, X } from '@lucide/vue'
import { toastState, dismissToast } from '@/composables/useToast'

const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
const tones = {
  success: 'alert-success',
  error: 'alert-error',
  info: 'alert-info',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast toast-end toast-bottom z-50 print:hidden">
      <TransitionGroup name="toast-fade">
        <div
          v-for="item in toastState.items"
          :key="item.id"
          role="alert"
          class="alert w-auto max-w-sm shadow-lg"
          :class="tones[item.tone]"
        >
          <component :is="icons[item.tone]" class="h-5 w-5 shrink-0" :stroke-width="2" />
          <span class="text-sm">{{ item.message }}</span>
          <button type="button" class="btn btn-ghost btn-xs btn-square" aria-label="ปิด" @click="dismissToast(item.id)">
            <X class="h-3.5 w-3.5" :stroke-width="2" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
