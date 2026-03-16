const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskAssignment = sequelize.define('TaskAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('assignee', 'follower', 'reviewer'),
    defaultValue: 'assignee'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['taskId'] },
    { fields: ['userId'] },
    { fields: ['taskId', 'userId'], unique: true }
  ]
});

module.exports = TaskAssignment;
