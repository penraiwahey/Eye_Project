<script setup>
defineProps({
  variant: { type: String, default: 'dark' }, // 'dark' | 'light'
})
</script>

<template>
  <div class="flex items-center gap-2.5">
    <svg viewBox="0 0 48 48" class="h-8 w-8 shrink-0">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#4C86FF" />
          <stop offset="1" stop-color="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#logo-g)" />
      <rect x="12" y="24" width="6" height="14" rx="2.5" fill="#fff" />
      <rect x="21" y="16" width="6" height="22" rx="2.5" fill="#fff" />
      <rect x="30" y="10" width="6" height="28" rx="2.5" fill="#fff" />
    </svg>
    <span
      class="font-display text-lg font-bold tracking-tight"
      :class="variant === 'light' ? 'text-white' : 'text-base-content'"
    >
      WithdrawItems
    </span>
  </div>
</template>
