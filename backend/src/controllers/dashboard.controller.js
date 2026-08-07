import { Op, col, where as sequelizeWhere } from 'sequelize'
import { User, Equipment, Technician, WithdrawalRecord } from '../models/index.js'

export async function getStats(req, res) {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [userCount, technicianCount, lowStockCount, withdrawalsToday] = await Promise.all([
    User.count(),
    Technician.count({ where: { active: true } }),
    Equipment.count({ where: sequelizeWhere(col('stock_qty'), Op.lte, col('low_stock_threshold')) }),
    WithdrawalRecord.count({ where: { voided: false, createdAt: { [Op.gte]: startOfToday } } }),
  ])

  res.json({ userCount, technicianCount, lowStockCount, withdrawalsToday })
}
