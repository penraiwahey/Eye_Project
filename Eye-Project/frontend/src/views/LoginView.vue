<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import AppLogo from '@/components/AppLogo.vue'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, LayoutGrid, Users } from '@lucide/vue'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const highlights = [
  { icon: LayoutGrid, text: 'ภาพรวมระบบแบบเรียลไทม์' },
  { icon: Users, text: 'จัดการผู้ใช้และสิทธิ์การเข้าถึง' },
  { icon: ShieldCheck, text: 'ปกป้องด้วยการเข้ารหัสและ JWT' },
]

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    toast.success(`เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${auth.user?.name ?? ''}`)
    router.push(route.query.redirect ?? { name: 'dashboard' })
  } catch (err) {
    error.value = err.response?.data?.message ?? 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2 bg-base-100">
    <aside class="hidden lg:flex relative flex-col justify-between overflow-hidden bg-navy-950 p-12 text-white">
      <div
        class="pointer-events-none absolute inset-0 opacity-[0.07]"
        style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 22px 22px"
      ></div>
      <div
        class="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-600 opacity-20 blur-3xl"
      ></div>

      <AppLogo variant="light" class="relative" />

      <div class="relative space-y-8">
        <h1 class="font-display text-4xl font-bold leading-tight">
          จัดการระบบหลังบ้าน<br />ได้อย่างมั่นใจ
        </h1>
        <ul class="space-y-4">
          <li v-for="item in highlights" :key="item.text" class="flex items-center gap-3 text-white/80">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <component :is="item.icon" class="h-4 w-4" :stroke-width="2" />
            </span>
            <span class="text-sm">{{ item.text }}</span>
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-white/40">© {{ new Date().getFullYear() }} WithdrawItems</p>
    </aside>

    <div class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-sm">
        <div class="mb-8 lg:hidden">
          <AppLogo />
        </div>

        <h2 class="font-display text-2xl font-bold text-base-content">เข้าสู่ระบบ</h2>
        <p class="mt-1 text-sm text-base-content/50">กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบจัดการ</p>

        <form @submit.prevent="handleSubmit" class="mt-8 space-y-4">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">อีเมล</legend>
            <label class="input input-bordered flex w-full items-center gap-2 focus-within:input-primary">
              <Mail class="h-4 w-4 text-base-content/40" :stroke-width="2" />
              <input
                v-model="email"
                type="email"
                required
                autocomplete="username"
                class="grow"
                placeholder="admin@example.com"
              />
            </label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">รหัสผ่าน</legend>
            <label class="input input-bordered flex w-full items-center gap-2 focus-within:input-primary">
              <Lock class="h-4 w-4 text-base-content/40" :stroke-width="2" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="grow"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="text-base-content/40 hover:text-base-content/70"
                :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" :stroke-width="2" />
              </button>
            </label>
          </fieldset>

          <div
            v-if="error"
            role="alert"
            class="flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
          >
            <AlertCircle class="h-4 w-4 shrink-0" :stroke-width="2" />
            <span>{{ error }}</span>
          </div>

          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" :stroke-width="2" />
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
