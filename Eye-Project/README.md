# WithdrawItems

Vue 3 + Tailwind CSS + DaisyUI frontend, Node.js/Express backend, MySQL database.

```
.
├── frontend/        Vue 3 admin UI (Vite, Tailwind, DaisyUI, Pinia, Vue Router)
├── backend/         Express API (Sequelize, JWT auth, MySQL)
├── db/schema.sql    Reference schema, also used to init the Docker MySQL container
└── docker-compose.yml   MySQL container for local development
```

## First-time setup

1. **Database** — copy the env file and start MySQL:
   ```bash
   cp .env.example .env    # edit passwords if you want
   docker compose up -d
   ```
   MySQL is exposed on host port `3307` (not `3306`) to avoid clashing with any
   MySQL you already have installed (e.g. XAMPP). If you'd rather use an existing
   MySQL server instead of Docker, just point `backend/.env` at it and run
   `db/schema.sql` against it yourself.

2. **Backend**
   ```bash
   cd backend
   cp .env.example .env    # DB_PASSWORD/DB_ROOT_PASSWORD must match the root .env
   npm install
   npm run db:init          # creates tables + seeds the admin user (SEED_ADMIN_* in .env)
   npm run dev               # http://localhost:4000
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev    # http://localhost:5173
   ```

4. Open http://localhost:5173 and log in with the `SEED_ADMIN_EMAIL` /
   `SEED_ADMIN_PASSWORD` from `backend/.env`.

## What's included

- **Login / session** — JWT stored in an httpOnly cookie, auth guard on all admin routes
- **Dashboard** — live stats (withdrawals today, low-stock count, active technicians, users)
- **User management** — full CRUD (list/create/edit/delete) with role assignment (`admin` / `staff`)
- **Technician equipment withdrawal** (`spec-ระบบเบิกอุปกรณ์ช่าง.md`):
  - Pick a technician (no password, name-select only) → scan/search equipment → adjust quantities → confirm
  - Barcode input: auto-focused text field for USB HID scanners, or manual entry — always available
  - Camera barcode scanning (`html5-qrcode`) via the camera button, mainly for mobile
  - Stock is deducted immediately and atomically (row-locked DB transaction — no overselling under concurrent use)
  - Withdrawal history with filters (technician / date range / receipt no.) and a per-receipt detail page
  - PDF receipts (`pdfkit` + embedded Sarabun font for Thai text) downloadable from the receipt screen, history detail, or `GET /api/withdrawals/:id/pdf`
  - Equipment inventory and technician roster pages (admin-only add/edit/delete; staff can view and use them for withdrawals)
  - Search matches barcode, name, or the "compatible models" field, so technicians can search by printer model
  - **Void a withdrawal** (admin-only) — atomically restores stock and marks the receipt voided (kept for audit, excluded from stats/reports)
  - **Auto-generated + printable barcodes** — one-click barcode generation for new equipment, plus a printable Code128 label (`jsbarcode`)
- **Stock receiving** (admin-only) — mirrors the withdrawal flow (scan/search → cart → confirm) but adds stock instead of removing it, with its own receipt numbering (`RC...`), optional note, and history/detail pages
- **CSV import** for equipment (admin-only) — upsert by barcode; updates name/category/etc. without clobbering existing stock counts, reports created/updated/skipped rows
- **Reports** — top withdrawn items (this month / all-time) as a simple ranked bar list, to inform purchasing
- **Security** — see `backend/README.md` for the full list (bcrypt, rate limiting, helmet, CORS, input validation, RBAC)

## Extending it

- Add a new resource: create a Sequelize model in `backend/src/models`, a controller +
  route pair, then register the route in `backend/src/routes/index.js`.
- Add a new admin page: create a view in `frontend/src/views`, add it to
  `frontend/src/router/index.js`, and add a nav entry in
  `frontend/src/layouts/AdminLayout.vue`.
