require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { sequelize } = require('./models');

const { initializeSocket } = require('./socket');
const { startNotificationScheduler } = require('./services/notificationScheduler');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const timeRoutes = require('./routes/time');
const googleSyncRoutes = require('./routes/googleSync');
const notificationRoutes = require('./routes/notifications');
const taskAssignmentRoutes = require('./routes/taskAssignments');
const commentRoutes = require('./routes/comments');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/settings', googleSyncRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', taskAssignmentRoutes);
app.use('/api', commentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal' });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Base de datos sincronizada');
    
    startNotificationScheduler();
    console.log('✅ Notification scheduler started');
    
    const server = http.createServer(app);
    initializeSocket(server);
    
    server.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
