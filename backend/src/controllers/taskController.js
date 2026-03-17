const { Task, Project, ProjectMember, User, TaskAssignment } = require('../models');
const { emitToProject } = require('../socket');
const notificationService = require('../services/notificationService');

const checkProjectAccess = async (userId, projectId) => {
  // Allow all authenticated users to access all projects (company-wide collaboration)
  return true;
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, dueDate, assigneeId } = req.body;
    const { projectId } = req.params;

    if (!title) {
      return res.status(400).json({ error: 'El título de la tarea es requerido' });
    }

    const membership = await checkProjectAccess(req.user.id, projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    const lastTask = await Task.findOne({
      where: { projectId },
      order: [['order', 'DESC']]
    });
    const order = lastTask ? lastTask.order + 1 : 0;

    const task = await Task.create({
      title,
      description,
      status: status || 'pendiente',
      order,
      dueDate,
      assigneeId,
      projectId
    });

    const taskWithAssignee = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ]
    });

    emitToProject(projectId, 'task_created', taskWithAssignee);

    if (assigneeId && assigneeId !== req.user.id) {
      await notificationService.notifyTaskAssigned(assigneeId, taskWithAssignee, req.user);
    }

    res.status(201).json(taskWithAssignee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const membership = await checkProjectAccess(req.user.id, projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ],
      order: [['order', 'ASC']]
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const membership = await checkProjectAccess(req.user.id, task.projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, dueDate, assigneeId, order } = req.body;

    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const membership = await checkProjectAccess(req.user.id, task.projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    await task.update({
      title,
      description,
      status,
      dueDate,
      assigneeId,
      order
    });

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ]
    });

    emitToProject(task.projectId, 'task_updated', updatedTask);

    if (assigneeId && assigneeId !== req.user.id) {
      const previousAssigneeId = task.assigneeId;
      if (previousAssigneeId !== assigneeId) {
        await notificationService.notifyTaskAssigned(assigneeId, updatedTask, req.user);
      }
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const membership = await checkProjectAccess(req.user.id, task.projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    await task.destroy();
    res.json({ message: 'Tarea eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateCalendarUrl = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { startDateTime, endDateTime, attendees = [], timezone = 'America/Argentina/Buenos_Aires' } = req.body;

    if (!startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Se requieren startDateTime y endDateTime' });
    }

    const task = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const membership = await checkProjectAccess(req.user.id, task.projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    // Formatear fechas a YYYYMMDDTHHMMSSZ (UTC)
    const formatGCalDate = (isoString) => {
      const d = new Date(isoString);
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const startFormatted = formatGCalDate(startDateTime);
    const endFormatted = formatGCalDate(endDateTime);

    const projectName = task.project?.name || 'Proyecto';
    const description = [
      task.description || '',
      `Proyecto: ${projectName}`,
    ].filter(Boolean).join('\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: task.title,
      dates: `${startFormatted}/${endFormatted}`,
      details: description,
      location: projectName,
      ctz: timezone,
    });

    // Los invitados se agregan como parámetro repetido 'add'
    const emailList = attendees.filter(e => e && e.includes('@'));
    let calendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
    if (emailList.length > 0) {
      calendarUrl += `&add=${emailList.map(e => encodeURIComponent(e)).join(',')}`;
    }

    await task.update({ calendarUrl });

    res.json({ calendarUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, order } = req.body;

    const task = await Task.findByPk(taskId, {
      include: [{ model: Project, as: 'project' }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const membership = await checkProjectAccess(req.user.id, task.projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    await task.update({ status, order });

    const updatedTask = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'assignees', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ]
    });

    emitToProject(task.projectId, 'task_moved', updatedTask);

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};