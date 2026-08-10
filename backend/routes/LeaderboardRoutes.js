const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { getLeaderboard, getMyRank } = require('../controllers/leaderboardController')

router.get('/', getLeaderboard)              // public — anyone can view the leaderboard
router.get('/my-rank', protect, getMyRank)   // logged-in volunteer's own rank + percentile

module.exports = router 