const state = {
  token: localStorage.getItem('crmToken') || '',
  user: JSON.parse(localStorage.getItem('crmUser') || 'null'),
  isRegisterMode: false,
  leads: [],
  selectedLeadId: null,
  stats: null,
};

const elements = {
  authView: document.getElementById('auth-view'),
  appView: document.getElementById('app-view'),
  authForm: document.getElementById('auth-form'),
  authTitle: document.getElementById('auth-title'),
  authModeLabel: document.getElementById('auth-mode-label'),
  authSubmit: document.getElementById('auth-submit'),
  toggleAuthMode: document.getElementById('toggle-auth-mode'),
  nameField: document.getElementById('name-field'),
  authName: document.getElementById('auth-name'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  welcomeUser: document.getElementById('welcome-user'),
  logoutBtn: document.getElementById('logout-btn'),
  statsGrid: document.getElementById('stats-grid'),
  statusChart: document.getElementById('status-chart'),
  sourceChart: document.getElementById('source-chart'),
  leadForm: document.getElementById('lead-form'),
  leadFormTitle: document.getElementById('lead-form-title'),
  leadId: document.getElementById('lead-id'),
  firstName: document.getElementById('first-name'),
  lastName: document.getElementById('last-name'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  company: document.getElementById('company'),
  source: document.getElementById('source'),
  status: document.getElementById('status'),
  message: document.getElementById('message'),
  leadSubmit: document.getElementById('lead-submit'),
  resetLeadForm: document.getElementById('reset-lead-form'),
  searchInput: document.getElementById('search-input'),
  statusFilter: document.getElementById('status-filter'),
  leadsTableBody: document.getElementById('leads-table-body'),
  detailTitle: document.getElementById('detail-title'),
  leadDetail: document.getElementById('lead-detail'),
  followupForm: document.getElementById('followup-form'),
  followupType: document.getElementById('followup-type'),
  followupStatus: document.getElementById('followup-status'),
  followupDescription: document.getElementById('followup-description'),
  followupDate: document.getElementById('followup-date'),
  followupOutcome: document.getElementById('followup-outcome'),
  exportBtn: document.getElementById('export-btn'),
  toast: document.getElementById('toast'),
};

const statusClassMap = {
  New: 'status-new',
  Contacted: 'status-contacted',
  'In Progress': 'status-in-progress',
  Converted: 'status-converted',
  Closed: 'status-closed',
};

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  elements.toast.style.background = isError ? '#7c2d12' : '#183a37';

  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2600);
}

