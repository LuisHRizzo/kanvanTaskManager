const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PRDSession = sequelize.define('PRDSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  stage: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  answers: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  contextHistory: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  finalDocument: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = PRDSession;
