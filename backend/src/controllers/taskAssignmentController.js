const { TaskAssignment, Task, User, ProjectMember } = require('../models');
const notificationService = require('../services/notificationService');
const { emitToProject } = require('../socket');

const checkProjectAccess = async (userId, taskId) => {
  // Allow all authenticated users (company-wide collaboration)
  return true;
};

exports.addAssignee = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, role = 'assignee' } = req.body;
    const currentUserId = req.user.id;

    console.log('addAssignee - taskId:', taskId, 'userId:', userId, 'role:', role);

    // Allow all authenticated users
    const hasAccess = await checkProjectAccess(currentUserId, taskId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    console.log('addAssignee - task found:', task.id, 'projectId:', task.projectId);

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.log('addAssignee - targetUser found:', targetUser.id, targetUser.email);

    // Skip project membership check for company-wide collaboration
    // Auto-add user to project if not already member
    let projectMembership = await ProjectMember.findOne({ where: { userId, projectId: task.projectId } });
    if (!projectMembership) {
      console.log('addAssignee - creating project membership');
      projectMembership = await ProjectMember.create({ userId, projectId: task.projectId, role: 'member' });
    }

    const existing = await TaskAssignment.findOne({ where: { taskId, userId } });
    console.log('addAssignee - existing:', existing);

    if (existing) {
      existing.role = role;
      await existing.save();
      return res.json(existing);
    }

    console.log('addAssignee - creating assignment');
    const assignment = await TaskAssignment.create({ taskId, userId, role });
    console.log('addAssignee - assignment created:', assignment.id);

    const assignmentWithUser = await TaskAssignment.findByPk(assignment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    if (role === 'assignee' && userId !== currentUserId) {
      await notificationService.notifyTaskAssigned(userId, task, req.user);
    }

    const taskWithAssignees = await Task.findByPk(taskId, {
      include: [{ model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: [] } }]
    });
    emitToProject(task.projectId, 'task_assignees_updated', taskWithAssignees);

    res.status(201).json(assignmentWithUser);
  } catch (error) {
    console.error('addAssignee error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.removeAssignee = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const currentUserId = req.user.id;

    const membership = await checkProjectAccess(currentUserId, taskId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    await TaskAssignment.destroy({ where: { taskId, userId } });

    const taskWithAssignees = await Task.findByPk(taskId, {
      include: [{ model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: [] } }]
    });
    emitToProject(task.projectId, 'task_assignees_updated', taskWithAssignees);

    res.json({ message: 'Asignación eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUserId = req.user.id;

    const membership = await checkProjectAccess(currentUserId, taskId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const assignments = await TaskAssignment.findAll({
      where: { taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAssigneeRole = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.id;

    const membership = await checkProjectAccess(currentUserId, taskId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const assignment = await TaskAssignment.findOne({ where: { taskId, userId } });
    if (!assignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    assignment.role = role;
    await assignment.save();

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addMultipleAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userIds, role = 'assignee' } = req.body;
    const currentUserId = req.user.id;

    const membership = await checkProjectAccess(currentUserId, taskId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const results = [];
    
    for (const userId of userIds) {
      const existing = await TaskAssignment.findOne({ where: { taskId, userId } });
      if (existing) {
        results.push(existing);
      } else {
        const assignment = await TaskAssignment.create({ taskId, userId, role });
        if (role === 'assignee' && userId !== currentUserId) {
          await notificationService.notifyTaskAssigned(userId, task, req.user);
        }
        results.push(assignment);
      }
    }

    const taskWithAssignees = await Task.findByPk(taskId, {
      include: [{ model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: [] } }]
    });
    emitToProject(task.projectId, 'task_assignees_updated', taskWithAssignees);

    res.json({ message: 'Asignados agregados', count: results.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
