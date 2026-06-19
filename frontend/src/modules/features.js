/* ═══════════════════════════════════════════════════════════════════════════
   Features — Business logic for dashboard, scam analysis, recruiter
   verification, scam reporting, profile saving, and ATS resume analysis.
   ═══════════════════════════════════════════════════════════════════════════ */

import { api }            from './api.js';
import { getUser }        from './auth.js';
import { animateValue }   from './animations.js';

let dashboardInterval = null;

/* ═══ PUBLIC ════════════════════════════════════════════════════════════════ */

/** Bind all feature event handlers. Called once at boot. */
export function initFeatures() {
  bindScamChecker();
  bindRecruiterVerification();
  bindReportForm();
  bindProfileForm();
  bindATSUpload();
  bindDeveloperPortal();
  bindJobAlerts();
}

/** Start (or restart) the dashboard polling loop. */
export function startDashboard() {
  if (dashboardInterval) return;
  loadDashboard();
  dashboardInterval = setInterval(loadDashboard, 10000);
}

/** Stop the dashboard polling loop. */
export function stopDashboard() {
  if (dashboardInterval) {
    clearInterval(dashboardInterval);
    dashboardInterval = null;
  }
}

/* ═══ DASHBOARD ═════════════════════════════════════════════════════════════ */

async function loadDashboard() {
  try {
    const { data } = await api.getTelemetryStats();
    const stats = data || {};

    setTextById('stat-total-jobs',         stats.total_jobs_analyzed ?? 0);
    setTextById('stat-scams-detected',     stats.scams_detected ?? 0);
    setTextById('stat-verified-recruiters', stats.verified_recruiters ?? 0);
    setTextById('stat-total-reports',      stats.total_reports ?? 0);
  } catch (err) {
    console.error('[Dashboard] Sync failed:', err.message);
  }
}

/* ═══ ADMIN DASHBOARD ══════════════════════════════════════════════════════ */

let riskChartInstance = null;
let trendsChartInstance = null;

export async function loadAdminDashboard() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    return;
  }
  
  try {
    const { data } = await api.getAdminStats(user.token);
    const stats = data.stats || {};
    
    setTextById('adminTotalJobs', stats.total_jobs_analyzed ?? 0);
    setTextById('adminScamsDetected', stats.scams_detected ?? 0);
    setTextById('adminTotalReports', stats.total_reports ?? 0);
    
    renderCharts(data);
  } catch (err) {
    console.error('[AdminDashboard] Fetch failed:', err.message);
  }
}

