const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect, admin } = require('../middleware/auth');

// Tất cả routes đều cần admin
router.use(protect);
router.use(admin);

router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;

