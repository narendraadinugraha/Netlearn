// NetLearn - Main Application Controller (Stitch Architecture)
// CS302 Computer Networks Educational Platform & Virtual Lab
// Environment config loaded dynamically via .env

import { HOTS_QUESTIONS } from "./data/questions.js";
import { MATERIALS, getYouTubeEmbedUrl } from "./data/materials.js";
import { MANUAL_BOOK } from "./data/manual.js";
import { translations, getLang, setLang, t, applyI18nToDOM } from "./services/i18n.js";
import { BADGES, LEVELS, calculateLevel, sound } from "./services/gamification.js";
import { exportToWord, exportToCsv } from "./services/export.js";
import { renderTopicSimulation } from "./services/simulations.js";
import {
  CONFIG,
  loadEnvConfig,
  SQL_SCHEMA_SCRIPT,
  initSupabase,
  isUsingLiveSupabase,
  updateConfig,
  checkLiveSession,
  signUp,
  signIn,
  signInWithGoogle,
  updateUserProfile,
  signOut,
  getCurrentUser,
  saveTestResult,
  getUserResults,
  getAllStudentResults,
  saveUserProgress,
  getUserProgress,
  getVideos,
  addVideo,
  deleteVideo,
  updateTopicVideo,
  getMaterialsFromDb,
  saveMaterialToDb,
  deleteMaterialFromDb
} from "./services/supabase.js";

// ============================================================================
// Application State
// ============================================================================
export const state = {
  currentUser: getCurrentUser(), // strictly null if not logged in
  currentView: "dashboard",
  testState: null,
  soundMuted: false,
  theme: localStorage.getItem("netlearn_theme") || "light",
  userStats: {
    xp: 0,
    readMaterials: [],
    watchedVideos: [],
    unlockedBadges: [],
    results: []
  }
};

// ============================================================================
// Layout View Switcher: APK vs Dedicated Auth Screen
// ============================================================================
export function showAuthLayout(mode = "login") {
  const authScreen = document.getElementById("auth-screen");
  const appRoot = document.getElementById("app-root");
  if (appRoot) appRoot.style.display = "none";
  if (authScreen) {
    authScreen.style.display = "flex";
    renderAuth(authScreen, mode);
  }
}

export function showAppLayout() {
  const authScreen = document.getElementById("auth-screen");
  const appRoot = document.getElementById("app-root");
  if (authScreen) authScreen.style.display = "none";
  if (appRoot) appRoot.style.display = "flex";
}

export async function handleLogout() {
  await signOut();
  state.currentUser = null;
  state.userStats = {
    xp: 0,
    readMaterials: [],
    watchedVideos: [],
    unlockedBadges: [],
    results: []
  };

  // Close modals
  const modalsRoot = document.getElementById("modals-root");
  if (modalsRoot) modalsRoot.innerHTML = "";

  // Close mobile drawer
  document.getElementById("app-sidebar")?.classList.remove("mobile-open");
  document.getElementById("sidebar-backdrop")?.classList.remove("active");

  showAuthLayout("login");
  showToast(getLang() === "id" ? "Telah Keluar" : "Signed Out", getLang() === "id" ? "Semua tampilan ditutup. Silakan masuk kembali." : "All sessions closed. Please sign in again.", "logout");
}

// ============================================================================
// App Lifecycle & Initialization
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadEnvConfig();
  if (isUsingLiveSupabase()) {
    try {
      const liveUser = await checkLiveSession();
      state.currentUser = liveUser;
    } catch (e) {
      console.warn("Session restore error:", e);
      state.currentUser = null;
    }
  } else {
    state.currentUser = getCurrentUser();
  }

  applyTheme(state.theme);
  setupGlobalEvents();
  applyI18nToDOM();

  if (state.currentUser) {
    showAppLayout();
    await loadUserStats();
    updateHUD();
    updateNavUser();
    updateRoleAccess();
    if (state.currentUser.needsProfileCompletion || (state.currentUser.role === "student" && (!state.currentUser.className || state.currentUser.className.trim() === ""))) {
      showStudentProfileModal(state.currentUser);
    }
    const isTeacher = state.currentUser.role === "teacher" || state.currentUser.user?.user_metadata?.role === "teacher";
    navigateTo(isTeacher ? "admin" : "dashboard");
  } else {
    showAuthLayout("login");
  }
});

// ============================================================================
// Role-Based Menu Filtering (GURU vs SISWA)
// ============================================================================
function updateRoleAccess() {
  const adminNavBtn = document.getElementById("nav-btn-admin");
  const isTeacher = state.currentUser && (state.currentUser.role === "teacher" || state.currentUser.user?.user_metadata?.role === "teacher");

  if (adminNavBtn) {
    if (isTeacher) {
      adminNavBtn.style.display = "flex";
    } else {
      adminNavBtn.style.display = "none";
    }
  }
}

// ============================================================================
// Theme Management
// ============================================================================
function applyTheme(theme) {
  const html = document.documentElement;
  const themeIcon = document.getElementById("theme-icon");
  if (theme === "dark") {
    html.classList.add("dark");
    if (themeIcon) themeIcon.textContent = "dark_mode";
  } else {
    html.classList.remove("dark");
    if (themeIcon) themeIcon.textContent = "light_mode";
  }
}

// ============================================================================
// Gamification & Stats Storage
// ============================================================================
function getStorageKey(suffix) {
  const uid = state.currentUser ? state.currentUser.user.id : "guest";
  return `netlearn_${uid}_${suffix}`;
}

async function loadUserStats() {
  if (!state.currentUser) return;

  const savedXp = localStorage.getItem(getStorageKey("xp"));
  const savedMaterials = localStorage.getItem(getStorageKey("materials"));
  const savedVideos = localStorage.getItem(getStorageKey("videos"));
  const savedBadges = localStorage.getItem(getStorageKey("badges"));

  if (savedXp) state.userStats.xp = parseInt(savedXp, 10);
  if (savedMaterials) state.userStats.readMaterials = JSON.parse(savedMaterials);
  if (savedVideos) state.userStats.watchedVideos = JSON.parse(savedVideos);
  if (savedBadges) state.userStats.unlockedBadges = JSON.parse(savedBadges);

  // Auto-sync progress from Supabase in background
  try {
    const remoteProgress = await getUserProgress(state.currentUser.user.id);
    if (remoteProgress) {
      if (typeof remoteProgress.xp === "number" && remoteProgress.xp > state.userStats.xp) {
        state.userStats.xp = remoteProgress.xp;
      }
      if (Array.isArray(remoteProgress.readMaterials)) {
        state.userStats.readMaterials = Array.from(new Set([...state.userStats.readMaterials, ...remoteProgress.readMaterials]));
      }
      if (Array.isArray(remoteProgress.watchedVideos)) {
        state.userStats.watchedVideos = Array.from(new Set([...state.userStats.watchedVideos, ...remoteProgress.watchedVideos]));
      }
      if (Array.isArray(remoteProgress.unlockedBadges)) {
        state.userStats.unlockedBadges = Array.from(new Set([...state.userStats.unlockedBadges, ...remoteProgress.unlockedBadges]));
      }
    }
  } catch (err) {
    console.warn("Could not fetch remote progress from Supabase:", err);
  }

  try {
    const liveResults = await getUserResults(state.currentUser.user.id);
    if (liveResults && liveResults.length > 0) {
      state.userStats.results = liveResults;
    }
  } catch (err) {
    console.warn("Could not fetch remote results, fallback to local:", err);
  }

  evaluateBadges();
  updateHUD();
}

function saveUserStats() {
  if (!state.currentUser) return;
  localStorage.setItem(getStorageKey("xp"), state.userStats.xp);
  localStorage.setItem(getStorageKey("materials"), JSON.stringify(state.userStats.readMaterials));
  localStorage.setItem(getStorageKey("videos"), JSON.stringify(state.userStats.watchedVideos));
  localStorage.setItem(getStorageKey("badges"), JSON.stringify(state.userStats.unlockedBadges));

  // Auto-save silently to Supabase in backend
  saveUserProgress({
    userId: state.currentUser.user.id,
    xp: state.userStats.xp,
    readMaterials: state.userStats.readMaterials,
    watchedVideos: state.userStats.watchedVideos,
    unlockedBadges: state.userStats.unlockedBadges
  }).catch(err => console.warn("Supabase auto-save error:", err));
}

export function awardXP(amount, reason = "") {
  if (!state.currentUser) return;
  state.userStats.xp += amount;
  saveUserStats();
  updateHUD();
}

function evaluateBadges() {
  if (!state.currentUser) return;
  const newBadges = [];
  const currentBadges = new Set(state.userStats.unlockedBadges);

  const preResults = state.userStats.results.filter(r => r.type === "pre");
  const postResults = state.userStats.results.filter(r => r.type === "post");

  if (preResults.length > 0 && !currentBadges.has("first_step")) newBadges.push("first_step");
  if (state.userStats.readMaterials.length >= 6 && !currentBadges.has("avid_reader")) newBadges.push("avid_reader");
  if (state.userStats.watchedVideos.length >= 2 && !currentBadges.has("video_viewer")) newBadges.push("video_viewer");
  if (postResults.some(r => r.score >= 18) && !currentBadges.has("posttest_champ")) newBadges.push("posttest_champ");
  if (state.userStats.xp >= 1000 && !currentBadges.has("grandmaster")) newBadges.push("grandmaster");

  newBadges.forEach(badgeId => {
    currentBadges.add(badgeId);
    state.userStats.unlockedBadges = Array.from(currentBadges);
    saveUserStats();
  });
}

function updateHUD() {
  const isId = getLang() === "id";
  const titleEl = document.getElementById("hud-progress-title");
  const percentEl = document.getElementById("hud-progress-percent");
  const fillEl = document.getElementById("hud-progress-fill");
  const modulesEl = document.getElementById("hud-modules-done");
  const statusEl = document.getElementById("hud-status-label");

  // Calculate learning progress based on read materials and completed tests
  const totalModules = 6;
  const readCount = Math.min(totalModules, state.userStats.readMaterials.length);
  const testsCount = Math.min(2, state.userStats.results.length);
  // Weight: modules = 75%, evaluations = 25%
  const percent = Math.round(((readCount / totalModules) * 75) + ((testsCount / 2) * 25));

  if (titleEl) titleEl.textContent = isId ? "Progres Belajar" : "Learning Progress";
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (fillEl) fillEl.style.width = `${Math.max(4, percent)}%`;
  if (modulesEl) modulesEl.textContent = isId ? `${readCount}/${totalModules} Modul` : `${readCount}/${totalModules} Modules`;
  if (statusEl) {
    if (percent >= 100) {
      statusEl.textContent = isId ? "Tuntas" : "Completed";
      statusEl.className = "text-secondary font-bold";
    } else {
      statusEl.textContent = isId ? "Aktif" : "Active";
      statusEl.className = "text-on-surface-variant";
    }
  }
}

function updateNavUser() {
  const container = document.getElementById("nav-user-area");
  if (!container) return;

  if (state.currentUser) {
    const meta = state.currentUser.user?.user_metadata || {};
    const name = state.currentUser.name || meta.full_name || meta.name || (state.currentUser.user?.email ? state.currentUser.user.email.split("@")[0] : "Pengguna");
    const isTeacher = state.currentUser.role === "teacher" || meta.role === "teacher";
    const className = state.currentUser.className || meta.class_name || "";
    const roleText = isTeacher 
      ? (getLang() === "id" ? "Guru / Instruktur" : "Instructor / TA") 
      : (className ? `${getLang() === "id" ? "Siswa" : "Student"} • ${className}` : (getLang() === "id" ? "Siswa CS302" : "Student CS302"));

    container.innerHTML = `
      <div class="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity" id="sidebar-user-click" title="${getLang() === "id" ? "Buka Profil Pengguna" : "View Profile"}">
        <div class="w-8 h-8 rounded-full ${isTeacher ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs font-mono">
          ${name.charAt(0).toUpperCase()}
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-bold text-on-surface truncate leading-tight">${name}</span>
          <span class="text-[10px] text-on-surface-variant font-mono truncate leading-tight mt-0.5">${roleText}</span>
        </div>
      </div>
      <button class="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors cursor-pointer" id="btn-sidebar-logout" title="${t("navLogout")}">
        <span class="material-symbols-outlined text-[18px]">logout</span>
      </button>
    `;

    document.getElementById("sidebar-user-click")?.addEventListener("click", () => navigateTo("profile"));
    document.getElementById("btn-sidebar-logout")?.addEventListener("click", handleLogout);
  } else {
    container.innerHTML = `
      <button class="w-full py-2 px-3 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors shadow-xs cursor-pointer" id="btn-sidebar-login">
        <span class="material-symbols-outlined text-[16px]">login</span>
        <span>${t("navLogin")}</span>
      </button>
    `;
    document.getElementById("btn-sidebar-login")?.addEventListener("click", () => showAuthLayout("login"));
  }

  updateRoleAccess();
}

function updateDbStatusPill() {
  const pill = document.getElementById("db-status-pill");
  const dot = document.getElementById("db-status-dot");
  const text = document.getElementById("db-status-text");

  if (!pill) return;

  if (isUsingLiveSupabase()) {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-secondary";
    if (text) text.textContent = "Supabase Cloud";
    pill.title = `Terhubung ke Supabase Cloud (${CONFIG.PROJECT_REF || "Live"}) - Klik untuk konfigurasi`;
  } else {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-tertiary";
    if (text) text.textContent = "Mode Demo (Lokal)";
    pill.title = "Mode Demo Mandiri - Klik untuk menghubungkan Supabase";
  }
}

// ============================================================================
// Router & Navigation
// ============================================================================
export function navigateTo(viewName, params = {}) {
  sound.click();

  if (viewName === "videos") {
    viewName = "materials";
  }

  // If user is not authenticated, strictly show Auth Screen and hide APK
  if (!state.currentUser) {
    showAuthLayout(params.mode || "login");
    return;
  }

  if (viewName === "auth") {
    showAuthLayout(params.mode || "login");
    return;
  }

  // Ensure APK layout frame is visible
  showAppLayout();

  // Role Security Guard: Panel Guru hanya boleh diakses oleh Guru/Admin
  const isTeacher = state.currentUser && (state.currentUser.role === "teacher" || state.currentUser.user?.user_metadata?.role === "teacher");
  if (viewName === "admin" && !isTeacher) {
    showToast("Akses Ditolak", t("toastAccessDenied"), "lock");
    viewName = "dashboard";
  }

  state.currentView = viewName;

  // Active navigation button updates
  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  // Breadcrumbs title update
  const isId = getLang() === "id";
  const breadcrumbMap = {
    dashboard: isId ? "Ringkasan CS302" : "CS302 Overview",
    auth: isId ? "Autentikasi" : "Authentication",
    pretest: isId ? "Pretest Diagnostik" : "Diagnostic Pretest",
    posttest: isId ? "Posttest HOTS" : "HOTS Posttest",
    materials: isId ? "Modul & Materi" : "Materials & Modules",
    simulation: isId ? "Lab Simulasi & VLSM" : "Simulation Lab & VLSM",
    quizzes: isId ? "Kuis & Bank Soal" : "Quizzes & Bank",
    manual: isId ? "Buku Panduan & RFC" : "RFC Docs & Specs",
    admin: isId ? "Panel Guru" : "Teacher Console",
    profile: isId ? "Profil Pengguna" : "Student Profile",
    "posttest-results": isId ? "Hasil Evaluasi & Diagnostik" : "Assessment Results & Diagnostics"
  };

  const titleEl = document.getElementById("header-breadcrumb-title");
  if (titleEl) titleEl.textContent = breadcrumbMap[viewName] || "NetLearn CS302";

  // Close mobile drawer
  document.getElementById("app-sidebar")?.classList.remove("mobile-open");
  document.getElementById("sidebar-backdrop")?.classList.remove("active");

  const appView = document.getElementById("app-view");
  if (!appView) return;

  window.scrollTo({ top: 0, behavior: "smooth" });

  switch (viewName) {
    case "dashboard":
      renderDashboard(appView);
      break;
    case "auth":
      renderAuth(appView, params.mode || "login");
      break;
    case "materials":
      renderMaterials(appView);
      break;
    case "simulation":
      renderSimulation(appView);
      break;
    case "pretest":
      renderTestRunner(appView, "pre");
      break;
    case "posttest":
      renderTestRunner(appView, "post");
      break;
    case "posttest-results":
      renderResults(appView, params.result);
      break;
    case "quizzes":
      renderQuizzes(appView);
      break;
    case "admin":
      renderAdmin(appView);
      break;
    case "manual":
      renderManual(appView);
      break;
    case "profile":
      renderProfile(appView);
      break;
    default:
      renderDashboard(appView);
  }
}

