const { Project, ProjectMember, User, Task } = require('../models');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre del proyecto es requerido' });
    }

    const project = await Project.create({
      name,
      description,
      ownerId: req.user.id
    });

    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'owner'
    });

    const projectWithOwner = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json(projectWithOwner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    // Return ALL projects for company-wide collaboration
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', through: { attributes: ['role'] }, attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Allow any authenticated user to access any project
    const project = await Project.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { 
          model: User, 
          as: 'members', 
          through: { attributes: ['role'] }, 
          attributes: ['id', 'name', 'email'] 
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Check if current user is owner
    const isOwner = project.ownerId === req.user.id;
    
    res.json({
      ...project.toJSON(),
      role: isOwner ? 'owner' : 'member'
    });
  } catch (error) {
    console.error('getProject error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const membership = await ProjectMember.findOne({
      where: { userId: req.user.id, projectId: id }
    });

    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await project.update({ name, description });
    
    const updatedProject = await Project.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Allow any authenticated user to delete any project (company-wide)
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Delete related records first (tasks, members)
    const { Task, ProjectMember } = require('../models');
    await Task.destroy({ where: { projectId: id } });
    await ProjectMember.destroy({ where: { projectId: id } });
    
    await project.destroy();
    res.json({ message: 'Proyecto eliminado' });
  } catch (error) {
    console.error('deleteProject error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;

    const membership = await ProjectMember.findOne({
      where: { userId: req.user.id, projectId: id }
    });

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ error: 'Solo el propietario puede agregar miembros' });
    }

    const existingMember = await ProjectMember.findOne({
      where: { userId, projectId: id }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'El usuario ya es miembro del proyecto' });
    }

    const newMember = await ProjectMember.create({
      projectId: id,
      userId,
      role
    });

    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });

    res.status(201).json({ ...newMember.toJSON(), user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateKanbanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { kanbanStatus } = req.body;

    if (!kanbanStatus || !['backlog', 'en_proceso', 'esperando', 'completados'].includes(kanbanStatus)) {
      return res.status(400).json({ error: 'Estado Kanban inválido' });
    }

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await project.update({ kanbanStatus });

    const updatedProject = await Project.findByPk(id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectsByKanbanStatus = async (req, res) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      if (!['backlog', 'en_proceso', 'esperando', 'completados'].includes(status)) {
        return res.status(400).json({ error: 'Estado Kanban inválido' });
      }
      where.kanbanStatus = status;
    }

    const projects = await Project.findAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', through: { attributes: ['role'] }, attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};