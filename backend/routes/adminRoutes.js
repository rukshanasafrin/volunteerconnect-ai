const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')
const {
  getPlatformStats,
  getRecentActivity,
  searchOrganizations,
  getOrganizationDetails,
  suspendOrganization,
  restoreOrganization,
  searchVolunteers,
  getVolunteerDetails,
  suspendVolunteer,
  restoreVolunteer,
  searchEvents,
} = require('../controllers/adminController')

router.use(protect, adminOnly) // every route below is admin-only

router.get('/stats', getPlatformStats)
router.get('/activity', getRecentActivity)

router.get('/organizations', searchOrganizations)
router.get('/organizations/:id', getOrganizationDetails)
router.put('/organizations/:id/suspend', suspendOrganization)
router.put('/organizations/:id/restore', restoreOrganization)

router.get('/volunteers', searchVolunteers)
router.get('/volunteers/:id', getVolunteerDetails)
router.put('/volunteers/:id/suspend', suspendVolunteer)
router.put('/volunteers/:id/restore', restoreVolunteer)

router.get('/events', searchEvents)

module.exports = router