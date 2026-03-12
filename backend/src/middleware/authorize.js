const { ProjectMember } = require('../models');

const authorizeProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return next();
    }

    const membership = await ProjectMember.findOne({
      where: {
        userId: req.user.id,
        projectId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'No tienes acceso a este proyecto' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = authorizeProject;