// NetQuest - Gamification Engine & Web Audio Synthesizer

export const BADGES = [
  {
    id: "first_step",
    name_id: "Langkah Pertama",
    name_en: "First Step",
    desc_id: "Menyelesaikan Pretest 25 soal cerita HOTS untuk pertama kalinya.",
    desc_en: "Complete the initial 25-question HOTS Pretest.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>`,
    color: "#0284c7"
  },
  {
    id: "avid_reader",
    name_id: "Kolektor Modul",
    name_en: "Avid Reader",
    desc_id: "Membaca dan menuntaskan seluruh 6 modul materi jaringan.",
    desc_en: "Read and finish all 6 networking study modules.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
    color: "#7c3aed"
  },
  {
    id: "video_viewer",
    name_id: "Pembelajar Visual",
    name_en: "Visual Learner",
    desc_id: "Menonton video pembelajaran jaringan pilihan guru.",
    desc_en: "Watch curated video lessons selected by the teacher.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
    color: "#d97706"
  },
  {
    id: "subnet_wizard",
    name_id: "Pakar Subnetting",
    name_en: "Subnet Specialist",
    desc_id: "Menjawab benar minimal 3 soal pada topik IP Address & Subnetting.",
    desc_en: "Answer at least 3 questions correctly in IP Addressing & Subnetting.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`,
    color: "#059669"
  },
  {
    id: "osi_master",
    name_id: "Master Model OSI",
    name_en: "OSI Model Master",
    desc_id: "Menjawab benar minimal 3 soal pada topik Model OSI & TCP/IP.",
    desc_en: "Answer at least 3 questions correctly in the OSI & TCP/IP topic.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    color: "#2563eb"
  },
  {
    id: "posttest_champ",
    name_id: "Juara Posttest",
    name_en: "Posttest Champion",
    desc_id: "Menyelesaikan evaluasi akhir Posttest dengan nilai memuaskan.",
    desc_en: "Complete the final Posttest evaluation with flying colors.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`,
    color: "#eab308"
  },
  {
    id: "growth_master",
    name_id: "Peningkatan Positif",
    name_en: "Positive Growth",
    desc_id: "Mencapai peningkatan skor positif (Gain) dari Pretest ke Posttest.",
    desc_en: "Achieve a positive score gain between Pretest and Posttest.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
    color: "#db2777"
  },
  {
    id: "grandmaster",
    name_id: "Net Grandmaster",
    name_en: "Net Grandmaster",
    desc_id: "Mencapai Level 6 dan mengumpulkan lebih dari 1.800 XP.",
    desc_en: "Reach Level 6 and amass over 1,800 XP in NetQuest.",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    color: "#dc2626"
  }
];

export const LEVELS = [
  { level: 1, minXp: 0, maxXp: 150, title_id: "Tingkat Pemula", title_en: "Novice Explorer", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 8 8 12 12 16 16 12 12 8"></polygon></svg>` },
  { level: 2, minXp: 151, maxXp: 400, title_id: "Tingkat Perute", title_en: "Packet Router", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"></rect><rect x="2" y="14" width="20" height="8" rx="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>` },
  { level: 3, minXp: 401, maxXp: 750, title_id: "Spesialis Subnet", title_en: "Subnet Specialist", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line></svg>` },
  { level: 4, minXp: 751, maxXp: 1200, title_id: "Arsitek Jaringan", title_en: "Network Architect", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>` },
  { level: 5, minXp: 1201, maxXp: 1800, title_id: "Pengawas Siber", title_en: "Cyber Sentinel", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>` },
  { level: 6, minXp: 1801, maxXp: 99999, title_id: "NetQuest Grandmaster", title_en: "NetQuest Grandmaster", icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` }
];

export function calculateLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      const cur = LEVELS[i];
      const next = LEVELS[i + 1] || cur;
      const progress = next.maxXp === cur.maxXp ? 100 : Math.min(100, Math.round(((xp - cur.minXp) / (cur.maxXp - cur.minXp)) * 100));
      return {
        ...cur,
        progress,
        xpToNext: Math.max(0, cur.maxXp - xp + 1)
      };
    }
  }
  return { ...LEVELS[0], progress: 0, xpToNext: LEVELS[0].maxXp };
}

// ----------------------------------------------------
// Web Audio API Synthesizer (Zero External Dependencies)
// ----------------------------------------------------
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTone(freq, type = "sine", duration = 0.15, gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy handled gracefully
    }
  }

  click() {
    this.playTone(800, "sine", 0.05, 0.05);
  }

  correct() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, "triangle", 0.2, 0.08);
        }, idx * 70);
      });
    } catch {}
  }

  incorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      [311.13, 261.63].forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, "sawtooth", 0.25, 0.06);
        }, idx * 120);
      });
    } catch {}
  }

  badge() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, "triangle", 0.35, 0.09);
        }, idx * 90);
      });
    } catch {}
  }

  levelUp() {
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, "sine", 0.4, 0.1);
        }, idx * 80);
      });
    } catch {}
  }
}

export const sound = new SoundFX();
