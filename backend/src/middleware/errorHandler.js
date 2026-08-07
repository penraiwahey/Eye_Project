export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'ไม่พบเส้นทางที่ร้องขอ' })
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const status = err.status ?? 500
  const message = status === 500 ? 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' : err.message

  if (status === 500) {
    console.error(err)
  }

  res.status(status).json({ message })
}