async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('text/csv')) {
    return response;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

function setAuthMode(isRegisterMode) {
  state.isRegisterMode = isRegisterMode;
  elements.nameField.classList.toggle('hidden', !isRegisterMode);
  elements.authTitle.textContent = isRegisterMode ? 'Create account' : 'Login';
  elements.authModeLabel.textContent = isRegisterMode
    ? 'Admin Setup'
    : 'Admin Access';
  elements.authSubmit.textContent = isRegisterMode ? 'Register' : 'Login';
  elements.toggleAuthMode.textContent = isRegisterMode
    ? 'Back to login'
    : 'Create account';
}

function updateAuthView() {
  const isLoggedIn = Boolean(state.token && state.user);
  elements.authView.classList.toggle('hidden', isLoggedIn);
  elements.appView.classList.toggle('hidden', !isLoggedIn);
  elements.welcomeUser.textContent = state.user
    ? `${state.user.name} (${state.user.role})`
    : '';
}

function saveSession(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('crmToken', token);
  localStorage.setItem('crmUser', JSON.stringify(user));
  updateAuthView();
}

function clearSession() {
  state.token = '';
  state.user = null;
  state.leads = [];
  state.selectedLeadId = null;
  localStorage.removeItem('crmToken');
  localStorage.removeItem('crmUser');
  updateAuthView();
}

function resetLeadForm() {
  elements.leadForm.reset();
  elements.leadId.value = '';
  elements.status.value = 'New';
  elements.source.value = 'Website';
  elements.leadFormTitle.textContent = 'Add new lead';
  elements.leadSubmit.textContent = 'Save Lead';
}

function formatDate(value) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleString();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderStats() {
  if (!state.stats) {
    return;
  }

  const cards = [
    ['Total Leads', state.stats.totalLeads],
    ['Converted', state.stats.totalConverted],
    ['Conversion Rate', `${state.stats.conversionRate}%`],
    ['Average Score', state.stats.avgLeadScore],
    ['Pending Follow-ups', state.stats.pendingFollowUps],
  ];

  elements.statsGrid.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <p class="eyebrow">${label}</p>
          <div class="stat-value">${value}</div>
        </article>
      `
    )
    .join('');

  const renderChart = (container, items, labelKey) => {
    if (!items.length) {
      container.innerHTML = '<div class="empty-state-inline">No data yet.</div>';
      return;
    }

    const max = Math.max(...items.map((item) => item.count), 1);
    container.innerHTML = items
      .map(
        (item) => `
          <div class="chart-item">
            <strong>${escapeHtml(item[labelKey])}</strong>
            <div class="chart-track">
              <div class="chart-fill" style="width: ${(item.count / max) * 100}%"></div>
            </div>
            <span>${item.count}</span>
          </div>
        `
      )
      .join('');
  };

  renderChart(elements.statusChart, state.stats.leadsByStatus, 'status');
  renderChart(elements.sourceChart, state.stats.leadsBySource, 'source');
}

function renderLeads() {
  if (!state.leads.length) {
    elements.leadsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state-inline">No leads found for this search.</td>
      </tr>
    `;
    return;
  }

  elements.leadsTableBody.innerHTML = state.leads
    .map(
      (lead) => `
        <tr>
          <td>
            <strong>${escapeHtml(lead.firstName)} ${escapeHtml(lead.lastName)}</strong><br />
            <span class="muted-text">${escapeHtml(lead.email)}</span>
          </td>
          <td>${escapeHtml(lead.company)}<br /><span class="muted-text">${escapeHtml(lead.phone)}</span></td>
          <td>${escapeHtml(lead.source)}</td>
          <td>
            <span class="status-pill ${statusClassMap[lead.status] || ''}">${escapeHtml(lead.status)}</span>
          </td>
          <td>${lead.leadScore}</td>
          <td>
            <div class="mini-actions">
              <button class="action-button" type="button" onclick="viewLead('${lead._id}')">View</button>
              <button class="action-button" type="button" onclick="editLead('${lead._id}')">Edit</button>
              <button class="action-button danger-button" type="button" onclick="deleteLead('${lead._id}')">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

function renderLeadDetail(payload) {
  const { lead, followUps } = payload;
  state.selectedLeadId = lead._id;
  elements.detailTitle.textContent = `${lead.firstName} ${lead.lastName}`;
  elements.followupForm.classList.remove('hidden');

  const statusHistory = (lead.statusHistory || [])
    .slice()
    .reverse()
    .map(
      (item) => `
        <div class="timeline-item">
          <strong>${escapeHtml(item.to)}</strong>
          <p class="muted-text">
            ${item.from ? `${escapeHtml(item.from)} to ` : ''}${escapeHtml(item.to)} on ${formatDate(
              item.changedAt
            )}
          </p>
        </div>
      `
    )
    .join('');

  const followUpHtml = followUps.length
    ? followUps
        .map(
          (item) => `
            <div class="detail-card">
              <div class="panel-header">
                <div>
                  <strong>${escapeHtml(item.type)}</strong>
                  <p class="muted-text">${escapeHtml(item.status)} | ${formatDate(item.scheduledDate || item.createdAt)}</p>
                </div>
                <button class="action-button danger-button" type="button" onclick="deleteFollowUp('${item._id}')">Delete</button>
              </div>
              <p>${escapeHtml(item.description)}</p>
              <p class="muted-text">Outcome: ${escapeHtml(item.outcome || 'Not added')}</p>
              <p class="muted-text">By: ${escapeHtml(item.userId?.name || 'Unknown user')}</p>
            </div>
          `
        )
        .join('')
    : '<div class="empty-state-inline">No follow-ups yet. Add a note or reminder below.</div>';

  elements.leadDetail.innerHTML = `
    <div class="detail-card">
      <div class="detail-meta">
        <div><strong>Company</strong><p class="muted-text">${escapeHtml(lead.company)}</p></div>
        <div><strong>Status</strong><p class="muted-text">${escapeHtml(lead.status)}</p></div>
        <div><strong>Lead Score</strong><p class="muted-text">${lead.leadScore}</p></div>
        <div><strong>Source</strong><p class="muted-text">${escapeHtml(lead.source)}</p></div>
      </div>
      <p><strong>Message</strong></p>
      <p class="muted-text">${escapeHtml(lead.message || 'No message added.')}</p>
    </div>
    <div class="stack gap-md">
      <div>
        <p class="eyebrow">Status History</p>
        <div class="history-list">${statusHistory || '<div class="empty-state-inline">No history yet.</div>'}</div>
      </div>
      <div>
        <p class="eyebrow">Interaction History</p>
        <div class="followup-list">${followUpHtml}</div>
      </div>
    </div>
  `;
}

async function loadDashboard() {
  const [statsRes, leadsRes] = await Promise.all([
    apiFetch('/api/dashboard/stats'),
    apiFetch(
      `/api/leads?search=${encodeURIComponent(
        elements.searchInput.value.trim()
      )}&status=${encodeURIComponent(elements.statusFilter.value)}&limit=50`
    ),
  ]);

  state.stats = statsRes.data;
  state.leads = leadsRes.data;
  renderStats();
  renderLeads();
}

async function loadLeadDetail(leadId) {
  const response = await apiFetch(`/api/leads/${leadId}`);
  renderLeadDetail(response.data);
}

async function handleAuthSubmit(event) {
  event.preventDefault();

  const endpoint = state.isRegisterMode ? '/api/auth/register' : '/api/auth/login';
  const payload = {
    email: elements.authEmail.value,
    password: elements.authPassword.value,
  };

  if (state.isRegisterMode) {
    payload.name = elements.authName.value;
  }

  try {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    saveSession(response.token, response.user);
    showToast(response.message);
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleLeadSubmit(event) {
  event.preventDefault();

  const currentLeadId = elements.leadId.value;
  const payload = {
    firstName: elements.firstName.value,
    lastName: elements.lastName.value,
    email: elements.email.value,
    phone: elements.phone.value,
    company: elements.company.value,
    source: elements.source.value,
    status: elements.status.value,
    message: elements.message.value,
  };

  try {
    if (currentLeadId) {
      await apiFetch(`/api/leads/${currentLeadId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Lead updated successfully.');
    } else {
      await apiFetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast('Lead added successfully.');
    }

    resetLeadForm();
    await loadDashboard();

    if (state.selectedLeadId === currentLeadId && currentLeadId) {
      await loadLeadDetail(currentLeadId);
    }
  } catch (error) {
    showToast(error.message, true);
  }
}

