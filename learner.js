/* ==========================================================================
   IPTI LEARNER PORTAL ENGINE (STUDENT DESK & FEES LEDGER)
   ========================================================================== */

let currentLearnerToken = localStorage.getItem('ipti_learner_token') || null;
let currentStudentData = null;
let currentCertificateData = null;

// Program curriculum knowledge base for dynamic student view
const programModulesDb = {
  "Industrial Automation": [
    { title: "Siemens TIA Portal & S7-1200 / S7-1500", num: "01", desc: "Hardware configuration, ladder logic (LAD), structured text (SCL), analog scaling, and cyclic interrupts.", tools: ["Siemens TIA V19", "WinCC SCADA", "PROFINET"] },
    { title: "Allen-Bradley Studio 5000 & ControlLogix", num: "02", desc: "Tag-based addressing, producer/consumer network messaging, motion axes, and add-on instructions.", tools: ["RSLogix 5000", "FactoryTalk", "EtherNet/IP"] },
    { title: "SCADA Architecture & Industrial IoT Telemetry", num: "03", desc: "Dynamic screen scripting, real-time trending, alarm logging, SQL database logging, and MQTT IoT brokers.", tools: ["Wonderware InTouch", "Ignition SCADA", "Node-RED"] },
    { title: "VFD Motor Drives & Robotics PLC Interfacing", num: "04", desc: "Drive parameterization, closed-loop speed regulation, safety circuits (SIL-3), and robot cell handshake.", tools: ["ABB ACS880", "Danfoss FC302", "Robotics PLC"] }
  ],
  "Embedded Systems": [
    { title: "Bare-Metal Embedded C & ARM Cortex-M", num: "01", desc: "Memory-mapped I/O, peripheral registers, system tick timer, nested vectored interrupt controller (NVIC).", tools: ["STM32CubeIDE", "ARM GCC", "OpenOCD"] },
    { title: "Real-Time Operating Systems (FreeRTOS)", num: "02", desc: "Task scheduler, preemptive priority, mutexes, semaphores, message queues, and event groups.", tools: ["FreeRTOS Kernel", "CMSIS-RTOS", "Tracealyzer"] },
    { title: "Automotive & Industrial Protocols", num: "03", desc: "CAN 2.0B / CAN-FD packet framing, bit timing, I2C/SPI sensor buses, UART DMA transfers.", tools: ["CANoe / Canalyzer", "Logic Analyzer", "RS-485"] },
    { title: "Hardware Schematic & PCB Design", num: "04", desc: "Component selection, multi-layer board routing, differential pairs, ground planes, and Gerber fabrication.", tools: ["KiCAD 8", "Altium Designer", "SMD Soldering"] }
  ],
  "CAD": [
    { title: "Parametric 3D Solid & Surface Modeling", num: "01", desc: "Constraint-driven sketching, feature trees, complex lofts, sweeps, and Class-A ergonomic surface fillets.", tools: ["SolidWorks 2026", "CATIA V5", "PTC Creo"] },
    { title: "GD&T Standards & ASME Y14.5 Engineering", num: "02", desc: "Datum reference frames, position tolerancing, runout, profile tolerances, and tolerance stack-up analysis.", tools: ["ASME Y14.5M", "Tolerance Stack-up", "2D Drafting"] },
    { title: "Sheet Metal & Plastic Injection Tooling", num: "03", desc: "K-factors, bend allowances, draft analysis, parting lines, core-cavity extraction, and mold tooling.", tools: ["Sheet Metal CAD", "Mold Design", "DFM / DFA"] },
    { title: "Finite Element Analysis (FEA Structural & Thermal)", num: "04", desc: "Meshing strategies, von Mises stress evaluation, safety factor verification, and modal vibration analysis.", tools: ["Ansys Mechanical", "Static Structural", "Thermal FEA"] }
  ],
  "AI": [
    { title: "Deep Learning Foundations & PyTorch Tensors", num: "01", desc: "Computational graphs, autograd engine, custom dataset loaders, transfer learning, and model optimization.", tools: ["Python 3.11", "PyTorch 2.4", "CUDA / cuDNN"] },
    { title: "Industrial Computer Vision & Defect Detection", num: "02", desc: "Spatial filtering, morphological ops, edge detection, contour analysis, and YOLOv10 object detection.", tools: ["OpenCV 4.10", "YOLOv10", "Albumentations"] },
    { title: "Edge AI Deployment on NVIDIA Jetson", num: "03", desc: "FP16 / INT8 quantization, TensorRT acceleration, GStreamer pipelines, and deepstream multi-stream inference.", tools: ["NVIDIA TensorRT", "DeepStream", "Jetson Orin"] },
    { title: "Production Vision Pipelines & Industrial MLOps", num: "04", desc: "Camera calibration, PLC vision triggers over Modbus TCP, Docker containerization, and monitoring.", tools: ["FastAPI", "Docker", "Modbus TCP"] }
  ],
  "Software": [
    { title: "Modern JavaScript & TypeScript Architecture", num: "01", desc: "Async event loops, strict typing, interfaces, generics, functional programming, and clean modular code.", tools: ["TypeScript 5", "ES2024", "Node.js 22"] },
    { title: "React 19 & Component Engineering", num: "02", desc: "Server components, reactive state patterns, custom hooks, virtual DOM optimization, and Tailwind CSS.", tools: ["React 19", "Next.js 15", "Tailwind CSS"] },
    { title: "Microservices, Express & PostgreSQL Relational Modeling", num: "03", desc: "RESTful architecture, Prisma ORM, database indexing, foreign key constraints, and JWT security.", tools: ["Express.js", "PostgreSQL", "Prisma ORM"] },
    { title: "Cloud Deployment, CI/CD & Docker Containers", num: "04", desc: "Containerized environments, GitHub Actions pipelines, AWS ECS, caching layers, and production monitoring.", tools: ["Docker", "AWS / Vercel", "GitHub Actions"] }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  initLearnerAuth();
  initLearnerDashboard();
  initChangePasswordModal();
  initDiplomaModal();
});

