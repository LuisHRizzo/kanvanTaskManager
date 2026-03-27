const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  kanbanStatus: {
    type: DataTypes.ENUM('backlog', 'en_proceso', 'esperando', 'completados'),
    defaultValue: 'backlog'
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: 'default',
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Project;