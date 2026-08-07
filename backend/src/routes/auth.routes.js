import { Router } from 'express'
import { body } from 'express-validator'
import { login, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { loginLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 1 }),
  ],
  validate,
  login,
)

router.post('/logout', logout)
router.get('/me', requireAuth, me)

export default router