async function handleFollowUpSubmit(event) {
  event.preventDefault();

  if (!state.selectedLeadId) {
    showToast('Select a lead first.', true);
    return;
  }

  const payload = {
    type: elements.followupType.value,
    status: elements.followupStatus.value,
    description: elements.followupDescription.value,
    scheduledDate: elements.followupDate.value
      ? new Date(elements.followupDate.value).toISOString()
      : null,
    outcome: elements.followupOutcome.value,
  };

  try {
    await apiFetch(`/api/followups/lead/${state.selectedLeadId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    elements.followupForm.reset();
    elements.followupType.value = 'Note';
    elements.followupStatus.value = 'Pending';
    showToast('Follow-up saved.');
    await Promise.all([loadLeadDetail(state.selectedLeadId), loadDashboard()]);
  } catch (error) {
    showToast(error.message, true);
  }
}

window.viewLead = async function viewLead(leadId) {
  try {
    await loadLeadDetail(leadId);
  } catch (error) {
    showToast(error.message, true);
  }
};

window.editLead = function editLead(leadId) {
  const lead = state.leads.find((item) => item._id === leadId);
  if (!lead) return;

  elements.leadId.value = lead._id;
  elements.firstName.value = lead.firstName;
  elements.lastName.value = lead.lastName;
  elements.email.value = lead.email;
  elements.phone.value = lead.phone;
  elements.company.value = lead.company;
  elements.source.value = lead.source;
  elements.status.value = lead.status;
  elements.message.value = lead.message || '';
  elements.leadFormTitle.textContent = 'Edit lead';
  elements.leadSubmit.textContent = 'Update Lead';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteLead = async function deleteLead(leadId) {
  if (!window.confirm('Delete this lead and its follow-ups?')) {
    return;
  }

  try {
    await apiFetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    if (state.selectedLeadId === leadId) {
      state.selectedLeadId = null;
      elements.detailTitle.textContent = 'Select a lead';
      elements.leadDetail.innerHTML =
        'Choose a lead to view notes, reminders, and status history.';
      elements.followupForm.classList.add('hidden');
    }
    showToast('Lead deleted.');
    await loadDashboard();
  } catch (error) {
    showToast(error.message, true);
  }
};

window.deleteFollowUp = async function deleteFollowUp(followUpId) {
  if (!window.confirm('Delete this follow-up entry?')) {
    return;
  }

  try {
    await apiFetch(`/api/followups/${followUpId}`, { method: 'DELETE' });
    showToast('Follow-up deleted.');
    await Promise.all([loadLeadDetail(state.selectedLeadId), loadDashboard()]);
  } catch (error) {
    showToast(error.message, true);
  }
};

async function handleExport() {
  try {
    const response = await fetch('/api/dashboard/export', {
      headers: {
        Authorization: `Bearer ${state.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Unable to export leads.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'leads_export.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported.');
  } catch (error) {
    showToast(error.message, true);
  }
}

const reloadDashboard = () =>
  loadDashboard().catch((error) => showToast(error.message, true));

elements.toggleAuthMode.addEventListener('click', () => {
  setAuthMode(!state.isRegisterMode);
});
elements.authForm.addEventListener('submit', handleAuthSubmit);
elements.logoutBtn.addEventListener('click', () => {
  clearSession();
  showToast('Logged out.');
});
elements.leadForm.addEventListener('submit', handleLeadSubmit);
elements.resetLeadForm.addEventListener('click', resetLeadForm);
elements.followupForm.addEventListener('submit', handleFollowUpSubmit);
elements.searchInput.addEventListener('input', reloadDashboard);
elements.statusFilter.addEventListener('change', reloadDashboard);
elements.exportBtn.addEventListener('click', handleExport);

setAuthMode(false);
updateAuthView();
resetLeadForm();

if (state.token && state.user) {
  loadDashboard().catch((error) => {
    clearSession();
    showToast(error.message, true);
  });
}
