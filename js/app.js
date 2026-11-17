// NetLearn - Main Application Controller (Stitch Architecture)
// CS302 Computer Networks Educational Platform & Virtual Lab
// Environment config loaded dynamically via .env

import { HOTS_QUESTIONS } from "./data/questions.js";
import { MATERIALS, getYouTubeEmbedUrl } from "./data/materials.js";
import { MANUAL_BOOK } from "./data/manual.js";
import { translations, getLang, setLang, t, applyI18nToDOM } from "./services/i18n.js";
import { BADGES, LEVELS, calculateLevel, sound } from "./services/gamification.js";
import { exportToWord, exportToCsv } from "./services/export.js";
import { renderTopicSimulation, renderUnifiedWorkbench } from "./services/simulations.js";
import { initNetQuestCityGame, cleanupNetQuestCityGame } from "./services/game3d.js";
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
  signInAdmin,
  signInWithGoogle,
  signInWithGoogleEmail,
  updateUserProfile,
  signOut,
  getCurrentUser,
  saveTestResult,
  getUserResults,
  getAllStudentResults,
  getAllStudentsCohort,
  saveUserProgress,
  getUserProgress,
  getVideos,
  addVideo,
  deleteVideo,
  updateTopicVideo,
  getMaterialsFromDb,
  saveMaterialToDb,
  deleteMaterialFromDb,
  getCustomQuizzesSync,
  getCustomQuizzes,
  saveCustomQuiz,
  deleteCustomQuiz,
  toggleCustomQuizStatus,
  saveItemAnswers,
  getItemDiagnostics
} from "./services/supabase.js";

// ============================================================================
// Application State
// ============================================================================
export const state = {
  currentUser: getCurrentUser(), // strictly null if not logged in
  currentView: "dashboard",
  testState: null,
  soundMuted: false,
  theme: "light",
  userStats: {
    xp: 0,
    readMaterials: [],
    watchedVideos: [],
    unlockedBadges: [],
    results: []
  }
};

// ============================================================================
// Role & Material Helpers
// ============================================================================
export function isUserAdmin(user = state.currentUser) {
  if (!user) return false;
  const role = (user.role || user.user?.user_metadata?.role || "").toLowerCase().trim();
  if (role === "teacher" || role === "admin" || role === "guru") return true;
  const email = (user.email || user.user?.email || "").toLowerCase().trim();
  if (email === "narendra.23076@mhs.unesa.ac.id") return true;
  return false;
}

export function getMaterialById(id) {
  if (window.__allLoadedMaterials && Array.isArray(window.__allLoadedMaterials)) {
    const found = window.__allLoadedMaterials.find(m => String(m.id) === String(id));
    if (found) return found;
  }
  return MATERIALS.find(item => String(item.id) === String(id)) || MATERIALS[0];
}

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
  // 1. Instant synchronous pre-render check (eliminates FOUC / layout flash)
  const cachedUser = getCurrentUser();
  state.currentUser = cachedUser;
  updateRoleAccess(); // Strictly hides teacher controls for students/guests at timestamp 0

  if (cachedUser) {
    showAppLayout();
    updateNavUser();
  } else {
    const initialMode = window.location.hash.toLowerCase().includes("register") ? "register" : "login";
    showAuthLayout(initialMode);
  }

  applyTheme(state.theme);
  setupGlobalEvents();
  applyI18nToDOM();

  // 2. Load configurations and verify remote session asynchronously
  await loadEnvConfig();
  if (isUsingLiveSupabase()) {
    try {
      const liveUser = await checkLiveSession();
      state.currentUser = liveUser;
      updateRoleAccess();
    } catch (e) {
      console.warn("Session restore error:", e);
      state.currentUser = null;
      updateRoleAccess();
    }
  } else {
    state.currentUser = cachedUser;
  }

  if (state.currentUser) {
    showAppLayout();
    await loadUserStats();
    updateHUD();
    updateNavUser();
    updateRoleAccess();
    if (!isUserAdmin(state.currentUser) && (state.currentUser.needsProfileCompletion || (state.currentUser.role === "student" && (!state.currentUser.className || state.currentUser.className.trim() === "")))) {
      showStudentProfileModal(state.currentUser);
    }
    const isTeacher = isUserAdmin(state.currentUser);
    const targetHash = window.location.hash.replace("#", "").trim();
    const validViews = isTeacher 
      ? ["admin", "materials", "profile"] 
      : ["dashboard", "materials", "simulation", "quizzes", "minigame", "pretest", "posttest", "manual", "profile"];
    const initialView = validViews.includes(targetHash) ? targetHash : (isTeacher ? "admin" : "dashboard");
    navigateTo(initialView);
  } else {
    const initialMode = window.location.hash.toLowerCase().includes("register") ? "register" : "login";
    showAuthLayout(initialMode);
  }
});

// ============================================================================
// Role-Based Menu Filtering (GURU vs SISWA)
// ============================================================================
function updateRoleAccess() {
  const isTeacher = isUserAdmin(state.currentUser);
  const studentViews = ["dashboard", "simulation", "quizzes", "manual"];

  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    const view = btn.dataset.view;
    if (view === "admin") {
      if (isTeacher) {
        btn.classList.remove("hidden");
        btn.style.setProperty("display", "inline-flex", "important");
      } else {
        btn.classList.add("hidden");
        btn.style.setProperty("display", "none", "important");
      }
    } else if (studentViews.includes(view)) {
      if (isTeacher) {
        // Sembunyikan semua menu khusus siswa jika yang login adalah guru
        btn.classList.add("hidden");
        btn.style.setProperty("display", "none", "important");
      } else {
        btn.classList.remove("hidden");
        btn.style.removeProperty("display");
      }
    }
  });

  // Sesuaikan status header HUD jika guru
  const curriculumCounter = document.getElementById("hud-curriculum-counter")?.parentElement;
  if (curriculumCounter) {
    if (isTeacher) {
      curriculumCounter.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-on-surface-variant font-medium">Akses:</span>
        <span class="font-bold text-secondary font-mono">Panel Guru Aktif</span>
      `;
    } else {
      curriculumCounter.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span class="text-on-surface-variant font-medium">Kurikulum:</span>
        <span class="font-bold text-primary" id="hud-curriculum-counter">${state.userStats?.readMaterials?.length || 0}/6 Modul</span>
      `;
    }
  }
}

// ============================================================================
// Theme Management
// ============================================================================
function applyTheme() {
  const html = document.documentElement;
  html.classList.remove("dark");
  html.classList.add("light");
  try {
    localStorage.setItem("netlearn_theme", "light");
  } catch (e) {}
}

// ============================================================================
// Gamification & Stats Storage
// ============================================================================
export const TKJ_CLASSES = [
  "X TKJ 1",
  "X TKJ 2",
  "XI TKJ 1",
  "XI TKJ 2",
  "XII TKJ 1",
  "XII TKJ 2"
];

function getStorageKey(suffix) {
  const uid = state.currentUser ? (state.currentUser.user?.id || state.currentUser.id || "guest") : "guest";
  return `netlearn_${uid}_${suffix}`;
}

async function loadUserStats() {
  if (!state.currentUser) return;
  const uid = state.currentUser.user?.id || state.currentUser.id || "guest";

  // Reset to clean 0 initial state for the user (guarantees newly created accounts start strictly at 0)
  const savedXp = localStorage.getItem(getStorageKey("xp"));
  const savedMaterials = localStorage.getItem(getStorageKey("materials"));
  const savedVideos = localStorage.getItem(getStorageKey("videos"));
  const savedBadges = localStorage.getItem(getStorageKey("badges"));

  state.userStats = {
    xp: savedXp ? parseInt(savedXp, 10) : 0,
    readMaterials: savedMaterials ? JSON.parse(savedMaterials) : [],
    watchedVideos: savedVideos ? JSON.parse(savedVideos) : [],
    unlockedBadges: savedBadges ? JSON.parse(savedBadges) : [],
    results: []
  };

  // Auto-sync progress from Supabase in background
  try {
    const remoteProgress = await getUserProgress(uid);
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
    const liveResults = await getUserResults(uid);
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

  // Academic Curriculum Progress Telemetry
  const curriculumEl = document.getElementById("hud-curriculum-counter");
  if (curriculumEl) {
    curriculumEl.textContent = `${readCount}/${totalModules} ${isId ? "Modul" : "Modules"} (${percent}%)`;
  }
}

function updateNavUser() {
  const container = document.getElementById("nav-user-area");
  const topUserContainer = document.getElementById("top-user-area");

  if (state.currentUser) {
    const meta = state.currentUser.user?.user_metadata || {};
    const name = state.currentUser.name || meta.full_name || meta.name || (state.currentUser.user?.email ? state.currentUser.user.email.split("@")[0] : "Pengguna");
    const isTeacher = isUserAdmin(state.currentUser);
    const className = state.currentUser.className || meta.class_name || "";
    const avatar = state.currentUser.avatar || meta.avatar_url;
    const roleText = isTeacher 
      ? (getLang() === "id" ? "Guru / Instruktur" : "Instructor / TA") 
      : (className ? `${getLang() === "id" ? "Siswa" : "Student"} • ${className}` : (getLang() === "id" ? "Siswa NetLearn" : "NetLearn Student"));

    const avatarHtml = avatar 
      ? `<img src="${avatar}" alt="${name}" class="w-8 h-8 rounded-full object-cover shrink-0 shadow-xs border border-outline-variant" />` 
      : `<div class="w-8 h-8 rounded-full ${isTeacher ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"} flex items-center justify-center font-bold text-xs shrink-0 shadow-xs font-mono">${name.charAt(0).toUpperCase()}</div>`;

    if (container) {
      container.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-85 transition-opacity" id="sidebar-user-click" title="${getLang() === "id" ? "Buka Profil Pengguna" : "View Profile"}">
          ${avatarHtml}
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
    }

    if (topUserContainer) {
      topUserContainer.innerHTML = `
        <div class="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity" id="top-user-click" title="${getLang() === "id" ? "Buka Profil Pengguna" : "View Profile"}">
          ${avatarHtml}
          <div class="hidden xl:flex flex-col min-w-0 max-w-[130px]">
            <span class="text-xs font-bold text-on-surface truncate leading-tight">${name}</span>
            <span class="text-[9px] text-on-surface-variant font-mono truncate leading-tight">${roleText}</span>
          </div>
        </div>
        <button class="p-1 rounded text-outline hover:text-error transition-colors ml-1 cursor-pointer" id="btn-top-logout" title="${t("navLogout")}">
          <span class="material-symbols-outlined text-[16px]">logout</span>
        </button>
      `;
      document.getElementById("top-user-click")?.addEventListener("click", () => navigateTo("profile"));
      document.getElementById("btn-top-logout")?.addEventListener("click", handleLogout);
    }
  } else {
    if (container) {
      container.innerHTML = `
        <button class="w-full py-2 px-3 bg-primary text-on-primary text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors shadow-xs cursor-pointer" id="btn-sidebar-login">
          <span class="material-symbols-outlined text-[16px]">login</span>
          <span>${t("navLogin")}</span>
        </button>
      `;
      document.getElementById("btn-sidebar-login")?.addEventListener("click", () => showAuthLayout("login"));
    }
    if (topUserContainer) {
      topUserContainer.innerHTML = `
        <button class="h-8 px-3 bg-primary text-on-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-primary-container transition-colors cursor-pointer" id="btn-top-login">
          <span class="material-symbols-outlined text-[15px]">login</span>
          <span>${t("navLogin")}</span>
        </button>
      `;
      document.getElementById("btn-top-login")?.addEventListener("click", () => showAuthLayout("login"));
    }
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
    if (text) text.textContent = "Online";
    pill.title = "Sistem Basis Data Aktif";
  } else {
    if (dot) dot.className = "w-2 h-2 rounded-full bg-tertiary";
    if (text) text.textContent = "Mode Mandiri (Lokal)";
    pill.title = "Mode Demo Mandiri Aktif";
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

  // Role Security & Dedicated Guru View Guard
  const isTeacher = isUserAdmin(state.currentUser);
  if (isTeacher) {
    // Guru hanya mengakses menu khusus Guru: admin, materials, dan profile
    if (viewName !== "admin" && viewName !== "materials" && viewName !== "profile") {
      viewName = "admin";
    }
  } else {
    // Siswa tidak boleh mengakses admin
    if (viewName === "admin") {
      showToast("Akses Ditolak", t("toastAccessDenied"), "lock");
      viewName = "dashboard";
    }
  }

  state.currentView = viewName;

  // Active navigation button updates
  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  // Breadcrumbs title update
  const isId = getLang() === "id";
  const breadcrumbMap = {
    dashboard: isId ? "Ringkasan Pembelajaran" : "Learning Overview",
    auth: isId ? "Autentikasi" : "Authentication",
    pretest: isId ? "Pretest Diagnostik" : "Diagnostic Pretest",
    posttest: isId ? "Posttest HOTS" : "HOTS Posttest",
    materials: isId ? "Modul & Materi" : "Materials & Modules",
    simulation: isId ? "Lab Simulasi & VLSM" : "Simulation Lab & VLSM",
    quizzes: isId ? "Kuis & Bank Soal" : "Quizzes & Bank",
    manual: isId ? "Panduan Pengguna" : "User Guide",
    admin: isId ? "Panel Guru" : "Teacher Console",
    minigame: isId ? "NetDrive 3D: Mini Game Quest" : "NetDrive 3D: Quest City",
    profile: isId ? "Profil" : "Profile",
    "posttest-results": isId ? "Hasil Evaluasi & Diagnostik" : "Assessment Results & Diagnostics"
  };

  const titleEl = document.getElementById("header-breadcrumb-title");
  if (titleEl) titleEl.textContent = breadcrumbMap[viewName] || "NetLearn TKJ";

  // Close mobile drawer
  document.getElementById("app-sidebar")?.classList.remove("mobile-open");
  document.getElementById("sidebar-backdrop")?.classList.remove("active");

  const appView = document.getElementById("app-view");
  if (!appView) return;

  // Stop test timer if navigating away from exam
  if (viewName !== "pretest" && viewName !== "posttest" && viewName !== "quiz") {
    stopTestTimer();
  }
  // Cleanup 3D mini-game if navigating away
  if (viewName !== "minigame") {
    cleanupNetQuestCityGame();
  }

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
    case "quiz":
      renderTestRunner(appView, params.type || "topic-1");
      break;
    case "posttest-results":
      renderResults(appView, params.result);
      break;
    case "quizzes":
      renderQuizzes(appView, params.tab || "topics");
      break;
    case "minigame":
      renderMiniGame(appView);
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
    const target = isUserAdmin(state.currentUser) ? "admin" : (state.currentUser ? "dashboard" : "auth");
    navigateTo(target);
  });
  document.getElementById("header-brand-click")?.addEventListener("click", () => {
    const target = isUserAdmin(state.currentUser) ? "admin" : (state.currentUser ? "dashboard" : "auth");
    navigateTo(target);
  });

  document.querySelectorAll(".nav-item-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
      document.getElementById("app-sidebar")?.classList.remove("mobile-open");
      document.getElementById("sidebar-backdrop")?.classList.remove("active");
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
// VIEW 1: AUTHENTICATION (Login & Register with Unified Role Detection)
// ============================================================================
function renderAuth(container, mode = "login") {
  const isLogin = mode === "login";
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-5xl mx-auto my-4 sm:my-8 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] w-full">
      
      <!-- Left Column: Form -->
      <div class="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
        <div>
          <!-- Clean Brand Header with Official Logo -->
          <div class="flex items-center gap-3.5 mb-5">
            <img src="assets/images/logo_icon.png" alt="NetLearn Logo" class="w-11 h-11 object-contain rounded-xl shadow-xs shrink-0" />
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-xl font-bold text-on-surface tracking-tight leading-none">NetLearn</h1>
              </div>
              <p class="text-xs text-on-surface-variant mt-1">
                ${isLogin 
                  ? (isId ? "Web Pembelajaran Jaringan Komputer interaktif & mandiri." : "Sign in to computer networks learning platform.")
                  : (isId ? "Buat akun baru untuk memulai pembelajaran & praktikum." : "Create a new account to access courseware & virtual lab.")}
              </p>
            </div>
          </div>

          <!-- Primary Mode Selector: Masuk vs Daftar Baru -->
          <div class="flex items-center p-1 bg-surface-container-low rounded-xl mb-5 border border-outline-variant">
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

          <!-- Form Element (Username/Email & Password) -->
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
                <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Kelas Siswa (TKJ) *" : "Student Class (TKJ) *"}</label>
                <div class="relative flex items-center">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">school</span>
                  <select 
                    id="auth-class" 
                    class="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white font-mono appearance-none cursor-pointer" 
                    required 
                  >
                    <option value="" disabled selected>${isId ? "-- Pilih Kelas TKJ --" : "-- Select TKJ Class --"}</option>
                    ${TKJ_CLASSES.map(cls => `<option value="${cls}">${cls}</option>`).join("")}
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">expand_more</span>
                </div>
                <span class="text-[10px] text-outline font-mono mt-1 block">${isId ? "Pilih langsung kelas tanpa mengetik manual" : "Select directly without typing"}</span>
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
                <button type="button" id="btn-toggle-password-visibility" class="text-[10px] font-mono text-outline hover:text-on-surface flex items-center gap-1 cursor-pointer">
                  <span class="material-symbols-outlined text-[13px]">visibility</span>
                  <span>Lihat</span>
                </button>
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

          <!-- Divider: Atau Masuk / Daftar dengan Google -->
          <div class="relative my-4 text-center">
            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-outline-variant"></div></div>
            <span class="relative bg-surface-container-lowest px-2.5 text-[10px] font-mono text-outline uppercase tracking-wider">${isId ? "Atau Lanjut Dengan" : "Or Continue With"}</span>
          </div>

          <!-- Google SSO Button Placed Below Form Credentials -->
          <div>
            <button type="button" id="btn-google-login" class="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs rounded-xl border border-outline-variant shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer">
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>${isLogin ? t("googleSignIn") : (isId ? "Daftar Cepat dengan Akun Google" : "Quick Register with Google")}</span>
            </button>
          </div>
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
            <span class="text-[11px] font-mono font-semibold tracking-wider text-sky-300 uppercase">Akademi Jaringan Komputer</span>
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

  // Password visibility toggle
  const togglePassBtn = document.getElementById("btn-toggle-password-visibility");
  const passInput = document.getElementById("auth-password");
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener("click", () => {
      const isPass = passInput.type === "password";
      passInput.type = isPass ? "text" : "password";
      togglePassBtn.innerHTML = `
        <span class="material-symbols-outlined text-[13px]">${isPass ? "visibility_off" : "visibility"}</span>
        <span>${isPass ? "Tutup" : "Lihat"}</span>
      `;
    });
  }

  // Google Sign-In / Register Handler
  document.getElementById("btn-google-login")?.addEventListener("click", async () => {
    sound.click();
    
    // Jika live Supabase OAuth aktif dan bisa redirect, coba terlebih dahulu
    if (isUsingLiveSupabase()) {
      try {
        const res = await signInWithGoogle({ role: "student" });
        if (res && res.isRedirecting) return;
      } catch (err) {
        console.log("Supabase OAuth redirect tidak aktif, membuka Google Quick Sign-In:", err);
      }
    }

    showGoogleAccountPromptModal("student");
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

  // Form submit
  document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value.trim();
    const nameEl = document.getElementById("auth-name");
    const fullName = nameEl ? nameEl.value.trim() : email.split("@")[0];
    const classEl = document.getElementById("auth-class");
    const className = classEl ? classEl.value.trim() : "";
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!email || !password) {
      showToast(isId ? "Formulir Tidak Lengkap" : "Incomplete Form", isId ? "Silakan masukkan email dan kata sandi." : "Please enter email and password.", "warning");
      return;
    }

    if (!isLogin && !className) {
      showToast(isId ? "Kelas Wajib Dipilih" : "Class is Required", isId ? "Silakan pilih kelas TKJ Anda." : "Please select your TKJ class.", "warning");
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
          role: "student",
          className
        });
      }

      state.userStats = {
        xp: 0,
        readMaterials: [],
        watchedVideos: [],
        unlockedBadges: [],
        results: []
      };
      state.currentUser = loggedUser;
      showAppLayout();
      await loadUserStats();
      updateNavUser();
      updateRoleAccess();
      updateHUD();

      const isTeacher = isUserAdmin(state.currentUser);
      if (isTeacher) {
        navigateTo("admin");
        showToast(
          isId ? "Selamat Datang, Bapak/Ibu Guru!" : "Teacher Login Success!",
          `${isId ? "Masuk ke Panel Guru NetLearn:" : "Welcome to Teacher Panel:"} ${loggedUser.name || "Guru"}`,
          "verified"
        );
      } else {
        if (loggedUser.needsProfileCompletion || (loggedUser.role === "student" && (!loggedUser.className || loggedUser.className.trim() === ""))) {
          showStudentProfileModal(loggedUser);
        }
        navigateTo("dashboard");
        showToast(
          isLogin ? (isId ? "Selamat Datang Kembali!" : "Welcome Back!") : (isId ? "Akun Berhasil Didaftarkan!" : "Account Registered!"),
          `${isId ? "Masuk sebagai" : "Logged in as"} ${loggedUser.name || fullName}`,
          "check_circle"
        );
      }
    } catch (err) {
      console.error("Auth error:", err);
      showToast(
        isLogin ? (isId ? "Gagal Masuk" : "Login Failed") : (isId ? "Gagal Mendaftar" : "Registration Failed"),
        err.message || (isId ? "Periksa kembali email dan kata sandi Anda." : "Check your email and password."),
        "error"
      );
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("opacity-60");
      }
    }
  });
}

