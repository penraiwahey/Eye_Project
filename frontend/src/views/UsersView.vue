<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/lib/api'
import { confirmAction } from '@/composables/useConfirm'
import { toast } from '@/composables/useToast'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  UserRound,
  UsersRound,
  ShieldCheck,
  PackageSearch,
  Search,
} from '@lucide/vue'

const users = ref([])
const loading = ref(true)
const errorMessage = ref('')

const searchQuery = ref('')
const roleFilter = ref('')

const modalRef = ref(null)
const editingId = ref(null)
const form = reactive({ name: '', email: '', password: '', role: 'staff' })
const formError = ref('')
const saving = ref(false)

function initialsOf(name) {
  return (name ?? '?').slice(0, 1).toUpperCase()
}

const summary = computed(() => ({
  total: users.value.length,
  admins: users.value.filter((u) => u.role === 'admin').length,
  staff: users.value.filter((u) => u.role === 'staff').length,
}))

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    if (roleFilter.value && user.role !== roleFilter.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.trim().toLowerCase()
      const haystack = `${user.name} ${user.email}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
})

const hasActiveFilters = computed(() => Boolean(searchQuery.value || roleFilter.value))

function clearFilters() {
  searchQuery.value = ''
  roleFilter.value = ''
}

function toggleRoleFilter(role) {
  roleFilter.value = roleFilter.value === role ? '' : role
}

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const { data } = await api.get('/users')
    users.value = data.users
  } catch {
    errorMessage.value = 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingId.value = null
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'staff'
  formError.value = ''
  modalRef.value?.showModal()
}

function openEditModal(user) {
  editingId.value = user.id
  form.name = user.name
  form.email = user.email
  form.password = ''
  form.role = user.role
  formError.value = ''
  modalRef.value?.showModal()
}

function closeModal() {
  modalRef.value?.close()
}

async function submitForm() {
  formError.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      const payload = { name: form.name, email: form.email, role: form.role }
      if (form.password) payload.password = form.password
      await api.put(`/users/${editingId.value}`, payload)
      toast.success('บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว')
    } else {
      await api.post('/users', form)
      toast.success('เพิ่มผู้ใช้เรียบร้อยแล้ว')
    }
    closeModal()
    await loadUsers()
  } catch (err) {
    formError.value = err.response?.data?.message ?? 'บันทึกข้อมูลไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

async function deleteUser(user) {
  const ok = await confirmAction({
    title: 'ลบผู้ใช้นี้ใช่หรือไม่',
    message: `"${user.name}" จะไม่สามารถเข้าสู่ระบบได้อีก การลบนี้ไม่สามารถย้อนกลับได้`,
    confirmText: 'ลบผู้ใช้',
  })
  if (!ok) return
  try {
    await api.delete(`/users/${user.id}`)
    await loadUsers()
    toast.success(`ลบผู้ใช้ "${user.name}" เรียบร้อยแล้ว`)
  } catch {
    errorMessage.value = 'ลบผู้ใช้ไม่สำเร็จ'
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="font-display text-xl font-bold text-base-content">จัดการผู้ใช้</h2>
        <p class="mt-1 text-sm text-base-content/50">เพิ่ม แก้ไข และกำหนดสิทธิ์การเข้าถึงของผู้ใช้งาน</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <Plus class="h-4 w-4" :stroke-width="2.5" />
        เพิ่มผู้ใช้
      </button>
    </div>

    <div
      v-if="errorMessage"
      role="alert"
      class="flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
    >
      <AlertCircle class="h-4 w-4 shrink-0" :stroke-width="2" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <UsersRound class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ผู้ใช้ทั้งหมด</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.total }}</p>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors"
        :class="roleFilter === 'admin' ? 'border-brand-500 bg-brand-50' : 'border-base-300 bg-base-100 hover:border-brand-300'"
        @click="toggleRoleFilter('admin')"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <ShieldCheck class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">ผู้ดูแลระบบ</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.admins }}</p>
        </div>
      </button>
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors"
        :class="roleFilter === 'staff' ? 'border-brand-500 bg-brand-50' : 'border-base-300 bg-base-100 hover:border-brand-300'"
        @click="toggleRoleFilter('staff')"
      >
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-base-200 text-base-content/60">
          <UserRound class="h-5 w-5" :stroke-width="2" />
        </span>
        <div>
          <p class="text-xs font-medium uppercase tracking-wide text-base-content/40">พนักงาน</p>
          <p class="font-display text-xl font-bold text-base-content tabular-nums">{{ summary.staff }}</p>
        </div>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
      <label class="input input-bordered input-sm flex min-w-[200px] flex-1 items-center gap-2">
        <Search class="h-3.5 w-3.5 text-base-content/40" :stroke-width="2" />
        <input v-model="searchQuery" type="text" class="grow" placeholder="ค้นหาชื่อหรืออีเมล" />
      </label>
      <button v-if="hasActiveFilters" type="button" class="btn btn-ghost btn-sm text-base-content/50" @click="clearFilters">
        ล้างตัวกรอง
      </button>
    </div>

    <div class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr class="text-xs uppercase tracking-wide text-base-content/40">
              <th>ผู้ใช้</th>
              <th>สิทธิ์</th>
              <th class="text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="py-12 text-center">
                <Loader2 class="mx-auto h-5 w-5 animate-spin text-base-content/30" :stroke-width="2" />
              </td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="3" class="py-14 text-center text-base-content/40">
                <UsersRound class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ยังไม่มีผู้ใช้ในระบบ
              </td>
            </tr>
            <tr v-else-if="filteredUsers.length === 0">
              <td colspan="3" class="py-14 text-center text-base-content/40">
                <PackageSearch class="mx-auto mb-2 h-8 w-8" :stroke-width="1.5" />
                ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข
                <button type="button" class="link mx-auto mt-1 block text-brand-600" @click="clearFilters">
                  ล้างตัวกรอง
                </button>
              </td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-base-200/60">
              <td>
                <div class="flex items-center gap-3">
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
                  >
                    {{ initialsOf(user.name) }}
                  </span>
                  <div>
                    <p class="font-medium text-base-content">{{ user.name }}</p>
                    <p class="text-sm text-base-content/50">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    user.role === 'admin'
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-base-200 text-base-content/60'
                  "
                >
                  <UserRound class="h-3 w-3" :stroke-width="2.5" />
                  {{ user.role }}
                </span>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button
                    class="btn btn-square btn-ghost btn-sm"
                    aria-label="แก้ไข"
                    @click="openEditModal(user)"
                  >
                    <Pencil class="h-4 w-4" :stroke-width="2" />
                  </button>
                  <button
                    class="btn btn-square btn-ghost btn-sm text-error hover:bg-error/10"
                    aria-label="ลบ"
                    @click="deleteUser(user)"
                  >
                    <Trash2 class="h-4 w-4" :stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="!loading && filteredUsers.length > 0"
        class="border-t border-base-300 px-4 py-2.5 text-xs text-base-content/40"
      >
        แสดง {{ filteredUsers.length }} จาก {{ users.length }} รายการ
      </div>
    </div>

    <dialog ref="modalRef" class="modal">
      <div class="modal-box">
        <div class="mb-5 flex items-center justify-between">
          <h3 class="font-display text-lg font-bold text-base-content">
            {{ editingId ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้' }}
          </h3>
          <button type="button" class="btn btn-square btn-ghost btn-sm" @click="closeModal">
            <X class="h-4 w-4" :stroke-width="2" />
          </button>
        </div>

        <form @submit.prevent="submitForm" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend">ชื่อ</legend>
            <input v-model="form.name" type="text" required class="input input-bordered w-full" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">อีเมล</legend>
            <input v-model="form.email" type="email" required class="input input-bordered w-full" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              รหัสผ่าน <span v-if="editingId" class="text-xs opacity-60">(เว้นว่างหากไม่เปลี่ยน)</span>
            </legend>
            <input
              v-model="form.password"
              type="password"
              :required="!editingId"
              minlength="8"
              class="input input-bordered w-full"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">สิทธิ์</legend>
            <select v-model="form.role" class="select select-bordered w-full">
              <option value="admin">admin</option>
              <option value="staff">staff</option>
            </select>
          </fieldset>

          <div
            v-if="formError"
            role="alert"
            class="flex items-center gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error"
          >
            <AlertCircle class="h-4 w-4 shrink-0" :stroke-width="2" />
            <span>{{ formError }}</span>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost" @click="closeModal">ยกเลิก</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <Loader2 v-if="saving" class="h-4 w-4 animate-spin" :stroke-width="2" />
              บันทึก
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
