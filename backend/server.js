const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/events', require('./routes/eventRoutes'))
app.use('/api/ai', require('./routes/aiRoutes'))

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'VolunteerConnect API is running ✅' })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' })
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message })
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Email already registered' })
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  })
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message)
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))