// ============================================================================
// VIEW 2: STUDENT DASHBOARD (Dynamic Progress & Stitch Architecture)
// ============================================================================
function renderDashboard(container) {
  const meta = state.currentUser?.user?.user_metadata || {};
  const isId = getLang() === "id";
  const studentName = state.currentUser?.name || meta.full_name || (isId ? "Siswa TKJ" : "Networking Student");
  const studentClass = state.currentUser?.className || meta.class_name || "XI TKJ 1";

  // Metrics dynamically derived from active state.userStats
  const totalModules = MATERIALS.length || 6;
  const readList = state.userStats?.readMaterials || [];
  const readCount = Math.min(totalModules, readList.length);
  const percentModules = Math.round((readCount / totalModules) * 100);

  const preResult = (state.userStats?.results || []).find(r => r.type === "pre");
  const postResult = (state.userStats?.results || []).find(r => r.type === "post");

  const preScoreVal = preResult ? preResult.score : 0;
  const preTotalVal = preResult ? preResult.total : 25;
  const prePercent = preResult ? Math.round((preScoreVal / preTotalVal) * 100) : 0;

  const postScoreVal = postResult ? postResult.score : 0;
  const postTotalVal = postResult ? postResult.total : 25;
  const postPercent = postResult ? Math.round((postScoreVal / postTotalVal) * 100) : 0;

  // Hake Normalized Gain calculation: g = (post% - pre%) / (100 - pre%)
  let hakeGainLabel = "-";
  let gainDeltaLabel = "-";
  if (preResult && postResult) {
    if (prePercent >= 100) {
      hakeGainLabel = "1.00";
      gainDeltaLabel = "+0%";
    } else {
      const g = (postPercent - prePercent) / (100 - prePercent);
      hakeGainLabel = g.toFixed(2);
      const delta = postPercent - prePercent;
      gainDeltaLabel = (delta >= 0 ? "+" : "") + Math.round(delta) + "%";
    }
  }

  // Lab completed count: count of watched videos/completed labs
  const labList = state.userStats?.watchedVideos || [];
  const labCount = Math.min(totalModules, labList.length);
  const labPercent = Math.round((labCount / totalModules) * 100);

  // Helper functions for module title & summary
  const getModTitle = (m) => (isId ? (m?.title_id || m?.title) : (m?.title_en || m?.title || m?.title_id)) || "Modul Kurikulum";
  const getModSummary = (m) => (isId ? (m?.summary_id || m?.summary) : (m?.summary_en || m?.summary || m?.summary_id)) || "";

  // Active module: first unread module, or module 0
  const nextUnreadIdx = MATERIALS.findIndex(m => !readList.includes(m.id));
  const activeModIdx = nextUnreadIdx >= 0 ? nextUnreadIdx : 0;
  const activeMod = MATERIALS[activeModIdx] || MATERIALS[0];
  const activeTitle = getModTitle(activeMod);
  const activeSummary = getModSummary(activeMod);
  const isActiveModDone = readList.includes(activeMod.id);
  const activeModPercent = isActiveModDone ? 100 : (labList.includes(activeMod.id) ? 50 : 0);

  // Cognitive skills calculation
  const c4Score = postResult ? Math.min(100, Math.round(postPercent * 1.05)) : (preResult ? Math.round(prePercent * 0.9) : 0);
  const c5Score = postResult ? Math.min(100, Math.round(postPercent * 0.95)) : (preResult ? Math.round(prePercent * 0.85) : 0);
  const c6Score = postResult ? Math.min(100, Math.round(postPercent * 1.0)) : (preResult ? Math.round(prePercent * 0.8) : 0);

  // Architectural SVG Diagram & Authentic Photography mapping per module
  const modSvgMap = {
    1: "assets/images/materials/mod1_network_scopes.svg",
    2: "assets/images/materials/mod2_topologies.svg",
    3: "assets/images/materials/mod3_osi_layers.svg",
    4: "assets/images/materials/mod4_subnetting_structure.svg",
    5: "assets/images/materials/mod5_hardware_media.svg",
    6: "assets/images/materials/mod6_dns_dhcp_dora.svg"
  };
  const modPhotoMap = {
    1: "assets/images/datacenter_rack.jpg",
    2: "assets/images/network_switch.jpg",
    3: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    4: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    5: "assets/images/fiber_optics.jpg",
    6: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80"
  };
  const activeSvg = modSvgMap[activeMod.id] || modSvgMap[1];
  const activePhoto = modPhotoMap[activeMod.id] || "assets/images/network_switch.jpg";

  // Specific topic tags per module
  const modTagsMap = {
    1: ["PAN / LAN / MAN / WAN", "Bandwidth", "Latensi"],
    2: ["Star / Bus / Mesh / Ring", "Switch L2", "Collision Domain"],
    3: ["Model OSI 7 Layer", "TCP/IP Suite", "Enkapsulasi L2-L7"],
    4: ["IPv4 CIDR Prefix", "Subnet Mask", "Alokasi VLSM"],
    5: ["UTP / STP T568A/B", "Serat Optik", "Router / Switch"],
    6: ["Layanan DNS Server", "DHCP DORA Flow", "Default Gateway"]
  };

  container.innerHTML = `
    <div class="flex flex-col space-y-6 max-w-7xl mx-auto w-full">
      
      <!-- HERO WELCOME BANNER (Authentic Photography, Delicate Architectural Grid, Anti-Slop) -->
      <section class="taste-card relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-white/95 to-slate-50 border border-slate-200/90 p-6 sm:p-8 shadow-xs" data-enter="hero">
        
        <!-- Real Authentic Datacenter Photography (Soft Architectural Fade) -->
        <div class="absolute inset-y-0 right-0 w-full sm:w-2/3 pointer-events-none select-none overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80" 
            onerror="this.src='assets/images/datacenter_rack.jpg'"
            alt="Modern Enterprise Data Center Infrastructure" 
            class="w-full h-full object-cover object-right opacity-[0.22] filter contrast-125 saturate-125"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
        </div>

        <!-- Delicate Architectural Technical Grid -->
        <div class="absolute inset-0 net-blueprint-bg opacity-40 pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="space-y-4 max-w-2xl">
            <!-- Header Badges -->
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono text-xs font-semibold shadow-2xs">
                <span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                Kurikulum Merdeka • SMK TKJ
              </span>
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-600 border border-slate-200 text-xs font-medium shadow-2xs">
                ${studentClass} • Semester Genap
              </span>
            </div>

            <!-- Greeting Headline -->
            <div class="space-y-1.5">
              <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-900">
                ${isId ? `Halo, ${studentName} 👋` : `Welcome back, ${studentName} 👋`}
              </h1>
              <p class="text-sm text-slate-600 leading-relaxed max-w-xl">
                ${isId 
                  ? "Selamat datang di NetLearn. Mari jelajahi cara kerja jaringan komputer, koneksi internet, dan transmisi data melalui simulasi visual yang mudah dan menyenangkan." 
                  : "Interactive networking workstation. Master protocol architectures, experiment on virtual lab topologies, and track your analytical HOTS competencies."}
              </p>
            </div>

            <!-- Quick Action CTA Buttons -->
            <div class="flex items-center gap-3 pt-1 flex-wrap">
              <button class="taste-btn h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all" id="btn-hero-continue">
                <span class="material-symbols-outlined text-[19px]">play_circle</span>
                <span>${isActiveModDone ? (isId ? "Tinjau Materi Belajar" : "Review Modules") : (isId ? `Mulai Belajar Modul 0${activeMod.id}` : `Start Module 0${activeMod.id}`)}</span>
              </button>
              <button class="taste-btn h-10 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-medium text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors" id="btn-hero-lab">
                <span class="material-symbols-outlined text-[18px] text-indigo-600">science</span>
                <span>${isId ? "Buka Lab Simulasi" : "Open Simulator Lab"}</span>
              </button>
              <button class="taste-btn h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-medium text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors" id="btn-read-rfc">
                <span class="material-symbols-outlined text-[18px] text-slate-400">help</span>
                <span>${isId ? "Panduan Cepat" : "Quick Guide"}</span>
              </button>
            </div>
          </div>

          <!-- Right Side: Learning Progress Widget (Glass Porcelain Treatment) -->
          <div class="taste-card hidden lg:flex flex-col gap-3.5 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200 shadow-sm min-w-[280px]">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <span class="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <div>
                  <div class="font-bold text-xs text-slate-900">Kemajuan Belajar</div>
                  <div class="text-[11px] text-slate-500">6 Modul Kurikulum</div>
                </div>
              </div>
              <span class="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Aktif
              </span>
            </div>

            <div class="space-y-2.5 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-slate-600">${isId ? "Materi Selesai:" : "Completed:"}</span>
                <span class="font-bold text-slate-900">${readCount}/${totalModules} (${percentModules}%)</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" style="width: ${percentModules}%;"></div>
              </div>

              <div class="flex justify-between items-center pt-1">
                <span class="text-slate-600">${isId ? "Eksperimen Lab:" : "Lab Experiments:"}</span>
                <span class="font-bold text-emerald-700">${labCount}/${totalModules} Praktik</span>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-slate-600">${isId ? "Hasil Ujian:" : "Assessment:"}</span>
                <span class="font-bold ${postResult ? 'text-indigo-600' : (preResult ? 'text-amber-600' : 'text-slate-500')}">
                  ${postResult ? `Posttest: ${postPercent} Poin` : (preResult ? `Pretest: ${prePercent} Poin` : "Belum Ujian")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4 CLEAN METRICS ROW -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Learning Metrics">
        
        <!-- Metric 1: Module Completion -->
        <div class="taste-card bg-gradient-to-b from-white to-slate-50/70 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500">
            <span class="text-xs font-semibold text-slate-600">${isId ? "Materi Kurikulum" : "Curriculum Modules"}</span>
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">library_books</span>
            </div>
          </div>
          <div class="my-3">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">
              ${readCount} <span class="text-slate-500 font-normal text-xs">/ ${totalModules} ${isId ? "Modul Selesai" : "Modules"}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${percentModules}% ${isId ? "dari seluruh kurikulum" : "completed"}</div>
          </div>
          <div class="grid grid-cols-6 gap-1.5 pt-1">
            ${[1, 2, 3, 4, 5, 6].map(i => {
              const isDone = readList.includes(i);
              const isCurrent = i === activeMod.id && !isDone;
              return `<div class="h-1.5 rounded-full transition-all ${isDone ? 'bg-indigo-600' : (isCurrent ? 'bg-indigo-300 animate-pulse' : 'bg-slate-100')}" title="Modul 0${i}"></div>`;
            }).join("")}
          </div>
        </div>

        <!-- Metric 2: Assessment Score -->
        <div class="taste-card bg-gradient-to-b from-white to-slate-50/70 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500">
            <span class="text-xs font-semibold text-slate-600">${isId ? "Nilai Evaluasi" : "Assessment Score"}</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">psychology</span>
            </div>
          </div>
          <div class="my-3">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">
              ${postResult ? postPercent : (preResult ? prePercent : "0")} <span class="text-slate-500 font-normal text-xs">/ 100 Poin</span>
              ${postResult && preResult ? `<span class="text-xs text-emerald-600 ml-1.5 font-bold">${gainDeltaLabel}</span>` : ""}
            </div>
            <div class="text-xs text-slate-500 mt-0.5">
              ${postResult ? (isId ? "Hasil Akhir Posttest" : "Posttest Result") : (preResult ? (isId ? "Nilai Awal Pretest" : "Pretest Baseline") : (isId ? "Belum Mengerjakan Ujian" : "No Tests Taken"))}
            </div>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div class="bg-emerald-600 h-full rounded-full transition-all duration-300" style="width: ${postResult ? postPercent : prePercent}%;"></div>
          </div>
        </div>

        <!-- Metric 3: Lab Experiments -->
        <div class="taste-card bg-gradient-to-b from-white to-slate-50/70 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500">
            <span class="text-xs font-semibold text-slate-600">${isId ? "Praktik Lab Virtual" : "Lab Experiments"}</span>
            <div class="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">science</span>
            </div>
          </div>
          <div class="my-3">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">
              ${labCount} <span class="text-slate-500 font-normal text-xs">/ ${totalModules} ${isId ? "Skenario" : "Labs"}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">
              ${labCount > 0 ? (isId ? "Skenario Telah Dicoba" : "Completed Labs") : (isId ? "Siap Dieksplorasi" : "Ready to Start")}
            </div>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div class="bg-sky-500 h-full rounded-full transition-all duration-300" style="width: ${labPercent}%;"></div>
          </div>
        </div>

        <!-- Metric 4: Experience Points -->
        <div class="taste-card bg-gradient-to-b from-white to-slate-50/70 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between text-slate-500">
            <span class="text-xs font-semibold text-slate-600">${isId ? "Pencapaian XP" : "Experience Points"}</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">bolt</span>
            </div>
          </div>
          <div class="my-3">
            <div class="text-2xl font-bold text-amber-600 tracking-tight">
              ${state.userStats?.xp || 0} <span class="text-slate-500 font-normal text-xs">XP</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">${isId ? "Poin aktif dari materi & kuis" : "Earned from tests and labs"}</div>
          </div>
          <div class="flex items-center gap-1.5">
            ${[1, 2, 3, 4, 5, 6, 7].map(d => {
              const active = d <= (readCount + 1);
              return `<div class="flex-1 h-1.5 rounded-full ${active ? 'bg-amber-400' : 'bg-slate-100'}" title="Aktivitas ${d}"></div>`;
            }).join("")}
          </div>
        </div>
      </section>

      <!-- INNOVATION & FEATURED HIGHLIGHTS (New Features: 3D City Mini Game & Cisco Packet Tracer Lab) -->
      <section class="space-y-3" aria-label="Wahana Interaktif Unggulan">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <h2 class="text-sm font-bold font-mono uppercase tracking-wider text-slate-900">${isId ? "Wahana Interaktif & Fitur Baru" : "Featured Interactive Sandboxes"}</h2>
          </div>
          <span class="text-xs text-slate-500 font-mono">${isId ? "Simulasi Visual & Praktikum 3D" : "Hands-on Visual Labs"}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Card 1: NetDrive 3D City Mini Game -->
          <div class="taste-card relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 text-white p-5 sm:p-6 shadow-md flex flex-col justify-between group min-h-[190px]">
            <img 
              src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80" 
              alt="Cyber City Road Infrastructure" 
              class="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500 filter contrast-125"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

            <div class="relative z-10 space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span class="material-symbols-outlined text-[13px]">sports_esports</span>
                  3D METROPOLITAN QUEST
                </span>
                <span class="text-[11px] font-mono text-slate-400">36 Superblok Kota</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>NetDrive 3D: Network Quest City</span>
                </h3>
                <p class="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  ${isId 
                    ? "Kendarai kendaraan kurir paket data melintasi kota, antar paket TCP/UDP ke server gedung, pantau radar GPS mini-map, dan tuntaskan 6 pos kuis protokol." 
                    : "Drive a network vehicle across the city, deliver TCP/UDP packets, track GPS radar, and solve 6 protocol quiz checkpoints."}
                </p>
              </div>
            </div>

            <div class="relative z-10 flex items-center justify-between gap-3 pt-3.5 border-t border-white/10 mt-3">
              <div class="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                <span class="text-amber-400 font-bold">10 Pilihan Mobil</span>
                <span>•</span>
                <span>Misi Kurir Realtime</span>
              </div>
              <button class="taste-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer" id="btn-dash-minigame">
                <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>${isId ? "Mainkan 3D Kota" : "Play 3D Quest"}</span>
              </button>
            </div>
          </div>

          <!-- Card 2: Cisco Packet Tracer Realistic Simulator -->
          <div class="taste-card relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 text-white p-5 sm:p-6 shadow-md flex flex-col justify-between group min-h-[190px]">
            <img 
              src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=80" 
              alt="Data Center Server Switches" 
              class="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500 filter contrast-125"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>

            <div class="relative z-10 space-y-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <span class="material-symbols-outlined text-[13px]">science</span>
                  CISCO PACKET TRACER STUDIO
                </span>
                <span class="text-[11px] font-mono text-slate-400">Mode Realtime &amp; Simulasi</span>
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Laboratorium Virtual &amp; 5 Topologi</span>
                </h3>
                <p class="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  ${isId 
                    ? "Uji ping end-to-end, inspeksi paket Model OSI 7-Layer di Event List, tampak fisik port switch & router, Cisco IOS CLI terminal, dan uji kerusakan kabel." 
                    : "End-to-end ping testing, OSI 7-Layer PDU dissector, physical chassis inspection, Cisco IOS CLI terminal, and fault link simulation."}
                </p>
              </div>
            </div>

            <div class="relative z-10 flex items-center justify-between gap-3 pt-3.5 border-t border-white/10 mt-3">
              <div class="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                <span class="text-indigo-400 font-bold">5 Topologi Fisik</span>
                <span>•</span>
                <span>PDU Inspector</span>
              </div>
              <button class="taste-btn px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-mono text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer" id="btn-dash-cisco">
                <span class="material-symbols-outlined text-[16px]">terminal</span>
                <span>${isId ? "Buka Simulator Cisco" : "Open Cisco Lab"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- MAIN 2-COLUMN SECTION (8 Cols Content / 4 Cols Diagnostics) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT 8 COLS: ACTIVE FOCUS MODULE & ROADMAP -->
        <div class="lg:col-span-8 space-y-6">
          
          <!-- SPOTLIGHT: ACTIVE FOCUS MODULE -->
          <div class="taste-card bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <!-- Header Bar -->
            <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-2.5">
                <span class="px-2.5 py-1 bg-indigo-600 text-white font-mono text-xs rounded-md font-bold">TARGET: MODUL 0${activeMod.id}</span>
                <span class="text-xs text-slate-500 font-medium truncate">${activeMod.category || "Jaringan Komputer"}</span>
              </div>
              <span class="text-xs text-indigo-700 font-semibold flex items-center gap-1 font-mono">
                <span class="material-symbols-outlined text-[15px]">schedule</span>
                ${activeMod.readTime || "10 min"} • Video ${activeMod.video?.duration || "12:00"}
              </span>
            </div>

            <div class="p-5 sm:p-6 space-y-5">
              <div class="flex flex-col md:flex-row gap-5 items-start">
                
                <!-- Left: Content & Competencies -->
                <div class="space-y-3.5 flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <h2 class="text-lg font-bold font-display text-slate-900">${activeTitle}</h2>
                    <span class="text-xs font-mono font-bold ${isActiveModDone ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-indigo-700 bg-indigo-50 border border-indigo-200'} px-2.5 py-0.5 rounded-full">
                      ${activeModPercent}% ${isActiveModDone ? (isId ? "TUNTAS" : "COMPLETED") : (isId ? "SEDANG BERJALAN" : "IN PROGRESS")}
                    </span>
                  </div>

                  <p class="text-sm text-slate-600 leading-relaxed">
                    ${activeSummary || "Pelajari fundamental jaringan, analisis diagram topologi, dan ikuti simulasi interaktif."}
                  </p>

                  <!-- Competency Checklist / Learning Targets -->
                  <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div class="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Capaian Pembelajaran Modul 0${activeMod.id}:</div>
                    <div class="flex items-center gap-2 text-slate-700">
                      <span class="material-symbols-outlined text-[18px] ${isActiveModDone ? 'text-emerald-600' : 'text-slate-400'}">check_circle</span>
                      <span>Membaca konsep teori &amp; pemahaman arsitektur protokol</span>
                    </div>
                    <div class="flex items-center gap-2 text-slate-700">
                      <span class="material-symbols-outlined text-[18px] ${labList.includes(activeMod.id) ? 'text-emerald-600' : 'text-slate-400'}">check_circle</span>
                      <span>Menyimak video edukasi &amp; analisis studi kasus nyata</span>
                    </div>
                    <div class="flex items-center gap-2 text-slate-700">
                      <span class="material-symbols-outlined text-[18px] ${postResult ? 'text-emerald-600' : 'text-slate-400'}">check_circle</span>
                      <span>Eksperimen simulator &amp; evaluasi soal analitis HOTS</span>
                    </div>
                  </div>
                </div>

                <!-- Right: Schematic & Hardware Photo Preview Frame -->
                <div class="w-full md:w-64 bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col items-center justify-center shrink-0">
                  <div class="taste-photo-frame w-full h-36 rounded-lg bg-white border border-slate-200/80 p-2 flex items-center justify-center cursor-pointer shadow-xs relative overflow-hidden group">
                    <img src="${activeSvg}" alt="${activeTitle}" class="max-h-32 w-full object-contain filter drop-shadow-sm relative z-10" />
                    <img src="${activePhoto}" alt="" class="absolute inset-0 w-full h-full object-cover opacity-10 filter blur-[1px] group-hover:scale-105 transition-transform" />
                  </div>
                  <div class="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2 px-1">
                    <span>SKEMA TOPOLOGI</span>
                    <span class="text-indigo-600 font-bold">MODUL 0${activeMod.id}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                <button class="taste-btn h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer shadow-xs" id="btn-resume-lab">
                  <span class="material-symbols-outlined text-[17px]">${isActiveModDone ? "refresh" : "play_circle"}</span>
                  <span>${isActiveModDone ? (isId ? "Tinjau Modul Ini" : "Review Module") : (readCount === 0 ? (isId ? "Mulai Belajar Modul 1" : "Start Module 1") : (isId ? "Lanjutkan Modul" : "Resume Module"))}</span>
                </button>
                <button class="taste-btn h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium rounded-lg border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs" id="btn-hero-lab-secondary">
                  <span class="material-symbols-outlined text-[16px] text-indigo-600">science</span>
                  <span>${isId ? "Buka Simulator Lab" : "Open Simulator"}</span>
                </button>
                <button class="taste-btn h-9 px-3 text-slate-500 hover:text-slate-900 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ml-auto cursor-pointer" id="btn-view-all-modules">
                  <span>${isId ? "Lihat Semua Modul" : "View All"}</span>
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <!-- CURRICULUM ROADMAP MATRIX (ALL 6 MODULES) -->
          <div class="taste-card bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div class="px-5 py-4 flex items-center justify-between bg-slate-50 border-b border-slate-200">
              <div>
                <h3 class="text-sm font-bold font-display text-slate-900">${isId ? "Peta Kurikulum Modul Jaringan TKJ" : "Curriculum Modules Matrix"}</h3>
                <p class="text-xs text-slate-500 mt-0.5">${isId ? "6 Modul Berstandar Kurikulum Merdeka &amp; SKKNI" : "Accredited Vocational Track"}</p>
              </div>
              <span class="text-xs font-mono text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                ${readCount}/${totalModules} ${isId ? "Tuntas" : "Completed"}
              </span>
            </div>

            <div class="divide-y divide-slate-100">
              ${MATERIALS.map(m => {
                const isModDone = readList.includes(m.id);
                const isModActive = m.id === activeMod.id && !isModDone;
                const mTitle = getModTitle(m);
                const tags = modTagsMap[m.id] || ["Jaringan Komputer", "Protokol"];

                return `
                  <div class="taste-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isModActive ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'} transition-colors">
                    <div class="flex items-start sm:items-center gap-3.5 min-w-0">
                      <!-- Module Authentic Thumbnail Image & Number Badge -->
                      <div class="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200/90 shrink-0 shadow-2xs group-hover:scale-105 transition-transform bg-slate-100 flex items-center justify-center">
                        <img src="${modPhotoMap[m.id] || 'assets/images/network_switch.jpg'}" alt="Modul 0${m.id}" class="w-full h-full object-cover ${m.id === 3 || m.id === 4 || m.id === 6 ? 'p-1.5 object-contain' : ''}" />
                        <div class="absolute bottom-0 inset-x-0 bg-slate-900/70 backdrop-blur-xs text-[9px] font-mono text-center text-white font-bold leading-tight py-0.5">0${m.id}</div>
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-mono text-xs ${isModActive ? 'text-indigo-600 font-bold' : 'text-slate-500'}">MOD-0${m.id}</span>
                          <span class="${isModActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'} text-sm truncate">${mTitle}</span>
                          ${isModActive ? `<span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono text-[10px] rounded-full font-bold uppercase">Fokus Aktif</span>` : ""}
                          ${isModDone ? `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono text-[10px] rounded-full font-bold uppercase">Selesai</span>` : ""}
                        </div>

                        <!-- Topic Badges -->
                        <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          ${tags.map(tag => `
                            <span class="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200/80 rounded text-[11px] font-mono">${tag}</span>
                          `).join("")}
                        </div>
                      </div>
                    </div>

                    <!-- Right Status & Action Button -->
                    <div class="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <button class="taste-btn h-8 px-3.5 ${isModActive ? 'bg-indigo-600 text-white font-semibold shadow-xs' : (isModDone ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50' : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50')} text-xs rounded-lg cursor-pointer mod-review-btn flex items-center gap-1.5 transition-all" data-mod="${m.id}">
                        <span class="material-symbols-outlined text-[15px]">${isModDone ? "refresh" : "arrow_forward"}</span>
                        <span>${isModDone ? (isId ? "Tinjau" : "Review") : (isModActive ? (isId ? "Lanjutkan" : "Resume") : (isId ? "Pelajari" : "Open"))}</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>

        <!-- RIGHT 4 COLS: ASSESSMENT & LAB LAUNCHERS -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- HOTS EVALUATION DIAGNOSTIC CARD -->
          <div class="taste-card bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-indigo-600">psychology</span>
                <h3 class="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">${isId ? "Evaluasi Pemahaman HOTS" : "Bloom HOTS Mastery"}</h3>
              </div>
              <span class="px-2 py-0.5 rounded-full font-mono text-[10px] ${hakeGainLabel !== '-' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold' : 'bg-slate-50 text-slate-500 border border-slate-200'}">
                Gain: g = ${hakeGainLabel}
              </span>
            </div>

            <!-- Pretest vs Posttest Compare Box -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-600 font-medium">${isId ? "Baseline Pretest:" : "Pretest Baseline:"}</span>
                  <span class="${preResult ? 'text-amber-700 font-bold' : 'text-slate-400'}">${preResult ? `${prePercent}% (${preScoreVal}/${preTotalVal})` : (isId ? "Belum Ujian" : "Pending")}</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-amber-500 h-full rounded-full transition-all duration-300" style="width: ${prePercent}%;"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-600 font-medium">${isId ? "Nilai Akhir Posttest:" : "Final Posttest:"}</span>
                  <span class="${postResult ? 'text-indigo-600 font-bold' : 'text-slate-400'}">${postResult ? `${postPercent}% (${postScoreVal}/${postTotalVal})` : (isId ? "Belum Ujian" : "Pending")}</span>
                </div>
                <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" style="width: ${postPercent}%;"></div>
                </div>
              </div>
            </div>

            <!-- Cognitive Levels Breakdown (C4, C5, C6) -->
            <div class="space-y-3 pt-1 text-xs">
              <span class="block text-[11px] font-mono text-slate-500 uppercase font-bold tracking-wider">${isId ? "Distribusi Kemampuan Kognitif:" : "Cognitive Mastery Breakdown:"}</span>
              
              <!-- C4 -->
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-700">C4 - Analisis (Subnetting &amp; L2/L3)</span>
                  <span class="${c4Score > 0 ? 'font-bold text-indigo-600' : 'text-slate-400'}">${c4Score}%</span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-indigo-600 h-full rounded-full transition-all duration-300" style="width: ${c4Score}%;"></div>
                </div>
              </div>

              <!-- C5 -->
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-700">C5 - Sintesis (Routing Hop &amp; Gateway)</span>
                  <span class="${c5Score > 0 ? 'font-bold text-emerald-600' : 'text-slate-400'}">${c5Score}%</span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-emerald-600 h-full rounded-full transition-all duration-300" style="width: ${c5Score}%;"></div>
                </div>
              </div>

              <!-- C6 -->
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-700">C6 - Evaluasi (Troubleshooting Jaringan)</span>
                  <span class="${c6Score > 0 ? 'font-bold text-sky-600' : 'text-slate-400'}">${c6Score}%</span>
                </div>
                <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-sky-500 h-full rounded-full transition-all duration-300" style="width: ${c6Score}%;"></div>
                </div>
              </div>
            </div>

            <button class="taste-btn w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 cursor-pointer flex items-center justify-center gap-2 mt-2 transition-colors" id="btn-view-diagnostic-report">
              <span class="material-symbols-outlined text-[17px]">quiz</span>
              <span>${isId ? "Buka Lembar Evaluasi HOTS" : "View Evaluative HOTS Exam"}</span>
            </button>
          </div>

          <!-- VIRTUAL LAB LAUNCHERS -->
          <div class="taste-card bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-indigo-600">science</span>
                <h3 class="text-xs font-mono uppercase tracking-wider text-slate-900 font-bold">${isId ? "Alat Praktik Virtual Lab" : "Interactive Tools"}</h3>
              </div>
              <span class="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">READY</span>
            </div>
            
            <div class="grid grid-cols-1 gap-2.5">
              <!-- Tool 1: 3D Mini Game Quest -->
              <button class="taste-card taste-btn p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-3 transition-colors text-left cursor-pointer group" id="btn-tool-minigame">
                <div class="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                  <img src="https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=200&q=80" alt="3D City" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">${isId ? "NetDrive 3D: Petualangan Kota" : "NetDrive 3D City Quest"}</span>
                  <span class="block text-[11px] text-slate-500 mt-0.5">${isId ? "Kurir paket data & 6 pos kuis perkotaan" : "Data delivery & 6 protocol quizzes"}</span>
                </div>
              </button>

              <!-- Tool 2: Cisco Packet Tracer Lab -->
              <button class="taste-card taste-btn p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-3 transition-colors text-left cursor-pointer group" id="btn-tool-topology">
                <div class="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                  <img src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=200&q=80" alt="Lab Switch" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">${isId ? "Lab Cisco & 5 Topologi Fisik" : "Cisco Lab & 5 Topologies"}</span>
                  <span class="block text-[11px] text-slate-500 mt-0.5">${isId ? "Simulasi PDU, inspeksi frame & CLI terminal" : "Interactive topology & packet trace"}</span>
                </div>
              </button>

              <!-- Tool 3: VLSM Subnet Calculator -->
              <button class="taste-card taste-btn p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-3 transition-colors text-left cursor-pointer group" id="btn-tool-subnet">
                <div class="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                  <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=200&q=80" alt="VLSM Media" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">${isId ? "Kalkulator Subnetting VLSM" : "VLSM Subnet Calculator"}</span>
                  <span class="block text-[11px] text-slate-500 mt-0.5">${isId ? "Alokasi prefix CIDR, broadcast IP & subnet mask" : "CIDR prefix allocation & binary bits"}</span>
                </div>
              </button>

              <!-- Tool 4: Pretest Diagnostics -->
              <button class="taste-card taste-btn p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center gap-3 transition-colors text-left cursor-pointer group" id="btn-tool-pretest">
                <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-100 transition-colors">
                  <span class="material-symbols-outlined text-[20px]">quiz</span>
                </div>
                <div class="min-w-0">
                  <span class="block text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">${isId ? "Pretest Diagnostik HOTS" : "Diagnostic Pretest"}</span>
                  <span class="block text-[11px] text-slate-500 mt-0.5">25 Soal Cerita Analitis Jaringan Komputer</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Dashboard events
  const launchGameWithFullscreen = () => {
    navigateTo("minigame");
    setTimeout(() => {
      const stage = document.getElementById("netgame-viewport");
      if (stage && (stage.requestFullscreen || stage.webkitRequestFullscreen)) {
        (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage).then(() => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
        }).catch(() => {});
      }
    }, 80);
  };

  const launchSimulationWithFullscreen = () => {
    navigateTo("simulation");
    setTimeout(() => {
      const wrapper = document.getElementById("sim-fullscreen-wrapper");
      if (wrapper && (wrapper.requestFullscreen || wrapper.webkitRequestFullscreen)) {
        (wrapper.requestFullscreen || wrapper.webkitRequestFullscreen).call(wrapper).then(() => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
        }).catch(() => {
          wrapper.classList.add("sim-lab-fullscreen");
        });
      } else if (wrapper) {
        wrapper.classList.add("sim-lab-fullscreen");
      }
    }, 100);
  };

  document.getElementById("btn-dash-minigame")?.addEventListener("click", launchGameWithFullscreen);
  document.getElementById("btn-dash-cisco")?.addEventListener("click", launchSimulationWithFullscreen);
  document.getElementById("btn-tool-minigame")?.addEventListener("click", launchGameWithFullscreen);
  document.getElementById("btn-hero-continue")?.addEventListener("click", () => {
    if (activeMod) {
      openMaterialModal(activeMod.id);
    } else {
      navigateTo("materials");
    }
  });
  document.getElementById("btn-hero-lab")?.addEventListener("click", launchSimulationWithFullscreen);
  document.getElementById("btn-hero-lab-secondary")?.addEventListener("click", launchSimulationWithFullscreen);
  document.getElementById("btn-resume-lab")?.addEventListener("click", () => {
    if (activeMod) {
      openMaterialModal(activeMod.id);
    } else {
      navigateTo("materials");
    }
  });
  document.getElementById("btn-view-all-modules")?.addEventListener("click", () => navigateTo("materials"));
  document.getElementById("btn-read-rfc")?.addEventListener("click", () => navigateTo("manual"));
  document.getElementById("btn-view-diagnostic-report")?.addEventListener("click", () => {
    if (state.userStats?.results && state.userStats.results.length > 0) {
      navigateTo("posttest-results", { result: state.userStats.results[0] });
    } else {
      navigateTo("quizzes");
    }
  });
  document.getElementById("btn-tool-subnet")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-tool-topology")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-tool-pretest")?.addEventListener("click", () => navigateTo("quizzes"));

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
async function renderMaterials(container) {
  const isId = getLang() === "id";

  const modSvgMap = {
    1: "assets/images/materials/mod1_network_scopes.svg",
    2: "assets/images/materials/mod2_topologies.svg",
    3: "assets/images/materials/mod3_osi_layers.svg",
    4: "assets/images/materials/mod4_subnetting_structure.svg",
    5: "assets/images/materials/mod5_hardware_media.svg",
    6: "assets/images/materials/mod6_dns_dhcp_dora.svg"
  };

  let allMaterials = [...MATERIALS.map(m => ({ ...m, isCustom: false }))];
  try {
    const dbMats = await getMaterialsFromDb() || [];
    dbMats.forEach(dm => {
      if (!allMaterials.some(u => String(u.id) === String(dm.id))) {
        allMaterials.push({
          id: dm.id,
          title_id: dm.title_id || dm.title || "Modul Tambahan",
          title_en: dm.title_en || dm.title_id || "Additional Module",
          category: dm.category || "Jaringan Komputer",
          readTime: dm.read_time || "10 min",
          summary_id: dm.summary || dm.summary_id || "",
          summary_en: dm.summary_en || dm.summary || "",
          content_id: dm.content || dm.content_id || "",
          content_en: dm.content_en || dm.content || "",
          icon: "book",
          isCustom: true,
          video: {
            url: dm.file_url || "",
            duration: "10:00",
            title: dm.title_id || "Video Pembelajaran"
          }
        });
      }
    });
  } catch (e) {
    console.warn("Could not merge Supabase materials:", e);
  }
  window.__allLoadedMaterials = allMaterials;

  container.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-6 w-full">
      
      <!-- Materials Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>${isId ? "Portal Akademik" : "Academic Portal"}</span>
            <span class="text-outline-variant">/</span>
            <span>NetLearn</span>
            <span class="text-outline-variant">/</span>
            <span class="text-on-surface font-semibold">${isId ? "Materi & Modul" : "Course Materials"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold font-display text-on-surface tracking-tight">${t("materialsTitle")}</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant">${t("materialsSubtitle")}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="h-9 px-3.5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-export-all-materials">
            <span class="material-symbols-outlined text-[16px]">file_download</span>
            <span>${t("btnDownloadAllDocs")}</span>
          </button>
        </div>
      </div>

      <!-- Modules Grid with Architectural Previews -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="modules-cards-grid">
        ${allMaterials.map(m => {
          const isRead = state.userStats.readMaterials.includes(m.id);
          const isWatched = state.userStats.watchedVideos.includes(m.id);
          const svgPath = modSvgMap[m.id] || modSvgMap[1];

          return `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md hover:border-primary/50 transition-all duration-200">
              <!-- Visual Architectural Schematic Banner -->
              <div class="bg-[#0b1325] h-36 border-b border-outline-variant p-3 flex items-center justify-center relative overflow-hidden group">
                <img src="${svgPath}" alt="${isId ? m.title_id : m.title_en}" class="h-full w-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs border border-white/10">
                  ${m.isCustom ? (isId ? "TAMBAHAN" : "EXTRA") : `MOD-0${m.id}`}
                </span>
                <span class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded font-mono text-[10px] ${isRead ? "bg-emerald-500/90 text-white font-bold" : "bg-slate-800/80 text-gray-300"} backdrop-blur-xs">
                  ${isRead ? (isId ? "✓ TUNTAS" : "✓ COMPLETED") : (isId ? "TERSEDIA" : "AVAILABLE")}
                </span>
              </div>

              <div class="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
                      ${m.category}
                    </span>
                    <span class="px-2 py-0.2 rounded font-mono text-[10px] bg-primary/10 text-primary border border-primary/20">
                      ${m.readTime}
                    </span>
                  </div>

                  <h3 class="text-base font-bold font-display text-on-surface leading-snug mb-1.5">
                    ${isId ? m.title_id : m.title_en}
                  </h3>
                  <p class="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-4">
                    ${isId ? m.summary_id : m.summary_en}
                  </p>
                </div>

                <div class="pt-4 border-t border-outline-variant space-y-2.5">
                  <div class="flex items-center justify-between text-xs font-mono text-outline">
                    <span>${isId ? "Vidio Pembelajaran:" : "Video Lesson:"}</span>
                    <span class="${isWatched ? "text-secondary font-semibold" : ""}">${isWatched ? (isId ? "✓ Sudah Ditonton" : "✓ Watched") : (m.video?.duration || "10:00")}</span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <button class="h-8 px-2 bg-primary hover:bg-primary-container text-on-primary font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer open-material-btn shadow-xs" data-id="${m.id}">
                      <span class="material-symbols-outlined text-[15px]">menu_book</span>
                      <span>${isId ? "Baca Modul" : "Read"}</span>
                    </button>
                    <button class="h-8 px-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-medium text-xs rounded-lg border border-outline-variant flex items-center justify-center gap-1.5 transition-colors cursor-pointer open-video-btn" data-id="${m.id}">
                      <span class="material-symbols-outlined text-[15px] text-primary">play_circle</span>
                      <span>${isId ? "Tonton Video" : "Video"}</span>
                    </button>
                  </div>
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
      const id = btn.dataset.id;
      openMaterialModal(isNaN(Number(id)) ? id : Number(id));
    });
  });

  container.querySelectorAll(".open-video-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      openVideoModal(isNaN(Number(id)) ? id : Number(id));
    });
  });

  document.getElementById("btn-export-all-materials")?.addEventListener("click", () => {
    let fullHtml = `<h1>Silabus Lengkap Jaringan Komputer</h1>`;
    allMaterials.forEach(m => {
      fullHtml += `
        <hr/>
        <h2>${isId ? m.title_id : m.title_en}</h2>
        <p><strong>Kategori:</strong> ${m.category}</p>
        <div>${isId ? m.content_id : m.content_en}</div>
      `;
    });
    exportToWord("Silabus_Lengkap_Jaringan_Komputer", "Silabus Lengkap Jaringan Komputer", fullHtml);
    showToast("Mengunduh Semua Modul", "Seluruh modul pembelajaran diekspor ke Word.", "file_download");
  });
}

// ============================================================================
// VIEW 4: SIMULATION LAB & VIRTUAL WORKBENCH (Unified Mini Packet Tracer)
// ============================================================================
function renderSimulation(container) {
  const isId = getLang() === "id";

  const MODES = [
    { 
      id: "workbench", 
      label: isId ? "Simulasi Pengiriman Paket Data" : "Packet Transmission Simulator", 
      icon: "send", 
      sub: isId ? "Animasi transmisi data paket, header dissector, pengujian ping & perutean" : "Packet transmission animation, header dissector, ping & routing" 
    },
    { 
      id: "topology", 
      label: isId ? "5 Topologi Jaringan Fisik" : "5 Physical Topologies", 
      icon: "hub", 
      sub: isId ? "Topologi Bus, Star, Ring, Mesh, Tree & uji kabel rusak beraset interaktif" : "Bus, Star, Ring, Mesh, Tree & fault simulation with interactive assets" 
    },
    { 
      id: "vlsm", 
      label: isId ? "Kalkulator Pembagi IP (Subnetting)" : "IP Subnetting Calculator", 
      icon: "calculate", 
      sub: isId ? "Bagi alamat IP ruangan & hitung subnet mask" : "Subnet allocation for rooms & CIDR masks" 
    }
  ];

  let currentMode = "workbench";

  container.innerHTML = `
    <div id="sim-fullscreen-wrapper" class="max-w-7xl mx-auto space-y-6 w-full transition-all">
      
      <!-- Simulation Lab Header -->
      <div class="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-mono font-bold">
              <span class="material-symbols-outlined text-[14px]">science</span>
              ${isId ? "Laboratorium Virtual" : "Virtual Sandbox"}
            </span>
            <span class="text-xs font-mono text-outline">NetQuest Lab v3.2</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight font-headline">
            ${isId ? "Laboratorium Jaringan Komputer" : "Computer Networking Laboratory"}
          </h1>
          <p class="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            ${isId 
              ? "Ruang praktik interaktif visual. Anda dapat menguji pengiriman data paket (ping & routing), mengeksplorasi 5 topologi fisik dengan aset perangkat nyata, serta menghitung subnetting VLSM secara mandiri."
              : "Visual interactive sandbox. Test packet routing, explore 5 physical topologies with realistic hardware assets, and calculate VLSM subnets."}
          </p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
          <!-- Fullscreen Toggle Button -->
          <button id="btn-sim-fullscreen" class="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-mono font-bold text-xs rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95">
            <span class="material-symbols-outlined text-[18px]" id="sim-fs-icon">fullscreen</span>
            <span id="sim-fs-label">${isId ? "Masuk Layar Penuh (Fullscreen)" : "Enter Fullscreen"}</span>
          </button>

          <div class="p-2.5 sm:p-3 bg-surface-container-low rounded-xl border border-outline-variant flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">verified</span>
            </div>
            <div class="text-left font-mono">
              <span class="text-[9px] text-outline uppercase block">${isId ? "Status Lab" : "Lab Status"}</span>
              <span class="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ${isId ? "Siap Digunakan" : "Ready"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mode Switcher (Clean 3-Tab Bar) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        ${MODES.map(m => `
          <button 
            class="p-3.5 rounded-xl text-left transition-all duration-200 sim-mode-tab-btn flex flex-col gap-1.5 border cursor-pointer ${
              m.id === currentMode 
                ? "bg-primary text-on-primary border-primary shadow-sm" 
                : "bg-surface-container-lowest text-on-surface border-outline-variant hover:bg-surface-container hover:border-outline"
            }" 
            data-mode-id="${m.id}">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[20px]">${m.icon}</span>
              <span class="font-bold text-sm truncate">${m.label}</span>
            </div>
            <span class="text-xs opacity-85 leading-snug">${m.sub}</span>
          </button>
        `).join("")}
      </div>

      <!-- Main Active Workspace -->
      <div id="sim-active-workspace" class="w-full">
        <!-- Rendered dynamically -->
      </div>
    </div>
  `;

  const workspace = container.querySelector("#sim-active-workspace");
  const tabButtons = container.querySelectorAll(".sim-mode-tab-btn");
  const fsWrapper = container.querySelector("#sim-fullscreen-wrapper");
  const fsBtn = container.querySelector("#btn-sim-fullscreen");
  const fsIcon = container.querySelector("#sim-fs-icon");
  const fsLabel = container.querySelector("#sim-fs-label");

  function toggleSimFullscreen() {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || fsWrapper?.classList.contains("sim-lab-fullscreen"));
    if (!isFS) {
      if (fsWrapper?.requestFullscreen) {
        fsWrapper.requestFullscreen().catch(() => {
          fsWrapper.classList.add("sim-lab-fullscreen");
        });
      } else if (fsWrapper?.webkitRequestFullscreen) {
        fsWrapper.webkitRequestFullscreen();
      } else {
        fsWrapper?.classList.add("sim-lab-fullscreen");
      }
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
      sound.click();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      fsWrapper?.classList.remove("sim-lab-fullscreen");
      sound.click();
    }
  }

  fsBtn?.addEventListener("click", toggleSimFullscreen);

  const onFSChange = () => {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || fsWrapper?.classList.contains("sim-lab-fullscreen"));
    if (fsIcon) fsIcon.textContent = isFS ? "fullscreen_exit" : "fullscreen";
    if (fsLabel) fsLabel.textContent = isFS ? (isId ? "Keluar Layar Penuh" : "Exit Fullscreen") : (isId ? "Masuk Layar Penuh (Fullscreen)" : "Enter Fullscreen");
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
  };

  document.addEventListener("fullscreenchange", onFSChange);
  document.addEventListener("webkitfullscreenchange", onFSChange);


  function switchMode(modeId) {
    currentMode = modeId;
    sound.click();

    // Update buttons styling
    tabButtons.forEach(btn => {
      const bId = btn.dataset.modeId;
      if (bId === currentMode) {
        btn.classList.add("bg-primary", "text-on-primary", "border-primary", "shadow-sm");
        btn.classList.remove("bg-surface-container-lowest", "text-on-surface", "hover:bg-surface-container", "hover:border-outline");
      } else {
        btn.classList.remove("bg-primary", "text-on-primary", "border-primary", "shadow-sm");
        btn.classList.add("bg-surface-container-lowest", "text-on-surface", "hover:bg-surface-container", "hover:border-outline");
      }
    });

    renderActiveMode(modeId);
  }

  function renderActiveMode(modeId) {
    if (!workspace) return;
    workspace.innerHTML = "";

    if (modeId === "workbench") {
      // MODE 1: Dedicated Data Packet Transmission & Routing Workbench
      renderUnifiedWorkbench(workspace);
    } else if (modeId === "topology") {
      // MODE 2: Dedicated Topology Simulator (Bus, Star, Ring, Mesh, Tree)
      renderTopicSimulation(2, workspace);
    } else if (modeId === "vlsm") {
      // MODE 3: Dedicated VLSM Allocation Engine & Binary Breakdown
      workspace.innerHTML = `
        <div class="space-y-6">
          <!-- Interactive CIDR Bit Slicer -->
          <div id="mod4-cidr-box"></div>

          <!-- Multi-Department VLSM Scenario Allocation Engine -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <!-- Input Configuration Card -->
            <div class="lg:col-span-5 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-xs space-y-4">
              <div class="flex items-center justify-between border-b border-outline-variant pb-2">
                <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Konfigurasi Blok Dasar CIDR & VLSM" : "CIDR & VLSM Base Configuration"}</h3>
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
                <span class="block text-[11px] font-bold text-primary">${isId ? "Kebutuhan Host Departemen (Studi Kasus VLSM):" : "Department Host Requirements:"}</span>
                <div class="flex justify-between text-on-surface-variant">
                  <span>• Subnet A (Lab / Eng):</span> <span class="font-bold text-on-surface">60 Host (/26)</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                  <span>• Subnet B (Kantor Guru):</span> <span class="font-bold text-on-surface">28 Host (/27)</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                  <span>• Subnet C (Server DMZ):</span> <span class="font-bold text-on-surface">12 Host (/28)</span>
                </div>
                <div class="flex justify-between text-on-surface-variant">
                  <span>• Subnet D (Router WAN):</span> <span class="font-bold text-on-surface">2 Host (/30)</span>
                </div>
              </div>

              <button class="w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer" id="btn-calc-execute">
                <span class="material-symbols-outlined text-[16px]">bolt</span>
                <span>${isId ? "Hitung & Sinkronkan Alokasi VLSM" : "Calculate & Render Allocation"}</span>
              </button>
            </div>

            <!-- Output Calculations -->
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

              <!-- Subnet Allocation Table -->
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
                        <th class="p-3">Network Addr</th>
                        <th class="p-3">${isId ? "Rentang Host Valid" : "Usable Range"}</th>
                        <th class="p-3">Broadcast</th>
                        <th class="p-3">Host</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-outline-variant" id="subnet-table-body">
                      <tr class="hover:bg-surface-container-low/60">
                        <td class="p-3 font-bold text-primary">Subnet A (Lab)</td>
                        <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-bold">/26</span></td>
                        <td class="p-3" id="v-suba-net">192.168.10.0</td>
                        <td class="p-3 text-secondary font-semibold" id="v-suba-range">192.168.10.1 - 192.168.10.62</td>
                        <td class="p-3" id="v-suba-bcast">192.168.10.63</td>
                        <td class="p-3 font-bold">62</td>
                      </tr>
                      <tr class="hover:bg-surface-container-low/60">
                        <td class="p-3 font-bold text-primary">Subnet B (Guru)</td>
                        <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-bold">/27</span></td>
                        <td class="p-3" id="v-subb-net">192.168.10.64</td>
                        <td class="p-3 text-secondary font-semibold" id="v-subb-range">192.168.10.65 - 192.168.10.94</td>
                        <td class="p-3" id="v-subb-bcast">192.168.10.95</td>
                        <td class="p-3 font-bold">30</td>
                      </tr>
                      <tr class="hover:bg-surface-container-low/60">
                        <td class="p-3 font-bold text-primary">Subnet C (DMZ)</td>
                        <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-primary-fixed text-primary font-bold">/28</span></td>
                        <td class="p-3" id="v-subc-net">192.168.10.96</td>
                        <td class="p-3 text-secondary font-semibold" id="v-subc-range">192.168.10.97 - 192.168.10.110</td>
                        <td class="p-3" id="v-subc-bcast">192.168.10.111</td>
                        <td class="p-3 font-bold">14</td>
                      </tr>
                      <tr class="hover:bg-surface-container-low/60">
                        <td class="p-3 font-bold text-primary">Subnet D (WAN)</td>
                        <td class="p-3"><span class="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold">/30</span></td>
                        <td class="p-3" id="v-subd-net">192.168.10.112</td>
                        <td class="p-3 text-secondary font-semibold" id="v-subd-range">192.168.10.113 - 192.168.10.114</td>
                        <td class="p-3" id="v-subd-bcast">192.168.10.115</td>
                        <td class="p-3 font-bold">2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Binary Octet Breakdown -->
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
      `;

      // Render interactive slider box
      renderTopicSimulation(4, workspace.querySelector("#mod4-cidr-box"));

      // Recalculate button handler
      workspace.querySelector("#btn-calc-execute")?.addEventListener("click", () => {
        sound.click();
        const baseIp = workspace.querySelector("#subnet-input-ip")?.value.trim() || "192.168.10.0";
        const parts = baseIp.split(".");
        if (parts.length === 4) {
          const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
          workspace.querySelector("#v-suba-net").textContent = `${prefix}.0`;
          workspace.querySelector("#v-suba-range").textContent = `${prefix}.1 - ${prefix}.62`;
          workspace.querySelector("#v-suba-bcast").textContent = `${prefix}.63`;

          workspace.querySelector("#v-subb-net").textContent = `${prefix}.64`;
          workspace.querySelector("#v-subb-range").textContent = `${prefix}.65 - ${prefix}.94`;
          workspace.querySelector("#v-subb-bcast").textContent = `${prefix}.95`;

          workspace.querySelector("#v-subc-net").textContent = `${prefix}.96`;
          workspace.querySelector("#v-subc-range").textContent = `${prefix}.97 - ${prefix}.110`;
          workspace.querySelector("#v-subc-bcast").textContent = `${prefix}.111`;

          workspace.querySelector("#v-subd-net").textContent = `${prefix}.112`;
          workspace.querySelector("#v-subd-range").textContent = `${prefix}.113 - ${prefix}.114`;
          workspace.querySelector("#v-subd-bcast").textContent = `${prefix}.115`;
        }
        showToast(
          isId ? "Subnet Berhasil Dihitung" : "Subnets Recalculated", 
          isId ? `Tabel alokasi VLSM untuk blok dasar ${baseIp} berhasil diperbarui.` : `VLSM tables updated successfully for base network ${baseIp}.`, 
          "calculate"
        );
      });
    }
  }

  // Setup mode tab listeners
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      switchMode(btn.dataset.modeId);
    });
  });

  // Initial render: Unified Workbench
  renderActiveMode("workbench");
}

