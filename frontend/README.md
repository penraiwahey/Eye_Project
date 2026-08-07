# Frontend

Vue 3 + Vite + Tailwind CSS + DaisyUI frontend for WithdrawItems.

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api to http://localhost:4000
npm run build
```

## Structure

- `src/views` — page components (Login, Dashboard, Users)
- `src/layouts/AdminLayout.vue` — sidebar + navbar shell for authenticated pages
- `src/router` — routes and the auth guard
- `src/stores/auth.js` — Pinia store for the current user session
- `src/lib/api.js` — axios instance (sends the auth cookie, redirects to /login on 401)

See the repo root `README.md` for full setup instructions.
