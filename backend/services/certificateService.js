const PDFDocument = require('pdfkit')
const QRCode = require('qrcode')
const crypto = require('crypto')

// Human-friendly, hard-to-guess certificate ID, e.g. VC-2026-9F3A7B2C
const generateCertificateId = () => {
  const year = new Date().getFullYear()
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `VC-${year}-${random}`
}

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Renders the certificate as a PDF buffer. Landscape, brand-colored,
// with a QR code linking to the public verification page so anyone
// (an employer, a professor) can independently confirm it's real.
const renderCertificatePDF = async ({ certificateId, volunteerName, eventTitle, orgName, eventDate, hoursCertified }) => {
  const verifyUrl = `${CLIENT_URL}/verify/${certificateId}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 220 })
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64')

  const PRIMARY = '#2563EB'
  const SECONDARY = '#16A34A'
  const INK = '#1F2937'
  const MUTED = '#6B7280'

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { width, height } = doc.page

    // Outer border
    doc.rect(24, 24, width - 48, height - 48).lineWidth(2).stroke(PRIMARY)
    doc.rect(34, 34, width - 68, height - 68).lineWidth(0.75).stroke(SECONDARY)

    // Header
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(14)
      .text('VOLUNTEERCONNECT', 0, 60, { align: 'center' })
    doc.fillColor(MUTED).font('Helvetica').fontSize(10)
      .text('AI-Powered Volunteer Matching Platform', 0, 80, { align: 'center' })

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(34)
      .text('Certificate of Completion', 0, 130, { align: 'center' })

    doc.fillColor(MUTED).font('Helvetica').fontSize(12)
      .text('This certificate is proudly presented to', 0, 185, { align: 'center' })

    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(28)
      .text(volunteerName, 0, 210, { align: 'center' })

    doc.fillColor(INK).font('Helvetica').fontSize(13)
      .text('for successfully volunteering at', 0, 258, { align: 'center' })

    doc.font('Helvetica-Bold').fontSize(18)
      .text(eventTitle, 80, 282, { align: 'center', width: width - 160 })

    doc.font('Helvetica').fontSize(12).fillColor(MUTED)
      .text(
        `hosted by ${orgName}  •  ${new Date(eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` +
        (hoursCertified ? `  •  ${hoursCertified} hour${hoursCertified === 1 ? '' : 's'} contributed` : ''),
        0, 320, { align: 'center' }
      )

    // Footer: signature line + QR verification block
    const footerY = height - 140

    doc.moveTo(90, footerY + 40).lineTo(280, footerY + 40).lineWidth(1).stroke(MUTED)
    doc.fontSize(10).fillColor(INK).text('Platform Director', 90, footerY + 46, { width: 190, align: 'center' })
    doc.fontSize(8).fillColor(MUTED).text('VolunteerConnect', 90, footerY + 60, { width: 190, align: 'center' })

    doc.image(qrBuffer, width - 175, footerY - 5, { width: 80, height: 80 })
    doc.fontSize(8).fillColor(MUTED)
      .text('Scan to verify authenticity', width - 190, footerY + 78, { width: 110, align: 'center' })

    doc.fontSize(9).fillColor(SECONDARY).font('Helvetica-Bold')
      .text(`Certificate ID: ${certificateId}`, 0, height - 40, { align: 'center' })

    doc.end()
  })
}

module.exports = { generateCertificateId, renderCertificatePDF }