// ============================================================================
// VIEW 5: PROCTORED TEST RUNNER (Pretest & Posttest - Stitch posttest_hots_quiz)
// ============================================================================
let testTimerInterval = null;

function stopTestTimer() {
  if (testTimerInterval) {
    clearInterval(testTimerInterval);
    testTimerInterval = null;
  }
}

function startTestTimer(type) {
  stopTestTimer();
  testTimerInterval = setInterval(() => {
    if (!state.testState || !state.testState.started) {
      stopTestTimer();
      return;
    }
    state.testState.secondsRemaining--;
    const el = document.getElementById("test-timer-display");
    if (el) {
      const mins = Math.max(0, Math.floor(state.testState.secondsRemaining / 60));
      const secs = Math.max(0, state.testState.secondsRemaining % 60);
      el.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      if (state.testState.secondsRemaining <= 300) {
        el.parentElement.className = "flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 border border-red-500/40 rounded-lg font-mono text-xs font-bold text-red-400 animate-pulse";
      }
    }
    if (state.testState.secondsRemaining <= 0) {
      stopTestTimer();
      showToast(getLang() === "id" ? "Waktu Ujian Telah Habis!" : "Time's Up!", getLang() === "id" ? "Jawaban Anda otomatis dikumpulkan." : "Answers auto-submitted.", "timer_off");
      finishExam(type);
    }
  }, 1000);
}

const TOPIC_NAMES = [
  "Pengantar & Jenis Jaringan (PAN, LAN, MAN, WAN)",
  "Topologi Jaringan & Perangkat Switch/Hub",
  "Model OSI 7 Layer & Protokol Komunikasi",
  "Pengalamatan IPv4, Subnetting & VLSM",
  "Media Transmisi, Kabel UTP & Fiber Optik",
  "Layanan Jaringan: DNS, DHCP & NAT"
];

function getQuestionsForTest(type) {
  if (type && (type.startsWith("custom-") || type.startsWith("quiz-"))) {
    const customQuizzes = getCustomQuizzesSync();
    const quiz = customQuizzes.find(q => String(q.id) === String(type));
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      return quiz.questions.map((q, idx) => ({
        id: q.id || idx + 1,
        topic: 1,
        scenario_id: q.scenario || "",
        scenario_en: q.scenario || "",
        question_id: q.question,
        question_en: q.question,
        options_id: q.options.map(opt => ({
          key: opt.key,
          text: opt.text,
          correct: opt.key === q.correctKey
        })),
        options_en: q.options.map(opt => ({
          key: opt.key,
          text: opt.text,
          correct: opt.key === q.correctKey
        })),
        correct: q.correctKey,
        explanation_id: q.explanation || `Kunci jawaban yang benar adalah pilihan ${q.correctKey}.`,
        explanation_en: q.explanation || `The correct option is ${q.correctKey}.`
      }));
    }
  }
  if (type && type.startsWith("topic-")) {
    const topicId = parseInt(type.replace("topic-", ""), 10);
    return HOTS_QUESTIONS.filter(q => q.topic === topicId);
  }
  return HOTS_QUESTIONS;
}

function getTestMeta(type, isId) {
  if (type && (type.startsWith("custom-") || type.startsWith("quiz-"))) {
    const customQuizzes = getCustomQuizzesSync();
    const quiz = customQuizzes.find(q => String(q.id) === String(type));
    if (quiz) {
      return {
        title: quiz.title,
        badge: isId ? "KUIS DARI GURU" : "TEACHER QUIZ",
        durationMins: quiz.durationMins || 15,
        totalQuestions: (quiz.questions || []).length,
        description: isId 
          ? `Kuis / ulangan harian dari instruktur untuk materi ${quiz.category}.` 
          : `Custom evaluation quiz from instructor covering ${quiz.category}.`
      };
    }
  }
  if (type === "pre") {
    return {
      title: isId ? "Pretest Diagnostik Jaringan" : "Diagnostic Baseline Pretest",
      badge: isId ? "BENCHMARK AWAL" : "DIAGNOSTIC BASELINE",
      durationMins: 35,
      totalQuestions: 25,
      description: isId ? "Mengukur garis dasar pemahaman awal siswa untuk kalkulasi normalized gain Hake. Mencakup konsep fundamental arsitektur jaringan, subnetting, dan protokol komunikasi." : "Establishes initial cognitive baseline for Hake normalized gain calculation."
    };
  }
  if (type === "post") {
    return {
      title: isId ? "Ujian Akhir HOTS Posttest" : "HOTS Posttest Examination",
      badge: isId ? "SUMATIF FINAL" : "FINAL SUMMATIVE",
      durationMins: 35,
      totalQuestions: 25,
      description: isId ? "Evaluasi proctored akhir berstandar HOTS (Bloom C4 Analisis, C5 Evaluasi, C6 Pemecahan Masalah) untuk mengukur ketuntasan kompetensi teknis jaringan." : "Final evaluative assessment measuring C4 Analysis, C5 Synthesis, and C6 Evaluation mastery."
    };
  }
  if (type && type.startsWith("topic-")) {
    const topicId = parseInt(type.replace("topic-", ""), 10);
    const topicName = TOPIC_NAMES[topicId - 1] || ("Topik " + topicId);
    const qs = HOTS_QUESTIONS.filter(q => q.topic === topicId);
    return {
      title: isId ? ("Kuis Formatif: " + topicName) : ("Topic " + topicId + " Quiz: " + topicName),
      badge: isId ? ("KUIS TOPIK " + topicId) : ("TOPIC " + topicId + " QUIZ"),
      durationMins: topicId === 6 ? 12 : 10,
      totalQuestions: qs.length,
      description: isId ? ("Uji pemahaman mandiri untuk " + topicName + " berbasis studi kasus analitis HOTS.") : "Formative topic evaluation with contextual HOTS scenario questions."
    };
  }
  return {
    title: isId ? "Kuis Jaringan Komputer" : "Computer Network Quiz",
    badge: "KUIS",
    durationMins: 15,
    totalQuestions: HOTS_QUESTIONS.length,
    description: ""
  };
}

