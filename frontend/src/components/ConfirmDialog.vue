<script setup>
import { ref, watch } from 'vue'
import { TriangleAlert, CircleHelp } from '@lucide/vue'
import { confirmState, settleConfirm } from '@/composables/useConfirm'

const dialogRef = ref(null)

watch(
  () => confirmState.visible,
  (visible) => {
    if (visible) {
      dialogRef.value?.showModal()
    } else {
      dialogRef.value?.close()
    }
  },
)

function handleDialogClose() {
  if (confirmState.resolve) {
    settleConfirm(false)
  }
}
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialogRef" class="modal" @close="handleDialogClose">
      <div class="modal-box max-w-sm text-center">
        <span
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          :class="confirmState.tone === 'danger' ? 'bg-error/10 text-error' : 'bg-brand-50 text-brand-600'"
        >
          <TriangleAlert v-if="confirmState.tone === 'danger'" class="h-6 w-6" :stroke-width="2" />
          <CircleHelp v-else class="h-6 w-6" :stroke-width="2" />
        </span>

        <h3 class="mt-4 font-display text-lg font-bold text-base-content">{{ confirmState.title }}</h3>
        <p class="mt-1.5 text-sm text-base-content/60">{{ confirmState.message }}</p>

        <div class="mt-6 flex gap-2">
          <button type="button" class="btn btn-ghost flex-1" @click="settleConfirm(false)">
            {{ confirmState.cancelText }}
          </button>
          <button
            type="button"
            class="btn flex-1"
            :class="confirmState.tone === 'danger' ? 'btn-error' : 'btn-primary'"
            @click="settleConfirm(true)"
          >
            {{ confirmState.confirmText }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </Teleport>
</template>
