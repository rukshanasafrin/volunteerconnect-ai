const Event = require('../models/Event')
const Certificate = require('../models/Certificate')
const { generateCertificateId, renderCertificatePDF } = require('../services/certificateService')

// GET /api/certificates/event/:eventId/download
// Issues the certificate on first request, reuses the same certificateId on
// every later request for the same volunteer+event (idempotent — the file
// they download today matches the one they download next year).
const downloadCertificate = async (req, res) => {
  try {
    const { eventId } = req.params
    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    if (event.status !== 'completed') {
      return res.status(400).json({ message: 'Certificates are only available once the event is marked completed.' })
    }

    const registration = event.registeredVolunteers.find(r => r.volunteer.toString() === req.user.id)
    if (!registration) {
      return res.status(403).json({ message: 'You are not registered for this event.' })
    }
    if (registration.status !== 'approved') {
      return res.status(403).json({ message: 'Only approved volunteers can receive a certificate for this event.' })
    }

    let certificate = await Certificate.findOne({ volunteer: req.user.id, event: eventId })
    if (!certificate) {
      certificate = await Certificate.create({
        certificateId: generateCertificateId(),
        volunteer: req.user.id,
        volunteerName: registration.name,
        event: event._id,
        eventTitle: event.title,
        orgName: event.orgName,
        eventDate: event.date,
        hoursCertified: registration.hoursContributed || 0,
      })
    }

    const pdfBuffer = await renderCertificatePDF({
      certificateId: certificate.certificateId,
      volunteerName: certificate.volunteerName,
      eventTitle: certificate.eventTitle,
      orgName: certificate.orgName,
      eventDate: certificate.eventDate,
      hoursCertified: certificate.hoursCertified,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificateId}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Certificate download error:', error.message)
    res.status(500).json({ message: 'Could not generate certificate right now. Please try again.' })
  }
}

// GET /api/certificates/my
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ volunteer: req.user.id }).sort({ issuedAt: -1 })
    res.json(certificates)
  } catch (error) {
    res.status(500).json({ message: 'Could not load your certificates.' })
  }
}

// GET /api/certificates/verify/:certificateId  (public — no auth)
const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certificateId })
    if (!certificate) {
      return res.status(404).json({ valid: false, message: 'No certificate found with this ID.' })
    }
    res.json({
      valid: true,
      certificateId: certificate.certificateId,
      volunteerName: certificate.volunteerName,
      eventTitle: certificate.eventTitle,
      orgName: certificate.orgName,
      eventDate: certificate.eventDate,
      hoursCertified: certificate.hoursCertified,
      issuedAt: certificate.issuedAt,
    })
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Could not verify this certificate right now.' })
  }
}

module.exports = { downloadCertificate, getMyCertificates, verifyCertificate }