<script setup>
import { Compass } from '@lucide/vue'
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 bg-base-200 px-4 text-center">
    <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
      <Compass class="h-7 w-7" :stroke-width="2" />
    </span>
    <div>
      <h1 class="font-display text-3xl font-bold text-base-content">404</h1>
      <p class="mt-1 text-base-content/50">ไม่พบหน้าที่คุณต้องการ</p>
    </div>
    <router-link to="/" class="btn btn-primary">กลับหน้าแรก</router-link>
  </div>
</template>
