# Backend

Node.js + Express API for WithdrawItems, backed by MySQL via Sequelize.

```bash
cp .env.example .env    # then fill in real secrets
npm install
npm run db:init          # creates tables and seeds the admin user from .env
npm run dev               # http://localhost:4000
```

## Structure

- `src/app.js` — Express app: security middleware, routes, error handling
- `src/server.js` — connects to MySQL and starts listening
- `src/config` — env loading and the Sequelize connection
- `src/models` — Sequelize models
- `src/controllers`, `src/routes` — one pair per resource (auth, users, dashboard)
- `src/middleware` — auth (JWT cookie), role checks, rate limiting, validation, error handler
- `src/scripts/initDb.js` — syncs tables and seeds the admin account

## Security

- Passwords hashed with bcrypt (cost 12); login does a dummy-hash compare on unknown emails to avoid timing leaks
- Session is a JWT in an `httpOnly`, `sameSite=strict` cookie (not readable by JS, so not stealable via XSS) — set `secure` automatically in production
- `helmet` for security headers, `cors` locked to `CORS_ORIGIN` with credentials
- Rate limiting: 300 req/15min general, 10 req/15min on `/api/auth/login`
- Input validation with `express-validator` on every write route
- Role-based access control (`admin` vs `staff`) on user management routes; nobody can delete their own account
- All queries go through Sequelize (parameterized), no raw SQL string building

See the repo root `README.md` for full setup instructions.
