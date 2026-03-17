const { Task, User, Project } = require('../models');
const googleTasksService = require('../services/googleTasksService');
const googleOAuthService = require('../services/googleOAuthService');

exports.syncTaskToGoogle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user.googleId || !user.googleRefreshToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    let tokens = user.googleTokens ? user.googleTokens : { refresh_token: user.googleRefreshToken };
    tokens = await googleOAuthService.refreshTokenIfNeeded(tokens);
    user.googleTokens = tokens;
    await user.save();

    let taskListId = user.googleTaskListId;
    
    if (!taskListId) {
      const taskList = await googleTasksService.getOrCreateDefaultTaskList(tokens, userId);
      taskListId = taskList.id;
      user.googleTaskListId = taskListId;
      await user.save();
    }

    let googleTask;
    
    if (task.googleTaskId) {
      googleTask = await googleTasksService.updateTask(tokens, taskListId, task.googleTaskId, {
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate
      });
    } else {
      googleTask = await googleTasksService.createTask(tokens, taskListId, {
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate
      });
      
      task.googleTaskId = googleTask.id;
      await task.save();
    }

    res.json({
      message: 'Task synced to Google Tasks',
      googleTaskId: googleTask.id
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.unsyncTaskFromGoogle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user.googleId || !user.googleRefreshToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const task = await Task.findByPk(taskId);
    if (!task || !task.googleTaskId) {
      return res.status(404).json({ error: 'Task not found or not synced' });
    }

    let tokens = user.googleTokens ? user.googleTokens : { refresh_token: user.googleRefreshToken };
    tokens = await googleOAuthService.refreshTokenIfNeeded(tokens);
    
    const taskListId = user.googleTaskListId;
    if (taskListId) {
      await googleTasksService.deleteTask(tokens, taskListId, task.googleTaskId);
    }

    task.googleTaskId = null;
    await task.save();

    res.json({ message: 'Task removed from Google Tasks' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTaskSyncStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    const task = await Task.findByPk(taskId);

    res.json({
      isSynced: !!task?.googleTaskId,
      googleTaskId: task?.googleTaskId,
      googleConnected: !!(user.googleId && user.googleRefreshToken)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.syncAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('syncAllTasks - userId:', userId);

    const user = await User.findByPk(userId);
    console.log('syncAllTasks - user.googleId:', user.googleId, 'googleRefreshToken:', !!user.googleRefreshToken);
    
    if (!user.googleId || !user.googleRefreshToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    let tokens = user.googleTokens ? user.googleTokens : { refresh_token: user.googleRefreshToken };
    console.log('syncAllTasks - tokens before refresh:', !!tokens);
    tokens = await googleOAuthService.refreshTokenIfNeeded(tokens);
    console.log('syncAllTasks - tokens after refresh');
    user.googleTokens = tokens;
    await user.save();

    let taskListId = user.googleTaskListId;
    console.log('syncAllTasks - taskListId:', taskListId);
    
    if (!taskListId) {
      console.log('syncAllTasks - creating task list');
      const taskList = await googleTasksService.getOrCreateDefaultTaskList(tokens, userId);
      taskListId = taskList.id;
      user.googleTaskListId = taskListId;
      await user.save();
    }

    console.log('syncAllTasks - projectId from query:', req.query.projectId);
    
    let tasks;
    if (req.query.projectId) {
      tasks = await Task.findAll({
        where: { projectId: req.query.projectId }
      });
    } else {
      // Get all tasks for projects the user is a member of
      const ProjectMember = require('../models/ProjectMember');
      const memberships = await ProjectMember.findAll({
        where: { userId }
      });
      const projectIds = memberships.map(m => m.projectId);
      tasks = await Task.findAll({
        where: { projectId: projectIds }
      });
    }
    console.log('syncAllTasks - found tasks:', tasks.length);

    const results = [];
    
    for (const task of tasks) {
      try {
        let googleTask;
        
        if (task.googleTaskId) {
          googleTask = await googleTasksService.updateTask(tokens, taskListId, task.googleTaskId, {
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate
          });
        } else {
          googleTask = await googleTasksService.createTask(tokens, taskListId, {
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate
          });
          
          task.googleTaskId = googleTask.id;
          await task.save();
        }
        
        results.push({
          taskId: task.id,
          googleTaskId: googleTask.id,
          status: 'synced'
        });
      } catch (taskError) {
        results.push({
          taskId: task.id,
          status: 'error',
          error: taskError.message
        });
      }
    }

    res.json({ message: 'Bulk sync completed', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGoogleTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    console.log('getGoogleTasks - user.googleTaskListId:', user.googleTaskListId);
    
    if (!user.googleId || !user.googleRefreshToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    let tokens = user.googleTokens ? user.googleTokens : { refresh_token: user.googleRefreshToken };
    console.log('getGoogleTasks - tokens obtained');
    tokens = await googleOAuthService.refreshTokenIfNeeded(tokens);
    user.googleTokens = tokens;
    await user.save();

    let taskListId = user.googleTaskListId;
    console.log('getGoogleTasks - taskListId:', taskListId);
    
    if (!taskListId) {
      console.log('getGoogleTasks - creating new task list');
      const taskList = await googleTasksService.getOrCreateDefaultTaskList(tokens, userId);
      taskListId = taskList.id;
      user.googleTaskListId = taskListId;
      await user.save();
    }

    console.log('getGoogleTasks - fetching tasks from Google');
    const googleTasks = await googleTasksService.getTasks(tokens, taskListId);
    console.log('getGoogleTasks - googleTasks count:', googleTasks.length);

    const existingSyncedTasks = await Task.findAll({
      where: { googleTaskId: { [require('sequelize').Op.ne]: null } },
      attributes: ['googleTaskId']
    });
    const syncedIds = new Set(existingSyncedTasks.map(t => t.googleTaskId));

    const tasksWithSyncStatus = googleTasks.map(gt => ({
      id: gt.id,
      title: gt.title,
      notes: gt.notes,
      due: gt.due,
      status: gt.status,
      alreadySynced: syncedIds.has(gt.id)
    }));

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    res.json({ taskListId, tasks: tasksWithSyncStatus });
  } catch (error) {
    console.error('getGoogleTasks error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.importGoogleTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { googleTaskId } = req.params;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const user = await User.findByPk(userId);
    if (!user.googleId || !user.googleRefreshToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    let tokens = user.googleTokens ? user.googleTokens : { refresh_token: user.googleRefreshToken };
    tokens = await googleOAuthService.refreshTokenIfNeeded(tokens);
    const taskListId = user.googleTaskListId;

    if (!taskListId) {
      return res.status(400).json({ error: 'No task list found' });
    }

    const googleTask = await googleTasksService.getTask(tokens, taskListId, googleTaskId);
    
    if (!googleTask) {
      return res.status(404).json({ error: 'Google Task not found' });
    }

    const existingTask = await Task.findOne({ where: { googleTaskId } });
    if (existingTask) {
      return res.status(400).json({ error: 'This task is already imported', task: existingTask });
    }

    const lastTask = await Task.findOne({
      where: { projectId },
      order: [['order', 'DESC']]
    });
    const order = lastTask ? lastTask.order + 1 : 0;

    const status = googleTask.status === 'completed' ? 'completada' : 'pendiente';
    const dueDate = googleTask.due ? googleTask.due.split('T')[0] : null;

    const newTask = await Task.create({
      title: googleTask.title,
      description: googleTask.notes || '',
      status,
      order,
      dueDate,
      projectId,
      googleTaskId: googleTask.id,
      assigneeId: userId
    });

    const taskWithRelations = await Task.findByPk(newTask.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    res.status(201).json(taskWithRelations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