function renderTestRunner(container, type = "pre") {
  const isId = getLang() === "id";
  const meta = getTestMeta(type, isId);
  const questionsList = getQuestionsForTest(type);

  // STEP 1: If test hasn't started yet, display the YES/NO Confirmation Screen
  if (!state.testState || state.testState.type !== type || !state.testState.started) {
    stopTestTimer();

    // Check if user already took this test previously (for Remedial context)
    const prevResult = (state.userStats?.results || []).find(r => r.type === type);

    container.innerHTML = `
      <div class="max-w-xl mx-auto my-6 sm:my-10 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
        
        <!-- Icon & Badge -->
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <span class="material-symbols-outlined text-[34px]">${type.startsWith("topic-") ? "psychology" : (type === "pre" ? "assignment" : "verified")}</span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <span class="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-xs text-indigo-700 font-bold">
              ${meta.badge}
            </span>
            ${prevResult ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-mono text-[11px] text-amber-700 font-bold">${isId ? "SESI REMEDIAL" : "REMEDIAL SESSION"}</span>` : ""}
          </div>
          
          <h2 class="text-xl sm:text-2xl font-bold font-display text-slate-900">
            ${prevResult 
              ? (isId ? `Mulai Remedial ${meta.title}?` : `Start Remedial ${meta.title}?`) 
              : (isId ? `Mulai ${meta.title}?` : `Start ${meta.title}?`)}
          </h2>

          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            ${isId 
              ? `Apakah Anda siap untuk mulai mengerjakan soal sekarang? Waktu <strong>${meta.durationMins} menit</strong> akan langsung berjalan setelah Anda menekan tombol <strong>'Ya, Mulai Sekarang'</strong>.` 
              : `Are you ready to begin? The ${meta.durationMins}-minute countdown timer will start immediately once you confirm.`}
          </p>
        </div>

        <!-- Previous score badge if remedial -->
        ${prevResult ? `
          <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-mono">
            <span class="text-amber-800 font-medium">${isId ? "Nilai Sebelumnya:" : "Previous Score:"}</span>
            <span class="font-bold text-amber-900">${prevResult.score_percentage !== undefined ? prevResult.score_percentage : Math.round((prevResult.score / (prevResult.total_questions || meta.totalQuestions)) * 100)} / 100 (${prevResult.score}/${prevResult.total_questions || meta.totalQuestions} ${isId ? "Benar" : "Correct"})</span>
          </div>
        ` : ""}

        <!-- Rules & Info Grid -->
        <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-left font-mono text-xs">
          <div class="flex items-center gap-2 text-slate-700">
            <span class="material-symbols-outlined text-[18px] text-indigo-600">timer</span>
            <span>${meta.durationMins} Menit Durasi</span>
          </div>
          <div class="flex items-center gap-2 text-slate-700">
            <span class="material-symbols-outlined text-[18px] text-sky-600">quiz</span>
            <span>${meta.totalQuestions} Butir Soal HOTS</span>
          </div>
          <div class="flex items-center gap-2 text-slate-700">
            <span class="material-symbols-outlined text-[18px] text-amber-600">score</span>
            <span>Nilai Langsung Keluar</span>
          </div>
          <div class="flex items-center gap-2 text-slate-700">
            <span class="material-symbols-outlined text-[18px] text-emerald-600">refresh</span>
            <span>Bisa Remedial Ulang</span>
          </div>
        </div>

        <!-- YES / NO Confirmation Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button class="w-full sm:w-auto px-6 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm" id="btn-start-exam-yes">
            <span class="material-symbols-outlined text-[19px]">play_arrow</span>
            <span>${isId ? "Ya, Mulai Sekarang" : "Yes, Start Now"}</span>
          </button>
          <button class="w-full sm:w-auto px-6 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer" id="btn-start-exam-no">
            <span class="material-symbols-outlined text-[19px] text-slate-500">close</span>
            <span>${isId ? "Batal / Kembali" : "Cancel / Return"}</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-start-exam-yes")?.addEventListener("click", () => {
      state.testState = {
        type: type,
        started: true,
        currentIndex: 0,
        answers: new Array(questionsList.length).fill(null),
        bookmarks: new Set(),
        secondsRemaining: meta.durationMins * 60,
        sessionHash: "nq-" + Math.random().toString(36).substring(2, 6)
      };
      startTestTimer(type);
      renderTestRunner(container, type);
    });

    document.getElementById("btn-start-exam-no")?.addEventListener("click", () => {
      navigateTo("quizzes");
    });

    return;
  }

  // STEP 2: Render Active Exam with Live Countdown Timer
  const ts = state.testState;
  const q = questionsList[ts.currentIndex] || questionsList[0];

  const minutes = Math.floor(ts.secondsRemaining / 60);
  const seconds = ts.secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-6 w-full">
      <!-- Top Proctored Exam Header Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <span class="material-symbols-outlined text-[22px]">${type.startsWith("topic-") ? "psychology" : (type === "pre" ? "assignment" : "verified")}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 font-mono text-xs text-slate-500">
              <span>${isId ? "Asesmen Berbatas Waktu" : "Timed Assessment"}</span>
              <span>•</span>
              <span>Sesi: <strong class="text-slate-800">${ts.sessionHash}</strong></span>
            </div>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 font-display">${meta.title}</h1>
          </div>
        </div>

        <div class="flex items-center gap-3 self-end sm:self-auto">
          <!-- Countdown Timer Display (Running Per Second) -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs font-bold text-emerald-400">
            <span class="material-symbols-outlined text-[16px]">timer</span>
            <span id="test-timer-display">${timeFormatted}</span>
          </div>

          <button class="h-8 px-3.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm" id="btn-submit-exam-early">
            <span class="material-symbols-outlined text-[15px]">send</span>
            <span>${isId ? "Selesai & Kumpulkan" : "Submit Exam"}</span>
          </button>
        </div>
      </div>

      <!-- Main Layout: 75% Question Card & 25% Question Palette -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left 8 Cols: Active Question Card -->
        <div class="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-mono">
            <span class="px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              ${isId ? `Soal Nomor ${ts.currentIndex + 1} dari ${questionsList.length}` : `Question ${ts.currentIndex + 1} of ${questionsList.length}`}
            </span>
            <button class="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-400 transition-colors cursor-pointer bg-slate-50" id="btn-bookmark-question">
              <span class="material-symbols-outlined text-[16px] ${ts.bookmarks.has(ts.currentIndex) ? "text-amber-500 fill-1" : ""}">bookmark</span>
              <span>${ts.bookmarks.has(ts.currentIndex) ? (isId ? "Ditandai Ragu" : "Bookmarked") : (isId ? "Tandai Ragu-ragu" : "Bookmark")}</span>
            </button>
          </div>

          <!-- Question Scenario Text -->
          <div class="space-y-2">
            <div class="text-[11px] font-mono text-indigo-700 font-semibold uppercase tracking-wider">
              TOPIK: ${isId ? q.topic_id : q.topic_en}
            </div>
            <p class="text-sm sm:text-base text-slate-900 font-medium leading-relaxed">
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
                  class="p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 option-row ${isSelected ? "border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 text-indigo-950 font-medium" : "border-slate-200 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-300 text-slate-800"}"
                  data-opt-index="${optIndex}"
                >
                  <div class="w-6 h-6 rounded-full border flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${isSelected ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 bg-white text-slate-600"}">
                    ${optionLetter}
                  </div>
                  <span class="text-xs sm:text-sm leading-normal select-none">
                    ${opt.text}
                  </span>
                </div>
              `;
            }).join("")}
          </div>

          <!-- Bottom Navigation Controls -->
          <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button 
              class="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-semibold rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer ${ts.currentIndex === 0 ? "opacity-40 pointer-events-none" : ""}"
              id="btn-prev-question"
            >
              <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>${isId ? "Soal Sebelumnya" : "Previous"}</span>
            </button>

            <button 
              class="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
              id="btn-next-question"
            >
              <span>${ts.currentIndex === questionsList.length - 1 ? (isId ? "Kumpulkan Jawaban" : "Review & Submit") : (isId ? "Soal Berikutnya" : "Next Question")}</span>
              <span class="material-symbols-outlined text-[16px]">${ts.currentIndex === questionsList.length - 1 ? "check_circle" : "chevron_right"}</span>
            </button>
          </div>
        </div>

        <!-- Right 4 Cols: Question Navigator Palette Grid -->
        <div class="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 class="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">${isId ? `Daftar Soal (1-${questionsList.length})` : `Palette (${questionsList.length})`}</h3>
            <span class="text-[11px] font-mono text-indigo-700 font-bold">
              ${ts.answers.filter(a => a !== null).length} / ${questionsList.length} ${isId ? "Terjawab" : "Answered"}
            </span>
          </div>

          <!-- Grid of Buttons -->
          <div class="grid grid-cols-5 gap-2">
            ${questionsList.map((_, idx) => {
              const isAnswered = ts.answers[idx] !== null;
              const isCurrent = idx === ts.currentIndex;
              const isBookmarked = ts.bookmarks.has(idx);

              let classes = "h-9 rounded-lg font-mono text-xs font-bold border flex items-center justify-center transition-all cursor-pointer ";
              if (isCurrent) {
                classes += "border-indigo-600 bg-indigo-600 text-white shadow-sm ";
              } else if (isBookmarked) {
                classes += "border-amber-300 bg-amber-50 text-amber-800 ";
              } else if (isAnswered) {
                classes += "border-emerald-300 bg-emerald-50 text-emerald-800 ";
              } else {
                classes += "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400 ";
              }

              return `
                <button class="${classes}" data-target-index="${idx}">
                  ${idx + 1}
                </button>
              `;
            }).join("")}
          </div>

          <!-- Legend -->
          <div class="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-sm bg-emerald-100 border border-emerald-400"></span>
              <span>${isId ? "Sudah Dijawab" : "Answered"}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-sm bg-amber-100 border border-amber-400"></span>
              <span>${isId ? "Ditandai Ragu-ragu" : "Bookmarked"}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-300"></span>
              <span>${isId ? "Belum Dijawab" : "Unanswered"}</span>
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
    if (ts.currentIndex < questionsList.length - 1) {
      ts.currentIndex++;
      renderTestRunner(container, type);
    } else {
      confirmSubmitExam(type);
    }
  });

  // Direct palette click
  container.querySelectorAll("[data-target-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = parseInt(btn.dataset.targetIndex, 10);
      ts.currentIndex = target;
      renderTestRunner(container, type);
    });
  });

  document.getElementById("btn-submit-exam-early")?.addEventListener("click", () => {
    confirmSubmitExam(type);
  });
}

function confirmSubmitExam(type) {
  const ts = state.testState;
  if (!ts) return;
  const isId = getLang() === "id";
  const questionsList = getQuestionsForTest(type);
  const answered = ts.answers.filter(a => a !== null).length;
  const unanswered = questionsList.length - answered;

  const msg = isId 
    ? `Apakah Anda yakin ingin mengumpulkan ujian sekarang?\n\n• Terjawab: ${answered} soal\n• Belum dijawab: ${unanswered} soal\n\nNilai akhir dan pembahasan teknis akan langsung ditampilkan setelah dikumpulkan.`
    : `Are you sure you want to submit your exam now?\n\n• Answered: ${answered} questions\n• Unanswered: ${unanswered} questions\n\nYour score and review will be displayed immediately.`;

  if (confirm(msg)) {
    finishExam(type);
  }
}

function finishExam(type) {
  stopTestTimer();
  const ts = state.testState;
  if (!ts) return;

  const questionsList = getQuestionsForTest(type);
  const isPre = type === "pre";
  const isPost = type === "post";
  let correctCount = 0;

  questionsList.forEach((q, idx) => {
    const selected = ts.answers[idx];
    const isCorrect = selected !== null && q.options_id[selected]?.correct === true;
    if (isCorrect) correctCount++;
  });

  const finalScore100 = Math.round((correctCount / questionsList.length) * 100);

  const testResult = {
    id: `result-${Date.now()}`,
    type: type,
    score: correctCount,
    total_questions: questionsList.length,
    score_percentage: finalScore100,
    session_hash: ts.sessionHash,
    completed_at: new Date().toISOString(),
    answers: [...ts.answers]
  };

  // Persist locally
  if (!state.userStats.results) state.userStats.results = [];
  state.userStats.results.unshift(testResult);

  // Save item answers for Item Diagnostic Analysis
  try {
    saveItemAnswers({
      testType: type,
      quizId: type,
      userId: state.currentUser?.user?.id || (state.currentUser?.id || "guest"),
      studentName: state.currentUser?.name || state.currentUser?.user?.user_metadata?.name || "Siswa",
      className: state.currentUser?.className || state.currentUser?.user?.user_metadata?.class_name || "X TKJ 1",
      answers: [...ts.answers],
      totalQuestions: questionsList.length,
      score: correctCount
    });
  } catch (diagErr) {
    console.warn("Could not save diagnostic item answers:", diagErr);
  }

  const xpEarned = isPost ? 250 : (isPre ? 150 : 80);
  const xpReason = isPost ? "Menyelesaikan Ujian Posttest" : (isPre ? "Menyelesaikan Pretest Diagnostik" : "Menyelesaikan Kuis Topik");
  awardXP(xpEarned, xpReason);
  saveUserStats();

  if (state.currentUser && state.currentUser.user?.id) {
    saveTestResult({
      userId: state.currentUser.user.id,
      userName: state.currentUser.profile?.name || state.currentUser.user.email,
      userEmail: state.currentUser.user.email,
      type,
      score: correctCount,
      total: questionsList.length
    }).catch(err => console.warn("saveTestResult error:", err));
  }

  sound.badge();
  state.testState = null;
  navigateTo("posttest-results", { result: testResult });
}

// ============================================================================
// VIEW 6: ASSESSMENT RESULTS & DIAGNOSTICS (Light Mode)
// ============================================================================
function renderResults(container, testResult) {
  const isId = getLang() === "id";
  const res = testResult || state.userStats.results.find(r => r.type === "post") || state.userStats.results[0] || {
    type: "post",
    score: 20,
    total_questions: 25,
    score_percentage: 80,
    session_hash: "nq-92c1",
    completed_at: new Date().toISOString(),
    answers: new Array(25).fill(0)
  };

  const meta = getTestMeta(res.type, isId);
  const questionsToReview = getQuestionsForTest(res.type);

  const percentage = res.score_percentage !== undefined 
    ? res.score_percentage 
    : Math.round((res.score / (res.total_questions || questionsToReview.length)) * 100);

  const isPassed = percentage >= 75;
  const isPre = res.type === "pre";
  const isPost = res.type === "post";
  const isTopicQuiz = res.type.startsWith("topic-");

  // Hake Gain calculation for Pre/Post
  const preResult = state.userStats.results.find(r => r.type === "pre");
  const postResult = state.userStats.results.find(r => r.type === "post");
  let hakeLabel = "-";
  if (preResult && postResult) {
    const preP = preResult.score_percentage || Math.round((preResult.score / 25) * 100);
    const postP = postResult.score_percentage || Math.round((postResult.score / 25) * 100);
    if (preP < 100) {
      hakeLabel = ((postP - preP) / (100 - preP)).toFixed(2);
    } else {
      hakeLabel = "1.00";
    }
  }

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-6 w-full">
      
      <!-- Header Section -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase tracking-wider">
            <span>NetLearn</span>
            <span>/</span>
            <span>${isId ? "Asesmen" : "Assessments"}</span>
            <span>/</span>
            <span>${meta.title}</span>
            <span>/</span>
            <span class="text-slate-900 font-semibold">${isId ? "Hasil &amp; Pembahasan" : "Results &amp; Review"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            ${isId ? `Hasil ${meta.title}` : `${meta.title} Results`}
          </h1>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-500 mt-1">
            <span class="inline-flex items-center gap-1 ${isPassed ? 'text-emerald-700' : 'text-amber-700'} font-bold">
              <span class="w-2 h-2 rounded-full ${isPassed ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
              ${isPassed ? (isId ? "Tuntas Standar Kompetensi" : "Passed Competency") : (isId ? "Di Bawah KKM (Perlu Penguatan)" : "Needs Remedial")}
            </span>
            <span>•</span>
            <span>Sesi: <strong class="text-slate-800">${res.session_hash || "nq-session"}</strong></span>
            <span>•</span>
            <span>${new Date(res.completed_at || Date.now()).toLocaleTimeString()}</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          <!-- REMEDIAL / RETAKE BUTTON -->
          <button class="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm" id="btn-results-retake-exam">
            <span class="material-symbols-outlined text-[17px]">refresh</span>
            <span>${isId ? "Ulangi (Remedial)" : "Retake (Remedial)"}</span>
          </button>

          <button class="h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 font-mono text-xs rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer" id="btn-export-pdf-report">
            <span class="material-symbols-outlined text-[16px] text-slate-500">file_download</span>
            <span>${isId ? "Ekspor (.doc)" : "Export (.doc)"}</span>
          </button>

          <button class="h-9 px-3.5 bg-white hover:bg-slate-50 text-indigo-700 font-mono text-xs font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1" id="btn-results-back-dash">
            <span class="material-symbols-outlined text-[16px]">menu_book</span>
            <span>${isId ? "Bank Soal & Kuis" : "Quizzes Hub"}</span>
          </button>
        </div>
      </div>

      <!-- Top 3 Metrics Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <!-- Final Grade Card -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">${isId ? "Nilai Akhir" : "Final Grade"}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded ${isPassed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'} font-bold">
              ${percentage >= 85 ? "PREDIKAT A" : (percentage >= 75 ? "PREDIKAT B" : "REMEDIAL")}
            </span>
          </div>
          <div class="my-3 flex items-baseline gap-2">
            <span class="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">${percentage}</span>
            <span class="text-base font-mono text-slate-500">/ 100</span>
            <span class="text-xs font-mono text-indigo-700 ml-2">(${res.score} / ${res.total_questions || questionsToReview.length} ${isId ? "Benar" : "Correct"})</span>
          </div>
          <div class="flex items-center justify-between text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
            <span>${isId ? "Kriteria KKM: 75/100" : "Benchmark: 75/100"}</span>
            <span class="${isPassed ? 'text-emerald-700' : 'text-amber-700'} font-bold">
              ${isPassed ? `+${percentage - 75} poin di atas KKM` : `Kurang ${75 - percentage} poin`}
            </span>
          </div>
        </div>

        <!-- Metric 2: Normalized Gain (Pre/Post) OR Topic Mastery -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">${isTopicQuiz ? (isId ? "Penguasaan Materi" : "Topic Mastery") : (isId ? "Gain Ternormalisasi (Hake)" : "Normalized Gain")}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-bold">
              ${isTopicQuiz ? (percentage >= 75 ? "KOMPETEN" : "PEMULA") : `g = ${hakeLabel}`}
            </span>
          </div>
          <div class="my-3 flex items-baseline gap-2 font-mono text-sm font-bold text-slate-900">
            ${isTopicQuiz 
              ? `<span class="text-slate-800">${res.score} dari ${questionsToReview.length} Soal HOTS Terjawab Benar</span>`
              : `<span class="text-slate-500">PRE: ${preResult ? (preResult.score_percentage || Math.round(preResult.score/25*100)) + '%' : '-'}</span>
                 <span class="material-symbols-outlined text-[16px] text-indigo-600">arrow_forward</span>
                 <span class="text-indigo-700">POST: ${postResult ? (postResult.score_percentage || Math.round(postResult.score/25*100)) + '%' : '-'}</span>`
            }
          </div>
          <div class="flex items-center justify-between text-xs font-mono text-slate-500 pt-2 border-t border-slate-100">
            <span>${isId ? "Tingkat Retensi:" : "Retention Level:"}</span>
            <span class="text-indigo-700 font-bold">${percentage >= 80 ? (isId ? "Sangat Kuat" : "Very Strong") : (percentage >= 60 ? (isId ? "Cukup Baik" : "Moderate") : (isId ? "Perlu Baca Ulang" : "Review Needed"))}</span>
          </div>
        </div>

        <!-- Remedial Status & Retake Card -->
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">${isId ? "Status Remedial" : "Retake Option"}</span>
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">TERBUKA BEBAS</span>
          </div>
          <div class="my-2 text-xs text-slate-600 leading-relaxed">
            ${isId 
              ? "Anda bebas mengulang kembali kuis/ujian ini kapan saja untuk memperbaiki nilai dan memperdalam pemahaman." 
              : "You can retake this assessment anytime to boost your score and master key technical concepts."}
          </div>
          <button class="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 border border-slate-200 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5" id="btn-results-retake-exam-card">
            <span class="material-symbols-outlined text-[15px]">refresh</span>
            <span>${isId ? "Mulai Remedial Sekarang" : "Retake Now"}</span>
          </button>
        </div>
      </div>

      <!-- Question-by-Question Full Technical Review -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 class="text-sm font-bold text-slate-900 font-mono">${isId ? `Pembahasan Teknis Lengkap (${questionsToReview.length} Butir Soal)` : `Question-by-Question Technical Review (${questionsToReview.length} Items)`}</h3>
            <p class="text-xs text-slate-500 font-mono">${isId ? "Periksa jawaban Anda beserta kunci jawaban dan dasar penalaran teknisnya:" : "Detailed breakdown of questions and answer explanations:"}</p>
          </div>
          <div class="flex items-center gap-2 font-mono text-xs">
            <span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">${res.score} Benar</span>
            <span class="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-bold">${questionsToReview.length - res.score} Salah</span>
          </div>
        </div>

        <div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
          ${questionsToReview.map((q, idx) => {
            const userChoice = (res.answers && res.answers[idx] !== undefined) ? res.answers[idx] : null;
            const correctOptIdx = (isId ? q.options_id : q.options_en).findIndex(opt => opt.correct === true);
            const isCorrect = userChoice !== null && userChoice === correctOptIdx;
            const userOptText = userChoice !== null ? (isId ? q.options_id[userChoice]?.text : q.options_en[userChoice]?.text) : (isId ? "Tidak Dijawab" : "Unanswered");
            const correctOptText = isId ? q.options_id[correctOptIdx]?.text : q.options_en[correctOptIdx]?.text;

            return `
              <div class="p-4 bg-white hover:bg-slate-50/70 transition-colors space-y-2">
                <div class="flex items-center justify-between font-mono text-[11px] text-slate-500">
                  <span class="text-slate-900 font-bold">SOAL #${idx + 1} • ${isId ? q.topic_id : q.topic_en}</span>
                  <span class="${isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'} flex items-center gap-1">
                    <span class="material-symbols-outlined text-[15px]">${isCorrect ? "check_circle" : "cancel"}</span>
                    ${isCorrect ? (isId ? "Jawaban Anda Benar" : "Correct") : (isId ? "Jawaban Anda Salah" : "Incorrect")}
                  </span>
                </div>

                <p class="font-medium text-slate-800 leading-relaxed">${isId ? q.question_id : q.question_en}</p>

                <!-- Answers Comparison -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div class="p-2.5 rounded-lg border ${isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}">
                    <span class="block text-[10px] uppercase font-bold text-slate-500">${isId ? "Jawaban Anda:" : "Your Answer:"}</span>
                    <span class="font-semibold">${userChoice !== null ? String.fromCharCode(65 + userChoice) + '. ' : ''}${userOptText}</span>
                  </div>
                  ${!isCorrect ? `
                    <div class="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900">
                      <span class="block text-[10px] uppercase font-bold text-slate-500">${isId ? "Kunci Jawaban Benar:" : "Correct Key:"}</span>
                      <span class="font-semibold">${String.fromCharCode(65 + correctOptIdx)}. ${correctOptText}</span>
                    </div>
                  ` : ""}
                </div>

                <!-- Technical Explanation -->
                <div class="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 font-mono text-[11px] text-slate-700 leading-relaxed">
                  <span class="font-bold text-blue-900">${isId ? "Pembahasan Teknis:" : "Explanation:"}</span> ${isId ? q.explanation_id : q.explanation_en}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;

  // Remedial retake triggers
  const triggerRetake = () => {
    const confirmMsg = isId 
      ? `Apakah Anda ingin mengulang ${meta.title} dari awal (Remedial)?\n\nWaktu ujian akan diulang dari awal dan skor baru akan otomatis memperbarui capaian Anda.`
      : `Do you want to retake ${meta.title} from the beginning?\n\nThe timer will reset and your new score will be updated.`;

    if (confirm(confirmMsg)) {
      state.testState = null;
      if (res.type === "pre") {
        navigateTo("pretest");
      } else if (res.type === "post") {
        navigateTo("posttest");
      } else {
        navigateTo("quiz", { type: res.type });
      }
    }
  };

  document.getElementById("btn-results-retake-exam")?.addEventListener("click", triggerRetake);
  document.getElementById("btn-results-retake-exam-card")?.addEventListener("click", triggerRetake);
  document.getElementById("btn-results-back-dash")?.addEventListener("click", () => navigateTo("quizzes"));

  document.getElementById("btn-export-pdf-report")?.addEventListener("click", () => {
    exportToWord("Laporan_Hasil_" + res.type, "Laporan Evaluasi Asesmen", `
      <h1>Hasil ${meta.title} &amp; Pembahasan Teknis</h1>
      <p>Peserta: ${state.currentUser?.name || "Siswa TKJ"} (${state.currentUser?.className || "XI TKJ"})</p>
      <p>Nilai Akhir: ${percentage}/100 (${isPassed ? "TUNTAS STANDAR KOMPETENSI" : "PERLU REMEDIAL"})</p>
      <p>Soal Terjawab Benar: ${res.score} dari ${questionsToReview.length}</p>
    `);
    showToast(isId ? "Laporan Berhasil Diunduh" : "Report Exported", isId ? "Laporan format Word (.doc) telah disimpan." : "Diagnostic report downloaded.", "file_download");
  });
}

