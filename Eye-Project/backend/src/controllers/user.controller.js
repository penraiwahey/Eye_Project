import bcrypt from 'bcrypt'
import { User } from '../models/User.js'
import { HttpError } from '../utils/httpError.js'

const SALT_ROUNDS = 12

export async function listUsers(req, res) {
  const users = await User.findAll({ order: [['id', 'ASC']] })
  res.json({ users: users.map((u) => u.toSafeJSON()) })
}

export async function createUser(req, res) {
  const { name, email, password, role } = req.body

  const existing = await User.findOne({ where: { email } })
  if (existing) {
    throw new HttpError(409, 'อีเมลนี้ถูกใช้งานแล้ว')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await User.create({ name, email, passwordHash, role })

  res.status(201).json({ user: user.toSafeJSON() })
}

export async function updateUser(req, res) {
  const user = await User.findByPk(req.params.id)
  if (!user) {
    throw new HttpError(404, 'ไม่พบผู้ใช้งาน')
  }

  const { name, email, password, role } = req.body

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } })
    if (existing) {
      throw new HttpError(409, 'อีเมลนี้ถูกใช้งานแล้ว')
    }
    user.email = email
  }

  if (name) user.name = name
  if (role) user.role = role
  if (password) user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  await user.save()
  res.json({ user: user.toSafeJSON() })
}

export async function deleteUser(req, res) {
  const user = await User.findByPk(req.params.id)
  if (!user) {
    throw new HttpError(404, 'ไม่พบผู้ใช้งาน')
  }

  if (user.id === req.user.id) {
    throw new HttpError(400, 'ไม่สามารถลบบัญชีของตนเองได้')
  }

  await user.destroy()
  res.status(204).end()
}
