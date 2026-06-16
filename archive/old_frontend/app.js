const API_BASE = window.API_BASE_URL || "http://localhost:8000/api/v1";

// --- Space Starfield Background Animation ---
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width, height;
  let stars = [];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  class Star {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random() * width;
      this.size = Math.random() * 1.5 + 0.5;
    }
    update() {
      this.z -= 2;
      if (this.z <= 0) {
        this.reset();
        this.z = width;
      }
    }
    draw() {
      const x = (this.x - width / 2) * (width / this.z) + width / 2;
      const y = (this.y - height / 2) * (width / this.z) + height / 2;
      const radius = this.size * (width / this.z);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - this.z / width})`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    stars = [];
    const count = window.innerWidth < 768 ? 50 : 150;
    for (let i = 0; i < count; i++) stars.push(new Star());
  }

  function animate() {
    ctx.fillStyle = "#020813";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < stars.length; i++) {
      stars[i].update();
      stars[i].draw();
    }
    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", init);
  init();
  animate();
}

// --- App Navigation & Logic ---
const viewMap = {
  dashboard: document.getElementById("dashboard-view"),
  "scam-checker": document.getElementById("scam-checker-view"),
  "report-form": document.getElementById("report-form-view"),
  profile: document.getElementById("profile-view"),
};

function showView(viewId) {
  Object.values(viewMap).forEach((el) => {
    if (el) el.classList.add("view-hidden");
  });
  if (viewMap[viewId]) {
    viewMap[viewId].classList.remove("view-hidden");
  }
}

function bindNavigation() {
  document.querySelectorAll("[data-target]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = link.getAttribute("data-target");
      if (targetView === "report-form" && !currentUser) {
        document.getElementById("report-form-view").dataset.pending = "true";
        toggleAuthModal(true);
      } else if (targetView) {
        showView(targetView);
      }
    });
  });
}

function initAuth() {
  const saved = localStorage.getItem("scamshield_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (e) {
      currentUser = null;
      localStorage.removeItem("scamshield_user");
    }
  }
  updateAuthUI();
}

function setActiveButton(view) {
  document.querySelectorAll(".nav-btn, .nav-btn-mobile").forEach((btn) => {
    const active = btn.dataset.view === view;
    btn.classList.toggle("sidebar-active", active);
    btn.classList.toggle("text-slate-300", !active);
    btn.classList.toggle("text-white", active);
  });
}

function showView(view) {
  Object.entries(viewMap).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("view-hidden", key !== view);
  });
  setActiveButton(view);
  if (window.innerWidth < 1024) {
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) mobileMenu.style.display = "none";
  }
}

// --- Auth & Modal Logic ---
let currentUser = null;
let isSignupMode = false;
let dashboardPollInterval = null;

function initAuth() {
  const saved = localStorage.getItem("scamshield_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (e) {
      currentUser = null;
      localStorage.removeItem("scamshield_user");
    }
  }
  updateAuthUI();
}

function updateAuthUI() {
  const landingView = document.getElementById("landing-view");
  const appContainer = document.getElementById("app-container");
  const userInfo = document.getElementById("userInfoSidebar");
  const userName = document.getElementById("userNameDisplay");
  const authBtn = document.getElementById("authBtn");

  if (currentUser) {
    if (landingView) landingView.classList.add("view-hidden");
    if (appContainer) {
      appContainer.classList.remove("view-hidden");
      document.body.classList.add("dashboard-bg");
    }
    if (userInfo) userInfo.classList.remove("hidden");
    if (authBtn) authBtn.style.display = "none";
    if (userName) userName.textContent = currentUser.name || currentUser.email;

    if (!dashboardPollInterval) {
      loadDashboard();
      dashboardPollInterval = setInterval(loadDashboard, 3000);
    }
  } else {
    if (landingView) landingView.classList.remove("view-hidden");
    if (appContainer) {
      appContainer.classList.add("view-hidden");
      document.body.classList.remove("dashboard-bg");
    }
    if (userInfo) userInfo.classList.add("hidden");
    if (authBtn) authBtn.style.display = "block";

    if (dashboardPollInterval) {
      clearInterval(dashboardPollInterval);
      dashboardPollInterval = null;
    }
  }
}

// The fixed Modal Toggle function
function toggleAuthModal(show) {
  const modal = document.getElementById("authModal");
  if (!modal) return;

  if (show) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
    modal.style.opacity = "0";
    void modal.offsetWidth; // Force browser reflow
    modal.style.opacity = "1";
  } else {
    modal.style.opacity = "0";
    setTimeout(() => {
      modal.style.display = "none";
      modal.classList.add("hidden");
    }, 300);
    const errEl = document.getElementById("authError");
    if (errEl) errEl.classList.add("hidden");
  }
}

function switchAuthMode() {
  isSignupMode = !isSignupMode;
  document.getElementById("authTitle").textContent = isSignupMode ? "Create Account" : "Welcome Back";
  document.getElementById("authSubtitle").textContent = isSignupMode ? "Join ScamShield to report fraud" : "Sign in to your ScamShield account";
  document.getElementById("authNameGroup").classList.toggle("hidden", !isSignupMode);
  document.getElementById("authSubmitBtn").querySelector("span").textContent = isSignupMode ? "Sign Up" : "Sign In";
  document.getElementById("authToggleText").textContent = isSignupMode ? "Already have an account?" : "Don't have an account?";
  document.getElementById("authToggleBtn").textContent = isSignupMode ? "Sign in" : "Sign up";
  document.getElementById("authError").classList.add("hidden");
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("authName").value.trim();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const errBox = document.getElementById("authError");

  errBox.classList.add("hidden");
  const btn = document.getElementById("authSubmitBtn");
  btn.disabled = true;
  btn.style.opacity = "0.7";

  const endpoint = isSignupMode ? "/auth/signup" : "/auth/login";
  const payload = { email, password };
  if (isSignupMode) payload.name = name;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.detail || "Authentication failed");

    currentUser = data.user;
    currentUser.token = data.token;
    localStorage.setItem("scamshield_user", JSON.stringify(currentUser));

    updateAuthUI();
    toggleAuthModal(false);
    document.getElementById("authForm").reset();

    if (document.getElementById("report-form-view").dataset.pending === "true") {
      delete document.getElementById("report-form-view").dataset.pending;
      showView("report-form");
    }
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.style.opacity = "1";
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("scamshield_user");
  updateAuthUI();
  if (!document.getElementById("report-form-view").classList.contains("view-hidden")) {
    showView("dashboard");
  }
}

// --- Event Listeners binding ---
document.getElementById("landingSignInBtn")?.addEventListener("click", () => toggleAuthModal(true));
document.getElementById("closeAuthModal")?.addEventListener("click", () => toggleAuthModal(false));
document.getElementById("authToggleBtn")?.addEventListener("click", switchAuthMode);
document.getElementById("authForm")?.addEventListener("submit", handleAuthSubmit);
document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
document.getElementById("authBtn")?.addEventListener("click", () => toggleAuthModal(true));
// Bind the main Access Portal button safely
document.getElementById("accessPortalBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  toggleAuthModal(true);
});

document.getElementById("authModal")?.addEventListener("click", (e) => {
  if (e.target.id === "authModal") toggleAuthModal(false);
});

function bindNavigation() {
  document.querySelectorAll(".nav-btn, .nav-btn-mobile, .nav-cta").forEach((button) => {
    button.addEventListener("click", () => {
      const targetView = button.dataset.view;
      if (targetView === "report-form" && !currentUser) {
        document.getElementById("report-form-view").dataset.pending = "true";
        toggleAuthModal(true);
      } else if (targetView) {
        showView(targetView);
      }
    });
  });
}

document.getElementById("mobileMenuBtn")?.addEventListener("click", () => {
  const mobileMenu = document.getElementById("mobileMenu");
  if (!mobileMenu) return;
  mobileMenu.style.display = mobileMenu.style.display === "none" ? "block" : "none";
});

// --- Feature Implementations ---
function getFormValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function riskClasses(level) {
  const value = String(level || "").toUpperCase();
  if (value === "LOW") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  if (value === "MEDIUM") return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  if (value === "HIGH") return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
}

function badgeClasses(status) {
  const value = String(status || "").toLowerCase();
  if (value === "verified") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  if (value === "blacklisted") return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE}/dashboard`);
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.detail);

    const stats = payload.data?.stats || {};
    document.getElementById("stat-total-jobs").textContent = stats.total_jobs_analyzed ?? 0;
    document.getElementById("stat-scams-detected").textContent = stats.scams_detected ?? 0;
    document.getElementById("stat-verified-recruiters").textContent = stats.verified_recruiters ?? 0;
    document.getElementById("stat-total-reports").textContent = stats.total_reports ?? 0;
  } catch (error) {
    console.error("Dashboard Sync Failed", error);
  }
}

