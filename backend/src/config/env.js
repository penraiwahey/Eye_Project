import 'dotenv/config'

function required(name, fallback) {
  const value = process.env[name] ?? fallback
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),

  dbHost: required('DB_HOST', '127.0.0.1'),
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbName: required('DB_NAME'),
  dbUser: required('DB_USER'),
  dbPassword: required('DB_PASSWORD'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  cookieName: process.env.COOKIE_NAME ?? 'token',

  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173'),

  seedAdminName: process.env.SEED_ADMIN_NAME ?? 'Administrator',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL,
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD,
}

export const isProduction = env.nodeEnv === 'production'
