import { env, isProduction } from '../config/env.js'

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 8 * 60 * 60 * 1000,
  path: '/',
}

export function setAuthCookie(res, token) {
  res.cookie(env.cookieName, token, cookieOptions)
}

export function clearAuthCookie(res) {
  res.clearCookie(env.cookieName, { ...cookieOptions, maxAge: undefined })
}
