/* ==========================================================================
   IPTI ADMIN PORTAL — CLIENT LOGIC & CRM ENGINE
   Handles Authentication, Stats, Lead Filtering, Live Updates & CSV Export
   ========================================================================== */

let currentToken = localStorage.getItem('ipti_admin_token') || '';
let currentEnquiryId = null;
let allEnquiriesCache = [];
let allProgramsCache = [];
let allCertificatesCache = [];

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initDashboardControls();
  initViewTabs();
  initProgramManagement();
  initCertificateManagement();
});

/* --------------------------------------------------------------------------
   01. AUTHENTICATION & SESSION MANAGEMENT
   -------------------------------------------------------------------------- */
function initAuth() {
  const loginOverlay = document.getElementById('loginOverlay');
  const adminApp = document.getElementById('adminApp');
  const loginForm = document.getElementById('adminLoginForm');
  const fillDemoBtn = document.getElementById('fillDemoCredsBtn');
  const togglePassBtn = document.getElementById('togglePasswordBtn');
  const passwordInput = document.getElementById('adminPassword');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  // Check existing session
  if (currentToken) {
    verifySession();
  } else {
    showLogin();
  }

  // Toggle password visibility
  if (togglePassBtn && passwordInput) {
    togglePassBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      const icon = document.getElementById('passwordEyeIcon');
      if (icon) {
        icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
      }
    });
  }

  // Auto fill credentials for demonstration convenience
  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', () => {
      document.getElementById('adminUsername').value = 'admin';
      document.getElementById('adminPassword').value = 'ipti@admin2026';
    });
  }

  // Login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('adminUsername').value.trim();
      const password = document.getElementById('adminPassword').value;
      const submitBtn = document.getElementById('loginBtn');
      const originalText = submitBtn.innerHTML;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success && data.token) {
          currentToken = data.token;
          localStorage.setItem('ipti_admin_token', data.token);
          if (data.user && data.user.username) {
            localStorage.setItem('ipti_admin_user', data.user.username);
            document.getElementById('currentAdminName').innerText = data.user.username;
          }
          showApp();
          loadDashboardData();
        } else {
          alert('Authentication Failed: ' + (data.error || 'Invalid credentials'));
        }
      } catch (err) {
        console.error('Login error:', err);
        // Fallback for standalone preview if server isn't on same port
        if (username === 'admin' && password === 'ipti@admin2026') {
          currentToken = 'demo_token';
          localStorage.setItem('ipti_admin_token', 'demo_token');
          showApp();
          loadDashboardData();
        } else {
          alert('Could not connect to auth server: ' + err.message);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out of the IPTI Admin Portal?')) {
        localStorage.removeItem('ipti_admin_token');
        localStorage.removeItem('ipti_admin_user');
        currentToken = '';
        showLogin();
      }
    });
  }
}

async function verifySession() {
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken })
    });
    const data = await res.json();
    if (data.success && data.valid) {
      showApp();
      loadDashboardData();
    } else {
      showLogin();
    }
  } catch (e) {
    // If backend isn't responding or offline, accept stored token
    showApp();
    loadDashboardData();
  }
}

function showLogin() {
  document.getElementById('loginOverlay').classList.remove('hidden');
  document.getElementById('adminApp').classList.add('hidden');
}

function showApp() {
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  const storedUser = localStorage.getItem('ipti_admin_user') || 'Administrator';
  document.getElementById('currentAdminName').innerText = storedUser;
}

/* --------------------------------------------------------------------------
   02. DASHBOARD DATA LOADING & STATS
   -------------------------------------------------------------------------- */
async function loadDashboardData() {
  await Promise.all([
    fetchStats(),
    fetchEnquiries(),
    fetchPrograms(),
    fetchProgramAnalytics(),
    fetchCertificates(),
    fetchCertificateStats()
  ]);
}

