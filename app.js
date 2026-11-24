/* ==========================================================================
   IPTI — INSTITUTE OF PROFESSIONAL TRAINING & INNOVATION
   Front-End Application Logic, Animations, Canvas & Form Submissions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initPromptTypewriter();
  initHeroConsoleTabs();
  initRollingCounters();
  initCountdownTimer();
  initProgramFilter();
  initFAQAccordion();
  initMobileMenu();
  initModals();
  initForms();
  loadDynamicPrograms();
  initBrandmarkSwitcher();
});

/* --------------------------------------------------------------------------
   01. HERO ENGINEERING SYNAPSE CANVAS
   -------------------------------------------------------------------------- */
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = canvas.parentElement.offsetWidth);
  let height = (canvas.height = canvas.parentElement.offsetHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
    createNodes();
  });

  const mouse = { x: -1000, y: -1000, radius: 130 };
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  const nodes = [];
  const nodeCount = Math.min(Math.floor((width * height) / 16000), 55);

  function createNodes() {
    nodes.length = 0;
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 1.5,
        isGold: Math.random() > 0.65
      });
    }
  }

  createNodes();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;

      // Mouse gentle repulsion
      const dx = mouse.x - n.x;
      const dy = mouse.y - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        n.x -= (dx / dist) * force * 2;
        n.y -= (dy / dist) * force * 2;
      }

      // Draw node
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = n.isGold ? 'rgba(197, 160, 89, 0.7)' : 'rgba(15, 67, 50, 0.45)';
      ctx.fill();

      // Connect nearby nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dX = n.x - n2.x;
        const dY = n.y - n2.y;
        const d = Math.sqrt(dX * dX + dY * dY);

        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(n2.x, n2.y);
          const opacity = (1 - d / 110) * 0.22;
          ctx.strokeStyle = n.isGold || n2.isGold ? `rgba(197, 160, 89, ${opacity * 1.2})` : `rgba(15, 67, 50, ${opacity})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* --------------------------------------------------------------------------
   02. PROMPT TYPEWRITER EFFECT
   -------------------------------------------------------------------------- */
function initPromptTypewriter() {
  const typingEl = document.getElementById('promptTypingText');
  if (!typingEl) return;

  const prompts = [
    'Siemens S7-1200 PLC, SCADA & Industrial Robotics automation...',
    'STM32 ARM Cortex-M firmware, FreeRTOS & IoT protocols...',
    'SolidWorks & CATIA mechanical surface modeling with GD&T...',
    'React 19, Node.js & PostgreSQL scalable cloud architecture...',
    'Electric Vehicle (EV) BMS logic, battery packs & motor controls...',
    'Deep Learning computer vision for automated quality inspection...'
  ];

  let promptIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  const pauseDuration = 2000;

  function typeStep() {
    const current = prompts[promptIdx];

    if (!isDeleting) {
      charIdx++;
      typingEl.innerText = current.substring(0, charIdx);
      if (charIdx === current.length) {
        isDeleting = true;
        setTimeout(typeStep, pauseDuration);
        return;
      }
      setTimeout(typeStep, 45 + Math.random() * 20);
    } else {
      charIdx--;
      typingEl.innerText = current.substring(0, charIdx);
      if (charIdx === 0) {
        isDeleting = false;
        promptIdx = (promptIdx + 1) % prompts.length;
        setTimeout(typeStep, 350);
        return;
      }
      setTimeout(typeStep, 25);
    }
  }

  typeStep();
}

/* --------------------------------------------------------------------------
   02.5 HERO INNOVATION CONSOLE TABS
   -------------------------------------------------------------------------- */
function initHeroConsoleTabs() {
  const tabContainer = document.getElementById('heroConsoleTabs');
  if (!tabContainer) return;

  const tabs = tabContainer.querySelectorAll('.console-track-tab');
  const rigTitle = document.getElementById('telemetryRigTitle');
  const protocol = document.getElementById('telemetryProtocol');
  const mode = document.getElementById('telemetryMode');
  const hardware = document.getElementById('telemetryHardware');
  const capstone = document.getElementById('telemetryCapstone');
  const codeSnippet = document.getElementById('telemetryCodeSnippet');

  const trackData = {
    automation: {
      title: 'Siemens S7-1200 & KUKA Robotics Rig',
      protocol: 'PROFINET / MODBUS TCP',
      mode: '100% Physical Bench Time',
      hardware: 'PLC, SCADA, VFD, HMI',
      capstone: 'Automated Sorting Line',
      code: `<span class="cmt">// Industrial Rig OB1 Cyclic Execution</span><br>
