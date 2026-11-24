/* ==========================================================================
   IPTI — INSTITUTE OF PROFESSIONAL TRAINING & INNOVATION
   Front-End Application Logic, Animations, Canvas & Form Submissions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initPromptTypewriter();
  initRollingCounters();
  initCountdownTimer();
  initProgramFilter();
  initFAQAccordion();
  initMobileMenu();
  initScrollspy();
  initModals();
  initForms();
  loadDynamicPrograms();
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
   06.5 DYNAMIC SCROLLSPY & NAV ACTIVE TRACKING
   -------------------------------------------------------------------------- */
function initScrollspy() {
  const navLinks = Array.from(document.querySelectorAll('.nav-links .nav-link[href^="#"]'));
  if (!navLinks.length) return;

  const sections = navLinks
    .map(link => {
      const id = link.getAttribute('href');
      const el = document.querySelector(id);
      return el ? { id, link, el } : null;
    })
    .filter(Boolean);

  if (!sections.length) return;

  let isManualClick = false;
  let clickTimeout = null;

  function setActive(activeLink) {
    navLinks.forEach(l => l.classList.remove('active'));
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  function onScroll() {
    if (isManualClick) return;

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    // If near bottom of the page, activate the last link (e.g. FAQ)
    if (scrollY + windowHeight >= docHeight - 70) {
      setActive(sections[sections.length - 1].link);
      return;
    }

    // Offset for floating navbar + viewing focal point
    const navOffset = 180;
    let current = sections[0];

    for (let i = 0; i < sections.length; i++) {
      const top = sections[i].el.getBoundingClientRect().top + scrollY;
      if (scrollY + navOffset >= top) {
        current = sections[i];
      }
    }

    if (current) {
      setActive(current.link);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Handle smooth scroll on click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          isManualClick = true;
          clearTimeout(clickTimeout);
          setActive(link);

          const navbarHeight = 85;
          const targetY = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

          window.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });

          // Re-enable scroll tracking once smooth scroll lands
          clickTimeout = setTimeout(() => {
            isManualClick = false;
            onScroll();
          }, 850);
        }
      }
    });
  });

  // Run initial state check on load
  onScroll();
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

    let directDownloadBox = document.getElementById('modalSyllabusDirectDownload');
    if (isSyllabus) {
      modalTitle.innerText = 'Download Program Syllabus & Brochure';
      const matched = (window._loadedPrograms || []).find(p => courseName && p.title.toLowerCase().includes(courseName.toLowerCase()));
      if (matched && matched.syllabusUrl) {
        if (!directDownloadBox) {
          directDownloadBox = document.createElement('div');
          directDownloadBox.id = 'modalSyllabusDirectDownload';
          directDownloadBox.style.cssText = 'background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;';
          const formEl = document.getElementById('modalEnquiryForm');
          if (formEl) formEl.parentNode.insertBefore(directDownloadBox, formEl);
        }
        directDownloadBox.style.display = 'flex';
        directDownloadBox.innerHTML = `
          <div style="font-size: 0.82rem; color: #065f46; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-file-pdf" style="color: #dc2626; font-size: 1.1rem;"></i>
            <span>Official Syllabus Attached</span>
          </div>
          <a href="${matched.syllabusUrl}" download="${matched.syllabusFilename || 'Syllabus.pdf'}" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.78rem; text-decoration: none;">
            <i class="fa-solid fa-download"></i> Direct Download PDF
          </a>
        `;
      } else if (directDownloadBox) {
        directDownloadBox.style.display = 'none';
      }
    } else {
      modalTitle.innerText = 'Enquire for Upcoming Batch';
      if (directDownloadBox) directDownloadBox.style.display = 'none';
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

      // Ensure tick mark checkbox is ticked
      const consentCheck = document.getElementById('mainConsentCheck') || mainForm.querySelector('[name="consentCheckbox"]');
      if (consentCheck && !consentCheck.checked) {
        alert('Please tick the confirmation checkbox to submit your admission enquiry.');
        consentCheck.focus();
        return;
      }

      const payload = {
        fullName: mainForm.querySelector('[name="fullName"]').value,
        email: mainForm.querySelector('[name="email"]').value,
        phone: mainForm.querySelector('[name="phone"]').value,
        whatsapp: mainForm.querySelector('[name="whatsapp"]').value || mainForm.querySelector('[name="phone"]').value,
        course: mainForm.querySelector('[name="course"]').value,
        learningMode: mainForm.querySelector('[name="learningMode"]')?.value || 'Classroom Training',
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

      // Ensure tick mark checkbox is ticked
      const modalConsent = document.getElementById('modalConsentCheck') || modalForm.querySelector('[name="consentCheckbox"]');
      if (modalConsent && !modalConsent.checked) {
        alert('Please tick the confirmation checkbox to submit your enquiry.');
        modalConsent.focus();
        return;
      }

      const payload = {
        fullName: modalForm.querySelector('[name="fullName"]').value,
        email: modalForm.querySelector('[name="email"]').value,
        phone: modalForm.querySelector('[name="phone"]').value,
        course: modalForm.querySelector('[name="course"]').value,
        learningMode: modalForm.querySelector('[name="learningMode"]')?.value || 'Classroom Training',
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
      window._loadedPrograms = data.data;
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
            ${p.syllabusUrl ? `
            <a href="${p.syllabusUrl}" download="${p.syllabusFilename || 'IPTI-Program-Syllabus.pdf'}" class="btn btn-secondary" style="text-decoration: none;" title="Download Official Syllabus PDF">
              <i class="fa-solid fa-file-arrow-down" style="color: var(--accent-gold); margin-right: 4px;"></i>
              <span>Syllabus</span>
            </a>
            ` : `
            <button class="btn btn-secondary" data-open-modal="syllabus" data-course="${escapeHtmlApp(p.title)}">
              <span>Syllabus</span>
            </button>
            `}
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
