import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  createWithdrawal,
  listWithdrawals,
  getWithdrawal,
  getWithdrawalSummary,
  getTopWithdrawnItems,
  voidWithdrawal,
} from '../controllers/withdrawal.controller.js'
import { getWithdrawalPdf } from '../controllers/withdrawalPdf.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(requireAuth)

router.get(
  '/',
  [
    query('technicianId').optional().isInt().toInt(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  listWithdrawals,
)

router.post(
  '/',
  [
    body('technicianId').isInt().toInt(),
    body('items').isArray({ min: 1 }),
    body('items.*.equipmentId').isInt().toInt(),
    body('items.*.qty').isInt({ min: 1 }).toInt(),
  ],
  validate,
  createWithdrawal,
)

router.get('/summary', getWithdrawalSummary)
router.get(
  '/top-items',
  [query('period').optional().isIn(['month', 'all']), query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  validate,
  getTopWithdrawnItems,
)
router.get('/:id', [param('id').isInt().toInt()], validate, getWithdrawal)
router.get('/:id/pdf', [param('id').isInt().toInt()], validate, getWithdrawalPdf)
router.post(
  '/:id/void',
  requireRole('admin'),
  [param('id').isInt().toInt(), body('reason').optional().isString().trim().isLength({ max: 255 })],
  validate,
  voidWithdrawal,
)

export default router