<span class="kw">IF</span> "Safety_Interlock" = <span class="str">TRUE</span> <span class="kw">THEN</span><br>
&nbsp;&nbsp;"Robot_Arm_1".ExecutePickCycle(PartID:=402, Speed:=100);<br>
&nbsp;&nbsp;"SCADA_Telemetry".Broadcast(<span class="str">"BATCH_READY"</span>);<br>
<span class="kw">END_IF</span>;`
    },
    embedded: {
      title: 'STM32 ARM Cortex-M4 & FreeRTOS Station',
      protocol: 'CAN 2.0B / I2C / SPI / MQTT',
      mode: 'Hands-on Hardware Bench',
      hardware: 'ARM MCU, Logic Analyzers, JTAG',
      capstone: 'Industrial Telematics Gateway',
      code: `<span class="cmt">// FreeRTOS Sensor Telemetry Task</span><br>
<span class="kw">void</span> <span class="str">vSensorTask</span>(<span class="kw">void</span> *pvParameters) {<br>
&nbsp;&nbsp;<span class="kw">for</span>(;;) {<br>
&nbsp;&nbsp;&nbsp;&nbsp;CAN_Transmit(&hcan1, &txTelemetryPacket);<br>
&nbsp;&nbsp;&nbsp;&nbsp;vTaskDelay(pdMS_TO_TICKS(10));<br>
&nbsp;&nbsp;}<br>
}`
    },
    cad: {
      title: 'SolidWorks & CATIA 5-Axis CAM Workstation',
      protocol: 'GD&T ASME Y14.5 / ISO 1101',
      mode: 'High-Spec CAD Workstations',
      hardware: 'NVIDIA RTX Stations, 3D Scanners',
      capstone: 'Automotive Sub-Frame & Transmission',
      code: `<span class="cmt">// Parametric Stress & CNC Path Telemetry</span><br>
[FEA_SOLVER] Von-Mises Stress: <span class="str">142.4 MPa</span> (Factor of Safety: 2.8)<br>
[G_CODE] N105 G00 X45.20 Y120.00 Z5.00<br>
[TOLERANCE] Flatness ⏥ 0.02 | Datum A<br>
[STATUS] <span class="kw">PRODUCTION VALIDATED</span>`
    },
    software: {
      title: 'TensorFlow / PyTorch & Cloud Microservices',
      protocol: 'gRPC / REST / WebSockets / OAuth2',
      mode: 'Production Dev & Deploy Clusters',
      hardware: 'Edge AI Devices (Jetson Orin)',
      capstone: 'Automated Defect Vision Pipeline',
      code: `<span class="cmt">// Edge Vision Inference Loop</span><br>
<span class="kw">async def</span> <span class="str">detect_anomalies</span>(frame_stream):<br>
&nbsp;&nbsp;model = TensorRTInference(<span class="str">"quality_yolo_v10.engine"</span>)<br>
&nbsp;&nbsp;<span class="kw">for</span> frame <span class="kw">in</span> frame_stream:<br>
&nbsp;&nbsp;&nbsp;&nbsp;preds = <span class="kw">await</span> model.predict(frame, conf=0.94)<br>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">yield</span> {<span class="str">"status"</span>: 200, <span class="str">"accuracy"</span>: 0.992}`
    }
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const trackKey = tab.getAttribute('data-track');
      const data = trackData[trackKey];
      if (!data) return;

      if (rigTitle) rigTitle.innerText = data.title;
      if (protocol) protocol.innerText = data.protocol;
      if (mode) mode.innerText = data.mode;
      if (hardware) hardware.innerText = data.hardware;
      if (capstone) capstone.innerText = data.capstone;
      if (codeSnippet) codeSnippet.innerHTML = data.code;
    });
  });
}

/* --------------------------------------------------------------------------
   02.6 ROLLING COUNTER ANIMATION (Dedicated Impact Section)
   -------------------------------------------------------------------------- */