async function fetchStats() {
  try {
    const res = await fetch('/api/enquiries/stats', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (!res.ok) return;
    const data = await res.json();

    if (data.success && data.stats) {
      const s = data.stats;
      const statTotalEl = document.getElementById('statTotal');
      const statTodayEl = document.getElementById('statToday');
      const statProgramsEl = document.getElementById('statPrograms');
      const statInterestedEl = document.getElementById('statInterested');
      const statNotInterestedEl = document.getElementById('statNotInterested');

      if (statTotalEl) statTotalEl.innerText = s.total || 0;
      if (statTodayEl) statTodayEl.innerText = s.today || 0;
      if (statProgramsEl) statProgramsEl.innerText = Object.keys(s.coursesBreakdown || {}).length || 6;
      if (statInterestedEl) statInterestedEl.innerText = s.interested || 0;
      if (statNotInterestedEl) statNotInterestedEl.innerText = s.notInterested || 0;

      // Update lead status tab count badges in Enquiries CRM
      const tabCountAll = document.getElementById('tabCountAll');
      const tabCountInterested = document.getElementById('tabCountInterested');
      const tabCountNotInterested = document.getElementById('tabCountNotInterested');
      const tabCountPending = document.getElementById('tabCountPending');
      const navInterestedPill = document.getElementById('navInterestedPill');

      if (tabCountAll) tabCountAll.innerText = s.total || 0;
      if (tabCountInterested) tabCountInterested.innerText = s.interested || 0;
      if (tabCountNotInterested) tabCountNotInterested.innerText = s.notInterested || 0;
      if (tabCountPending) tabCountPending.innerText = s.pending || 0;
      if (navInterestedPill) navInterestedPill.innerText = s.interested || 0;
    }
  } catch (err) {
    console.warn('Could not fetch stats from backend:', err);
  }
}

async function fetchEnquiries() {
  const tableBody = document.getElementById('enquiriesTableBody');
  const search = document.getElementById('searchInput').value.trim();
  const course = document.getElementById('courseFilter').value;
  const interest = document.getElementById('interestFilter') ? document.getElementById('interestFilter').value : 'All';

  try {
    let url = `/api/enquiries?course=${encodeURIComponent(course)}`;
    if (interest && interest !== 'All') url += `&interest=${encodeURIComponent(interest)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allEnquiriesCache = data.data;
      renderTable(data.data);
    } else {
      renderEmptyTable('No enquiry records found matching your filters.');
    }
  } catch (err) {
    console.error('Error fetching enquiries:', err);
    renderEmptyTable(`Could not load records: ${err.message}. Click Refresh to try again.`);
  }
}

/* --------------------------------------------------------------------------
   03. RENDER TABLE & DATA ROWS
   -------------------------------------------------------------------------- */
function renderTable(list) {
  const tableBody = document.getElementById('enquiriesTableBody');
  if (!list || list.length === 0) {
    renderEmptyTable('No enquiries registered yet.');
    return;
  }

  tableBody.innerHTML = list.map(item => {
    const dateFormatted = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(item.fullName)},%20Greetings%20from%20IPTI%20(Institute%20of%20Professional%20Training%20%26%20Innovation).%20We%20received%20your%20enquiry%20regarding%20${encodeURIComponent(item.course)}%20(Ref:%20${encodeURIComponent(item.trackingId)}).`;

    const interest = item.interest || 'Pending';
    const interestClass = interest.toLowerCase().replace(/\s+/g, '-');

    return `
      <tr data-id="${item.id}">
        <td>
          <div class="candidate-cell">
            <span class="candidate-name">${escapeHtml(item.fullName)}</span>
            <div class="candidate-contact">
              <span><i class="fa-solid fa-envelope"></i> ${escapeHtml(item.email)}</span>
              <span>•</span>
              <span><i class="fa-solid fa-phone"></i> ${escapeHtml(item.phone)}</span>
            </div>
          </div>
        </td>

        <td class="course-cell">
          <span class="course-name">${escapeHtml(item.course || 'General Training')}</span>
          <span class="course-mode"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.learningMode || 'Classroom')}</span>
        </td>

        <td>
          <select class="interest-pill-select ${interestClass}" onchange="updateLeadInterest('${item.id}', this.value, event)" title="Change candidate lead status">
            <option value="Interested" ${interest === 'Interested' ? 'selected' : ''}>⭐ Interested</option>
            <option value="Not Interested" ${interest === 'Not Interested' ? 'selected' : ''}>❌ Not Interested</option>
            <option value="Pending" ${interest === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
          </select>
        </td>

        <td>
          <span class="tracking-cell">${escapeHtml(item.trackingId)}</span>
          <span class="tracking-date">${dateFormatted}</span>
        </td>

        <td>
          <div class="table-actions">
            <a href="${waUrl}" target="_blank" class="action-icon-btn whatsapp" title="Chat on WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
            <a href="tel:${cleanPhone}" class="action-icon-btn call" title="Call Candidate">
              <i class="fa-solid fa-phone"></i>
            </a>
            <a href="mailto:${encodeURIComponent(item.email)}" class="action-icon-btn" title="Send Email">
              <i class="fa-solid fa-envelope"></i>
            </a>
          </div>
        </td>

        <td>
          <div class="table-actions">
            <button class="action-icon-btn" onclick="openDetailModal('${item.id}')" title="View Full Dossier & Notes">
              <i class="fa-solid fa-file-pen"></i>
            </button>
            <button class="action-icon-btn delete" onclick="deleteEnquiry('${item.id}', '${escapeHtml(item.fullName)}')" title="Delete Record">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.updateLeadInterest = async function(id, newInterest, event) {
  try {
    const res = await fetch(`/api/enquiries/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ interest: newInterest })
    });

    const data = await res.json();
    if (data.success) {
      const item = allEnquiriesCache.find(e => e.id === id);
      if (item) item.interest = newInterest;

      if (event && event.target) {
        event.target.className = `interest-pill-select ${newInterest.toLowerCase().replace(/\s+/g, '-')}`;
      }

      // Re-fetch stats immediately to update KPI numbers and lead tab badges live
      fetchStats();
    } else {
      alert('Could not update interest status: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    alert('Network error updating interest: ' + err.message);
  }
};

