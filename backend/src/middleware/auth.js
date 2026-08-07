import { verifyToken } from '../utils/jwt.js'
import { env } from '../config/env.js'
import { User } from '../models/User.js'

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[env.cookieName]

  if (!token) {
    return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })
  }

  try {
    const payload = verifyToken(token)
    const user = await User.findByPk(payload.sub)

    if (!user) {
      return res.status(401).json({ message: 'ไม่พบผู้ใช้งาน' })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' })
    }
    next()
  }
}
