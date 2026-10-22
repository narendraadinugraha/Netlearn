// NetLearn - Internationalization (i18n) Engine (ID / EN)
// Mendukung dwibahasa penuh dengan Bahasa Indonesia sebagai bahasa utama

export const translations = {
  id: {
    // Branding & Header
    appTitle: "NetLearn",
    appSubtitle: "Akademi Jaringan Komputer CS302",
    tagline: "Platform Media Belajar Interaktif & Laboratorium Jaringan Komputer Akademik",
    roleStudent: "Siswa / Mahasiswa",
    roleTeacher: "Guru / Dosen (Admin)",
    navHome: "Dashboard",
    navPretest: "Pretest Diagnostik",
    navMaterials: "Modul & Materi",
    navSimulation: "Lab Simulasi & VLSM",
    navPosttest: "Posttest HOTS",
    navQuizzes: "Kuis & Bank Soal",
    navManual: "Buku Panduan & RFC",
    navAdmin: "Panel Guru",
    navSettings: "Profil & Pengaturan",
    navLogout: "Keluar Akun",
    navLogin: "Masuk / Daftar",
    sidebarCollapse: "Kecilkan Menu",
    sidebarExpand: "Perluas Menu",
    
    // Auth
    loginTitle: "Masuk ke NetLearn",
    loginDesc: "Akses portal pembelajaran CS302 untuk melanjutkan modul teori dan praktikum simulasi",
    registerTitle: "Pendaftaran Akun Baru",
    registerDesc: "Daftar untuk terhubung dengan kelas Jaringan Komputer dan laboratorium virtual",
    googleSignIn: "Masuk dengan Akun Google",
    orDivider: "atau dengan email institusi",
    emailLabel: "Alamat Email Institusi / Siswa",
    passwordLabel: "Kata Sandi",
    nameLabel: "Nama Lengkap Siswa / Pengajar",
    studentIdLabel: "Nomor Induk Siswa / Mahasiswa (NISN / NIM)",
    roleLabel: "Peran Pengguna",
    roleStudentTab: "Portal Siswa",
    roleTeacherTab: "Guru / Instruktur",
    teacherCodeLabel: "Kode Verifikasi Pengajar",
    teacherCodeHint: "Masukkan kode guru (Default: GURU2026)",
    btnSignIn: "Masuk ke NetLearn",
    btnRegister: "Buat Akun NetLearn",
    noAccount: "Belum punya akun? Daftar di sini",
    haveAccount: "Sudah punya akun? Masuk di sini",
    demoAccountNotice: "Tersedia akses instan akun demo untuk Siswa dan Guru.",
    
    // Gamification & HUD
    levelLabel: "Level",
    xpLabel: "XP",
    nextLevelLabel: "XP Menuju Level Berikutnya",
    badgeLabel: "Lencana",
    rankNovice: "Novice Engineer",
    rankRouter: "Packet Router",
    rankSubnetter: "Subnet Specialist",
    rankArchitect: "Network Architect",
    rankSentinel: "Cyber Sentinel",
    rankMaster: "NetLearn Grandmaster",
    
    // Dashboard
    dashWelcome: "Portal Akademik CS302",
    dashSummary: "Jaringan Komputer • Semester Genap 2025/2026",
    statPreScore: "Skor Pretest",
    statPostScore: "Skor Posttest",
    statProgress: "Peningkatan Nilai",
    statMaterialsRead: "Modul Selesai",
    statVideosWatched: "Lab Praktikum",
    recentActivity: "Riwayat Aktivitas & Telemetri",
    badgeCollection: "Koleksi Lencana Akademik",
    unlockedOn: "Dibuka pada",
    lockedBadge: "Terkunci - Selesaikan skenario lab untuk membuka",
    btnStartPretest: "Mulai Pretest Diagnostik",
    btnStudyMaterials: "Buka Silabus Modul 01-06",
    btnStartPosttest: "Mulai Ujian Akhir Posttest",
    
    // Pretest & Posttest
    testPreTitle: "Pretest Diagnostik Awal (25 Kasus HOTS)",
    testPostTitle: "Ujian Posttest Akhir (25 Kasus HOTS)",
    testNotice: "Ujian proctored berbasis studi kasus dunia nyata: subnetting CIDR/VLSM, routing OSPF/RIP, dan pemecahan masalah jaringan. Waktu: 35 menit.",
    questionCount: "Soal",
    of: "dari",
    timeElapsed: "Sisa Waktu",
    instantFeedback: "Umpan Balik Diagnostik",
    btnSubmitAnswer: "Simpan Jawaban",
    btnNextQuestion: "Soal Berikutnya",
    btnPrevQuestion: "Soal Sebelumnya",
    btnFinishTest: "Kirim & Selesaikan Ujian",
    testCompleteTitle: "Ujian Selesai Dilaksanakan!",
    yourScore: "Nilai Akhir Evaluasi",
    correctAnswers: "Jawaban Benar",
    wrongAnswers: "Jawaban Salah",
    xpEarned: "XP Diperoleh",
    btnReviewAnswers: "Tinjau Seluruh Soal",
    btnBackHome: "Kembali ke Dashboard",
    testAlreadyDonePre: "Pretest Diagnostik telah selesai. Silakan pelajari materi dan coba simulasi!",
    testAlreadyDonePost: "Ujian Posttest telah diselesaikan. Lihat analisis perolehan gain Hake dan diagnostik kognitif di bawah.",

    // Materials & Embedded Videos
    materialsTitle: "Materi Pembelajaran & Modul Praktikum",
    materialsSubtitle: "Silabus komprehensif Jaringan Komputer standar Cisco Packet Tracer dan RFC IETF.",
    btnDownloadDoc: "Unduh Modul (.doc Word)",
    btnDownloadAllDocs: "Unduh Semua Modul (6 Topik)",
    markAsRead: "Tandai Modul Selesai (+50 XP)",
    topicReadStatus: "Selesai Dipelajari",
    topicNotReadStatus: "Belum Selesai",
    tabVideoLesson: "🎬 Video Kuliah",
    tabTheoryDoc: "📖 Modul Teori & Standar RFC",
    tabInteractiveLab: "🔬 Lab Interaktif & Simulator",
    videoKeyTakeaways: "Poin-Poin Penting Video",
    markVideoWatched: "Tandai Selesai Menonton (+30 XP)",
    videoWatchedStatus: "Telah Ditonton",
    btnManageTopicVideo: "Kelola Video Materi",
    topicVideoSavedToast: "Video materi berhasil diperbarui!",
    btnWatchTopicVideo: "Tonton Video Materi",

    // Manual Book
    manualTitle: "Buku Panduan Platform & Spesifikasi RFC",
    manualSubtitle: "Buku pegangan kurikulum resmi, panduan simulator terminal, dan referensi protokol standar.",
    btnDownloadManual: "Unduh Panduan (.doc)",

    // Admin Panel
    adminTitle: "Panel Guru & Evaluasi Nilai Kohort",
    adminSubtitle: "Distribusi histogram nilai siswa, analisis gain psikometrik Hake, dan rekapitulasi nilai.",
    tabStudents: "Rekapitulasi Nilai Siswa",
    tabVideos: "Kelola Video Pembelajaran",
    tabSql: "Skrip Database Supabase",
    studentName: "Nama Siswa",
    studentEmail: "Email Siswa",
    pretestScore: "Pretest (/25)",
    posttestScore: "Posttest (/25)",
    scoreGain: "Gain (Hake g)",
    completionDate: "Waktu Penyelesaian",
    btnExportCsv: "Ekspor Nilai ke CSV / Excel",
    btnAddVideo: "Tambah Video Baru",
    videoTitleField: "Judul Video Kuliah",
    videoUrlField: "URL YouTube",
    videoTopicField: "Topik Modul",
    btnSaveVideo: "Simpan Video",
    btnDeleteVideo: "Hapus",

    // Supabase Settings Modal
    settingsTitle: "Konfigurasi Basis Data Supabase Cloud",
    settingsDesc: "Masukkan Supabase URL dan Anon Public Key untuk sinkronisasi nilai dan data.",
    sbUrlLabel: "Supabase Project URL (SB_URL)",
    sbKeyLabel: "Supabase Anon Public Key (SB_KEY)",
    teacherCodeCfgLabel: "Kode Rahasia Guru (TEACHER_CODE)",
    btnSaveSettings: "Simpan & Hubungkan",
    connectedStatus: "Terhubung ke Supabase Cloud",
    demoStatus: "Mode Demo Mandiri (LocalStorage)",

    // Toasts & Messages
    toastCorrect: "Luar biasa! Jawaban Anda tepat.",
    toastIncorrect: "Belum tepat. Cermati penjelasan teknis berikut.",
    toastBadgeUnlocked: "Lencana Baru Terbuka:",
    toastLevelUp: "Selamat! Level Anda meningkat ke",
    toastSaved: "Data berhasil disimpan!",
    toastError: "Terjadi kesalahan, periksa masukan Anda.",
    toastAccessDenied: "Akses Dibatasi: Menu Panel Guru hanya untuk Pengguna dengan Peran Guru/Admin."
  },

  en: {
    // Branding & Header
    appTitle: "NetLearn",
    appSubtitle: "Networks Academy CS302",
    tagline: "Academic Computer Networks Learning Platform & Virtual Laboratory",
    roleStudent: "Student",
    roleTeacher: "Instructor (Admin)",
    navHome: "Dashboard",
    navPretest: "Diagnostic Pretest",
    navMaterials: "Materials & Modules",
    navSimulation: "Simulation Lab & VLSM",
    navPosttest: "HOTS Posttest",
    navQuizzes: "Quizzes & Bank",
    navManual: "RFC Docs & Specs",
    navAdmin: "Teacher Panel",
    navSettings: "Settings & Profile",
    navLogout: "Sign Out",
    navLogin: "Sign In / Register",
    sidebarCollapse: "Collapse Sidebar",
    sidebarExpand: "Expand Sidebar",

    // Auth
    loginTitle: "Sign In to NetLearn",
    loginDesc: "Access the CS302 student portal to continue coursework and sandbox sessions",
    registerTitle: "Create NetLearn Account",
    registerDesc: "Join your university Computer Networks cohort and virtual topology lab",
    googleSignIn: "Sign in with Google",
    orDivider: "or with institutional email",
    emailLabel: "University Email Address",
    passwordLabel: "Password",
    nameLabel: "Full Name",
    studentIdLabel: "Student Identification Number (ID / NIM)",
    roleLabel: "Academic Role",
    roleStudentTab: "Student Portal",
    roleTeacherTab: "Instructor / TA",
    teacherCodeLabel: "Instructor Verification Code",
    teacherCodeHint: "Enter instructor code (Demo: GURU2026)",
    btnSignIn: "Sign In to NetLearn",
    btnRegister: "Create Account",
    noAccount: "New here? Register an account",
    haveAccount: "Already registered? Sign in here",
    demoAccountNotice: "Quick demo credentials available for Student & Instructor.",

    // Gamification & HUD
    levelLabel: "Level",
    xpLabel: "XP",
    nextLevelLabel: "XP to Next Level",
    badgeLabel: "Badges",
    rankNovice: "Novice Engineer",
    rankRouter: "Packet Router",
    rankSubnetter: "Subnet Specialist",
    rankArchitect: "Network Architect",
    rankSentinel: "Cyber Sentinel",
    rankMaster: "NetLearn Grandmaster",

    // Dashboard
    dashWelcome: "Academic Portal CS302",
    dashSummary: "Computer Networks • Cohort Spring 2025",
    statPreScore: "Pretest Benchmark",
    statPostScore: "Posttest Score",
    statProgress: "Benchmark Delta",
    statMaterialsRead: "Modules Mastery",
    statVideosWatched: "Labs Completed",
    recentActivity: "Telemetry Activity & Log",
    badgeCollection: "Academic Badge Credential",
    unlockedOn: "Unlocked on",
    lockedBadge: "Locked - Complete lab scenarios to earn",
    btnStartPretest: "Launch Diagnostic Pretest",
    btnStudyMaterials: "Explore Course Modules 01-06",
    btnStartPosttest: "Take HOTS Posttest Exam",

    // Pretest & Posttest
    testPreTitle: "Diagnostic Pretest (25 HOTS Case Scenarios)",
    testPostTitle: "HOTS Posttest Examination (25 HOTS Case Scenarios)",
    testNotice: "Proctored assessment covering CIDR/VLSM subnetting, OSPF routing topologies, and OSI protocol troubleshooting. Time limit: 35 minutes.",
    questionCount: "Question",
    of: "of",
    timeElapsed: "Time Remaining",
    instantFeedback: "Diagnostic Telemetry Feedback",
    btnSubmitAnswer: "Confirm & Next",
    btnNextQuestion: "Next Question",
    btnPrevQuestion: "Previous Question",
    btnFinishTest: "Submit Final Exam",
    testCompleteTitle: "Examination Completed!",
    yourScore: "Final Evaluation Grade",
    correctAnswers: "Correct Items",
    wrongAnswers: "Incorrect Items",
    xpEarned: "XP Earned",
    btnReviewAnswers: "Review Question Diagnostic",
    btnBackHome: "Back to Dashboard",
    testAlreadyDonePre: "Diagnostic pretest completed. Proceed to study curriculum modules!",
    testAlreadyDonePost: "HOTS posttest submitted! View your normalized gain and diagnostics below.",

    // Materials & Embedded Videos
    materialsTitle: "Course Materials & Technical Modules",
    materialsSubtitle: "Comprehensive CS302 curriculum aligned with IETF RFC standards and Cisco Packet Tracer.",
    btnDownloadDoc: "Export Module (.doc Word)",
    btnDownloadAllDocs: "Export Full Syllabus (6 Modules)",
    markAsRead: "Mark Module Complete (+50 XP)",
    topicReadStatus: "Completed",
    topicNotReadStatus: "Not Started",
    tabVideoLesson: "🎬 Video Lectures",
    tabTheoryDoc: "📖 Technical Syllabus & RFCs",
    tabInteractiveLab: "🔬 Interactive Sandbox & Labs",
    videoKeyTakeaways: "Key Lecture Takeaways",
    markVideoWatched: "Mark Video Watched (+30 XP)",
    videoWatchedStatus: "Watched",
    btnManageTopicVideo: "Manage Lecture Video",
    topicVideoSavedToast: "Course video updated successfully!",
    btnWatchTopicVideo: "Watch Lecture Video",

    // Manual Book
    manualTitle: "Platform Documentation & RFC Specs",
    manualSubtitle: "Official academic curriculum handbook, VT-100 CLI guides, and protocol RFC references.",
    btnDownloadManual: "Download Handbook (.doc)",

    // Admin Panel
    adminTitle: "Teacher Console & Question Review",
    adminSubtitle: "Cohort score distribution histogram, Hake normalized gain analytics, and gradebook exports.",
    tabStudents: "Cohort Gradebook",
    tabVideos: "Manage Video Lectures",
    tabSql: "Supabase Schema SQL",
    studentName: "Student Name",
    studentEmail: "Email",
    pretestScore: "Pretest (/25)",
    posttestScore: "Posttest (/25)",
    scoreGain: "Gain (Hake g)",
    completionDate: "Completion Timestamp",
    btnExportCsv: "Export CSV Gradebook",
    btnAddVideo: "Add New Lecture Video",
    videoTitleField: "Lecture Title",
    videoUrlField: "YouTube URL",
    videoTopicField: "Curriculum Module",
    btnSaveVideo: "Save Video",
    btnDeleteVideo: "Delete",

    // Supabase Settings Modal
    settingsTitle: "Supabase Cloud Database Settings",
    settingsDesc: "Enter your Supabase Project URL and Anon Public Key to synchronize data.",
    sbUrlLabel: "Supabase Project URL (SB_URL)",
    sbKeyLabel: "Supabase Anon Public Key (SB_KEY)",
    teacherCodeCfgLabel: "Instructor Passcode (TEACHER_CODE)",
    btnSaveSettings: "Save & Reconnect",
    connectedStatus: "Connected to Supabase Cloud",
    demoStatus: "Standalone Demo Mode (LocalStorage)",

    // Toasts & Messages
    toastCorrect: "Excellent! Your technical analysis is correct.",
    toastIncorrect: "Incorrect. Review the technical explanation below.",
    toastBadgeUnlocked: "New Badge Unlocked:",
    toastLevelUp: "Level Up! Congratulations on reaching Level",
    toastSaved: "Data saved successfully!",
    toastError: "An error occurred, please verify your inputs.",
    toastAccessDenied: "Access Restricted: The Teacher Panel is only accessible to Teacher/Admin accounts."
  }
};

let currentLang = localStorage.getItem("netlearn_lang") || "id";

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem("netlearn_lang", lang);
    applyI18nToDOM();
  }
}

export function t(key) {
  return translations[currentLang]?.[key] || translations["id"]?.[key] || translations["en"]?.[key] || key;
}

export function applyI18nToDOM() {
  document.querySelectorAll(".i18n-text").forEach(el => {
    const key = el.dataset.i18n;
    if (key && translations[currentLang]?.[key]) {
      el.textContent = translations[currentLang][key];
    }
  });

  const langLabel = document.getElementById("current-lang-label");
  if (langLabel) {
    langLabel.textContent = currentLang.toUpperCase();
  }
}
