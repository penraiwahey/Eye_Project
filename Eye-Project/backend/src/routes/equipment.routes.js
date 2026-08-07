import { Router } from 'express'
import multer from 'multer'
import { body, param } from 'express-validator'
import {
  listEquipment,
  lookupEquipmentByBarcode,
  generateBarcode,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  importEquipment,
  listEquipmentImports,
} from '../controllers/equipment.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } })

const router = Router()

router.use(requireAuth)

const idParam = [param('id').isInt().toInt()]

router.get('/', listEquipment)
router.get('/lookup/:barcode', lookupEquipmentByBarcode)
router.get('/generate-barcode', requireRole('admin'), generateBarcode)

router.post(
  '/',
  requireRole('admin'),
  [
    body('barcode').isString().trim().isLength({ min: 1, max: 64 }),
    body('name').isString().trim().isLength({ min: 1, max: 255 }),
    body('category').optional({ values: 'null' }).isString().trim().isLength({ max: 100 }),
    body('compatibleModels').optional({ values: 'null' }).isString().trim(),
    body('unit').optional().isString().trim().isLength({ min: 1, max: 30 }),
    body('stockQty').optional().isInt({ min: 0 }).toInt(),
    body('lowStockThreshold').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  createEquipment,
)

router.put(
  '/:id',
  requireRole('admin'),
  [
    ...idParam,
    body('barcode').optional().isString().trim().isLength({ min: 1, max: 64 }),
    body('name').optional().isString().trim().isLength({ min: 1, max: 255 }),
    body('category').optional({ values: 'null' }).isString().trim().isLength({ max: 100 }),
    body('compatibleModels').optional({ values: 'null' }).isString().trim(),
    body('unit').optional().isString().trim().isLength({ min: 1, max: 30 }),
    body('stockQty').optional().isInt({ min: 0 }).toInt(),
    body('lowStockThreshold').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  updateEquipment,
)

router.post('/import', requireRole('admin'), upload.single('file'), importEquipment)
router.get('/imports', requireRole('admin'), listEquipmentImports)

router.delete('/:id', requireRole('admin'), idParam, validate, deleteEquipment)

export default router