function renderEmptyTable(message) {
  const tableBody = document.getElementById('enquiriesTableBody');
  tableBody.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="empty-state">
          <i class="fa-solid fa-inbox"></i>
          <p>${message}</p>
        </div>
      </td>
    </tr>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* --------------------------------------------------------------------------
   04. CONTROLS TOOLBAR & EXPORT
   -------------------------------------------------------------------------- */
function initDashboardControls() {
  const searchInput = document.getElementById('searchInput');
  const courseFilter = document.getElementById('courseFilter');
  const interestFilter = document.getElementById('interestFilter');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchEnquiries, 300);
    });
  }

  if (courseFilter) courseFilter.addEventListener('change', fetchEnquiries);

  // Lead Interest Status Filter Tabs
  const leadTabs = document.querySelectorAll('#leadStatusTabs .lead-tab-btn');
  leadTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      leadTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.interest || 'All';
      if (interestFilter) {
        interestFilter.value = val;
      }
      fetchEnquiries();
    });
  });

  if (interestFilter) {
    interestFilter.addEventListener('change', () => {
      const targetVal = interestFilter.value || 'All';
      const matchingTab = document.querySelector(`#leadStatusTabs .lead-tab-btn[data-interest="${targetVal}"]`);
      if (matchingTab) {
        leadTabs.forEach(b => b.classList.remove('active'));
        matchingTab.classList.add('active');
      }
      fetchEnquiries();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Loading...';
      loadDashboardData().finally(() => {
        refreshBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> <span>Refresh</span>';
      });
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      // Trigger CSV download with token parameter
      const downloadUrl = `/api/enquiries/export/csv?token=${encodeURIComponent(currentToken)}`;
      window.open(downloadUrl, '_blank');
    });
  }

  initDetailModalHandlers();
}

/* --------------------------------------------------------------------------
   05. ENQUIRY DOSSIER & NOTES MODAL
   -------------------------------------------------------------------------- */
