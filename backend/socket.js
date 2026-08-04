const { Server } = require('socket.io')

let io = null

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    socket.on('join', (room) => {
      if (typeof room === 'string') socket.join(room)
    })

    socket.on('disconnect', () => {
      // no-op
    })
  })

  return io
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized yet. Call initSocket(server) first.')
  return io
}

module.exports = { initSocket, getIO }