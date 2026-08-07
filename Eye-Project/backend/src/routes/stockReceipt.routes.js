import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  createStockReceipt,
  listStockReceipts,
  getStockReceipt,
} from '../controllers/stockReceipt.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('admin'))

router.get(
  '/',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  listStockReceipts,
)

router.post(
  '/',
  [
    body('note').optional({ values: 'null' }).isString().trim().isLength({ max: 255 }),
    body('items').isArray({ min: 1 }),
    body('items.*.equipmentId').isInt().toInt(),
    body('items.*.qty').isInt({ min: 1 }).toInt(),
  ],
  validate,
  createStockReceipt,
)

router.get('/:id', [param('id').isInt().toInt()], validate, getStockReceipt)

export default router
