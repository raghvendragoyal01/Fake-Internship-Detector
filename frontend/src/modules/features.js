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
}

/** Start (or restart) the dashboard polling loop. */
export function startDashboard() {
  if (dashboardInterval) return;
  loadDashboard();
  dashboardInterval = setInterval(loadDashboard, 5000);
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
    const { data } = await api.dashboard();
    const stats = data?.stats || {};

    setTextById('stat-total-jobs',         stats.total_jobs_analyzed ?? 0);
    setTextById('stat-scams-detected',     stats.scams_detected ?? 0);
    setTextById('stat-verified-recruiters', stats.verified_recruiters ?? 0);
    setTextById('stat-total-reports',      stats.total_reports ?? 0);
  } catch (err) {
    console.error('[Dashboard] Sync failed:', err.message);
  }
}

/* ═══ SCAM CHECKER ══════════════════════════════════════════════════════════ */

function bindScamChecker() {
  document.getElementById('scamCheckerForm')?.addEventListener('submit', handleScamAnalysis);
}

async function handleScamAnalysis(e) {
  e.preventDefault();

  const job_description = val('jobDescription');
  const job_url         = val('jobUrl');
  const recruiter_email = val('recruiterEmail');
  if (!job_description || !job_url || !recruiter_email) return;

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
      const fmt   = data.format_score  || 0;
      const key   = data.keyword_score || 0;
      const imp   = data.impact_score  || 0;

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
