import { Technician } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'

export async function listTechnicians(req, res) {
  const { includeInactive } = req.query
  const where = includeInactive === 'true' ? undefined : { active: true }

  const technicians = await Technician.findAll({ where, order: [['name', 'ASC']] })
  res.json({ technicians })
}

export async function createTechnician(req, res) {
  const technician = await Technician.create({ name: req.body.name })
  res.status(201).json({ technician })
}

export async function updateTechnician(req, res) {
  const technician = await Technician.findByPk(req.params.id)
  if (!technician) {
    throw new HttpError(404, 'ไม่พบช่าง')
  }

  const { name, active } = req.body
  if (name !== undefined) technician.name = name
  if (active !== undefined) technician.active = active

  await technician.save()
  res.json({ technician })
}

export async function deleteTechnician(req, res) {
  const technician = await Technician.findByPk(req.params.id)
  if (!technician) {
    throw new HttpError(404, 'ไม่พบช่าง')
  }

  try {
    await technician.destroy()
  } catch {
    throw new HttpError(409, 'ไม่สามารถลบช่างนี้ได้ เนื่องจากมีประวัติการเบิกอ้างอิงอยู่ ให้ปิดใช้งานแทน')
  }

  res.status(204).end()
}
