const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.post('/tasks/:taskId/comments', auth, commentController.createComment);
router.get('/tasks/:taskId/comments', auth, commentController.getComments);
router.put('/comments/:commentId', auth, commentController.updateComment);
router.delete('/comments/:commentId', auth, commentController.deleteComment);

module.exports = router;
