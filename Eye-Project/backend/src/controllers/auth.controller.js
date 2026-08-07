import bcrypt from 'bcrypt'
import { User } from '../models/User.js'
import { signToken } from '../utils/jwt.js'
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js'
import { HttpError } from '../utils/httpError.js'

// Hash of a random value, compared against when no user is found so that
// login timing does not reveal whether an email address is registered.
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEeOxsFxg5BE9j5kQoS4KLbdgdz1o6a2XbG'

export async function login(req, res) {
  const { email, password } = req.body

  const user = await User.findOne({ where: { email } })
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

  if (!user || !passwordMatches) {
    throw new HttpError(401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }

  const token = signToken({ sub: user.id, role: user.role })
  setAuthCookie(res, token)

  res.json({ user: user.toSafeJSON() })
}

export async function logout(req, res) {
  clearAuthCookie(res)
  res.status(204).end()
}

export async function me(req, res) {
  res.json({ user: req.user.toSafeJSON() })
}
