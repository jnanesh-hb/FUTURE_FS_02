// Lead Model
// Stores prospects and their lifecycle in the CRM.

const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      default: null,
    },
    to: {
      type: String,
      enum: ['New', 'Contacted', 'In Progress', 'Converted', 'Closed'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please provide last name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide a company name'],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['Website', 'Email', 'Phone', 'Referral', 'Social Media', 'Other'],
      default: 'Website',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'In Progress', 'Converted', 'Closed'],
      default: 'New',
    },
    leadScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ email: 1 });
leadSchema.index({ company: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
