<script setup>
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ToastNotifications from '@/components/ToastNotifications.vue'
</script>

<template>
  <router-view />
  <ConfirmDialog />
  <ToastNotifications />
</template>
