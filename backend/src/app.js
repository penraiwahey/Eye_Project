import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import compression from 'compression'
import { env, isProduction } from './config/env.js'
import routes from './routes/index.js'
import { apiLimiter } from './middleware/rateLimiters.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'

export const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
)
app.use(compression())
app.use(morgan(isProduction ? 'combined' : 'dev'))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())
app.use('/api', apiLimiter)

app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)