// ============================================================================
// ============================================================================
// VIEW 6B: 3D MINI GAME QUEST CITY (Kenney Car & City Kit)
// ============================================================================
function renderMiniGame(container) {
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-4 w-full">
      <!-- Top Control Bar -->
      <div class="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <button class="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0" id="btn-game-back-to-quizzes">
            <span class="material-symbols-outlined text-[17px]">arrow_back</span>
            <span class="hidden sm:inline">${isId ? "Kembali ke Asesmen" : "Back to Assessments"}</span>
            <span class="sm:hidden">${isId ? "Kembali" : "Back"}</span>
          </button>
          <div class="min-w-0">
            <h1 class="text-sm sm:text-lg font-bold text-slate-900 font-display flex items-center gap-2 flex-wrap">
              <span>NetDrive 3D: Network Quest City</span>
              <span class="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">METROPOLITAN QUEST</span>
            </h1>
            <p class="text-[10px] sm:text-[11px] text-slate-500 font-mono line-clamp-1 sm:line-clamp-none">
              ${isId ? "Kendalikan kendaraan jaringan, antar paket data TCP/UDP ke server tujuan, kumpulkan token protokol, dan pecahkan kuis HOTS!" : "Drive your network vehicle, deliver TCP/UDP data packets, collect protocol tokens, and solve HOTS challenges across districts!"}
            </p>
          </div>
        </div>

        <!-- HUD Quick Stats & Actions -->
        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div class="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs">
            <div class="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center gap-1 sm:gap-1.5">
              <span class="material-symbols-outlined text-[15px] sm:text-[16px]">stars</span>
              <span>Skor: <strong id="hud-game-score">0</strong></span>
            </div>
            <div class="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-1 sm:gap-1.5">
              <span class="material-symbols-outlined text-[15px] sm:text-[16px]">verified</span>
              <span>Pos: <strong id="hud-game-progress">0 / 6</strong></span>
            </div>
            <div class="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold flex items-center gap-1 sm:gap-1.5">
              <span class="material-symbols-outlined text-[15px] sm:text-[16px]">local_shipping</span>
              <span>Kurir: <strong id="hud-courier-progress">0</strong></span>
            </div>
          </div>

          <!-- Car Model Selector -->
          <div class="flex items-center gap-1.5">
            <label class="text-[11px] font-mono text-slate-500 font-bold hidden sm:inline">${isId ? "Mobil:" : "Car:"}</label>
            <select id="select-game-car-model" class="h-8 px-2 sm:px-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer font-bold max-w-[150px] sm:max-w-none">
              <option value="delivery">📦 Mobil Kurir Paket Data</option>
              <option value="race-future">🏎️ Cyber Future Supercar</option>
              <option value="sedan-sports">🏎️ Sports Sedan Turbo</option>
              <option value="suv-luxury">🚙 Luxury Cyber SUV</option>
              <option value="police">🚓 Mobil Polisi Siber</option>
              <option value="race">🏎️ Formula Super Racer</option>
              <option value="taxi">🚕 Taksi Jaringan Kota</option>
              <option value="ambulance">🚑 Ambulans Respons Cepat</option>
              <option value="firetruck">🚒 Truk Penyelamat Siber</option>
              <option value="sedan">🚗 Sedan Klasik</option>
            </select>
          </div>

          <button class="h-8 px-2 sm:px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-mono font-medium flex items-center gap-1 cursor-pointer transition-colors" id="btn-game-reset-pos" title="Kembalikan mobil ke titik awal (R)">
            <span class="material-symbols-outlined text-[15px]">restart_alt</span>
            <span>Reset (R)</span>
          </button>

          <button class="h-8 px-2.5 sm:px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors" id="btn-game-toggle-fullscreen" title="Layar Penuh (Landscape)">
            <span class="material-symbols-outlined text-[17px]" id="icon-game-fullscreen">fullscreen</span>
            <span id="text-game-fullscreen" class="hidden sm:inline">Layar Penuh</span>
          </button>
        </div>
      </div>

      <!-- 3D Canvas Stage & Floating HUD (Responsive Viewport) -->
      <div class="relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 select-none h-[420px] sm:h-[500px] md:h-[620px]" id="netgame-viewport">
        <!-- Three.js Canvas Container -->
        <div id="netgame-canvas-mount" class="w-full h-full"></div>

        <!-- Floating Center Top: Fullscreen Toggle & Rotation Helper -->
        <button class="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-800 active:bg-indigo-600 text-white border border-slate-700 rounded-xl font-mono text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg cursor-pointer transition-all select-none touch-manipulation" id="btn-viewport-fullscreen" title="Beralih Mode Layar Penuh">
          <span class="material-symbols-outlined text-[15px]" id="icon-viewport-fullscreen">fullscreen</span>
          <span id="text-viewport-fullscreen">Layar Penuh</span>
        </button>

        <!-- Floating Rotate Hint Banner for Mobile Screen -->
        <div id="netgame-rotate-hint" class="hidden absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-amber-400 text-white px-3.5 py-2 rounded-xl font-mono text-[10px] sm:text-xs shadow-2xl flex items-center gap-2 pointer-events-auto">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">screen_rotation</span>
          <span>Putar HP ke Landscape (Mendatar)</span>
          <button id="btn-close-rotate-hint" class="ml-1 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer">✕</button>
        </div>

        <!-- Floating Top-Left: Active Data Courier Mission HUD -->
        <div id="netgame-courier-card" class="absolute top-3 left-3 sm:top-4 sm:left-4 bg-slate-900/90 backdrop-blur-md border border-amber-500/50 rounded-xl p-2 sm:p-2.5 shadow-xl max-w-[170px] sm:max-w-xs pointer-events-none flex items-center gap-2 sm:gap-2.5 z-10">
          <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[18px] sm:text-[22px]">local_shipping</span>
          </div>
          <div class="font-mono text-left min-w-0 flex-1">
            <div class="flex items-center gap-1">
              <span class="text-[8px] sm:text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400/50 uppercase leading-none">KURIR</span>
              <span id="courier-target-type" class="text-[9px] sm:text-[10px] text-cyan-300 font-bold truncate">[TCP:443]</span>
            </div>
            <div id="courier-target-name" class="text-[10px] sm:text-xs font-bold text-white mt-0.5 truncate">Tujuan: Bank Sentral</div>
            <div class="flex items-center gap-2 text-[9px] text-slate-300 mt-0.5">
              <span id="courier-target-dist">-- m</span>
              <span id="courier-ping" class="text-emerald-400 font-bold">18 ms</span>
            </div>
          </div>
        </div>

        <!-- Floating Top-Center: Token Collection Toast Banner -->
        <div id="netgame-token-toast" class="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-emerald-500/60 text-white rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-2xl flex items-center gap-2 font-mono text-[10px] sm:text-xs pointer-events-none transition-all duration-300 opacity-0 -translate-y-2 z-30">
          <span class="material-symbols-outlined text-emerald-400 text-[16px] sm:text-[18px]">bolt</span>
          <span id="netgame-token-text">+30 XP! Token Protokol Ditemukan</span>
        </div>

        <!-- Floating Top-Right: Minimap Radar -->
        <div class="absolute top-3 right-3 sm:top-4 sm:right-4 bg-slate-900/85 backdrop-blur-md border border-sky-500/40 rounded-xl p-2 sm:p-2.5 shadow-xl flex flex-col items-center pointer-events-none z-10">
          <div class="flex items-center justify-between w-full pb-1 border-b border-sky-500/20 text-[9px] sm:text-[10px] font-mono text-sky-300 font-bold uppercase tracking-wider">
            <span>Radar Kota 3D</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <canvas id="netgame-radar-canvas" width="95" height="95" class="mt-1"></canvas>
          <div class="flex items-center gap-2 pt-1 text-[8.5px] sm:text-[9px] font-mono text-slate-300">
            <span class="flex items-center gap-0.5"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pos</span>
            <span class="flex items-center gap-0.5"><span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Kurir</span>
            <span class="flex items-center gap-0.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Tuntas</span>
          </div>
        </div>

        <!-- Floating Center Bottom: Speedometer, Nitro & Desktop Controls Hint -->
        <div class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-2xl text-center pointer-events-none z-10 min-w-[130px] sm:min-w-[210px]">
          <div class="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Kecepatan</div>
          <div class="text-xl sm:text-2xl font-black font-mono text-emerald-400 leading-tight" id="netgame-speed-gauge">0 km/h</div>
          
          <!-- Nitro Gauge -->
          <div class="mt-1 space-y-0.5">
            <div class="flex items-center justify-between text-[8px] font-mono text-slate-300">
              <span class="flex items-center gap-0.5 text-cyan-300"><span class="material-symbols-outlined text-[11px]">bolt</span> NITRO</span>
              <span id="netgame-nitro-text" class="text-cyan-300 font-bold">100%</span>
            </div>
            <div class="w-24 sm:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 mx-auto">
              <div id="netgame-nitro-bar" class="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-75" style="width: 100%;"></div>
            </div>
          </div>

          <div class="hidden sm:block pt-1.5 mt-1 border-t border-slate-800 text-[9.5px] font-mono text-slate-300 space-y-0.5 text-left">
            <div><strong class="text-indigo-400">W/↑</strong> Gas &bull; <strong class="text-indigo-400">S/↓</strong> Mundur &bull; <strong class="text-cyan-400">Shift</strong> Nitro</div>
            <div><strong class="text-indigo-400">A/D</strong> Belok &bull; <strong class="text-indigo-400">Spasi</strong> Rem &bull; <strong class="text-indigo-400">E</strong> Interaksi</div>
          </div>
        </div>

        <!-- Floating Bottom-Left: On-Screen Touch Controls (Maju, Mundur, Rem, Nitro - Left Hand Drive Pedals) -->
        <div class="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex items-end gap-2 pointer-events-auto select-none touch-none">
          <!-- Main Pedals: Gas (Maju) & Mundur (Reverse) -->
          <div class="flex flex-col gap-1.5">
            <button class="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-2xl bg-emerald-600/90 active:bg-emerald-400 active:scale-95 text-white border border-emerald-400/80 font-mono text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg cursor-pointer transition-all touch-none select-none" id="btn-touch-gas" title="Maju / Gas (W / ↑)">
              <span class="material-symbols-outlined text-[24px]">keyboard_arrow_up</span>
              <span>MAJU</span>
            </button>
            <button class="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-2xl bg-amber-600/90 active:bg-amber-400 active:scale-95 text-white border border-amber-400/80 font-mono text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 shadow-lg cursor-pointer transition-all touch-none select-none" id="btn-touch-reverse" title="Mundur / Reverse (S / ↓)">
              <span class="material-symbols-outlined text-[24px]">keyboard_arrow_down</span>
              <span>MUNDUR</span>
            </button>
          </div>

          <!-- Auxiliary: Nitro & Rem -->
          <div class="flex flex-col gap-1.5">
            <button class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-600/90 active:bg-cyan-400 active:scale-95 text-white border border-cyan-400/80 font-mono text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 shadow-md cursor-pointer transition-all touch-none select-none" id="btn-touch-nitro" title="Nitro Boost (Shift)">
              <span class="material-symbols-outlined text-[16px]">bolt</span>
              <span>NITRO</span>
            </button>
            <button class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-600/90 active:bg-rose-400 active:scale-95 text-white border border-rose-400/80 font-mono text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 shadow-md cursor-pointer transition-all touch-none select-none" id="btn-touch-brake" title="Rem / Drift (Spasi)">
              <span class="material-symbols-outlined text-[16px]">front_hand</span>
              <span>REM</span>
            </button>
          </div>
        </div>

        <!-- Floating Bottom-Right: On-Screen Touch Controls (Kiri & Kanan - Right Hand Steering) -->
        <div class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center gap-2 pointer-events-auto select-none touch-none">
          <button class="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-2xl bg-slate-900/90 active:bg-indigo-600 active:scale-95 text-white border border-slate-700/80 shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all touch-none select-none" id="btn-touch-left" title="Belok Kiri (A / ←)">
            <span class="material-symbols-outlined text-[24px]">arrow_back</span>
            <span class="text-[9px] font-mono font-bold text-slate-300 tracking-wider">KIRI</span>
          </button>
          <button class="w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-2xl bg-slate-900/90 active:bg-indigo-600 active:scale-95 text-white border border-slate-700/80 shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all touch-none select-none" id="btn-touch-right" title="Belok Kanan (D / →)">
            <span class="material-symbols-outlined text-[24px]">arrow_forward</span>
            <span class="text-[9px] font-mono font-bold text-slate-300 tracking-wider">KANAN</span>
          </button>
        </div>

        <!-- Floating Center Above Dashboard: Proximity Prompt -->
        <div id="netgame-prompt-container" class="hidden absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        </div>

        <!-- Floating Boundary Warning Notification -->
        <div id="netgame-boundary-alert" class="hidden absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all">
          <div class="px-4 py-2.5 rounded-xl bg-slate-900/95 border border-rose-500/80 text-white font-mono text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-bounce">
            <span class="material-symbols-outlined text-amber-400 text-[20px]">fmd_bad</span>
            <span class="tracking-wide text-rose-200">BATAS KOTA: Area Terlarang! Silakan Putar Balik</span>
          </div>
        </div>

        <!-- In-Game Question Modal Overlay Mount (Inside Viewport for Flawless Fullscreen Mode) -->
        <div id="netgame-modal-overlay" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        </div>

        <!-- Victory Celebration Modal (All 6 Stations Completed) -->
        <div id="netgame-victory-modal" class="hidden fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-scale-up">
            <div class="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-md">
              <span class="material-symbols-outlined text-[44px]">emoji_events</span>
            </div>

            <div class="space-y-1.5">
              <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-bold uppercase tracking-wider">MISI 100% TUNTAS</span>
              <h2 class="text-2xl font-bold font-display text-slate-900">Grand Champion NetDrive!</h2>
              <p class="text-xs text-slate-600 leading-relaxed">
                Selamat! Anda telah berhasil menuntaskan seluruh 6 pos misi studi kasus jaringan di kota 3D dengan hasil memuaskan!
              </p>
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-center font-mono text-xs">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Total Skor</span>
                <span class="text-2xl font-black text-indigo-700" id="victory-score-display">600</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-bold">Bonus XP</span>
                <span class="text-2xl font-black text-emerald-700">+300 XP</span>
              </div>
            </div>

            <div class="pt-2">
              <button class="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm" id="btn-victory-claim-back">
                <span class="material-symbols-outlined text-[18px]">verified</span>
                <span>Klaim Hadiah &amp; Kembali</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Back Button
  document.getElementById("btn-game-back-to-quizzes")?.addEventListener("click", () => {
    cleanupNetQuestCityGame();
    navigateTo("quizzes");
  });

  // Fullscreen and Landscape Support for Mobile and Desktop
  const stageViewport = document.getElementById("netgame-viewport");

  const enterGameFullscreen = () => {
    if (!stageViewport) return;
    const req = stageViewport.requestFullscreen || stageViewport.webkitRequestFullscreen || stageViewport.mozRequestFullScreen || stageViewport.msRequestFullscreen;
    if (req) {
      req.call(stageViewport).then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock("landscape").catch(() => {});
        }
      }).catch(() => {});
    }
  };

  const exitGameFullscreen = () => {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
    if (exit) {
      exit.call(document).then(() => {
        if (screen.orientation && screen.orientation.unlock) {
          try { screen.orientation.unlock(); } catch (e) {}
        }
      }).catch(() => {});
    }
  };

  const toggleGameFullscreen = () => {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!isFS) {
      enterGameFullscreen();
    } else {
      exitGameFullscreen();
    }
  };

  document.getElementById("btn-game-toggle-fullscreen")?.addEventListener("click", toggleGameFullscreen);
  document.getElementById("btn-viewport-fullscreen")?.addEventListener("click", toggleGameFullscreen);

  const rotateHintEl = document.getElementById("netgame-rotate-hint");
  document.getElementById("btn-close-rotate-hint")?.addEventListener("click", () => {
    rotateHintEl?.classList.add("hidden");
  });

  const checkOrientationHint = () => {
    if (!rotateHintEl) return;
    const isMobile = window.innerWidth <= 768;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isMobile && isPortrait) {
      rotateHintEl.classList.remove("hidden");
    } else {
      rotateHintEl.classList.add("hidden");
    }
  };

  const onFSChange = () => {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const icon1 = document.getElementById("icon-game-fullscreen");
    const text1 = document.getElementById("text-game-fullscreen");
    const icon2 = document.getElementById("icon-viewport-fullscreen");
    const text2 = document.getElementById("text-viewport-fullscreen");

    if (isFS) {
      if (icon1) icon1.textContent = "fullscreen_exit";
      if (text1) text1.textContent = "Keluar Penuh";
      if (icon2) icon2.textContent = "fullscreen_exit";
      if (text2) text2.textContent = "Keluar";
      stageViewport?.classList.add("game-stage-fullscreen");
    } else {
      if (icon1) icon1.textContent = "fullscreen";
      if (text1) text1.textContent = "Layar Penuh";
      if (icon2) icon2.textContent = "fullscreen";
      if (text2) text2.textContent = "Layar Penuh";
      stageViewport?.classList.remove("game-stage-fullscreen");
    }

    checkOrientationHint();
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 150);
  };

  document.addEventListener("fullscreenchange", onFSChange);
  document.addEventListener("webkitfullscreenchange", onFSChange);
  window.addEventListener("resize", checkOrientationHint);
  window.addEventListener("orientationchange", checkOrientationHint);
  checkOrientationHint();

  // Attach Model Selector
  const carSelect = document.getElementById("select-game-car-model");
  carSelect?.addEventListener("change", (e) => {
    if (activeGameInstance) {
      activeGameInstance.setCar(e.target.value);
    }
  });

  // Attach Reset Button
  document.getElementById("btn-game-reset-pos")?.addEventListener("click", () => {
    if (activeGameInstance) activeGameInstance.reset();
  });

  // Touch Screen Buttons Support
  const simulateKey = (code, isDown) => {
    window.dispatchEvent(new KeyboardEvent(isDown ? "keydown" : "keyup", { code, bubbles: true }));
  };

  const bindTouch = (id, code) => {
    const el = document.getElementById(id);
    if (!el) return;
    const startHandler = (e) => {
      if (e.cancelable && e.type && e.type.startsWith("touch")) e.preventDefault();
      simulateKey(code, true);
    };
    const endHandler = (e) => {
      if (e.cancelable && e.type && e.type.startsWith("touch")) e.preventDefault();
      simulateKey(code, false);
    };
    el.addEventListener("mousedown", startHandler);
    el.addEventListener("mouseup", endHandler);
    el.addEventListener("mouseleave", endHandler);
    el.addEventListener("touchstart", startHandler, { passive: false });
    el.addEventListener("touchend", endHandler, { passive: false });
    el.addEventListener("touchcancel", endHandler, { passive: false });
  };

  bindTouch("btn-touch-left", "KeyA");
  bindTouch("btn-touch-right", "KeyD");
  bindTouch("btn-touch-gas", "KeyW");
  bindTouch("btn-touch-reverse", "KeyS");
  bindTouch("btn-touch-brake", "Space");
  bindTouch("btn-touch-nitro", "ShiftLeft");

  // Initialize the 3D Game Engine
  const mountEl = document.getElementById("netgame-canvas-mount");
  let activeGameInstance = null;

  if (mountEl) {
    activeGameInstance = initNetQuestCityGame(mountEl, {
      lang: isId ? "id" : "en",
      onScoreUpdate: (score, solvedCount, totalStations) => {
        const scoreEl = document.getElementById("hud-game-score");
        const progEl = document.getElementById("hud-game-progress");
        if (scoreEl) scoreEl.textContent = score;
        if (progEl) progEl.textContent = `${solvedCount} / ${totalStations}`;
      },
      onCourierComplete: (mission, totalCompleted) => {
        const cEl = document.getElementById("hud-courier-progress");
        if (cEl) cEl.textContent = totalCompleted;
        awardXP(150, `Misi Kurir Data: ${mission.name}`);
        saveUserStats();
        showToast("Pengiriman Sukses!", `${mission.title} (${mission.type})`, "local_shipping");
      },
      onTokenCollect: (token) => {
        awardXP(30, `Token Protokol: ${token.name}`);
        saveUserStats();
      },
      onStationComplete: (stationConfig, score) => {
        awardXP(50, `Tuntas Pos ${stationConfig.id}: ${stationConfig.title}`);
        saveUserStats();
        showToast("Pos Misi Selesai!", `${stationConfig.title} (${score}/5 Benar)`, "verified");
      },
      onGameComplete: (totalScore) => {
        const victoryModal = document.getElementById("netgame-victory-modal");
        const scoreDisp = document.getElementById("victory-score-display");
        if (scoreDisp) scoreDisp.textContent = totalScore;
        awardXP(300, "Menyelesaikan Seluruh Misi NetDrive 3D Quest City");
        saveUserStats();
        sound.badge();
        victoryModal?.classList.remove("hidden");

        document.getElementById("btn-victory-claim-back")?.addEventListener("click", () => {
          victoryModal?.classList.add("hidden");
          cleanupNetQuestCityGame();
          navigateTo("quizzes");
        });
      }
    });
  }
}

// ============================================================================
// VIEW 7: PORTAL ASESMEN & ARENA 3D QUEST (Light Mode)
// ============================================================================
function renderQuizzes(container) {
  const isId = getLang() === "id";
  const customQuizzes = getCustomQuizzesSync();
  const activeCustomQuizzes = customQuizzes.filter(q => q.status === "active");

  const preResult = (state.userStats?.results || []).find(r => r.type === "pre");
  const postResult = (state.userStats?.results || []).find(r => r.type === "post");
  const preScore = preResult ? (preResult.score_percentage !== undefined ? preResult.score_percentage : Math.round((preResult.score / 25) * 100)) : null;
  const postScore = postResult ? (postResult.score_percentage !== undefined ? postResult.score_percentage : Math.round((postResult.score / 25) * 100)) : null;

  container.innerHTML = `
    <div class="max-w-6xl mx-auto space-y-6 w-full">
      
      <!-- Top Title & Stats Banner -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-slate-500 uppercase tracking-wider">
            <span>NetLearn</span>
            <span>/</span>
            <span>${isId ? "Asesmen" : "Assessments"}</span>
            <span>/</span>
            <span class="text-slate-900 font-semibold">${isId ? "Pusat Evaluasi & Mini Game 3D" : "Evaluation & 3D Quest"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
            ${isId ? "Pusat Asesmen & Arena Penjelajahan 3D" : "Assessment & 3D Quest Hub"}
          </h1>
          <p class="text-xs sm:text-sm text-slate-600 mt-1">
            ${isId ? "Uji kompetensi Anda melalui mini game 3D kota metropolitan dan evaluasi kurikulum resmi (Pretest & Posttest HOTS)." : "Test your skills in the 3D city mini game and curriculum evaluation assessments."}
          </p>
        </div>

        <!-- Quick Summary Stats -->
        <div class="flex items-center gap-2 font-mono text-xs">
          <span class="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">Mini Game 3D</span>
          <span class="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">2 Evaluasi Kurikulum</span>
          <span class="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 font-bold">30 Soal HOTS</span>
        </div>
      </div>

      <!-- MAIN FEATURE 1: 3D Mini-Game Hero Showcase (Kenney 3D City & Car Kit) -->
      <div class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/40 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
        
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div class="space-y-3 max-w-2xl">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-full text-[11px] font-mono bg-indigo-500/30 text-indigo-300 border border-indigo-400/50 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>MINI GAME 3D INTERAKTIF</span>
              </span>
              <span class="text-xs font-mono text-slate-300">• Eksplorasi Kota &amp; Ekspedisi Kurir Jaringan 3D</span>
            </div>

            <h2 class="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              NetDrive 3D: Network Quest City
            </h2>

            <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ${isId 
                ? "Kendarai supercar pilihan Anda menjelajahi jalanan aspal kota metropolitan 3D. Temukan <strong>6 Pos Menara Sinyal</strong> di persimpangan jalan tematik dan selesaikan <strong>5 soal tantangan HOTS per pos</strong> untuk menguasai seluruh kurikulum jaringan!" 
                : "Drive your 3D car through city avenues, locate 6 thematic data towers, and solve 5 scenario questions per station to master networking!"}
            </p>

            <!-- 4 Key Game Features Pills -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs font-mono">
              <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span class="material-symbols-outlined text-indigo-400 text-[18px]">directions_car</span>
                <span>8 Armada Mobil</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span class="material-symbols-outlined text-sky-400 text-[18px]">apartment</span>
                <span>Peta Kota 3D Luas</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span class="material-symbols-outlined text-emerald-400 text-[18px]">quiz</span>
                <span>5 Soal per Pos</span>
              </div>
              <div class="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <span class="material-symbols-outlined text-amber-400 text-[18px]">radar</span>
                <span>Minimap Radar</span>
              </div>
            </div>
          </div>

          <!-- Launch CTA Button -->
          <div class="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 relative z-10">
            <button class="h-12 px-7 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/30" id="btn-launch-minigame-hero">
              <span class="material-symbols-outlined text-[22px]">sports_esports</span>
              <span class="text-sm">${isId ? "Mainkan Mini Game 3D Sekarang" : "Launch 3D Game"}</span>
            </button>
            <div class="text-center font-mono text-[11px] text-slate-400">
              Kontrol: W/A/S/D • Spasi • Sentuh HP
            </div>
          </div>
        </div>

      </div>

      <!-- MAIN FEATURE 2: Evaluasi Kurikulum Resmi (Pretest & Posttest) -->
      <div class="space-y-4">
        <div class="border-b border-slate-200 pb-2">
          <h3 class="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <span class="material-symbols-outlined text-indigo-600 text-[20px]">verified</span>
            <span>${isId ? "Ujian Evaluasi Kurikulum Resmi" : "Curriculum Formal Evaluations"}</span>
          </h3>
          <p class="text-xs text-slate-500">${isId ? "Ujian formal untuk mengukur baseline kognitif Hake dan evaluasi sumatif akhir." : "Diagnostic and summative examinations."}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Pretest Card -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-indigo-300 transition-colors">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded font-mono text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">BENCHMARK AWAL</span>
                <span class="font-mono text-xs text-slate-500">25 Soal • 35 Menit</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-display">${isId ? "Pretest Diagnostik Jaringan" : "Diagnostic Baseline Pretest"}</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                ${isId ? "Mengukur garis dasar pemahaman awal siswa untuk kalkulasi normalized gain Hake. Mencakup konsep fundamental arsitektur jaringan, subnetting, dan protokol komunikasi." : "Establishes initial cognitive baseline for Hake normalized gain calculation."}
              </p>

              ${preResult ? `
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">${isId ? "Nilai Terakhir:" : "Last Score:"}</span>
                    <span class="text-slate-900 font-bold text-sm">${preScore} / 100 (${preResult.score}/25 Benar)</span>
                  </div>
                  <button class="h-7 px-2.5 bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded text-[11px] cursor-pointer font-bold" id="btn-pretest-view-score">
                    Lihat Hasil
                  </button>
                </div>
              ` : `
                <div class="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center font-mono text-xs text-slate-400">
                  ${isId ? "Belum ada riwayat pretest" : "No pretest attempts yet"}
                </div>
              `}
            </div>

            <div class="pt-2">
              <button class="w-full h-10 ${preResult ? 'bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm" id="btn-quiz-pretest">
                <span class="material-symbols-outlined text-[17px]">${preResult ? "refresh" : "play_arrow"}</span>
                <span>${preResult ? (isId ? "Ulangi Pretest (Remedial)" : "Retake Pretest (Remedial)") : (isId ? "Mulai Pretest Sekarang" : "Launch Pretest")}</span>
              </button>
            </div>
          </div>

          <!-- Posttest Card -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-indigo-300 transition-colors">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-2.5 py-0.5 rounded font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">SUMATIF FINAL</span>
                <span class="font-mono text-xs text-slate-500">25 Soal • 35 Menit</span>
              </div>
              <h3 class="text-lg font-bold text-slate-900 font-display">${isId ? "Ujian Akhir HOTS Posttest" : "HOTS Posttest Examination"}</h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                ${isId ? "Evaluasi sumatif akhir untuk mengukur ketuntasan belajar domain C4 Analisis, C5 Sintesis, dan C6 Pemecahan Masalah troubleshooting jaringan." : "Final evaluation measuring C4 Analysis, C5 Synthesis, and C6 Evaluation mastery."}
              </p>

              ${postResult ? `
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">${isId ? "Nilai Terakhir:" : "Last Score:"}</span>
                    <span class="text-slate-900 font-bold text-sm">${postScore} / 100 (${postResult.score}/25 Benar)</span>
                  </div>
                  <button class="h-7 px-2.5 bg-white hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded text-[11px] cursor-pointer font-bold" id="btn-posttest-view-score">
                    Lihat Hasil
                  </button>
                </div>
              ` : `
                <div class="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center font-mono text-xs text-slate-400">
                  ${isId ? "Belum ada riwayat posttest" : "No posttest attempts yet"}
                </div>
              `}
            </div>

            <div class="pt-2">
              <button class="w-full h-10 ${postResult ? 'bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} font-mono text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm" id="btn-quiz-posttest">
                <span class="material-symbols-outlined text-[17px]">${postResult ? "refresh" : "play_arrow"}</span>
                <span>${postResult ? (isId ? "Ulangi Posttest (Remedial)" : "Retake Posttest (Remedial)") : (isId ? "Ikuti Ujian Posttest" : "Take Posttest Exam")}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- MAIN FEATURE 3: KUIS & ULANGAN HARIAN DARI GURU -->
      <div class="space-y-4 pt-4 border-t border-slate-200">
        <div class="flex items-center justify-between pb-1 flex-wrap gap-2">
          <div>
            <h3 class="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[22px]">assignment</span>
              <span>${isId ? "Kuis & Ulangan Harian dari Guru" : "Instructor Quizzes & Tests"}</span>
            </h3>
            <p class="text-xs text-slate-500">${isId ? "Paket soal latihan dan ulangan yang diterbitkan langsung oleh guru kelas." : "Chapter quizzes and evaluations published by your teacher."}</p>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            ${activeCustomQuizzes.length} ${isId ? "Kuis Aktif" : "Active Quizzes"}
          </span>
        </div>

        ${activeCustomQuizzes.length === 0 ? `
          <div class="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center font-mono text-xs text-slate-500">
            ${isId ? "Belum ada kuis atau ulangan harian yang dibuka oleh guru saat ini." : "No active quizzes published by your teacher at this moment."}
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${activeCustomQuizzes.map(q => {
              const prevAttempt = (state.userStats?.results || []).find(r => r.type === q.id);
              const qCount = (q.questions || []).length;
              return `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-primary/50 hover:shadow-md transition-all">
                  <div class="space-y-2.5">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                        ${q.category}
                      </span>
                      ${q.token ? `
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">key</span>
                          <span>Wajib Token</span>
                        </span>
                      ` : `
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 font-bold">
                          Bebas Token
                        </span>
                      `}
                    </div>

                    <h4 class="font-bold text-sm text-slate-900 leading-snug line-clamp-2">${q.title}</h4>

                    <div class="flex items-center gap-3 text-xs font-mono text-slate-500 pt-1">
                      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">quiz</span> ${qCount} Soal</span>
                      <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">timer</span> ${q.durationMins || 15} Menit</span>
                    </div>

                    ${prevAttempt ? `
                      <div class="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs font-mono text-emerald-900 flex items-center justify-between">
                        <span>${isId ? "Nilai Sebelumnya:" : "Score:"}</span>
                        <span class="font-bold">${prevAttempt.score_percentage !== undefined ? prevAttempt.score_percentage : Math.round((prevAttempt.score / qCount) * 100)} / 100 (${prevAttempt.score}/${qCount})</span>
                      </div>
                    ` : ""}
                  </div>

                  <div class="pt-4 border-t border-slate-100 mt-4">
                    <button type="button" class="btn-start-student-custom-quiz w-full h-10 ${prevAttempt ? 'bg-white hover:bg-slate-50 text-primary border border-outline-variant' : 'bg-primary hover:bg-primary-container text-on-primary'} font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs" data-id="${q.id}" data-token="${q.token || ""}">
                      <span class="material-symbols-outlined text-[16px]">${prevAttempt ? "refresh" : "play_arrow"}</span>
                      <span>${prevAttempt ? (isId ? "Ulangi Kuis" : "Retake Quiz") : (isId ? "Mulai Kerjakan Kuis" : "Start Quiz")}</span>
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

    </div>
  `;

  // Student custom quiz click handler
  container.querySelectorAll(".btn-start-student-custom-quiz").forEach(btn => {
    btn.addEventListener("click", () => {
      sound.click();
      const quizId = btn.dataset.id;
      const requiredToken = (btn.dataset.token || "").trim().toUpperCase();

      if (requiredToken) {
        const inputToken = window.prompt(isId ? `Kuis ini memerlukan Token Ujian dari Guru.\nMasukkan Token Ujian:` : "Enter exam token from your teacher:");
        if (inputToken === null) return;
        if (inputToken.trim().toUpperCase() !== requiredToken) {
          showToast(isId ? "Token Salah" : "Invalid Token", isId ? "Token ujian yang Anda masukkan tidak sesuai. Silakan tanyakan kepada guru." : "Incorrect token.", "error");
          return;
        }
      }

      state.testState = null;
      navigateTo("quiz", { type: quizId });
    });
  });

  // Attach event handlers
  document.getElementById("btn-launch-minigame-hero")?.addEventListener("click", () => {
    navigateTo("minigame");
    setTimeout(() => {
      const stage = document.getElementById("netgame-viewport");
      if (stage && (stage.requestFullscreen || stage.webkitRequestFullscreen)) {
        (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage).then(() => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(() => {});
        }).catch(() => {});
      }
    }, 80);
  });

  document.getElementById("btn-quiz-pretest")?.addEventListener("click", () => {
    state.testState = null;
    navigateTo("pretest");
  });

  document.getElementById("btn-quiz-posttest")?.addEventListener("click", () => {
    state.testState = null;
    navigateTo("posttest");
  });

  document.getElementById("btn-pretest-view-score")?.addEventListener("click", () => {
    if (preResult) navigateTo("posttest-results", { result: preResult });
  });

  document.getElementById("btn-posttest-view-score")?.addEventListener("click", () => {
    if (postResult) navigateTo("posttest-results", { result: postResult });
  });
}



// ============================================================================
// VIEW 8: TEACHER CONSOLE & REVIEWS (Stitch teacher_dashboard_computer_networks)
// ============================================================================
async function renderAdmin(container) {
  const isId = getLang() === "id";
  const user = getCurrentUser();
  const teacherName = user?.name || user?.user_metadata?.full_name || "Narendra Nugraha";
  const teacherEmail = user?.email || "narendra.23076@mhs.unesa.ac.id";
  const teacherInitials = (teacherName || "N").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  container.innerHTML = `
    <div class="max-w-7xl mx-auto space-y-6 w-full animate-fade-in pb-12">
      
      <!-- HERO TEACHER WELCOME BANNER -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-lg text-white p-5 sm:p-7">
        <div class="absolute -right-16 -top-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-16 -bottom-16 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <!-- Left: Identity & Greeting -->
          <div class="flex items-start sm:items-center gap-4">
            <div class="relative shrink-0">
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-400 p-0.5 shadow-md">
                <div class="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center font-mono font-extrabold text-xl text-primary-fixed">
                  ${teacherInitials}
                </div>
              </div>
              <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-white font-bold" title="Instruktur Aktif">✓</span>
            </div>

            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary-fixed font-mono text-[10px] font-bold uppercase tracking-wider">
                  ${isId ? "Portal Instruktur TKJ" : "Instructor Hub"}
                </span>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ${isId ? "Live Sync Supabase" : "Live Sync"}
                </span>
              </div>
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>${isId ? "Selamat Datang," : "Welcome,"} ${teacherName}</span>
              </h1>
              <p class="text-xs sm:text-sm text-slate-300 max-w-2xl">
                ${isId 
                  ? "Pusat kendali pembelajaran jaringan komputer: monitoring ketuntasan siswa, manajemen kurikulum modul, bank kuis interaktif, dan diagnostik miskonsepsi butir soal." 
                  : "Command center for computer networking: monitor cohort mastery, manage materials, build quizzes, and inspect misconception diagnostics."}
              </p>
            </div>
          </div>

          <!-- Right: Quick Stat Chips -->
          <div class="flex items-center gap-2 sm:gap-3 flex-wrap lg:justify-end">
            <div class="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-left">
              <span class="text-[10px] font-mono text-slate-400 block uppercase">${isId ? "Hak Akses" : "Role"}</span>
              <span class="text-xs font-mono font-bold text-amber-400">Guru / Instruktur</span>
            </div>
            <div class="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-left">
              <span class="text-[10px] font-mono text-slate-400 block uppercase">${isId ? "Status DB" : "Database"}</span>
              <span class="text-xs font-mono font-bold text-emerald-400">Online &amp; Aktif</span>
            </div>
          </div>
        </div>
      </div>

      <!-- VISUAL MENU CARDS WITH IMAGES (4 PILIHAN FITUR UTAMA) -->
      <div>
        <div class="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 class="text-xs font-mono font-bold text-outline uppercase tracking-wider flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] text-primary">dashboard_customize</span>
              <span>${isId ? "Pilihan Menu Panel Guru" : "Teacher Console Modules"}</span>
            </h2>
            <p class="text-xs text-on-surface-variant">${isId ? "Pilih salah satu menu di bawah untuk mengelola kelas dan materi:" : "Select a module below to manage classes and materials:"}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <!-- Card 1: Progres Siswa -->
          <button type="button" class="admin-menu-card group text-left rounded-2xl bg-surface-container-lowest border-2 border-outline-variant hover:border-primary/60 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer flex flex-col" data-tab="tab-progress">
            <div class="relative w-full h-36 bg-slate-900 overflow-hidden">
              <img src="assets/images/teacher/menu_progress.svg" alt="Progres Siswa" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-blue-500/90 text-white font-mono text-[10px] font-bold tracking-wide shadow-xs">
                ${isId ? "📊 Kohort & Rekap" : "Analytics"}
              </span>
              <span class="admin-card-active-indicator hidden absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-mono text-[10px] font-black items-center gap-1 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                ${isId ? "Aktif" : "Active"}
              </span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 class="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>1. ${isId ? "Progres Siswa" : "Student Progress"}</span>
                  <span class="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </h3>
                <p class="text-xs text-on-surface-variant line-clamp-2 mt-1">
                  ${isId ? "Pantau ketuntasan, nilai Pretest vs Posttest, N-Gain Hake, dan unduh rekap data kelas Excel/CSV." : "Monitor mastery, pre/post scores, N-Gain, and export cohort data."}
                </p>
              </div>
              <div class="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] font-mono text-outline">
                <span>${isId ? "Pantau Nilai" : "View Grades"}</span>
                <span class="font-bold text-primary">${isId ? "Buka Tab →" : "Open Tab →"}</span>
              </div>
            </div>
          </button>

          <!-- Card 2: Kelola Materi -->
          <button type="button" class="admin-menu-card group text-left rounded-2xl bg-surface-container-lowest border-2 border-outline-variant hover:border-primary/60 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer flex flex-col" data-tab="tab-materials">
            <div class="relative w-full h-36 bg-slate-900 overflow-hidden">
              <img src="assets/images/teacher/menu_materials.svg" alt="Kelola Materi" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-500/90 text-white font-mono text-[10px] font-bold tracking-wide shadow-xs">
                ${isId ? "📚 Kurikulum TKJ" : "Curriculum"}
              </span>
              <span class="admin-card-active-indicator hidden absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-mono text-[10px] font-black items-center gap-1 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                ${isId ? "Aktif" : "Active"}
              </span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 class="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>2. ${isId ? "Kelola Materi" : "Learning Modules"}</span>
                  <span class="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </h3>
                <p class="text-xs text-on-surface-variant line-clamp-2 mt-1">
                  ${isId ? "Tambah modul pembelajaran baru, panduan konfigurasi lab jaringan, dan sinkronkan ke portal siswa." : "Create new learning modules, lab configuration guides, and publish to students."}
                </p>
              </div>
              <div class="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] font-mono text-outline">
                <span>${isId ? "Tambah & Edit" : "Add & Edit"}</span>
                <span class="font-bold text-primary">${isId ? "Buka Tab →" : "Open Tab →"}</span>
              </div>
            </div>
          </button>

          <!-- Card 3: Bank Soal & Kuis -->
          <button type="button" class="admin-menu-card group text-left rounded-2xl bg-surface-container-lowest border-2 border-outline-variant hover:border-primary/60 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer flex flex-col" data-tab="tab-quizzes">
            <div class="relative w-full h-36 bg-slate-900 overflow-hidden">
              <img src="assets/images/teacher/menu_quizzes.svg" alt="Bank Soal & Kuis" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-500/90 text-white font-mono text-[10px] font-bold tracking-wide shadow-xs">
                ${isId ? "📝 Ujian & Token" : "Quizzes"}
              </span>
              <span class="admin-card-active-indicator hidden absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-mono text-[10px] font-black items-center gap-1 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                ${isId ? "Aktif" : "Active"}
              </span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 class="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>3. ${isId ? "Bank Soal & Kuis" : "Quiz & Exam Builder"}</span>
                  <span class="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </h3>
                <p class="text-xs text-on-surface-variant line-clamp-2 mt-1">
                  ${isId ? "Rancang kuis bab, tentukan token akses, kunci jawaban, dan buka/tutup waktu ujian secara real-time." : "Build chapter quizzes, set tokens, answer keys, and toggle exam access."}
                </p>
              </div>
              <div class="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] font-mono text-outline">
                <span>${isId ? "Buat Ujian" : "Create Quiz"}</span>
                <span class="font-bold text-primary">${isId ? "Buka Tab →" : "Open Tab →"}</span>
              </div>
            </div>
          </button>

          <!-- Card 4: Analisis Butir & Miskonsepsi -->
          <button type="button" class="admin-menu-card group text-left rounded-2xl bg-surface-container-lowest border-2 border-outline-variant hover:border-primary/60 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer flex flex-col" data-tab="tab-diagnostics">
            <div class="relative w-full h-36 bg-slate-900 overflow-hidden">
              <img src="assets/images/teacher/menu_diagnostics.svg" alt="Analisis Butir & Miskonsepsi" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
              <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-rose-500/90 text-white font-mono text-[10px] font-bold tracking-wide shadow-xs">
                ${isId ? "🔬 Diagnostik AI" : "Item Analysis"}
              </span>
              <span class="admin-card-active-indicator hidden absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-mono text-[10px] font-black items-center gap-1 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                ${isId ? "Aktif" : "Active"}
              </span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 class="font-extrabold text-sm text-on-surface group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>4. ${isId ? "Analisis Butir & Miskonsepsi" : "Item Diagnostics"}</span>
                  <span class="material-symbols-outlined text-[18px] text-outline group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </h3>
                <p class="text-xs text-on-surface-variant line-clamp-2 mt-1">
                  ${isId ? "Analisis tingkat kesukaran (P-Value), sebaran distractor opsi, dan deteksi jebakan konsep yang perlu remidiasi." : "Inspect difficulty (P-Value), distractor efficacy, and pedagogical misconception flags."}
                </p>
              </div>
              <div class="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-[11px] font-mono text-outline">
                <span>${isId ? "Inspeksi Butir" : "Inspect Items"}</span>
                <span class="font-bold text-primary">${isId ? "Buka Tab →" : "Open Tab →"}</span>
              </div>
            </div>
          </button>

        </div>
      </div>

      <!-- Quick Switcher Pills (Secondary Compact Sub-Nav) -->
      <div class="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline-variant overflow-x-auto">
        <button type="button" class="admin-sub-tab-btn flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-outline hover:text-on-surface" data-tab="tab-progress">
          <span class="material-symbols-outlined text-[16px]">monitoring</span>
          <span>1. ${isId ? "Progres Siswa" : "Progress"}</span>
        </button>
        <button type="button" class="admin-sub-tab-btn flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-outline hover:text-on-surface" data-tab="tab-materials">
          <span class="material-symbols-outlined text-[16px]">library_add</span>
          <span>2. ${isId ? "Kelola Materi" : "Materials"}</span>
        </button>
        <button type="button" class="admin-sub-tab-btn flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-outline hover:text-on-surface" data-tab="tab-quizzes">
          <span class="material-symbols-outlined text-[16px]">quiz</span>
          <span>3. ${isId ? "Bank Soal & Kuis" : "Quizzes"}</span>
        </button>
        <button type="button" class="admin-sub-tab-btn flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-outline hover:text-on-surface" data-tab="tab-diagnostics">
          <span class="material-symbols-outlined text-[16px]">troubleshoot</span>
          <span>4. ${isId ? "Analisis Butir" : "Diagnostics"}</span>
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="admin-tab-content" class="w-full"></div>
    </div>
  `;

  const menuCards = container.querySelectorAll(".admin-menu-card");
  const subTabBtns = container.querySelectorAll(".admin-sub-tab-btn");
  const tabContentEl = container.querySelector("#admin-tab-content");

  let currentActiveTab = "tab-progress";

  async function switchTab(tabId) {
    currentActiveTab = tabId;

    // Update big cards
    menuCards.forEach(card => {
      const isActive = card.dataset.tab === tabId;
      const indicator = card.querySelector(".admin-card-active-indicator");
      if (isActive) {
        card.classList.add("ring-2", "ring-primary", "border-primary", "bg-surface-container-low", "shadow-md");
        card.classList.remove("border-outline-variant", "bg-surface-container-lowest");
        if (indicator) indicator.classList.remove("hidden");
        if (indicator) indicator.classList.add("inline-flex");
      } else {
        card.classList.remove("ring-2", "ring-primary", "border-primary", "bg-surface-container-low", "shadow-md");
        card.classList.add("border-outline-variant", "bg-surface-container-lowest");
        if (indicator) indicator.classList.add("hidden");
        if (indicator) indicator.classList.remove("inline-flex");
      }
    });

    // Update compact sub-tab buttons
    subTabBtns.forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.className = `admin-sub-tab-btn flex-1 min-w-[140px] py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
        isActive 
          ? "bg-surface-container-lowest text-primary shadow-xs border border-outline-variant/60" 
          : "text-outline hover:text-on-surface hover:bg-surface-container-high/40"
      }`;
    });

    // Render corresponding tab
    if (tabId === "tab-progress") {
      await renderAdminProgressTab(tabContentEl);
    } else if (tabId === "tab-materials") {
      await renderAdminMaterialsTab(tabContentEl);
    } else if (tabId === "tab-quizzes") {
      await renderAdminQuizzesTab(tabContentEl);
    } else if (tabId === "tab-diagnostics") {
      await renderAdminDiagnosticsTab(tabContentEl);
    }
  }

  menuCards.forEach(card => {
    card.addEventListener("click", () => {
      sound.click();
      switchTab(card.dataset.tab);
    });
  });

  subTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sound.click();
      switchTab(btn.dataset.tab);
    });
  });

  await switchTab("tab-progress");
}