// ============================================================================
// Global Event Handlers
// ============================================================================
function setupGlobalEvents() {
  document.getElementById("nav-brand")?.addEventListener("click", () => {
    navigateTo(state.currentUser ? "dashboard" : "auth");
  });

  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
    });
  });

  // Mobile menu open / close
  const mobileBtn = document.getElementById("mobile-menu-btn");
  const sidebar = document.getElementById("app-sidebar");
  const backdrop = document.getElementById("sidebar-backdrop");
  const closeBtn = document.getElementById("sidebar-close-btn");

  if (mobileBtn && sidebar && backdrop) {
    mobileBtn.addEventListener("click", () => {
      sidebar.classList.add("mobile-open");
      backdrop.classList.add("active");
    });
    backdrop.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("active");
    });
    closeBtn?.addEventListener("click", () => {
      sidebar.classList.remove("mobile-open");
      backdrop.classList.remove("active");
    });
  }

  // Language switch
  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const nextLang = getLang() === "id" ? "en" : "id";
      setLang(nextLang);
      document.getElementById("current-lang-label").textContent = nextLang.toUpperCase();
      applyI18nToDOM();
      updateNavUser();
      updateHUD();
      navigateTo(state.currentView);
      showToast(nextLang === "id" ? "Bahasa Diubah" : "Language Switched", nextLang === "id" ? "Tampilan antarmuka menggunakan Bahasa Indonesia." : "Interface switched to English.", "language");
    });
  }

  // Theme switch
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      state.theme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("netlearn_theme", state.theme);
      applyTheme(state.theme);
      showToast(
        state.theme === "light" ? (getLang() === "id" ? "Tema Terang Aktif" : "Light Mode Active") : (getLang() === "id" ? "Tema Gelap Aktif" : "Dark Mode Active"),
        state.theme === "light" ? (getLang() === "id" ? "Tampilan porselen bersih aktif" : "Switched to technical porcelain theme") : (getLang() === "id" ? "Tampilan gelap kontras tinggi aktif" : "Switched to high-contrast dark theme")
      );
    });
  }

  // Audio switch
  const soundBtn = document.getElementById("sound-toggle-btn");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      state.soundMuted = !state.soundMuted;
      sound.enabled = !state.soundMuted;
      const soundIcon = document.getElementById("sound-icon");
      if (soundIcon) {
        soundIcon.textContent = state.soundMuted ? "volume_off" : "volume_up";
      }
      showToast(state.soundMuted ? (getLang() === "id" ? "Audio Dinonaktifkan" : "Audio Muted") : (getLang() === "id" ? "Efek Suara Aktif" : "Audio FX Enabled"), "");
    });
  }



  // Global search input listener
  const searchInput = document.getElementById("global-search-input");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
          if (query.includes("subnet") || query.includes("cidr") || query.includes("vlsm") || query.includes("lab") || query.includes("simulasi")) {
            navigateTo("simulation");
          } else if (query.includes("rfc") || query.includes("spec") || query.includes("doc") || query.includes("panduan")) {
            navigateTo("manual");
          } else if (query.includes("pretest")) {
            navigateTo("pretest");
          } else if (query.includes("posttest")) {
            navigateTo("posttest");
          } else {
            navigateTo("materials");
          }
        }
      }
    });
  }
}

// ============================================================================
// Toast Notification Engine
// ============================================================================
export function showToast(title, message = "", iconName = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] text-primary-fixed">${iconName}</span>
    <div class="flex flex-col">
      <span class="font-bold text-xs text-white leading-tight">${title}</span>
      ${message ? `<span class="text-[11px] text-gray-300 leading-tight mt-0.5">${message}</span>` : ""}
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.2s ease";
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

