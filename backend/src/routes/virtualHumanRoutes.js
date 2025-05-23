const express = require('express');
const router = express.Router();
const virtualHumanController = require('../controllers/virtualHumanController');
const { auth } = require('../middlewares/auth');

// Virtual Human routes
router.post('/create', auth, virtualHumanController.createVirtualHuman);
router.get('/me', auth, virtualHumanController.getMyVirtualHuman);
router.put('/update', auth, virtualHumanController.updateVirtualHuman);
router.get('/activities', auth, virtualHumanController.getActivities);
router.get('/relationships', auth, virtualHumanController.getRelationships);
router.get('/emotional-state', auth, virtualHumanController.getEmotionalState);
router.post('/emotional-state', auth, virtualHumanController.updateEmotionalState);
router.get('/evolution-history', auth, virtualHumanController.getEvolutionHistory);
router.post('/evolve', auth, virtualHumanController.evolve);
router.post('/deactivate', auth, virtualHumanController.deactivate);
router.post('/reactivate', auth, virtualHumanController.reactivate);
router.get('/statistics', auth, virtualHumanController.getStatistics);

module.exports = router;
