const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { downloadCertificate, getMyCertificates, verifyCertificate } = require('../controllers/certificateController')

router.get('/event/:eventId/download', protect, downloadCertificate)
router.get('/my', protect, getMyCertificates)
router.get('/verify/:certificateId', verifyCertificate) // public, no auth — anyone can verify

module.exports = router