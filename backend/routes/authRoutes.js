const express = require('express')
const router = express.Router()
const {
  registerVolunteer,
  registerOrganization,
  login,
  getVolunteerProfile,
  updateVolunteerProfile,
  getOrgProfile,
  updateOrgProfile,
  getPendingOrgs,
  verifyOrganization,
  rejectOrganization,
  getAllVolunteers,
  deleteVolunteer,
} = require('../controllers/authController')
const { protect, adminOnly } = require('../middleware/authMiddleware')
const {
  validateVolunteerRegister,
  validateOrgRegister,
  validateLogin,
} = require('../middleware/validate')

// Public routes
router.post('/register/volunteer', validateVolunteerRegister, registerVolunteer)
router.post('/register/org', validateOrgRegister, registerOrganization)
router.post('/login', validateLogin, login)

// Volunteer protected
router.get('/volunteer/profile', protect, getVolunteerProfile)
router.put('/volunteer/profile', protect, updateVolunteerProfile)

// Org protected
router.get('/org/profile', protect, getOrgProfile)
router.put('/org/profile', protect, updateOrgProfile)

// Admin protected
router.get('/admin/orgs/pending', protect, adminOnly, getPendingOrgs)
router.put('/admin/orgs/verify/:id', protect, adminOnly, verifyOrganization)
router.delete('/admin/orgs/reject/:id', protect, adminOnly, rejectOrganization)
router.get('/admin/volunteers', protect, adminOnly, getAllVolunteers)
router.delete('/admin/volunteers/:id', protect, adminOnly, deleteVolunteer)

module.exports = router