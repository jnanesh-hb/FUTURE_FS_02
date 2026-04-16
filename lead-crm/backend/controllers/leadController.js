// Lead Controller
// Handles lead CRUD, search/filter, status updates, and lead scoring.

const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const { sendNewLeadNotification } = require('../utils/mailer');

const VALID_STATUSES = [
  'New',
  'Contacted',
  'In Progress',
  'Converted',
  'Closed',
];

const VALID_SOURCES = [
  'Website',
  'Email',
  'Phone',
  'Referral',
  'Social Media',
  'Other',
];

const calculateLeadScore = (lead, interactionCount = 0) => {
  const statusScores = {
    New: 20,
    Contacted: 40,
    'In Progress': 65,
    Converted: 100,
    Closed: 25,
  };

  const sourceBoost = {
    Referral: 15,
    Phone: 12,
    Website: 8,
    Email: 6,
    'Social Media': 4,
    Other: 2,
  };

  let score = statusScores[lead.status] || 0;
  score += sourceBoost[lead.source] || 0;

  if (lead.company) {
    score += 5;
  }

  if (lead.message && lead.message.length >= 40) {
    score += 8;
  }

  score += Math.min(interactionCount * 5, 15);

  return Math.min(score, 100);
};

const normalizeLeadInput = (payload = {}) => ({
  firstName: payload.firstName?.trim(),
  lastName: payload.lastName?.trim(),
  email: payload.email?.trim().toLowerCase(),
  phone: payload.phone?.trim(),
  company: payload.company?.trim(),
  message: payload.message?.trim() || '',
  source: payload.source?.trim() || 'Website',
  status: payload.status?.trim() || 'New',
});

const addStatusHistoryEntry = (lead, oldStatus, newStatus, userId) => {
  if (oldStatus !== newStatus) {
    lead.statusHistory.push({
      from: oldStatus,
      to: newStatus,
      changedBy: userId || null,
      changedAt: new Date(),
    });
  }
};

exports.createLead = async (req, res) => {
  try {
    const payload = normalizeLeadInput(req.body);

    if (
      !payload.firstName ||
      !payload.lastName ||
      !payload.email ||
      !payload.phone ||
      !payload.company
    ) {
      return res.status(400).json({
        success: false,
        message:
          'First name, last name, email, phone, and company are required.',
      });
    }

    if (!VALID_SOURCES.includes(payload.source)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead source.',
      });
    }

    if (!VALID_STATUSES.includes(payload.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead status.',
      });
    }

    const existingLead = await Lead.findOne({ email: payload.email });
    if (existingLead) {
      return res.status(409).json({
        success: false,
        message: 'A lead with this email already exists.',
      });
    }

    const lead = await Lead.create({
      ...payload,
      status: payload.status,
      assignedTo: req.user?.id || null,
      statusHistory: [
        {
          from: null,
          to: payload.status,
          changedBy: req.user?.id || null,
          changedAt: new Date(),
        },
      ],
    });

    lead.leadScore = calculateLeadScore(lead, 0);
    await lead.save();

    await sendNewLeadNotification(lead);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully.',
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to create lead.',
    });
  }
};

exports.getAllLeads = async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (search.trim()) {
      query.$or = [
        { firstName: { $regex: search.trim(), $options: 'i' } },
        { lastName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { company: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const sortDirection = order === 'asc' ? 1 : -1;

    const [total, leads] = await Promise.all([
      Lead.countDocuments(query),
      Lead.find(query)
        .populate('assignedTo', 'name email')
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(parsedLimit),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit),
      data: leads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch leads.',
    });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate(
      'assignedTo',
      'name email'
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
      });
    }

    const followUps = await FollowUp.find({ leadId: lead._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        lead,
        followUps,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch lead details.',
    });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
      });
    }

    const previousStatus = lead.status;

    const allowedFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'company',
      'message',
      'source',
      'status',
      'assignedTo',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        lead[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    if (lead.email) {
      lead.email = lead.email.toLowerCase();
    }

    if (req.body.source && !VALID_SOURCES.includes(req.body.source)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead source.',
      });
    }

    if (req.body.status && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lead status.',
      });
    }

    addStatusHistoryEntry(
      lead,
      previousStatus,
      lead.status,
      req.user?.id
    );

    const interactionCount = await FollowUp.countDocuments({ leadId: lead._id });
    lead.leadScore = calculateLeadScore(lead, interactionCount);
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead updated successfully.',
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to update lead.',
    });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
      });
    }

    await Promise.all([
      FollowUp.deleteMany({ leadId: lead._id }),
      Lead.findByIdAndDelete(req.params.id),
    ]);

    res.status(200).json({
      success: true,
      message: 'Lead deleted successfully.',
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to delete lead.',
    });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid lead status.',
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found.',
      });
    }

    const previousStatus = lead.status;
    lead.status = status;
    addStatusHistoryEntry(lead, previousStatus, status, req.user?.id);

    const interactionCount = await FollowUp.countDocuments({ leadId: lead._id });
    lead.leadScore = calculateLeadScore(lead, interactionCount);
    await lead.save();

    res.status(200).json({
      success: true,
      message: 'Lead status updated successfully.',
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to update lead status.',
    });
  }
};