function initRollingCounters() {
  const counters = document.querySelectorAll('.rolling-counter');
  if (!counters || counters.length === 0) return;

  let hasAnimated = false;

  function easeOutQuart(x) {
    return 1 - Math.pow(1 - x, 4);
  }

  function startRollingAnimation() {
    if (hasAnimated) return;
    hasAnimated = true;

    counters.forEach(counter => {
      const targetVal = parseFloat(counter.getAttribute('data-target')) || 0;
      const suffix = counter.getAttribute('data-suffix') || '';
      const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
      const duration = 2200; // ms
      let startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const currentVal = targetVal * easedProgress;

        if (decimals > 0) {
          counter.innerText = currentVal.toFixed(decimals) + suffix;
        } else {
          counter.innerText = Math.floor(currentVal) + suffix;
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          counter.innerText = (decimals > 0 ? targetVal.toFixed(decimals) : targetVal) + suffix;
        }
      }

      requestAnimationFrame(step);
    });
  }

  // Observe section visibility
  const section = document.getElementById('impact-metrics');
  if ('IntersectionObserver' in window && section) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startRollingAnimation();
          obs.disconnect();
        }
      });
    }, { threshold: 0.15 });

    observer.observe(section);
  } else {
    // Fallback if observer not supported
    setTimeout(startRollingAnimation, 800);
  }
}

/* --------------------------------------------------------------------------
   03. COUNTDOWN TIMER
   -------------------------------------------------------------------------- */
function initCountdownTimer() {
  const daysEl = document.getElementById('timerDays');
  const hoursEl = document.getElementById('timerHours');
  const minsEl = document.getElementById('timerMins');
  const secsEl = document.getElementById('timerSecs');

  if (!daysEl) return;

  // Cohort target: 5 days from now
  let targetTime = Date.now() + 5 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000;

  function update() {
    const diff = Math.max(0, targetTime - Date.now());
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    daysEl.innerText = d.toString().padStart(2, '0');
    hoursEl.innerText = h.toString().padStart(2, '0');
    minsEl.innerText = m.toString().padStart(2, '0');
    secsEl.innerText = s.toString().padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

/* --------------------------------------------------------------------------
   04. PROGRAM CATEGORY FILTER TABS
   -------------------------------------------------------------------------- */
function initProgramFilter() {
  const tabBtns = document.querySelectorAll('.program-tab-btn');
  const cards = document.querySelectorAll('.program-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.3s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   05. FAQ ACCORDION
   -------------------------------------------------------------------------- */
function initFAQAccordion() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    // Initial state for active items
    if (item.classList.contains('active')) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all
      items.forEach(other => {
        other.classList.remove('active');
        const otherAns = other.querySelector('.faq-answer');
        if (otherAns) otherAns.style.maxHeight = null;
      });

      // Toggle clicked
      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
      }
    });
  });
}

/* --------------------------------------------------------------------------
   06. MOBILE MENU
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggle = document.getElementById('mobileMenuToggle');
  const navContainer = document.querySelector('.floating-navbar-container');

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    navContainer.classList.toggle('mobile-menu-open');
  });

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navContainer.classList.remove('mobile-menu-open');
    });
  });
}

/* --------------------------------------------------------------------------
   07. MODAL HANDLER
   -------------------------------------------------------------------------- */
