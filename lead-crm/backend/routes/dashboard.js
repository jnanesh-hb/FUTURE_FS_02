// Dashboard Routes
// Statistics, analytics, and export functionality

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics and analytics
 * @access Private
 */
router.get('/stats', protect, dashboardController.getDashboardStats);

/**
 * @route GET /api/dashboard/export
 * @desc Export leads to CSV
 * @access Private
 */
router.get('/export', protect, dashboardController.exportLeads);

/**
 * @route GET /api/dashboard/pending-followups
 * @desc Get pending follow-ups
 * @access Private
 */
router.get(
  '/pending-followups',
  protect,
  dashboardController.getPendingFollowUps
);

module.exports = router;
