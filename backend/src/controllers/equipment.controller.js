import { Op, col, where as sequelizeWhere } from 'sequelize'
import { parse } from 'csv-parse/sync'
import { Equipment, EquipmentImport, User } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'

export async function listEquipment(req, res) {
  const { q, lowStock, limit } = req.query

  const conditions = []
  if (q) {
    conditions.push({
      [Op.or]: [
        { name: { [Op.like]: `%${q}%` } },
        { barcode: { [Op.like]: `%${q}%` } },
        { compatibleModels: { [Op.like]: `%${q}%` } },
      ],
    })
  }
  if (lowStock === 'true' || lowStock === '1') {
    conditions.push(sequelizeWhere(col('stock_qty'), Op.lte, col('low_stock_threshold')))
  }

  const equipment = await Equipment.findAll({
    where: conditions.length ? { [Op.and]: conditions } : undefined,
    order: lowStock ? [['stockQty', 'ASC']] : [['name', 'ASC']],
    limit: Math.min(Number(limit) || 50, 50),
  })
  res.json({ equipment: equipment.map((e) => e.toJSONSafe()) })
}

export async function lookupEquipmentByBarcode(req, res) {
  const equipment = await Equipment.findOne({ where: { barcode: req.params.barcode } })

  if (!equipment) {
    throw new HttpError(404, 'ไม่พบอุปกรณ์ตามบาร์โค้ดนี้')
  }

  res.json({ equipment: equipment.toJSONSafe() })
}

export async function generateBarcode(req, res) {
  const existingBarcodes = await Equipment.findAll({ attributes: ['barcode'] })
  const usedNumbers = existingBarcodes
    .map((e) => e.barcode.match(/^EQ(\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number)

  const next = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1
  res.json({ barcode: `EQ${String(next).padStart(4, '0')}` })
}

export async function createEquipment(req, res) {
  const { barcode, name, category, compatibleModels, unit, stockQty, lowStockThreshold } = req.body

  const existing = await Equipment.findOne({ where: { barcode } })
  if (existing) {
    throw new HttpError(409, 'บาร์โค้ดนี้ถูกใช้งานแล้ว')
  }

  const equipment = await Equipment.create({
    barcode,
    name,
    category,
    compatibleModels,
    unit,
    stockQty: stockQty ?? 0,
    lowStockThreshold: lowStockThreshold ?? 5,
  })

  res.status(201).json({ equipment: equipment.toJSONSafe() })
}

export async function updateEquipment(req, res) {
  const equipment = await Equipment.findByPk(req.params.id)
  if (!equipment) {
    throw new HttpError(404, 'ไม่พบอุปกรณ์')
  }

  const { barcode, name, category, compatibleModels, unit, stockQty, lowStockThreshold } = req.body

  if (barcode && barcode !== equipment.barcode) {
    const existing = await Equipment.findOne({ where: { barcode } })
    if (existing) {
      throw new HttpError(409, 'บาร์โค้ดนี้ถูกใช้งานแล้ว')
    }
    equipment.barcode = barcode
  }

  if (name !== undefined) equipment.name = name
  if (category !== undefined) equipment.category = category
  if (compatibleModels !== undefined) equipment.compatibleModels = compatibleModels
  if (unit !== undefined) equipment.unit = unit
  if (stockQty !== undefined) equipment.stockQty = stockQty
  if (lowStockThreshold !== undefined) equipment.lowStockThreshold = lowStockThreshold

  await equipment.save()
  res.json({ equipment: equipment.toJSONSafe() })
}

export async function importEquipment(req, res) {
  if (!req.file) {
    throw new HttpError(400, 'กรุณาแนบไฟล์ CSV')
  }

  let records
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    })
  } catch (err) {
    throw new HttpError(400, `อ่านไฟล์ CSV ไม่สำเร็จ: ${err.message}`)
  }

  const result = { created: 0, updated: 0, errors: [] }

  for (const [index, row] of records.entries()) {
    const rowNum = index + 2
    const barcode = row.barcode?.trim()
    const name = row.name?.trim()

    if (!barcode || !name) {
      result.errors.push(`แถวที่ ${rowNum}: ต้องมี barcode และ name`)
      continue
    }

    const existing = await Equipment.findOne({ where: { barcode } })

    if (existing) {
      existing.name = name
      if (row.category !== undefined) existing.category = row.category.trim() || null
      if (row.compatibleModels !== undefined) existing.compatibleModels = row.compatibleModels.trim() || null
      if (row.unit) existing.unit = row.unit.trim()
      if (row.lowStockThreshold) existing.lowStockThreshold = Number(row.lowStockThreshold)
      await existing.save()
      result.updated += 1
    } else {
      await Equipment.create({
        barcode,
        name,
        category: row.category?.trim() || null,
        compatibleModels: row.compatibleModels?.trim() || null,
        unit: row.unit?.trim() || 'ชิ้น',
        stockQty: row.stockQty ? Number(row.stockQty) : 0,
        lowStockThreshold: row.lowStockThreshold ? Number(row.lowStockThreshold) : 5,
      })
      result.created += 1
    }
  }

  const importLog = await EquipmentImport.create({
    fileName: req.file.originalname,
    createdCount: result.created,
    updatedCount: result.updated,
    errorCount: result.errors.length,
    errors: JSON.stringify(result.errors),
    createdByUserId: req.user.id,
  })

  res.json({ ...result, importId: importLog.id })
}

export async function listEquipmentImports(req, res) {
  const { page = 1, pageSize = 20 } = req.query
  const limit = Math.min(Number(pageSize) || 20, 100)
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit

  const { rows, count } = await EquipmentImport.findAndCountAll({
    include: [{ model: User, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  })

  res.json({
    imports: rows.map((r) => {
      const json = r.toJSON()
      return { ...json, errors: JSON.parse(json.errors || '[]') }
    }),
    total: count,
    page: Number(page),
    pageSize: limit,
  })
}

export async function deleteEquipment(req, res) {
  const equipment = await Equipment.findByPk(req.params.id)
  if (!equipment) {
    throw new HttpError(404, 'ไม่พบอุปกรณ์')
  }

  try {
    await equipment.destroy()
  } catch {
    throw new HttpError(409, 'ไม่สามารถลบอุปกรณ์นี้ได้ เนื่องจากมีประวัติการเบิกอ้างอิงอยู่')
  }

  res.status(204).end()
}
