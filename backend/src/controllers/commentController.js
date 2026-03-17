const { Comment, Task, User, ProjectMember } = require('../models');
const notificationService = require('../services/notificationService');
const { emitToProject } = require('../socket');

const parseMentions = (content) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

const findUsersByMentions = async (content, projectId) => {
  const mentionedNames = parseMentions(content);
  if (mentionedNames.length === 0) return [];
  
  const members = await ProjectMember.findAll({
    where: { projectId },
    include: [{ model: User, as: 'user' }]
  });
  
  const users = members
    .map(m => m.user)
    .filter(u => mentionedNames.some(name => 
      u.name.toLowerCase().includes(name.toLowerCase()) || 
      u.email.split('@')[0].toLowerCase() === name.toLowerCase()
    ));
  
  return users;
};

const checkProjectAccess = async (userId, taskId) => {
  // Allow all authenticated users (company-wide collaboration)
  return true;
};

exports.createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const membership = await checkProjectAccess(userId, taskId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const task = await Task.findByPk(taskId);
    const mentionedUsers = await findUsersByMentions(content, task.projectId);
    const mentionIds = mentionedUsers.map(u => u.id);

    const comment = await Comment.create({ taskId, userId, content, mentions: mentionIds });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser.id !== userId) {
        await notificationService.notifyTaskMention(mentionedUser.id, task, req.user);
      }
    }

    emitToProject(task.projectId, 'comment_created', commentWithUser);

    res.status(201).json(commentWithUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const membership = await checkProjectAccess(userId, taskId);
    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a esta tarea' });
    }

    const comments = await Comment.findAll({
      where: { taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'ASC']]
    });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await Comment.findByPk(commentId, {
      include: [{ model: Task, as: 'task' }]
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'No puedes editar este comentario' });
    }

    const mentionedUsers = await findUsersByMentions(content, comment.task.projectId);
    const mentionIds = mentionedUsers.map(u => u.id);

    await comment.update({ content, mentions: mentionIds });

    const updatedComment = await Comment.findByPk(commentId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    emitToProject(comment.task.projectId, 'comment_updated', updatedComment);

    res.json(updatedComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findByPk(commentId, {
      include: [{ model: Task, as: 'task' }]
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    const membership = await ProjectMember.findOne({ where: { userId, projectId: comment.task.projectId } });

    if (comment.userId !== userId && !membership) {
      return res.status(403).json({ error: 'No puedes eliminar este comentario' });
    }

    await comment.destroy();

    emitToProject(comment.task.projectId, 'comment_deleted', { id: commentId });

    res.json({ message: 'Comentario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
