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
  createSubTask,
  updateSubTask,
  deleteSubTask,
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

// Sub-tasks routes
router.post('/checklists/:checklistId/sub-tasks', createSubTask);
router.put('/sub-tasks/:subTaskId', updateSubTask);
router.delete('/sub-tasks/:subTaskId', deleteSubTask);

module.exports = router;









