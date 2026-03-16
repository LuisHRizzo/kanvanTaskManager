const { google } = require('googleapis');

const createGoogleTasksClient = (tokens) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials(tokens);
  return google.tasks({ version: 'v1', auth });
};

const getAllTaskLists = async (tokens) => {
  const tasks = createGoogleTasksClient(tokens);
  const response = await tasks.tasklists.list();
  return response.data.items || [];
};

const getOrCreateDefaultTaskList = async (tokens, userId) => {
  const taskLists = await getAllTaskLists(tokens);
  
  const defaultList = taskLists.find(list => list.title === 'Gestor de Proyectos');
  
  if (defaultList) {
    return defaultList;
  }
  
  const tasks = createGoogleTasksClient(tokens);
  const response = await tasks.tasklists.insert({
    requestBody: {
      title: 'Gestor de Proyectos'
    }
  });
  
  return response.data;
};

const createTask = async (tokens, taskListId, taskData) => {
  const tasks = createGoogleTasksClient(tokens);
  
  const task = {
    title: taskData.title,
    notes: taskData.description || '',
    due: taskData.dueDate ? `${taskData.dueDate}T12:00:00.000Z` : undefined,
    status: mapStatusToGoogle(taskData.status)
  };
  
  const response = await tasks.tasks.insert({
    tasklist: taskListId,
    requestBody: task
  });
  
  return response.data;
};

const updateTask = async (tokens, taskListId, googleTaskId, taskData) => {
  const tasks = createGoogleTasksClient(tokens);
  
  const task = {
    title: taskData.title,
    notes: taskData.description || '',
    due: taskData.dueDate ? `${taskData.dueDate}T12:00:00.000Z` : undefined,
    status: mapStatusToGoogle(taskData.status)
  };
  
  const response = await tasks.tasks.patch({
    tasklist: taskListId,
    task: googleTaskId,
    requestBody: task
  });
  
  return response.data;
};

const deleteTask = async (tokens, taskListId, googleTaskId) => {
  const tasks = createGoogleTasksClient(tokens);
  
  await tasks.tasks.delete({
    tasklist: taskListId,
    task: googleTaskId
  });
};

const getTasks = async (tokens, taskListId) => {
  const tasks = createGoogleTasksClient(tokens);
  
  const response = await tasks.tasks.list({
    tasklist: taskListId
  });
  
  return response.data.items || [];
};

const getTask = async (tokens, taskListId, googleTaskId) => {
  const tasks = createGoogleTasksClient(tokens);
  
  const response = await tasks.tasks.get({
    tasklist: taskListId,
    task: googleTaskId
  });
  
  return response.data;
};

const mapStatusToGoogle = (status) => {
  const statusMap = {
    'pendiente': 'needsAction',
    'en_progreso': 'needsAction',
    'en_revision': 'needsAction',
    'completada': 'completed'
  };
  return statusMap[status] || 'needsAction';
};

const getTaskByGoogleId = async (tokens, taskListId, googleTaskId) => {
  try {
    return await getTask(tokens, taskListId, googleTaskId);
  } catch (error) {
    if (error.code === 404) {
      return null;
    }
    throw error;
  }
};

module.exports = {
  createGoogleTasksClient,
  getAllTaskLists,
  getOrCreateDefaultTaskList,
  createTask,
  updateTask,
  deleteTask,
  getTasks,
  getTask,
  mapStatusToGoogle,
  getTaskByGoogleId
};
