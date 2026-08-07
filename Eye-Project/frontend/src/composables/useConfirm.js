import { reactive } from 'vue'

export const confirmState = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: 'ยืนยัน',
  cancelText: 'ยกเลิก',
  tone: 'danger',
  resolve: null,
})

export function confirmAction({ title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', tone = 'danger' }) {
  return new Promise((resolve) => {
    confirmState.title = title
    confirmState.message = message
    confirmState.confirmText = confirmText
    confirmState.cancelText = cancelText
    confirmState.tone = tone
    confirmState.resolve = resolve
    confirmState.visible = true
  })
}

export function settleConfirm(result) {
  confirmState.visible = false
  confirmState.resolve?.(result)
  confirmState.resolve = null
}
