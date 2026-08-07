import { reactive } from 'vue'

export const toastState = reactive({ items: [] })

let nextId = 1

function push(message, tone, duration) {
  const id = nextId++
  toastState.items.push({ id, message, tone })
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration)
  }
  return id
}

export function dismissToast(id) {
  const index = toastState.items.findIndex((item) => item.id === id)
  if (index !== -1) toastState.items.splice(index, 1)
}

export const toast = {
  success: (message, duration = 3000) => push(message, 'success', duration),
  error: (message, duration = 4000) => push(message, 'error', duration),
  info: (message, duration = 3000) => push(message, 'info', duration),
}