/* --------------------------------------------------------------------------
   01. AUTHENTICATION & LOGIN ENGINE
   -------------------------------------------------------------------------- */
function initLearnerAuth() {
  const loginOverlay = document.getElementById('learnerLoginOverlay');
  const loginForm = document.getElementById('learnerLoginForm');
  const logoutBtn = document.getElementById('learnerLogoutBtn');
  const togglePassBtn = document.getElementById('togglePassBtn');
  const passInput = document.getElementById('learnerInputPass');

  // Show/Hide Password Toggle
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePassBtn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to sign out from the learner portal?')) {
        localStorage.removeItem('ipti_learner_token');
        localStorage.removeItem('ipti_learner_student_id');
        window.location.reload();
      }
    });
  }

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('learnerLoginSubmitBtn');
      const errBox = document.getElementById('loginErrorMsg');
      const studentId = document.getElementById('learnerInputId').value.trim();
      const password = document.getElementById('learnerInputPass').value;

      errBox.classList.add('hidden');
      errBox.innerText = '';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

      try {
        const res = await fetch('/api/learner/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId, password })
        });

        const data = await res.json();
        if (data.success && data.token) {
          currentLearnerToken = data.token;
          localStorage.setItem('ipti_learner_token', data.token);
          if (data.student && data.student.studentId) {
            localStorage.setItem('ipti_learner_student_id', data.student.studentId);
          }

          loginOverlay.classList.add('hidden');
          document.getElementById('learnerApp').classList.remove('hidden');
          loadLearnerProfile();
        } else {
          errBox.innerText = data.error || 'Invalid credentials. Please verify your Student ID and password.';
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errBox.innerText = 'Server connection error: ' + err.message;
        errBox.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to Student Desk</span> <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  // Auto-verify existing session
  if (currentLearnerToken) {
    loadLearnerProfile();
  }
}

// Quick demo login autofill helper
window.fillLearnerDemo = function(id, pass) {
  const idEl = document.getElementById('learnerInputId');
  const passEl = document.getElementById('learnerInputPass');
  if (idEl) idEl.value = id;
  if (passEl) passEl.value = pass;
  const submitBtn = document.getElementById('learnerLoginSubmitBtn');
  if (submitBtn) submitBtn.focus();
};

