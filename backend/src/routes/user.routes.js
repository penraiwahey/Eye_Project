import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(requireAuth)

const idParam = [param('id').isInt().toInt()]

router.get('/', listUsers)

router.post(
  '/',
  requireRole('admin'),
  [
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 100 }),
    body('role').isIn(['admin', 'staff']),
  ],
  validate,
  createUser,
)

router.put(
  '/:id',
  requireRole('admin'),
  [
    ...idParam,
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isString().isLength({ min: 8, max: 100 }),
    body('role').optional().isIn(['admin', 'staff']),
  ],
  validate,
  updateUser,
)

router.delete('/:id', requireRole('admin'), idParam, validate, deleteUser)

export default router
