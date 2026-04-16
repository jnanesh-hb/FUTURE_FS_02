// Demo Routes
// In-memory CRM API used when DEMO_MODE=true so the app can run without MongoDB.

const express = require('express');
const router = express.Router();

const demoUser = {
  id: 'demo-user-1',
  name: 'Demo Admin',
  email: 'admin@demo.com',
  role: 'admin',
};

const token = 'demo-token';

const leads = [
  {
    _id: 'lead-1',
    firstName: 'Anika',
    lastName: 'Sharma',
    email: 'anika@brightlabs.com',
    phone: '+91 98765 43210',
    company: 'Bright Labs',
    message: 'Interested in a CRM setup for a growing sales team.',
    source: 'Website',
    status: 'New',
    leadScore: 33,
    assignedTo: demoUser,
    statusHistory: [{ from: null, to: 'New', changedBy: demoUser.id, changedAt: new Date() }],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    updatedAt: new Date(),
  },
  {
    _id: 'lead-2',
    firstName: 'Rahul',
    lastName: 'Mehta',
    email: 'rahul@urbanforge.com',
    phone: '+91 99887 77665',
    company: 'Urban Forge',
    message: 'Needs follow-up next week after product demo.',
    source: 'Referral',
    status: 'In Progress',
    leadScore: 88,
    assignedTo: demoUser,
    statusHistory: [
      { from: null, to: 'New', changedBy: demoUser.id, changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
      { from: 'New', to: 'Contacted', changedBy: demoUser.id, changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) },
      { from: 'Contacted', to: 'In Progress', changedBy: demoUser.id, changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(),
  },
  {
    _id: 'lead-3',
    firstName: 'Maya',
    lastName: 'Iyer',
    email: 'maya@northstar.io',
    phone: '+91 91234 56789',
    company: 'Northstar IO',
    message: 'Converted after pricing discussion.',
    source: 'Email',
    status: 'Converted',
    leadScore: 100,
    assignedTo: demoUser,
    statusHistory: [
      { from: null, to: 'New', changedBy: demoUser.id, changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12) },
      { from: 'New', to: 'Converted', changedBy: demoUser.id, changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    updatedAt: new Date(),
  },
];

const followUps = [
  {
    _id: 'follow-1',
    leadId: 'lead-2',
    userId: demoUser,
    type: 'Meeting',
    description: 'Completed discovery call and shared feature walkthrough.',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    completedDate: null,
    status: 'Pending',
    outcome: 'Send proposal after finance approval.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    updatedAt: new Date(),
  },
  {
    _id: 'follow-2',
    leadId: 'lead-1',
    userId: demoUser,
    type: 'Call',
    description: 'Call to qualify company size and budget.',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
    completedDate: null,
    status: 'Pending',
    outcome: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const validStatuses = ['New', 'Contacted', 'In Progress', 'Converted', 'Closed'];
const validSources = ['Website', 'Email', 'Phone', 'Referral', 'Social Media', 'Other'];

const requireDemoAuth = (req, res, next) => {
  if (req.headers.authorization !== `Bearer ${token}`) {
    return res.status(401).json({ success: false, message: 'Demo login required.' });
  }

  return next();
};

const calculateLeadScore = (lead) => {
  const statusScores = { New: 20, Contacted: 40, 'In Progress': 65, Converted: 100, Closed: 25 };
  const sourceBoost = { Referral: 15, Phone: 12, Website: 8, Email: 6, 'Social Media': 4, Other: 2 };
  const interactionCount = followUps.filter((item) => item.leadId === lead._id).length;
  return Math.min((statusScores[lead.status] || 0) + (sourceBoost[lead.source] || 0) + Math.min(interactionCount * 5, 15), 100);
};

const getStats = () => {
  const byStatus = validStatuses
    .map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length }))
    .filter((item) => item.count > 0);
  const bySource = validSources
    .map((source) => ({ source, count: leads.filter((lead) => lead.source === source).length }))
    .filter((item) => item.count > 0);
  const converted = leads.filter((lead) => lead.status === 'Converted').length;

  return {
    totalLeads: leads.length,
    totalConverted: converted,
    conversionRate: leads.length ? Number(((converted / leads.length) * 100).toFixed(2)) : 0,
    avgLeadScore: leads.length ? Number((leads.reduce((sum, lead) => sum + lead.leadScore, 0) / leads.length).toFixed(2)) : 0,
    leadsThisWeek: leads.filter((lead) => new Date(lead.createdAt) >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)).length,
    pendingFollowUps: followUps.filter((item) => item.status === 'Pending').length,
    leadsByStatus: byStatus,
    leadsBySource: bySource,
    recentLeads: leads.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    upcomingFollowUps: followUps.filter((item) => item.status === 'Pending').slice(0, 5),
  };
};

router.post('/auth/register', (req, res) => {
  res.status(201).json({ success: true, message: 'Demo account ready.', token, user: demoUser });
});

router.post('/auth/login', (req, res) => {
  res.json({ success: true, message: 'Demo login successful.', token, user: demoUser });
});

router.get('/auth/me', requireDemoAuth, (req, res) => {
  res.json({ success: true, data: demoUser });
});

router.get('/dashboard/stats', requireDemoAuth, (req, res) => {
  res.json({ success: true, data: getStats() });
});

router.get('/dashboard/pending-followups', requireDemoAuth, (req, res) => {
  res.json({ success: true, data: followUps.filter((item) => item.status === 'Pending') });
});

router.get('/dashboard/export', requireDemoAuth, (req, res) => {
  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Source', 'Status', 'Lead Score'];
  const rows = leads.map((lead) => [lead.firstName, lead.lastName, lead.email, lead.phone, lead.company, lead.source, lead.status, lead.leadScore]);
  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="demo_leads.csv"');
  res.send(csv);
});

router.get('/leads', requireDemoAuth, (req, res) => {
  const { search = '', status = 'All' } = req.query;
  const searchText = search.toLowerCase();
  const filtered = leads.filter((lead) => {
    const matchesSearch = !searchText || [lead.firstName, lead.lastName, lead.email, lead.company].some((value) => value.toLowerCase().includes(searchText));
    const matchesStatus = !status || status === 'All' || lead.status === status;
    return matchesSearch && matchesStatus;
  });

  res.json({ success: true, total: filtered.length, page: 1, limit: 50, pages: 1, data: filtered });
});

router.post('/leads', (req, res) => {
  const now = new Date();
  const lead = {
    _id: `lead-${Date.now()}`,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company,
    message: req.body.message || '',
    source: req.body.source || 'Website',
    status: req.body.status || 'New',
    assignedTo: demoUser,
    statusHistory: [{ from: null, to: req.body.status || 'New', changedBy: demoUser.id, changedAt: now }],
    createdAt: now,
    updatedAt: now,
  };
  lead.leadScore = calculateLeadScore(lead);
  leads.unshift(lead);
  res.status(201).json({ success: true, message: 'Demo lead created.', data: lead });
});

router.get('/leads/:id', requireDemoAuth, (req, res) => {
  const lead = leads.find((item) => item._id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
  res.json({ success: true, data: { lead, followUps: followUps.filter((item) => item.leadId === lead._id) } });
});

router.put('/leads/:id', requireDemoAuth, (req, res) => {
  const lead = leads.find((item) => item._id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
  const oldStatus = lead.status;
  Object.assign(lead, req.body, { updatedAt: new Date() });
  if (req.body.status && req.body.status !== oldStatus) {
    lead.statusHistory.push({ from: oldStatus, to: req.body.status, changedBy: demoUser.id, changedAt: new Date() });
  }
  lead.leadScore = calculateLeadScore(lead);
  res.json({ success: true, message: 'Demo lead updated.', data: lead });
});

router.patch('/leads/:id/status', requireDemoAuth, (req, res) => {
  const lead = leads.find((item) => item._id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
  const oldStatus = lead.status;
  lead.status = req.body.status;
  lead.statusHistory.push({ from: oldStatus, to: req.body.status, changedBy: demoUser.id, changedAt: new Date() });
  lead.leadScore = calculateLeadScore(lead);
  res.json({ success: true, message: 'Demo status updated.', data: lead });
});

router.delete('/leads/:id', requireDemoAuth, (req, res) => {
  const index = leads.findIndex((item) => item._id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Lead not found.' });
  leads.splice(index, 1);
  for (let i = followUps.length - 1; i >= 0; i -= 1) {
    if (followUps[i].leadId === req.params.id) followUps.splice(i, 1);
  }
  res.json({ success: true, message: 'Demo lead deleted.', data: {} });
});

router.get('/followups/lead/:leadId', requireDemoAuth, (req, res) => {
  res.json({ success: true, data: followUps.filter((item) => item.leadId === req.params.leadId) });
});

router.post('/followups/lead/:leadId', requireDemoAuth, (req, res) => {
  const followUp = {
    _id: `follow-${Date.now()}`,
    leadId: req.params.leadId,
    userId: demoUser,
    type: req.body.type || 'Note',
    description: req.body.description,
    scheduledDate: req.body.scheduledDate || null,
    completedDate: req.body.status === 'Completed' ? new Date() : null,
    status: req.body.status || 'Pending',
    outcome: req.body.outcome || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  followUps.unshift(followUp);
  res.status(201).json({ success: true, message: 'Demo follow-up created.', data: followUp });
});

router.put('/followups/:id', requireDemoAuth, (req, res) => {
  const followUp = followUps.find((item) => item._id === req.params.id);
  if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found.' });
  Object.assign(followUp, req.body, { updatedAt: new Date() });
  res.json({ success: true, message: 'Demo follow-up updated.', data: followUp });
});

router.delete('/followups/:id', requireDemoAuth, (req, res) => {
  const index = followUps.findIndex((item) => item._id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Follow-up not found.' });
  followUps.splice(index, 1);
  res.json({ success: true, message: 'Demo follow-up deleted.', data: {} });
});

module.exports = router;
