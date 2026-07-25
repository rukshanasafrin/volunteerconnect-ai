const express = require('express')
const router = express.Router()
const { chat } = require('../controllers/chatController')
const { optionalAuth } = require('../middleware/authMiddleware')

// Scout: role-aware AI chat assistant. Guests get public tools (event search),
// logged-in users get tools scoped to their own data.
router.post('/', optionalAuth, chat)

module.exports = router
