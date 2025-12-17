const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateChecklist,
  getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getTaskStats);
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.put('/:taskId/checklists/:checklistId', updateChecklist);

module.exports = router;

