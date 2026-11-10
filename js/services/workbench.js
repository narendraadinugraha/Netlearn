// NetQuest - Interactive Virtual Network Lab (Visual, Ramah Pemula, Sangat Mudah Dipahami)
// Menggabungkan kesederhanaan Cisco Packet Tracer, kejelasan Brilliant.org, dan kebersihan Stripe UI

import { sound } from "./gamification.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderUnifiedWorkbench(container) {
  // State Laboratorium Interaktif
  const state = {
    moduleName: "Simulasi Pengiriman Data & Perutean Jaringan",
    activeTab: "visual", // "visual" | "terminal"
    cableCut: false,
    concentratorType: "switch", // "switch" | "hub"
    selectedNodeId: "hostA",
    packetAnim: null,
    lastResult: null,
    stepDone: {
      ping: false,
      cut: false,
      restore: false,
      hub: false
    },
    // Perangkat Jaringan (Disajikan dengan jelas dan ramah pemula)
    nodes: {
      hostA: {
        id: "hostA",
        name: "Laptop Siswa",
        role: "Komputer Pengirim (Klien)",
        ip: "192.168.1.10",
        mac: "00:AA:11:22:33:01",
        x: 90,
        y: 165,
        type: "host",
        desc: "Laptop yang Anda gunakan di lab sekolah untuk mengirim data ke server."
      },
      switch01: {
        id: "switch01",
        name: "Switch Ruangan",
        role: "Penghubung Kabel Lokal (L2)",
        ip: "192.168.1.2",
        mac: "00:SW:99:88:77:01",
        x: 250,
        y: 165,
        type: "switch",
        desc: "Perangkat cerdas yang meneruskan data langsung ke port kabel tujuan."
      },
      routerCore: {
        id: "routerCore",
        name: "Router Gateway",
        role: "Gerbang ke Internet (L3)",
        ip: "192.168.1.1",
        mac: "00:RT:55:44:33:01",
        x: 410,
        y: 165,
        type: "router",
        desc: "Jembatan yang menghubungkan jaringan lokal sekolah dengan jaringan internet luar."
      },
      serverB: {
        id: "serverB",
        name: "Server Web Target",
        role: "Komputer Tujuan (Server)",
        ip: "10.10.20.50",
        mac: "00:BB:44:55:66:02",
        x: 570,
        y: 165,
        type: "server",
        desc: "Pusat server website yang memproses permintaan dan mengirim balasan data."
      }
    },
    // Riwayat Terminal Sederhana
    terminalHistory: [
      "NetLearn Terminal Konsol v3.2",
      "Koneksi: Laptop Siswa (192.168.1.10) -> Server Target (10.10.20.50)",
      "Ketik 'ping 10.10.20.50' atau 'help' untuk mencoba perintah."
    ]
  };

  // Evaluasi Logika Pengiriman Pesan
  function evaluatePing() {
    if (state.cableCut) {
      return {
        success: false,
        statusTitle: "❌ PENGIRIMAN GAGAL: KABEL TERPUTUS",
        message: "Paket data tidak dapat terkirim karena kabel fisik antara Laptop Siswa dan Switch terputus. Sinyal listrik terhenti sehingga tidak ada data yang sampai ke router.",
        reason: "Kabel Putus (Physical Link Down)",
        solution: "Klik tombol 'Sambungkan Kabel' untuk memperbaiki koneksi fisik."
      };
    }

    const isHub = state.concentratorType === "hub";
    if (isHub) {
      return {
        success: true,
        isHub: true,
        statusTitle: "⚠️ PESAN TERKIRIM DENGAN HUB (BOROS DATA)",
        message: "Pesan berhasil sampai ke Server, namun Hub lama menyebarkan (broadcast) salinan data ke semua kabel sekaligus. Ini memboroskan bandwidth dan rawan tabrakan data (collision).",
        reason: "Hub membroadcast data tanpa filter alamat",
        solution: "Sebaiknya gunakan Switch cerdas agar data hanya dikirim ke kabel tujuan."
      };
    }

    return {
      success: true,
      isHub: false,
      statusTitle: "✅ PESAN BERHASIL SAMPAI (100% SUKSES)",
      message: "Luar biasa! Laptop Siswa mengirim pesan ping ke Server (10.10.20.50). Switch meneruskan ke Router Gateway (192.168.1.1), lalu Router mengantarkan pesan sampai ke Server dan menerima balasan sukses dalam 0.82 ms.",
      reason: "Rute Terbuka & Semua Perangkat Aktif",
      solution: "Jaringan beroperasi dengan sempurna."
    };
  }

  // Animasi Jalannya Paket
  function triggerPing() {
    sound.click();
    const result = evaluatePing();
    state.lastResult = result;

    if (result.success) {
      sound.success();
      state.stepDone.ping = true;
      if (result.isHub) state.stepDone.hub = true;
    } else {
      sound.fail();
      state.stepDone.cut = true;
    }

    state.packetAnim = {
      progress: 0,
      isSuccess: result.success,
      isHub: result.isHub
    };

    render();
  }

  // Eksekusi CLI Terminal
  function runCommand(cmdStr) {
    state.terminalHistory.push(`siswa@laptop:~# ${cmdStr}`);
    const parts = cmdStr.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();

    if (cmd === "help") {
      state.terminalHistory.push(
        "Perintah yang dapat Anda coba:",
        "  ping 10.10.20.50   - Kirim pesan uji coba ke server target",
        "  ip route           - Lihat gerbang default gateway (192.168.1.1)",
        "  arp -a             - Lihat daftar alamat MAC perangkat yang dikenal",
        "  clear              - Bersihkan layar terminal"
      );
    } else if (cmd === "ping") {
      state.terminalHistory.push("Mengirim 4 paket ICMP Echo ke 10.10.20.50...");
      triggerPing();
      const res = state.lastResult;
      if (res && res.success) {
        state.terminalHistory.push(
          "Balasan dari 10.10.20.50: bytes=32 time=0.82ms TTL=63",
          "Balasan dari 10.10.20.50: bytes=32 time=0.79ms TTL=63",
          "Hasil: 4 paket terkirim, 4 diterima, 0% packet loss (Koneksi Sempurna)"
        );
      } else {
        state.terminalHistory.push(
          "Dari 192.168.1.10: Destination Host Unreachable",
          "Hasil: 4 paket terkirim, 0 diterima, 100% packet loss (Kabel Terputus)"
        );
      }
    } else if (cmd === "ip") {
      state.terminalHistory.push(
        "default via 192.168.1.1 dev eth0 (Router Gateway)",
        "192.168.1.0/24 dev eth0 link lokal (Jaringan Sekolah)"
      );
    } else if (cmd === "arp") {
      state.terminalHistory.push(
        "? (192.168.1.1) pada 00:RT:55:44:33:01 [ether] di eth0",
        "? (192.168.1.2) pada 00:SW:99:88:77:01 [ether] di eth0"
      );
    } else if (cmd === "clear") {
      state.terminalHistory = [];
    } else {
      state.terminalHistory.push(`Perintah '${cmd}' tidak dikenal. Ketik 'ping 10.10.20.50' atau 'help'.`);
    }

    render();
  }

  // Render Tampilan Utama
  function render() {
    const res = state.lastResult;
    const selNode = state.nodes[state.selectedNodeId] || state.nodes.hostA;

    container.innerHTML = `
      <div class="w-full space-y-5">
        
        <!-- Header Banner: Bersih, Jelas, & Mengedukasi -->
        <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Simulator Interaktif
              </span>
              <span class="text-xs text-slate-500 font-medium">Topologi Jaringan Nyata</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              ${state.moduleName}
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Pelajari bagaimana data bergerak dari komputer Anda menuju server di internet. Klik tombol di bawah untuk mengirim pesan, menguji kabel rusak, atau membandingkan perangkat.
            </p>
          </div>

          <!-- Mode Switcher Tabs (Visual vs Terminal) -->
          <div class="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 self-start md:self-center">
            <button class="taste-btn px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              state.activeTab === 'visual' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }" id="tab-visual-btn">
              <span class="material-symbols-outlined text-[17px]">hub</span>
              <span>Mode Visual (Mudah)</span>
            </button>
            <button class="taste-btn px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
              state.activeTab === 'terminal' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }" id="tab-terminal-btn">
              <span class="material-symbols-outlined text-[17px]">terminal</span>
              <span>Mode Terminal (CLI)</span>
            </button>
          </div>
        </div>

        <!-- AREA 1: VISUAL SIMULATOR (Pilihan Utama - Sangat Ramah Pemula) -->
        ${state.activeTab === "visual" ? `
          <div class="space-y-5">
            
            <!-- KANVAS INTERAKTIF & TOMBOL TINDAKAN -->
            <div class="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              
              <!-- Toolbar Kontrol Eksperimen -->
              <div class="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full ${state.cableCut ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}"></span>
                  <span class="text-xs font-bold text-slate-800">
                    Status Kabel: ${state.cableCut ? '<span class="text-rose-600">TERPUTUS (Ada Masalah)</span>' : '<span class="text-emerald-700">TERSAMBUNG (Normal)</span>'}
                  </span>
                </div>

                <!-- Tombol Aksi Cepat -->
                <div class="flex items-center gap-2 flex-wrap">
                  <button class="taste-btn px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all" id="btn-ping-action">
                    <span class="material-symbols-outlined text-[17px]">send</span>
                    <span>🚀 Kirim Pesan (Ping)</span>
                  </button>

                  <button class="taste-btn px-3.5 py-2 ${state.cableCut ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white hover:bg-slate-50 text-rose-700 border border-rose-200'} font-semibold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all" id="btn-toggle-cable">
                    <span class="material-symbols-outlined text-[17px]">${state.cableCut ? 'link' : 'link_off'}</span>
                    <span>${state.cableCut ? '🔌 Sambungkan Kabel' : '✂️ Cabut / Putuskan Kabel'}</span>
                  </button>

                  <button class="taste-btn px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all" id="btn-toggle-device">
                    <span class="material-symbols-outlined text-[17px] text-indigo-600">swap_horiz</span>
                    <span>Ganti: ${state.concentratorType === 'switch' ? 'Switch (Cerdas)' : 'Hub (Broadcast)'}</span>
                  </button>
                </div>
              </div>

              <!-- Canvas Grafis -->
              <div class="relative w-full bg-[#f8fafc] border-b border-slate-200" style="height: 330px;">
                <canvas id="simple-network-canvas" class="w-full h-full block cursor-pointer"></canvas>
                
                <!-- Petunjuk Interaksi di Kanvas -->
                <div class="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5 shadow-xs">
                  <span class="material-symbols-outlined text-[15px] text-indigo-600">touch_app</span>
                  <span>Klik pada perangkat mana saja untuk melihat fungsinya</span>
                </div>
              </div>

              <!-- Hasil Pengiriman Pesan (Status Penjelasan yang Jelas) -->
              <div class="p-4 sm:p-5 ${
                !res 
                  ? 'bg-slate-50 text-slate-600' 
                  : (res.success 
                      ? (res.isHub ? 'bg-amber-50 text-amber-900 border-t border-amber-200' : 'bg-emerald-50 text-emerald-950 border-t border-emerald-200') 
                      : 'bg-rose-50 text-rose-950 border-t border-rose-200')
              }">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full ${!res ? 'bg-indigo-100 text-indigo-600' : (res.success ? (res.isHub ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') : 'bg-rose-100 text-rose-700')} flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <span class="material-symbols-outlined text-[20px]">${!res ? 'info' : (res.success ? (res.isHub ? 'warning' : 'check_circle') : 'error')}</span>
                  </div>
                  <div class="space-y-1 flex-1">
                    <div class="font-bold text-sm">
                      ${res ? res.statusTitle : "Siap Mencoba Pengiriman Data"}
                    </div>
                    <p class="text-xs sm:text-sm leading-relaxed ${!res ? 'text-slate-600' : (res.success ? (res.isHub ? 'text-amber-800' : 'text-emerald-800') : 'text-rose-800')}">
                      ${res ? res.message : "Klik tombol biru <strong>'🚀 Kirim Pesan (Ping)'</strong> di atas untuk melihat bagaimana paket data meluncur dari Laptop melewati Switch dan Router hingga tiba di Server."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2 PANEL PENJELASAN RAMAH SISWA: DETAIL PERANGKAT & MISI -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              <!-- Kiri: Detail Perangkat yang Diklik (6 Kolom) -->
              <div class="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-indigo-600">devices</span>
                    <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Detail Perangkat Terpilih</h3>
                  </div>
                  <span class="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
                    ${selNode.name}
                  </span>
                </div>

                <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500 font-medium">Peran Perangkat:</span>
                    <span class="text-xs font-bold text-slate-900">${selNode.role}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500 font-medium">Alamat IP:</span>
                    <span class="text-xs font-mono font-bold text-indigo-600">${selNode.ip}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-500 font-medium">Alamat Fisik (MAC):</span>
                    <span class="text-xs font-mono text-slate-700">${selNode.mac}</span>
                  </div>
                </div>

                <div class="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  <strong class="text-slate-900 block mb-1">Penjelasan Sederhana:</strong>
                  ${selNode.desc}
                </div>
              </div>

              <!-- Kanan: Checklist Misi Praktik yang Menyenangkan (6 Kolom) -->
              <div class="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] text-emerald-600">checklist</span>
                    <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Misi Praktik Mandiri</h3>
                  </div>
                  <span class="text-[11px] text-slate-500 font-medium">
                    ${Object.values(state.stepDone).filter(Boolean).length}/4 Misi Selesai
                  </span>
                </div>

                <div class="space-y-2 text-xs">
                  <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 ${state.stepDone.ping ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[17px] ${state.stepDone.ping ? 'text-emerald-600' : 'text-slate-400'}">${state.stepDone.ping ? 'check_circle' : 'radio_button_unchecked'}</span>
                      <span>1. Kirim pesan ping saat kabel normal</span>
                    </div>
                    <span class="text-[10px] font-bold ${state.stepDone.ping ? 'text-emerald-700' : 'text-slate-400'}">${state.stepDone.ping ? 'Tuntas ✔' : 'Belum'}</span>
                  </div>

                  <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 ${state.stepDone.cut ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[17px] ${state.stepDone.cut ? 'text-emerald-600' : 'text-slate-400'}">${state.stepDone.cut ? 'check_circle' : 'radio_button_unchecked'}</span>
                      <span>2. Coba putuskan kabel dan lihat kegagalan</span>
                    </div>
                    <span class="text-[10px] font-bold ${state.stepDone.cut ? 'text-emerald-700' : 'text-slate-400'}">${state.stepDone.cut ? 'Tuntas ✔' : 'Belum'}</span>
                  </div>

                  <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 ${state.stepDone.hub ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-700'}">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[17px] ${state.stepDone.hub ? 'text-emerald-600' : 'text-slate-400'}">${state.stepDone.hub ? 'check_circle' : 'radio_button_unchecked'}</span>
                      <span>3. Bandingkan cara kerja Switch vs Hub</span>
                    </div>
                    <span class="text-[10px] font-bold ${state.stepDone.hub ? 'text-emerald-700' : 'text-slate-400'}">${state.stepDone.hub ? 'Tuntas ✔' : 'Belum'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <!-- AREA 2: TERMINAL TEKNIS (Bagi Siswa yang Ingin Mencoba Perintah Asli) -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div class="space-y-1">
              <h3 class="text-base font-bold text-slate-900">Konsol Terminal Interaktif</h3>
              <p class="text-xs text-slate-500">
                Ketik perintah langsung seperti pada sistem operasi Linux/Cisco. Anda dapat mengetik <code>ping 10.10.20.50</code> atau <code>help</code>.
              </p>
            </div>

            <!-- Kotak Hitam Terminal -->
            <div class="bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden font-mono text-xs shadow-md">
              <div class="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
                <div class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span class="text-[11px] text-slate-200 font-bold ml-1.5">Terminal Siswa: siswa@laptop:~#</span>
                </div>
                <div class="flex gap-1.5 text-[11px]">
                  <button class="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer" id="cli-ping-shortcut">ping</button>
                  <button class="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer" id="cli-route-shortcut">route</button>
                </div>
              </div>

              <!-- Layar Output Terminal -->
              <div id="cli-screen-output" class="p-4 text-slate-300 space-y-1 overflow-y-auto" style="min-height: 220px; max-height: 260px;">
                ${state.terminalHistory.map(line => `<div>${escapeHtml(line)}</div>`).join('')}
              </div>

              <!-- Form Input Terminal -->
              <form id="cli-input-form" class="p-2.5 border-t border-slate-800 flex items-center gap-2 bg-[#090e17]">
                <span class="text-emerald-400 font-bold shrink-0">siswa@laptop:~#</span>
                <input 
                  type="text" 
                  id="cli-input-box" 
                  class="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-slate-500" 
                  placeholder="Ketik ping 10.10.20.50 atau help..."
                  autocomplete="off"
                />
                <button type="submit" class="taste-btn px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold cursor-pointer transition-all">Kirim</button>
              </form>
            </div>
          </div>
        `}
      </div>
    `;

    setupEvents();
    if (state.activeTab === "visual") {
      initCanvas();
    }
  }

  // Setup Event Handlers
  function setupEvents() {
    // Tab Switcher
    container.querySelector("#tab-visual-btn")?.addEventListener("click", () => {
      sound.click();
      state.activeTab = "visual";
      render();
    });

    container.querySelector("#tab-terminal-btn")?.addEventListener("click", () => {
      sound.click();
      state.activeTab = "terminal";
      render();
    });

    // Tombol Kirim Pesan Ping
    container.querySelector("#btn-ping-action")?.addEventListener("click", () => {
      triggerPing();
    });

    // Tombol Putus/Sambung Kabel
    container.querySelector("#btn-toggle-cable")?.addEventListener("click", () => {
      sound.click();
      state.cableCut = !state.cableCut;
      state.lastResult = null;
      render();
    });

    // Tombol Ganti Switch / Hub
    container.querySelector("#btn-toggle-device")?.addEventListener("click", () => {
      sound.click();
      state.concentratorType = state.concentratorType === "switch" ? "hub" : "switch";
      state.lastResult = null;
      render();
    });

    // Terminal Events
    container.querySelector("#cli-ping-shortcut")?.addEventListener("click", () => {
      runCommand("ping 10.10.20.50");
    });
    container.querySelector("#cli-route-shortcut")?.addEventListener("click", () => {
      runCommand("ip route");
    });

    const termForm = container.querySelector("#cli-input-form");
    const termInput = container.querySelector("#cli-input-box");
    termForm?.addEventListener("submit", e => {
      e.preventDefault();
      const val = termInput?.value.trim();
      if (val) {
        runCommand(val);
        termInput.value = "";
      }
    });

    const termScreen = container.querySelector("#cli-screen-output");
    if (termScreen) termScreen.scrollTop = termScreen.scrollHeight;
  }

  // Inisialisasi Kanvas Visual Bersih & Ramah Pemula
  function initCanvas() {
    const canvas = container.querySelector("#simple-network-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    // Authentic Network Vector Assets
    const icons = {
      laptop: new Image(),
      switch: new Image(),
      router: new Image(),
      server: new Image(),
      packet: new Image(),
      cloud: new Image()
    };
    icons.laptop.src = "assets/images/icons/laptop.svg";
    icons.switch.src = "assets/images/icons/switch.svg";
    icons.router.src = "assets/images/icons/router.svg";
    icons.server.src = "assets/images/icons/server.svg";
    icons.packet.src = "assets/images/icons/packet.svg";
    icons.cloud.src = "assets/images/icons/cloud.svg";

    // Deteksi Klik pada Perangkat
    canvas.addEventListener("click", e => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const scaleX = width / 640;
      const scaleY = height / 330;

      Object.keys(state.nodes).forEach(id => {
        const node = state.nodes[id];
        const nx = node.x * scaleX;
        const ny = node.y * scaleY;
        if (Math.abs(clickX - nx) < 65 && Math.abs(clickY - ny) < 45) {
          sound.click();
          state.selectedNodeId = id;
          render();
        }
      });
    });

    let pulseT = 0;

    function draw() {
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;

      const scaleX = width / 640;
      const scaleY = height / 330;

      pulseT = (pulseT + 0.015) % 1;

      // 1. Latar Belakang Studio Jaringan
      ctx.fillStyle = "#0b1120"; // Dark slate studio
      ctx.fillRect(0, 0, width, height);

      // Blueprint Technical Grid
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      const dotGap = 24;
      for (let x = 12; x < width; x += dotGap) {
        for (let y = 12; y < height; y += dotGap) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const hA = state.nodes.hostA;
      const sw = state.nodes.switch01;
      const rt = state.nodes.routerCore;
      const sB = state.nodes.serverB;

      const xA = hA.x * scaleX;
      const yA = hA.y * scaleY;
      const xSw = sw.x * scaleX;
      const ySw = sw.y * scaleY;
      const xRt = rt.x * scaleX;
      const yRt = rt.y * scaleY;
      const xB = sB.x * scaleX;
      const yB = sB.y * scaleY;

      // 2. Garis Kabel Jaringan Autentik
      drawCableLine(ctx, xA, yA, xSw, ySw, state.cableCut, pulseT, "UTP Cat6 (1 Gbps)");
      drawCableLine(ctx, xSw, ySw, xRt, yRt, false, pulseT, "Trunk Uplink");
      drawCableLine(ctx, xRt, yRt, xB, yB, false, pulseT, "WAN Fiber Optik");

      // 3. Gambar Kartu Perangkat dengan Ikon Vektor Nyata
      drawDeviceCard(ctx, xA, yA, "Laptop Siswa", "192.168.1.10", state.selectedNodeId === "hostA", "#6366f1", "laptop");
      drawDeviceCard(ctx, xSw, ySw, state.concentratorType === "hub" ? "Hub Broadcast" : "Switch Ruangan", "192.168.1.2", state.selectedNodeId === "switch01", "#0284c7", "switch");
      drawDeviceCard(ctx, xRt, yRt, "Router Gateway", "192.168.1.1", state.selectedNodeId === "routerCore", "#6366f1", "router");
      drawDeviceCard(ctx, xB, yB, "Server Web", "10.10.20.50", state.selectedNodeId === "serverB", "#0284c7", "server");

      // 4. Animasi Amplop Paket Data
      if (state.packetAnim) {
        animatePacketFlight(ctx, xA, yA, xSw, ySw, xRt, yRt, xB, yB);
      }

      requestAnimationFrame(draw);
    }

    // Menggambar Garis Kabel Jaringan
    function drawCableLine(ctx, x1, y1, x2, y2, isCut, pOffset, label) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);

      if (isCut) {
        // Kabel Putus
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 3.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label Peringatan Putus
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        ctx.fillStyle = "#ef4444";
        roundRect(ctx, mx - 50, my - 13, 100, 26, 6);
        ctx.fill();

        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✂️ KABEL PUTUS", mx, my);
      } else {
        // Kabel Normal Tersambung
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.stroke();

        // RJ45 Connector Pins at terminations
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(x1 + 35, y1 - 3, 6, 6);
        ctx.fillRect(x2 - 41, y2 - 3, 6, 6);

        // Pulsa Aliran Data
        const px = x1 + (x2 - x1) * pOffset;
        const py = y1 + (y2 - y1) * pOffset;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Menggambar Kartu Perangkat dengan Ikon Vektor Nyata
    function drawDeviceCard(ctx, x, y, title, ip, isSelected, accentColor, iconKey) {
      const w = 126;
      const h = 88;
      const rx = x - w / 2;
      const ry = y - h / 2;

      // Bayangan Halus
      ctx.save();
      ctx.shadowColor = isSelected ? "rgba(56, 189, 248, 0.35)" : "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = isSelected ? 16 : 8;
      ctx.shadowOffsetY = 2;

      // Latar Belakang Kartu
      ctx.fillStyle = isSelected ? "#0f172a" : "#1e293b";
      roundRect(ctx, rx, ry, w, h, 12);
      ctx.fill();
      ctx.restore();

      // Border Kartu
      ctx.strokeStyle = isSelected ? "#38bdf8" : "#334155";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      roundRect(ctx, rx, ry, w, h, 12);
      ctx.stroke();

      // Lampu Indikator Hijau (Aktif)
      ctx.beginPath();
      ctx.arc(rx + 14, ry + 14, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e";
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Authentic SVG Icon
      const img = icons[iconKey];
      if (img && img.complete) {
        const iconSize = 32;
        ctx.drawImage(img, x - iconSize / 2, ry + 8, iconSize, iconSize);
      }

      // Judul Perangkat
      ctx.font = "bold 10px sans-serif";
      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.fillText(title, x, ry + 52);

      // Badge Alamat IP
      ctx.fillStyle = isSelected ? "rgba(56, 189, 248, 0.15)" : "#0f172a";
      roundRect(ctx, rx + 10, ry + 60, w - 20, 20, 6);
      ctx.fill();

      ctx.font = "bold 9px monospace";
      ctx.fillStyle = isSelected ? "#38bdf8" : "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText(ip, x, ry + 73);
    }

    // Animasi Perjalanan Amplop Surat (Paket Ping & Routing)
    function animatePacketFlight(ctx, xA, yA, xSw, ySw, xRt, yRt, xB, yB) {
      const p = state.packetAnim;
      p.progress += 0.018;

      let curX = xA;
      let curY = yA;

      if (state.cableCut) {
        // Terhenti di kabel yang putus
        const t = Math.min(p.progress * 3, 0.45);
        curX = xA + (xSw - xA) * t;
        curY = yA + (ySw - yA) * t;
        drawEnvelopeBadge(ctx, curX, curY, "❌ Link Down: Packet Dropped", "#ef4444");
        if (p.progress >= 0.6) state.packetAnim = null;
        return;
      }

      // Perjalanan 3 Tahap
      if (p.progress < 0.33) {
        const t = p.progress / 0.33;
        curX = xA + (xSw - xA) * t;
        curY = yA + (ySw - yA) * t;
        drawEnvelopeBadge(ctx, curX, curY, "✉️ L2 Frame -> Switch (CAM Lookup)", "#4f46e5");
      } else if (p.progress < 0.66) {
        const t = (p.progress - 0.33) / 0.33;
        curX = xSw + (xRt - xSw) * t;
        curY = ySw + (yRt - ySw) * t;
        drawEnvelopeBadge(ctx, curX, curY, "🌐 L3 Routing -> Gateway (TTL -1)", "#0284c7");
      } else {
        const t = (p.progress - 0.66) / 0.34;
        curX = xRt + (xB - xRt) * t;
        curY = yRt + (yB - yRt) * t;
        drawEnvelopeBadge(ctx, curX, curY, "✅ ICMP Echo OK: Server 10.10.20.50", "#10b981");
      }

      // Draw authentic packet SVG icon over current position
      if (icons.packet.complete) {
        ctx.drawImage(icons.packet, curX - 12, curY - 32, 24, 24);
      }

      if (p.progress >= 1.0) {
        state.packetAnim = null;
      }
    }

    function drawEnvelopeBadge(ctx, x, y, text, color) {
      const w = 190;
      const h = 26;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      roundRect(ctx, x - w / 2, y + 14, w, h, 8);
      ctx.fill();

      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, x, y + 27);
      ctx.restore();
    }

    function roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x + radius, y);
      ctx.closePath();
    }

    draw();
  }

  render();
}
