const express = require('express');
const router = express.Router();
const dynamicWorldController = require('../controllers/dynamicWorldController');
const { auth } = require('../middlewares/auth');

// Dynamic World routes
router.post('/create', auth, dynamicWorldController.createWorld);
router.get('/active', auth, dynamicWorldController.getActiveWorlds);
router.get('/search', auth, dynamicWorldController.searchWorlds);
router.get('/my-worlds', auth, dynamicWorldController.getUserWorlds);
router.get('/:worldId', auth, dynamicWorldController.getWorld);
router.put('/:worldId', auth, dynamicWorldController.updateWorld);
router.post('/:worldId/join', auth, dynamicWorldController.joinWorld);
router.post('/:worldId/leave', auth, dynamicWorldController.leaveWorld);
router.post('/:worldId/structures', auth, dynamicWorldController.addStructure);
router.put('/:worldId/structures/:structureId', auth, dynamicWorldController.updateStructure);
router.delete('/:worldId/structures/:structureId', auth, dynamicWorldController.deleteStructure);
router.post('/:worldId/rules', auth, dynamicWorldController.addDynamicRule);
router.get('/:worldId/evolution', auth, dynamicWorldController.getEvolutionHistory);
router.get('/:worldId/statistics', auth, dynamicWorldController.getWorldStatistics);
router.post('/:worldId/emotion', auth, dynamicWorldController.updateCollectiveEmotion);

module.exports = router;
