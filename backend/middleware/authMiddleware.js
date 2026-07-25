const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' })
  }
  next()
}

// Decodes the token if present, but never blocks the request when it's
// missing or invalid — used by Scout (chat) so guests still get a reply
// with a smaller, public tool set instead of a 401.
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      req.user = null
    }
  } else {
    req.user = null
  }
  next()
}

module.exports = { protect, adminOnly, optionalAuth }