async function handleScamAnalysis(event) {
  event.preventDefault();
  const job_description = getFormValue("jobDescription");
  const job_url = getFormValue("jobUrl");
  const recruiter_email = getFormValue("recruiterEmail");
  if (!job_description || !job_url || !recruiter_email) return;

  const btn = document.getElementById("analyzeBtn");
  document.getElementById("analysisLoading").classList.remove("hidden");
  document.getElementById("analysisResult").classList.add("hidden");
  btn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description, job_url, recruiter_email }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.detail || "Analysis failed");

    const result = payload.data || {};
    document.getElementById("resultScore").textContent = result.scam_score ?? "0";

    const riskBadge = document.getElementById("resultRiskBadge");
    riskBadge.textContent = result.risk_level || "UNKNOWN";
    riskBadge.className = `px-4 py-2 rounded-full text-sm font-semibold ${riskClasses(result.risk_level)}`;

    const keywords = Array.isArray(result.suspicious_keywords) ? result.suspicious_keywords : [];
    document.getElementById("resultKeywords").textContent = keywords.length ? keywords.join(", ") : "None detected";
    document.getElementById("resultRecommendation").textContent = result.recommendation || "Review manually before applying.";
    document.getElementById("analysisResult").classList.remove("hidden");
  } catch (error) {
    document.getElementById("analysisResult").classList.remove("hidden");
    document.getElementById("resultScore").textContent = "—";
    const badge = document.getElementById("resultRiskBadge");
    badge.textContent = "ERROR";
    badge.className = "px-4 py-2 rounded-full text-sm font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30";
    document.getElementById("resultKeywords").textContent = error.message;
  } finally {
    document.getElementById("analysisLoading").classList.add("hidden");
    btn.disabled = false;
  }
}
document.getElementById("scamCheckerForm")?.addEventListener("submit", handleScamAnalysis);