async function renderAdminProgressTab(container) {
  const isId = getLang() === "id";
  container.innerHTML = `
    <div class="space-y-6">
      <div id="cohort-loading" class="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant">
        <span class="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
        <p class="text-xs text-outline font-mono mt-2">${isId ? "Memuat data progres kohort siswa dari Supabase..." : "Loading student cohort data..."}</p>
      </div>
    </div>
  `;

  let cohort = [];
  try {
    cohort = await getAllStudentsCohort();
  } catch (e) {
    console.warn("Error loading student cohort:", e);
  }

  if (!cohort || cohort.length === 0) {
    cohort = [
      { id: 1, name: "Ahmad Rizki", className: "X TKJ 1", email: "ahmad.rizki@gmail.com", readCount: 5, preScore: 14, postScore: 23, gain: 0.82, isMastery: true, lastActive: new Date().toISOString() },
      { id: 2, name: "Bunga Citra", className: "X TKJ 1", email: "bunga.c@gmail.com", readCount: 4, preScore: 16, postScore: 22, gain: 0.67, isMastery: true, lastActive: new Date().toISOString() },
      { id: 3, name: "Dimas Saputra", className: "X TKJ 2", email: "dimas.saputra@gmail.com", readCount: 3, preScore: 12, postScore: 19, gain: 0.54, isMastery: true, lastActive: new Date().toISOString() },
      { id: 4, name: "Fajar Nugraha", className: "X TKJ 2", email: "fajar.nug@gmail.com", readCount: 2, preScore: 15, postScore: 17, gain: 0.20, isMastery: false, lastActive: new Date().toISOString() },
      { id: 5, name: "Siti Rahmawati", className: "X TKJ 3", email: "siti.rahma@gmail.com", readCount: 6, preScore: 18, postScore: 25, gain: 1.00, isMastery: true, lastActive: new Date().toISOString() }
    ];
  }

  const totalStudents = cohort.length;
  const preScores = cohort.map(s => Number(s.preScore)).filter(n => !isNaN(n));
  const postScores = cohort.map(s => Number(s.postScore)).filter(n => !isNaN(n));
  const avgPre = preScores.length > 0 ? (preScores.reduce((a, b) => a + b, 0) / preScores.length).toFixed(1) : "0";
  const avgPost = postScores.length > 0 ? (postScores.reduce((a, b) => a + b, 0) / postScores.length).toFixed(1) : "0";
  const masteryCount = cohort.filter(s => s.isMastery).length;
  const masteryRate = totalStudents > 0 ? Math.round((masteryCount / totalStudents) * 100) : 0;

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- 4 High-Impact KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- KPI 1 -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl border-t-4 border-t-blue-500 border border-outline-variant shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Total Siswa Terdaftar" : "Enrolled Students"}</span>
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 border border-blue-500/20">
              <span class="material-symbols-outlined text-[22px]">group</span>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-black text-on-surface font-mono">${totalStudents} <span class="text-xs font-normal text-outline">Siswa Aktif</span></div>
            <p class="text-[11px] text-outline mt-1 font-mono">${isId ? "Terdistribusi di 3 Kelas TKJ" : "Across 3 TKJ Classes"}</p>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl border-t-4 border-t-slate-500 border border-outline-variant shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Rata-rata Pretest" : "Avg Pretest"}</span>
            <div class="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-500/20">
              <span class="material-symbols-outlined text-[22px]">assignment_late</span>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-black text-on-surface font-mono">${avgPre} <span class="text-xs font-normal text-outline">/ 25 Soal</span></div>
            <p class="text-[11px] text-outline mt-1 font-mono">${isId ? "Kemampuan dasar awal kelas" : "Baseline prior knowledge"}</p>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl border-t-4 border-t-indigo-500 border border-outline-variant shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Rata-rata Posttest" : "Avg Posttest"}</span>
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <span class="material-symbols-outlined text-[22px]">military_tech</span>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-black text-indigo-600 font-mono">${avgPost} <span class="text-xs font-normal text-outline">/ 25 Soal</span></div>
            <p class="text-[11px] text-emerald-600 mt-1 font-mono font-bold flex items-center gap-1">
              <span>↑</span>
              <span>+${(avgPost - avgPre).toFixed(1)} ${isId ? "Poin Peningkatan" : "Points Gain"}</span>
            </p>
          </div>
        </div>

        <!-- KPI 4 -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl border-t-4 border-t-emerald-500 border border-outline-variant shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-outline font-bold">${isId ? "Tingkat Ketuntasan" : "Mastery Rate"}</span>
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <span class="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div class="mt-3">
            <div class="text-2xl font-black text-emerald-600 font-mono">${masteryRate}% <span class="text-xs font-normal text-outline">(${masteryCount}/${totalStudents})</span></div>
            <p class="text-[11px] text-outline mt-1 font-mono">${isId ? "Target KKM Tercapai (≥70)" : "Mastery target reached"}</p>
          </div>
        </div>

      </div>

      <!-- Filters & Interactive Action Bar -->
      <div class="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline-variant shadow-xs space-y-3">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <!-- Search & Filter Controls -->
          <div class="flex flex-1 flex-col sm:flex-row items-center gap-3">
            <div class="relative w-full sm:w-80">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">search</span>
              <input 
                type="text" 
                id="admin-search-student" 
                placeholder="${isId ? "Cari nama, kelas, atau email siswa..." : "Search student..."}" 
                class="w-full pl-9 pr-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>

            <!-- Class Quick Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-0.5">
              <button type="button" class="btn-quick-class px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors bg-primary text-on-primary border-primary shrink-0 cursor-pointer" data-class="ALL">
                ${isId ? "Semua Kelas" : "All Classes"}
              </button>
              ${TKJ_CLASSES.map(c => `
                <button type="button" class="btn-quick-class px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors bg-surface-container-low text-outline hover:text-on-surface border-outline-variant shrink-0 cursor-pointer" data-class="${c}">
                  ${c}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" id="btn-refresh-cohort" class="h-9 px-3.5 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer" title="Perbarui Data Kohort">
              <span class="material-symbols-outlined text-[16px] text-primary">sync</span>
              <span>${isId ? "Segarkan" : "Refresh"}</span>
            </button>
            <button type="button" id="btn-export-cohort-csv" class="h-9 px-4 bg-primary hover:bg-primary/90 text-on-primary font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md">
              <span class="material-symbols-outlined text-[16px]">file_download</span>
              <span>${isId ? "Unduh Rekap CSV" : "Export CSV"}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Cohort Table with Elevated Visual Styling -->
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs overflow-hidden">
        <div class="p-4 sm:p-5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[18px]">groups</span>
            </div>
            <div>
              <h3 class="text-xs font-mono font-bold text-on-surface uppercase tracking-wider">${isId ? "Daftar Siswa & Rekap Capaian Belajar" : "Student Roster & Outcomes"}</h3>
              <p class="text-[11px] text-outline">${isId ? "Hasil evaluasi Pretest, Posttest HOTS, serta efektivitas N-Gain Hake." : "Pre/Posttest evaluations and normalized gain."}</p>
            </div>
          </div>
          <span id="cohort-filtered-count" class="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-mono font-bold text-outline border border-outline-variant/60">
            ${totalStudents} ${isId ? "Siswa Ditampilkan" : "Students"}
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left font-mono text-xs">
            <thead class="bg-surface-container text-outline text-[11px] uppercase border-b border-outline-variant">
              <tr>
                <th class="p-4">${isId ? "Nama Siswa" : "Student"}</th>
                <th class="p-4">${isId ? "Kelas" : "Class"}</th>
                <th class="p-4">Email</th>
                <th class="p-4 text-center">${isId ? "Materi Tuntas" : "Modules"}</th>
                <th class="p-4 text-center">Pretest</th>
                <th class="p-4 text-center">Posttest</th>
                <th class="p-4 text-center">N-Gain (Hake)</th>
                <th class="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody id="cohort-table-body" class="divide-y divide-outline-variant">
              <!-- Rendered via updateTable() -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  let activeClassFilter = "ALL";

  function updateTable() {
    const searchVal = document.getElementById("admin-search-student")?.value.toLowerCase().trim() || "";

    const filtered = cohort.filter(s => {
      const matchSearch = (s.name || "").toLowerCase().includes(searchVal) || (s.email || "").toLowerCase().includes(searchVal);
      const matchClass = (activeClassFilter === "ALL") || (s.className === activeClassFilter);
      return matchSearch && matchClass;
    });

    const countEl = document.getElementById("cohort-filtered-count");
    if (countEl) countEl.textContent = `${filtered.length} ${isId ? "Siswa Ditampilkan" : "Students"}`;

    const tbody = document.getElementById("cohort-table-body");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="p-10 text-center text-outline font-mono text-xs">
            <span class="material-symbols-outlined text-3xl text-outline mb-1 block">search_off</span>
            ${isId ? "Tidak ada data siswa yang cocok dengan filter atau kata kunci." : "No students match the criteria."}
          </td>
        </tr>
      `;
      return;
    }

    const avatarColors = [
      "bg-blue-500/10 text-blue-600 border-blue-500/20",
      "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      "bg-purple-500/10 text-purple-600 border-purple-500/20",
      "bg-amber-500/10 text-amber-600 border-amber-500/20"
    ];

    tbody.innerHTML = filtered.map((s, idx) => {
      const gainVal = s.gain !== undefined && s.gain !== null ? Number(s.gain) : 0;
      const gainPercent = Math.round(gainVal * 100);
      const isPass = s.isMastery || (s.postScore !== "-" && Number(s.postScore) >= 18);
      const colorClass = avatarColors[idx % avatarColors.length];
      const readProgress = Math.min(100, Math.round(((s.readCount || 0) / 6) * 100));

      return `
        <tr class="hover:bg-surface-container-low/60 transition-colors">
          <td class="p-4 font-bold text-on-surface">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-xl ${colorClass} flex items-center justify-center font-bold text-xs shrink-0 font-mono border">
                ${(s.name || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <span class="truncate block font-bold text-on-surface">${s.name || "-"}</span>
                <span class="text-[10px] text-outline font-normal font-mono block">${s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "Hari ini"}</span>
              </div>
            </div>
          </td>
          <td class="p-4 font-bold font-mono">
            <span class="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface border border-outline-variant text-[11px] font-bold">${s.className || "X TKJ 1"}</span>
          </td>
          <td class="p-4 text-on-surface-variant text-[11px] font-mono">${s.email || "-"}</td>
          <td class="p-4 text-center">
            <div class="flex flex-col items-center gap-1.5">
              <div class="flex items-center gap-1 font-mono text-xs">
                <span class="font-extrabold ${s.readCount >= 6 ? "text-emerald-600" : "text-primary"}">${s.readCount || 0}</span>
                <span class="text-outline text-[10px]">/ 6 Bab</span>
              </div>
              <div class="w-16 h-1.5 rounded-full bg-surface-container overflow-hidden">
                <div class="h-full ${s.readCount >= 6 ? "bg-emerald-500" : "bg-primary"}" style="width: ${readProgress}%"></div>
              </div>
            </div>
          </td>
          <td class="p-4 text-center font-mono font-medium text-outline">
            ${s.preScore !== "-" ? `<span class="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/60">${s.preScore}/25</span>` : "-"}
          </td>
          <td class="p-4 text-center font-mono">
            ${s.postScore !== "-" ? `
              <span class="px-2 py-0.5 rounded font-extrabold ${isPass ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-primary/10 text-primary border border-primary/20"}">
                ${s.postScore}/25
              </span>
            ` : "-"}
          </td>
          <td class="p-4 text-center">
            ${s.postScore !== "-" ? `
              <div class="flex flex-col items-center">
                <span class="font-mono font-extrabold text-xs ${gainVal >= 0.7 ? "text-emerald-600" : (gainVal >= 0.3 ? "text-indigo-600" : "text-amber-600")}">
                  +${gainPercent}%
                </span>
                <span class="text-[9px] font-mono uppercase tracking-tight text-outline">
                  ${gainVal >= 0.7 ? "Tinggi" : (gainVal >= 0.3 ? "Sedang" : "Rendah")}
                </span>
              </div>
            ` : "-"}
          </td>
          <td class="p-4 text-center">
            ${isPass ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>${isId ? "Tuntas" : "Mastery"}</span>
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>${isId ? "Bimbingan" : "Pending"}</span>
              </span>
            `}
          </td>
        </tr>
      `;
    }).join("");
  }

  updateTable();

  // Wire up filter pills
  const quickClassBtns = container.querySelectorAll(".btn-quick-class");
  quickClassBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sound.click();
      activeClassFilter = btn.dataset.class;
      quickClassBtns.forEach(b => {
        const isMatch = b.dataset.class === activeClassFilter;
        b.className = `btn-quick-class px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors shrink-0 cursor-pointer ${
          isMatch ? "bg-primary text-on-primary border-primary" : "bg-surface-container-low text-outline hover:text-on-surface border-outline-variant"
        }`;
      });
      updateTable();
    });
  });

  document.getElementById("admin-search-student")?.addEventListener("input", updateTable);

  document.getElementById("btn-refresh-cohort")?.addEventListener("click", async () => {
    sound.click();
    const btn = document.getElementById("btn-refresh-cohort");
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[16px] text-primary animate-spin">sync</span><span>${isId ? "Memperbarui..." : "Syncing..."}</span>`;
    }
    await renderAdminProgressTab(container);
    showToast(isId ? "Data Segar" : "Data Refreshed", isId ? "Daftar kohort siswa berhasil disinkronkan." : "Cohort roster updated.", "check_circle");
  });

  document.getElementById("btn-export-cohort-csv")?.addEventListener("click", () => {
    sound.click();
    exportToCsv("Rekapitulasi_Progres_Siswa_NetLearn", cohort);
    showToast(isId ? "Nilai Berhasil Diekspor" : "Gradebook Exported", isId ? "File CSV rekapitulasi progres dan nilai telah diunduh." : "Cohort CSV exported successfully.", "table_chart");
  });
}

