const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { User } = require('../models');

router.use(auth);

// Specific routes first (before param routes)
router.get('/kanban', projectController.getProjectsByKanbanStatus);
router.get('/users/all', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.patch('/:id/kanban-status', projectController.updateKanbanStatus);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/members', projectController.addMember);

module.exports = router;