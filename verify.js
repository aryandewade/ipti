/**
 * IPTI — Official Certificate & Credential Verification Logic
 * Anti-Tamper Real-Time Verification Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('verifyForm');
  const input = document.getElementById('certQueryInput');
  const clearBtn = document.getElementById('clearInputBtn');
  const submitBtn = document.getElementById('verifySubmitBtn');
  const resultContainer = document.getElementById('resultContainer');
  const quickChips = document.querySelectorAll('.quick-chip');

  // Input clear button toggle
  input.addEventListener('input', () => {
    if (clearBtn) {
      clearBtn.style.display = input.value.trim() ? 'flex' : 'none';
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      input.focus();
    });
  }

  // Quick Chips Click
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-id');
      if (id) {
        input.value = id;
        if (clearBtn) clearBtn.style.display = 'flex';
        runVerification(id);
      }
    });
  });

  // Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query) {
      runVerification(query);
    }
  });

  // Check URL query parameters (e.g., verify.html?id=IPTI-CERT-2026-1042)
  const urlParams = new URLSearchParams(window.location.search);
  const autoId = urlParams.get('id') || urlParams.get('certId') || urlParams.get('studentId') || urlParams.get('query');
  if (autoId && autoId.trim()) {
    input.value = autoId.trim();
    if (clearBtn) clearBtn.style.display = 'flex';
    runVerification(autoId.trim());
  }

  /**
   * Run Verification Request against IPTI Server API
   */
  async function runVerification(query) {
    if (!query) return;

    // Show loading UI on button
    submitBtn.classList.add('loading');
    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Verifying...</span>`;

    // Scroll smoothly to results area
    resultContainer.style.display = 'block';
    resultContainer.innerHTML = `
      <div style="background: #FFFFFF; border: 1.5px solid rgba(15, 67, 50, 0.12); border-radius: 16px; padding: 48px 24px; text-align: center; box-shadow: 0 4px 20px rgba(15, 67, 50, 0.05);">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.2rem; color: var(--accent-gold); margin-bottom: 16px;"></i>
        <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--primary); margin-bottom: 6px;">Consulting IPTI Central Ledger...</h3>
        <p style="font-size: 0.88rem; color: var(--text-muted);">Authenticating cryptographic credentials against the ISO 9001:2015 database.</p>
      </div>
    `;

    try {
      const response = await fetch(`/api/certificates/verify/${encodeURIComponent(query.trim())}`);
      const data = await response.json();

      if (data.certificate) {
        renderVerifiedCertificate(data.certificate);
      } else if (data.candidate) {
        renderPendingCandidate(data.candidate);
      } else {
        renderNotFound(query, data.error || 'No credential or candidate record found with this ID.');
      }
    } catch (err) {
      renderNotFound(query, 'Unable to connect to verification registry. Please check your internet connection or try again.');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.innerHTML = originalBtnHtml;

      // Smooth scroll to view results
      resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * 1. Render Officially Verified Certificate (Clean, Unified & Non-Redundant)
   */
  function renderVerifiedCertificate(cert) {
    const formattedIssueDate = cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : 'Confirmed';

    const verificationUrl = `${window.location.origin}/verify.html?id=${encodeURIComponent(cert.certId)}`;

    resultContainer.innerHTML = `
      <div class="verified-result-card" id="verifiedPrintCard">
        
        <!-- Top Status Banner -->
        <div class="verified-banner-top">
          <div class="banner-status-left">
            <div class="status-shield-icon">
              <i class="fa-solid fa-check"></i>
            </div>
            <div class="banner-status-titles">
              <h2>Official Credential Authenticated</h2>
              <p>Verified Authentic &amp; Active in IPTI Central Ledger</p>
            </div>
          </div>
          <div class="banner-status-badge">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Verified Official</span>
          </div>
        </div>

        <!-- Single Clean Digital Credential Certificate -->
        <div class="credential-cert-body">
          <div class="credential-cert-frame">
            
            <!-- Institute Header -->
            <div class="cert-header-center">
              <img src="assets/ipti-logo.jpg" alt="IPTI Crest" class="cert-crest-img">
              <h3 class="cert-inst-name">INSTITUTE OF PROFESSIONAL TRAINING &amp; INNOVATION</h3>
              <p class="cert-inst-meta">Government Recognized • ISO 9001:2015 Center of Excellence</p>
            </div>

            <!-- Conferral Lead -->
            <div class="cert-lead-text">THIS IS TO OFFICIALLY CERTIFY THAT</div>

            <!-- Student Name (Shown Once, Large & Authoritative) -->
            <h1 class="cert-student-name">${escapeHtml(cert.studentName)}</h1>

            ${cert.studentId ? `
            <div class="cert-student-id-pill">
              <span>Student ID:</span> <strong>${escapeHtml(cert.studentId)}</strong>
            </div>
            ` : ''}

            <!-- Program Lead -->
            <p class="cert-prog-lead">has successfully completed all practical assessments and industrial capstone requirements for</p>

            <!-- Program Title -->
            <div class="cert-program-title">${escapeHtml(cert.program)}</div>

            <!-- Grade Awarded -->
            <div class="cert-grade-badge">
              <i class="fa-solid fa-medal"></i>
              <span>${escapeHtml(cert.grade || 'Awarded with Distinction')}</span>
            </div>

            ${cert.projectTitle ? `
            <div class="cert-capstone-box">
              <span class="capstone-lbl"><i class="fa-solid fa-diagram-project"></i> Capstone:</span>
              <span class="capstone-val">${escapeHtml(cert.projectTitle)}</span>
            </div>
            ` : ''}

            ${cert.notes ? `
            <div class="cert-notes-box">
              <strong>Registry Endorsement:</strong> ${escapeHtml(cert.notes)}
            </div>
            ` : ''}

            <!-- Essential Metadata 3-Column Strip (Shown Once!) -->
            <div class="cert-meta-strip">
              <div class="meta-strip-item">
                <span class="m-lbl">CREDENTIAL ID</span>
                <span class="m-val mono">${escapeHtml(cert.certId)}</span>
              </div>
              <div class="meta-strip-item">
                <span class="m-lbl">CONFERRAL DATE</span>
                <span class="m-val">${escapeHtml(formattedIssueDate)}</span>
              </div>
              <div class="meta-strip-item">
                <span class="m-lbl">SECURITY HASH (SHA-256)</span>
                <span class="m-val mono hash">${escapeHtml(cert.verificationHash || 'IPTI-SECURE-2026-REG')}</span>
              </div>
            </div>

            <!-- Signatory Footer -->
            <div class="cert-sign-footer">
              <div class="sign-block left">
                <div class="sign-name">Aryan Dewade</div>
                <div class="sign-role">Academic Director, IPTI</div>
              </div>

              <div class="seal-block center">
                <div class="official-seal-stamp">
                  <i class="fa-solid fa-certificate"></i>
                  <span>ISO 9001:2015</span>
                  <small>OFFICIAL SEAL</small>
                </div>
              </div>

              <div class="sign-block right">
                <div class="registry-verified-tag">
                  <i class="fa-solid fa-circle-check"></i> Verified Authentic
                </div>
                <div class="sign-role">IPTI Central Academic Registry</div>
              </div>
            </div>

          </div>
        </div>

        <!-- Action Toolbar -->
        <div class="verified-actions-toolbar">
          <div class="actions-left">
            <button type="button" id="printVerifyBtn" class="btn-action primary">
              <i class="fa-solid fa-print"></i>
              <span>Print / Save PDF</span>
            </button>
            <button type="button" id="copyVerifyLinkBtn" class="btn-action secondary">
              <i class="fa-solid fa-link"></i>
              <span>Copy Direct Verification Link</span>
            </button>
          </div>

          <div class="actions-right">
            <button type="button" id="verifyAnotherBtn" class="btn-action secondary">
              <i class="fa-solid fa-magnifying-glass"></i>
              <span>Verify Another ID</span>
            </button>
          </div>
        </div>

      </div>
    `;

    // Wire action buttons
    document.getElementById('printVerifyBtn').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('copyVerifyLinkBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(verificationUrl).then(() => {
        showToast('Official Verification Link copied to clipboard!');
      }).catch(() => {
        showToast('Link: ' + verificationUrl);
      });
    });

    document.getElementById('verifyAnotherBtn').addEventListener('click', () => {
      input.value = '';
      input.focus();
      resultContainer.style.display = 'none';
      window.scrollTo({ top: 120, behavior: 'smooth' });
    });
  }

  /**
   * 2. Render Enrolled Candidate (Certificate Not Generated Yet)
   */
  function renderPendingCandidate(candidate) {
    resultContainer.innerHTML = `
      <div class="pending-result-card">
        
        <div class="pending-banner-top">
          <div class="pending-shield-icon">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 2px 0;">Certificate Not Generated Yet</h2>
            <p style="margin: 0; font-size: 0.82rem; color: #FEF3C7;">Student ID Authenticated • Certificate Pending Administrative Generation</p>
          </div>
        </div>

        <div class="pending-body">
          <div class="pending-info-box">
            <i class="fa-solid fa-circle-exclamation" style="font-size: 1.2rem; flex-shrink: 0; margin-top: 2px;"></i>
            <div>
              <strong>Academic Standing Notice:</strong>
              <p style="margin: 4px 0 0 0; line-height: 1.5;">${escapeHtml(candidate.message || 'Learner record authenticated in the IPTI Academic Ledger. However, an official completion certificate has NOT been generated or issued yet. A certificate must be officially generated by the IPTI Academic Council before it can be verified.')}</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 24px;">
            <div class="dossier-item">
              <span class="d-label">Student Unique ID</span>
              <span class="d-val mono">${escapeHtml(candidate.studentId)}</span>
            </div>
            <div class="dossier-item">
              <span class="d-label">Learner Name</span>
              <span class="d-val">${escapeHtml(candidate.fullName)}</span>
            </div>
            <div class="dossier-item">
              <span class="d-label">Enrolled Program</span>
              <span class="d-val">${escapeHtml(candidate.program)}</span>
            </div>
            <div class="dossier-item">
              <span class="d-label">Learning Mode</span>
              <span class="d-val">${escapeHtml(candidate.learningMode || 'Classroom Training')}</span>
            </div>
            <div class="dossier-item">
              <span class="d-label">Certificate Status</span>
              <span class="d-val" style="color: #D97706; font-weight: 800;">
                <i class="fa-solid fa-hourglass-half"></i> Not Generated Yet
              </span>
            </div>
            <div class="dossier-item">
              <span class="d-label">Eligibility Status</span>
              <span class="d-val" style="color: ${candidate.eligibleForCertificate ? '#059669' : '#D97706'}; font-weight: 800;">
                ${candidate.eligibleForCertificate ? 'Eligible for Generation' : 'Coursework / Fees In Progress'}
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
            <button type="button" id="pendingVerifyAnotherBtn" class="btn-action primary">
              <i class="fa-solid fa-magnifying-glass"></i>
              <span>Search Another Credential</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.getElementById('pendingVerifyAnotherBtn').addEventListener('click', () => {
      input.value = '';
      input.focus();
      resultContainer.style.display = 'none';
      window.scrollTo({ top: 120, behavior: 'smooth' });
    });
  }

  /**
   * 3. Render Not Found / Fraud Prevention Alert
   */
  function renderNotFound(query, errorMsg) {
    resultContainer.innerHTML = `
      <div class="notfound-result-card">
        
        <div class="notfound-banner-top">
          <div class="notfound-shield-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 2px 0;">Credential Record Not Found</h2>
            <p style="margin: 0; font-size: 0.82rem; color: #FEE2E2;">Unverified Identifier • Not Registered in IPTI Central Academic Ledger</p>
          </div>
        </div>

        <div class="notfound-body">
          <div class="fraud-warning-box">
            <h4><i class="fa-solid fa-shield-halved"></i> Institutional Anti-Fraud Warning</h4>
            <p>
              The identifier <strong>"${escapeHtml(query)}"</strong> does not match any certificate or enrolled candidate record in IPTI's database. 
              To protect organizations from counterfeit qualifications, only certificates verifiable on this portal are authentic and recognized.
            </p>
          </div>

          <div style="background: var(--bg-recessed); border: 1px solid rgba(15, 67, 50, 0.1); border-radius: var(--radius-md); padding: 18px 20px; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 24px;">
            <strong style="color: var(--primary); display: block; margin-bottom: 6px;">Recommended Steps for HR &amp; Verifying Bodies:</strong>
            <ul style="padding-left: 20px; margin: 0; line-height: 1.6;">
              <li>Verify that the alphanumeric characters were entered correctly without extra spaces or symbols.</li>
              <li>Ensure the candidate has completed all program requirements and received their authorized conferral.</li>
              <li>If you have received a physical certificate bearing this ID, please forward a scanned copy to <a href="mailto:verification@ipti.edu.in" style="color: var(--primary); font-weight: 700;">verification@ipti.edu.in</a> for immediate forensic validation.</li>
            </ul>
          </div>

          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button type="button" id="notfoundTryAgainBtn" class="btn-action primary">
              <i class="fa-solid fa-rotate-right"></i>
              <span>Re-enter Identifier</span>
            </button>
          </div>
        </div>

      </div>
    `;

    document.getElementById('notfoundTryAgainBtn').addEventListener('click', () => {
      input.value = '';
      input.focus();
      resultContainer.style.display = 'none';
      window.scrollTo({ top: 120, behavior: 'smooth' });
    });
  }

  /**
   * Toast notification helper
   */
  function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-gold);"></i> <span>${escapeHtml(message)}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
