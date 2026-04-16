// FollowUp Model
// Stores reminders, notes, and interaction history for leads.

const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: ['Call', 'Email', 'Meeting', 'Note', 'Task', 'Other'],
      default: 'Note',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    outcome: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

followUpSchema.index({ leadId: 1, createdAt: -1 });
followUpSchema.index({ userId: 1 });
followUpSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