/* --------------------------------------------------------------------------
   02. PROFILE LOADING & DASHBOARD RENDERING
   -------------------------------------------------------------------------- */
async function loadLearnerProfile() {
  if (!currentLearnerToken) return;

  try {
    const res = await fetch('/api/learner/profile', {
      headers: { 'Authorization': `Bearer ${currentLearnerToken}` }
    });

    if (res.status === 401) {
      // Invalid or expired token
      localStorage.removeItem('ipti_learner_token');
      currentLearnerToken = null;
      document.getElementById('learnerLoginOverlay').classList.remove('hidden');
      document.getElementById('learnerApp').classList.add('hidden');
      return;
    }

    const data = await res.json();
    if (data.success && data.student) {
      currentStudentData = data.student;
      currentCertificateData = data.certificate || null;

      document.getElementById('learnerLoginOverlay').classList.add('hidden');
      document.getElementById('learnerApp').classList.remove('hidden');

      renderDashboard(data.student, data.certificate);
    }
  } catch (err) {
    console.error('Error fetching learner profile:', err);
  }
}

function renderDashboard(student, certificate) {
  // 1. Header Profile Info
  const headerName = document.getElementById('headerStudentName');
  const headerId = document.getElementById('headerStudentId');
  const headerAvatar = document.getElementById('headerAvatar');

  if (headerName) headerName.innerText = student.fullName || 'Student';
  if (headerId) headerId.innerText = student.studentId || 'IPTI-STU';
  if (headerAvatar) {
    const initials = (student.fullName || 'ST')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    headerAvatar.innerText = initials;
  }

  // 2. Default Password Security Warning
  const banner = document.getElementById('defaultPasswordBanner');
  if (banner) {
    if (!student.hasChangedPassword) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  // 3. Welcome Hero Section
  const firstName = (student.fullName || 'Candidate').split(' ')[0];
  const welcomeGreeting = document.getElementById('welcomeGreeting');
  const welcomeSub = document.getElementById('welcomeSub');
  const profileBatchTag = document.getElementById('profileBatchTag');
  const profileModeTag = document.getElementById('profileModeTag');
  const profileAdmitDate = document.getElementById('profileAdmitDate');

  if (welcomeGreeting) welcomeGreeting.innerText = `Welcome back, ${firstName}!`;
  if (welcomeSub) {
    welcomeSub.innerHTML = `Enrolled in <strong>${escapeHtml(student.program || 'Industrial Engineering')}</strong> at IPTI Engineering Innovation Center.`;
  }
  if (profileBatchTag) profileBatchTag.innerHTML = `<i class="fa-solid fa-clock"></i> ${escapeHtml(student.batch || 'Morning Cohort')}`;
  if (profileModeTag) profileModeTag.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(student.learningMode || 'Classroom Training')}`;

  const admitDateFmt = new Date(student.admissionDate || student.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  if (profileAdmitDate) profileAdmitDate.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Admitted: ${admitDateFmt}`;

  // Quick stats
  const quickAttendance = document.getElementById('quickAttendance');
  const quickFeeStatus = document.getElementById('quickFeeStatus');
  const quickCertStatus = document.getElementById('quickCertStatus');

  const attendanceVal = Number(student.attendance) || 92;
  if (quickAttendance) quickAttendance.innerText = `${attendanceVal}%`;

  const pStatus = (student.paymentStatus || 'Pending').toUpperCase();
  if (quickFeeStatus) {
    quickFeeStatus.innerText = pStatus;
    quickFeeStatus.style.color = pStatus === 'PAID' ? '#059669' : pStatus === 'PARTIAL' ? '#d97706' : '#dc2626';
  }

  if (quickCertStatus) {
    if (student.eligibleForCertificate) {
      quickCertStatus.innerText = certificate ? 'ISSUED' : 'ELIGIBLE';
      quickCertStatus.style.color = 'var(--accent-gold)';
    } else {
      quickCertStatus.innerText = 'PENDING';
      quickCertStatus.style.color = '#64748b';
    }
  }

  // 4. Fees Ledger Box
  const totalF = Number(student.totalFees) || 0;
  const paidF = Number(student.paidFees) || 0;
  const balanceF = Math.max(0, totalF - paidF);

  const kpiTotal = document.getElementById('kpiTotalFees');
  const kpiPaid = document.getElementById('kpiPaidFees');
  const kpiBalance = document.getElementById('kpiBalanceFees');
  const kpiDueSub = document.getElementById('kpiDueSub');
  const feeStatusPill = document.getElementById('feeStatusPill');

  if (kpiTotal) kpiTotal.innerText = `₹${totalF.toLocaleString('en-IN')}`;
  if (kpiPaid) kpiPaid.innerText = `₹${paidF.toLocaleString('en-IN')}`;
  if (kpiBalance) kpiBalance.innerText = `₹${balanceF.toLocaleString('en-IN')}`;
  if (kpiDueSub) kpiDueSub.innerText = balanceF === 0 ? 'Clearance complete' : 'Installment due';

  if (feeStatusPill) {
    const rawStatus = (student.paymentStatus || 'Pending').toLowerCase();
    feeStatusPill.className = `status-pill-badge ${rawStatus}`;
    feeStatusPill.innerText = rawStatus === 'paid' ? 'Fully Paid' : rawStatus === 'partial' ? 'Partial Due' : 'Payment Due';
  }

  // Payment receipts table
  const historyBody = document.getElementById('paymentHistoryBody');
  const countTag = document.getElementById('receiptCountTag');
  const history = Array.isArray(student.paymentHistory) ? student.paymentHistory : [];

  if (countTag) countTag.innerText = `${history.length} Payment${history.length === 1 ? '' : 's'}`;

  if (historyBody) {
    if (history.length === 0) {
      historyBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 18px;">
            No official receipts on record yet.
          </td>
        </tr>
      `;
    } else {
      historyBody.innerHTML = history.map((item, idx) => {
        const itemDate = new Date(item.date).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        const amt = Number(item.amount) || 0;

        return `
          <tr>
            <td><strong style="font-family: var(--font-mono); color: var(--primary);">${escapeHtml(item.receiptNo || `REC-2026-${100 + idx}`)}</strong></td>
            <td>${itemDate}</td>
            <td>${escapeHtml(item.method || 'Online Banking')}</td>
            <td><strong style="color: #059669;">₹${amt.toLocaleString('en-IN')}</strong></td>
            <td><span class="status-pill-badge paid" style="font-size: 0.68rem; padding: 2px 7px;">Verified</span></td>
            <td>
              <button class="receipt-btn" onclick="simulateDownloadReceipt('${escapeHtml(item.receiptNo || `REC-${idx}`)}', ${amt})">
                <i class="fa-solid fa-download"></i> Receipt
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 5. Certificate Showcase
  renderCertificateArea(student, certificate);

  // 6. Academic Checklist
  const critFeeItem = document.getElementById('critFeeItem');
  const critFeeIcon = document.getElementById('critFeeIcon');
  const critFeeTitle = document.getElementById('critFeeTitle');
  const critFeeDesc = document.getElementById('critFeeDesc');

  if (critFeeItem && critFeeIcon) {
    if (balanceF === 0) {
      critFeeItem.className = 'criteria-item met';
      critFeeIcon.className = 'fa-solid fa-circle-check';
      critFeeTitle.innerText = '100% Course Fee Clearance Completed';
      critFeeDesc.innerText = `Full fee of ₹${totalF.toLocaleString('en-IN')} has been cleared.`;
    } else {
      critFeeItem.className = 'criteria-item due';
      critFeeIcon.className = 'fa-solid fa-hourglass-half';
      critFeeTitle.innerText = `Outstanding Fee Balance: ₹${balanceF.toLocaleString('en-IN')}`;
      critFeeDesc.innerText = `Clear remaining balance of ₹${balanceF.toLocaleString('en-IN')} to satisfy certificate eligibility.`;
    }
  }

  // 7. Curriculum Modules
  renderCurriculumModules(student.program);
}

function renderCertificateArea(student, certificate) {
  const container = document.getElementById('certificateShowcaseArea');
  if (!container) return;

  const isEligible = Boolean(student.eligibleForCertificate);
  const certId = (certificate && certificate.certId) || student.certificateId;

  if (isEligible && certId) {
    // Official Certificate is Issued & Ready
    const issueDate = certificate ? new Date(certificate.issueDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    }) : '18 February 2026';
    const grade = certificate ? certificate.grade : 'Distinction (Grade A+ • 96%)';

    container.innerHTML = `
      <div class="cert-showcase-box">
        <div class="cert-gold-crest-wrap">
          <i class="fa-solid fa-award"></i>
        </div>
        <h4 class="cert-showcase-title">Official Certificate Awarded</h4>
        <p class="cert-showcase-sub">Congratulations! You have been conferred the official ISO 9001:2015 accredited course completion credential.</p>
        
        <div class="cert-meta-tags">
          <span class="cert-meta-tag"><i class="fa-solid fa-id-badge"></i> ${escapeHtml(certId)}</span>
          <span class="cert-meta-tag"><i class="fa-solid fa-medal"></i> ${escapeHtml(grade)}</span>
          <span class="cert-meta-tag"><i class="fa-solid fa-calendar-check"></i> ${issueDate}</span>
        </div>

        <button type="button" class="btn-diploma-view" onclick="openLearnerDiplomaModal()">
          <i class="fa-solid fa-diploma"></i>
          <span>View & Download Official Digital Diploma</span>
        </button>
      </div>
    `;
  } else if (isEligible) {
    // Eligible, but certificate issuance is in progress
    container.innerHTML = `
      <div class="cert-showcase-box" style="background: radial-gradient(circle at 50% 20%, #f0fdf4 0%, #ecfdf5 100%); border-color: rgba(5,150,105,0.3);">
        <div class="cert-gold-crest-wrap" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h4 class="cert-showcase-title" style="color: #065f46;">Eligible for Certificate</h4>
        <p class="cert-showcase-sub">Your practical lab assessments, capstone project review, and fee clearance are approved! Your official credential serial is being generated by the Academic Directorate.</p>
        
        <div class="cert-meta-tags">
          <span class="cert-meta-tag" style="color: #065f46; border-color: rgba(5,150,105,0.3);"><i class="fa-solid fa-shield-halved"></i> ISO 9001:2015 Accredited</span>
          <span class="cert-meta-tag" style="color: #065f46; border-color: rgba(5,150,105,0.3);"><i class="fa-solid fa-clock"></i> Directorate Conferral Pending</span>
        </div>
      </div>
    `;
  } else {
    // Ineligible or Pending Criteria
    container.innerHTML = `
      <div class="cert-pending-box">
        <i class="fa-solid fa-hourglass-start"></i>
        <h4>Certificate Qualification in Progress</h4>
        <p>Complete your coursework benchmarks, capstone project review, and fee balance to receive your official graduation certificate.</p>
      </div>
    `;
  }
}

function renderCurriculumModules(programTitle) {
  const container = document.getElementById('curriculumModulesGrid');
  if (!container) return;

  let matchedModules = programModulesDb["Industrial Automation"];

  if (programTitle) {
    const pLower = programTitle.toLowerCase();
    if (pLower.includes('embedded')) matchedModules = programModulesDb["Embedded Systems"];
    else if (pLower.includes('cad') || pLower.includes('mechanical')) matchedModules = programModulesDb["CAD"];
    else if (pLower.includes('ai') || pLower.includes('machine') || pLower.includes('vision')) matchedModules = programModulesDb["AI"];
    else if (pLower.includes('software') || pLower.includes('full-stack') || pLower.includes('web')) matchedModules = programModulesDb["Software"];
  }

  container.innerHTML = matchedModules.map(mod => `
    <div class="module-card">
      <div class="module-header">
        <span class="module-num">${mod.num}</span>
        <h4 class="module-title">${escapeHtml(mod.title)}</h4>
      </div>
      <p class="module-desc">${escapeHtml(mod.desc)}</p>
      <div class="module-tools">
        ${mod.tools.map(tool => `<span class="tool-badge">${escapeHtml(tool)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

/* --------------------------------------------------------------------------
   03. CHANGE PASSWORD ENGINE (JUST LIKE EMPORA)
   -------------------------------------------------------------------------- */
function initChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  const openBtn = document.getElementById('openChangePassBtn');
  const bannerBtn = document.getElementById('bannerChangePassBtn');
  const closeBtn = document.getElementById('closePassModalBtn');
  const cancelBtn = document.getElementById('cancelPassModalBtn');
  const form = document.getElementById('changePasswordForm');

  function openModal() {
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      const errBox = document.getElementById('passChangeError');
      const succBox = document.getElementById('passChangeSuccess');
      if (errBox) errBox.classList.add('hidden');
      if (succBox) succBox.classList.add('hidden');
      if (form) form.reset();
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (bannerBtn) bannerBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPasswordInput').value;
      const newPassword = document.getElementById('newPasswordInput').value;
      const confirmPassword = document.getElementById('confirmPasswordInput').value;

      const errBox = document.getElementById('passChangeError');
      const succBox = document.getElementById('passChangeSuccess');
      const submitBtn = document.getElementById('savePassSubmitBtn');

      errBox.classList.add('hidden');
      succBox.classList.add('hidden');

      if (newPassword !== confirmPassword) {
        errBox.innerText = 'New password and confirmation password do not match.';
        errBox.classList.remove('hidden');
        return;
      }

      if (newPassword.length < 6) {
        errBox.innerText = 'New password must be at least 6 characters long.';
        errBox.classList.remove('hidden');
        return;
      }

      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

      try {
        const res = await fetch('/api/learner/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentLearnerToken}`
          },
          body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();
        if (data.success) {
          succBox.innerText = data.message || 'Password changed successfully!';
          succBox.classList.remove('hidden');

          // Hide default password warning banner permanently
          const banner = document.getElementById('defaultPasswordBanner');
          if (banner) banner.classList.add('hidden');

          setTimeout(() => {
            closeModal();
          }, 1500);
        } else {
          errBox.innerText = data.error || 'Failed to update password. Please check your current password.';
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errBox.innerText = 'Server error: ' + err.message;
        errBox.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }
}

/* --------------------------------------------------------------------------
   04. DIGITAL CERTIFICATE DIPLOMA PREVIEW & PRINT
   -------------------------------------------------------------------------- */
function initDiplomaModal() {
  const modal = document.getElementById('learnerDiplomaModal');
  const closeBtn = document.getElementById('closeDiplomaModalBtn');
  const printBtn = document.getElementById('printDiplomaBtn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) modal.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

window.openLearnerDiplomaModal = function() {
  const modal = document.getElementById('learnerDiplomaModal');
  if (!modal || !currentStudentData) return;

  const s = currentStudentData;
  const c = currentCertificateData;

  const modalName = document.getElementById('modalStudentName');
  const modalProg = document.getElementById('modalProgramName');
  const modalGrade = document.getElementById('modalGradeBadge');
  const modalCertId = document.getElementById('modalCertId');
  const modalDate = document.getElementById('modalIssueDate');

  if (modalName) modalName.innerText = s.fullName || 'Rahul V. Sharma';
  if (modalProg) modalProg.innerText = s.program || 'Industrial Automation & Robotics (PLC/SCADA)';
  if (modalGrade) modalGrade.innerText = `Awarded with ${c ? c.grade : 'Distinction (Grade A+ • 96%)'}`;
  if (modalCertId) modalCertId.innerText = (c && c.certId) || s.certificateId || 'IPTI-CERT-2026-1042';

  const issueDateStr = c ? new Date(c.issueDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) : '18 February 2026';
  if (modalDate) modalDate.innerText = issueDateStr;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

// Receipt Download Simulation
window.simulateDownloadReceipt = function(receiptNo, amount) {
  alert(`Official Receipt: ${receiptNo}\nAmount Paid: ₹${Number(amount).toLocaleString('en-IN')}\nStatus: Verified\nInstitution: IPTI\n\nOfficial PDF receipt opened in print dialog.`);
  window.print();
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
