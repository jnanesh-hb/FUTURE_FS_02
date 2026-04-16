// Follow-up Routes
// Lead interaction history, notes, and reminders.

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const followUpController = require('../controllers/followUpController');

router.get('/lead/:leadId', protect, followUpController.getLeadFollowUps);
router.post('/lead/:leadId', protect, followUpController.createFollowUp);
router.put('/:id', protect, followUpController.updateFollowUp);
router.delete('/:id', protect, followUpController.deleteFollowUp);

module.exports = router;
