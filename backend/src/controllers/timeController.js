const { TimeEntry, Task, Project, ProjectMember } = require('../models');
const { emitToProject } = require('../socket');

const checkProjectAccess = async (userId, projectId) => {
  const membership = await ProjectMember.findOne({
    where: { userId, projectId }
  });
  return membership;
};

exports.getTimeEntries = async (req, res) => {
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

    const entries = await TimeEntry.findAll({
      where: { taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['startTime', 'DESC']]
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.startTimer = async (req, res) => {
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

    const activeEntry = await TimeEntry.findOne({
      where: {
        userId: req.user.id,
        endTime: null
      }
    });

    if (activeEntry) {
      return res.status(400).json({ 
        error: 'Ya tienes un cronómetro activo. Deténlo primero.',
        activeEntry 
      });
    }

    const entry = await TimeEntry.create({
      taskId,
      userId: req.user.id,
      startTime: new Date()
    });

    const entryWithUser = await TimeEntry.findByPk(entry.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    emitToProject(task.projectId, 'timer_started', {
      taskId,
      userId: req.user.id,
      entry: entryWithUser
    });

    res.status(201).json(entryWithUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.stopTimer = async (req, res) => {
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

    const activeEntry = await TimeEntry.findOne({
      where: {
        taskId,
        userId: req.user.id,
        endTime: null
      }
    });

    if (!activeEntry) {
      return res.status(400).json({ error: 'No hay un cronómetro activo para esta tarea' });
    }

    await activeEntry.update({ endTime: new Date() });

    const entryWithUser = await TimeEntry.findByPk(activeEntry.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    emitToProject(task.projectId, 'timer_stopped', {
      taskId,
      userId: req.user.id,
      entry: entryWithUser
    });

    res.json(entryWithUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addManualEntry = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { startTime, endTime, notes } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'startTime y endTime son requeridos' });
    }

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

    const entry = await TimeEntry.create({
      taskId,
      userId: req.user.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes
    });

    const entryWithUser = await TimeEntry.findByPk(entry.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json(entryWithUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveTimer = async (req, res) => {
  try {
    const entry = await TimeEntry.findOne({
      where: {
        userId: req.user.id,
        endTime: null
      },
      include: [
        { 
          model: Task, 
          as: 'task',
          include: [{ model: Project, as: 'project' }]
        },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json(entry || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTaskTimeSummary = async (req, res) => {
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

    const entries = await TimeEntry.findAll({
      where: { taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
    });

    const totalSeconds = entries.reduce((acc, entry) => {
      if (entry.endTime) {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        return acc + Math.floor((end - start) / 1000);
      }
      return acc;
    }, 0);

    const byUser = entries.reduce((acc, entry) => {
      if (entry.endTime) {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        const seconds = Math.floor((end - start) / 1000);
        const userName = entry.user?.name || 'Usuario';
        acc[userName] = (acc[userName] || 0) + seconds;
      }
      return acc;
    }, {});

    res.json({
      taskId,
      taskTitle: task.title,
      totalSeconds,
      totalFormatted: formatDuration(totalSeconds),
      entriesCount: entries.length,
      byUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserTimeReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.id;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const entries = await TimeEntry.findAll({
      where: {
        userId,
        startTime: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      },
      include: [
        { 
          model: Task, 
          as: 'task',
          include: [
            { 
              model: Project, 
              as: 'project',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['startTime', 'ASC']]
    });

    const byProject = {};
    const byDay = {};
    let totalSeconds = 0;

    entries.forEach(entry => {
      if (entry.endTime) {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        const seconds = Math.floor((end - start) / 1000);
        totalSeconds += seconds;

        const projectName = entry.task?.project?.name || 'Sin proyecto';
        byProject[projectName] = (byProject[projectName] || 0) + seconds;

        const day = new Date(entry.startTime).getDate();
        byDay[day] = (byDay[day] || 0) + seconds;
      }
    });

    const projectSummary = Object.entries(byProject).map(([name, seconds]) => ({
      projectName: name,
      seconds,
      formatted: formatDuration(seconds)
    }));

    const daySummary = Object.entries(byDay).map(([day, seconds]) => ({
      day: parseInt(day),
      seconds,
      formatted: formatDuration(seconds)
    })).sort((a, b) => a.day - b.day);

    res.json({
      userId,
      year: parseInt(year),
      month: parseInt(month),
      totalSeconds,
      totalFormatted: formatDuration(totalSeconds),
      entriesCount: entries.length,
      byProject: projectSummary,
      byDay: daySummary,
      dailyAverage: daySummary.length > 0 ? Math.floor(totalSeconds / daySummary.length) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectTimeReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { year, month } = req.query;

    const membership = await checkProjectAccess(req.user.id, projectId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const entries = await TimeEntry.findAll({
      where: {
        startTime: {
          [require('sequelize').Op.between]: [startDate, endDate]
        }
      },
      include: [
        { 
          model: Task, 
          as: 'task',
          where: { projectId },
          required: true
        },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ]
    });

    const byUser = {};
    const byTask = {};
    let totalSeconds = 0;

    entries.forEach(entry => {
      if (entry.endTime) {
        const start = new Date(entry.startTime).getTime();
        const end = new Date(entry.endTime).getTime();
        const seconds = Math.floor((end - start) / 1000);
        totalSeconds += seconds;

        const userName = entry.user?.name || 'Usuario';
        byUser[userName] = (byUser[userName] || 0) + seconds;

        const taskTitle = entry.task?.title || 'Tarea sin título';
        byTask[taskTitle] = (byTask[taskTitle] || 0) + seconds;
      }
    });

    res.json({
      projectId,
      year: parseInt(year),
      month: parseInt(month),
      totalSeconds,
      totalFormatted: formatDuration(totalSeconds),
      entriesCount: entries.length,
      byUser: Object.entries(byUser).map(([name, seconds]) => ({ userName: name, seconds, formatted: formatDuration(seconds) })),
      byTask: Object.entries(byTask).map(([title, seconds]) => ({ taskTitle: title, seconds, formatted: formatDuration(seconds) }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const User = require('../models/User');