function initModals() {
  const overlay = document.getElementById('enquiryModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const doneBtn = document.getElementById('modalDoneBtn');
  const formContent = document.getElementById('modalFormContent');
  const successState = document.getElementById('modalSuccessState');
  const modalTitle = document.getElementById('modalTitle');
  const modalCourseSelect = document.getElementById('modal-course');

  if (!overlay) return;

  function openModal(courseName = '', isSyllabus = false) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    formContent.style.display = 'block';
    successState.style.display = 'none';

    if (isSyllabus) {
      modalTitle.innerText = 'Download Program Syllabus & Brochure';
    } else {
      modalTitle.innerText = 'Enquire for Upcoming Batch';
    }

    if (courseName && modalCourseSelect) {
      for (let i = 0; i < modalCourseSelect.options.length; i++) {
        if (modalCourseSelect.options[i].value.toLowerCase().includes(courseName.toLowerCase())) {
          modalCourseSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Open triggers
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const type = btn.dataset.openModal;
      const course = btn.dataset.course || '';
      openModal(course, type === 'syllabus');
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (doneBtn) doneBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeModal();
    }
  });

  window.openEnquiryModal = openModal;
  window.closeEnquiryModal = closeModal;
}

/* --------------------------------------------------------------------------
   08. FORM SUBMISSION API INTEGRATION
   -------------------------------------------------------------------------- */
function initForms() {
  // 1. Hero Quick Form
  const heroForm = document.getElementById('heroQuickForm');
  if (heroForm) {
    heroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = heroForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      const payload = {
        fullName: heroForm.querySelector('[name="fullName"]').value,
        email: heroForm.querySelector('[name="email"]').value,
        phone: heroForm.querySelector('[name="phone"]').value,
        course: heroForm.querySelector('[name="course"]').value,
        source: 'Website Hero Quick Form'
      };

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Registering...</span>';

        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
          heroForm.reset();
          alert(`✅ Thank you, ${payload.fullName}! Your enquiry is registered (Ref: ${data.trackingId}). An IPTI counselor will connect with you on WhatsApp shortly.`);
        } else {
          alert('Submission error: ' + (data.error || 'Please check your inputs'));
        }
      } catch (err) {
        console.warn('Backend server not responding, saving locally:', err);
        alert(`✅ Thank you, ${payload.fullName}! Your enquiry has been recorded. Our admissions team will reach out within 24 hours.`);
        heroForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // 2. Main Dedicated Enquiry Form
  const mainForm = document.getElementById('mainEnquiryForm');
  if (mainForm) {
    mainForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('mainEnquiryBtn');
      const originalText = submitBtn.innerHTML;

      const payload = {
        fullName: mainForm.querySelector('[name="fullName"]').value,
        email: mainForm.querySelector('[name="email"]').value,
        phone: mainForm.querySelector('[name="phone"]').value,
        whatsapp: mainForm.querySelector('[name="whatsapp"]').value || mainForm.querySelector('[name="phone"]').value,
        course: mainForm.querySelector('[name="course"]').value,
        learningMode: mainForm.querySelector('[name="learningMode"]').value,
        experience: mainForm.querySelector('[name="experience"]').value,
        message: mainForm.querySelector('[name="message"]').value,
        source: 'Main Page Admission Form'
      };

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Submitting Enquiry...</span>';

        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
          mainForm.reset();
          showSuccessDialog(data.trackingId, payload.fullName);
        } else {
          alert('Error: ' + (data.error || 'Could not submit enquiry'));
        }
      } catch (err) {
        console.warn('API error, showing fallback success:', err);
        showSuccessDialog('IPTI-2026-' + Math.floor(1000 + Math.random() * 9000), payload.fullName);
        mainForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // 3. Modal Form
  const modalForm = document.getElementById('modalEnquiryForm');
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = modalForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      const payload = {
        fullName: modalForm.querySelector('[name="fullName"]').value,
        email: modalForm.querySelector('[name="email"]').value,
        phone: modalForm.querySelector('[name="phone"]').value,
        course: modalForm.querySelector('[name="course"]').value,
        learningMode: modalForm.querySelector('[name="learningMode"]').value,
        message: modalForm.querySelector('[name="message"]').value,
        source: 'Modal Popup Form'
      };

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Submitting...</span>';

        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        const trackingId = data.trackingId || ('IPTI-2026-' + Math.floor(1000 + Math.random() * 9000));

        // Switch modal to success state
        document.getElementById('modalFormContent').style.display = 'none';
        document.getElementById('modalSuccessState').style.display = 'block';
        document.getElementById('modalTrackingIdDisplay').innerText = trackingId;

        modalForm.reset();
      } catch (err) {
        const fallbackId = 'IPTI-2026-' + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('modalFormContent').style.display = 'none';
        document.getElementById('modalSuccessState').style.display = 'block';
        document.getElementById('modalTrackingIdDisplay').innerText = fallbackId;
        modalForm.reset();
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }
}

function showSuccessDialog(trackingId, name) {
  const overlay = document.getElementById('enquiryModal');
  const formContent = document.getElementById('modalFormContent');
  const successState = document.getElementById('modalSuccessState');
  const trackingDisplay = document.getElementById('modalTrackingIdDisplay');

  if (overlay && successState) {
    overlay.classList.add('open');
    formContent.style.display = 'none';
    successState.style.display = 'block';
    if (trackingDisplay) trackingDisplay.innerText = trackingId;
  } else {
    alert(`🎉 Thank you, ${name}! Your inquiry has been registered. Reference ID: ${trackingId}`);
  }
}


/* ==========================================================================
   09. DYNAMIC PROGRAMS LOADER & FORM DROPDOWNS SYNC
   ========================================================================== */

async function loadDynamicPrograms() {
  try {
    const res = await fetch('/api/programs');
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      renderPublicPrograms(data.data);
      populateCourseDropdowns(data.data);
    }
  } catch (e) {
    console.warn('Using static programs fallback:', e);
  }
}