function initDetailModalHandlers() {
  const modal = document.getElementById('detailModal');
  const closeBtn = document.getElementById('closeDetailModalBtn');
  const closeBottomBtn = document.getElementById('closeModalBottomBtn');
  const addNoteForm = document.getElementById('addNoteForm');
  const deleteBtn = document.getElementById('deleteEnquiryFromModalBtn');

  function closeModal() {
    modal.classList.remove('open');
    currentEnquiryId = null;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Add internal note
  if (addNoteForm) {
    addNoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('newNoteInput');
      const noteText = input.value.trim();
      if (!noteText || !currentEnquiryId) return;

      try {
        const res = await fetch(`/api/enquiries/${currentEnquiryId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ newNote: noteText })
        });

        const data = await res.json();
        if (data.success && data.data) {
          input.value = '';
          renderNotes(data.data.notes || []);
        } else {
          alert('Could not add note: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error adding note: ' + err.message);
      }
    });
  }

  // Delete lead from modal
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!currentEnquiryId) return;
      const candidateName = document.getElementById('modalCandidateName').innerText;
      deleteEnquiry(currentEnquiryId, candidateName, () => {
        closeModal();
      });
    });
  }
}

window.openDetailModal = function(id) {
  const item = allEnquiriesCache.find(x => x.id === id);
  if (!item) return;

  currentEnquiryId = id;
  const modal = document.getElementById('detailModal');

  document.getElementById('modalCandidateName').innerText = item.fullName;
  document.getElementById('modalTrackingId').innerText = item.trackingId;
  document.getElementById('modalEmail').innerText = item.email;
  document.getElementById('modalPhone').innerText = item.phone + (item.whatsapp ? ` (WA: ${item.whatsapp})` : '');
  document.getElementById('modalCourse').innerText = item.course || 'N/A';
  document.getElementById('modalMode').innerText = item.learningMode || 'Classroom';
  document.getElementById('modalExperience').innerText = item.experience || 'Not specified';
  document.getElementById('modalSource').innerText = item.source || 'Website Form';
  document.getElementById('modalMessage').innerText = item.message || 'No specific requirements submitted.';

  const modalInterestSelect = document.getElementById('modalInterestSelect');
  if (modalInterestSelect) {
    modalInterestSelect.value = item.interest || 'Pending';
  }

  const updateInterestBtn = document.getElementById('updateModalInterestBtn');
  if (updateInterestBtn) {
    updateInterestBtn.onclick = async () => {
      if (!currentEnquiryId || !modalInterestSelect) return;
      const newInterest = modalInterestSelect.value;
      await updateLeadInterest(currentEnquiryId, newInterest);
      alert(`Candidate interest status updated to "${newInterest}".`);
      fetchEnquiries();
    };
  }

  renderNotes(item.notes || []);

  modal.classList.add('open');
};

function renderNotes(notes) {
  const container = document.getElementById('notesContainer');
  if (!notes || notes.length === 0) {
    container.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-dim); font-style: italic;">No activity or counselor notes recorded yet.</p>';
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="note-bubble">
      <div>${escapeHtml(n.note)}</div>
      <div class="note-meta">
        <span>By: <strong>${escapeHtml(n.author || 'Admin')}</strong></span>
        <span>${new Date(n.timestamp).toLocaleString('en-IN')}</span>
      </div>
    </div>
  `).join('');
}

window.deleteEnquiry = async function(id, name, onSuccess) {
  if (!confirm(`Are you sure you want to permanently delete the lead record for "${name}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/enquiries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    const data = await res.json();
    if (data.success) {
      alert(`Lead record for "${name}" deleted.`);
      fetchStats();
      fetchEnquiries();
      if (typeof onSuccess === 'function') onSuccess();
    } else {
      alert('Delete failed: ' + (data.error || 'Server error'));
    }
  } catch (err) {
    alert('Error deleting enquiry: ' + err.message);
  }
};


/* ==========================================================================
   06. TABS NAVIGATION & PROGRAM MANAGEMENT ENGINE
   ========================================================================== */

function initViewTabs() {
  const tabEnquiries = document.getElementById('tabNavEnquiries');
  const tabPrograms = document.getElementById('tabNavPrograms');
  const tabCertificates = document.getElementById('tabNavCertificates');
  const viewEnquiries = document.getElementById('viewEnquiries');
  const viewPrograms = document.getElementById('viewPrograms');
  const viewCertificates = document.getElementById('viewCertificates');
  const statCardPrograms = document.getElementById('statCardPrograms');

  if (!tabEnquiries || !tabPrograms) return;

  function showEnquiriesView() {
    tabEnquiries.classList.add('active');
    tabPrograms.classList.remove('active');
    if (tabCertificates) tabCertificates.classList.remove('active');

    viewEnquiries.classList.remove('hidden');
    viewPrograms.classList.add('hidden');
    if (viewCertificates) viewCertificates.classList.add('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showProgramsView(scrollToAnalytics = true) {
    tabPrograms.classList.add('active');
    tabEnquiries.classList.remove('active');
    if (tabCertificates) tabCertificates.classList.remove('active');

    viewPrograms.classList.remove('hidden');
    viewEnquiries.classList.add('hidden');
    if (viewCertificates) viewCertificates.classList.add('hidden');
    
    // Refresh latest programs & analytics
    fetchPrograms();
    fetchProgramAnalytics();

    // Smooth scroll directly to the Analytics section
    setTimeout(() => {
      const analyticsSection = document.getElementById('programAnalyticsSection') || viewPrograms;
      if (analyticsSection && scrollToAnalytics) {
        analyticsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  }

  function showCertificatesView() {
    if (tabCertificates) tabCertificates.classList.add('active');
    tabEnquiries.classList.remove('active');
    tabPrograms.classList.remove('active');

    if (viewCertificates) viewCertificates.classList.remove('hidden');
    viewEnquiries.classList.add('hidden');
    viewPrograms.classList.add('hidden');

    fetchCertificates();
    fetchCertificateStats();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabEnquiries.addEventListener('click', showEnquiriesView);
  tabPrograms.addEventListener('click', () => showProgramsView(true));
  if (tabCertificates) tabCertificates.addEventListener('click', showCertificatesView);

  if (statCardPrograms) {
    statCardPrograms.addEventListener('click', () => showProgramsView(true));
  }

  // Support direct hash routing
  if (window.location.hash === '#programs' || window.location.hash === '#analytics') {
    showProgramsView(true);
  } else if (window.location.hash === '#certificates' || window.location.hash === '#certifications') {
    showCertificatesView();
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#programs' || window.location.hash === '#analytics') {
      showProgramsView(true);
    } else if (window.location.hash === '#certificates' || window.location.hash === '#certifications') {
      showCertificatesView();
    } else if (window.location.hash === '#enquiries') {
      showEnquiriesView();
    }
  });
}

/* --------------------------------------------------------------------------
   07. FETCH & RENDER PROGRAMS (ADMIN DESK)
   -------------------------------------------------------------------------- */
async function fetchPrograms() {
  const grid = document.getElementById('adminProgramsGrid');
  const badge = document.getElementById('activeProgramsCountBadge');
  const statPrograms = document.getElementById('statPrograms');

  try {
    const res = await fetch('/api/programs?all=true');
    const data = await res.json();

    if (data.success && Array.isArray(data.data)) {
      allProgramsCache = data.data;
      if (badge) badge.innerText = `${data.data.length} Active Courses`;
      if (statPrograms) statPrograms.innerText = data.data.length;
      renderAdminPrograms(data.data);
    } else {
      if (grid) grid.innerHTML = '<p style="color: var(--text-muted);">No programs configured.</p>';
    }
  } catch (err) {
    console.error('Error fetching programs:', err);
    if (grid) grid.innerHTML = `<p style="color: #dc2626;">Error loading programs: ${err.message}</p>`;
  }
}

function renderAdminPrograms(programs) {
  const grid = document.getElementById('adminProgramsGrid');
  if (!grid) return;

  if (programs.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-muted);"><p>No training programs found. Click "Add New Training Program" above to create one.</p></div>';
    return;
  }

  grid.innerHTML = programs.map(p => {
    const tags = Array.isArray(p.techTags) ? p.techTags : [];
    return `
      <div class="admin-program-card" data-id="${p.id}">
        <div class="admin-program-card-header">
          <span class="admin-prog-badge">
            <i class="fa-solid ${p.icon || 'fa-graduation-cap'}"></i>
            ${escapeHtml(p.badge || 'Specialized Track')}
          </span>
          <div class="admin-prog-actions">
            <button class="action-icon-btn" onclick="editProgram('${p.id}')" title="Edit Course Details">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-icon-btn delete" onclick="deleteProgram('${p.id}', '${escapeHtml(p.title)}')" title="Delete Course">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>

        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description)}</p>

        <div class="admin-prog-specs">
          <div>Duration: <strong>${escapeHtml(p.duration || '3-4 Months')}</strong></div>
          <div>Lab: <strong>${escapeHtml(p.labHours || '100+ Hrs')}</strong></div>
          <div>Mode: <strong>${escapeHtml(p.mode || 'Classroom')}</strong></div>
          <div>Standard: <strong>${escapeHtml(p.credentials || 'Certified')}</strong></div>
        </div>

        <div class="admin-prog-tags">
          ${tags.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   08. PROGRAM LEAD DEMAND ANALYTICS ENGINE
   -------------------------------------------------------------------------- */
async function fetchProgramAnalytics() {
  const container = document.getElementById('programAnalyticsList');
  const summaryTag = document.getElementById('analyticsSummaryTag');

  try {
    const headers = {};
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    const res = await fetch('/api/programs/analytics', { headers });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.analytics) {
        const a = data.analytics;
        if (summaryTag && a.topProgram && a.topProgram.count > 0) {
          summaryTag.innerText = `Top Demand: ${a.topProgram.title} (${a.topProgram.count} enquiries)`;
        } else if (summaryTag) {
          summaryTag.innerText = `${a.totalPrograms || 6} Courses Tracked`;
        }

        renderProgramAnalytics(a.programsBreakdown || [], a.totalEnquiries || 0);
        return;
      }
    }
  } catch (err) {
    console.warn('Analytics fetch error, falling back to client computation:', err);
  }

  // Client-side fallback calculation from memory cache
  computeLocalAnalytics();
}

function computeLocalAnalytics() {
  const container = document.getElementById('programAnalyticsList');
  const summaryTag = document.getElementById('analyticsSummaryTag');
  if (!container) return;

  const programs = allProgramsCache && allProgramsCache.length > 0 ? allProgramsCache : [
    { title: "Industrial Automation & Robotics (PLC/SCADA)", category: "automation" },
    { title: "Embedded Systems & IoT Engineering", category: "embedded" },
    { title: "CAD/CAM & Mechanical Product Design", category: "mechanical" },
    { title: "Full-Stack Software Engineering", category: "software" },
    { title: "AI, Machine Learning & Vision Systems", category: "software" },
    { title: "Electric Vehicle (EV) Systems & BMS", category: "mechanical" }
  ];

  const enquiries = Array.isArray(allEnquiriesCache) ? allEnquiriesCache : [];
  const total = enquiries.length;

  const breakdown = programs.map(p => {
    const pTitle = (p.title || '').toLowerCase();
    const matching = enquiries.filter(e => {
      const c = (e.course || '').toLowerCase();
      return c.includes(pTitle) || pTitle.includes(c) ||
             (pTitle.includes('automation') && c.includes('automation')) ||
             (pTitle.includes('embedded') && c.includes('embedded')) ||
             (pTitle.includes('cad') && (c.includes('cad') || c.includes('mechanical'))) ||
             (pTitle.includes('full-stack') && (c.includes('full-stack') || c.includes('software'))) ||
             (pTitle.includes('ai') && (c.includes('ai') || c.includes('machine learning'))) ||
             (pTitle.includes('electric vehicle') && (c.includes('electric') || c.includes('ev')));
    });

    const count = matching.length;
    const share = total > 0 ? Math.round((count / total) * 100) : 0;
    const modes = {
      classroom: matching.filter(e => (e.learningMode || '').toLowerCase().includes('classroom')).length,
      online: matching.filter(e => (e.learningMode || '').toLowerCase().includes('online')).length,
      hybrid: matching.filter(e => (e.learningMode || '').toLowerCase().includes('hybrid') || (e.learningMode || '').toLowerCase().includes('weekend')).length
    };

    return {
      title: p.title,
      category: p.category,
      enquiriesCount: count,
      sharePercentage: share,
      modes
    };
  });

  breakdown.sort((a, b) => b.enquiriesCount - a.enquiriesCount);

  if (summaryTag && breakdown[0] && breakdown[0].enquiriesCount > 0) {
    summaryTag.innerText = `Top Demand: ${breakdown[0].title} (${breakdown[0].enquiriesCount} leads)`;
  } else if (summaryTag) {
    summaryTag.innerText = `${programs.length} Courses Tracked`;
  }

  renderProgramAnalytics(breakdown, total);
}

function renderProgramAnalytics(breakdown, total) {
  const container = document.getElementById('programAnalyticsList');
  if (!container) return;

  if (breakdown.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">No leads recorded yet for analytics.</p>';
    return;
  }

  container.innerHTML = breakdown.map(item => {
    const percent = item.sharePercentage || 0;
    const count = item.enquiriesCount || 0;
    const m = item.modes || { classroom: 0, online: 0, hybrid: 0 };

    return `
      <div class="analytics-prog-row">
        <div class="analytics-prog-header">
          <span>${escapeHtml(item.title)}</span>
          <span style="font-family: var(--font-mono); font-size: 0.88rem; color: var(--primary);">
            ${count} leads (${percent}%)
          </span>
        </div>

        <div class="analytics-prog-bar-track">
          <div class="analytics-prog-bar-fill" style="width: ${Math.max(percent, count > 0 ? 8 : 0)}%;"></div>
        </div>

        <div class="prog-modes-badge-row">
          <span style="text-transform: capitalize; font-weight: 600; color: var(--text-dim);">
            Track: ${escapeHtml(item.category)}
          </span>
          <div style="display: flex; gap: 6px;">
            <span class="prog-mode-pill">Classroom: ${m.classroom}</span>
            <span class="prog-mode-pill">Online: ${m.online}</span>
            <span class="prog-mode-pill">Hybrid: ${m.hybrid}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   09. PROGRAM MODAL & CRUD LOGIC
   -------------------------------------------------------------------------- */
function initProgramManagement() {
  const openAddBtn = document.getElementById('openAddProgramBtn');
  const modal = document.getElementById('programModal');
  const closeBtn = document.getElementById('closeProgramModalBtn');
  const cancelBtn = document.getElementById('cancelProgramModalBtn');
  const form = document.getElementById('programForm');

  function openModal(isEdit = false) {
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (!isEdit && form) {
        form.reset();
        document.getElementById('progFormId').value = '';
        document.getElementById('programModalHeading').innerText = 'Add New Training Program';
      }
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openAddBtn) openAddBtn.addEventListener('click', () => openModal(false));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('saveProgramSubmitBtn');
      const origText = submitBtn.innerHTML;

      const progId = document.getElementById('progFormId').value;
      const isEdit = Boolean(progId);

      const payload = {
        title: document.getElementById('progFormTitle').value.trim(),
        category: document.getElementById('progFormCategory').value,
        badge: document.getElementById('progFormBadge').value.trim() || 'Core Track',
        duration: document.getElementById('progFormDuration').value.trim() || '4 Months',
        labHours: document.getElementById('progFormLabHours').value.trim() || '120+ Hrs Lab',
        mode: document.getElementById('progFormMode').value.trim() || 'Classroom / Hybrid',
        credentials: document.getElementById('progFormCredentials').value.trim() || 'ISO Certification',
        description: document.getElementById('progFormDesc').value.trim(),
        techTags: document.getElementById('progFormTags').value.trim()
      };

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving to site...';

        const endpoint = isEdit ? `/api/programs/${progId}` : '/api/programs';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
          alert(`🎉 Program "${payload.title}" has been ${isEdit ? 'updated' : 'added'} successfully and is now LIVE on the website!`);
          closeModal();
          fetchPrograms();
          fetchProgramAnalytics();
        } else {
          alert('Error: ' + (data.error || 'Failed to save program'));
        }
      } catch (err) {
        alert('Server error saving program: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  window.editProgram = function(id) {
    const item = allProgramsCache.find(p => p.id === id);
    if (!item) return;

    document.getElementById('progFormId').value = item.id;
    document.getElementById('programModalHeading').innerText = 'Edit Training Program';
    document.getElementById('progFormTitle').value = item.title || '';
    document.getElementById('progFormCategory').value = (item.category || 'automation').toLowerCase();
    document.getElementById('progFormBadge').value = item.badge || '';
    document.getElementById('progFormDuration').value = item.duration || '';
    document.getElementById('progFormLabHours').value = item.labHours || '';
    document.getElementById('progFormMode').value = item.mode || '';
    document.getElementById('progFormCredentials').value = item.credentials || '';
    document.getElementById('progFormDesc').value = item.description || '';
    document.getElementById('progFormTags').value = Array.isArray(item.techTags) ? item.techTags.join(', ') : '';

    openModal(true);
  };

  window.deleteProgram = async function(id, title) {
    if (!confirm(`Are you sure you want to remove "${title}"? It will no longer appear on the website.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      const data = await res.json();
      if (data.success) {
        alert(`Program "${title}" removed successfully.`);
        fetchPrograms();
        fetchProgramAnalytics();
      } else {
        alert('Could not delete program: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };
}

/* ==========================================================================
   10. STUDENT CERTIFICATES & CREDENTIAL LEDGER ENGINE
   ========================================================================== */
async function fetchCertificates() {
  const tableBody = document.getElementById('certificatesTableBody');
  const search = document.getElementById('certSearchInput') ? document.getElementById('certSearchInput').value.trim() : '';
  const program = document.getElementById('certProgramFilter') ? document.getElementById('certProgramFilter').value : 'All';

  try {
    let url = `/api/certificates?program=${encodeURIComponent(program)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      allCertificatesCache = data.data;
      renderCertificatesTable(data.data);
    } else {
      renderEmptyCertTable('No student certificates found matching your criteria.');
    }
  } catch (err) {
    console.error('Error fetching certificates:', err);
    renderEmptyCertTable(`Could not load certificates: ${err.message}.`);
  }
}

async function fetchCertificateStats() {
  try {
    const res = await fetch('/api/certificates/stats', {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && data.stats) {
      const s = data.stats;
      const elTotal = document.getElementById('statCertTotal');
      const elVerified = document.getElementById('statCertVerified');
      const navCertificatesPill = document.getElementById('navCertificatesPill');
      if (elTotal) elTotal.innerText = s.total || 0;
      if (elVerified) elVerified.innerText = `${s.verified || 0} Active`;
      if (navCertificatesPill) navCertificatesPill.innerText = s.total || 0;
    }
  } catch (err) {
    console.warn('Could not fetch certificate stats:', err);
  }
}

function renderCertificatesTable(list) {
  const tableBody = document.getElementById('certificatesTableBody');
  if (!tableBody) return;

  if (!list || list.length === 0) {
    renderEmptyCertTable('No certificates issued yet. Click "+ Issue New Certificate" above.');
    return;
  }

  tableBody.innerHTML = list.map(cert => {
    const dateFormatted = new Date(cert.issueDate || cert.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    return `
      <tr data-id="${cert.id}">
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-family: var(--font-mono); font-weight: 750; color: var(--primary); font-size: 0.88rem;">${escapeHtml(cert.certId)}</span>
            <span style="font-size: 0.72rem; color: var(--text-dim);"><i class="fa-solid fa-stamp" style="color: var(--accent-gold);"></i> ISO Accredited</span>
          </div>
        </td>

        <td>
          <div class="candidate-cell">
            <span class="candidate-name">${escapeHtml(cert.studentName)}</span>
            <div class="candidate-contact">
              <span><i class="fa-solid fa-envelope"></i> ${escapeHtml(cert.studentEmail || 'No email')}</span>
              <span>•</span>
              <span><i class="fa-solid fa-phone"></i> ${escapeHtml(cert.studentPhone || 'No phone')}</span>
            </div>
          </div>
        </td>

        <td class="course-cell">
          <span class="course-name">${escapeHtml(cert.program)}</span>
          <span class="course-mode"><i class="fa-solid fa-award"></i> ${escapeHtml(cert.standard || 'ISO 9001:2015')}</span>
        </td>

        <td>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 700; color: var(--text-main); font-size: 0.88rem;">${escapeHtml(cert.grade || 'Certified')}</span>
            <span style="font-size: 0.74rem; color: var(--text-muted);">${dateFormatted}</span>
          </div>
        </td>

        <td>
          <span style="display: inline-flex; align-items: center; gap: 5px; background: #ecfdf5; color: #059669; font-size: 0.74rem; font-weight: 750; padding: 3px 10px; border-radius: var(--radius-full); border: 1px solid #a7f3d0;">
            <i class="fa-solid fa-circle-check"></i> Verified
          </span>
        </td>

        <td>
          <div class="table-actions">
            <button class="action-icon-btn" onclick="previewCertificate('${cert.id}')" title="Preview Digital Certificate">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="action-icon-btn" onclick="editCertificate('${cert.id}')" title="Edit Certificate">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-icon-btn delete" onclick="deleteCertificate('${cert.id}', '${escapeHtml(cert.studentName)}')" title="Revoke Certificate">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderEmptyCertTable(msg) {
  const tableBody = document.getElementById('certificatesTableBody');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fa-solid fa-award"></i>
            <p>${escapeHtml(msg)}</p>
          </div>
        </td>
      </tr>
    `;
  }
}

function initCertificateManagement() {
  const openAddBtn = document.getElementById('openAddCertBtn');
  const modal = document.getElementById('certModal');
  const closeBtn = document.getElementById('closeCertModalBtn');
  const cancelBtn = document.getElementById('cancelCertModalBtn');
  const form = document.getElementById('certForm');

  const previewModal = document.getElementById('certPreviewModal');
  const closePreviewBtn = document.getElementById('closeCertPreviewBtn');
  const printBtn = document.getElementById('printCertBtn');

  const certSearchInput = document.getElementById('certSearchInput');
  const certProgramFilter = document.getElementById('certProgramFilter');
  const refreshCertBtn = document.getElementById('refreshCertBtn');

  if (certSearchInput) certSearchInput.addEventListener('input', fetchCertificates);
  if (certProgramFilter) certProgramFilter.addEventListener('change', fetchCertificates);
  if (refreshCertBtn) refreshCertBtn.addEventListener('click', () => { fetchCertificates(); fetchCertificateStats(); });

  function openModal(isEdit = false) {
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (!isEdit && form) {
        form.reset();
        document.getElementById('certFormInternalId').value = '';
        document.getElementById('certModalHeading').innerText = 'Issue New Student Certificate';
        document.getElementById('certFormDate').value = new Date().toISOString().slice(0, 10);
      }
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openAddBtn) openAddBtn.addEventListener('click', () => openModal(false));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Handle Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('saveCertSubmitBtn');
      const origText = submitBtn.innerHTML;

      const certInternalId = document.getElementById('certFormInternalId').value;
      const isEdit = Boolean(certInternalId);

      const payload = {
        studentName: document.getElementById('certFormName').value.trim(),
        studentEmail: document.getElementById('certFormEmail').value.trim(),
        studentPhone: document.getElementById('certFormPhone').value.trim(),
        program: document.getElementById('certFormProgram').value,
        issueDate: document.getElementById('certFormDate').value,
        grade: document.getElementById('certFormGrade').value.trim(),
        certId: document.getElementById('certFormCustomId').value.trim(),
        notes: document.getElementById('certFormNotes').value.trim()
      };

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const endpoint = isEdit ? `/api/certificates/${certInternalId}` : '/api/certificates';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          alert(`🎓 Certificate for "${payload.studentName}" ${isEdit ? 'updated' : 'issued'} successfully!`);
          closeModal();
          fetchCertificates();
          fetchCertificateStats();
        } else {
          alert('Error: ' + (data.error || 'Failed to save certificate'));
        }
      } catch (err) {
        alert('Server error saving certificate: ' + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // Preview & Print
  if (closePreviewBtn && previewModal) {
    closePreviewBtn.addEventListener('click', () => {
      previewModal.classList.remove('open');
      document.body.style.overflow = '';
    });
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        previewModal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  window.previewCertificate = function(id) {
    const cert = allCertificatesCache.find(c => c.id === id);
    if (!cert || !previewModal) return;

    document.getElementById('prevStudentName').innerText = cert.studentName;
    document.getElementById('prevProgramName').innerText = cert.program;
    document.getElementById('prevGradeBadge').innerText = `Awarded with ${cert.grade || 'Distinction'}`;
    document.getElementById('prevCertId').innerText = cert.certId;
    document.getElementById('prevIssueDate').innerText = new Date(cert.issueDate || cert.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    previewModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.editCertificate = function(id) {
    const cert = allCertificatesCache.find(c => c.id === id);
    if (!cert) return;

    document.getElementById('certFormInternalId').value = cert.id;
    document.getElementById('certModalHeading').innerText = 'Edit Student Certificate';
    document.getElementById('certFormName').value = cert.studentName || '';
    document.getElementById('certFormEmail').value = cert.studentEmail || '';
    document.getElementById('certFormPhone').value = cert.studentPhone || '';
    document.getElementById('certFormProgram').value = cert.program || '';
    document.getElementById('certFormDate').value = (cert.issueDate || '').slice(0, 10);
    document.getElementById('certFormGrade').value = cert.grade || '';
    document.getElementById('certFormCustomId').value = cert.certId || '';
    document.getElementById('certFormNotes').value = cert.notes || '';

    openModal(true);
  };

  window.deleteCertificate = async function(id, name) {
    if (!confirm(`Are you sure you want to permanently revoke certificate for "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/certificates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      const data = await res.json();
      if (data.success) {
        alert(`Certificate revoked successfully.`);
        fetchCertificates();
        fetchCertificateStats();
      } else {
        alert('Could not revoke certificate: ' + (data.error || 'Server error'));
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };
}
