import { Op } from 'sequelize'
import { sequelize } from '../config/db.js'
import { Equipment, Technician, WithdrawalRecord, WithdrawalItem } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'

function buildReceiptNo(id, createdAt) {
  const date = new Date(createdAt)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `WD${y}${m}${d}-${String(id).padStart(5, '0')}`
}

export async function createWithdrawal(req, res) {
  const { technicianId, items } = req.body

  const record = await sequelize.transaction(async (t) => {
    const technician = await Technician.findByPk(technicianId, { transaction: t })
    if (!technician || !technician.active) {
      throw new HttpError(404, 'ไม่พบช่างที่เลือก')
    }

    const withdrawalRecord = await WithdrawalRecord.create(
      { technicianId, receiptNo: `PENDING-${Date.now()}`, totalItems: 0 },
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
      if (equipment.stockQty < qty) {
        throw new HttpError(409, `สต็อก "${equipment.name}" เหลือไม่พอ (คงเหลือ ${equipment.stockQty} ${equipment.unit})`)
      }

      equipment.stockQty -= qty
      await equipment.save({ transaction: t })

      itemRows.push({
        withdrawalRecordId: withdrawalRecord.id,
        equipmentId: equipment.id,
        barcode: equipment.barcode,
        name: equipment.name,
        unit: equipment.unit,
        qty,
      })
      totalItems += qty
    }

    await WithdrawalItem.bulkCreate(itemRows, { transaction: t })

    withdrawalRecord.receiptNo = buildReceiptNo(withdrawalRecord.id, withdrawalRecord.createdAt)
    withdrawalRecord.totalItems = totalItems
    await withdrawalRecord.save({ transaction: t })

    return withdrawalRecord
  })

  const full = await WithdrawalRecord.findByPk(record.id, {
    include: [{ model: Technician }, { association: 'items' }],
  })

  res.status(201).json({ withdrawal: full })
}

export async function listWithdrawals(req, res) {
  const { technicianId, dateFrom, dateTo, receiptNo, page = 1, pageSize = 20 } = req.query

  const where = {}
  if (technicianId) where.technicianId = technicianId
  if (receiptNo) where.receiptNo = { [Op.like]: `%${receiptNo}%` }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt[Op.gte] = new Date(`${dateFrom}T00:00:00`)
    if (dateTo) where.createdAt[Op.lte] = new Date(`${dateTo}T23:59:59`)
  }

  const limit = Math.min(Number(pageSize) || 20, 100)
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit

  const { rows, count } = await WithdrawalRecord.findAndCountAll({
    where,
    include: [{ model: Technician }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  })

  res.json({ withdrawals: rows, total: count, page: Number(page), pageSize: limit })
}

export async function getWithdrawalSummary(req, res) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [totalWithdrawals, totalItemsWithdrawn, withdrawalsThisMonth] = await Promise.all([
    WithdrawalRecord.count({ where: { voided: false } }),
    WithdrawalRecord.sum('totalItems', { where: { voided: false } }),
    WithdrawalRecord.count({ where: { voided: false, createdAt: { [Op.gte]: startOfMonth } } }),
  ])

  res.json({ totalWithdrawals, totalItemsWithdrawn: totalItemsWithdrawn ?? 0, withdrawalsThisMonth })
}

export async function getTopWithdrawnItems(req, res) {
  const { period = 'all', limit = 10 } = req.query

  const recordWhere = { voided: false }
  if (period === 'month') {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    recordWhere.createdAt = { [Op.gte]: startOfMonth }
  }

  const rows = await WithdrawalItem.findAll({
    attributes: [
      'barcode',
      'name',
      'unit',
      [sequelize.col('Equipment.category'), 'category'],
      [sequelize.fn('SUM', sequelize.col('WithdrawalItem.qty')), 'totalQty'],
    ],
    include: [
      { model: WithdrawalRecord, attributes: [], where: recordWhere, required: true },
      { model: Equipment, attributes: [], required: false },
    ],
    group: ['barcode', 'name', 'unit', 'Equipment.category'],
    order: [[sequelize.literal('totalQty'), 'DESC']],
    limit: Math.min(Number(limit) || 10, 50),
    raw: true,
  })

  res.json({ items: rows.map((row) => ({ ...row, totalQty: Number(row.totalQty) })) })
}

export async function getWithdrawal(req, res) {
  const withdrawal = await WithdrawalRecord.findByPk(req.params.id, {
    include: [{ model: Technician }, { association: 'items' }],
  })

  if (!withdrawal) {
    throw new HttpError(404, 'ไม่พบใบเบิก')
  }

  res.json({ withdrawal })
}

export async function voidWithdrawal(req, res) {
  const { reason } = req.body

  const record = await sequelize.transaction(async (t) => {
    const withdrawal = await WithdrawalRecord.findByPk(req.params.id, {
      include: [{ association: 'items' }],
      transaction: t,
    })

    if (!withdrawal) {
      throw new HttpError(404, 'ไม่พบใบเบิก')
    }
    if (withdrawal.voided) {
      throw new HttpError(409, 'ใบเบิกนี้ถูกยกเลิกไปแล้ว')
    }

    for (const item of withdrawal.items) {
      if (!item.equipmentId) continue
      const equipment = await Equipment.findByPk(item.equipmentId, { transaction: t, lock: t.LOCK.UPDATE })
      if (equipment) {
        equipment.stockQty += item.qty
        await equipment.save({ transaction: t })
      }
    }

    withdrawal.voided = true
    withdrawal.voidedAt = new Date()
    withdrawal.voidReason = reason ?? null
    await withdrawal.save({ transaction: t })

    return withdrawal
  })

  const full = await WithdrawalRecord.findByPk(record.id, {
    include: [{ model: Technician }, { association: 'items' }],
  })

  res.json({ withdrawal: full })
}
