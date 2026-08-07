import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  listTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
} from '../controllers/technician.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(requireAuth)

const idParam = [param('id').isInt().toInt()]

router.get('/', listTechnicians)

router.post(
  '/',
  requireRole('admin'),
  [body('name').isString().trim().isLength({ min: 1, max: 100 })],
  validate,
  createTechnician,
)

router.put(
  '/:id',
  requireRole('admin'),
  [...idParam, body('name').optional().isString().trim().isLength({ min: 1, max: 100 }), body('active').optional().isBoolean().toBoolean()],
  validate,
  updateTechnician,
)

router.delete('/:id', requireRole('admin'), idParam, validate, deleteTechnician)

export default router