async function handleRecruiterCheck() {
  const query = getFormValue("verificationQuery");
  if (!query) return;

  const params = new URLSearchParams();
  query.includes("@") ? params.set("email", query) : params.set("domain", query);

  try {
    const response = await fetch(`${API_BASE}/recruiter-check?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.detail || "Verification failed");

    const data = payload.data || {};
    document.getElementById("verificationTitle").textContent = data.company_name || "Recruiter Verification";
    document.getElementById("verificationMeta").textContent = [data.email, data.domain].filter(Boolean).join(" · ") || "No identity data returned";

    const badge = document.getElementById("verificationBadge");
    badge.textContent = data.status || "Suspicious";
    badge.className = `px-4 py-2 rounded-full text-sm font-semibold ${badgeClasses(data.badge || data.status)}`;
    document.getElementById("verificationReports").textContent = data.previous_reports ?? 0;
    document.getElementById("verificationTrust").textContent = data.trust_score ?? "—";
    document.getElementById("verificationReason").textContent = data.reason || "No note provided";
    document.getElementById("verificationResult").classList.remove("hidden");
  } catch (error) {
    document.getElementById("verificationResult").classList.remove("hidden");
    document.getElementById("verificationTitle").textContent = "Verification unavailable";
    document.getElementById("verificationMeta").textContent = error.message;
  }
}
document.getElementById("verifyRecruiterBtn")?.addEventListener("click", handleRecruiterCheck);

async function handleReportSubmit(event) {
  event.preventDefault();
  const payload = {
    company_name: getFormValue("reportCompanyName"),
    job_url: getFormValue("reportJobUrl"),
    scam_type: getFormValue("reportScamType"),
    description: getFormValue("reportDescription"),
  };

  const statusEl = document.getElementById("reportStatus");

  if (!payload.company_name || !payload.job_url || !payload.scam_type || !payload.description) {
    statusEl.textContent = "Please fill in every field before submitting.";
    statusEl.className = "rounded-2xl px-4 py-3 text-sm mt-4 bg-rose-500/15 text-rose-300 border border-rose-500/30 block";
    return;
  }
  if (!currentUser || !currentUser.token) {
    statusEl.textContent = "You must be logged in to report a scam.";
    statusEl.className = "rounded-2xl px-4 py-3 text-sm mt-4 bg-rose-500/15 text-rose-300 border border-rose-500/30 block";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.token}`
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.detail || "Report submission failed");

    statusEl.textContent = "Report submitted successfully.";
    statusEl.className = "rounded-2xl px-4 py-3 text-sm mt-4 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 block";
    document.getElementById("reportForm").reset();
    setTimeout(() => loadDashboard(), 1500);
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.className = "rounded-2xl px-4 py-3 text-sm mt-4 bg-rose-500/15 text-rose-300 border border-rose-500/30 block";
  }
}
document.getElementById("reportForm")?.addEventListener("submit", handleReportSubmit);

