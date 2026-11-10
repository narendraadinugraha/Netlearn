// NetQuest - Cisco Packet Tracer Style Interactive Virtual Network Lab
// Features Realtime & Simulation Mode, Step-by-Step Capture/Forward,
// Event List Panel, PDU Information Inspector (OSI Model & Inbound/Outbound Headers),
// and Cisco Device Inspector Modal (Physical Chassis, Config, and Cisco IOS CLI Terminal)!

import { sound } from "./gamification.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderUnifiedWorkbench(container) {
  // Application State
  const state = {
    mode: "simulation", // "realtime" | "simulation"
    simState: "idle", // "idle" | "playing" | "paused" | "finished"
    currentStepIndex: 0,
    playbackSpeed: 1, // 1x or 2x
    cableCut: false,
    concentratorType: "switch", // "switch" | "hub"
    selectedDeviceId: "hostA",
    deviceModalOpen: false,
    deviceActiveTab: "physical", // "physical" | "config" | "cli"
    pduModalOpen: false,
    activePduStep: null,
    
    // Cisco Hardware Nodes
    nodes: {
      hostA: {
        id: "hostA",
        name: "PC-A (Laptop Siswa)",
        model: "PC-PT Workstation",
        ip: "192.168.1.10",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:AA:11:22:33:01",
        port: "FastEthernet0",
        poweredOn: true,
        x: 80,
        y: 155,
        type: "host",
        icon: "laptop"
      },
      switch01: {
        id: "switch01",
        name: "Switch-2960",
        model: "Cisco Catalyst 2960-24TT",
        ip: "192.168.1.2",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:SW:99:88:77:01",
        portIn: "FastEthernet0/1",
        portOut: "FastEthernet0/24",
        poweredOn: true,
        x: 250,
        y: 155,
        type: "switch",
        icon: "switch"
      },
      routerCore: {
        id: "routerCore",
        name: "Router-2911",
        model: "Cisco 2911 Integrated Services Router",
        ip: "192.168.1.1",
        ipOut: "10.10.20.1",
        mask: "255.255.255.0",
        gateway: "0.0.0.0",
        dns: "8.8.8.8",
        mac: "00:RT:55:44:33:01",
        portIn: "GigabitEthernet0/0/0",
        portOut: "GigabitEthernet0/0/1",
        poweredOn: true,
        x: 420,
        y: 155,
        type: "router",
        icon: "router"
      },
      serverB: {
        id: "serverB",
        name: "Server-Web (Target)",
        model: "Server-PT Enterprise",
        ip: "10.10.20.50",
        mask: "255.255.255.0",
        gateway: "10.10.20.1",
        dns: "8.8.8.8",
        mac: "00:BB:44:55:66:02",
        port: "FastEthernet0",
        poweredOn: true,
        x: 590,
        y: 155,
        type: "server",
        icon: "server"
      }
    },

    // Cisco IOS CLI History per device
    cliHistory: {
      hostA: [
        "Microsoft Windows [Version 10.0.19045.3803]",
        "(c) Microsoft Corporation. All rights reserved.",
        "",
        "C:\> ipconfig /all",
        "   IPv4 Address. . . . . . . . . . . : 192.168.1.10",
        "   Subnet Mask . . . . . . . . . . . : 255.255.255.0",
        "   Default Gateway . . . . . . . . . : 192.168.1.1",
        "   Physical Address (MAC). . . . . . : 00:AA:11:22:33:01",
        "",
        "C:\> _"
      ],
      switch01: [
        "Switch> enable",
        "Switch# show mac address-table",
        "          Mac Address Table",
        "-------------------------------------------",
        "Vlan    Mac Address       Type        Ports",
        "----    -----------       --------    -----",
        "   1    00aa.1122.3301    DYNAMIC     Fa0/1",
        "   1    00rt.5544.3301    DYNAMIC     Fa0/24",
        "Total Mac Addresses for this criterion: 2",
        "",
        "Switch# _"
      ],
      routerCore: [
        "Router> enable",
        "Router# show ip interface brief",
        "Interface              IP-Address      OK? Method Status                Protocol",
        "GigabitEthernet0/0/0   192.168.1.1     YES manual up                    up",
        "GigabitEthernet0/0/1   10.10.20.1      YES manual up                    up",
        "",
        "Router# show ip route",
        "Gateway of last resort is not set",
        "C    192.168.1.0/24 is directly connected, GigabitEthernet0/0/0",
        "C    10.10.20.0/24 is directly connected, GigabitEthernet0/0/1",
        "",
        "Router# _"
      ],
      serverB: [
        "Web Server Apache/2.4.52 (Ubuntu)",
        "Service HTTP (Port 80): RUNNING",
        "Service HTTPS (Port 443): RUNNING",
        "",
        "root@web-server:~# ip addr show eth0",
        "inet 10.10.20.50/24 brd 10.10.20.255 scope global eth0",
        "",
        "root@web-server:~# _"
      ]
    }
  };

  // 8 Sequential Simulation Steps (Simulation Mode Event List)
  const SIMULATION_STEPS = [
    {
      step: 1,
      time: "0.000s",
      lastDevice: "PC-A",
      atDevice: "PC-A",
      type: "ARP",
      color: "#06b6d4",
      info: "ARP Request: Who has 192.168.1.1? Tell 192.168.1.10 (Broadcast FFFF.FFFF.FFFF)",
      pduLayer: 2,
      osiInfo: {
        l7: "Application: N/A (Address Resolution Protocol)",
        l4: "Transport: N/A",
        l3: "Network: ARP Protocol (Hardware Type: Ethernet, Protocol: IPv4)",
        l2: "Ethernet II: Src MAC 00:AA:11:22:33:01 -> Dst MAC FF:FF:FF:FF:FF:FF (Broadcast)",
        l1: "Physical: FastEthernet0 (Tx frame to copper cable)"
      },
      explanation: "PC-A ingin mengirim ping ke IP gateway (192.168.1.1), tetapi belum mengetahui alamat MAC-nya. PC-A membangkitkan paket ARP Request secara broadcast."
    },
    {
      step: 2,
      time: "0.004s",
      lastDevice: "PC-A",
      atDevice: "Switch-2960",
      type: "ARP",
      color: "#06b6d4",
      info: "Switch-2960 menerima ARP pada Fa0/1, mencatat MAC PC-A, dan mem-flood ke Fa0/24",
      pduLayer: 2,
      osiInfo: {
        l7: "Application: N/A",
        l4: "Transport: N/A",
        l3: "Network: ARP Request",
        l2: "Ethernet II: Frame masuk di port Fa0/1. Switch memperbarui MAC Address Table.",
        l1: "Physical: FastEthernet0/1 (Rx) -> FastEthernet0/24 (Tx Flooding)"
      },
      explanation: "Switch menerima frame broadcast pada port Fa0/1. Switch mempelajari bahwa MAC PC-A terhubung di Fa0/1, lalu meneruskan broadcast ke semua port lain (Fa0/24)."
    },
    {
      step: 3,
      time: "0.008s",
      lastDevice: "Switch-2960",
      atDevice: "Router-2911",
      type: "ARP",
      color: "#06b6d4",
      info: "Router-2911 cocok dengan IP 192.168.1.1. Membalas ARP Reply Unicast ke PC-A",
      pduLayer: 3,
      osiInfo: {
        l7: "Application: N/A",
        l4: "Transport: N/A",
        l3: "Network: ARP Reply (192.168.1.1 is at 00:RT:55:44:33:01)",
        l2: "Ethernet II: Src MAC 00:RT:55:44:33:01 -> Dst MAC 00:AA:11:22:33:01 (Unicast)",
        l1: "Physical: GigabitEthernet0/0/0"
      },
      explanation: "Router memeriksa paket ARP. Karena alamat IP tujuan cocok dengan GigabitEthernet0/0/0 miliknya, Router membuat paket ARP Reply berisi MAC address-nya dan mengirim unicast kembali."
    },
    {
      step: 4,
      time: "0.014s",
      lastDevice: "Router-2911",
      atDevice: "PC-A",
      type: "ARP",
      color: "#06b6d4",
      info: "PC-A menerima ARP Reply. Tabel ARP diupdate: 192.168.1.1 -> 00:RT:55:44:33:01",
      pduLayer: 2,
      osiInfo: {
        l7: "Application: N/A",
        l4: "Transport: N/A",
        l3: "Network: ARP Cache Updated",
        l2: "Ethernet II: Frame diterima di FastEthernet0",
        l1: "Physical: FastEthernet0"
      },
      explanation: "PC-A menyimpan MAC address router ke dalam tabel ARP-nya. Sekarang PC-A siap membungkus paket ICMP Ping yang sebenarnya!"
    },
    {
      step: 5,
      time: "0.020s",
      lastDevice: "PC-A",
      atDevice: "Switch-2960",
      type: "ICMP",
      color: "#f59e0b",
      info: "ICMP Echo Request (Type 8): Src 192.168.1.10 -> Dst 10.10.20.50 (TTL=128)",
      pduLayer: 3,
      osiInfo: {
        l7: "Application: Ping Utility (Data: 32 bytes abcdef...)",
        l4: "Transport: ICMP Control Message (Type 8 Echo Request, Code 0, Seq=1)",
        l3: "Network: IPv4 Header (Src: 192.168.1.10, Dst: 10.10.20.50, Protocol: 1 ICMP, TTL: 128)",
        l2: "Ethernet II: Src MAC 00:AA:11... -> Dst MAC 00:RT:55... (MAC Gateway)",
        l1: "Physical: FastEthernet0/1 (Rx)"
      },
      explanation: "PC-A memeriksa IP tujuan (10.10.20.50) dan mengetahui bahwa tujuan berada di luar subnet lokal (/24). Oleh karena itu, frame diarahkan ke MAC address default gateway."
    },
    {
      step: 6,
      time: "0.028s",
      lastDevice: "Switch-2960",
      atDevice: "Router-2911",
      type: "ICMP",
      color: "#f59e0b",
      info: "Router memeriksa Routing Table: 10.10.20.0/24 directly connected via Gi0/0/1. Kurangi TTL=127",
      pduLayer: 3,
      osiInfo: {
        l7: "Application: Ping Utility Payload",
        l4: "Transport: ICMP Type 8 Code 0",
        l3: "Network: IPv4 Route Lookup. Dst 10.10.20.50 via Gi0/0/1. New TTL=127.",
        l2: "Ethernet II: Strip L2 header lama, bungkus dengan Src MAC Router Gi0/0/1 -> Dst MAC Server",
        l1: "Physical: GigabitEthernet0/0/1 (Tx)"
      },
      explanation: "Router membuka header Layer 2, memeriksa tabel routing (Routing Table Lookup), mengurangi nilai TTL sebanyak 1, menghitung checksum ulang, lalu membungkusnya kembali untuk dikirim ke Server."
    },
    {
      step: 7,
      time: "0.038s",
      lastDevice: "Router-2911",
      atDevice: "Server-Web",
      type: "ICMP",
      color: "#10b981",
      info: "Server menerima Echo Request! Menghasilkan ICMP Echo Reply (Type 0, Code 0)",
      pduLayer: 4,
      osiInfo: {
        l7: "Application: ICMP Daemon / Web Server Stack",
        l4: "Transport: ICMP Type 0 Echo Reply",
        l3: "Network: IPv4 Header (Src: 10.10.20.50, Dst: 192.168.1.10, TTL: 64)",
        l2: "Ethernet II: Src MAC Server -> Dst MAC Router Gi0/0/1",
        l1: "Physical: FastEthernet0"
      },
      explanation: "Server menerima permintaan ping dan segera membalas dengan paket ICMP Echo Reply (Type 0). Paket balasan menempuh rute kembali menuju Laptop Siswa."
    },
    {
      step: 8,
      time: "0.052s",
      lastDevice: "Server-Web",
      atDevice: "PC-A",
      type: "ICMP",
      color: "#10b981",
      info: "PC-A menerima ICMP Echo Reply: bytes=32 time=0.82ms TTL=63 (Ping Sukses 100%!)",
      pduLayer: 7,
      osiInfo: {
        l7: "Application: Ping Selesai: 4 packets sent, 4 received, 0% packet loss",
        l4: "Transport: ICMP Reply Processed",
        l3: "Network: IPv4 Header Received",
        l2: "Ethernet II: Frame Accepted",
        l1: "Physical: FastEthernet0"
      },
      explanation: "Laptop Siswa berhasil menerima balasan ping dari Server Web. Koneksi end-to-end terbukti berjalan normal dan stabil!"
    }
  ];

  let simInterval = null;

  function render() {
    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- Cisco Packet Tracer Style Top Control Toolbar -->
        <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          
          <!-- Mode Selector (Realtime vs Simulation) -->
          <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span class="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 uppercase">Mode Lab:</span>
            <div class="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
              <button id="btn-mode-realtime" class="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${state.mode === 'realtime' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                ⚡ Realtime
              </button>
              <button id="btn-mode-simulation" class="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${state.mode === 'simulation' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                ⏱️ Simulasi (Event List)
              </button>
            </div>
          </div>

          <!-- Simulation Playback Controls -->
          <div class="flex items-center gap-1.5 flex-wrap">
            ${state.mode === 'simulation' ? `
              <button id="btn-sim-play" class="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[15px] sm:text-[16px]">${state.simState === 'playing' ? 'pause' : 'play_arrow'}</span>
                <span>${state.simState === 'playing' ? 'Jeda' : 'Auto Play'}</span>
              </button>
              <button id="btn-sim-step" class="px-2.5 sm:px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer" title="Maju 1 Langkah Paket (Capture / Forward)">
                <span class="material-symbols-outlined text-[15px] sm:text-[16px]">step_over</span>
                <span>Step</span>
              </button>
              <button id="btn-sim-reset" class="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer" title="Reset Paket">
                <span class="material-symbols-outlined text-[16px]">restart_alt</span>
              </button>
            ` : `
              <button id="btn-realtime-ping" class="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-[15px] sm:text-[16px]">send</span>
                <span>Kirim Simple PDU</span>
              </button>
            `}

            <div class="h-5 sm:h-6 w-px bg-slate-200 mx-0.5 sm:mx-1"></div>

            <!-- Fault Simulator: Cut Cable -->
            <button id="btn-toggle-cable" class="px-2.5 sm:px-3 py-1.5 font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border ${state.cableCut ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}">
              <span class="material-symbols-outlined text-[15px] sm:text-[16px]">${state.cableCut ? 'link' : 'content_cut'}</span>
              <span>${state.cableCut ? 'Sambungkan' : 'Putus Fa0/1'}</span>
            </button>
          </div>
        </div>

        <!-- Cisco Workspace Canvas (Responsive Height & Viewport Scaling) -->
        <div class="relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 select-none h-[260px] sm:h-[320px] md:h-[380px]" id="cisco-canvas-wrapper">
          <canvas id="cisco-canvas" class="w-full h-full block"></canvas>

          <!-- Floating Device Help Hint (Compact on Mobile) -->
          <div class="hidden sm:flex absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300 pointer-events-none items-center gap-2 shadow-lg">
            <span class="material-symbols-outlined text-indigo-400 text-[16px]">info</span>
            <span>Klik perangkat untuk membuka <strong>Physical Chassis &amp; Cisco IOS CLI</strong></span>
          </div>

          <!-- Current Envelope Progress Tag -->
          <div class="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 bg-slate-900/90 backdrop-blur-md border border-amber-500/50 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-mono text-amber-300 flex items-center gap-1.5 sm:gap-2 shadow-xl">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Langkah: <strong>${state.currentStepIndex + 1} / ${SIMULATION_STEPS.length}</strong></span>
          </div>
        </div>

        <!-- Cisco Packet Tracer Simulation Panel (Event List) -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 class="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-indigo-600">list_alt</span>
                <span>Daftar Peristiwa Transmisi (Cisco Event List Panel)</span>
              </h3>
            </div>
            <span class="text-[11px] font-mono text-slate-500">Klik baris untuk membuka <strong>PDU Information (OSI Layers)</strong></span>
          </div>

          <div class="overflow-x-auto max-h-56 overflow-y-auto font-mono text-xs">
            <table class="w-full text-left border-collapse">
              <thead class="bg-slate-100 text-[10px] text-slate-500 uppercase sticky top-0 border-b border-slate-200">
                <tr>
                  <th class="py-2 px-3 w-12 text-center">Status</th>
                  <th class="py-2 px-3 w-20">Waktu</th>
                  <th class="py-2 px-3 w-28">Dari Perangkat</th>
                  <th class="py-2 px-3 w-28">Di Perangkat</th>
                  <th class="py-2 px-3 w-24">Tipe PDU</th>
                  <th class="py-2 px-3">Informasi Protokol</th>
                  <th class="py-2 px-3 w-28 text-center">Detail PDU</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${SIMULATION_STEPS.map((s, idx) => {
                  const isActive = idx === state.currentStepIndex;
                  const isPast = idx <= state.currentStepIndex;
                  return `
                    <tr class="transition-colors cursor-pointer hover:bg-indigo-50/50 event-row ${isActive ? 'bg-indigo-50 font-bold text-indigo-950 border-l-4 border-l-indigo-600' : ''}" data-step="${idx}">
                      <td class="py-2 px-3 text-center">
                        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}">
                          ${isPast ? '✓' : idx + 1}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-slate-500">${s.time}</td>
                      <td class="py-2 px-3 font-semibold text-slate-800">${s.lastDevice}</td>
                      <td class="py-2 px-3 font-semibold text-slate-800">${s.atDevice}</td>
                      <td class="py-2 px-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background-color: ${s.color}20; color: ${s.color}; border: 1px solid ${s.color}40;">
                          ${s.type}
                        </span>
                      </td>
                      <td class="py-2 px-3 text-slate-700 truncate max-w-xs">${s.info}</td>
                      <td class="py-2 px-3 text-center">
                        <button class="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-indigo-600 font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer">
                          <span>Envelope</span>
                          <span class="material-symbols-outlined text-[13px]">mail</span>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Cisco PDU Information Window (Envelope Modal) -->
        <div id="cisco-pdu-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        </div>

        <!-- Cisco Device Inspector Modal (Physical Chassis, Config, CLI Terminal) -->
        <div id="cisco-device-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        </div>

      </div>
    `;

    setupEvents();
    initCanvas();
  }

  function setupEvents() {
    // Mode toggles
    document.getElementById("btn-mode-realtime")?.addEventListener("click", () => {
      state.mode = "realtime";
      stopSimulationLoop();
      render();
    });

    document.getElementById("btn-mode-simulation")?.addEventListener("click", () => {
      state.mode = "simulation";
      render();
    });

    // Simulation playback
    document.getElementById("btn-sim-play")?.addEventListener("click", () => {
      if (state.simState === "playing") {
        pauseSimulation();
      } else {
        playSimulation();
      }
    });

    document.getElementById("btn-sim-step")?.addEventListener("click", () => {
      pauseSimulation();
      stepForward();
    });

    document.getElementById("btn-sim-reset")?.addEventListener("click", () => {
      resetSimulation();
    });

    document.getElementById("btn-realtime-ping")?.addEventListener("click", () => {
      sound.click();
      resetSimulation();
      playSimulation();
    });

    // Cable toggle
    document.getElementById("btn-toggle-cable")?.addEventListener("click", () => {
      state.cableCut = !state.cableCut;
      sound.click();
      render();
    });

    // Event row click -> open PDU Modal
    container.querySelectorAll(".event-row").forEach(row => {
      row.addEventListener("click", () => {
        const stepIdx = parseInt(row.dataset.step, 10);
        openPduModal(stepIdx);
      });
    });
  }

  function playSimulation() {
    state.simState = "playing";
    sound.success();
    render();
    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => {
      if (state.currentStepIndex < SIMULATION_STEPS.length - 1) {
        state.currentStepIndex++;
        render();
      } else {
        pauseSimulation();
      }
    }, 1800 / state.playbackSpeed);
  }

  function pauseSimulation() {
    state.simState = "paused";
    if (simInterval) clearInterval(simInterval);
    render();
  }

  function stepForward() {
    sound.click();
    if (state.currentStepIndex < SIMULATION_STEPS.length - 1) {
      state.currentStepIndex++;
    } else {
      state.currentStepIndex = 0;
    }
    render();
  }

  function resetSimulation() {
    sound.click();
    state.simState = "idle";
    state.currentStepIndex = 0;
    if (simInterval) clearInterval(simInterval);
    render();
  }

  function stopSimulationLoop() {
    state.simState = "idle";
    if (simInterval) clearInterval(simInterval);
  }

  // --------------------------------------------------------------------------
  // Cisco PDU Information Window (Modal)
  // --------------------------------------------------------------------------
  function openPduModal(stepIdx) {
    const s = SIMULATION_STEPS[stepIdx];
    const modal = document.getElementById("cisco-pdu-modal");
    if (!modal) return;
    sound.click();

    modal.classList.remove("hidden");
    modal.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-scale-up text-left font-mono max-h-[88vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">mail</span>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">LANGKAH ${s.step} DARI 8</span>
                <span class="text-xs text-slate-500">${s.time}</span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-0.5">PDU Information at Device: ${s.atDevice} (${s.type})</h3>
            </div>
          </div>
          <button id="btn-close-pdu-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Explanatory Banner -->
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-sans">
          <strong>Analisis Paket:</strong> ${s.explanation}
        </div>

        <!-- OSI Model 7-Layer Stack Breakdown (Cisco Packet Tracer Style) -->
        <div class="space-y-1.5">
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Model OSI 7-Layer (Inbound / Outbound PDU Stack)</div>
          
          <div class="space-y-1 text-xs">
            <div class="p-2.5 rounded-lg border flex items-center justify-between ${s.pduLayer >= 7 ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
              <span>Layer 7: Application</span>
              <span class="text-[11px] font-normal truncate max-w-md">${s.osiInfo.l7}</span>
            </div>
            <div class="p-2.5 rounded-lg border flex items-center justify-between ${s.pduLayer >= 4 ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
              <span>Layer 4: Transport</span>
              <span class="text-[11px] font-normal truncate max-w-md">${s.osiInfo.l4}</span>
            </div>
            <div class="p-2.5 rounded-lg border flex items-center justify-between ${s.pduLayer >= 3 ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
              <span>Layer 3: Network</span>
              <span class="text-[11px] font-normal truncate max-w-md">${s.osiInfo.l3}</span>
            </div>
            <div class="p-2.5 rounded-lg border flex items-center justify-between ${s.pduLayer >= 2 ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
              <span>Layer 2: Data Link</span>
              <span class="text-[11px] font-normal truncate max-w-md">${s.osiInfo.l2}</span>
            </div>
            <div class="p-2.5 rounded-lg border flex items-center justify-between bg-indigo-50 border-indigo-300 text-indigo-900 font-bold">
              <span>Layer 1: Physical</span>
              <span class="text-[11px] font-normal truncate max-w-md">${s.osiInfo.l1}</span>
            </div>
          </div>
        </div>

        <button id="btn-close-pdu-modal-bottom" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs rounded-xl shadow cursor-pointer transition-all">
          Tutup &amp; Lanjutkan Simulasi
        </button>
      </div>
    `;

    document.getElementById("btn-close-pdu-modal")?.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
    document.getElementById("btn-close-pdu-modal-bottom")?.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  // --------------------------------------------------------------------------
  // Cisco Device Inspector Modal (Chassis, Config, CLI Terminal)
  // --------------------------------------------------------------------------
  function openDeviceModal(deviceId) {
    const dev = state.nodes[deviceId];
    if (!dev) return;
    state.selectedDeviceId = deviceId;
    sound.click();

    const modal = document.getElementById("cisco-device-modal");
    if (!modal) return;
    modal.classList.remove("hidden");

    renderDeviceModalContent();
  }

  function renderDeviceModalContent() {
    const dev = state.nodes[state.selectedDeviceId];
    const modal = document.getElementById("cisco-device-modal");
    if (!dev || !modal) return;

    modal.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-scale-up text-left font-mono max-h-[88vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-slate-900 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">${dev.type === 'switch' ? 'hub' : (dev.type === 'router' ? 'router' : (dev.type === 'server' ? 'dns' : 'laptop_chromebook'))}</span>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">${dev.model}</span>
                <span class="text-xs text-slate-500">${dev.name}</span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-0.5">Konfigurasi &amp; Inspeksi Perangkat Cisco</h3>
            </div>
          </div>
          <button id="btn-close-dev-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- 3 Tabs: Physical, Config, CLI -->
        <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button id="dev-tab-physical" class="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${state.deviceActiveTab === 'physical' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">
            Tampak Fisik (Physical)
          </button>
          <button id="dev-tab-config" class="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${state.deviceActiveTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">
            Konfigurasi IP
          </button>
          <button id="dev-tab-cli" class="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${state.deviceActiveTab === 'cli' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">
            Konsol CLI (Cisco IOS)
          </button>
        </div>

        <!-- Tab Body -->
        <div class="min-h-[260px]">
          ${state.deviceActiveTab === 'physical' ? renderPhysicalTab(dev) : ''}
          ${state.deviceActiveTab === 'config' ? renderConfigTab(dev) : ''}
          ${state.deviceActiveTab === 'cli' ? renderCliTab(dev) : ''}
        </div>
      </div>
    `;

    document.getElementById("btn-close-dev-modal")?.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    document.getElementById("dev-tab-physical")?.addEventListener("click", () => {
      state.deviceActiveTab = "physical";
      renderDeviceModalContent();
    });
    document.getElementById("dev-tab-config")?.addEventListener("click", () => {
      state.deviceActiveTab = "config";
      renderDeviceModalContent();
    });
    document.getElementById("dev-tab-cli")?.addEventListener("click", () => {
      state.deviceActiveTab = "cli";
      renderDeviceModalContent();
    });

    // Handle Power Toggle
    document.getElementById("btn-toggle-power")?.addEventListener("click", () => {
      dev.poweredOn = !dev.poweredOn;
      sound.click();
      renderDeviceModalContent();
      render();
    });

    // Handle CLI Command Execution
    const cliInput = document.getElementById("dev-cli-input");
    if (cliInput) {
      cliInput.focus();
      cliInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const val = cliInput.value.trim();
          executeDeviceCliCommand(dev, val);
          cliInput.value = "";
          renderDeviceModalContent();
        }
      });
    }
  }

  function renderPhysicalTab(dev) {
    return `
      <div class="space-y-4">
        <!-- Chassis Visual Rackmount Panel -->
        <div class="p-6 rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-inner flex flex-col justify-between min-h-[180px] text-white">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full ${dev.poweredOn ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-rose-500'}"></span>
              <span class="text-xs font-bold text-slate-300">${dev.model}</span>
            </div>
            
            <!-- Interactive Power Switch -->
            <button id="btn-toggle-power" class="px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${dev.poweredOn ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900' : 'bg-rose-950/80 text-rose-400 border-rose-500/50 hover:bg-rose-900'}">
              Power: ${dev.poweredOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <!-- Port Row Interface Visuals -->
          <div class="py-4 flex items-center justify-around gap-2">
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <span class="text-[10px] text-slate-400 block font-mono">${dev.port || dev.portIn}</span>
              <div class="w-8 h-6 mx-auto rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
                <span class="w-2 h-2 rounded-full ${dev.poweredOn && !state.cableCut ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}"></span>
              </div>
              <span class="text-[9px] text-emerald-400 block">Link/Act</span>
            </div>

            ${dev.portOut ? `
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <span class="text-[10px] text-slate-400 block font-mono">${dev.portOut}</span>
                <div class="w-8 h-6 mx-auto rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full ${dev.poweredOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}"></span>
                </div>
                <span class="text-[9px] text-emerald-400 block">Link/Act</span>
              </div>
            ` : ''}
          </div>

          <div class="text-[10px] text-slate-500 text-center border-t border-slate-800/80 pt-2">
            Cisco Systems Inc. FastEthernet / Gigabit Modular Chassis Architecture
          </div>
        </div>
      </div>
    `;
  }

  function renderConfigTab(dev) {
    return `
      <div class="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">IP Address</label>
            <input type="text" value="${dev.ip}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Subnet Mask</label>
            <input type="text" value="${dev.mask}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Default Gateway</label>
            <input type="text" value="${dev.gateway}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">MAC Address Fisik</label>
            <input type="text" value="${dev.mac}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
        </div>
      </div>
    `;
  }

  function renderCliTab(dev) {
    const hist = state.cliHistory[dev.id] || [];
    return `
      <div class="space-y-2">
        <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono h-48 overflow-y-auto space-y-0.5">
          ${hist.map(l => `<div>${escapeHtml(l)}</div>`).join("")}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono font-bold text-slate-500">${dev.type === 'host' ? 'C:\>' : (dev.type === 'server' ? 'root@target:~#' : 'Router#')}</span>
          <input id="dev-cli-input" type="text" placeholder="Ketik perintah (contoh: ping 10.10.20.50, ipconfig, show ip route)..." class="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
    `;
  }

  function executeDeviceCliCommand(dev, cmd) {
    if (!cmd) return;
    const hist = state.cliHistory[dev.id];
    hist.push(`${dev.type === 'host' ? 'C:\>' : 'Router#'} ${cmd}`);

    const lower = cmd.toLowerCase();
    if (lower === "help") {
      hist.push("Perintah yang tersedia: ping <ip>, ipconfig, show ip route, show mac-address-table, clear");
    } else if (lower.startsWith("ping")) {
      hist.push("Sending 4, 32-byte ICMP Echos to target...!", "Reply from 10.10.20.50: bytes=32 time=0.82ms TTL=63", "Success rate is 100 percent (4/4)");
      sound.success();
    } else if (lower.includes("route")) {
      hist.push("192.168.1.0/24 is directly connected, GigabitEthernet0/0/0", "10.10.20.0/24 is directly connected, GigabitEthernet0/0/1");
    } else if (lower.includes("mac")) {
      hist.push("00aa.1122.3301  DYNAMIC  Fa0/1", "00rt.5544.3301  DYNAMIC  Fa0/24");
    } else if (lower === "clear") {
      state.cliHistory[dev.id] = [];
    } else {
      hist.push(`Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
  }

  // --------------------------------------------------------------------------
  // Cisco 2D Canvas Workspace Rendering
  // --------------------------------------------------------------------------
  function initCanvas() {
    const canvas = document.getElementById("cisco-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw(ctx, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    // Click Detection on Canvas
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const w = canvas.width;
      const h = canvas.height;
      const scaleX = w / 680;
      const scaleY = h / 380;
      const devScale = Math.min(1, Math.max(0.60, w / 650));
      const hitRadius = 45 * devScale;

      Object.values(state.nodes).forEach(node => {
        const nx = node.x * scaleX;
        const ny = node.y * scaleY;
        const dx = clickX - nx;
        const dy = clickY - ny;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
          openDeviceModal(node.id);
        }
      });
    });
  }

  function draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // Cisco Blueprint Grid Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const scaleX = w / 680;
    const scaleY = h / 380;
    const devScale = Math.min(1, Math.max(0.60, w / 650));

    // Node Positions
    const nA = { x: state.nodes.hostA.x * scaleX, y: state.nodes.hostA.y * scaleY };
    const nSw = { x: state.nodes.switch01.x * scaleX, y: state.nodes.switch01.y * scaleY };
    const nRt = { x: state.nodes.routerCore.x * scaleX, y: state.nodes.routerCore.y * scaleY };
    const nB = { x: state.nodes.serverB.x * scaleX, y: state.nodes.serverB.y * scaleY };

    // 1. Draw Cables (Copper Straight-Through)
    drawCable(ctx, nA.x, nA.y, nSw.x, nSw.y, state.cableCut, "Fa0", "Fa0/1", devScale, w);
    drawCable(ctx, nSw.x, nSw.y, nRt.x, nRt.y, false, "Fa0/24", "Gi0/0/0", devScale, w);
    drawCable(ctx, nRt.x, nRt.y, nB.x, nB.y, false, "Gi0/0/1", "Fa0", devScale, w);

    // 2. Draw Devices
    drawDevice(ctx, nA.x, nA.y, state.nodes.hostA, devScale);
    drawDevice(ctx, nSw.x, nSw.y, state.nodes.switch01, devScale);
    drawDevice(ctx, nRt.x, nRt.y, state.nodes.routerCore, devScale);
    drawDevice(ctx, nB.x, nB.y, state.nodes.serverB, devScale);

    // 3. Draw Active PDU Flight Animation
    const s = SIMULATION_STEPS[state.currentStepIndex];
    if (s && !state.cableCut) {
      let pX = nA.x;
      let pY = nA.y;

      if (s.atDevice === "Switch-2960") { pX = nSw.x; pY = nSw.y; }
      else if (s.atDevice === "Router-2911") { pX = nRt.x; pY = nRt.y; }
      else if (s.atDevice === "Server-Web") { pX = nB.x; pY = nB.y; }
      else if (s.atDevice === "PC-A") { pX = nA.x; pY = nA.y; }

      // Draw Glowing Envelope
      ctx.save();
      ctx.translate(pX, pY - 36 * devScale);

      // Envelope glow
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;

      const envW = 38 * devScale;
      const envH = 24 * devScale;

      ctx.fillStyle = s.color;
      ctx.fillRect(-envW / 2, -envH / 2, envW, envH);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-envW / 2, -envH / 2, envW, envH);

      // Envelope fold
      ctx.beginPath();
      ctx.moveTo(-envW / 2, -envH / 2);
      ctx.lineTo(0, 2 * devScale);
      ctx.lineTo(envW / 2, -envH / 2);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      const pduFontSize = Math.max(7, Math.round(8 * devScale));
      ctx.font = `bold ${pduFontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(s.type, 0, 7 * devScale);

      ctx.restore();
    }
  }

  function drawCable(ctx, x1, y1, x2, y2, isCut, port1, port2, devScale = 1, w = 680) {
    ctx.save();

    if (isCut) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.5 * devScale;
      ctx.setLineDash([6 * devScale, 4 * devScale]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.lineTo(midX - 10 * devScale, midY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(midX + 10 * devScale, midY);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Cut Indicator
      ctx.fillStyle = "#ef4444";
      ctx.font = `bold ${Math.max(9, Math.round(12 * devScale))}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("✕ PUTUS", midX, midY - 6 * devScale);

      // Red Port LEDs
      ctx.fillStyle = "#ef4444";
      drawLinkLight(ctx, x1 + (x2 - x1) * 0.14, y1 + (y2 - y1) * 0.14, true);
      drawLinkLight(ctx, x2 - (x2 - x1) * 0.14, y2 - (y2 - y1) * 0.14, false);
    } else {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5 * devScale;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Port Link Lights (Green Triangles ▲)
      ctx.fillStyle = "#10b981";
      drawLinkLight(ctx, x1 + (x2 - x1) * 0.14, y1 + (y2 - y1) * 0.14, true);
      drawLinkLight(ctx, x2 - (x2 - x1) * 0.14, y2 - (y2 - y1) * 0.14, false);

      // Port Labels (Only on screens > 480px to avoid clutter)
      if (w > 480) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = `${Math.max(7, Math.round(9 * devScale))}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(port1, x1 + (x2 - x1) * 0.18, y1 - 10 * devScale);
        ctx.fillText(port2, x2 - (x2 - x1) * 0.18, y2 - 10 * devScale);
      }
    }

    ctx.restore();
  }

  function drawLinkLight(ctx, x, y, isForward) {
    ctx.beginPath();
    if (isForward) {
      ctx.moveTo(x - 4, y - 4);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x - 4, y + 4);
    } else {
      ctx.moveTo(x + 4, y - 4);
      ctx.lineTo(x - 4, y);
      ctx.lineTo(x + 4, y + 4);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawDevice(ctx, x, y, node, devScale = 1) {
    ctx.save();

    const halfW = 42 * devScale;
    const halfH = 36 * devScale;
    const cardW = 84 * devScale;
    const cardH = 72 * devScale;
    const radius = 10 * devScale;

    // Outer card
    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = node.id === state.selectedDeviceId ? "#6366f1" : "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = node.id === state.selectedDeviceId ? 2.5 : 1.5;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - halfW, y - halfH, cardW, cardH, radius) : ctx.rect(x - halfW, y - halfH, cardW, cardH);
    ctx.fill();
    ctx.stroke();

    // Device Power LED
    ctx.fillStyle = node.poweredOn ? "#10b981" : "#ef4444";
    ctx.beginPath();
    ctx.arc(x + 30 * devScale, y - 24 * devScale, 3 * devScale, 0, Math.PI * 2);
    ctx.fill();

    // Device Icon Badge
    ctx.fillStyle = "#38bdf8";
    const iconFontSize = Math.max(12, Math.round(18 * devScale));
    ctx.font = `bold ${iconFontSize}px monospace`;
    ctx.textAlign = "center";
    const symbol = node.type === "switch" ? "☵" : (node.type === "router" ? "⨁" : (node.type === "server" ? "🗄️" : "💻"));
    ctx.fillText(symbol, x, y - 4 * devScale);

    // Device Name
    ctx.fillStyle = "#ffffff";
    const nameFontSize = Math.max(8, Math.round(10 * devScale));
    ctx.font = `bold ${nameFontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(node.name.split(" ")[0], x, y + 14 * devScale);

    // IP Badge
    ctx.fillStyle = "#94a3b8";
    const ipFontSize = Math.max(7, Math.round(9 * devScale));
    ctx.font = `${ipFontSize}px monospace`;
    ctx.fillText(node.ip, x, y + 25 * devScale);

    ctx.restore();
  }

  render();
}
