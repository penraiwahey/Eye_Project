import { app } from './app.js'
import { sequelize } from './config/db.js'
import { env } from './config/env.js'
import './models/index.js'

async function start() {
  await sequelize.authenticate()
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err.message)
  process.exit(1)
})
