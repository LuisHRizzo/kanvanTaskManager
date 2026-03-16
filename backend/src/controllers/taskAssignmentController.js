const { TaskAssignment, Task, User, ProjectMember } = require('../models');
const notificationService = require('../services/notificationService');
const { emitToProject } = require('../socket');

const checkProjectAccess = async (userId, taskId) => {
  const task = await Task.findByPk(taskId);
  if (!task) return null;
  
  const membership = await ProjectMember.findOne({ where: { userId, projectId: task.projectId } });
  return membership;
};

exports.addAssignee = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, role = 'assignee' } = req.body;
    const currentUserId = req.user.id;

    const membership = await checkProjectAccess(currentUserId, taskId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const projectMembership = await ProjectMember.findOne({ where: { userId, projectId: task.projectId } });
    if (!projectMembership) {
      return res.status(400).json({ error: 'El usuario no es miembro del proyecto' });
    }

    const existing = await TaskAssignment.findOne({ where: { taskId, userId } });

    if (existing) {
      existing.role = role;
      await existing.save();
      return res.json(existing);
    }

    const assignment = await TaskAssignment.create({ taskId, userId, role });

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
