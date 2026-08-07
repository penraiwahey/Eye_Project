import { validationResult } from 'express-validator'

export function validate(req, res, next) {
  const result = validationResult(req)

  if (!result.isEmpty()) {
    return res.status(422).json({
      message: 'ข้อมูลไม่ถูกต้อง',
      errors: result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg })),
    })
  }

  next()
}