// ============================================================================
// VIEW 1: AUTHENTICATION (Login & Register with Google SSO & Stitch Layout)
// ============================================================================
function renderAuth(container, mode = "login") {
  const isLogin = mode === "login";
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-5xl mx-auto my-4 sm:my-8 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] w-full">
      
      <!-- Left Column: Form -->
      <div class="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
        <div>
          <!-- Clean Brand Header -->
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-container to-primary text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 font-bold text-base">
              NL
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-bold text-on-surface tracking-tight leading-none">NetLearn</h1>
                <span class="text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-mono">CS302</span>
              </div>
              <p class="text-xs text-on-surface-variant mt-1">
                ${isLogin 
                  ? (isId ? "Masuk ke platform pembelajaran jaringan komputer." : "Sign in to computer networks learning platform.")
                  : (isId ? "Buat akun baru untuk memulai pembelajaran & praktikum." : "Create a new account to access courseware & virtual lab.")}
              </p>
            </div>
          </div>

          <!-- Primary Mode Selector: Masuk vs Daftar Baru -->
          <div class="flex items-center p-1 bg-surface-container-low rounded-xl mb-4 border border-outline-variant">
            <button 
              type="button" 
              class="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition-all auth-mode-tab cursor-pointer ${isLogin ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-outline hover:text-on-surface'}" 
              data-mode="login"
            >
              ${isId ? "Masuk ke Akun" : "Sign In"}
            </button>
            <button 
              type="button" 
              class="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition-all auth-mode-tab cursor-pointer ${!isLogin ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-outline hover:text-on-surface'}" 
              data-mode="register"
            >
              ${isId ? "Daftar Akun Baru" : "Register"}
            </button>
          </div>

          <!-- Role Switcher Toggle Pill -->
          <div class="flex items-center justify-between mb-4">
            <span class="text-[11px] font-mono text-outline font-semibold uppercase tracking-wider">${t("roleLabel")}:</span>
            <div class="p-0.5 bg-surface-container-low rounded-lg flex items-center text-xs font-semibold border border-outline-variant">
              <button type="button" class="py-1 px-3 rounded-md bg-surface-container-lowest text-primary shadow-xs font-bold text-center transition-all auth-role-btn active" data-role="student">
                ${t("roleStudentTab")}
              </button>
              <button type="button" class="py-1 px-3 rounded-md text-outline hover:text-on-surface text-center transition-all auth-role-btn" data-role="teacher">
                ${t("roleTeacherTab")}
              </button>
            </div>
          </div>

          <!-- Google SSO Button with Auto-Registration Hint -->
          <div class="mb-4">
            <button type="button" id="btn-google-login" class="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl border border-outline-variant shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>${isLogin ? t("googleSignIn") : (isId ? "Daftar Cepat dengan Akun Google" : "Quick Register with Google")}</span>
            </button>
            <p class="text-[10px] text-outline text-center mt-1.5 font-mono">
              ${isId ? "⚡ Akun otomatis terdaftar jika belum pernah dibuat" : "⚡ Automatically registers your account if not yet created"}
            </p>
          </div>

          <!-- Divider -->
          <div class="relative my-3 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-outline-variant"></div></div>
            <span class="relative bg-surface-container-lowest px-2.5 text-[10px] font-mono text-outline uppercase tracking-wider">${t("orDivider")}</span>
          </div>

          <!-- Form Element -->
          <form id="auth-form" class="space-y-3.5">
            ${!isLogin ? `
              <div>
                <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${t("nameLabel")} *</label>
                <input 
                  type="text" 
                  id="auth-name" 
                  placeholder="${isId ? "Nama Lengkap Siswa" : "Your Full Name"}"
                  class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white font-mono" 
                  required 
                />
              </div>
              <div id="student-class-field">
                <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Kelas / Jurusan Siswa *" : "Student Class *"}</label>
                <input 
                  type="text" 
                  id="auth-class" 
                  placeholder="${isId ? "Contoh: X TKJ 1 / XI RPL 2" : "e.g. 10th Grade TKJ 1"}"
                  class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white font-mono" 
                  required 
                />
                <span class="text-[10px] text-outline font-mono mt-0.5 block">${isId ? "Wajib diisi untuk rekapitulasi nilai guru" : "Required for teacher gradebook"}</span>
              </div>
              <div id="student-id-field">
                <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${t("studentIdLabel")}</label>
                <input 
                  type="text" 
                  id="auth-student-id" 
                  placeholder="${isId ? "Contoh: CS2025-08119 (Opsional)" : "e.g. CS2025-08119 (Optional)"}"
                  class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white font-mono" 
                />
              </div>
            ` : ""}

            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${t("emailLabel")} *</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">alternate_email</span>
                <input 
                  type="email" 
                  id="auth-email" 
                  placeholder="${isId ? "nama@email.com" : "user@email.com"}"
                  class="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white font-mono" 
                  required 
                />
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-on-surface font-mono">${t("passwordLabel")} *</label>
              </div>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">lock</span>
                <input 
                  type="password" 
                  id="auth-password" 
                  placeholder="••••••••"
                  class="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white font-mono" 
                  required 
                />
              </div>
            </div>

            <div id="teacher-code-field" class="hidden">
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${t("teacherCodeLabel")} *</label>
              <input 
                type="text" 
                id="auth-teacher-code" 
                placeholder="${CONFIG.TEACHER_CODE || 'GURU2026'}"
                class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface font-mono" 
              />
              <span class="text-[10px] text-outline font-mono mt-0.5 block">${t("teacherCodeHint")}</span>
            </div>

            <!-- Keep signed in -->
            <div class="flex items-center justify-between pt-1">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked class="w-3.5 h-3.5 rounded text-primary focus:ring-primary border-outline-variant accent-primary" />
                <span class="text-xs text-on-surface-variant font-medium">${isId ? "Ingat saya di perangkat ini" : "Remember me"}</span>
              </label>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="w-full py-3 px-4 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <span>${isLogin ? t("btnSignIn") : t("btnRegister")}</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </form>
        </div>

        <!-- Footer switch mode link -->
        <div class="pt-4 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant mt-4">
          <p>
            ${isLogin 
              ? (isId ? "Belum memiliki akun?" : "Don't have an account?") 
              : (isId ? "Sudah memiliki akun?" : "Already have an account?")}
          </p>
          <button 
            type="button" 
            id="btn-toggle-auth-footer" 
            class="font-bold text-primary hover:underline hover:text-primary-container cursor-pointer flex items-center gap-1"
          >
            <span>${isLogin ? (isId ? "Daftar Akun Baru" : "Register Now") : (isId ? "Masuk ke Akun" : "Sign In Now")}</span>
            <span class="material-symbols-outlined text-[15px]">arrow_forward</span>
          </button>
        </div>
      </div>

      <!-- Right Column: Minimalist Networking Lab Banner & Brief Overview -->
      <div class="hidden lg:flex lg:col-span-6 relative overflow-hidden flex-col justify-end p-8 sm:p-10 text-white min-h-[560px]">
        
        <!-- Authentic Laboratory Background Image -->
        <img 
          src="assets/images/login_banner.jpg" 
          alt="Computer Networking Workstation" 
          class="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-900/10"></div>

        <!-- Minimalist Glass Information Card -->
        <div class="relative z-10 bg-slate-900/75 backdrop-blur-md border border-white/15 p-5 rounded-2xl shadow-xl space-y-2">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-secondary"></span>
            <span class="text-[11px] font-mono font-semibold tracking-wider text-sky-300 uppercase">Akademi Jaringan Komputer CS302</span>
          </div>
          <h2 class="text-base font-bold text-white tracking-tight">
            ${isId ? "Laboratorium Virtual & Kurikulum Terpadu" : "Virtual Networking Lab & Curriculum"}
          </h2>
          <p class="text-xs text-slate-300 leading-relaxed font-sans">
            ${isId 
              ? "Platform pembelajaran interaktif untuk penguasaan arsitektur protokol jaringan, subnetting VLSM, dan praktikum simulasi secara mandiri."
              : "An interactive educational environment for mastering network protocols, VLSM subnetting, and hands-on simulation labs."}
          </p>
        </div>
      </div>
    </div>
  `;

  // Attach auth interactions
  let selectedRole = "student";
  const teacherCodeField = document.getElementById("teacher-code-field");

  container.querySelectorAll(".auth-role-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".auth-role-btn").forEach(b => {
        b.classList.remove("active", "bg-surface-container-lowest", "text-primary", "shadow-xs");
        b.classList.add("text-outline");
      });
      btn.classList.add("active", "bg-surface-container-lowest", "text-primary", "shadow-xs");
      btn.classList.remove("text-outline");
      selectedRole = btn.dataset.role;

      if (teacherCodeField) {
        const studentClassField = document.getElementById("student-class-field");
        if (selectedRole === "teacher") {
          teacherCodeField.classList.remove("hidden");
          if (studentClassField) studentClassField.classList.add("hidden");
        } else {
          teacherCodeField.classList.add("hidden");
          if (studentClassField) studentClassField.classList.remove("hidden");
        }
      }
    });
  });

  // Google Sign-In Handler
  document.getElementById("btn-google-login")?.addEventListener("click", async () => {
    sound.click();
    showToast(isId ? "Menghubungkan Akun Google..." : "Connecting Google Account...", "Supabase Auth Cloud", "sync");
    
    try {
      const res = await signInWithGoogle({ role: selectedRole });
      if (res && res.isRedirecting) {
        return;
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.message === "PROVIDER_NOT_ENABLED") {
        showGoogleNotEnabledModal();
      } else {
        showToast(
          isId ? "Google Login Belum Aktif" : "Google Login Unavailable",
          isId ? "Silakan mendaftar atau masuk menggunakan formulir email & kata sandi di bawah." : "Please register or sign in using email & password below.",
          "info"
        );
      }
    }
  });

  // Mode switch tabs (Masuk vs Daftar Baru)
  container.querySelectorAll(".auth-mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      sound.click();
      renderAuth(container, tab.dataset.mode);
    });
  });

  // Footer toggle link
  container.querySelector("#btn-toggle-auth-footer")?.addEventListener("click", () => {
    sound.click();
    renderAuth(container, isLogin ? "register" : "login");
  });

  // Fallback for anchor links if any
  container.querySelectorAll("a").forEach(a => {
    if (a.textContent.includes("Daftar") || a.textContent.includes("Register")) {
      a.addEventListener("click", (e) => { e.preventDefault(); renderAuth(container, "register"); });
    }
    if (a.textContent.includes("Masuk") || a.textContent.includes("Sign In")) {
      a.addEventListener("click", (e) => { e.preventDefault(); renderAuth(container, "login"); });
    }
  });

  // Form submit
  document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();
    const nameEl = document.getElementById("auth-name");
    const fullName = nameEl ? nameEl.value.trim() : email.split("@")[0];
    const classEl = document.getElementById("auth-class");
    const className = classEl ? classEl.value.trim() : "";
    const codeEl = document.getElementById("auth-teacher-code");
    const teacherCode = codeEl ? codeEl.value.trim() : "";
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!email || !password) {
      showToast(isId ? "Formulir Tidak Lengkap" : "Incomplete Form", isId ? "Silakan masukkan email dan kata sandi." : "Please enter email and password.", "warning");
      return;
    }

    if (!isLogin && selectedRole === "student" && !className) {
      showToast(isId ? "Kelas Wajib Diisi" : "Class is Required", isId ? "Silakan masukkan kelas Anda (contoh: X TKJ 1)." : "Please enter your class.", "warning");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-60");
    }

    try {
      let loggedUser;
      if (isLogin) {
        loggedUser = await signIn({ email, password });
      } else {
        loggedUser = await signUp({
          email,
          password,
          name: fullName,
          role: selectedRole,
          className,
          teacherCode
        });
      }

      state.currentUser = loggedUser;
      showAppLayout();
      await loadUserStats();
      updateNavUser();
      updateRoleAccess();
      updateHUD();

      if (loggedUser.needsProfileCompletion || (loggedUser.role === "student" && (!loggedUser.className || loggedUser.className.trim() === ""))) {
        showStudentProfileModal(loggedUser);
      }

      const targetView = (state.currentUser.role === "teacher" || state.currentUser.user?.user_metadata?.role === "teacher") ? "admin" : "dashboard";
      navigateTo(targetView);
      showToast(isLogin ? (isId ? "Selamat Datang Kembali!" : "Welcome Back!") : (isId ? "Akun Berhasil Didaftarkan!" : "Account Registered!"), `${isId ? "Masuk sebagai" : "Logged in as"} ${loggedUser.name || fullName}`, "check_circle");
    } catch (err) {
      console.error("Auth error:", err);
      showToast(isLogin ? (isId ? "Gagal Masuk" : "Login Failed") : (isId ? "Gagal Mendaftar" : "Registration Failed"), err.message || (isId ? "Periksa kembali email dan kata sandi Anda." : "Check your email and password."), "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-60");
      }
    }
  });
}

// ============================================================================
// VIEW 2: STUDENT DASHBOARD (Stitch student_dashboard_computer_networks_redesigned)
// ============================================================================
function renderDashboard(container) {
  const meta = state.currentUser?.user?.user_metadata || {};
  const studentName = meta.full_name || "Aditya Sharma";
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="flex flex-col space-y-6 max-w-7xl mx-auto w-full">
      
      <!-- Minimalist Course & Welcome Header -->
      <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5 max-w-2xl">
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">CS302 Networks</span>
            <span class="text-xs text-on-surface-variant font-mono">• ${isId ? "Semester Genap 2025" : "Spring Term 2025"}</span>
          </div>
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
            ${isId ? `Selamat Datang, ${state.currentUser?.name || studentName}` : `Welcome, ${state.currentUser?.name || studentName}`}
          </h1>
          <p class="text-xs text-on-surface-variant leading-relaxed">
            ${isId ? "Akses silabus kurikulum, simulator lab CLI & VLSM, serta pantau evaluasi kognitif Anda." : "Access curriculum modules, CLI & VLSM lab simulators, and track your evaluation progress."}
          </p>
        </div>
        <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button class="h-9 px-4 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs" id="btn-hero-continue">
            <span class="material-symbols-outlined text-[18px]">play_circle</span>
            <span>${isId ? "Lanjutkan Modul" : "Continue Learning"}</span>
          </button>
          <button class="h-9 px-3.5 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-medium text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer" id="btn-hero-lab">
            <span class="material-symbols-outlined text-[18px] text-primary">terminal</span>
            <span>${isId ? "Buka Lab" : "Simulation Lab"}</span>
          </button>
          <button class="h-9 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-mono text-xs rounded-xl border border-outline-variant flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-dash-syllabus" title="Unduh Silabus">
            <span class="material-symbols-outlined text-[16px] text-outline">file_download</span>
            <span>Silabus</span>
          </button>
        </div>
      </div>

      <!-- Top 4 Metrics Row (Clean Minimalist Cards) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Metric 1: Module Completion -->
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant">
            <span class="text-xs font-mono uppercase tracking-wider text-outline font-semibold">${isId ? "Penyelesaian Modul" : "Module Progress"}</span>
            <span class="material-symbols-outlined text-[20px] text-primary">pie_chart</span>
          </div>
          <div class="my-2.5">
            <div class="text-2xl font-bold text-on-surface tracking-tight">
              4 <span class="text-outline font-normal text-sm">/ 6 ${isId ? "Modul" : "Modules"}</span>
            </div>
            <div class="text-xs font-mono text-outline mt-0.5">${isId ? "66% Materi Selesai" : "66% Completed"}</div>
          </div>
          <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div class="bg-primary h-full rounded-full" style="width: 66.6%;"></div>
          </div>
        </div>

        <!-- Metric 2: Benchmark Delta -->
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant">
            <span class="text-xs font-mono uppercase tracking-wider text-outline font-semibold">${isId ? "Nilai Evaluasi" : "Assessment Score"}</span>
            <span class="material-symbols-outlined text-[20px] text-secondary">trending_up</span>
          </div>
          <div class="my-2.5">
            <div class="text-2xl font-bold text-on-surface tracking-tight">
              88 <span class="text-outline font-normal text-sm">/ 100</span>
              <span class="text-xs font-mono text-secondary ml-1.5 font-bold">+20%</span>
            </div>
            <div class="text-xs font-mono text-outline mt-0.5">${isId ? "Hasil HOTS Posttest" : "HOTS Posttest Score"}</div>
          </div>
          <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div class="bg-secondary h-full rounded-full" style="width: 88%;"></div>
          </div>
        </div>

        <!-- Metric 3: Lab Terminal Scenarios -->
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant">
            <span class="text-xs font-mono uppercase tracking-wider text-outline font-semibold">${isId ? "Lab Simulasi" : "Lab Terminal"}</span>
            <span class="material-symbols-outlined text-[20px] text-primary">dns</span>
          </div>
          <div class="my-2.5">
            <div class="text-2xl font-bold text-on-surface tracking-tight">
              14 <span class="text-outline font-normal text-sm">${isId ? "Lulus" : "Completed"}</span>
            </div>
            <div class="text-xs font-mono text-outline mt-0.5">${isId ? "OSPF, RIP & VLSM" : "OSPF, RIP & VLSM"}</div>
          </div>
          <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div class="bg-primary h-full rounded-full" style="width: 70%;"></div>
          </div>
        </div>

        <!-- Metric 4: Cadence & Streak -->
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-on-surface-variant">
            <span class="text-xs font-mono uppercase tracking-wider text-outline font-semibold">${isId ? "Keaktifan" : "Activity"}</span>
            <span class="material-symbols-outlined text-[20px] text-amber-500">bolt</span>
          </div>
          <div class="my-2.5">
            <div class="text-2xl font-bold text-on-surface tracking-tight">
              5 <span class="text-outline font-normal text-sm">${isId ? "Hari Beruntun" : "Days Active"}</span>
            </div>
            <div class="text-xs font-mono text-outline mt-0.5">${isId ? "Sesi Aktif Pekan Ini" : "Active this week"}</div>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-2.5 h-2.5 rounded-xs bg-primary"></div>
            <div class="w-2.5 h-2.5 rounded-xs bg-primary"></div>
            <div class="w-2.5 h-2.5 rounded-xs bg-primary"></div>
            <div class="w-2.5 h-2.5 rounded-xs bg-primary"></div>
            <div class="w-2.5 h-2.5 rounded-xs bg-primary"></div>
            <div class="w-2.5 h-2.5 rounded-xs bg-surface-container-high"></div>
            <div class="w-2.5 h-2.5 rounded-xs bg-surface-container-high"></div>
          </div>
        </div>
      </div>

      <!-- Main 70/30 Grid (Stitch Architecture) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left 70% Column (approx 8 cols) -->
        <div class="lg:col-span-8 space-y-6">
          
          <!-- In-Progress Module Workbench Card (Module 03 VLSM & Terminal) -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs overflow-hidden">
            <div class="p-4 bg-surface-container-low border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-primary text-on-primary font-mono text-xs rounded font-bold">MODUL 03</span>
                <span class="font-mono text-xs text-on-surface-variant">RFC 4632 • Classless Inter-Domain Routing</span>
              </div>
              <span class="font-mono text-xs text-secondary font-semibold">ID Sesi: #CLI-8820</span>
            </div>

            <div class="p-5 space-y-4">
              <div>
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-bold text-on-surface">${isId ? "Pengalamatan IP & Arsitektur Variable Length Subnet Mask (VLSM)" : "IP Addressing & Variable Length Subnet Masking (VLSM)"}</h2>
                  <span class="text-xs font-mono font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded">65% ${isId ? "SELESAI" : "COMPLETED"}</span>
                </div>
                <p class="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  ${isId ? "Fokus Aktif: <strong class=\"text-on-surface font-semibold\">Materi 3.3 — Ringkasan Rute Rekursif & Alokasi Subnet.</strong> Konfigurasi router egress interface pada batas CIDR /27 dan /28." : "Active Focus: <strong class=\"text-on-surface font-semibold\">Lesson 3.3 — Recursive Route Summarization & Allocation.</strong> Configuring router egress interfaces under overlapping /27 and /28 CIDR boundaries."}
                </p>
              </div>

              <!-- Interactive VT-100 Micro Terminal Preview -->
              <div class="terminal-window">
                <div class="terminal-header">
                  <div class="terminal-dots">
                    <span class="terminal-dot red"></span>
                    <span class="terminal-dot yellow"></span>
                    <span class="terminal-dot green"></span>
                  </div>
                  <span class="font-mono">netlearn-edge01# ip route show vrf student-sandbox</span>
                  <span class="text-[10px] font-mono text-gray-400">VT-100</span>
                </div>
                <div class="terminal-body font-mono text-xs">
                  <span class="text-gray-400">10.14.0.0/16 is variably subnetted, 4 subnets, 2 masks</span><br>
                  <span class="text-sky-300">C    10.14.32.0/27 is directly connected, GigabitEthernet0/0/0</span><br>
                  <span class="text-sky-300">L    10.14.32.1/32 is directly connected, GigabitEthernet0/0/0</span><br>
                  <span class="text-emerald-400">O    10.14.64.0/28 [110/2] via 192.168.10.2, 00:04:12, GigabitEthernet0/0/1</span><br>
                  <div class="mt-2 text-white flex items-center gap-1">
                    <span class="terminal-prompt">netlearn-edge01#</span>
                    <span class="text-gray-200">show ip ospf neighbor</span>
                    <span class="terminal-cursor"></span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <button class="h-9 px-4 bg-primary hover:bg-primary-container text-on-primary text-xs font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer" id="btn-resume-lab">
                  <span class="material-symbols-outlined text-[16px]">terminal</span>
                  <span>${isId ? "Lanjutkan Lab CLI" : "Resume Lab CLI"}</span>
                  <span class="px-1 py-0.2 bg-white/20 rounded font-mono text-[10px]">↵ Enter</span>
                </button>
                <button class="h-9 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-mono rounded-lg border border-outline-variant flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-read-rfc">
                  <span class="material-symbols-outlined text-[16px] text-outline">description</span>
                  <span>${isId ? "Baca RFC 1878" : "Read RFC 1878 Spec"}</span>
                </button>
                <button class="h-9 px-3 text-on-surface-variant hover:text-on-surface text-xs font-mono rounded-lg flex items-center gap-1 transition-colors ml-auto cursor-pointer" id="btn-view-all-modules">
                  <span>${isId ? "Lihat Silabus Lengkap" : "View Full Syllabus"}</span>
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Curriculum Modules Matrix (6 Modules - Exact Stitch Component) -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs overflow-hidden">
            <div class="p-4 flex items-center justify-between bg-surface-container-low border-b border-outline-variant">
              <div>
                <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Matriks Modul Kurikulum" : "Curriculum Modules Matrix"}</h3>
                <p class="text-[11px] font-mono text-outline">${isId ? "SEMESTER GENAP 2025 • STANDAR AKADEMIK" : "SPRING 2025 TERM • ACCREDITED TRACK"}</p>
              </div>
              <span class="text-xs font-mono text-on-surface-variant font-medium">${isId ? "Registri Status" : "Status Registry"}</span>
            </div>

            <div class="divide-y divide-outline-variant text-xs">
              
              <!-- MOD 01 -->
              <div class="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[11px] text-outline">MOD-01</span>
                      <span class="font-semibold text-on-surface truncate">${isId ? "Pengantar Jaringan, Klasifikasi & Topologi" : "Physical Layer, Fiber Topologies & Encoding"}</span>
                    </div>
                    <div class="font-mono text-[11px] text-outline">${isId ? "8 Praktikum • Selesai 12 Feb • Skor: 96%" : "8 Labs • Completed Feb 12 • Score: 96%"}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="hidden sm:inline font-mono text-[11px] text-outline">14j belajar</span>
                  <button class="h-7 px-2.5 bg-surface-container-low text-on-surface font-mono text-xs rounded border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer mod-review-btn" data-mod="1">${isId ? "Tinjau" : "Review"}</button>
                </div>
              </div>

              <!-- MOD 02 -->
              <div class="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[11px] text-outline">MOD-02</span>
                      <span class="font-semibold text-on-surface truncate">${isId ? "Perangkat Keras Jaringan, Switch, Router & ARP" : "Data Link Layer, Ethernet Framing & ARP"}</span>
                    </div>
                    <div class="font-mono text-[11px] text-outline">${isId ? "10 Praktikum • Selesai 26 Feb • Skor: 91%" : "10 Labs • Completed Feb 26 • Score: 91%"}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="hidden sm:inline font-mono text-[11px] text-outline">18j belajar</span>
                  <button class="h-7 px-2.5 bg-surface-container-low text-on-surface font-mono text-xs rounded border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer mod-review-btn" data-mod="2">${isId ? "Tinjau" : "Review"}</button>
                </div>
              </div>

              <!-- MOD 03 (Active) -->
              <div class="p-4 flex items-center justify-between bg-surface-container-low/60">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    03
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[11px] text-secondary font-bold">${isId ? "AKTIF" : "ACTIVE"}</span>
                      <span class="font-bold text-on-surface truncate">${isId ? "Pengalamatan IP, Subnetting & Arsitektur VLSM" : "IP Addressing, Subnetting & VLSM Architecture"}</span>
                    </div>
                    <div class="font-mono text-[11px] text-outline">${isId ? "6 dari 10 Lab Selesai • Sedang Berjalan" : "6 of 10 Labs Complete • In Progress"}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="hidden sm:inline font-mono text-[11px] text-secondary font-bold">65% Progress</span>
                  <button class="h-7 px-3 bg-primary text-on-primary font-mono text-xs rounded hover:bg-primary-container transition-colors cursor-pointer mod-resume-btn" data-mod="3">${isId ? "Lanjutkan" : "Resume"}</button>
                </div>
              </div>

              <!-- MOD 04 -->
              <div class="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-surface-container-high text-outline flex items-center justify-center shrink-0 font-mono text-xs">
                    04
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[11px] text-outline">MOD-04</span>
                      <span class="font-semibold text-on-surface truncate">${isId ? "Protokol Routing: Distance Vector vs Link-State" : "Routing Protocols: Distance Vector vs Link-State"}</span>
                    </div>
                    <div class="font-mono text-[11px] text-outline">${isId ? "Tersedia pratinjau • Prasyarat MOD-03" : "Open for preview • Prerequisite MOD-03"}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="px-2 py-0.5 bg-surface-container text-on-surface font-mono text-[10px] rounded">${isId ? "TERSEDIA" : "AVAILABLE"}</span>
                  <button class="h-7 px-2.5 bg-surface-container-low text-on-surface font-mono text-xs rounded border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer mod-review-btn" data-mod="4">${isId ? "Buka" : "Open"}</button>
                </div>
              </div>

              <!-- MOD 05 -->
              <div class="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-surface-container-high text-outline flex items-center justify-center shrink-0 font-mono text-xs">
                    05
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[11px] text-outline">MOD-05</span>
                      <span class="font-semibold text-on-surface truncate">${isId ? "Media Transmisi, Kabel & Standar Crimping UTP" : "Transmission Media, Cables & Crimping Standards"}</span>
                    </div>
                    <div class="font-mono text-[11px] text-outline">T568A vs T568B • Redaman Kabel UTP</div>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <button class="h-7 px-2.5 bg-surface-container-low text-on-surface font-mono text-xs rounded border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer mod-review-btn" data-mod="5">${isId ? "Buka" : "Open"}</button>
                </div>
              </div>

              <!-- MOD 06 -->
              <div class="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-lg bg-surface-container-high text-outline flex items-center justify-center shrink-0 font-mono text-xs">
                    06
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-[11px] text-outline">MOD-06</span>
                      <span class="font-semibold text-on-surface truncate">${isId ? "Model Referensi OSI 7 Layer & Protokol TCP/IP" : "OSI 7 Layers & TCP/IP Protocol Analysis"}</span>
                    </div>
                    <div class="font-mono text-[11px] text-outline">${isId ? "Enkapsulasi & Dekapsulasi Paket Data" : "Packet Header Decapsulation Diagnostics"}</div>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <button class="h-7 px-2.5 bg-surface-container-low text-on-surface font-mono text-xs rounded border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer mod-review-btn" data-mod="6">${isId ? "Buka" : "Open"}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right 30% Column (approx 4 cols) -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- Benchmark & Normalized Gain Diagnostics Card -->
          <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Diagnostik Psikometrik" : "Psychometric Diagnostics"}</h3>
              <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold">Hake g = 0.58</span>
            </div>

            <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant space-y-2">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-on-surface-variant font-medium">${isId ? "Garis Dasar Pretest" : "Diagnostic Baseline"}</span>
                <span class="text-primary font-bold">68%</span>
              </div>
              <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div class="bg-primary h-full rounded-full" style="width: 68%;"></div>
              </div>
              <div class="flex items-center justify-between text-xs font-mono pt-1">
                <span class="text-on-surface-variant font-medium">${isId ? "Nilai Akhir Posttest" : "HOTS Posttest Score"}</span>
                <span class="text-secondary font-bold">88%</span>
              </div>
              <div class="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div class="bg-secondary h-full rounded-full" style="width: 88%;"></div>
              </div>
            </div>

            <!-- Cognitive Levels Distribution -->
            <div class="space-y-2 pt-1 text-xs">
              <span class="block text-[11px] font-mono text-outline uppercase font-semibold">${isId ? "Distribusi Kemampuan Kognitif (HOTS)" : "Cognitive Skill Breakdown (Bloom HOTS)"}</span>
              
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-on-surface">C4 Analisis (Subnetting)</span>
                <span class="font-bold text-secondary">92%</span>
              </div>
              <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div class="bg-secondary h-full rounded-full" style="width: 92%;"></div>
              </div>

              <div class="flex items-center justify-between text-xs font-mono pt-1">
                <span class="text-on-surface">C5 Sintesis (Routing OSPF)</span>
                <span class="font-bold text-primary">78%</span>
              </div>
              <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div class="bg-primary h-full rounded-full" style="width: 78%;"></div>
              </div>

              <div class="flex items-center justify-between text-xs font-mono pt-1">
                <span class="text-on-surface">C6 Evaluasi (Troubleshooting)</span>
                <span class="font-bold text-tertiary">85%</span>
              </div>
              <div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div class="bg-tertiary h-full rounded-full" style="width: 85%;"></div>
              </div>
            </div>

            <button class="w-full py-2 bg-surface-container-low hover:bg-surface-container text-primary font-mono text-xs font-bold rounded-lg border border-outline-variant transition-colors flex items-center justify-center gap-1.5 cursor-pointer" id="btn-view-diagnostic-report">
              <span>${isId ? "Lihat Laporan Diagnostik Lengkap" : "View Full Psychometric Report"}</span>
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <!-- Quick Virtual Lab Utilities Card -->
          <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs space-y-3">
            <h3 class="text-xs font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Peralatan Laboratorium Virtual" : "Interactive Lab Tools"}</h3>
            
            <div class="grid grid-cols-1 gap-2">
              <button class="p-3 bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant flex items-center gap-3 transition-colors text-left cursor-pointer" id="btn-tool-subnet">
                <div class="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">calculate</span>
                </div>
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-on-surface">${isId ? "Kalkulator Subnetting VLSM" : "VLSM Subnet Calculator"}</span>
                  <span class="block text-[11px] text-on-surface-variant font-mono">${isId ? "Alokasi prefix CIDR & rincian bit" : "CIDR prefix allocation & binary bits"}</span>
                </div>
              </button>

              <button class="p-3 bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant flex items-center gap-3 transition-colors text-left cursor-pointer" id="btn-tool-topology">
                <div class="w-9 h-9 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">hub</span>
                </div>
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-on-surface">${isId ? "Simulator Topologi 3D" : "3D Topology Simulator"}</span>
                  <span class="block text-[11px] text-on-surface-variant font-mono">${isId ? "Simulasi jejak ping Three.js" : "Packet ping trace in Three.js"}</span>
                </div>
              </button>

              <button class="p-3 bg-surface-container-low hover:bg-surface-container rounded-lg border border-outline-variant flex items-center gap-3 transition-colors text-left cursor-pointer" id="btn-tool-pretest">
                <div class="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-[20px]">quiz</span>
                </div>
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-on-surface">${isId ? "Pretest Diagnostik" : "Diagnostic Pretest"}</span>
                  <span class="block text-[11px] text-on-surface-variant font-mono">25 Soal Cerita Kasus HOTS</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Dashboard events
  document.getElementById("btn-hero-continue")?.addEventListener("click", () => navigateTo("materials"));
  document.getElementById("btn-hero-lab")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-dash-sandbox")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-resume-lab")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-view-all-modules")?.addEventListener("click", () => navigateTo("materials"));
  document.getElementById("btn-read-rfc")?.addEventListener("click", () => navigateTo("manual"));
  document.getElementById("btn-view-diagnostic-report")?.addEventListener("click", () => navigateTo("posttest-results"));
  document.getElementById("btn-tool-subnet")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-tool-topology")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-tool-pretest")?.addEventListener("click", () => navigateTo("pretest"));

  document.getElementById("btn-dash-syllabus")?.addEventListener("click", () => {
    exportToWord("Silabus_Jaringan_Komputer_CS302", "Silabus Jaringan Komputer CS302", `
      <h1>Silabus Jaringan Komputer (CS302)</h1>
      <p>Dosen Pengampu: Dr. Sarah Jenkins</p>
      <h2>Rincian Modul Kurikulum</h2>
      <ul>
        <li>MOD-01: Pengantar Jaringan, Klasifikasi & Topologi</li>
        <li>MOD-02: Perangkat Keras Jaringan, Switch, Router & ARP</li>
        <li>MOD-03: Pengalamatan IP, Subnetting & Arsitektur VLSM</li>
        <li>MOD-04: Protokol Routing: Distance Vector vs Link-State</li>
        <li>MOD-05: Media Transmisi, Kabel & Standar Crimping UTP</li>
        <li>MOD-06: Model Referensi OSI 7 Layer & Protokol TCP/IP</li>
      </ul>
      <p>Instrumen Evaluasi: 25 Butir Soal Cerita HOTS Teruji.</p>
    `);
    showToast(isId ? "Silabus Diekspor" : "Syllabus Exported", isId ? "Dokumen Word silabus berhasil diunduh." : "Word document generated.", "download");
  });

  container.querySelectorAll(".mod-review-btn, .mod-resume-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const modId = parseInt(btn.dataset.mod, 10);
      openMaterialModal(modId);
    });
  });
}

// ============================================================================
// VIEW 3: COURSE MATERIALS & MODULES (Stitch netlearn_course_materials_modules)
// ============================================================================
function renderMaterials(container) {
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-6 w-full">
      
      <!-- Materials Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>${isId ? "Portal Akademik" : "Academic Portal"}</span>
            <span class="text-outline-variant">/</span>
            <span>CS302 Networks</span>
            <span class="text-outline-variant">/</span>
            <span class="text-on-surface font-semibold">${isId ? "Materi & Modul" : "Course Materials"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${t("materialsTitle")}</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">${t("materialsSubtitle")}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="h-9 px-3.5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-export-all-materials">
            <span class="material-symbols-outlined text-[16px]">file_download</span>
            <span>${t("btnDownloadAllDocs")}</span>
          </button>
        </div>
      </div>

      <!-- Modules Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="modules-cards-grid">
        ${MATERIALS.map(m => {
          const isRead = state.userStats.readMaterials.includes(m.id);
          const isWatched = state.userStats.watchedVideos.includes(m.id);

          return `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs p-5 flex flex-col justify-between hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-2xl">${m.icon}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-full font-mono text-[10px] ${isRead ? "bg-secondary-container text-on-secondary-container font-bold" : "bg-slate-100 text-slate-600"}">
                      ${isRead ? (isId ? "Selesai" : "Completed") : (isId ? "Belum Dibaca" : "Not Read")}
                    </span>
                    <span class="px-2 py-0.5 rounded-full font-mono text-[10px] bg-blue-50 text-primary border border-blue-100">
                      ${m.readTime}
                    </span>
                  </div>
                </div>

                <div class="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary mb-1">
                  ${m.category}
                </div>

                <h3 class="text-base font-bold text-on-surface leading-snug mb-1.5">
                  ${isId ? m.title_id : m.title_en}
                </h3>
                <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-4">
                  ${isId ? m.summary_id : m.summary_en}
                </p>
              </div>

              <div class="pt-4 border-t border-outline-variant space-y-2">
                <div class="flex items-center justify-between text-xs font-mono text-outline">
                  <span>${isId ? "Video Kuliah:" : "Lecture Video:"}</span>
                  <span class="${isWatched ? "text-secondary font-semibold" : ""}">${isWatched ? (isId ? "Sudah Ditonton" : "Watched") : m.video.duration}</span>
                </div>

                <div class="grid grid-cols-2 gap-2 pt-1">
                  <button class="h-8 px-2 bg-primary hover:bg-primary-container text-on-primary font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer open-material-btn shadow-xs" data-id="${m.id}">
                    <span class="material-symbols-outlined text-[15px]">menu_book</span>
                    <span>${isId ? "Baca Modul" : "Read"}</span>
                  </button>
                  <button class="h-8 px-2 bg-blue-50/70 hover:bg-blue-100 text-primary font-medium text-xs rounded-lg border border-blue-200/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer open-video-btn" data-id="${m.id}">
                    <span class="material-symbols-outlined text-[15px]">play_circle</span>
                    <span>${isId ? "Tonton Video" : "Video"}</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  container.querySelectorAll(".open-material-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      openMaterialModal(id);
    });
  });

  container.querySelectorAll(".open-video-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id, 10);
      openVideoModal(id);
    });
  });

  document.getElementById("btn-export-all-materials")?.addEventListener("click", () => {
    let fullHtml = `<h1>Silabus Lengkap Jaringan Komputer CS302</h1>`;
    MATERIALS.forEach(m => {
      fullHtml += `
        <hr/>
        <h2>${isId ? m.title_id : m.title_en}</h2>
        <p><strong>Kategori:</strong> ${m.category}</p>
        <div>${isId ? m.content_id : m.content_en}</div>
      `;
    });
    exportToWord("Silabus_Lengkap_Jaringan_Komputer", "Silabus Lengkap Jaringan Komputer CS302", fullHtml);
    showToast("Mengunduh Semua Modul", "Seluruh modul pembelajaran diekspor ke Word.", "file_download");
  });
}

