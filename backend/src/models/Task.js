const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pendiente'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  calendarUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  googleTaskId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastNotifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Task;