function renderCharts(data) {
  if (!window.Chart) return;
  
  const riskCtx = document.getElementById('riskPieChart');
  const trendsCtx = document.getElementById('scamTrendsChart');
  const stats = data.stats || {};
  
  if (riskChartInstance) riskChartInstance.destroy();
  if (trendsChartInstance) trendsChartInstance.destroy();

  if (riskCtx) {
    // If the backend provided actual risk distribution, use it. Otherwise compute a fallback.
    const riskData = data.risk_distribution || [];
    let high = stats.scams_detected || 0;
    let low = Math.max(0, (stats.total_jobs_analyzed || 0) - high);
    let med = 0;

    if (riskData.length > 0) {
        low = riskData.find(r => r.risk_level === 'Low')?.count || 0;
        med = riskData.find(r => r.risk_level === 'Medium')?.count || 0;
        high = riskData.find(r => r.risk_level === 'High')?.count || 0;
    }

    riskChartInstance = new Chart(riskCtx, {
      type: 'doughnut',
      data: {
        labels: ['High Risk', 'Medium Risk', 'Low Risk'],
        datasets: [{
          data: [high, med, low],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1' } }
        }
      }
    });
  }

  if (trendsCtx) {
    // If backend provided monthly_scam_trends, map them
    const trends = data.monthly_scam_trends || [];
    let labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let dataset = [12, 19, 3, 5, 2, Math.min(20, stats.scams_detected || 0)];

    if (trends.length > 0) {
        labels = trends.map(t => t.month);
        dataset = trends.map(t => t.count);
    }

    trendsChartInstance = new Chart(trendsCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Scams Detected',
          data: dataset,
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

/* ═══ SCAM CHECKER ══════════════════════════════════════════════════════════ */

function bindScamChecker() {
  document.getElementById('scamCheckerForm')?.addEventListener('submit', handleScamAnalysis);
  
  // Auto-fetch job details when URL is pasted
  const urlInput = document.getElementById('jobUrl');
  if (urlInput) {
    urlInput.addEventListener('blur', async (e) => {
      const url = e.target.value.trim();
      if (!url) return;
      
      try {
        // Show a small loading state on the URL input
        urlInput.style.opacity = '0.5';
        const { data } = await api.fetchJob({ job_url: url });
        
        if (data.description && !document.getElementById('jobDescription').value) {
            document.getElementById('jobDescription').value = data.description;
        }
        if (data.email && !document.getElementById('recruiterEmail').value) {
            document.getElementById('recruiterEmail').value = data.email;
        }
        
        // We also have domain_age now, we can inject it into the analysis later
      } catch (err) {
        console.warn("Auto-fetch failed:", err);
      } finally {
        urlInput.style.opacity = '1';
      }
    });
  }
}

async function handleScamAnalysis(e) {
  e.preventDefault();

  const job_description = val('jobDescription');
  const job_url         = val('jobUrl');
  const recruiter_email = val('recruiterEmail');

  const btn = document.getElementById('analyzeBtn');
  show('analysisLoading');
  hide('analysisResult');
  if (btn) btn.disabled = true;

  try {
    const { data } = await api.analyzeScam({ job_description, job_url, recruiter_email });
    const result = data || {};

    setTextById('resultScore', result.scam_score ?? '0');

    const badge = document.getElementById('resultRiskBadge');
    if (badge) {
      badge.textContent = result.risk_level || 'UNKNOWN';
      badge.className   = `badge badge--${riskClass(result.risk_level)}`;
    }

    const keywords = Array.isArray(result.suspicious_keywords) ? result.suspicious_keywords : [];
    setTextById('resultKeywords',       keywords.length ? keywords.join(', ') : 'None detected');
    setTextById('resultRecommendation', result.recommendation || 'Review manually before applying.');
    
    const domainInfo = result.domain_info || {};
    setTextById('resultDomainAge', domainInfo.message || 'Unknown');

    show('analysisResult');
  } catch (err) {
    show('analysisResult');
    setTextById('resultScore', '—');

    const badge = document.getElementById('resultRiskBadge');
    if (badge) {
      badge.textContent = 'ERROR';
      badge.className   = 'badge badge--error';
    }
    setTextById('resultKeywords', err.message);
  } finally {
    hide('analysisLoading');
    if (btn) btn.disabled = false;
  }
}

/* ═══ RECRUITER VERIFICATION ════════════════════════════════════════════════ */

function bindRecruiterVerification() {
  document.getElementById('verifyRecruiterBtn')?.addEventListener('click', handleRecruiterCheck);
}

async function handleRecruiterCheck() {
  const query = val('verificationQuery');
  if (!query) return;

  const params = query.includes('@') ? { email: query } : { domain: query };

  try {
    const { data } = await api.recruiterCheck(params);

    setTextById('verificationTitle', data.company_name || 'Recruiter Verification');
    setTextById('verificationMeta', [data.email, data.domain].filter(Boolean).join(' · ') || 'No identity data returned');

    const badge = document.getElementById('verificationBadge');
    if (badge) {
      const status = data.status || 'Suspicious';
      badge.textContent = status;
      badge.className   = `badge badge--${statusClass(data.badge || status)}`;
    }

    setTextById('verificationReports', data.previous_reports ?? 0);
    setTextById('verificationTrust',   data.trust_score ?? '—');
    setTextById('verificationReason',  data.reason || 'No note provided');
    
    const domainInfo = data.domain_info || {};
    setTextById('verificationDomainAge', domainInfo.message || 'Unknown');

    show('verificationResult');
  } catch (err) {
    show('verificationResult');
    setTextById('verificationTitle', 'Verification unavailable');
    setTextById('verificationMeta',  err.message);
  }
}

/* ═══ REPORT SCAM ═══════════════════════════════════════════════════════════ */

function bindReportForm() {
  document.getElementById('reportForm')?.addEventListener('submit', handleReportSubmit);
}

async function handleReportSubmit(e) {
  e.preventDefault();

  const payload = {
    company_name: val('reportCompanyName'),
    job_url:      val('reportJobUrl'),
    scam_type:    val('reportScamType'),
    description:  val('reportDescription'),
    recruiter_email: val('reportRecruiterEmail'),
  };

  const statusEl = document.getElementById('reportStatus');

  if (!payload.company_name || !payload.job_url || !payload.scam_type || !payload.description) {
    showStatus(statusEl, 'Please fill in every field before submitting.', 'error');
    return;
  }

  const user = getUser();
  if (!user?.token) {
    showStatus(statusEl, 'You must be logged in to report a scam.', 'error');
    return;
  }

  try {
    await api.reportScam(payload, user.token);
    showStatus(statusEl, 'Report submitted successfully.', 'success');
    document.getElementById('reportForm')?.reset();
    setTimeout(loadDashboard, 1500);
  } catch (err) {
    showStatus(statusEl, err.message, 'error');
  }
}

/* ═══ PROFILE ═══════════════════════════════════════════════════════════════ */

function bindProfileForm() {
  document.getElementById('profileForm')?.addEventListener('submit', handleProfileSave);

  /* Photo preview */
  document.getElementById('profilePhotoUpload')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader  = new FileReader();
    const preview = document.getElementById('profilePhotoPreview');

    reader.onload = (ev) => {
      if (preview) {
        preview.src = ev.target.result;
        preview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  });

  // Load profile data on init
  loadUserProfile();
}

export async function loadUserProfile() {
  const user = getUser();
  if (!user || !user.token) return;

  try {
    const { data } = await api.getProfile(user.token);
    if (!data) return;

    if (data.linkedin_url) document.getElementById('profileLinkedin').value = data.linkedin_url;
    if (data.indeed_url) document.getElementById('profileIndeed').value = data.indeed_url;
    if (data.naukri_url) document.getElementById('profileNaukri').value = data.naukri_url;

    if (data.profile_picture) {
      const preview = document.getElementById('profilePhotoPreview');
      if (preview) {
        preview.src = data.profile_picture;
        preview.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('[Profile] Failed to load profile:', err.message);
  }
}

async function handleProfileSave(e) {
  e.preventDefault();

  const preview = document.getElementById('profilePhotoPreview');
  const profilePicture = preview && !preview.classList.contains('hidden') ? preview.src : null;

  const payload = {
    linkedin: val('profileLinkedin'),
    indeed:   val('profileIndeed'),
    naukri:   val('profileNaukri'),
    profile_picture: profilePicture
  };

  const statusEl = document.getElementById('profileStatus');
  const user = getUser();

  try {
    await api.saveProfile(payload, user?.token);
    showStatus(statusEl, 'Profile links saved successfully.', 'success');
  } catch (err) {
    showStatus(statusEl, err.message, 'error');
  }
}

/* ═══ ATS RESUME ANALYSIS ═══════════════════════════════════════════════════ */

function bindATSUpload() {
  const input = document.getElementById('resumeUpload');
  if (!input) return;

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTextById('uploadFileName', file.name);
    show('uploadFileName');
    show('atsLoading');
    hide('atsResultPanel');

    const formData = new FormData();
    formData.append('file', file);

    const user = getUser();

    try {
      const { data } = await api.analyzeATS(formData, user?.token);

      hide('atsLoading');
      show('atsResultPanel');

      const score = data.overall_score || 0;
      const fmt   = data.formatting_score  || 0;
      const key   = data.keyword_match || 0;
      const imp   = data.impact_metrics  || 0;

      setTimeout(() => {
        animateValue('atsScoreCircle', 0, score, 1500);

        setStyle('atsBarFormat',   'width', `${fmt}%`);
        setTextById('atsFmtVal',   `${fmt}%`);
        setStyle('atsBarKeywords', 'width', `${key}%`);
        setTextById('atsKeyVal',   `${key}%`);
        setStyle('atsBarImpact',   'width', `${imp}%`);
        setTextById('atsImpVal',   `${imp}%`);
        setTextById('atsFeedbackText', data.feedback || 'ATS parsing complete.');
      }, 50);
    } catch (err) {
      hide('atsLoading');
      show('atsResultPanel');
      setTextById('atsFeedbackText', 'Error parsing document. Backend might be unreachable.');
    }
  });
}

/* ═══ HELPERS ═══════════════════════════════════════════════════════════════ */

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function setTextById(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setStyle(id, prop, value) {
  const el = document.getElementById(id);
  if (el) el.style[prop] = value;
}

function show(id) {
  document.getElementById(id)?.classList.remove('hidden');
}

function hide(id) {
  document.getElementById(id)?.classList.add('hidden');
}

function showStatus(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.className   = `status-message status-message--${type}`;
  el.classList.remove('hidden');
}

function riskClass(level) {
  const v = String(level || '').toUpperCase();
  if (v === 'LOW')    return 'low';
  if (v === 'MEDIUM') return 'medium';
  if (v === 'HIGH')   return 'high';
  return 'medium';
}

function statusClass(status) {
  const v = String(status || '').toLowerCase();
  if (v === 'verified')    return 'verified';
  if (v === 'blacklisted') return 'blacklisted';
  return 'suspicious';
}

/* --- DEVELOPER PORTAL ------------------------------------------------------ */

export function bindDeveloperPortal() {
  const portalView = document.getElementById("developer-api-view");
  if (!portalView) return;

  const keyInput = document.getElementById("devApiKeyInput");
  const revealBtn = document.getElementById("devApiRevealBtn");
  const regenBtn = document.getElementById("devApiRegenerateBtn");

  // Modal elements
  const modal = document.getElementById("apiAuthModal");
  if (!modal) return;
  const closeModalBtn = document.getElementById("closeApiAuthModal");
  const authForm = document.getElementById("apiAuthForm");
  const authError = document.getElementById("apiAuthError");
  const pwdInput = document.getElementById("apiAuthPassword");
  const revealSection = document.getElementById("apiRevealSection");
  const revealedKeyInput = document.getElementById("apiRevealedKeyInput");
  const copyBtn = document.getElementById("apiCopyKeyBtn");

  // State
  let modalMode = "reveal"; // "reveal" or "regenerate"

  const MASKED_KEY = "********************************";

  // Helper to update the curl code block to show masked key
  const updateCurlCommand = (keyText) => {
    const codeBlock = document.getElementById("devApiCurlCode");
    if (codeBlock && codeBlock.textContent.includes("Bearer")) {
      codeBlock.textContent = codeBlock.textContent.replace(/Bearer [a-zA-Z0-9_*]+/, `Bearer ${keyText}`);
    }
  };

  const showModalError = (msg) => {
    authError.textContent = msg;
    authError.classList.remove("hidden");
  };

  const openModal = (mode) => {
    modalMode = mode;
    authForm.reset();
    authForm.classList.remove("hidden");
    revealSection.classList.add("hidden");
    authError.classList.add("hidden");
    
    modal.classList.remove("hidden");
    modal.style.display = 'flex';
    void modal.offsetWidth; // Force reflow
    modal.classList.add("modal-overlay--visible");
    
    pwdInput.focus();
  };

  const closeModal = () => {
    modal.classList.remove("modal-overlay--visible");
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.add("hidden");
      // Ensure the main page stays masked
      if (keyInput) keyInput.value = MASKED_KEY;
      updateCurlCommand(MASKED_KEY);
      revealedKeyInput.value = "";
      copyBtn.textContent = "Copy";
    }, 300);
  };

  if (revealBtn) revealBtn.addEventListener("click", () => openModal("reveal"));
  if (regenBtn) regenBtn.addEventListener("click", () => openModal("regenerate"));
  closeModalBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target.id === "apiAuthModal") closeModal();
  });

  // Handle Authentication and Key Fetching/Regeneration
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.classList.add("hidden");
    const user = getUser();
    if (!user || !user.email || !user.token) {
      showModalError("Please log in first.");
      return;
    }

    const password = pwdInput.value;
    const submitBtn = document.getElementById("apiAuthSubmitBtn");
    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "Verifying...";

    try {
      // Re-authenticate using the login endpoint
      await api.login({ email: user.email, password: password });
      
      // If login succeeds, fetch or regenerate key
      let apiKeyToDisplay = "";
      if (modalMode === "regenerate") {
        const { api_key } = await api.regenerateApiKey(user.token);
        apiKeyToDisplay = api_key;
      } else {
        const { api_key } = await api.getApiKey(user.token);
        apiKeyToDisplay = api_key || "No API Key generated yet. Please Regenerate.";
      }

      // Switch Modal to Reveal State
      authForm.classList.add("hidden");
      revealSection.classList.remove("hidden");
      revealedKeyInput.value = apiKeyToDisplay;

    } catch (err) {
      showModalError(err.message || "Invalid password.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector("span").textContent = "Verify";
    }
  });

  // Handle Copy Button
  copyBtn.addEventListener("click", async () => {
    if (!revealedKeyInput.value) return;
    try {
      await navigator.clipboard.writeText(revealedKeyInput.value);
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  });

  // Initialize view as masked
  if (keyInput) keyInput.value = MASKED_KEY;
  updateCurlCommand(MASKED_KEY);
}

