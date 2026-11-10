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
  signInWithGoogle,
  signInWithGoogleEmail,
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
    if (state.currentUser.needsProfileCompletion || (state.currentUser.role === "student" && (!state.currentUser.className || state.currentUser.className.trim() === ""))) {
      showStudentProfileModal(state.currentUser);
    }
    const isTeacher = state.currentUser.role === "teacher" || state.currentUser.user?.user_metadata?.role === "teacher";
    const targetHash = window.location.hash.replace("#", "").trim();
    const validViews = ["dashboard", "materials", "simulation", "quizzes", "minigame", "pretest", "posttest", "manual", "profile", "admin"];
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
  const isTeacher = state.currentUser && (state.currentUser.role === "teacher" || state.currentUser.user?.user_metadata?.role === "teacher");

  document.querySelectorAll(".admin-nav-btn, #nav-btn-admin, #top-nav-admin").forEach(btn => {
    if (isTeacher) {
      btn.classList.remove("hidden");
      btn.style.setProperty("display", "inline-flex", "important");
    } else {
      btn.classList.add("hidden");
      btn.style.setProperty("display", "none", "important");
    }
  });
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
    const isTeacher = state.currentUser.role === "teacher" || meta.role === "teacher";
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
    navigateTo(state.currentUser ? "dashboard" : "auth");
  });
  document.getElementById("header-brand-click")?.addEventListener("click", () => {
    navigateTo(state.currentUser ? "dashboard" : "auth");
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

  // Google Sign-In / Register Handler
  document.getElementById("btn-google-login")?.addEventListener("click", async () => {
    sound.click();
    
    // Jika live Supabase OAuth aktif dan bisa redirect, coba terlebih dahulu
    if (isUsingLiveSupabase()) {
      try {
        const res = await signInWithGoogle({ role: selectedRole });
        if (res && res.isRedirecting) return;
      } catch (err) {
        // Jika provider belum aktif di dashboard, lanjutkan ke modal Google Quick Sign-in mandiri
        console.log("Supabase OAuth redirect tidak aktif, membuka Google Quick Sign-In:", err);
      }
    }

    // Tampilkan formulir Google Quick Sign-In interaktif
    showGoogleAccountPromptModal(selectedRole);
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
          role: selectedRole,
          className,
          teacherCode
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

  document.getElementById("btn-dash-minigame")?.addEventListener("click", launchGameWithFullscreen);
  document.getElementById("btn-dash-cisco")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-tool-minigame")?.addEventListener("click", launchGameWithFullscreen);
  document.getElementById("btn-hero-continue")?.addEventListener("click", () => {
    if (activeMod) {
      openMaterialModal(activeMod.id);
    } else {
      navigateTo("materials");
    }
  });
  document.getElementById("btn-hero-lab")?.addEventListener("click", () => navigateTo("simulation"));
  document.getElementById("btn-hero-lab-secondary")?.addEventListener("click", () => navigateTo("simulation"));
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
function renderMaterials(container) {
  const isId = getLang() === "id";

  const modSvgMap = {
    1: "assets/images/materials/mod1_network_scopes.svg",
    2: "assets/images/materials/mod2_topologies.svg",
    3: "assets/images/materials/mod3_osi_layers.svg",
    4: "assets/images/materials/mod4_subnetting_structure.svg",
    5: "assets/images/materials/mod5_hardware_media.svg",
    6: "assets/images/materials/mod6_dns_dhcp_dora.svg"
  };

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
        ${MATERIALS.map(m => {
          const isRead = state.userStats.readMaterials.includes(m.id);
          const isWatched = state.userStats.watchedVideos.includes(m.id);
          const svgPath = modSvgMap[m.id] || modSvgMap[1];

          return `
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xs flex flex-col justify-between overflow-hidden hover:shadow-md hover:border-primary/50 transition-all duration-200">
              <!-- Visual Architectural Schematic Banner -->
              <div class="bg-[#0b1325] h-36 border-b border-outline-variant p-3 flex items-center justify-center relative overflow-hidden group">
                <img src="${svgPath}" alt="${isId ? m.title_id : m.title_en}" class="h-full w-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                <span class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs border border-white/10">
                  MOD-0${m.id}
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
                    <span class="${isWatched ? "text-secondary font-semibold" : ""}">${isWatched ? (isId ? "✓ Sudah Ditonton" : "✓ Watched") : m.video.duration}</span>
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
    let fullHtml = `<h1>Silabus Lengkap Jaringan Komputer</h1>`;
    MATERIALS.forEach(m => {
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
    <div class="max-w-7xl mx-auto space-y-6 w-full">
      
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

        <div class="flex items-center gap-2 shrink-0">
          <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div class="text-left font-mono">
              <span class="text-[10px] text-outline uppercase block">${isId ? "Status Lab" : "Lab Status"}</span>
              <span class="text-xs font-bold text-emerald-400 flex items-center gap-1">
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
  if (type && type.startsWith("topic-")) {
    const topicId = parseInt(type.replace("topic-", ""), 10);
    return HOTS_QUESTIONS.filter(q => q.topic === topicId);
  }
  return HOTS_QUESTIONS;
}

function getTestMeta(type, isId) {
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

    </div>
  `;

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
            <span>Cohort Analytics</span>
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
          <span class="text-xs font-mono text-secondary font-bold">Status: Online</span>
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
    exportToCsv("Rekapitulasi_Nilai_Siswa", studentResults);
    showToast(isId ? "Nilai Berhasil Diekspor" : "Gradebook Exported", isId ? "File CSV rekapitulasi telah diunduh." : "CSV gradebook downloaded.", "table_chart");
  });
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

      // Jika identitas (kelas atau nama) belum lengkap, langsung buka modal identitas
      if (loggedUser.needsProfileCompletion || (loggedUser.role === "student" && (!loggedUser.className || loggedUser.className.trim() === ""))) {
        showStudentProfileModal(loggedUser);
      } else {
        const targetView = (state.currentUser.role === "teacher" || state.currentUser.user?.user_metadata?.role === "teacher") ? "admin" : "dashboard";
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

