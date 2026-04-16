// Dashboard Controller
// Handles aggregate CRM statistics, recent activity, and CSV export.

const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');

const escapeCsvCell = (value) => {
  const stringValue = value === undefined || value === null ? '' : String(value);
  if (stringValue.includes(',') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalLeads,
      totalConverted,
      leadsByStatusRaw,
      leadsBySourceRaw,
      avgLeadScoreRaw,
      pendingFollowUps,
      recentLeads,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'Converted' }),
      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Lead.aggregate([{ $group: { _id: null, avgScore: { $avg: '$leadScore' } } }]),
      FollowUp.countDocuments({ status: 'Pending' }),
      Lead.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName company status createdAt'),
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [leadsThisWeek, upcomingFollowUps] = await Promise.all([
      Lead.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      FollowUp.find({
        status: 'Pending',
        scheduledDate: { $ne: null },
      })
        .populate('leadId', 'firstName lastName company')
        .sort({ scheduledDate: 1 })
        .limit(5),
    ]);

    const conversionRate =
      totalLeads > 0 ? Number(((totalConverted / totalLeads) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        totalConverted,
        conversionRate,
        avgLeadScore: Number((avgLeadScoreRaw[0]?.avgScore || 0).toFixed(2)),
        leadsThisWeek,
        pendingFollowUps,
        leadsByStatus: leadsByStatusRaw.map((item) => ({
          status: item._id,
          count: item.count,
        })),
        leadsBySource: leadsBySourceRaw.map((item) => ({
          source: item._id,
          count: item.count,
        })),
        recentLeads,
        upcomingFollowUps,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to load dashboard statistics.',
    });
  }
};

exports.exportLeads = async (req, res) => {
  try {
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .select(
        'firstName lastName email phone company source status leadScore message createdAt'
      );

    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Source',
      'Status',
      'Lead Score',
      'Message',
      'Created Date',
    ];

    const rows = leads.map((lead) => [
      lead.firstName,
      lead.lastName,
      lead.email,
      lead.phone,
      lead.company,
      lead.source,
      lead.status,
      lead.leadScore,
      lead.message,
      lead.createdAt.toISOString(),
    ]);

    const csv = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map((row) => row.map(escapeCsvCell).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to export leads.',
    });
  }
};

exports.getPendingFollowUps = async (req, res) => {
  try {
    const followUps = await FollowUp.find({ status: 'Pending' })
      .populate('leadId', 'firstName lastName email company')
      .populate('userId', 'name email')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to fetch pending follow-ups.',
    });
  }
};