// ============================================================================
// VIEW 4: SIMULATION LAB & SUBNET CALCULATOR (Stitch interactive_network_lab)
// ============================================================================
function renderSimulation(container) {
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-6 w-full">
      
      <!-- Simulation Lab Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>${isId ? "Portal Akademik" : "Academic Portal"}</span>
            <span class="text-outline-variant">/</span>
            <span>CS302 Networks</span>
            <span class="text-outline-variant">/</span>
            <span class="text-on-surface font-semibold">${isId ? "Lab Simulasi" : "Simulation Lab"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${isId ? "Lab Simulasi Jaringan & Kalkulator Subnetting VLSM" : "Interactive Network Lab & Subnet Calculator"}</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">${isId ? "Engine perhitungan subnetting VLSM dinamis, perincian bit biner, dan visualisasi topologi Three.js 3D interaktif." : "Classless Inter-Domain Routing (CIDR), VLSM allocation engine, and real-time Three.js topology visualization."}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-fixed text-on-secondary-fixed rounded-lg text-xs font-mono font-bold">
            <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Simulator Engine v2.4
          </span>
        </div>
      </div>

      <!-- Two-Tab Switcher -->
      <div class="flex items-center gap-2 border-b border-outline-variant pb-2">
        <button class="px-4 py-2 bg-primary text-on-primary font-mono text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 sim-tab-btn active cursor-pointer" data-tab="subnet">
          <span class="material-symbols-outlined text-[16px]">calculate</span>
          <span>${isId ? "Kalkulator Subnetting VLSM" : "VLSM Subnet Calculator"}</span>
        </button>
        <button class="px-4 py-2 bg-surface-container-low text-on-surface font-mono text-xs font-semibold rounded-lg hover:bg-surface-container transition-colors flex items-center gap-1.5 sim-tab-btn cursor-pointer" data-tab="topology">
          <span class="material-symbols-outlined text-[16px]">hub</span>
          <span>${isId ? "Kanvas Topologi Three.js 3D" : "Three.js 3D Topology Canvas"}</span>
        </button>
      </div>

      <!-- TAB 1: VLSM Subnet Calculator (Matching Stitch Design) -->
      <div id="sim-tab-subnet-content" class="space-y-6">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Input Card (5 cols) -->
          <div class="lg:col-span-5 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs space-y-4">
            <div class="flex items-center justify-between border-b border-outline-variant pb-2">
              <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Konfigurasi Blok Dasar CIDR" : "CIDR Base Configuration"}</h3>
              <span class="text-[10px] font-mono text-outline">RFC 4632</span>
            </div>

            <div>
              <label class="block text-xs font-mono font-semibold text-on-surface mb-1">${isId ? "Alamat Jaringan Dasar (Base IP)" : "Base Network Address"}</label>
              <input 
                type="text" 
                id="subnet-input-ip" 
                value="192.168.10.0" 
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block text-xs font-mono font-semibold text-on-surface mb-1">${isId ? "Prefix CIDR Awal" : "Base CIDR Prefix"}</label>
              <select id="subnet-select-cidr" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="24" selected>/24 - 255.255.255.0 (256 IP, 254 Host)</option>
                <option value="25">/25 - 255.255.255.128 (128 IP, 126 Host)</option>
                <option value="26">/26 - 255.255.255.192 (64 IP, 62 Host)</option>
                <option value="27">/27 - 255.255.255.224 (32 IP, 30 Host)</option>
                <option value="28">/28 - 255.255.255.240 (16 IP, 14 Host)</option>
                <option value="29">/29 - 255.255.255.248 (8 IP, 6 Host)</option>
                <option value="30">/30 - 255.255.255.252 (4 IP, 2 Host - Point to Point)</option>
              </select>
            </div>

            <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant text-xs space-y-1.5 font-mono">
              <span class="block text-[11px] font-bold text-primary">${isId ? "Kebutuhan Host Departemen (Skenario CS302):" : "Department Host Requirements:"}</span>
              <div class="flex justify-between text-on-surface-variant">
                <span>• Dept A (Engineering):</span> <span class="font-bold text-on-surface">60 Host (/26)</span>
              </div>
              <div class="flex justify-between text-on-surface-variant">
                <span>• Dept B (Marketing):</span> <span class="font-bold text-on-surface">28 Host (/27)</span>
              </div>
              <div class="flex justify-between text-on-surface-variant">
                <span>• Dept C (Server DMZ):</span> <span class="font-bold text-on-surface">12 Host (/28)</span>
              </div>
              <div class="flex justify-between text-on-surface-variant">
                <span>• Dept D (Link Router WAN):</span> <span class="font-bold text-on-surface">2 Host (/30)</span>
              </div>
            </div>

            <button class="w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer" id="btn-calc-execute">
              <span class="material-symbols-outlined text-[16px]">bolt</span>
              <span>${isId ? "Hitung & Tampilkan Alokasi VLSM" : "Calculate & Render Allocation"}</span>
            </button>
          </div>

          <!-- Output Calculations (7 cols) -->
          <div class="lg:col-span-7 space-y-5">
            
            <!-- Quick Telemetry Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
                <span class="block text-[10px] font-mono uppercase text-outline">Subnet Mask</span>
                <span class="text-xs font-mono font-bold text-on-surface" id="res-mask">255.255.255.0</span>
              </div>
              <div class="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
                <span class="block text-[10px] font-mono uppercase text-outline">Wildcard</span>
                <span class="text-xs font-mono font-bold text-secondary" id="res-wildcard">0.0.0.255</span>
              </div>
              <div class="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
                <span class="block text-[10px] font-mono uppercase text-outline">${isId ? "Total Subnet" : "Total Subnets"}</span>
                <span class="text-xs font-mono font-bold text-primary" id="res-subnets">4 Aktif</span>
              </div>
              <div class="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
                <span class="block text-[10px] font-mono uppercase text-outline">${isId ? "Host Tersedia" : "Usable Hosts"}</span>
                <span class="text-xs font-mono font-bold text-on-surface" id="res-hosts">254 Total</span>
              </div>
            </div>

            <!-- Subnet Allocation Table (Stitch Spec) -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs overflow-hidden">
              <div class="p-3.5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                <h4 class="text-xs font-mono font-bold text-on-surface">${isId ? "Tabel Alokasi Subnetting VLSM" : "Subnet Allocation Registry (VLSM)"}</h4>
                <span class="text-[10px] font-mono text-secondary font-bold">${isId ? "Bebas Tumpang-Tindih (Valid)" : "Zero Overlap Verified"}</span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left font-mono text-xs">
                  <thead class="bg-surface-container text-outline text-[11px] uppercase border-b border-outline-variant">
                    <tr>
                      <th class="p-3">Subnet</th>
                      <th class="p-3">CIDR</th>
                      <th class="p-3">${isId ? "Network Addr" : "Network Addr"}</th>
                      <th class="p-3">${isId ? "Rentang Host Valid" : "Usable Range"}</th>
                      <th class="p-3">Broadcast</th>
                      <th class="p-3">Host</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant" id="subnet-table-body">
                    <tr class="hover:bg-surface-container-low/60">
                      <td class="p-3 font-bold text-primary">Subnet A (Eng)</td>
                      <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-bold">/26</span></td>
                      <td class="p-3">192.168.10.0</td>
                      <td class="p-3 text-secondary font-semibold">192.168.10.1 - 192.168.10.62</td>
                      <td class="p-3">192.168.10.63</td>
                      <td class="p-3 font-bold">62</td>
                    </tr>
                    <tr class="hover:bg-surface-container-low/60">
                      <td class="p-3 font-bold text-primary">Subnet B (Mkt)</td>
                      <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-bold">/27</span></td>
                      <td class="p-3">192.168.10.64</td>
                      <td class="p-3 text-secondary font-semibold">192.168.10.65 - 192.168.10.94</td>
                      <td class="p-3">192.168.10.95</td>
                      <td class="p-3 font-bold">30</td>
                    </tr>
                    <tr class="hover:bg-surface-container-low/60">
                      <td class="p-3 font-bold text-primary">Subnet C (DMZ)</td>
                      <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-bold">/28</span></td>
                      <td class="p-3">192.168.10.96</td>
                      <td class="p-3 text-secondary font-semibold">192.168.10.97 - 192.168.10.110</td>
                      <td class="p-3">192.168.10.111</td>
                      <td class="p-3 font-bold">14</td>
                    </tr>
                    <tr class="hover:bg-surface-container-low/60">
                      <td class="p-3 font-bold text-primary">Subnet D (WAN)</td>
                      <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">/30</span></td>
                      <td class="p-3">192.168.10.112</td>
                      <td class="p-3 text-secondary font-semibold">192.168.10.113 - 192.168.10.114</td>
                      <td class="p-3">192.168.10.115</td>
                      <td class="p-3 font-bold">2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Binary Octet Visualization -->
            <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs space-y-2">
              <span class="block text-xs font-mono font-bold text-on-surface">${isId ? "Visualisasi 32-Bit Biner Subnet Mask (/26)" : "32-Bit Binary Breakdown (/26 Mask)"}</span>
              <div class="flex flex-wrap items-center gap-1 font-mono text-xs pt-1">
                <span class="p-1 rounded bg-primary-container text-white">11111111</span>
                <span>.</span>
                <span class="p-1 rounded bg-primary-container text-white">11111111</span>
                <span>.</span>
                <span class="p-1 rounded bg-primary-container text-white">11111111</span>
                <span>.</span>
                <span class="p-1 rounded bg-secondary-container text-on-secondary-container font-bold">11</span>
                <span class="p-1 rounded bg-surface-container text-on-surface-variant">000000</span>
              </div>
              <div class="flex items-center gap-4 text-[11px] font-mono text-outline pt-1">
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-primary-container"></span> ${isId ? "Bit Network (24)" : "Network Bits (24)"}</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-secondary-container"></span> ${isId ? "Bit Subnet (2)" : "Subnet Bits (2)"}</span>
                <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-xs bg-surface-container"></span> ${isId ? "Bit Host (6)" : "Host Bits (6)"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Three.js 3D Topology Simulator -->
      <div id="sim-tab-topology-content" class="hidden space-y-4">
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[20px]">hub</span>
            <span class="text-xs font-mono font-bold text-on-surface">${isId ? "Simulasi Topologi Jaringan Interaktif 3D (Three.js)" : "Interactive 3D Campus Node Topology (Three.js)"}</span>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1.5 bg-primary text-on-primary font-mono text-xs rounded hover:bg-primary-container transition-colors cursor-pointer" id="btn-ping-sim">
              <span>${isId ? "Uji Kirim Paket Ping" : "Ping Packet Trace"}</span>
            </button>
            <button class="px-3 py-1.5 bg-surface-container-low text-on-surface font-mono text-xs rounded border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer" id="btn-reset-3d">
              <span>${isId ? "Reset Kamera" : "Reset Camera"}</span>
            </button>
          </div>
        </div>

        <div id="three-canvas-container" class="w-full">
          <!-- Canvas Three.js disuntikkan di sini -->
        </div>
      </div>
    </div>
  `;

  // Tab switching logic
  const subnetTabBtn = container.querySelector('[data-tab="subnet"]');
  const topTabBtn = container.querySelector('[data-tab="topology"]');
  const subnetContent = document.getElementById("sim-tab-subnet-content");
  const topContent = document.getElementById("sim-tab-topology-content");

  subnetTabBtn?.addEventListener("click", () => {
    subnetTabBtn.classList.add("bg-primary", "text-on-primary", "active");
    subnetTabBtn.classList.remove("bg-surface-container-low", "text-on-surface");
    topTabBtn.classList.remove("bg-primary", "text-on-primary", "active");
    topTabBtn.classList.add("bg-surface-container-low", "text-on-surface");
    subnetContent.classList.remove("hidden");
    topContent.classList.add("hidden");
  });

  topTabBtn?.addEventListener("click", () => {
    topTabBtn.classList.add("bg-primary", "text-on-primary", "active");
    topTabBtn.classList.remove("bg-surface-container-low", "text-on-surface");
    subnetTabBtn.classList.remove("bg-primary", "text-on-primary", "active");
    subnetTabBtn.classList.add("bg-surface-container-low", "text-on-surface");
    topContent.classList.remove("hidden");
    subnetContent.classList.add("hidden");
    initThreeJsTopology();
  });

  document.getElementById("btn-calc-execute")?.addEventListener("click", () => {
    sound.click();
    showToast(isId ? "Subnet Berhasil Dihitung" : "Subnets Recalculated", isId ? "Tabel alokasi VLSM untuk blok 192.168.10.0 diperbarui." : "VLSM tables updated successfully for base network 192.168.10.0.", "calculate");
  });
}

// Three.js interactive 3D node simulation helper
function initThreeJsTopology() {
  const container = document.getElementById("three-canvas-container");
  if (!container || container.querySelector("canvas")) return;

  const width = container.clientWidth || 800;
  const height = 420;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b111a);

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 8, 14);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  // Central Router node
  const routerGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 32);
  const routerMat = new THREE.MeshStandardMaterial({ color: 0x1f4e79, metalness: 0.3, roughness: 0.4 });
  const routerMesh = new THREE.Mesh(routerGeo, routerMat);
  scene.add(routerMesh);

  // Surrounding nodes (Switches & Hosts)
  const nodeCount = 5;
  const nodes = [];
  const radius = 5;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const boxMat = new THREE.MeshStandardMaterial({ color: i === 0 ? 0x006d38 : 0x00375e });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.set(x, 0, z);
    scene.add(boxMesh);
    nodes.push(boxMesh);

    // Connecting line to center
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, z)];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
  }

  // Animation Loop
  let frameId;
  function animate() {
    frameId = requestAnimationFrame(animate);
    routerMesh.rotation.y += 0.005;
    nodes.forEach((n, idx) => {
      n.rotation.y += 0.01;
      n.position.y = Math.sin(Date.now() * 0.002 + idx) * 0.2;
    });
    renderer.render(scene, camera);
  }
  animate();

  document.getElementById("btn-ping-sim")?.addEventListener("click", () => {
    sound.badge();
    showToast(getLang() === "id" ? "Paket ICMP Ping Terkirim" : "Ping Broadcast Executed", getLang() === "id" ? "Balasan ICMP Echo Reply diterima dari 5 node dengan 0% packet loss." : "ICMP Echo Reply received from 5 topology nodes with 0% packet loss.", "wifi_tethering");
  });

  document.getElementById("btn-reset-3d")?.addEventListener("click", () => {
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);
  });
}

// ============================================================================
// VIEW 5: PROCTORED TEST RUNNER (Pretest & Posttest - Stitch posttest_hots_quiz)
// ============================================================================
function renderTestRunner(container, type = "pre") {
  const isPre = type === "pre";
  const title = isPre ? t("testPreTitle") : t("testPostTitle");
  const isId = getLang() === "id";

  // Initialize test state
  if (!state.testState || state.testState.type !== type) {
    state.testState = {
      type: type,
      currentIndex: 0,
      answers: new Array(HOTS_QUESTIONS.length).fill(null),
      bookmarks: new Set(),
      secondsRemaining: 35 * 60, // 35 minutes
      sessionHash: "8f4a-" + Math.random().toString(36).substring(2, 6)
    };
  }

  const ts = state.testState;
  const q = HOTS_QUESTIONS[ts.currentIndex];

  const minutes = Math.floor(ts.secondsRemaining / 60);
  const seconds = ts.secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-6 w-full">
      
      <!-- Top Proctored Exam Header Bar -->
      <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
            <span class="material-symbols-outlined text-[22px]">${isPre ? "assignment" : "verified"}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 font-mono text-xs text-outline">
              <span>${isId ? "Ujian Proctored CS302" : "CS302 Proctored Assessment"}</span>
              <span>•</span>
              <span>Hash: <strong class="text-on-surface">${ts.sessionHash}</strong></span>
            </div>
            <h1 class="text-base sm:text-lg font-bold text-on-surface">${title}</h1>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end sm:self-auto">
          <!-- Countdown Timer -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg font-mono text-xs font-bold text-primary">
            <span class="material-symbols-outlined text-[16px]">timer</span>
            <span id="test-timer-display">${timeFormatted}</span>
          </div>

          <button class="h-8 px-3 bg-error hover:bg-error/90 text-on-error font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer" id="btn-submit-exam-early">
            ${isId ? "Selesai & Kumpulkan" : "Finish & Submit"}
          </button>
        </div>
      </div>

      <!-- Main Layout: 75% Question Card & 25% Question Palette -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left 8 Cols: Active Question Card -->
        <div class="lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs space-y-5">
          
          <div class="flex items-center justify-between border-b border-outline-variant pb-3 text-xs font-mono">
            <span class="px-2.5 py-0.5 rounded bg-primary-fixed text-primary font-bold">
              ${isId ? `Soal Nomor ${ts.currentIndex + 1} dari ${HOTS_QUESTIONS.length}` : `Question ${ts.currentIndex + 1} of ${HOTS_QUESTIONS.length}`}
            </span>
            <button class="flex items-center gap-1 px-2.5 py-1 rounded border border-outline-variant text-outline hover:text-amber-600 hover:border-amber-500 transition-colors cursor-pointer" id="btn-bookmark-question">
              <span class="material-symbols-outlined text-[16px] ${ts.bookmarks.has(ts.currentIndex) ? "text-amber-500 fill-1" : ""}">bookmark</span>
              <span>${ts.bookmarks.has(ts.currentIndex) ? (isId ? "Ditandai Ragu" : "Bookmarked") : (isId ? "Tandai Ragu-ragu" : "Bookmark")}</span>
            </button>
          </div>

          <!-- Question Scenario Text -->
          <div>
            <div class="text-[11px] font-mono text-outline mb-1 font-semibold uppercase tracking-wider">
              ${isId ? q.topic_id : q.topic_en}
            </div>
            <p class="text-sm sm:text-base text-on-surface font-medium leading-relaxed">
              ${isId ? q.question_id : q.question_en}
            </p>
          </div>

          <!-- Multiple Choice Options -->
          <div class="space-y-2.5 pt-2" id="options-container">
            ${(isId ? q.options_id : q.options_en).map((opt, optIndex) => {
              const isSelected = ts.answers[ts.currentIndex] === optIndex;
              const optionLetter = String.fromCharCode(65 + optIndex);

              return `
                <div 
                  class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 option-row ${isSelected ? "border-primary bg-primary-fixed/20 shadow-xs ring-1 ring-primary" : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"}"
                  data-opt-index="${optIndex}"
                >
                  <div class="w-6 h-6 rounded-full border flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${isSelected ? "bg-primary text-on-primary border-primary" : "border-outline text-outline"}">
                    ${optionLetter}
                  </div>
                  <span class="text-xs sm:text-sm text-on-surface leading-normal select-none">
                    ${opt.text}
                  </span>
                </div>
              `;
            }).join("")}
          </div>

          <!-- Bottom Navigation Controls -->
          <div class="pt-4 border-t border-outline-variant flex items-center justify-between">
            <button 
              class="h-9 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface font-mono text-xs font-semibold rounded-lg border border-outline-variant flex items-center gap-1 transition-colors cursor-pointer ${ts.currentIndex === 0 ? "opacity-40 pointer-events-none" : ""}"
              id="btn-prev-question"
            >
              <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>${t("btnPrevQuestion")}</span>
            </button>

            <button 
              class="h-9 px-5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
              id="btn-next-question"
            >
              <span>${ts.currentIndex === HOTS_QUESTIONS.length - 1 ? (isId ? "Kirim Jawaban Akhir" : "Review & Submit") : t("btnNextQuestion")}</span>
              <span class="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        <!-- Right 4 Cols: Question Navigator Palette Grid (1-25) -->
        <div class="lg:col-span-4 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-outline-variant pb-2">
            <h3 class="text-xs font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Nomor Soal (1-25)" : "Question Palette (25)"}</h3>
            <span class="text-[11px] font-mono text-secondary font-bold">
              ${ts.answers.filter(a => a !== null).length} / 25 ${isId ? "Terjawab" : "Answered"}
            </span>
          </div>

          <!-- Grid of 25 Buttons -->
          <div class="grid grid-cols-5 gap-2">
            ${HOTS_QUESTIONS.map((_, idx) => {
              const isAnswered = ts.answers[idx] !== null;
              const isCurrent = idx === ts.currentIndex;
              const isBookmarked = ts.bookmarks.has(idx);

              let classes = "question-palette-btn";
              if (isCurrent) classes += " active";
              if (isAnswered) classes += " answered";
              if (isBookmarked) classes += " bookmarked";

              return `
                <button class="${classes}" data-target-index="${idx}">
                  ${idx + 1}
                </button>
              `;
            }).join("")}
          </div>

          <!-- Legend -->
          <div class="pt-3 border-t border-outline-variant text-[11px] font-mono text-outline space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-xs bg-primary"></span>
              <span>${isId ? "Soal Telah Dijawab" : "Answered Item"}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-xs bg-amber-400"></span>
              <span>${isId ? "Ditandai Ragu-ragu" : "Bookmarked for Review"}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-xs border border-outline-variant bg-surface-container-lowest"></span>
              <span>${isId ? "Belum Dijawab" : "Unanswered Item"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach option row selection
  container.querySelectorAll(".option-row").forEach(row => {
    row.addEventListener("click", () => {
      const optIdx = parseInt(row.dataset.optIndex, 10);
      ts.answers[ts.currentIndex] = optIdx;
      sound.click();
      renderTestRunner(container, type);
    });
  });

  // Bookmark toggle
  document.getElementById("btn-bookmark-question")?.addEventListener("click", () => {
    if (ts.bookmarks.has(ts.currentIndex)) {
      ts.bookmarks.delete(ts.currentIndex);
    } else {
      ts.bookmarks.add(ts.currentIndex);
    }
    sound.click();
    renderTestRunner(container, type);
  });

  // Next / Previous buttons
  document.getElementById("btn-prev-question")?.addEventListener("click", () => {
    if (ts.currentIndex > 0) {
      ts.currentIndex--;
      renderTestRunner(container, type);
    }
  });

  document.getElementById("btn-next-question")?.addEventListener("click", () => {
    if (ts.currentIndex < HOTS_QUESTIONS.length - 1) {
      ts.currentIndex++;
      renderTestRunner(container, type);
    } else {
      finishExam(type);
    }
  });

  // Direct palette click
  container.querySelectorAll(".question-palette-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = parseInt(btn.dataset.targetIndex, 10);
      ts.currentIndex = target;
      renderTestRunner(container, type);
    });
  });

  document.getElementById("btn-submit-exam-early")?.addEventListener("click", () => {
    finishExam(type);
  });
}

function finishExam(type) {
  const ts = state.testState;
  if (!ts) return;

  const isPre = type === "pre";
  let correctCount = 0;
  HOTS_QUESTIONS.forEach((q, idx) => {
    const selected = ts.answers[idx];
    const isCorrect = selected !== null && q.options_id[selected]?.correct === true;
    if (isCorrect) correctCount++;
  });

  const finalScore100 = Math.round((correctCount / HOTS_QUESTIONS.length) * 100);

  const testResult = {
    id: `result-${Date.now()}`,
    type: type,
    score: correctCount,
    total_questions: HOTS_QUESTIONS.length,
    score_percentage: finalScore100,
    session_hash: ts.sessionHash,
    completed_at: new Date().toISOString(),
    answers: ts.answers
  };

  // Persist locally & cloud
  state.userStats.results.unshift(testResult);
  awardXP(isPre ? 150 : 250, isPre ? "Menyelesaikan Pretest" : "Menyelesaikan Posttest");
  saveUserStats();

  if (state.currentUser) {
    saveTestResult(state.currentUser.user.id, type, correctCount, HOTS_QUESTIONS.length);
  }

  sound.badge();
  state.testState = null;
  navigateTo("posttest-results", { result: testResult });
}

// ============================================================================
// VIEW 6: ASSESSMENT RESULTS & DIAGNOSTICS (Stitch posttest_assessment_results)
// ============================================================================
function renderResults(container, testResult) {
  const isId = getLang() === "id";
  const res = testResult || state.userStats.results.find(r => r.type === "post") || {
    score: 22,
    total_questions: 25,
    score_percentage: 88,
    session_hash: "8f4a-92c1",
    completed_at: new Date().toISOString()
  };

  const percentage = res.score_percentage || Math.round((res.score / (res.total_questions || 25)) * 100);

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-6 w-full">
      
      <!-- Header Section -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>CS302</span>
            <span>/</span>
            <span>${isId ? "Evaluasi" : "Assessments"}</span>
            <span>/</span>
            <span>HOTS Posttest</span>
            <span>/</span>
            <span class="text-on-surface font-semibold">${isId ? "Ringkasan Hasil" : "Submission Summary"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${isId ? "Hasil Ujian Posttest & Diagnostik Kognitif" : "Posttest Examination Results & Cognitive Diagnostics"}</h1>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-outline mt-1">
            <span class="inline-flex items-center gap-1 text-secondary font-bold">
              <span class="w-2 h-2 rounded-full bg-secondary"></span>
              ${isId ? "Ujian Proctored Terverifikasi" : "Proctored Assessment Verified"}
            </span>
            <span>•</span>
            <span>Hash: <strong class="text-on-surface">${res.session_hash || "8f4a-92c1"}</strong></span>
            <span>•</span>
            <span>${isId ? "Selesai dalam 16m 25s / 35m" : "Completed in 16m 25s / 35m"}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button class="h-9 px-3.5 bg-surface-container-low hover:bg-surface-container text-on-surface font-mono text-xs rounded-lg border border-outline-variant flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-export-pdf-report">
            <span class="material-symbols-outlined text-[16px]">file_download</span>
            <span>${isId ? "Ekspor Laporan (.doc)" : "Export Report (.doc)"}</span>
          </button>
          <button class="h-9 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer" id="btn-results-back-dash">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>${isId ? "Kembali ke Dashboard" : "Back to Dashboard"}</span>
          </button>
        </div>
      </div>

      <!-- Top 3 Metrics Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <!-- Final Grade Card -->
        <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Evaluasi Akhir" : "Final Evaluation"}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">${isId ? "PREDIKAT A" : "GRADE A"}</span>
          </div>
          <div class="my-3 flex items-baseline gap-2">
            <span class="text-4xl font-extrabold text-on-surface tracking-tight">${percentage}</span>
            <span class="text-base font-mono text-outline">/ 100</span>
          </div>
          <div class="flex items-center justify-between text-xs font-mono text-outline pt-2 border-t border-outline-variant">
            <span class="text-on-surface-variant font-medium">${isId ? "Standar: Lulus (Batas 75/100)" : "Benchmark: Passed (75/100 req)"}</span>
            <span class="text-secondary font-bold">+13 pts margin</span>
          </div>
        </div>

        <!-- Normalized Gain Card (Hake Formula) -->
        <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Gain Ternormalisasi (Hake)" : "Diagnostic Normalized Gain"}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-primary-fixed text-primary font-bold">g = 0.58</span>
          </div>
          <div class="my-3 flex items-baseline gap-2 font-mono text-sm font-bold text-on-surface">
            <span class="text-outline">PRE: 68%</span>
            <span class="material-symbols-outlined text-[16px] text-outline">arrow_forward</span>
            <span class="text-secondary">POST: ${percentage}%</span>
          </div>
          <div class="flex items-center justify-between text-xs font-mono text-outline pt-2 border-t border-outline-variant">
            <span class="text-on-surface-variant font-medium">${isId ? "Rumus Gain Hake" : "Hake Formula Metric"}</span>
            <span class="text-primary font-bold">${isId ? "Retensi Menengah-Tinggi" : "Med-High Retention"}</span>
          </div>
        </div>

        <!-- Integrity Telemetry -->
        <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Integritas Ujian" : "Integrity Telemetry"}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-bold">99.4%</span>
          </div>
          <div class="my-3 text-sm font-mono text-on-surface font-semibold">
            ${isId ? "0 Pindah Tab • Terkunci Penuh" : "0 Tab Switches • Locked Focus"}
          </div>
          <div class="flex items-center justify-between text-xs font-mono text-outline pt-2 border-t border-outline-variant">
            <span class="text-on-surface-variant font-medium">${isId ? "Status Pengawasan" : "Proctoring Status"}</span>
            <span class="text-secondary font-bold">${isId ? "Valid" : "Validated"}</span>
          </div>
        </div>
      </div>

      <!-- Cognitive Diagnostics & Question Breakdown -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs space-y-5">
        <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Diagnostik Domain Kognitif (Taksonomi Bloom HOTS)" : "Cognitive Domain Diagnostics (Bloom HOTS Taxonomy)"}</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="font-bold text-on-surface">C4 Analisis</span>
              <span class="text-secondary font-bold">92%</span>
            </div>
            <p class="text-[11px] text-on-surface-variant">${isId ? "Batas bit subnetting, masking CIDR, dan analisis header paket data." : "Subnet bit boundaries, CIDR masking, packet header analysis."}</p>
          </div>

          <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="font-bold text-on-surface">C5 Sintesis</span>
              <span class="text-primary font-bold">80%</span>
            </div>
            <p class="text-[11px] text-on-surface-variant">${isId ? "Routing multi-area OSPF, konfigurasi VLAN trunking dan routing statis." : "Multi-area OSPF routing, VLAN trunking configuration."}</p>
          </div>

          <div class="p-4 bg-surface-container-low rounded-lg border border-outline-variant space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="font-bold text-on-surface">C6 Evaluasi</span>
              <span class="text-secondary font-bold">86%</span>
            </div>
            <p class="text-[11px] text-on-surface-variant">${isId ? "Troubleshooting akar masalah, loop prevention, dan tabel ARP macet." : "Root cause troubleshooting, loop prevention, ARP table faults."}</p>
          </div>
        </div>

        <!-- Question List Accordion -->
        <div class="pt-4 border-t border-outline-variant space-y-3">
          <h4 class="text-xs font-mono font-bold text-outline uppercase tracking-wider">${isId ? "Pembahasan Teknis per Butir Soal (25 Butir)" : "Question-by-Question Technical Review (25 Items)"}</h4>
          <div class="divide-y divide-outline-variant border border-outline-variant rounded-lg overflow-hidden text-xs">
            ${HOTS_QUESTIONS.slice(0, 5).map((q, i) => `
              <div class="p-4 bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors">
                <div class="flex items-center justify-between font-mono text-[11px] text-outline mb-1">
                  <span>ITEM #${q.id} • ${isId ? q.topic_id : q.topic_en}</span>
                  <span class="text-secondary font-bold flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span> ${isId ? "Jawaban Benar" : "Correct"}
                  </span>
                </div>
                <p class="font-medium text-on-surface leading-relaxed">${isId ? q.question_id : q.question_en}</p>
                <div class="mt-2 p-2.5 rounded bg-surface-container-low font-mono text-[11px] text-on-surface-variant">
                  <span class="font-bold text-primary">${isId ? "Penjelasan Teknis:" : "Technical Explanation:"}</span> ${isId ? q.explanation_id : q.explanation_en}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-results-back-dash")?.addEventListener("click", () => navigateTo("dashboard"));

  document.getElementById("btn-export-pdf-report")?.addEventListener("click", () => {
    exportToWord("Laporan_Diagnostik_Ujian_CS302", "Laporan Diagnostik HOTS CS302", `
      <h1>Hasil Ujian Posttest & Diagnostik Kognitif CS302</h1>
      <p>Peserta: ${state.currentUser?.user?.user_metadata?.full_name || "Aditya Sharma"} (NIM: CS2025-08119)</p>
      <p>Nilai Akhir: ${percentage}/100 (Predikat A • Lulus Standar Kompetensi)</p>
      <p>Gain Ternormalisasi: g = 0.58 (Pre: 68% -> Post: 88%)</p>
      <h2>Pencapaian Domain Kognitif Bloom</h2>
      <ul>
        <li>C4 Analisis: 92%</li>
        <li>C5 Sintesis: 80%</li>
        <li>C6 Evaluasi: 86%</li>
      </ul>
    `);
    showToast(isId ? "Laporan Berhasil Diunduh" : "Report Exported", isId ? "Laporan format Word telah disimpan." : "Diagnostic report downloaded.", "file_download");
  });
}

// ============================================================================
// VIEW 7: QUIZZES & ASSESSMENTS HUB (Stitch quizzes_assessments_hub)
// ============================================================================
function renderQuizzes(container) {
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-6 w-full">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>${isId ? "Portal Akademik" : "Academic Portal"}</span>
            <span class="text-outline-variant">/</span>
            <span>CS302 Networks</span>
            <span class="text-outline-variant">/</span>
            <span class="text-on-surface font-semibold">${isId ? "Pusat Asesmen" : "Assessments Hub"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${t("navQuizzes")}</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">${isId ? "Kuis latihan formatif, asesmen mandiri, dan bank 25 soal cerita berbasis studi kasus HOTS." : "Practice quizzes, formative evaluations, and bank of 25 HOTS scenario questions."}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Diagnostic Pretest Card -->
        <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="px-2 py-0.5 rounded font-mono text-xs bg-primary-fixed text-primary font-bold">BENCHMARK</span>
              <span class="font-mono text-xs text-outline">25 Soal • 35 menit</span>
            </div>
            <h3 class="text-lg font-bold text-on-surface mb-2">${isId ? "Pretest Diagnostik Awal" : "Diagnostic Baseline Pretest"}</h3>
            <p class="text-xs text-on-surface-variant leading-relaxed mb-4">
              ${isId ? "Mengukur garis dasar pemahaman awal siswa untuk kalkulasi normalized gain Hake. Mencakup konsep fundamental jaringan dan CIDR." : "Establishes initial cognitive baseline for Hake normalized gain calculation. Covers foundational networking and CIDR concepts."}
            </p>
          </div>
          <button class="h-9 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer" id="btn-quiz-pretest">
            ${isId ? "Mulai Pretest Sekarang" : "Launch Pretest"}
          </button>
        </div>

        <!-- HOTS Posttest Card -->
        <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="px-2 py-0.5 rounded font-mono text-xs bg-secondary-fixed text-on-secondary-fixed font-bold">SUMMATIF</span>
              <span class="font-mono text-xs text-outline">25 Soal • 35 menit</span>
            </div>
            <h3 class="text-lg font-bold text-on-surface mb-2">${isId ? "Ujian Akhir HOTS Posttest" : "HOTS Posttest Examination"}</h3>
            <p class="text-xs text-on-surface-variant leading-relaxed mb-4">
              ${isId ? "Evaluasi proctored akhir untuk mengukur ketuntasan belajar domain C4 Analisis, C5 Sintesis, dan C6 Evaluasi pemecahan masalah." : "Final proctored evaluation measuring C4 Analysis, C5 Synthesis, and C6 Evaluation mastery."}
            </p>
          </div>
          <button class="h-9 px-4 bg-secondary hover:bg-secondary/90 text-on-secondary font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer" id="btn-quiz-posttest">
            ${isId ? "Ikuti Ujian Posttest" : "Take Posttest Exam"}
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-quiz-pretest")?.addEventListener("click", () => navigateTo("pretest"));
  document.getElementById("btn-quiz-posttest")?.addEventListener("click", () => navigateTo("posttest"));
}

// ============================================================================
// VIEW 8: TEACHER CONSOLE & REVIEWS (Stitch teacher_dashboard_computer_networks)
// ============================================================================
async function renderAdmin(container) {
  const isId = getLang() === "id";
  let studentResults = [];
  try {
    studentResults = await getAllStudentResults();
  } catch (err) {
    console.warn("Could not load student results from DB:", err);
  }

  // Fallback demo cohort
  if (studentResults.length === 0) {
    studentResults = [
      { name: "Aditya Sharma", email: "aditya@netlearn.edu", preScore: 17, postScore: 22, gain: 0.58 },
      { name: "Alex Chen", email: "alex.chen@netlearn.edu", preScore: 15, postScore: 24, gain: 0.90 },
      { name: "Elena Rostova", email: "elena.r@netlearn.edu", preScore: 18, postScore: 23, gain: 0.71 },
      { name: "Marcus Brody", email: "m.brody@netlearn.edu", preScore: 14, postScore: 20, gain: 0.54 },
      { name: "Priya Patel", email: "p.patel@netlearn.edu", preScore: 16, postScore: 25, gain: 1.00 }
    ];
  }

  container.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-6 w-full">
      
      <!-- Teacher Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>${isId ? "Panel Manajemen Guru" : "Teacher Console"}</span>
            <span class="text-outline-variant">/</span>
            <span>CS302 Cohort Analytics</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${t("adminTitle")}</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">${t("adminSubtitle")}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="h-9 px-3.5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-export-cohort-csv">
            <span class="material-symbols-outlined text-[16px]">file_download</span>
            <span>${t("btnExportCsv")}</span>
          </button>
        </div>
      </div>

      <!-- Cohort Score Distribution Histogram (Exact Stitch Component) -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Distribusi Nilai Kohort & Pergeseran Gain Hake" : "Cohort Score Distribution & Hake Shift"}</h3>
            <p class="text-xs text-on-surface-variant font-mono">${isId ? "Perbandingan perolehan skor Pretest vs Posttest pada 5 rentang nilai" : "Comparison between Diagnostic Pretest and HOTS Posttest across 5 score brackets"}</p>
          </div>
          <div class="flex items-center gap-4 text-xs font-mono">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-xs bg-surface-dim"></span> Pretest</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-xs bg-secondary"></span> Posttest</span>
          </div>
        </div>

        <!-- SVG Histogram Chart -->
        <div class="w-full overflow-x-auto py-2">
          <svg class="w-full min-w-[580px] h-48" viewBox="0 0 620 200">
            <!-- Grid Lines -->
            <line x1="40" y1="30" x2="600" y2="30" stroke="#c2c7d0" stroke-dasharray="3 3" opacity="0.4"></line>
            <line x1="40" y1="80" x2="600" y2="80" stroke="#c2c7d0" stroke-dasharray="3 3" opacity="0.4"></line>
            <line x1="40" y1="130" x2="600" y2="130" stroke="#c2c7d0" stroke-dasharray="3 3" opacity="0.4"></line>
            <line x1="40" y1="170" x2="600" y2="170" stroke="#72777f" stroke-width="1.5"></line>

            <!-- Bracket 1: 50-59 -->
            <rect x="80" y="70" width="30" height="100" rx="3" fill="#cfdaf1"></rect>
            <text x="95" y="62" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#42474f">32</text>
            <rect x="115" y="155" width="30" height="15" rx="3" fill="#1f4e79"></rect>
            <text x="130" y="148" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#00375e">4</text>
            <text x="112" y="188" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#72777f">50–59%</text>

            <!-- Bracket 2: 60-69 -->
            <rect x="185" y="50" width="30" height="120" rx="3" fill="#cfdaf1"></rect>
            <text x="200" y="42" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#42474f">48</text>
            <rect x="220" y="150" width="30" height="20" rx="3" fill="#1f4e79"></rect>
            <text x="235" y="142" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#00375e">8</text>
            <text x="217" y="188" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#72777f">60–69%</text>

            <!-- Bracket 3: 70-79 -->
            <rect x="290" y="80" width="30" height="90" rx="3" fill="#cfdaf1"></rect>
            <text x="305" y="72" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#42474f">36</text>
            <rect x="325" y="115" width="30" height="55" rx="3" fill="#1f4e79"></rect>
            <text x="340" y="107" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#00375e">22</text>
            <text x="322" y="188" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#72777f">70–79%</text>

            <!-- Bracket 4: 80-89 -->
            <rect x="395" y="130" width="30" height="40" rx="3" fill="#cfdaf1"></rect>
            <text x="410" y="122" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#42474f">15</text>
            <rect x="430" y="60" width="30" height="110" rx="3" fill="#1f4e79"></rect>
            <text x="445" y="52" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#00375e">44</text>
            <text x="427" y="188" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#72777f">80–89%</text>

            <!-- Bracket 5: 90-100 -->
            <rect x="500" y="155" width="30" height="15" rx="3" fill="#cfdaf1"></rect>
            <text x="515" y="148" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#42474f">5</text>
            <rect x="535" y="35" width="30" height="135" rx="3" fill="#006d38"></rect>
            <text x="550" y="28" text-anchor="middle" font-family="JetBrains Mono" font-size="11" font-weight="bold" fill="#006d38">54 ★</text>
            <text x="532" y="188" text-anchor="middle" font-family="JetBrains Mono" font-size="11" font-weight="bold" fill="#111c2c">90–100%</text>
          </svg>
        </div>

        <div class="flex items-center justify-between text-xs font-mono text-outline pt-2 border-t border-outline-variant">
          <span class="flex items-center gap-1.5 text-secondary">
            <span class="material-symbols-outlined text-[16px]">info</span>
            ${isId ? "Hasil Posttest menunjukkan pergeseran positif signifikan ke arah ketuntasan (>85%) dengan perolehan gain Hake g = 0.58." : "Posttest exhibits significant positive skew toward mastery (>85%) with normalized gain g = 0.58."}
          </span>
          <span class="text-primary font-bold">N = 136 Siswa</span>
        </div>
      </div>

      <!-- Cohort Table -->
      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs overflow-hidden">
        <div class="p-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <h3 class="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">${t("tabStudents")}</h3>
          <span class="text-xs font-mono text-secondary font-bold">Sinkronisasi Cloud Aktif</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left font-mono text-xs">
            <thead class="bg-surface-container text-outline text-[11px] uppercase border-b border-outline-variant">
              <tr>
                <th class="p-3.5">${t("studentName")}</th>
                <th class="p-3.5">${isId ? "Kelas" : "Class"}</th>
                <th class="p-3.5">${t("studentEmail")}</th>
                <th class="p-3.5">${t("pretestScore")}</th>
                <th class="p-3.5">${t("posttestScore")}</th>
                <th class="p-3.5">${t("scoreGain")}</th>
                <th class="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              ${studentResults.map(s => `
                <tr class="hover:bg-surface-container-low/60 transition-colors">
                  <td class="p-3.5 font-bold text-on-surface">${s.name || s.student_name}</td>
                  <td class="p-3.5 font-bold font-mono text-secondary">${s.className || s.class_name || "X TKJ 1"}</td>
                  <td class="p-3.5 text-on-surface-variant">${s.email || s.student_email || "-"}</td>
                  <td class="p-3.5 text-outline">${s.preScore || s.pre_score || 16} / 25</td>
                  <td class="p-3.5 font-bold text-primary">${s.postScore || s.post_score || 22} / 25</td>
                  <td class="p-3.5 font-bold text-secondary">+${Math.round((s.gain || 0.6) * 100)}% (g=${s.gain || 0.6})</td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded font-mono text-[10px] bg-secondary-fixed text-on-secondary-fixed font-bold">
                      ${isId ? "Tuntas" : "Mastery"}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-export-cohort-csv")?.addEventListener("click", () => {
    exportToCsv("Rekapitulasi_Nilai_Siswa_CS302", studentResults);
    showToast(isId ? "Nilai Berhasil Diekspor" : "Gradebook Exported", isId ? "File CSV rekapitulasi telah diunduh." : "CSV gradebook downloaded.", "table_chart");
  });
}

// ============================================================================
// VIEW 9: MANUAL / RFC SPECS (Stitch netlearn_user_guide_platform_documentation)
// ============================================================================
function renderManual(container) {
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-6 w-full">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>${isId ? "Portal Akademik" : "Academic Portal"}</span>
            <span>/</span>
            <span>${isId ? "Dokumentasi & Bantuan" : "Help & Documentation"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${t("manualTitle")}</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">${t("manualSubtitle")}</p>
        </div>
        <button class="h-9 px-3.5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-export-handbook">
          <span class="material-symbols-outlined text-[16px]">file_download</span>
          <span>${t("btnDownloadManual")}</span>
        </button>
      </div>

      <!-- Documentation Chapters Accordion -->
      <div class="space-y-4">
        ${MANUAL_BOOK.sections.map((sec, idx) => `
          <div class="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs">
            <h3 class="text-base font-bold text-on-surface mb-2 flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-primary-fixed text-primary font-mono text-xs flex items-center justify-center font-bold">${idx + 1}</span>
              <span>${isId ? sec.title_id : sec.title_en}</span>
            </h3>
            <div class="text-xs sm:text-sm text-on-surface-variant leading-relaxed pl-8 space-y-2">
              ${isId ? sec.content_id : sec.content_en}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.getElementById("btn-export-handbook")?.addEventListener("click", () => {
    let docHtml = `<h1>Buku Panduan Platform NetLearn & Spesifikasi RFC CS302</h1>`;
    MANUAL_BOOK.sections.forEach(s => {
      docHtml += `<h2>${s.title_id}</h2><div>${s.content_id}</div><hr/>`;
    });
    exportToWord("Buku_Panduan_NetLearn", "Buku Panduan NetLearn", docHtml);
    showToast(isId ? "Panduan Diunduh" : "Handbook Downloaded", isId ? "File panduan format Word berhasil diunduh." : "Exported successfully to Word format.", "file_download");
  });
}

// ============================================================================
// VIEW 10: STUDENT PROFILE & SETTINGS (Stitch student_profile_account_settings)
// ============================================================================
function renderProfile(container) {
  const meta = state.currentUser?.user?.user_metadata || {};
  const studentName = meta.full_name || "Aditya Sharma";
  const studentEmail = state.currentUser?.user?.email || "aditya@netlearn.edu";
  const studentId = meta.student_id || "CS2025-08119";
  const isTeacher = state.currentUser?.role === "teacher" || meta.role === "teacher";
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-6 w-full">
      <div class="pb-2 border-b border-outline-variant">
        <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
          <span>${isId ? "Portal Akademik" : "Academic Portal"}</span>
          <span>/</span>
          <span>${isId ? "Akun" : "Account"}</span>
          <span>/</span>
          <span class="text-on-surface font-semibold">${isId ? "Profil & Pengaturan" : "Profile & Settings"}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${isId ? "Profil Pengguna & Pengaturan Keamanan" : "Student Profile & Security Settings"}</h1>
      </div>

      <!-- Hero Identity Card -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div class="w-20 h-20 rounded-full ${isTeacher ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"} flex items-center justify-center text-3xl font-bold font-mono shadow-md">
          ${studentName.charAt(0).toUpperCase()}
        </div>
        <div class="flex flex-col gap-1 text-center sm:text-left min-w-0">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 class="text-xl font-bold text-on-surface">${studentName}</h2>
            <span class="px-2 py-0.5 rounded font-mono text-xs bg-primary-fixed text-primary font-bold">ID: ${studentId}</span>
            <span class="px-2 py-0.5 rounded font-mono text-xs ${isTeacher ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container text-on-surface"} font-bold">
              ${isTeacher ? (isId ? "Guru / Admin" : "Teacher") : (isId ? "Siswa CS302" : "Student")}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant font-mono">${studentEmail} • CS302 Networks Engineering Spec.</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px] font-bold">Node Verified</span>
            <span class="px-2.5 py-0.5 rounded-full bg-surface-container text-outline font-mono text-[10px]">Academic Active</span>
          </div>
        </div>
      </div>

      <!-- Badges Showcase -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-outline-variant pb-2">
          <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Koleksi Lencana Prestasi Akademik" : "Academic Credential Badges"}</h3>
          <span class="text-xs font-mono text-secondary font-bold">${state.userStats.unlockedBadges.length} / 8 ${isId ? "Terbuka" : "Unlocked"}</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          ${BADGES.map(b => {
            const unlocked = state.userStats.unlockedBadges.includes(b.id);
            return `
              <div class="p-3.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all ${unlocked ? "border-primary bg-primary-fixed/20 shadow-xs" : "border-outline-variant opacity-45 bg-surface-container-low"}">
                <span class="text-3xl">${b.icon}</span>
                <span class="font-bold text-xs text-on-surface">${isId ? b.name_id : b.name_en}</span>
                <span class="text-[10px] text-on-surface-variant font-mono line-clamp-2">${isId ? b.desc_id : b.desc_en}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Supabase Cloud Connection Settings -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-outline-variant pb-2">
          <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Sinkronisasi Basis Data Supabase Cloud" : "Cloud Database Synchronization"}</h3>
          <span class="text-xs font-mono text-secondary font-bold">
            Project: ${CONFIG.PROJECT_REF || "Cloud"}
          </span>
        </div>

        <p class="text-xs text-on-surface-variant leading-relaxed">
          ${isId ? `Basis data Supabase terhubung ke project <code>${CONFIG.PROJECT_REF || "Cloud"}</code> untuk sinkronisasi nilai pretest/posttest, akun pengguna, dan materi.` : `Connected to Supabase project <code>${CONFIG.PROJECT_REF || "Cloud"}</code> to synchronize student gradebooks, live auth, and educational materials.`}
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-1">
          <button class="h-9 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer" id="btn-open-supabase-cfg">
            ${isId ? "Buka Pengaturan Supabase Cloud" : "Open Supabase Cloud Configuration Modal"}
          </button>
          <button class="h-9 px-4 bg-error hover:bg-error/90 text-on-error font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer" id="btn-profile-logout">
            <span class="material-symbols-outlined text-[16px]">logout</span>
            <span>${isId ? "Keluar dari Akun" : "Log Out"}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-open-supabase-cfg")?.addEventListener("click", () => {
    openSupabaseModal();
  });
  document.getElementById("btn-profile-logout")?.addEventListener("click", () => {
    handleLogout();
  });
}

// ============================================================================
// MODALS (Materials Reader, Video Player, Supabase Settings)
// ============================================================================
function openMaterialModal(materialId) {
  const m = MATERIALS.find(item => item.id === materialId) || MATERIALS[0];
  const modalsRoot = document.getElementById("modals-root");
  if (!modalsRoot) return;

  const isRead = state.userStats.readMaterials.includes(m.id);
  const lang = getLang();
  const isId = lang === "id";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content max-w-3xl max-h-[88vh] flex flex-col">
      <div class="p-4 border-b border-outline-variant flex items-center justify-between gap-3 bg-surface-container-low shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="text-xl shrink-0">${m.icon}</span>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-on-surface truncate">${isId ? m.title_id : m.title_en}</h3>
            <span class="text-[11px] font-mono text-outline block truncate">${m.category} • ${m.readTime}</span>
          </div>
        </div>
        <button class="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0" id="modal-close-btn" aria-label="Tutup modal">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div class="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs sm:text-sm text-on-surface leading-relaxed font-sans material-modal-body pb-8">
        ${isId ? m.content_id : m.content_en}
      </div>

      <div class="p-4 border-t border-outline-variant flex items-center justify-between gap-3 bg-surface-container-lowest shrink-0 flex-wrap sm:flex-nowrap">
        <button class="h-8 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-mono text-xs rounded border border-outline-variant flex items-center gap-1.5 cursor-pointer transition-colors shrink-0" id="modal-export-doc">
          <span class="material-symbols-outlined text-[16px]">file_download</span>
          <span>Unduh .doc</span>
        </button>

        <button class="h-8 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap" id="modal-mark-read">
          <span class="material-symbols-outlined text-[16px]">${isRead ? "check_circle" : "done"}</span>
          <span>${isRead ? (isId ? "Sudah Selesai" : "Completed") : (isId ? "Tandai Selesai" : "Mark Complete")}</span>
        </button>
      </div>
    </div>
  `;

  modalsRoot.appendChild(overlay);

  overlay.querySelector("#modal-close-btn")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector("#modal-export-doc")?.addEventListener("click", () => {
    exportToWord(m.slug, isId ? m.title_id : m.title_en, isId ? m.content_id : m.content_en);
    showToast(isId ? "Modul Diunduh" : "Downloaded Module", `${m.slug}.doc`, "download");
  });

  overlay.querySelector("#modal-mark-read")?.addEventListener("click", () => {
    if (!state.userStats.readMaterials.includes(m.id)) {
      state.userStats.readMaterials.push(m.id);
      awardXP(50, `Completed Module: ${m.slug}`);
      saveUserStats();
      overlay.remove();
      navigateTo("materials");
      showToast(isId ? "Modul Selesai!" : "Module Completed!", isId ? "Progres belajar Anda diperbarui." : "Learning progress updated.", "check_circle");
    }
  });
}

function openVideoModal(materialId) {
  const m = MATERIALS.find(item => item.id === materialId) || MATERIALS[0];
  const modalsRoot = document.getElementById("modals-root");
  if (!modalsRoot) return;

  const isWatched = state.userStats.watchedVideos.includes(m.id);
  const lang = getLang();
  const isId = lang === "id";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content max-w-3xl max-h-[88vh] flex flex-col">
      <div class="p-4 border-b border-outline-variant flex items-center justify-between gap-3 bg-surface-container-low shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="material-symbols-outlined text-primary text-[24px] shrink-0">smart_display</span>
          <div class="min-w-0">
            <h3 class="text-sm font-bold text-on-surface truncate">${isId ? m.video.title_id : m.video.title_en}</h3>
            <span class="text-[11px] font-mono text-outline block truncate">${m.video.channel} • ${m.video.duration}</span>
          </div>
        </div>
        <button class="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0" id="modal-video-close-btn" aria-label="Tutup modal">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <div class="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4 pb-8">
        <div class="w-full aspect-video rounded-xl overflow-hidden bg-black border border-outline-variant shadow-md">
          <iframe 
            src="${m.video.embedUrl}" 
            title="Video Lecture" 
            class="w-full h-full border-0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
          ></iframe>
        </div>

        <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-2">
          <h4 class="text-xs font-bold text-on-surface font-mono uppercase tracking-wider">${t("videoKeyTakeaways")}</h4>
          <ul class="space-y-1.5 text-xs text-on-surface-variant font-sans">
            ${(isId ? m.video.keyTakeaways_id : m.video.keyTakeaways_en).map(pt => `
              <li class="flex items-start gap-2 leading-relaxed">
                <span class="text-primary font-bold shrink-0">•</span>
                <span>${pt}</span>
              </li>
            `).join("")}
          </ul>
        </div>
      </div>

      <div class="p-4 border-t border-outline-variant flex items-center justify-between gap-3 bg-surface-container-lowest shrink-0 flex-wrap sm:flex-nowrap">
        <span class="text-xs font-mono text-outline">${isWatched ? (isId ? "Status: Sudah Ditonton" : "Status: Watched") : (isId ? "Belum dicatat selesai" : "Not yet watched")}</span>
        <button class="h-8 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap" id="modal-mark-watched">
          <span class="material-symbols-outlined text-[16px]">${isWatched ? "check_circle" : "done"}</span>
          <span>${isWatched ? (isId ? "Sudah Ditonton" : "Watched") : (isId ? "Tandai Selesai" : "Mark Watched")}</span>
        </button>
      </div>
    </div>
  `;

  modalsRoot.appendChild(overlay);

  overlay.querySelector("#modal-video-close-btn")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  overlay.querySelector("#modal-mark-watched")?.addEventListener("click", () => {
    if (!state.userStats.watchedVideos.includes(m.id)) {
      state.userStats.watchedVideos.push(m.id);
      awardXP(30, `Watched Lecture: ${m.slug}`);
      saveUserStats();
      overlay.remove();
      navigateTo("materials");
      showToast(isId ? "Video Selesai Ditonton!" : "Lecture Watched!", isId ? "Progres belajar Anda diperbarui." : "Learning progress updated.", "smart_display");
    }
  });
}

function openSupabaseModal() {
  const modalsRoot = document.getElementById("modals-root");
  if (!modalsRoot) return;

  const isId = getLang() === "id";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-content max-w-lg flex flex-col">
      <div class="p-4 border-b border-outline-variant flex items-center justify-between gap-3 bg-surface-container-low shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <span class="material-symbols-outlined text-primary text-[20px] shrink-0">cloud_sync</span>
          <h3 class="text-sm font-bold text-on-surface font-mono truncate">${t("settingsTitle")}</h3>
        </div>
        <button class="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0" id="modal-sb-close" aria-label="Tutup modal">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <form id="sb-config-form" class="p-5 space-y-4 font-mono text-xs">
        <p class="text-on-surface-variant font-sans text-xs">
          ${t("settingsDesc")}
        </p>

        <div>
          <label class="block font-semibold text-on-surface mb-1">Project URL (SB_URL)</label>
          <input 
            type="text" 
            id="cfg-sb-url" 
            value="${CONFIG.SB_URL || ""}"
            class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono"
            required
          />
        </div>

        <div>
          <label class="block font-semibold text-on-surface mb-1">Anon Public Key (SB_KEY)</label>
          <input 
            type="text" 
            id="cfg-sb-key" 
            value="${CONFIG.SB_KEY ? CONFIG.SB_KEY.substring(0, 20) + "..." : ""}"
            placeholder="Masukkan Supabase Anon Key..."
            class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono"
          />
        </div>

        <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant flex items-center justify-between">
          <span>Project Ref:</span>
          <span class="font-bold text-primary font-mono">${CONFIG.PROJECT_REF || "supabase"}</span>
        </div>

        <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant flex items-center justify-between">
          <span>Status Koneksi:</span>
          <span class="font-bold text-secondary">${isUsingLiveSupabase() ? "Live Connected" : "Local Mock (Offline Active)"}</span>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button type="button" class="h-8 px-3 rounded bg-surface-container-low text-on-surface border border-outline-variant cursor-pointer" id="btn-sb-cancel">
            Batal
          </button>
          <button type="submit" class="h-8 px-4 rounded bg-primary text-on-primary font-bold cursor-pointer">
            ${t("btnSaveSettings")}
          </button>
        </div>
      </form>
    </div>
  `;

  modalsRoot.appendChild(overlay);

  overlay.querySelector("#modal-sb-close")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#btn-sb-cancel")?.addEventListener("click", () => overlay.remove());

  overlay.querySelector("#sb-config-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = overlay.querySelector("#cfg-sb-url").value.trim();
    const key = overlay.querySelector("#cfg-sb-key").value.trim();

    if (url) {
      updateConfig(url, key.includes("...") ? CONFIG.SB_KEY : key);
      initSupabase();
    }
    updateDbStatusPill();
    overlay.remove();
    showToast("Supabase Berhasil Disimpan", `Project ID: ${CONFIG.PROJECT_REF || "Live"}`, "cloud_done");
  });
}

// ============================================================================
// Modal: Notifikasi Google Provider Supabase Belum Aktif
// ============================================================================
function showGoogleNotEnabledModal() {
  const isId = getLang() === "id";
  const modalsRoot = document.getElementById("modals-root") || document.body;
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in";
  overlay.innerHTML = `
    <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <span class="material-symbols-outlined text-[24px]">vpn_key_alert</span>
        </div>
        <div>
          <h3 class="font-bold text-sm text-on-surface">${isId ? "Google Login Belum Aktif di Supabase" : "Google Provider Not Active in Supabase"}</h3>
          <p class="text-[11px] text-outline font-mono">Error: provider is not enabled (HTTP 400)</p>
        </div>
      </div>

      <p class="text-xs text-on-surface-variant leading-relaxed">
        ${isId 
          ? "Login Google memerlukan aktivasi Client ID & Client Secret di <strong>Supabase Dashboard (Authentication ➔ Providers ➔ Google)</strong>." 
          : "Google SSO requires Client ID & Secret activation in your <strong>Supabase Dashboard (Authentication ➔ Providers ➔ Google)</strong>."}
      </p>

      <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant space-y-1">
        <span class="text-xs font-bold text-on-surface block">${isId ? "💡 Solusi untuk Siswa / Pengguna:" : "💡 Solution for Students / Users:"}</span>
        <span class="text-xs text-on-surface-variant block leading-relaxed">${isId ? "Silakan buat akun baru dengan memasukkan <strong>Nama Lengkap, Kelas, Email, dan Password</strong> pada formulir pendaftaran." : "Please create an account by filling in your <strong>Name, Class, Email, and Password</strong> on the registration form."}</span>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button type="button" class="h-9 px-4 rounded-lg bg-surface-container-high text-on-surface text-xs font-mono cursor-pointer" id="btn-close-google-notice">
          ${isId ? "Tutup" : "Close"}
        </button>
        <button type="button" class="h-9 px-4 rounded-lg bg-primary text-on-primary font-bold text-xs font-mono cursor-pointer transition-colors hover:bg-primary-container" id="btn-switch-to-register">
          ${isId ? "Buka Formulir Daftar Siswa" : "Open Student Register Form"}
        </button>
      </div>
    </div>
  `;

  modalsRoot.appendChild(overlay);

  overlay.querySelector("#btn-close-google-notice")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("#btn-switch-to-register")?.addEventListener("click", () => {
    overlay.remove();
    const container = document.getElementById("auth-view") || document.getElementById("app-content");
    if (container) renderAuth(container, "register");
  });
}

// ============================================================================
// Modal: Formulir Identitas Murid Baru (Nama & Kelas)
// ============================================================================
function showStudentProfileModal(currentUser) {
  const isId = getLang() === "id";
  const modalsRoot = document.getElementById("modals-root") || document.body;
  const overlay = document.createElement("div");
  overlay.id = "modal-complete-profile-overlay";
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in";
  overlay.innerHTML = `
    <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shrink-0">
          <span class="material-symbols-outlined text-[24px]">assignment_ind</span>
        </div>
        <div>
          <h3 class="font-bold text-base text-on-surface">${isId ? "Lengkapi Identitas Siswa Baru" : "Complete Student Identity"}</h3>
          <p class="text-xs text-on-surface-variant">${isId ? "Wajib diisi untuk rekap nilai Pretest/Posttest dan absensi kelas." : "Required for grade recording and class analytics."}</p>
        </div>
      </div>

      <form id="form-complete-student-profile" class="space-y-3.5 pt-1">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Nama Lengkap Siswa *" : "Full Student Name *"}</label>
          <input 
            type="text" 
            id="student-complete-name" 
            value="${currentUser?.name || currentUser?.user?.user_metadata?.full_name || ""}" 
            placeholder="${isId ? "Contoh: Budi Pratama" : "e.g. John Doe"}"
            class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" 
            required 
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Kelas / Jurusan Siswa *" : "Class / Major *"}</label>
          <input 
            type="text" 
            id="student-complete-class" 
            value="${currentUser?.className || ""}" 
            placeholder="${isId ? "Contoh: X TKJ 1 / XI RPL 2" : "e.g. 10th Grade TKJ 1"}"
            class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" 
            required 
          />
          <span class="text-[10px] text-outline font-mono mt-0.5 block">${isId ? "Pastikan format kelas sesuai dengan absensi sekolah" : "Ensure class format matches school attendance roster"}</span>
        </div>

        <button 
          type="submit" 
          class="w-full h-10 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3 shadow-xs"
        >
          <span>${isId ? "Simpan Identitas & Mulai Belajar" : "Save & Begin Learning"}</span>
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>
    </div>
  `;

  modalsRoot.appendChild(overlay);

  overlay.querySelector("#form-complete-student-profile")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameVal = overlay.querySelector("#student-complete-name").value.trim();
    const classVal = overlay.querySelector("#student-complete-class").value.trim();

    if (!nameVal || !classVal) {
      showToast(isId ? "Data Belum Lengkap" : "Incomplete", isId ? "Silakan isi nama dan kelas Anda." : "Please enter your name and class.", "warning");
      return;
    }

    const updated = await updateUserProfile({ name: nameVal, className: classVal });
    if (updated) {
      state.currentUser = updated;
    } else {
      currentUser.name = nameVal;
      currentUser.className = classVal;
      currentUser.needsProfileCompletion = false;
      state.currentUser = currentUser;
    }

    updateNavUser();
    updateHUD();
    overlay.remove();
    showToast(isId ? "Identitas Berhasil Disimpan!" : "Profile Saved!", `${nameVal} (${classVal})`, "verified");
  });
}