async function renderAdminMaterialsTab(container) {
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT COLUMN: Formulir Tambah Materi Baru (5 cols) -->
      <div class="lg:col-span-5 bg-surface-container-lowest p-5 sm:p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2 text-primary mb-1">
            <span class="material-symbols-outlined text-[20px]">post_add</span>
            <h3 class="font-bold text-sm text-on-surface font-mono">${isId ? "Tambah Modul Materi Baru" : "Add New Learning Module"}</h3>
          </div>
          <p class="text-xs text-on-surface-variant">${isId ? "Materi yang ditambahkan langsung disimpan di Supabase dan dapat dibaca oleh seluruh siswa di portal Materi." : "Materials are saved directly to Supabase and published to all students."}</p>
        </div>

        <form id="form-admin-add-material" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Judul Materi (Bahasa Indonesia) *" : "Module Title (Indonesian) *"}</label>
            <input 
              type="text" 
              id="mat-title-id" 
              placeholder="${isId ? "Contoh: Konfigurasi Virtual LAN (VLAN) Cisco" : "e.g. Virtual LAN Configuration"}" 
              required
              class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Judul Materi (English / Opsional)" : "Module Title (English / Optional)"}</label>
            <input 
              type="text" 
              id="mat-title-en" 
              placeholder="${isId ? "Contoh: Virtual LAN (VLAN) Configuration" : "e.g. VLAN Configuration"}" 
              class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Kategori Modul *" : "Category *"}</label>
              <select 
                id="mat-category" 
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="Pengenalan Jaringan">${isId ? "Pengenalan Jaringan" : "Network Scopes"}</option>
                <option value="Topologi Jaringan">${isId ? "Topologi & Media" : "Topology & Media"}</option>
                <option value="Arsitektur Protokol">${isId ? "Model OSI & TCP/IP" : "OSI & TCP/IP"}</option>
                <option value="Pengalamatan IP">${isId ? "Subnetting & IPv4" : "Subnetting & IP"}</option>
                <option value="Perangkat Keras">${isId ? "Perangkat Keras Lab" : "Hardware & Media"}</option>
                <option value="Layanan Jaringan">${isId ? "Layanan Jaringan (DNS/DHCP)" : "Network Services"}</option>
                <option value="Keamanan Jaringan">${isId ? "Keamanan & Routing" : "Security & Routing"}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Estimasi Waktu Baca *" : "Read Time *"}</label>
              <input 
                type="text" 
                id="mat-read-time" 
                value="10 min" 
                placeholder="10 min" 
                required
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Ringkasan Singkat (Summary) *" : "Short Summary *"}</label>
            <textarea 
              id="mat-summary" 
              rows="2" 
              required
              placeholder="${isId ? "Tuliskan ringkasan inti materi dalam 1-2 kalimat..." : "Brief overview of what students will learn..."}"
              class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white resize-y"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Konten Lengkap Modul Pembelajaran *" : "Full Module Content *"}</label>
            <textarea 
              id="mat-content" 
              rows="6" 
              required
              placeholder="${isId ? "Ketikkan pembahasan lengkap materi di sini. Mendukung format paragraf, daftar poin, dan instruksi lab..." : "Write complete study material..."}"
              class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white resize-y"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "URL Video Pembelajaran YouTube (Opsional)" : "YouTube Video URL (Optional)"}</label>
            <input 
              type="url" 
              id="mat-video-url" 
              placeholder="https://www.youtube.com/watch?v=..." 
              class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
            />
          </div>

          <button 
            type="submit" 
            id="btn-submit-material"
            class="w-full py-2.5 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span class="material-symbols-outlined text-[18px]">publish</span>
            <span>${isId ? "Simpan & Terbitkan Materi ke Supabase" : "Publish Material to Supabase"}</span>
          </button>
        </form>
      </div>

      <!-- RIGHT COLUMN: Daftar Modul Aktif (7 cols) -->
      <div class="lg:col-span-7 bg-surface-container-lowest p-5 sm:p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="border-b border-outline-variant pb-3 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 text-primary mb-1">
              <span class="material-symbols-outlined text-[20px]">menu_book</span>
              <h3 class="font-bold text-sm text-on-surface font-mono">${isId ? "Daftar Modul Pembelajaran Aktif" : "Active Learning Modules"}</h3>
            </div>
            <p class="text-xs text-on-surface-variant">${isId ? "Semua materi yang dapat diakses oleh siswa di aplikasi." : "All materials accessible to students."}</p>
          </div>
          <span id="materials-count-badge" class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            ...
          </span>
        </div>

        <!-- Material items list -->
        <div id="admin-materials-items-list" class="space-y-3">
          <div class="p-6 text-center text-outline font-mono text-xs">
            <span class="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
            <p class="mt-2">${isId ? "Memuat daftar materi..." : "Loading materials..."}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  async function refreshMaterialsList() {
    const listContainer = document.getElementById("admin-materials-items-list");
    const countBadge = document.getElementById("materials-count-badge");
    if (!listContainer) return;

    let dbMats = [];
    try {
      dbMats = await getMaterialsFromDb() || [];
    } catch (e) {
      console.warn("Could not load db materials:", e);
    }

    const unified = [...MATERIALS.map(m => ({ ...m, isCustom: false }))];
    (dbMats || []).forEach(dm => {
      if (!unified.some(u => String(u.id) === String(dm.id))) {
        unified.push({
          id: dm.id,
          title_id: dm.title_id || dm.title || "Modul Tambahan",
          title_en: dm.title_en || dm.title_id || "Additional Module",
          category: dm.category || "Jaringan Komputer",
          readTime: dm.read_time || "10 min",
          summary_id: dm.summary || dm.summary_id || "",
          summary_en: dm.summary_en || dm.summary || "",
          content_id: dm.content || dm.content_id || "",
          content_en: dm.content_en || dm.content || "",
          icon: "book",
          isCustom: true,
          video: {
            url: dm.file_url || "",
            duration: "10:00",
            title: dm.title_id || "Video Pembelajaran"
          }
        });
      }
    });

    window.__allLoadedMaterials = unified;

    if (countBadge) {
      countBadge.textContent = `${unified.length} ${isId ? "Modul Aktif" : "Modules"}`;
    }

    if (unified.length === 0) {
      listContainer.innerHTML = `<p class="p-6 text-center text-outline font-mono text-xs">${isId ? "Belum ada materi." : "No materials available."}</p>`;
      return;
    }

    listContainer.innerHTML = unified.map(m => `
      <div class="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold ${m.isCustom ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-primary/10 text-primary border border-primary/20"}">
              ${m.isCustom ? (isId ? "★ Tambahan Guru (Supabase)" : "★ Custom Guru") : (isId ? "Kurikulum Inti" : "Core Curriculum")}
            </span>
            <span class="text-[10px] font-mono text-outline">${m.category} • ${m.readTime}</span>
          </div>
          <h4 class="font-bold text-xs text-on-surface truncate">${isId ? m.title_id : m.title_en}</h4>
          <p class="text-[11px] text-on-surface-variant line-clamp-1 mt-0.5">${isId ? m.summary_id : m.summary_en}</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button type="button" class="btn-preview-admin-mat h-8 px-3 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer" data-id="${m.id}">
            <span class="material-symbols-outlined text-[15px] text-primary">visibility</span>
            <span>${isId ? "Lihat" : "Preview"}</span>
          </button>
          ${m.isCustom ? `
            <button type="button" class="btn-delete-admin-mat h-8 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-200 text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer" data-id="${m.id}" title="${isId ? "Hapus Materi dari Supabase" : "Delete Material"}">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          ` : ""}
        </div>
      </div>
    `).join("");

    listContainer.querySelectorAll(".btn-preview-admin-mat").forEach(btn => {
      btn.addEventListener("click", () => {
        sound.click();
        const matId = btn.dataset.id;
        openMaterialModal(isNaN(Number(matId)) ? matId : Number(matId));
      });
    });

    listContainer.querySelectorAll(".btn-delete-admin-mat").forEach(btn => {
      btn.addEventListener("click", async () => {
        sound.click();
        const matId = btn.dataset.id;
        const confirmDelete = window.confirm(isId ? "Apakah Anda yakin ingin menghapus materi ini dari Supabase?" : "Are you sure you want to delete this material?");
        if (!confirmDelete) return;

        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>`;
        const ok = await deleteMaterialFromDb(matId);
        if (ok) {
          showToast(isId ? "Materi Dihapus" : "Material Deleted", isId ? "Materi berhasil dihapus dari database Supabase." : "Material deleted from database.", "check_circle");
          await refreshMaterialsList();
        } else {
          showToast(isId ? "Gagal Menghapus" : "Delete Failed", isId ? "Terjadi kesalahan saat menghapus materi." : "Error deleting material.", "error");
          btn.disabled = false;
        }
      });
    });
  }

  document.getElementById("form-admin-add-material")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    sound.click();

    const submitBtn = document.getElementById("btn-submit-material");
    const titleId = document.getElementById("mat-title-id")?.value.trim();
    const titleEn = document.getElementById("mat-title-en")?.value.trim() || titleId;
    const category = document.getElementById("mat-category")?.value || "Jaringan Komputer";
    const readTime = document.getElementById("mat-read-time")?.value.trim() || "10 min";
    const summary = document.getElementById("mat-summary")?.value.trim() || "";
    const content = document.getElementById("mat-content")?.value.trim() || "";
    const videoUrl = document.getElementById("mat-video-url")?.value.trim() || "";

    if (!titleId || !summary || !content) {
      showToast(isId ? "Formulir Belum Lengkap" : "Incomplete Form", isId ? "Harap lengkapi semua bidang bertanda bintang (*)." : "Please fill all required fields.", "warning");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> <span>${isId ? "Menyimpan ke Supabase..." : "Saving..."}</span>`;
    }

    try {
      const saved = await saveMaterialToDb({
        title_id: titleId,
        title_en: titleEn,
        category: category,
        readTime: readTime,
        summary: summary,
        content: content,
        file_url: videoUrl
      });

      if (saved) {
        showToast(isId ? "Materi Berhasil Diterbitkan!" : "Material Published!", `${isId ? "Modul baru tersimpan di Supabase:" : "Saved to Supabase:"} ${titleId}`, "check_circle");
        document.getElementById("form-admin-add-material")?.reset();
        await refreshMaterialsList();
      } else {
        showToast(isId ? "Gagal Menyimpan" : "Save Failed", isId ? "Tidak dapat menyimpan ke database Supabase." : "Could not save to Supabase.", "error");
      }
    } catch (err) {
      console.error("Save material error:", err);
      showToast(isId ? "Terjadi Kesalahan" : "Error", err.message || "Error saving material.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">publish</span> <span>${isId ? "Simpan & Terbitkan Materi ke Supabase" : "Publish Material to Supabase"}</span>`;
      }
    }
  });

  await refreshMaterialsList();
}

async function renderAdminQuizzesTab(container) {
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      <!-- LEFT COLUMN: Formulir Pembuat Kuis & Butir Soal (7 cols) -->
      <div class="lg:col-span-7 bg-surface-container-lowest p-5 sm:p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="border-b border-outline-variant pb-3 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 text-primary mb-1">
              <span class="material-symbols-outlined text-[20px]">add_task</span>
              <h3 class="font-bold text-sm text-on-surface font-mono">${isId ? "Buat Paket Kuis / Ulangan Harian Baru" : "Create New Quiz Package"}</h3>
            </div>
            <p class="text-xs text-on-surface-variant">${isId ? "Kuis yang dibuat langsung tersinkronisasi ke portal siswa dan dapat dikerjakan secara real-time." : "Quizzes are instantly published and synchronized to students."}</p>
          </div>
        </div>

        <form id="form-admin-create-quiz" class="space-y-4">
          <!-- Quiz Meta Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Judul Kuis / Ulangan *" : "Quiz Title *"}</label>
              <input 
                type="text" 
                id="quiz-form-title" 
                placeholder="${isId ? "Contoh: Ulangan Harian Bab 3: Model OSI & TCP/IP" : "e.g. Chapter 3 Quiz: OSI Reference Model"}" 
                required
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Kategori / Topik *" : "Topic / Category *"}</label>
              <select 
                id="quiz-form-category" 
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="Pengenalan Jaringan">${isId ? "Pengenalan Jaringan" : "Network Scopes"}</option>
                <option value="Topologi & Media" selected>${isId ? "Topologi & Media Transmisi" : "Topology & Media"}</option>
                <option value="Arsitektur Protokol">${isId ? "Model OSI & TCP/IP" : "OSI & TCP/IP"}</option>
                <option value="Pengalamatan IP">${isId ? "Subnetting & IPv4" : "Subnetting & IP"}</option>
                <option value="Perangkat Keras">${isId ? "Perangkat Keras Lab" : "Hardware & Media"}</option>
                <option value="Layanan Jaringan">${isId ? "Layanan Jaringan (DNS/DHCP)" : "Network Services"}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Durasi Pengerjaan (Menit) *" : "Duration (Minutes) *"}</label>
              <input 
                type="number" 
                id="quiz-form-duration" 
                value="15" 
                min="5" 
                max="120" 
                required
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold text-on-surface font-mono">${isId ? "Token Ujian (Opsional)" : "Exam Token (Optional)"}</label>
                <button type="button" id="btn-generate-random-token" class="text-[10px] font-mono text-primary hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span class="material-symbols-outlined text-[13px]">casino</span>
                  <span>${isId ? "Acak Token" : "Generate"}</span>
                </button>
              </div>
              <input 
                type="text" 
                id="quiz-form-token" 
                placeholder="${isId ? "Contoh: TKJ2026 (Kosongkan jika bebas)" : "e.g. TKJ2026"}" 
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary uppercase font-bold"
              />
              <span class="text-[10px] text-outline font-mono mt-0.5 block">${isId ? "Jika diisi, siswa wajib memasukkan token ini sebelum ujian dimulai." : "Required for students to start the test."}</span>
            </div>

            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Status Awal Publikasi *" : "Initial Status *"}</label>
              <select 
                id="quiz-form-status" 
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="active" selected>🟢 ${isId ? "Langsung Aktifkan untuk Siswa" : "Active (Visible to Students)"}</option>
                <option value="inactive">⚪ ${isId ? "Simpan sebagai Draf (Terkunci)" : "Draft (Locked)"}</option>
              </select>
            </div>
          </div>

          <!-- Dynamic Questions List Section -->
          <div class="pt-3 border-t border-outline-variant space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-bold text-xs text-on-surface font-mono uppercase tracking-wider">${isId ? "Daftar Butir Soal Pilihan Ganda" : "Multiple Choice Question Items"}</h4>
                <span class="text-[11px] text-outline font-mono" id="quiz-builder-count">1 Soal Ditambahkan</span>
              </div>
              <button type="button" id="btn-add-question-item" class="h-8 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-[16px]">add</span>
                <span>${isId ? "Tambah Soal" : "Add Question"}</span>
              </button>
            </div>

            <!-- Question items container -->
            <div id="quiz-builder-items-container" class="space-y-4">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <button 
            type="submit" 
            id="btn-save-quiz-package"
            class="w-full py-3 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <span class="material-symbols-outlined text-[18px]">publish</span>
            <span>${isId ? "Simpan & Publikasikan Kuis ke Portal Siswa" : "Publish Quiz Package to Students"}</span>
          </button>
        </form>
      </div>

      <!-- RIGHT COLUMN: Daftar Kuis yang Sedang Aktif (5 cols) -->
      <div class="lg:col-span-5 bg-surface-container-lowest p-5 sm:p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="border-b border-outline-variant pb-3 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 text-primary mb-1">
              <span class="material-symbols-outlined text-[20px]">inventory_2</span>
              <h3 class="font-bold text-sm text-on-surface font-mono">${isId ? "Daftar Paket Kuis Guru" : "Instructor Quiz Roster"}</h3>
            </div>
            <p class="text-xs text-on-surface-variant">${isId ? "Kelola status buka/kunci kuis untuk kelas." : "Toggle open/lock status."}</p>
          </div>
          <span id="quizzes-count-badge" class="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
            ...
          </span>
        </div>

        <div id="admin-quizzes-list" class="space-y-3">
          <div class="p-6 text-center text-outline font-mono text-xs">
            <span class="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
            <p class="mt-2">${isId ? "Memuat paket kuis..." : "Loading quizzes..."}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  let builderQuestions = [
    {
      id: 1,
      question: "",
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" }
      ],
      correctKey: "A",
      explanation: ""
    }
  ];

  function renderBuilderQuestions() {
    const container = document.getElementById("quiz-builder-items-container");
    const countEl = document.getElementById("quiz-builder-count");
    if (!container) return;

    if (countEl) countEl.textContent = `${builderQuestions.length} ${isId ? "Soal Ditambahkan" : "Questions"}`;

    container.innerHTML = builderQuestions.map((q, idx) => `
      <div class="p-4 rounded-xl border border-outline-variant bg-surface-container-low space-y-3 relative group" data-qidx="${idx}">
        <div class="flex items-center justify-between border-b border-outline-variant pb-2">
          <span class="font-bold text-xs text-primary font-mono">${isId ? `Nomor Soal ${idx + 1}` : `Question #${idx + 1}`}</span>
          ${builderQuestions.length > 1 ? `
            <button type="button" class="btn-remove-builder-q p-1 rounded hover:bg-red-500/10 text-red-600 text-xs font-mono transition-colors cursor-pointer" data-idx="${idx}" title="${isId ? "Hapus Soal Ini" : "Remove"}">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          ` : ""}
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-on-surface mb-1 font-mono">${isId ? "Pertanyaan / Studi Kasus *" : "Question Text *"}</label>
          <textarea 
            rows="2" 
            required 
            placeholder="${isId ? "Ketikkan pertanyaan atau skenario kasus jaringan di sini..." : "Enter scenario or question text..."}"
            class="input-q-text w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            data-idx="${idx}"
          >${q.question}</textarea>
        </div>

        <div class="space-y-2">
          <label class="block text-[11px] font-semibold text-on-surface font-mono">${isId ? "Pilihan Jawaban & Tandai Kunci Benar (Pilih Bulatan) *" : "Options & Mark Correct Key *"}</label>
          ${["A", "B", "C", "D"].map((key, optIdx) => `
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="correct-radio-${idx}" 
                  value="${key}" 
                  class="radio-q-correct w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer" 
                  data-idx="${idx}" 
                  ${q.correctKey === key ? "checked" : ""} 
                />
                <span class="w-5 text-center font-bold text-xs font-mono ${q.correctKey === key ? "text-emerald-700 dark:text-emerald-400 font-extrabold" : "text-outline"}">${key}.</span>
              </label>
              <input 
                type="text" 
                required 
                placeholder="${isId ? `Teks Pilihan ${key}` : `Option ${key}`}"
                value="${q.options[optIdx]?.text || ""}"
                class="input-opt-text flex-1 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary ${q.correctKey === key ? "border-emerald-500/50 bg-emerald-500/5" : ""}"
                data-idx="${idx}"
                data-optkey="${key}"
              />
            </div>
          `).join("")}
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-on-surface mb-1 font-mono">${isId ? "Pembahasan / Penjelasan Soal (Opsional)" : "Explanation (Optional)"}</label>
          <input 
            type="text" 
            placeholder="${isId ? "Penjelasan mengapa kunci tersebut benar..." : "Explanation why this is correct..."}"
            value="${q.explanation || ""}"
            class="input-q-expl w-full px-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            data-idx="${idx}"
          />
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".input-q-text").forEach(el => {
      el.addEventListener("input", (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        builderQuestions[i].question = e.target.value;
      });
    });

    container.querySelectorAll(".input-opt-text").forEach(el => {
      el.addEventListener("input", (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        const key = e.target.dataset.optkey;
        const opt = builderQuestions[i].options.find(o => o.key === key);
        if (opt) opt.text = e.target.value;
      });
    });

    container.querySelectorAll(".input-q-expl").forEach(el => {
      el.addEventListener("input", (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        builderQuestions[i].explanation = e.target.value;
      });
    });

    container.querySelectorAll(".radio-q-correct").forEach(el => {
      el.addEventListener("change", (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        builderQuestions[i].correctKey = e.target.value;
        renderBuilderQuestions();
      });
    });

    container.querySelectorAll(".btn-remove-builder-q").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.idx, 10);
        if (builderQuestions.length > 1) {
          builderQuestions.splice(i, 1);
          renderBuilderQuestions();
        }
      });
    });
  }

  renderBuilderQuestions();

  document.getElementById("btn-add-question-item")?.addEventListener("click", () => {
    sound.click();
    builderQuestions.push({
      id: builderQuestions.length + 1,
      question: "",
      options: [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" }
      ],
      correctKey: "A",
      explanation: ""
    });
    renderBuilderQuestions();
  });

  document.getElementById("btn-generate-random-token")?.addEventListener("click", () => {
    sound.click();
    const tokenInput = document.getElementById("quiz-form-token");
    if (tokenInput) {
      const randomCode = "TKJ" + Math.floor(1000 + Math.random() * 9000);
      tokenInput.value = randomCode;
      showToast(isId ? "Token Dibuat" : "Token Generated", `Token otomatis: ${randomCode}`, "casino");
    }
  });

  async function refreshQuizzesList() {
    const listEl = document.getElementById("admin-quizzes-list");
    const countBadge = document.getElementById("quizzes-count-badge");
    if (!listEl) return;

    let quizzes = [];
    try {
      quizzes = await getCustomQuizzes();
    } catch (_) {
      quizzes = getCustomQuizzesSync();
    }

    if (countBadge) {
      countBadge.textContent = `${quizzes.length} ${isId ? "Paket" : "Quizzes"}`;
    }

    if (!quizzes || quizzes.length === 0) {
      listEl.innerHTML = `<p class="p-6 text-center text-outline font-mono text-xs">${isId ? "Belum ada paket kuis buatan guru." : "No quizzes yet."}</p>`;
      return;
    }

    listEl.innerHTML = quizzes.map(q => {
      const isActive = q.status === "active";
      const qCount = (q.questions || []).length;

      return `
        <div class="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-all space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold ${isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" : "bg-surface-container text-outline border border-outline-variant"}">
                  ${isActive ? (isId ? "🟢 Aktif di Siswa" : "🟢 Active") : (isId ? "⚪ Draf / Nonaktif" : "⚪ Inactive")}
                </span>
                <span class="text-[10px] font-mono text-outline">${q.category}</span>
                ${q.token ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                    <span>Token: ${q.token}</span>
                    <button type="button" class="btn-copy-token text-amber-600 hover:text-amber-800 cursor-pointer p-0.5" data-token="${q.token}" title="Salin Token">
                      <span class="material-symbols-outlined text-[13px]">content_copy</span>
                    </button>
                  </span>
                ` : ""}
              </div>
              <h4 class="font-bold text-xs text-on-surface">${q.title}</h4>
              <p class="text-[11px] font-mono text-outline mt-0.5">${qCount} Butir Soal • Durasi ${q.durationMins || 15} Menit</p>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-outline-variant flex-wrap">
            <button type="button" class="btn-toggle-quiz-status h-7 px-2.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer flex items-center gap-1 ${isActive ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/20" : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"}" data-id="${q.id}">
              <span class="material-symbols-outlined text-[14px]">${isActive ? "lock" : "lock_open"}</span>
              <span>${isActive ? (isId ? "Kunci Kuis" : "Lock") : (isId ? "Buka ke Siswa" : "Activate")}</span>
            </button>

            <button type="button" class="btn-preview-quiz h-7 px-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-outline-variant text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer" data-id="${q.id}">
              <span class="material-symbols-outlined text-[14px] text-primary">visibility</span>
              <span>${isId ? "Uji Coba" : "Try Quiz"}</span>
            </button>

            <button type="button" class="btn-delete-quiz h-7 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 text-xs font-mono transition-colors cursor-pointer ml-auto" data-id="${q.id}" title="${isId ? "Hapus Kuis" : "Delete"}">
              <span class="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".btn-toggle-quiz-status").forEach(btn => {
      btn.addEventListener("click", async () => {
        sound.click();
        const quizId = btn.dataset.id;
        const newStatus = await toggleCustomQuizStatus(quizId);
        showToast(
          isId ? "Status Kuis Diperbarui" : "Status Updated", 
          newStatus === "active" 
            ? (isId ? "Kuis sekarang dibuka dan muncul di portal siswa." : "Quiz is now visible to students.") 
            : (isId ? "Kuis dikunci dan disembunyikan dari siswa." : "Quiz is locked."), 
          "sync"
        );
        await refreshQuizzesList();
      });
    });

    listEl.querySelectorAll(".btn-copy-token").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        sound.click();
        const tokenVal = btn.dataset.token;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(tokenVal);
          showToast(isId ? "Token Disalin" : "Token Copied", `Token ${tokenVal} berhasil disalin ke clipboard.`, "content_copy");
        }
      });
    });

    listEl.querySelectorAll(".btn-preview-quiz").forEach(btn => {
      btn.addEventListener("click", () => {
        sound.click();
        const quizId = btn.dataset.id;
        state.testState = null;
        navigateTo("quiz", { type: quizId });
      });
    });

    listEl.querySelectorAll(".btn-delete-quiz").forEach(btn => {
      btn.addEventListener("click", async () => {
        sound.click();
        const quizId = btn.dataset.id;
        const confirmDel = window.confirm(isId ? "Yakin ingin menghapus kuis ini?" : "Delete this quiz?");
        if (!confirmDel) return;
        await deleteCustomQuiz(quizId);
        showToast(isId ? "Kuis Dihapus" : "Quiz Deleted", isId ? "Paket kuis berhasil dihapus." : "Quiz removed.", "delete");
        await refreshQuizzesList();
      });
    });
  }

  document.getElementById("form-admin-create-quiz")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    sound.click();

    const title = document.getElementById("quiz-form-title")?.value.trim();
    const category = document.getElementById("quiz-form-category")?.value || "Topologi & Media";
    const durationMins = parseInt(document.getElementById("quiz-form-duration")?.value || "15", 10);
    const token = document.getElementById("quiz-form-token")?.value.trim().toUpperCase() || "";
    const status = document.getElementById("quiz-form-status")?.value || "active";

    for (let i = 0; i < builderQuestions.length; i++) {
      const q = builderQuestions[i];
      if (!q.question.trim()) {
        showToast(isId ? "Soal Belum Lengkap" : "Incomplete", isId ? `Isi pertanyaan nomor ${i + 1}.` : `Fill question #${i + 1}.`, "warning");
        return;
      }
      for (const opt of q.options) {
        if (!opt.text.trim()) {
          showToast(isId ? "Pilihan Belum Lengkap" : "Incomplete", isId ? `Isi pilihan ${opt.key} nomor ${i + 1}.` : `Fill option ${opt.key} #${i + 1}.`, "warning");
          return;
        }
      }
    }

    const submitBtn = document.getElementById("btn-save-quiz-package");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> <span>${isId ? "Menyimpan ke Portal Siswa..." : "Publishing..."}</span>`;
    }

    try {
      await saveCustomQuiz({
        title,
        category,
        durationMins,
        token,
        status,
        questions: builderQuestions
      });

      showToast(
        isId ? "Kuis Berhasil Diterbitkan!" : "Quiz Published!",
        `${isId ? "Kuis baru aktif dan langsung tersinkron ke siswa:" : "Published:"} ${title}`,
        "verified"
      );

      document.getElementById("form-admin-create-quiz")?.reset();
      builderQuestions = [
        {
          id: 1,
          question: "",
          options: [
            { key: "A", text: "" },
            { key: "B", text: "" },
            { key: "C", text: "" },
            { key: "D", text: "" }
          ],
          correctKey: "A",
          explanation: ""
        }
      ];
      renderBuilderQuestions();
      await refreshQuizzesList();
    } catch (err) {
      console.error("Save quiz error:", err);
      showToast(isId ? "Gagal Menyimpan" : "Save Error", err.message || "Error saving quiz.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span class="material-symbols-outlined text-[18px]">publish</span> <span>${isId ? "Simpan & Publikasikan Kuis ke Portal Siswa" : "Publish Quiz Package to Students"}</span>`;
      }
    }
  });

  await refreshQuizzesList();
}

