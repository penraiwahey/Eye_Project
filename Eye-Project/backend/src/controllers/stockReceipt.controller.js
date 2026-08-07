import { Op } from 'sequelize'
import { sequelize } from '../config/db.js'
import { Equipment, StockReceipt, StockReceiptItem, User } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'

function buildReceiptNo(id, createdAt) {
  const date = new Date(createdAt)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `RC${y}${m}${d}-${String(id).padStart(5, '0')}`
}

export async function createStockReceipt(req, res) {
  const { note, items } = req.body

  const record = await sequelize.transaction(async (t) => {
    const stockReceipt = await StockReceipt.create(
      {
        receiptNo: `PENDING-${Date.now()}`,
        note: note || null,
        totalItems: 0,
        createdByUserId: req.user.id,
      },
      { transaction: t },
    )

    let totalItems = 0
    const itemRows = []

    for (const { equipmentId, qty } of items) {
      const equipment = await Equipment.findByPk(equipmentId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      })

      if (!equipment) {
        throw new HttpError(404, `ไม่พบอุปกรณ์ (id ${equipmentId})`)
      }

      equipment.stockQty += qty
      await equipment.save({ transaction: t })

      itemRows.push({
        stockReceiptId: stockReceipt.id,
        equipmentId: equipment.id,
        barcode: equipment.barcode,
        name: equipment.name,
        unit: equipment.unit,
        qty,
      })
      totalItems += qty
    }

    await StockReceiptItem.bulkCreate(itemRows, { transaction: t })

    stockReceipt.receiptNo = buildReceiptNo(stockReceipt.id, stockReceipt.createdAt)
    stockReceipt.totalItems = totalItems
    await stockReceipt.save({ transaction: t })

    return stockReceipt
  })

  const full = await StockReceipt.findByPk(record.id, {
    include: [{ model: User, attributes: ['id', 'name'] }, { association: 'items' }],
  })

  res.status(201).json({ stockReceipt: full })
}

export async function listStockReceipts(req, res) {
  const { dateFrom, dateTo, receiptNo, page = 1, pageSize = 20 } = req.query

  const where = {}
  if (receiptNo) where.receiptNo = { [Op.like]: `%${receiptNo}%` }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt[Op.gte] = new Date(`${dateFrom}T00:00:00`)
    if (dateTo) where.createdAt[Op.lte] = new Date(`${dateTo}T23:59:59`)
  }

  const limit = Math.min(Number(pageSize) || 20, 100)
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit

  const { rows, count } = await StockReceipt.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  })

  res.json({ stockReceipts: rows, total: count, page: Number(page), pageSize: limit })
}

export async function getStockReceipt(req, res) {
  const stockReceipt = await StockReceipt.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['id', 'name'] }, { association: 'items' }],
  })

  if (!stockReceipt) {
    throw new HttpError(404, 'ไม่พบใบรับเข้า')
  }

  res.json({ stockReceipt })
}
