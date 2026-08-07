import path from 'node:path'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import { WithdrawalRecord, Technician } from '../models/index.js'
import { HttpError } from '../utils/httpError.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FONT_REGULAR = path.join(__dirname, '..', 'assets', 'fonts', 'Sarabun-Regular.ttf')
const FONT_BOLD = path.join(__dirname, '..', 'assets', 'fonts', 'Sarabun-Bold.ttf')

const MARGIN = 50
const COLS = {
  no: { x: MARGIN, width: 30 },
  barcode: { x: MARGIN + 30, width: 90 },
  name: { x: MARGIN + 120, width: 275 },
  qty: { x: MARGIN + 395, width: 50 },
  unit: { x: MARGIN + 445, width: 50 },
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('th-TH', {
    dateStyle: 'long',
    timeStyle: 'short',
  })
}

function drawTableHeader(doc, y) {
  doc.font(FONT_BOLD).fontSize(10)
  doc.text('ลำดับ', COLS.no.x, y, { width: COLS.no.width })
  doc.text('บาร์โค้ด', COLS.barcode.x, y, { width: COLS.barcode.width })
  doc.text('รายการ', COLS.name.x, y, { width: COLS.name.width })
  doc.text('จำนวน', COLS.qty.x, y, { width: COLS.qty.width - 10, align: 'right' })
  doc.text('หน่วย', COLS.unit.x, y, { width: COLS.unit.width })
  const headerBottom = y + 16
  doc
    .moveTo(MARGIN, headerBottom)
    .lineTo(MARGIN + 495, headerBottom)
    .strokeColor('#101828')
    .lineWidth(1)
    .stroke()
  return headerBottom + 6
}

export async function getWithdrawalPdf(req, res) {
  const withdrawal = await WithdrawalRecord.findByPk(req.params.id, {
    include: [{ model: Technician }, { association: 'items' }],
  })

  if (!withdrawal) {
    throw new HttpError(404, 'ไม่พบใบเบิก')
  }

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${withdrawal.receiptNo}.pdf"`)
  doc.pipe(res)

  doc.registerFont('sarabun', FONT_REGULAR)
  doc.registerFont('sarabun-bold', FONT_BOLD)

  doc.font('sarabun-bold').fontSize(20).fillColor('#101828').text('ใบเบิกอุปกรณ์ช่าง')
  doc.font('sarabun').fontSize(10).fillColor('#64748B').text('WithdrawItems — Technician Equipment Withdrawal Receipt')

  if (withdrawal.voided) {
    doc
      .font('sarabun-bold')
      .fontSize(11)
      .fillColor('#DC2626')
      .text(
        `ใบเบิกนี้ถูกยกเลิกแล้ว เมื่อ ${formatDateTime(withdrawal.voidedAt)}${withdrawal.voidReason ? ` — เหตุผล: ${withdrawal.voidReason}` : ''}`,
      )
  }

  doc.moveDown(1)

  const metaTop = doc.y
  doc.font('sarabun-bold').fontSize(11).fillColor('#101828')
  doc.text(`เลขที่ใบเบิก: ${withdrawal.receiptNo}`, MARGIN, metaTop)
  doc.font('sarabun').fontSize(11)
  doc.text(`วันที่เบิก: ${formatDateTime(withdrawal.createdAt)}`, MARGIN, doc.y + 2)
  doc.text(`ช่างผู้เบิก: ${withdrawal.Technician?.name ?? '-'}`, MARGIN, doc.y + 2)
  doc.moveDown(1.2)

  let y = drawTableHeader(doc, doc.y)

  doc.font('sarabun').fontSize(10).fillColor('#101828')

  withdrawal.items.forEach((item, index) => {
    const nameHeight = doc.heightOfString(item.name, { width: COLS.name.width })
    const rowHeight = Math.max(nameHeight, 14) + 8

    if (y + rowHeight > doc.page.height - MARGIN) {
      doc.addPage()
      y = drawTableHeader(doc, MARGIN)
    }

    doc.text(String(index + 1), COLS.no.x, y, { width: COLS.no.width })
    doc.text(item.barcode, COLS.barcode.x, y, { width: COLS.barcode.width })
    doc.text(item.name, COLS.name.x, y, { width: COLS.name.width })
    doc.text(String(item.qty), COLS.qty.x, y, { width: COLS.qty.width - 10, align: 'right' })
    doc.text(item.unit, COLS.unit.x, y, { width: COLS.unit.width })

    y += rowHeight
    doc
      .moveTo(MARGIN, y - 4)
      .lineTo(MARGIN + 495, y - 4)
      .strokeColor('#E4E9F2')
      .lineWidth(0.5)
      .stroke()
  })

  y += 10
  if (y > doc.page.height - MARGIN - 40) {
    doc.addPage()
    y = MARGIN
  }

  doc.font('sarabun-bold').fontSize(11).text(`จำนวนรวมทั้งหมด: ${withdrawal.totalItems} ชิ้น`, MARGIN, y, {
    width: 495,
    align: 'right',
  })

  doc.moveDown(2)
  doc
    .font('sarabun')
    .fontSize(8)
    .fillColor('#94A3B8')
    .text(`พิมพ์เมื่อ ${formatDateTime(new Date())}`, MARGIN, doc.y, {
      width: 495,
      align: 'center',
    })

  doc.end()
}