async function renderAdminDiagnosticsTab(container) {
  const isId = getLang() === "id";
  const customQuizzes = getCustomQuizzesSync();

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Filter Bar & Diagnostic Header -->
      <div class="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-rose-600 mb-1">
            <span class="material-symbols-outlined text-[22px]">troubleshoot</span>
            <h3 class="font-bold text-sm text-on-surface font-mono">${isId ? "Diagnostik Butir Soal & Pola Miskonsepsi Siswa" : "Item Diagnostic & Misconception Insights"}</h3>
          </div>
          <p class="text-xs text-on-surface-variant">${isId ? "Statistik tingkat kesukaran (P-Value), efektivitas opsi pengecoh, dan deteksi kelemahan materi siswa." : "Item difficulty, distractor distribution, and student misconceptions."}</p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <select id="diag-select-test" class="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer font-bold">
            <option value="post" selected>${isId ? "🎯 Posttest HOTS (25 Soal)" : "HOTS Posttest (25 Items)"}</option>
            <option value="pre">${isId ? "📋 Pretest Awal (25 Soal)" : "Diagnostic Pretest (25 Items)"}</option>
            ${customQuizzes.map(q => `<option value="${q.id}">📝 ${isId ? "Kuis Guru: " : "Quiz: "}${q.title}</option>`).join("")}
          </select>

          <select id="diag-select-class" class="px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer font-bold">
            <option value="ALL">${isId ? "Semua Kelas TKJ" : "All Classes"}</option>
            ${TKJ_CLASSES.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
      </div>

      <!-- Pedagogical Methodology Info Banner -->
      <div class="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/5 to-primary/10 border border-rose-500/20 text-xs font-mono flex items-start gap-3">
        <span class="material-symbols-outlined text-[20px] text-rose-600 shrink-0 mt-0.5">info</span>
        <div class="space-y-1 text-on-surface">
          <span class="font-bold block text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px]">${isId ? "Pedoman Evaluasi Diagnostik Guru" : "Diagnostic Framework"}</span>
          <p class="text-[11px] text-on-surface-variant leading-relaxed">
            ${isId 
              ? "Indeks Kesukaran: <strong>Mudah</strong> (P &gt; 0.70), <strong>Sedang</strong> (0.30 &le; P &le; 0.70), <strong>Sukar</strong> (P &lt; 0.30). Peringatan <strong>Miskonsepsi</strong> otomatis aktif bila salah satu opsi pengecoh salah dipilih oleh &ge; 22% siswa dalam satu kelas."
              : "Difficulty Index: Easy (P &gt; 0.70), Moderate (0.30 &le; P &le; 0.70), Hard (P &lt; 0.30). Misconception alert triggers when &ge; 22% choose a distractor."}
          </p>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" id="diag-kpi-cards">
        <!-- Rendered dynamically -->
      </div>

      <!-- Diagnostic Items List -->
      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs overflow-hidden">
        <div class="p-4 sm:p-5 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[18px]">analytics</span>
            </div>
            <div>
              <h4 class="font-bold text-xs text-on-surface font-mono uppercase tracking-wider">${isId ? "Analisis Butir Soal per Nomor" : "Item-by-Item Breakdown"}</h4>
              <p class="text-[11px] text-outline">${isId ? "Distribusi pilihan A-D siswa, kunci benar, & saran remidiasi konsep." : "Option distribution and remediation guidance."}</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-mono font-bold text-outline border border-outline-variant/60" id="diag-total-items-badge">...</span>
        </div>

        <div class="p-4 sm:p-6 space-y-4" id="diag-items-list-container">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>
  `;

  function refreshDiagnostics() {
    const selectedTest = document.getElementById("diag-select-test")?.value || "post";
    const selectedClass = document.getElementById("diag-select-class")?.value || "ALL";

    let questionsList = [];
    let isCustom = selectedTest.startsWith("quiz-") || selectedTest.startsWith("custom-");

    if (isCustom) {
      const qz = customQuizzes.find(q => String(q.id) === String(selectedTest));
      questionsList = (qz && qz.questions) ? qz.questions.map((q, idx) => ({
        id: q.id || idx + 1,
        question_id: q.question,
        scenario_id: q.scenario || "",
        correctKey: q.correctKey,
        explanation_id: q.explanation || "",
        options: q.options
      })) : [];
    } else {
      questionsList = HOTS_QUESTIONS;
    }

    const items = getItemDiagnostics({
      testType: selectedTest,
      quizId: isCustom ? selectedTest : null,
      filterClass: selectedClass,
      questionsList: questionsList
    });

    const kpiContainer = document.getElementById("diag-kpi-cards");
    const badgeContainer = document.getElementById("diag-total-items-badge");
    const listContainer = document.getElementById("diag-items-list-container");

    const totalQuestions = items.length;
    const avgScorePct = totalQuestions > 0 ? Math.round(items.reduce((acc, it) => acc + it.pctCorrect, 0) / totalQuestions) : 0;
    const highMisconceptionCount = items.filter(it => it.hasHighMisconception).length;
    const hardCount = items.filter(it => it.pctCorrect < 30).length;

    if (badgeContainer) {
      badgeContainer.textContent = `${totalQuestions} ${isId ? "Butir Soal Dianalisis" : "Items Analyzed"}`;
    }

    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="bg-surface-container-lowest p-5 rounded-2xl border-t-4 border-t-primary border border-outline-variant shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono text-outline uppercase block font-bold">${isId ? "Rata-rata Skor Capaian" : "Avg Score"}</span>
            <span class="text-2xl font-black text-on-surface font-mono">${avgScorePct}%</span>
            <span class="text-[11px] text-outline font-mono block mt-0.5">${isId ? "Tingkat ketepatan kelas" : "Class accuracy"}</span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <span class="material-symbols-outlined text-[24px]">grade</span>
          </div>
        </div>

        <div class="bg-surface-container-lowest p-5 rounded-2xl border-t-4 border-t-amber-500 border border-outline-variant shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono text-outline uppercase block font-bold">${isId ? "Soal Terindikasi Miskonsepsi" : "High Misconception"}</span>
            <span class="text-2xl font-black text-amber-600 font-mono">${highMisconceptionCount} <span class="text-xs text-outline font-normal">Soal</span></span>
            <span class="text-[11px] text-amber-600 font-mono block mt-0.5">${isId ? "Pengecoh > 22% siswa" : "Distractor > 22%"}</span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
            <span class="material-symbols-outlined text-[24px]">warning</span>
          </div>
        </div>

        <div class="bg-surface-container-lowest p-5 rounded-2xl border-t-4 border-t-rose-500 border border-outline-variant shadow-xs flex items-center justify-between">
          <div>
            <span class="text-[10px] font-mono text-outline uppercase block font-bold">${isId ? "Soal Kategori Sukar (<30%)" : "Difficult Items (<30%)"}</span>
            <span class="text-2xl font-black text-rose-600 font-mono">${hardCount} <span class="text-xs text-outline font-normal">Soal</span></span>
            <span class="text-[11px] text-rose-600 font-mono block mt-0.5">${isId ? "Butuh remidiasi klasikal" : "Needs review"}</span>
          </div>
          <div class="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
            <span class="material-symbols-outlined text-[24px]">psychology_alt</span>
          </div>
        </div>
      `;
    }

    if (listContainer) {
      if (items.length === 0) {
        listContainer.innerHTML = `<p class="p-8 text-center text-outline font-mono text-xs">${isId ? "Tidak ada butir soal untuk asesmen ini." : "No items found."}</p>`;
        return;
      }

      listContainer.innerHTML = items.map(it => `
        <div class="p-5 rounded-2xl border border-outline-variant bg-surface-container-low hover:bg-surface-container transition-all space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant pb-3">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="w-7 h-7 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-xs font-mono shadow-xs">
                ${it.index}
              </span>
              <span class="text-xs font-bold font-mono text-on-surface">${isId ? `Butir Soal #${it.index}` : `Item #${it.index}`}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${it.difficultyColor}">
                Tingkat ${it.difficulty} (P = ${it.pValue})
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                ✓ Kunci: ${it.correctKey}
              </span>
            </div>
            <div class="text-xs font-mono font-bold text-outline">
              <span class="text-primary">${it.correctCount}</span> / ${it.totalRespondents} Siswa Benar (${it.pctCorrect}%)
            </div>
          </div>

          <div>
            ${it.scenario ? `<p class="text-xs text-on-surface-variant italic mb-1.5 leading-relaxed bg-surface-container p-2.5 rounded-lg border border-outline-variant/40">${it.scenario}</p>` : ""}
            <p class="text-xs font-semibold text-on-surface leading-relaxed">${it.question}</p>
          </div>

          <div class="space-y-2 pt-1">
            <span class="text-[10px] font-mono uppercase tracking-wider text-outline block font-bold">
              ${isId ? "Distribusi Pilihan Jawaban Siswa:" : "Student Option Distribution:"}
            </span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              ${it.distCounts.map(d => {
                const isCorrect = d.key === it.correctKey;
                const isTrap = !isCorrect && d.pct >= 22;
                return `
                  <div class="p-3 rounded-xl border transition-all ${
                    isCorrect 
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-500/20" 
                      : (isTrap 
                          ? "bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold ring-1 ring-rose-500/20" 
                          : "bg-surface-container-lowest border-outline-variant text-on-surface")
                  }">
                    <div class="flex items-center justify-between mb-1.5">
                      <span class="flex items-center gap-1">
                        <span>Opsi ${d.key}</span>
                        ${isCorrect ? `<span class="text-[10px] text-emerald-600">✓ Kunci</span>` : ""}
                        ${isTrap ? `<span class="text-[10px] text-rose-600">⚠️ Trap</span>` : ""}
                      </span>
                      <span class="font-bold">${d.pct}%</span>
                    </div>
                    <div class="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div class="h-full ${isCorrect ? "bg-emerald-500" : (isTrap ? "bg-rose-500" : "bg-primary/70")}" style="width: ${Math.max(4, d.pct)}%"></div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          ${it.hasHighMisconception ? `
            <div class="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-rose-500/10 border border-amber-500/30 text-xs font-mono flex items-start gap-3">
              <span class="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">warning</span>
              <div class="space-y-1.5 flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-amber-800 dark:text-amber-300">${isId ? "⚠️ Terdeteksi Pola Miskonsepsi Siswa!" : "⚠️ Common Misconception Pattern Detected!"}</span>
                  <span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-bold">${it.topMisconception.pct}% Terjebak</span>
                </div>
                <p class="text-[11px] leading-relaxed text-on-surface">
                  ${isId 
                    ? `Sebanyak <strong>${it.topMisconception.pct}% siswa terjebak memilih Opsi ${it.topMisconception.key}</strong>. Siswa cenderung keliru membedakan konsep pada butir ini.`
                    : `${it.topMisconception.pct}% of students picked distractor ${it.topMisconception.key}.`}
                </p>
                ${it.explanation ? `
                  <div class="text-[11px] text-on-surface-variant pt-2 border-t border-amber-500/20 mt-1 flex items-start gap-2">
                    <span class="material-symbols-outlined text-[16px] text-indigo-500 shrink-0 mt-0.5">lightbulb</span>
                    <div>
                      <strong class="text-on-surface">${isId ? "Saran Remidiasi Pedagogis Guru:" : "Remediation Guide:"}</strong>
                      <span class="italic text-on-surface-variant ml-1">${it.explanation}</span>
                    </div>
                  </div>
                ` : ""}
              </div>
            </div>
          ` : ""}
        </div>
      `).join("");
    }
  }

  refreshDiagnostics();
  document.getElementById("diag-select-test")?.addEventListener("change", refreshDiagnostics);
  document.getElementById("diag-select-class")?.addEventListener("change", refreshDiagnostics);
}

// ============================================================================
// VIEW 9: MANUAL / RFC SPECS (Stitch netlearn_user_guide_platform_documentation)
// ============================================================================
function renderManual(container) {
  const isId = getLang() === "id";
  const book = isId ? MANUAL_BOOK.id : MANUAL_BOOK.en;
  const sections = book?.sections || [];

  container.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-6 w-full">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-outline-variant">
        <div>
          <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
            <span>${isId ? "Portal Pembelajaran" : "Learning Portal"}</span>
            <span>/</span>
            <span>${isId ? "Panduan Pengguna" : "User Guide"}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${book?.title || (isId ? "Panduan Pengguna Aplikasi NetLearn" : "NetLearn Application User Guide")}</h1>
          <p class="text-xs sm:text-sm text-on-surface-variant mt-1">${book?.subtitle || (isId ? "Petunjuk lengkap tata cara penggunaan aplikasi dan laboratorium virtual NetLearn." : "Complete step-by-step user manual.")}</p>
        </div>
        <button class="h-9 px-3.5 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs" id="btn-export-handbook">
          <span class="material-symbols-outlined text-[16px]">file_download</span>
          <span>${isId ? "Unduh Panduan (.doc)" : "Download Guide (.doc)"}</span>
        </button>
      </div>

      <!-- Quick Summary Cards (Pilar Utama Penggunaan Sesuai Fitur Baru) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <span class="material-symbols-outlined text-[22px]">menu_book</span>
          </div>
          <div>
            <div class="font-bold text-xs text-on-surface">${isId ? "1. Modul Kurikulum" : "1. Curriculum Modules"}</div>
            <div class="text-[11px] text-on-surface-variant">${isId ? "6 modul teori & dokumen Word" : "6 curriculum modules & Word docs"}</div>
          </div>
        </div>
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
            <span class="material-symbols-outlined text-[22px]">science</span>
          </div>
          <div>
            <div class="font-bold text-xs text-on-surface">${isId ? "2. Lab Cisco & Topologi" : "2. Cisco Lab & Topologies"}</div>
            <div class="text-[11px] text-on-surface-variant">${isId ? "Event list, PDU & CLI terminal" : "Event list, PDU & CLI terminal"}</div>
          </div>
        </div>
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <span class="material-symbols-outlined text-[22px]">sports_esports</span>
          </div>
          <div>
            <div class="font-bold text-xs text-on-surface">${isId ? "3. Mini Game 3D Kota" : "3. 3D City Quest"}</div>
            <div class="text-[11px] text-on-surface-variant">${isId ? "Kurir paket & 6 pos protokol" : "Data courier & 6 protocol checkpoints"}</div>
          </div>
        </div>
        <div class="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <span class="material-symbols-outlined text-[22px]">psychology</span>
          </div>
          <div>
            <div class="font-bold text-xs text-on-surface">${isId ? "4. Evaluasi HOTS" : "4. HOTS Assessment"}</div>
            <div class="text-[11px] text-on-surface-variant">${isId ? "Pretest, posttest & gain score" : "Pretest, posttest & gain score"}</div>
          </div>
        </div>
      </div>

      <!-- Documentation Chapters -->
      <div class="space-y-4">
        ${sections.map((sec, idx) => `
          <div class="bg-surface-container-lowest p-5 sm:p-6 rounded-xl border border-outline-variant shadow-xs">
            <h3 class="text-base font-bold text-on-surface mb-3 flex items-center gap-3 border-b border-outline-variant/60 pb-2">
              <span class="w-7 h-7 rounded-lg bg-primary/10 text-primary font-mono text-xs flex items-center justify-center font-bold border border-primary/20 shrink-0">${idx + 1}</span>
              <span>${sec.title}</span>
            </h3>
            <div class="text-xs sm:text-sm text-on-surface-variant leading-relaxed sm:pl-10 space-y-2">
              ${sec.content}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.getElementById("btn-export-handbook")?.addEventListener("click", () => {
    let docHtml = `<h1>${book?.title || "Panduan Pengguna NetLearn"}</h1><p><em>${book?.subtitle || ""}</em></p><hr/>`;
    sections.forEach(s => {
      docHtml += `<h2>${s.title}</h2><div>${s.content}</div><hr/>`;
    });
    exportToWord("Panduan_Pengguna_NetLearn", "Panduan Pengguna NetLearn", docHtml);
    showToast(isId ? "Panduan Diunduh" : "Handbook Downloaded", isId ? "File panduan format Word berhasil diunduh." : "Exported successfully to Word format.", "file_download");
  });
}

// ============================================================================
// VIEW 10: STUDENT PROFILE & SETTINGS (Stitch student_profile_account_settings)
// ============================================================================
function renderProfile(container) {
  const meta = state.currentUser?.user?.user_metadata || {};
  const studentName = state.currentUser?.name || meta.full_name || meta.name || (getLang() === "id" ? "Siswa NetLearn" : "Student");
  const studentEmail = state.currentUser?.email || state.currentUser?.user?.email || "siswa@netlearn.edu";
  const studentClass = state.currentUser?.className || meta.class_name || "";
  const studentAvatar = state.currentUser?.avatar || meta.avatar_url || "";
  const isTeacher = isUserAdmin(state.currentUser);
  const isId = getLang() === "id";

  container.innerHTML = `
    <div class="max-w-5xl mx-auto space-y-6 w-full">
      <div class="pb-2 border-b border-outline-variant">
        <div class="flex items-center gap-1.5 font-mono text-xs text-outline uppercase tracking-wider">
          <span>${isId ? "Portal Akademik" : "Academic Portal"}</span>
          <span>/</span>
          <span>${isId ? "Akun" : "Account"}</span>
          <span>/</span>
          <span class="text-on-surface font-semibold">${isId ? "Profil" : "Profile"}</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">${isId ? "Profil Siswa" : "Student Profile"}</h1>
      </div>

      <!-- Hero Identity Card -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div class="w-20 h-20 rounded-full ${isTeacher ? "bg-secondary text-on-secondary" : "bg-primary text-on-primary"} flex items-center justify-center text-3xl font-bold font-mono shadow-md overflow-hidden shrink-0 border-2 border-outline-variant">
          ${studentAvatar 
            ? `<img src="${studentAvatar}" alt="${studentName}" class="w-full h-full object-cover" id="hero-avatar-img" />`
            : `<span id="hero-avatar-initial">${studentName.charAt(0).toUpperCase()}</span>`
          }
        </div>
        <div class="flex flex-col gap-1 text-center sm:text-left min-w-0">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 class="text-xl font-bold text-on-surface" id="hero-name-display">${studentName}</h2>
            ${studentClass ? `<span class="px-2 py-0.5 rounded font-mono text-xs bg-primary-fixed text-primary font-bold" id="hero-class-badge">${studentClass}</span>` : ""}
            <span class="px-2 py-0.5 rounded font-mono text-xs ${isTeacher ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container text-on-surface"} font-bold">
              ${isTeacher ? (isId ? "Guru / Admin" : "Teacher") : (isId ? "Siswa" : "Student")}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant font-mono">${studentEmail} • ${studentClass ? `Kelas ${studentClass} • ` : ""}Kurikulum Jaringan Komputer</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px] font-bold">Node Verified</span>
            <span class="px-2.5 py-0.5 rounded-full bg-surface-container text-outline font-mono text-[10px]">Academic Active</span>
          </div>
        </div>
      </div>

      <!-- Edit Profil: Ubah Nama & Foto Profil -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs space-y-5">
        <div class="flex items-center justify-between border-b border-outline-variant pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">manage_accounts</span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Perbarui Profil & Identitas Siswa" : "Edit Profile & Credentials"}</h3>
              <p class="text-[11px] text-on-surface-variant">${isId ? "Ubah nama lengkap, kelas TKJ, dan foto profil akun Anda" : "Update your display name, class, and profile picture"}</p>
            </div>
          </div>
        </div>

        <form id="form-edit-profile" class="space-y-4">
          <!-- Photo Upload & Presets -->
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-2 font-mono">${isId ? "Foto Profil Pengguna (Avatar)" : "Profile Picture (Avatar)"}</label>
            <div class="flex flex-wrap items-center gap-4">
              <!-- Live Preview -->
              <div class="relative w-16 h-16 rounded-full overflow-hidden bg-surface-container border-2 border-outline-variant shrink-0 flex items-center justify-center text-xl font-bold font-mono shadow-xs">
                <img id="edit-avatar-preview" src="${studentAvatar || ''}" class="w-full h-full object-cover ${studentAvatar ? '' : 'hidden'}" alt="Avatar Preview" />
                <span id="edit-avatar-fallback" class="${studentAvatar ? 'hidden' : ''} text-primary font-bold">${studentName.charAt(0).toUpperCase()}</span>
              </div>

              <!-- Action buttons -->
              <div class="flex flex-wrap items-center gap-2">
                <input type="file" id="input-profile-avatar" accept="image/*" class="hidden" />
                <button type="button" id="btn-trigger-avatar-upload" class="h-9 px-3.5 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                  <span class="material-symbols-outlined text-[16px] text-primary">add_a_photo</span>
                  <span>${isId ? "Pilih Foto Baru" : "Upload Photo"}</span>
                </button>
                <button type="button" id="btn-remove-avatar" class="h-9 px-3 text-error hover:bg-error/10 border border-transparent rounded-lg font-mono text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${studentAvatar ? '' : 'hidden'}">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                  <span>${isId ? "Hapus Foto" : "Remove"}</span>
                </button>
              </div>
            </div>

            <!-- Avatar Presets -->
            <div class="mt-3">
              <span class="text-[11px] text-outline font-mono block mb-1.5">${isId ? "Atau pilih avatar karakter siap pakai:" : "Or choose a preset avatar:"}</span>
              <div class="flex items-center gap-2.5">
                ${[
                  "https://api.dicebear.com/7.x/bottts/svg?seed=Technician1",
                  "https://api.dicebear.com/7.x/bottts/svg?seed=NetworkAdmin",
                  "https://api.dicebear.com/7.x/bottts/svg?seed=CiscoPro",
                  "https://api.dicebear.com/7.x/bottts/svg?seed=FiberOptic"
                ].map((presetUrl, idx) => `
                  <button type="button" class="w-10 h-10 rounded-full border border-outline-variant hover:border-primary p-0.5 bg-surface-container transition-all cursor-pointer avatar-preset-btn hover:scale-105" data-url="${presetUrl}" title="Avatar ${idx + 1}">
                    <img src="${presetUrl}" alt="Avatar ${idx + 1}" class="w-full h-full rounded-full object-cover pointer-events-none" />
                  </button>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <!-- Full Name Input -->
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Nama Lengkap Siswa *" : "Full Name *"}</label>
              <input 
                type="text" 
                id="edit-profile-name" 
                value="${studentName}"
                class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white font-mono"
                required
              />
            </div>

            <!-- Class Dropdown (if student) or Teacher label -->
            <div>
              <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Kelas Siswa (TKJ) *" : "Class (TKJ) *"}</label>
              ${isTeacher ? `
                <input 
                  type="text" 
                  value="${isId ? "Guru / Instruktur" : "Instructor"}" 
                  disabled 
                  class="w-full px-3.5 py-2.5 bg-surface-container-high border border-outline-variant rounded-lg text-xs text-outline font-mono cursor-not-allowed"
                />
              ` : `
                <select 
                  id="edit-profile-class" 
                  class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white font-mono cursor-pointer"
                >
                  ${TKJ_CLASSES.map(cls => `<option value="${cls}" ${studentClass === cls ? "selected" : ""}>${cls}</option>`).join("")}
                </select>
              `}
            </div>
          </div>

          <!-- Email (Read-only) -->
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Alamat Email Terdaftar (Terkunci)" : "Registered Email"}</label>
            <div class="relative flex items-center">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">lock</span>
              <input 
                type="email" 
                value="${studentEmail}" 
                disabled 
                class="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-high border border-outline-variant rounded-lg text-xs text-outline font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <div class="pt-2">
            <button 
              type="submit" 
              id="btn-save-profile" 
              class="h-10 px-5 bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span class="material-symbols-outlined text-[18px]">save</span>
              <span>${isId ? "Simpan Perubahan Profil" : "Save Profile Changes"}</span>
            </button>
          </div>
        </form>
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

      <!-- Sesi Akun & Keluar -->
      <div class="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-xs space-y-4">
        <div class="flex items-center justify-between border-b border-outline-variant pb-2">
          <h3 class="text-sm font-bold text-on-surface font-mono">${isId ? "Sesi Akun Pengguna" : "User Account Session"}</h3>
          <span class="text-xs font-mono text-secondary font-bold">
            ${isTeacher ? (isId ? "Role: Guru" : "Role: Teacher") : (isId ? "Role: Siswa" : "Role: Student")}
          </span>
        </div>

        <p class="text-xs text-on-surface-variant leading-relaxed">
          ${isId 
            ? "Keluar dari sesi akun untuk mengamankan data dan riwayat belajar Anda pada perangkat ini." 
            : "Sign out of your active session to secure your learning progress and test history on this device."}
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-1">
          <button class="h-9 px-4 bg-error hover:bg-error/90 text-on-error font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer" id="btn-profile-logout">
            <span class="material-symbols-outlined text-[16px]">logout</span>
            <span>${isId ? "Keluar dari Akun" : "Log Out"}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Profile Edit Interactions
  let activeAvatar = studentAvatar;

  const fileInput = document.getElementById("input-profile-avatar");
  const avatarPreview = document.getElementById("edit-avatar-preview");
  const avatarFallback = document.getElementById("edit-avatar-fallback");
  const removeAvatarBtn = document.getElementById("btn-remove-avatar");

  document.getElementById("btn-trigger-avatar-upload")?.addEventListener("click", () => {
    fileInput?.click();
  });

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast(isId ? "File Tidak Valid" : "Invalid File", isId ? "Silakan pilih file gambar (JPG/PNG)." : "Please choose an image file.", "warning");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast(isId ? "Ukuran Terlalu Besar" : "File Too Large", isId ? "Ukuran gambar maksimal adalah 2MB." : "Image size must be under 2MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      activeAvatar = event.target.result;
      if (avatarPreview) {
        avatarPreview.src = activeAvatar;
        avatarPreview.classList.remove("hidden");
      }
      if (avatarFallback) avatarFallback.classList.add("hidden");
      if (removeAvatarBtn) removeAvatarBtn.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  // Preset buttons
  container.querySelectorAll(".avatar-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeAvatar = btn.dataset.url;
      if (avatarPreview) {
        avatarPreview.src = activeAvatar;
        avatarPreview.classList.remove("hidden");
      }
      if (avatarFallback) avatarFallback.classList.add("hidden");
      if (removeAvatarBtn) removeAvatarBtn.classList.remove("hidden");
    });
  });

  // Remove photo
  removeAvatarBtn?.addEventListener("click", () => {
    activeAvatar = "";
    if (avatarPreview) {
      avatarPreview.src = "";
      avatarPreview.classList.add("hidden");
    }
    if (avatarFallback) avatarFallback.classList.remove("hidden");
    if (removeAvatarBtn) removeAvatarBtn.classList.add("hidden");
    if (fileInput) fileInput.value = "";
  });

  // Form submit
  document.getElementById("form-edit-profile")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("edit-profile-name");
    const classInput = document.getElementById("edit-profile-class");
    const saveBtn = document.getElementById("btn-save-profile");

    const newName = nameInput ? nameInput.value.trim() : "";
    const newClass = classInput ? classInput.value.trim() : studentClass;

    if (!newName) {
      showToast(isId ? "Nama Wajib Diisi" : "Name Required", isId ? "Silakan masukkan nama lengkap Anda." : "Please enter your full name.", "warning");
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.classList.add("opacity-60");
    }

    try {
      const updated = await updateUserProfile({
        name: newName,
        className: newClass,
        avatar: activeAvatar
      });

      if (updated) {
        state.currentUser = updated;
      } else {
        if (!state.currentUser) state.currentUser = {};
        state.currentUser.name = newName;
        state.currentUser.className = newClass;
        state.currentUser.avatar = activeAvatar;
      }

      updateNavUser();
      showToast(
        isId ? "Profil Berhasil Diperbarui!" : "Profile Updated!", 
        isId ? `Nama: ${newName} ${newClass ? `(${newClass})` : ""}` : `Credentials saved successfully.`, 
        "check_circle"
      );
      renderProfile(container);
    } catch (err) {
      console.error("Save profile error:", err);
      showToast(isId ? "Gagal Menyimpan" : "Failed to Save", err.message || (isId ? "Terjadi kesalahan saat menyimpan profil." : "Error saving profile."), "error");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove("opacity-60");
      }
    }
  });

  document.getElementById("btn-profile-logout")?.addEventListener("click", () => {
    handleLogout();
  });
}

// ============================================================================
// MODALS (Materials Reader, Video Player, Supabase Settings)
// ============================================================================
function openMaterialModal(materialId) {
  const m = getMaterialById(materialId);
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
  const m = getMaterialById(materialId);
  const modalsRoot = document.getElementById("modals-root");
  if (!modalsRoot) return;

  const isWatched = state.userStats.watchedVideos.includes(m.id);
  const lang = getLang();
  const isId = lang === "id";
  const embedUrl = m.video?.embedUrl || (m.video?.url ? getYouTubeEmbedUrl(m.video.url) : (m.file_url ? getYouTubeEmbedUrl(m.file_url) : "https://www.youtube.com/embed/dQw4w9WgXcQ"));

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
            src="${embedUrl}" 
            title="Video Lecture" 
            class="w-full h-full border-0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen
          ></iframe>
        </div>

        <div class="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-2">
          <h4 class="text-xs font-bold text-on-surface font-mono uppercase tracking-wider">${t("videoKeyTakeaways")}</h4>
          <ul class="space-y-1.5 text-xs text-on-surface-variant font-sans">
            ${((isId ? m.video?.keyTakeaways_id : m.video?.keyTakeaways_en) || [
              isId ? "Pelajari konsep arsitektur dan prinsip kerja jaringan secara mendalam." : "Understand network architecture and operational principles.",
              isId ? "Terapkan pemahaman teori ke dalam skenario konfigurasi praktis." : "Apply theoretical concepts to hands-on configuration scenarios."
            ]).map(pt => `
              <li class="flex items-start gap-2 leading-relaxed">
                <span class="text-primary font-bold shrink-0">•</span>
                <span>${pt}</span>
              </li>
            `).join("")}
          </ul>
        </div>
      </div>

      <div class="p-4 border-t border-outline-variant flex items-center justify-between gap-3 bg-surface-container-lowest shrink-0 flex-wrap sm:flex-nowrap">
        <div class="flex items-center gap-2">
          <a 
            href="${m.video.url}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="h-8 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-mono text-xs rounded border border-outline-variant flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Buka langsung di tab baru YouTube"
          >
            <span class="material-symbols-outlined text-[16px] text-red-500">smart_display</span>
            <span>${isId ? "Buka di YouTube" : "Open in YouTube"}</span>
            <span class="material-symbols-outlined text-[14px] text-outline">open_in_new</span>
          </a>
          <span class="text-xs font-mono text-outline hidden sm:inline">• ${isWatched ? (isId ? "Sudah Ditonton" : "Watched") : (isId ? "Belum dicatat" : "Not yet watched")}</span>
        </div>
        <button class="h-8 px-4 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap ml-auto" id="modal-mark-watched">
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
// Modal: Google Quick Sign-In / Register (Input Email Akun Google Pengguna)
// ============================================================================
function showGoogleAccountPromptModal(selectedRole = "student") {
  const isId = getLang() === "id";
  const modalsRoot = document.getElementById("modals-root") || document.body;
  const overlay = document.createElement("div");
  overlay.id = "modal-google-prompt";
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in";
  overlay.innerHTML = `
    <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-outline-variant">
        <div class="flex items-center gap-2.5">
          <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span class="font-bold text-sm text-on-surface">${isId ? "Masuk / Daftar Akun Google" : "Continue with Google"}</span>
        </div>
        <button type="button" class="text-outline hover:text-on-surface p-1 rounded-lg cursor-pointer" id="btn-close-google-prompt">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <p class="text-xs text-on-surface-variant leading-relaxed">
        ${isId 
          ? "Masukkan alamat email Google Anda untuk masuk atau mendaftar otomatis sebagai Siswa." 
          : "Enter your Google email address to sign in or automatically register as a Student."}
      </p>

      <form id="form-google-prompt" class="space-y-3.5 pt-1">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Alamat Email Google *" : "Google Email Address *"}</label>
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">mail</span>
            <input 
              type="email" 
              id="prompt-google-email" 
              placeholder="${isId ? "nama.siswa@gmail.com" : "student@gmail.com"}"
              class="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" 
              required 
            />
          </div>
          <span class="text-[10px] text-outline font-mono mt-1 block">
            ${isId ? "⚡ Setelah email terverifikasi, Anda akan mengisi identitas Nama & Kelas." : "⚡ Next step: Complete your Name & Class."}
          </span>
        </div>

        <button 
          type="submit" 
          class="w-full h-10 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <span>${isId ? "Lanjut & Isi Identitas" : "Continue & Set Identity"}</span>
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>
    </div>
  `;

  modalsRoot.appendChild(overlay);

  overlay.querySelector("#btn-close-google-prompt")?.addEventListener("click", () => overlay.remove());

  overlay.querySelector("#form-google-prompt")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailVal = overlay.querySelector("#prompt-google-email").value.trim().toLowerCase();
    if (!emailVal || !emailVal.includes("@")) {
      showToast(isId ? "Email Tidak Valid" : "Invalid Email", isId ? "Silakan masukkan email Google yang benar." : "Please enter a valid Google email.", "warning");
      return;
    }

    overlay.remove();
    showToast(isId ? "Menghubungkan Akun..." : "Connecting Account...", emailVal, "sync");

    try {
      const loggedUser = await signInWithGoogleEmail({ email: emailVal, role: selectedRole });
      state.userStats = {
        xp: 0,
        readMaterials: [],
        watchedVideos: [],
        unlockedBadges: [],
        results: []
      };
      state.currentUser = loggedUser;
      showAppLayout();
      await loadUserStats();
      updateNavUser();
      updateRoleAccess();
      updateHUD();

      // Jika user bukan admin dan identitas belum lengkap, buka modal identitas siswa
      if (!isUserAdmin(loggedUser) && (loggedUser.needsProfileCompletion || (loggedUser.role === "student" && (!loggedUser.className || loggedUser.className.trim() === "")))) {
        showStudentProfileModal(loggedUser);
      } else {
        const targetView = isUserAdmin(state.currentUser) ? "admin" : "dashboard";
        navigateTo(targetView);
        showToast(isId ? "Berhasil Masuk via Google!" : "Logged In via Google!", `${isId ? "Selamat datang" : "Welcome"}, ${loggedUser.name}`, "check_circle");
      }
    } catch (err) {
      console.error("Google login error:", err);
      showToast(isId ? "Gagal Masuk" : "Login Failed", err.message || (isId ? "Terjadi kesalahan saat masuk Google." : "Google login failed."), "error");
    }
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
          <p class="text-xs text-on-surface-variant">${isId ? "Wajib diisi untuk rekap nilai Pretest/Posttest dan absensi kelas." : "Required for grade recording and class roster."}</p>
        </div>
      </div>

      <form id="form-complete-student-profile" class="space-y-3.5 pt-1">
        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Nama Lengkap Siswa *" : "Full Student Name *"}</label>
          <input 
            type="text" 
            id="student-complete-name" 
            value="${currentUser?.name && !currentUser.name.includes("@") ? currentUser.name : ""}" 
            placeholder="${isId ? "Contoh: Budi Pratama" : "e.g. John Doe"}"
            class="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" 
            required 
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-on-surface mb-1 font-mono">${isId ? "Kelas Siswa (TKJ) *" : "Class (TKJ) *"}</label>
          <div class="relative flex items-center">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">school</span>
            <select 
              id="student-complete-class" 
              class="w-full pl-10 pr-9 py-2.5 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer" 
              required 
            >
              <option value="" disabled ${!currentUser?.className ? "selected" : ""}>${isId ? "-- Pilih Kelas TKJ --" : "-- Select TKJ Class --"}</option>
              ${TKJ_CLASSES.map(cls => `<option value="${cls}" ${currentUser?.className === cls ? "selected" : ""}>${cls}</option>`).join("")}
            </select>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none">expand_more</span>
          </div>
          <span class="text-[10px] text-outline font-mono mt-1 block">${isId ? "Pilih langsung kelas tanpa mengetik manual" : "Select directly without typing"}</span>
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
      showToast(isId ? "Data Belum Lengkap" : "Incomplete", isId ? "Silakan isi nama dan pilih kelas Anda." : "Please enter your name and select your class.", "warning");
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
    navigateTo("dashboard");
  });
}