// --- ATS Resume Upload Logic ---
const resumeInput = document.getElementById("resumeUpload");
if (resumeInput) {
  resumeInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById("uploadFileName").textContent = file.name;
    document.getElementById("uploadFileName").classList.remove("hidden");
    document.getElementById("atsLoading").classList.remove("hidden");
    document.getElementById("atsResultPanel").classList.add("hidden");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/ats-analyze`, {
        method: "POST",
        headers: {
          "Authorization": currentUser ? `Bearer ${currentUser.token}` : ""
        },
        body: formData
      });
      const payload = await response.json();

      document.getElementById("atsLoading").classList.add("hidden");
      const resultPanel = document.getElementById("atsResultPanel");
      resultPanel.classList.remove("hidden");

      const data = payload.data || {};
      const score = data.overall_score || 0;
      const fmt = data.format_score || 0;
      const key = data.keyword_score || 0;
      const imp = data.impact_score || 0;
      const feedback = data.feedback || "ATS parsing complete.";

      setTimeout(() => {
        animateValue("atsScoreCircle", 0, score, 1500);
        document.getElementById("atsBarFormat").style.width = `${fmt}%`;
        document.getElementById("atsFmtVal").textContent = `${fmt}%`;
        document.getElementById("atsBarKeywords").style.width = `${key}%`;
        document.getElementById("atsKeyVal").textContent = `${key}%`;
        document.getElementById("atsBarImpact").style.width = `${imp}%`;
        document.getElementById("atsImpVal").textContent = `${imp}%`;
        document.getElementById("atsFeedbackText").textContent = feedback;
      }, 50);

    } catch (err) {
      document.getElementById("atsLoading").classList.add("hidden");
      document.getElementById("atsResultPanel").classList.remove("hidden");
      document.getElementById("atsFeedbackText").textContent = "Error parsing document. Backend might be unreachable.";
    }
  });
}

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// --- Initialization sequence ---
function initCustomCursor() {
  const cursor = document.getElementById("custom-cursor");
  if (!cursor) return;
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";
  });
  document.querySelectorAll(".interactive-hover").forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hovering"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hovering"));
  });
}

function initScrollAnimations() {
  const reveals = document.querySelectorAll(".reveal");
  const counters = document.querySelectorAll(".stat-counter");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
        if (entry.target.querySelector(".stat-counter")) {
          counters.forEach(counter => {
            if (counter.classList.contains("counted")) return;
            counter.classList.add("counted");
            const target = +counter.getAttribute("data-target");
            const step = Math.max(1, Math.floor(target / (2000 / 16)));
            let current = 0;
            const timer = setInterval(() => {
              current += step;
              if (current >= target) {
                counter.innerText = target.toLocaleString();
                clearInterval(timer);
              } else {
                counter.innerText = current.toLocaleString();
              }
            }, 16);
          });
        }
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(reveal => observer.observe(reveal));
}

// Boot up
initCustomCursor();
initScrollAnimations();
initParticles();
initAuth();
bindNavigation();
showView("dashboard");