const jwt = require('jsonwebtoken');
const { User, ProjectMember } = require('../models');

let io;

const initializeSocket = (server) => {
  const { Server } = require('socket.io');

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.user.name} (${socket.id})`);

    // Join user-specific room for direct notifications
    socket.join(`user:${socket.user.id}`);
    console.log(`📥 ${socket.user.name} joined user room: user:${socket.user.id}`);

    socket.on('join_project', async (projectId) => {
      try {
        const membership = await ProjectMember.findOne({
          where: { userId: socket.user.id, projectId }
        });

        if (membership) {
          socket.join(`project:${projectId}`);
          console.log(`📥 ${socket.user.name} se unió al proyecto ${projectId}`);
        }
      } catch (error) {
        console.error('Error al unirse al proyecto:', error);
      }
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`📤 ${socket.user.name} salió del proyecto ${projectId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${socket.user.name}`);
    });
  });

  return io;
};

const getIO = () => io;

const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToProject,
  emitToUser
};