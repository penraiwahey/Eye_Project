import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import dashboardRoutes from './dashboard.routes.js'
import equipmentRoutes from './equipment.routes.js'
import technicianRoutes from './technician.routes.js'
import withdrawalRoutes from './withdrawal.routes.js'
import stockReceiptRoutes from './stockReceipt.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/equipment', equipmentRoutes)
router.use('/technicians', technicianRoutes)
router.use('/withdrawals', withdrawalRoutes)
router.use('/stock-receipts', stockReceiptRoutes)

export default router
