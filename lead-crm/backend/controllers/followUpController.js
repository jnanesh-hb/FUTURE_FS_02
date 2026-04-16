// Follow-up Controller
// Handles notes, reminders, and interaction history for a lead.

const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');

const VALID_TYPES = ['Call', 'Email', 'Meeting', 'Note', 'Task', 'Other'];
const VALID_STATUSES = ['Pending', 'Completed', 'Cancelled'];

exports.getLeadFollowUps = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
      });
    }

    const followUps = await FollowUp.find({ leadId: req.params.leadId })
      .populate('userId', 'name email')
      .sort({ scheduledDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch follow-ups.',
    });
  }
};

exports.createFollowUp = async (req, res) => {
  try {
    const { type = 'Note', description, scheduledDate, status, outcome } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required.',
      });
    }

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid follow-up type.',
      });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid follow-up status.',
      });
    }

    const lead = await Lead.findById(req.params.leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
      });
    }

    const followUp = await FollowUp.create({
      leadId: req.params.leadId,
      userId: req.user.id,
      type,
      description: description.trim(),
      scheduledDate: scheduledDate || null,
      status: status || 'Pending',
      outcome: outcome?.trim() || '',
      completedDate: status === 'Completed' ? new Date() : null,
    });

    const populated = await FollowUp.findById(followUp._id).populate(
      'userId',
      'name email'
    );

    res.status(201).json({
      success: true,
      message: 'Follow-up added successfully.',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to create follow-up.',
    });
  }
};

exports.updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found.',
      });
    }

    const { type, description, scheduledDate, status, outcome } = req.body;

    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up type.',
        });
      }
      followUp.type = type;
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Description is required.',
        });
      }
      followUp.description = description.trim();
    }

    if (scheduledDate !== undefined) {
      followUp.scheduledDate = scheduledDate || null;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up status.',
        });
      }
      followUp.status = status;
      followUp.completedDate = status === 'Completed' ? new Date() : null;
    }

    if (outcome !== undefined) {
      followUp.outcome = outcome.trim();
    }

    await followUp.save();

    const populated = await FollowUp.findById(followUp._id).populate(
      'userId',
      'name email'
    );

    res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully.',
      data: populated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to update follow-up.',
    });
  }
};

exports.deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Follow-up deleted successfully.',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to delete follow-up.',
    });
  }
};
