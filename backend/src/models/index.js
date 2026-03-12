const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const ProjectMember = require('./ProjectMember');
const TimeEntry = require('./TimeEntry');
const Document = require('./Document');

User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

ProjectMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'projectMembers' });

ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ProjectMember, { foreignKey: 'userId', as: 'projectMemberships' });

Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', as: 'members' });
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId', as: 'projects' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });

Task.hasMany(TimeEntry, { foreignKey: 'taskId', as: 'timeEntries' });
TimeEntry.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

User.hasMany(TimeEntry, { foreignKey: 'userId', as: 'timeEntries' });
TimeEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Task.hasMany(Document, { foreignKey: 'taskId', as: 'documents' });
Document.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

module.exports = {
  sequelize,
  User,
  Project,
  Task,
  ProjectMember,
  TimeEntry,
  Document
};