const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationPreference = sequelize.define('NotificationPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  pushEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dueTaskReminder: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  taskAssignment: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  mentions: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dueTaskAdvance: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] }
  ]
});

module.exports = NotificationPreference;
