import { defineStore } from 'pinia'
import api from '@/lib/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    checked: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async fetchCurrentUser() {
      try {
        const { data } = await api.get('/auth/me')
        this.user = data.user
      } catch {
        this.user = null
      } finally {
        this.checked = true
      }
    },
    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password })
      this.user = data.user
      this.checked = true
    },
    async logout() {
      try {
        await api.post('/auth/logout')
      } finally {
        this.user = null
      }
    },
  },
})