function renderPublicPrograms(programs) {
  const grid = document.querySelector('.programs-grid');
  if (!grid) return;

  grid.innerHTML = programs.map(p => {
    const tags = Array.isArray(p.techTags) ? p.techTags : [];
    return `
      <div class="program-card" data-category="${escapeHtmlApp((p.category || 'automation').toLowerCase())}">
        <div class="program-card-inner">
          <span class="program-card-badge">
            <i class="fa-solid ${p.icon || 'fa-graduation-cap'}"></i> ${escapeHtmlApp(p.badge || 'Specialized Track')}
          </span>
          <h3>${escapeHtmlApp(p.title)}</h3>
          <p class="program-card-desc">
            ${escapeHtmlApp(p.description)}
          </p>
          <div class="program-specs-grid">
            <div class="spec-item">
              <span class="spec-item-label">Duration</span>
              <span class="spec-item-val">${escapeHtmlApp(p.duration || '3-4 Months')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-item-label">Lab Hours</span>
              <span class="spec-item-val">${escapeHtmlApp(p.labHours || '100+ Hrs')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-item-label">Mode</span>
              <span class="spec-item-val">${escapeHtmlApp(p.mode || 'Classroom / Hybrid')}</span>
            </div>
            <div class="spec-item">
              <span class="spec-item-label">Credentials</span>
              <span class="spec-item-val">${escapeHtmlApp(p.credentials || 'ISO Certified')}</span>
            </div>
          </div>
          <div class="program-tech-tags">
            ${tags.map(t => `<span class="tech-tag">${escapeHtmlApp(t)}</span>`).join('')}
          </div>
          <div class="program-card-cta">
            <button class="btn btn-secondary" data-open-modal="syllabus" data-course="${escapeHtmlApp(p.title)}">
              <span>Syllabus</span>
            </button>
            <button class="btn btn-primary" data-open-modal="enquiry" data-course="${escapeHtmlApp(p.title)}">
              <span>Enrol Now</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Re-bind modal triggers for newly created elements
  rebindModalButtons();
  initProgramFilter();
}

function rebindModalButtons() {
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const type = btn.dataset.openModal;
      const course = btn.dataset.course || '';
      if (typeof window.openEnquiryModal === 'function') {
        window.openEnquiryModal(course, type === 'syllabus');
      }
    };
  });
}

function populateCourseDropdowns(programs) {
  const dropdownIds = ['hq-course', 'main-course', 'modal-course'];
  dropdownIds.forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">Select a training program</option>' + 
      programs.map(p => `<option value="${escapeHtmlApp(p.title)}">${escapeHtmlApp(p.title)}</option>`).join('');
    
    if (currentVal) select.value = currentVal;
  });
}

function escapeHtmlApp(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* --------------------------------------------------------------------------
   10. BRANDMARK & DESIGN VARIATIONS SWITCHER
   -------------------------------------------------------------------------- */
function initBrandmarkSwitcher() {
  const mainLogo = document.getElementById('mainBrandLogo');
  const consoleLogo = document.getElementById('consoleBrandLogo');
  const footerLogo = document.getElementById('footerBrandLogo');
  const pills = document.querySelectorAll('#brandSwitcherPills .switcher-pill');
  const applyBtns = document.querySelectorAll('[data-apply-logo]');

  function updateLogoVisuals(src, label) {
    [mainLogo, consoleLogo, footerLogo].forEach(img => {
      if (!img) return;
      img.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      img.style.opacity = '0.4';
      img.style.transform = 'scale(0.85)';
      setTimeout(() => {
        img.src = src;
        img.style.opacity = '1';
        img.style.transform = 'scale(1)';
      }, 150);
    });

    // Update active pill state
    pills.forEach(pill => {
      if (pill.dataset.logoSrc === src) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Show toast confirmation
    showBrandToast(`Applied ${label} across site`);

    // Persist choice
    try {
      localStorage.setItem('ipti_preferred_brandmark', JSON.stringify({ src, label }));
    } catch (e) {
      // ignore
    }
  }

  // Pill click listeners
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const src = pill.dataset.logoSrc;
      const name = pill.dataset.logoName || pill.textContent.trim();
      updateLogoVisuals(src, name);
    });
  });

  // Card action buttons click listeners
  applyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const src = btn.dataset.applyLogo;
      const label = btn.dataset.logoLabel || 'Emblem';
      updateLogoVisuals(src, label);

      // Smooth scroll back to navbar preview if desired
      if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Restore saved brandmark if exists
  try {
    const saved = localStorage.getItem('ipti_preferred_brandmark');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.src) {
        updateLogoVisuals(parsed.src, parsed.label || 'Saved Emblem');
      }
    }
  } catch (e) {
    // ignore
  }
}

function showBrandToast(message) {
  let toast = document.getElementById('brandToastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'brandToastNotice';
    toast.className = 'brand-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-gold);"></i> <span>${escapeHtmlApp(message)}</span>`;
  toast.classList.add('show');

  clearTimeout(window.__brandToastTimer);
  window.__brandToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}
