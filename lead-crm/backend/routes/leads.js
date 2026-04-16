// Lead Routes
// Public lead capture plus protected CRM lead management routes.

const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { optionalProtect, protect } = require('../middleware/auth');

router.post('/', optionalProtect, leadController.createLead);
router.get('/', protect, leadController.getAllLeads);
router.get('/:id', protect, leadController.getLead);
router.put('/:id', protect, leadController.updateLead);
router.delete('/:id', protect, leadController.deleteLead);
router.patch('/:id/status', protect, leadController.updateLeadStatus);

module.exports = router;
