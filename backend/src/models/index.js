const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const ProjectMember = require('./ProjectMember');
const TimeEntry = require('./TimeEntry');
const Document = require('./Document');
const DeviceToken = require('./DeviceToken');
const Notification = require('./Notification');
const NotificationPreference = require('./NotificationPreference');
const TaskAssignment = require('./TaskAssignment');
const Comment = require('./Comment');
const PRDSession = require('./PRDSession');

User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

ProjectMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'projectMembers' });

ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ProjectMember, { foreignKey: 'userId', as: 'projectMemberships' });

Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'projectId', as: 'members' });
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'userId', as: 'projects' });

Project.hasMany(PRDSession, { foreignKey: 'projectId', as: 'prdSessions' });
PRDSession.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

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

User.hasMany(DeviceToken, { foreignKey: 'userId', as: 'deviceTokens' });
DeviceToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(NotificationPreference, { foreignKey: 'userId', as: 'notificationPreference' });
NotificationPreference.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Task.belongsToMany(User, { through: TaskAssignment, foreignKey: 'taskId', as: 'assignees' });
User.belongsToMany(Task, { through: TaskAssignment, foreignKey: 'userId', as: 'tasksAssignedVia' });

TaskAssignment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });
Task.hasMany(TaskAssignment, { foreignKey: 'taskId', as: 'taskAssignments' });

TaskAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(TaskAssignment, { foreignKey: 'userId', as: 'userAssignments' });

Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

module.exports = {
  sequelize,
  User,
  Project,
  Task,
  ProjectMember,
  TimeEntry,
  Document,
  DeviceToken,
  Notification,
  NotificationPreference,
  TaskAssignment,
  Comment,
  PRDSession
};