/* ═══ JOB ALERTS ══════════════════════════════════════════════════════════════ */

function bindJobAlerts() {
  document.getElementById('jobAlertsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('alertEmail')?.value;
    const skills = document.getElementById('alertSkills')?.value;
    const btn = document.getElementById('alertSubmitBtn');
    
    show('alertLoading');
    hide('alertResult');
    if (btn) btn.disabled = true;
    
    try {
      const res = await api.subscribeAlerts({ email, skills });
      if (res && res.success) {
        document.getElementById('alertResultMessage').textContent = 'Subscribed Successfully!';
        document.getElementById('alertResultMessage').style.color = 'var(--color-success)';
        
        // Render jobs
        if (res.jobs && res.jobs.length > 0) {
          const container = document.getElementById('jobListingsContainer');
          if (container) {
            container.innerHTML = '';
            res.jobs.forEach(job => {
              const riskColor = job.risk_level === 'HIGH' ? 'var(--color-error)' : (job.risk_level === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-success)');
              
              const card = document.createElement('div');
              card.className = 'glass result-card';
              card.style.display = 'flex';
              card.style.flexDirection = 'column';
              card.style.gap = '0.5rem';
              
              card.innerHTML = `
                <div class="result-card__header">
                  <div>
                    <div class="result-card__name" style="font-weight: 600;">${job.title}</div>
                    <div class="result-card__meta">${job.company} • ${job.location}</div>
                  </div>
                  <span class="badge" style="background-color: ${riskColor}22; color: ${riskColor}; border: 1px solid ${riskColor}44;">
                    ${job.risk_level} RISK (${job.scam_score})
                  </span>
                </div>
                <div style="color: #a0aec0; font-size: 0.9rem;">${job.salary}</div>
                <p style="font-size: 0.9rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0;">${job.description || ''}</p>
                <div style="margin-top: 0.5rem;">
                  <a href="${job.url}" target="_blank" class="btn btn--outline btn--sm">View Job</a>
                </div>
              `;
              container.appendChild(card);
            });
            document.getElementById('liveJobListings').classList.remove('hidden');
          }
        }
      } else {
        document.getElementById('alertResultMessage').textContent = res.message || 'Failed to subscribe';
        document.getElementById('alertResultMessage').style.color = 'var(--color-error)';
      }
      show('alertResult');
    } catch (err) {
      document.getElementById('alertResultMessage').textContent = err.message || 'Failed to subscribe';
      document.getElementById('alertResultMessage').style.color = 'var(--color-error)';
      show('alertResult');
    } finally {
      hide('alertLoading');
      if (btn) btn.disabled = false;
    }
  });
}
