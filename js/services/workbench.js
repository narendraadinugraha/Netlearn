// NetQuest - Cisco Packet Tracer Style Interactive Virtual Network Lab
// Features Port Selection on Wiring, Unlimited Free PDU Sending Anywhere,
// 60FPS Smooth Packet Flight Animation, Device Inspector & Fullscreen Engine!

import { sound } from "./gamification.js";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderUnifiedWorkbench(container) {
  // --------------------------------------------------------------------------
  // Application State
  // --------------------------------------------------------------------------
  const state = {
    mode: "realtime", // "realtime" | "simulation"
    simState: "idle", // "idle" | "playing" | "paused"
    currentStepIndex: 0,
    packetCounter: 0,

    // Active tool: "select" | "cable-straight" | "cable-cross" | "delete" | "pdu"
    activeTool: "select",
    cablePending: null, // { fromNodeId, fromPort, cableType }
    pduPendingSource: null, // nodeId

    selectedDeviceId: "pc0",
    deviceActiveTab: "desktop",
    activeDesktopApp: "ipconfig",

    // Last PDU Transaction status
    lastPduResult: {
      status: "Successful",
      source: "PC0",
      target: "Server0",
      type: "ICMP",
      time: "0.82 ms",
      message: "Koneksi end-to-end normal (4 sent, 4 received, 0% packet loss)."
    },

    // Dynamic Nodes & Links
    nodes: {},
    links: [],

    // CLI History & Context per device
    cliHistory: {},
    cliState: {},

    // Dynamic Simulation Steps
    simulationSteps: [],

    // Pointer cursor coordinates for cable rubberband
    pointerPos: { x: 0, y: 0, active: false },

    // Active Flying Packets Queue (Supports multiple simultaneous/repeated packets!)
    activePackets: [],

    // Continuous Loop Ping Feature
    isLoopPing: false,
    loopPingTimer: null
  };

  let animFrameId = null;

  // --------------------------------------------------------------------------
  // Device Hardware Specifications
  // --------------------------------------------------------------------------
  const DEVICE_TYPES = {
    pc: {
      type: "pc",
      prefix: "PC",
      model: "PC-PT Workstation",
      icon: "laptop",
      ports: ["FastEthernet0"],
      isEndDevice: true,
      defaultIp: "192.168.1.10",
      defaultMask: "255.255.255.0",
      defaultGateway: "192.168.1.1"
    },
    laptop: {
      type: "laptop",
      prefix: "Laptop",
      model: "Laptop-PT Portable",
      icon: "laptop_chromebook",
      ports: ["FastEthernet0"],
      isEndDevice: true,
      defaultIp: "192.168.1.11",
      defaultMask: "255.255.255.0",
      defaultGateway: "192.168.1.1"
    },
    server: {
      type: "server",
      prefix: "Server",
      model: "Server-PT Enterprise",
      icon: "dns",
      ports: ["FastEthernet0"],
      isEndDevice: true,
      defaultIp: "10.10.20.50",
      defaultMask: "255.255.255.0",
      defaultGateway: "10.10.20.1"
    },
    switch: {
      type: "switch",
      prefix: "Switch",
      model: "Cisco Catalyst 2960-24TT",
      icon: "hub",
      ports: [
        "FastEthernet0/1",
        "FastEthernet0/2",
        "FastEthernet0/3",
        "FastEthernet0/4",
        "FastEthernet0/24",
        "GigabitEthernet0/1"
      ],
      isEndDevice: false,
      defaultIp: "192.168.1.2",
      defaultMask: "255.255.255.0",
      defaultGateway: "192.168.1.1"
    },
    router: {
      type: "router",
      prefix: "Router",
      model: "Cisco 2911 ISR Router",
      icon: "router",
      ports: [
        "GigabitEthernet0/0/0",
        "GigabitEthernet0/0/1",
        "GigabitEthernet0/0/2"
      ],
      isEndDevice: false,
      defaultIp: "192.168.1.1",
      defaultMask: "255.255.255.0",
      defaultGateway: "0.0.0.0"
    },
    hub: {
      type: "hub",
      prefix: "Hub",
      model: "Hub-PT Multiport",
      icon: "device_hub",
      ports: ["Port0", "Port1", "Port2", "Port3"],
      isEndDevice: false,
      defaultIp: "0.0.0.0",
      defaultMask: "0.0.0.0",
      defaultGateway: "0.0.0.0"
    }
  };

  // --------------------------------------------------------------------------
  // Responsive Canvas Coordinates Helper
  // --------------------------------------------------------------------------
  function getCanvasViewport() {
    const canvas = document.getElementById("cisco-canvas");
    const w = (canvas && canvas.width > 280) ? canvas.width : 780;
    const h = (canvas && canvas.height > 200) ? canvas.height : 420;
    return { w, h, midY: Math.round(h * 0.48) };
  }

  // --------------------------------------------------------------------------
  // Pre-configured Topologies (Fully Responsive & Screen-Adaptive)
  // --------------------------------------------------------------------------
  function loadStandardTemplate() {
    const { w, midY } = getCanvasViewport();

    state.nodes = {
      pc0: {
        id: "pc0",
        name: "PC0",
        type: "pc",
        model: DEVICE_TYPES.pc.model,
        icon: DEVICE_TYPES.pc.icon,
        ports: [...DEVICE_TYPES.pc.ports],
        ip: "192.168.1.10",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:AA:11:22:33:01",
        poweredOn: true,
        x: Math.round(w * 0.14),
        y: midY
      },
      sw0: {
        id: "sw0",
        name: "Switch0",
        type: "switch",
        model: DEVICE_TYPES.switch.model,
        icon: DEVICE_TYPES.switch.icon,
        ports: [...DEVICE_TYPES.switch.ports],
        ip: "192.168.1.2",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:SW:99:88:77:01",
        poweredOn: true,
        x: Math.round(w * 0.38),
        y: midY
      },
      rt0: {
        id: "rt0",
        name: "Router0",
        type: "router",
        model: DEVICE_TYPES.router.model,
        icon: DEVICE_TYPES.router.icon,
        ports: [...DEVICE_TYPES.router.ports],
        ip: "192.168.1.1",
        ip2: "10.10.20.1",
        mask: "255.255.255.0",
        gateway: "0.0.0.0",
        dns: "8.8.8.8",
        mac: "00:RT:55:44:33:01",
        poweredOn: true,
        x: Math.round(w * 0.62),
        y: midY
      },
      srv0: {
        id: "srv0",
        name: "Server0",
        type: "server",
        model: DEVICE_TYPES.server.model,
        icon: DEVICE_TYPES.server.icon,
        ports: [...DEVICE_TYPES.server.ports],
        ip: "10.10.20.50",
        mask: "255.255.255.0",
        gateway: "10.10.20.1",
        dns: "8.8.8.8",
        mac: "00:BB:44:55:66:02",
        poweredOn: true,
        x: Math.round(w * 0.86),
        y: midY
      }
    };

    state.links = [
      {
        id: "link-1",
        fromNode: "pc0",
        fromPort: "FastEthernet0",
        toNode: "sw0",
        toPort: "FastEthernet0/1",
        cableType: "straight",
        status: "up"
      },
      {
        id: "link-2",
        fromNode: "sw0",
        fromPort: "FastEthernet0/24",
        toNode: "rt0",
        toPort: "GigabitEthernet0/0/0",
        cableType: "straight",
        status: "up"
      },
      {
        id: "link-3",
        fromNode: "rt0",
        fromPort: "GigabitEthernet0/0/1",
        toNode: "srv0",
        toPort: "FastEthernet0",
        cableType: "straight",
        status: "up"
      }
    ];

    state.selectedDeviceId = "pc0";
    state.activePackets = [];
    initCliHistories();
    prepareSimulationSteps("pc0", "srv0");
  }

  function loadPeerToPeerTemplate() {
    const { w, midY } = getCanvasViewport();

    state.nodes = {
      pc0: {
        id: "pc0",
        name: "PC0",
        type: "pc",
        model: DEVICE_TYPES.pc.model,
        icon: DEVICE_TYPES.pc.icon,
        ports: [...DEVICE_TYPES.pc.ports],
        ip: "192.168.1.10",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:AA:11:22:33:01",
        poweredOn: true,
        x: Math.round(w * 0.28),
        y: midY
      },
      pc1: {
        id: "pc1",
        name: "PC1",
        type: "pc",
        model: DEVICE_TYPES.pc.model,
        icon: DEVICE_TYPES.pc.icon,
        ports: [...DEVICE_TYPES.pc.ports],
        ip: "192.168.1.20",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:AA:11:22:33:02",
        poweredOn: true,
        x: Math.round(w * 0.72),
        y: midY
      }
    };

    state.links = [
      {
        id: "link-p2p",
        fromNode: "pc0",
        fromPort: "FastEthernet0",
        toNode: "pc1",
        toPort: "FastEthernet0",
        cableType: "cross",
        status: "up"
      }
    ];

    state.selectedDeviceId = "pc0";
    state.activePackets = [];
    initCliHistories();
    prepareSimulationSteps("pc0", "pc1");
  }

  function loadStarLanTemplate() {
    const { w, h, midY } = getCanvasViewport();
    const midX = Math.round(w * 0.5);

    state.nodes = {
      sw0: {
        id: "sw0",
        name: "Switch0",
        type: "switch",
        model: DEVICE_TYPES.switch.model,
        icon: DEVICE_TYPES.switch.icon,
        ports: [...DEVICE_TYPES.switch.ports],
        ip: "192.168.1.2",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:SW:99:88:77:01",
        poweredOn: true,
        x: midX,
        y: midY
      },
      pc0: {
        id: "pc0",
        name: "PC0",
        type: "pc",
        model: DEVICE_TYPES.pc.model,
        icon: DEVICE_TYPES.pc.icon,
        ports: [...DEVICE_TYPES.pc.ports],
        ip: "192.168.1.10",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:AA:11:22:33:01",
        poweredOn: true,
        x: Math.round(w * 0.18),
        y: Math.round(h * 0.28)
      },
      pc1: {
        id: "pc1",
        name: "PC1",
        type: "pc",
        model: DEVICE_TYPES.pc.model,
        icon: DEVICE_TYPES.pc.icon,
        ports: [...DEVICE_TYPES.pc.ports],
        ip: "192.168.1.11",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:AA:11:22:33:02",
        poweredOn: true,
        x: Math.round(w * 0.18),
        y: Math.round(h * 0.68)
      },
      srv0: {
        id: "srv0",
        name: "Server0",
        type: "server",
        model: DEVICE_TYPES.server.model,
        icon: DEVICE_TYPES.server.icon,
        ports: [...DEVICE_TYPES.server.ports],
        ip: "192.168.1.100",
        mask: "255.255.255.0",
        gateway: "192.168.1.1",
        dns: "8.8.8.8",
        mac: "00:BB:44:55:66:01",
        poweredOn: true,
        x: Math.round(w * 0.82),
        y: midY
      }
    };

    state.links = [
      {
        id: "l1",
        fromNode: "pc0",
        fromPort: "FastEthernet0",
        toNode: "sw0",
        toPort: "FastEthernet0/1",
        cableType: "straight",
        status: "up"
      },
      {
        id: "l2",
        fromNode: "pc1",
        fromPort: "FastEthernet0",
        toNode: "sw0",
        toPort: "FastEthernet0/2",
        cableType: "straight",
        status: "up"
      },
      {
        id: "l3",
        fromNode: "sw0",
        fromPort: "FastEthernet0/24",
        toNode: "srv0",
        toPort: "FastEthernet0",
        cableType: "straight",
        status: "up"
      }
    ];

    state.selectedDeviceId = "pc0";
    state.activePackets = [];
    initCliHistories();
    prepareSimulationSteps("pc0", "srv0");
  }

  function clearCanvas() {
    if (state.loopPingTimer) {
      clearInterval(state.loopPingTimer);
      state.loopPingTimer = null;
      state.isLoopPing = false;
      const btn = document.getElementById("btn-toggle-loop-ping");
      const label = document.getElementById("label-loop-ping");
      btn?.classList.remove("bg-amber-500", "text-slate-950", "border-amber-600");
      btn?.classList.add("bg-slate-100", "text-slate-700");
      if (label) label.textContent = "Loop Ping: OFF";
    }

    state.nodes = {};
    state.links = [];
    state.simulationSteps = [];
    state.selectedDeviceId = null;
    state.cablePending = null;
    state.pduPendingSource = null;
    state.activePackets = [];
    state.lastPduResult = {
      status: "Idle",
      source: "-",
      target: "-",
      type: "-",
      time: "-",
      message: "Kanvas kosong. Tambahkan perangkat dari kotak alat di bawah, lalu pasang kabel."
    };
  }

  function initCliHistories() {
    Object.keys(state.nodes).forEach(id => {
      const dev = state.nodes[id];
      if (!state.cliHistory[id]) {
        if (dev.type === "pc" || dev.type === "laptop") {
          state.cliHistory[id] = [
            "Microsoft Windows [Version 10.0.19045.3803]",
            "(c) Cisco Packet Tracer Emulation Suite. All rights reserved.",
            "",
            `C:\\> rem Perangkat: ${dev.name} (${dev.model})`,
            "C:\\> ipconfig",
            `   IPv4 Address. . . . . . . . . . . : ${dev.ip}`,
            `   Subnet Mask . . . . . . . . . . . : ${dev.mask}`,
            `   Default Gateway . . . . . . . . . : ${dev.gateway}`,
            "",
            "C:\\> _"
          ];
        } else if (dev.type === "server") {
          state.cliHistory[id] = [
            "Linux netlearn-server 5.15.0-generic #1 SMP x86_64",
            "HTTP Web Server Service (port 80): RUNNING",
            "DNS Server Service (port 53): RUNNING",
            "",
            `root@${dev.name.toLowerCase()}:~# ip addr show eth0`,
            `inet ${dev.ip}/24 brd 255.255.255.255 scope global eth0`,
            "",
            `root@${dev.name.toLowerCase()}:~# _`
          ];
        } else if (dev.type === "switch") {
          state.cliHistory[id] = [
            "Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4",
            "Technical Support: http://www.cisco.com/techsupport",
            "",
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
          ];
          state.cliState[id] = { mode: "priv", iface: "" };
        } else if (dev.type === "router") {
          state.cliHistory[id] = [
            "Cisco IOS Software, 2900 Software (C2900-UNIVERSALK9-M), Version 15.1(4)M4",
            "Technical Support: http://www.cisco.com/techsupport",
            "",
            "Router> enable",
            "Router# show ip interface brief",
            "Interface              IP-Address      OK? Method Status                Protocol",
            `GigabitEthernet0/0/0   ${dev.ip}     YES manual up                    up`,
            `GigabitEthernet0/0/1   ${dev.ip2 || "10.10.20.1"}      YES manual up                    up`,
            "",
            "Router# show ip route",
            "Codes: C - connected, S - static, R - RIP",
            "C    192.168.1.0/24 is directly connected, GigabitEthernet0/0/0",
            "C    10.10.20.0/24 is directly connected, GigabitEthernet0/0/1",
            "",
            "Router# _"
          ];
          state.cliState[id] = { mode: "priv", iface: "" };
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // Network Pathfinding
  // --------------------------------------------------------------------------
  function findPathBetween(srcId, dstId) {
    if (srcId === dstId) return [srcId];
    const visited = new Set([srcId]);
    const queue = [[srcId]];

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];

      if (curr === dstId) return path;

      const neighbors = [];
      state.links.forEach(l => {
        if (l.fromNode === curr && !visited.has(l.toNode)) {
          neighbors.push(l.toNode);
        } else if (l.toNode === curr && !visited.has(l.fromNode)) {
          neighbors.push(l.fromNode);
        }
      });

      for (const n of neighbors) {
        visited.add(n);
        queue.push([...path, n]);
      }
    }
    return null;
  }

  function ipToInt(ip) {
    if (!ip) return 0;
    return ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  function isSameSubnet(ipA, ipB, mask) {
    if (!ipA || !ipB || !mask) return false;
    const a = ipToInt(ipA);
    const b = ipToInt(ipB);
    const m = ipToInt(mask);
    return (a & m) === (b & m);
  }

  function prepareSimulationSteps(srcId, dstId) {
    const src = state.nodes[srcId];
    const dst = state.nodes[dstId];

    if (!src || !dst) {
      return { ok: false, reason: "Perangkat sumber atau tujuan tidak valid." };
    }

    if (!src.poweredOn) return { ok: false, reason: `Daya ${src.name} mati (Power OFF)` };
    if (!dst.poweredOn) return { ok: false, reason: `Daya ${dst.name} mati (Power OFF)` };

    const path = findPathBetween(srcId, dstId);
    if (!path || path.length < 2) {
      return { ok: false, reason: `Tidak ada kabel fisik yang menghubungkan ${src.name} ke ${dst.name}` };
    }

    const sameSub = isSameSubnet(src.ip, dst.ip, src.mask);
    const hasRouter = path.some(nid => state.nodes[nid]?.type === "router");

    if (!sameSub && !hasRouter) {
      return { ok: false, reason: `${src.name} dan ${dst.name} berada pada subnet berbeda tanpa Router` };
    }

    const returnPath = [...path];
    for (let i = path.length - 2; i >= 0; i--) {
      returnPath.push(path[i]);
    }

    const steps = [];
    let stepNum = 1;
    let t = 0.0;

    for (let i = 0; i < returnPath.length; i++) {
      const dev = state.nodes[returnPath[i]];
      const isReturn = i >= path.length;
      const isTarget = i === path.length - 1;

      steps.push({
        step: stepNum++,
        time: `${t.toFixed(3)}s`,
        lastDevice: i === 0 ? src.name : state.nodes[returnPath[i - 1]].name,
        atDevice: dev.name,
        nodeId: dev.id,
        type: i <= 1 ? "ARP" : "ICMP",
        color: isTarget ? "#10b981" : (isReturn ? "#10b981" : "#f59e0b"),
        info: isTarget 
          ? `${dev.name} menerima Echo Request dan membalas ICMP Echo Reply` 
          : (isReturn && i === returnPath.length - 1 
              ? `Ping Selesai: ${src.name} menerima balasan 32 bytes time=0.82ms TTL=63 (Sukses 100%)` 
              : `Paket transit di ${dev.name} menuju ${dst.name}`),
        pduLayer: isReturn && i === returnPath.length - 1 ? 7 : (isTarget ? 4 : 3),
        osiInfo: {
          l7: isReturn && i === returnPath.length - 1 ? "Application: Ping Selesai 100% SUKSES" : "Application: ICMP Utility",
          l4: isTarget || isReturn ? "Transport: ICMP Type 0 Echo Reply" : "Transport: ICMP Type 8 Echo Request",
          l3: `Network: IPv4 Header (Src: ${src.ip}, Dst: ${dst.ip})`,
          l2: `Ethernet II: Frame aktif di ${dev.name}`,
          l1: "Physical: FastEthernet / Gigabit Link"
        },
        explanation: `${dev.name} memproses frame data dan meneruskannya ke tujuan.`
      });
      t += 0.008;
    }

    state.simulationSteps = steps;
    state.currentStepIndex = 0;
    return { ok: true, path: returnPath };
  }

  // --------------------------------------------------------------------------
  // Send Packet: Unlimited & Free Anywhere!
  // --------------------------------------------------------------------------
  function sendPacket(srcId, dstId) {
    state.packetCounter++;

    // Fallbacks if not provided
    if (!srcId) {
      srcId = document.getElementById("sel-pdu-source")?.value || Object.keys(state.nodes)[0];
    }
    if (!dstId) {
      dstId = document.getElementById("sel-pdu-target")?.value || Object.keys(state.nodes)[1];
    }

    const src = state.nodes[srcId];
    const dst = state.nodes[dstId];

    if (!src || !dst) {
      alert("Pilih setidaknya 2 perangkat di kanvas untuk mengirim paket.");
      return;
    }

    sound.click();
    const result = prepareSimulationSteps(srcId, dstId);

    if (result.ok) {
      state.lastPduResult = {
        status: "Successful",
        source: src.name,
        target: dst.name,
        type: `ICMP #${state.packetCounter}`,
        time: "0.82 ms",
        message: `Koneksi sukses! Paket #${state.packetCounter} terkirim dari ${src.name} ke ${dst.name} dan diterima balik.`
      };

      // Add to Flying Packets Queue
      state.activePackets.push({
        id: `pkt_${Date.now()}_${Math.random().toString(36).slice(-3)}`,
        pathNodes: result.path,
        legIndex: 0,
        progress: 0,
        speed: state.mode === "realtime" ? 0.045 : 0.02,
        color: "#f59e0b",
        label: `ICMP`
      });

      // Update CLI history
      const hist = state.cliHistory[src.id];
      if (hist) {
        hist.push(
          `C:\\> ping ${dst.ip}`,
          `Pinging ${dst.ip} with 32 bytes of data:`,
          `Reply from ${dst.ip}: bytes=32 time=0.82ms TTL=63`,
          `Reply from ${dst.ip}: bytes=32 time=0.79ms TTL=63`,
          `Reply from ${dst.ip}: bytes=32 time=0.81ms TTL=63`,
          `Reply from ${dst.ip}: bytes=32 time=0.84ms TTL=63`,
          `Ping statistics for ${dst.ip}: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`
        );
      }
    } else {
      state.lastPduResult = {
        status: "Failed",
        source: src.name,
        target: dst.name,
        type: `ICMP #${state.packetCounter}`,
        time: "0.00 ms",
        message: `Gagal: ${result.reason}`
      };

      // Create a short failure flight
      state.activePackets.push({
        id: `pkt_err_${Date.now()}`,
        pathNodes: [srcId, srcId],
        legIndex: 0,
        progress: 0,
        speed: 0.05,
        color: "#ef4444",
        label: "ERR",
        isFailed: true
      });

      sound.error();
    }

    updateDomStatus();
    updateEventListDom();
  }

  // --------------------------------------------------------------------------
  // Port Selection Dialog Modal for Wiring
  // --------------------------------------------------------------------------
  function openPortPicker(node, callback) {
    const modal = document.getElementById("cisco-port-modal");
    if (!modal) {
      callback(node.ports[0]);
      return;
    }

    // Determine port occupancy
    const occupiedPorts = {};
    state.links.forEach(l => {
      if (l.fromNode === node.id) occupiedPorts[l.fromPort] = state.nodes[l.toNode]?.name || "Perangkat Lain";
      if (l.toNode === node.id) occupiedPorts[l.toPort] = state.nodes[l.fromNode]?.name || "Perangkat Lain";
    });

    modal.classList.remove("hidden");
    modal.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-scale-up text-left font-mono">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[18px]">settings_ethernet</span>
            </span>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pilih Port Fisik</span>
              <h3 class="text-xs font-bold text-slate-900">${node.name} (${node.model})</h3>
            </div>
          </div>
          <button id="btn-close-port-picker" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p class="text-xs text-slate-600 font-sans">
          Pilih salah satu port kabel yang tersedia di <strong>${node.name}</strong>:
        </p>

        <div class="space-y-1.5 max-h-56 overflow-y-auto">
          ${node.ports.map(portName => {
            const connectedTo = occupiedPorts[portName];
            const isOccupied = !!connectedTo;
            return `
              <button class="w-full text-left p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${isOccupied ? 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-800 cursor-pointer shadow-2xs'}" data-port="${portName}" ${isOccupied ? 'disabled' : ''}>
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
                  <span class="font-bold">${portName}</span>
                </div>
                <span class="text-[9px] px-1.5 py-0.5 rounded ${isOccupied ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                  ${isOccupied ? `Terpakai: ${connectedTo}` : 'Tersedia'}
                </span>
              </button>
            `;
          }).join("")}
        </div>

        <button id="btn-cancel-port-picker" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
          Batal
        </button>
      </div>
    `;

    const close = () => {
      modal.classList.add("hidden");
    };

    document.getElementById("btn-close-port-picker")?.addEventListener("click", () => {
      close();
      state.cablePending = null;
      updateActiveToolDom();
    });

    document.getElementById("btn-cancel-port-picker")?.addEventListener("click", () => {
      close();
      state.cablePending = null;
      updateActiveToolDom();
    });

    modal.querySelectorAll("button[data-port]").forEach(btn => {
      btn.addEventListener("click", () => {
        const chosen = btn.dataset.port;
        close();
        callback(chosen);
      });
    });
  }

  // --------------------------------------------------------------------------
  // Mount DOM Once
  // --------------------------------------------------------------------------
  function mountUI() {
    container.innerHTML = `
      <div id="cisco-workbench-root" class="space-y-4 text-left font-sans select-none bg-slate-50 p-1 sm:p-2.5 rounded-2xl">
        
        <!-- Top Toolbar (Clean, Streamlined & Cisco-Accurate) -->
        <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          
          <!-- Mode & Continuous Ping Controls -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>⚡ Mode Realtime</span>
            </span>

            <!-- Loop Ping (Continuous Animation Stream) -->
            <button id="btn-toggle-loop-ping" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs" title="Nyalakan/matikan animasi pengiriman paket berkelanjutan tanpa henti">
              <span class="material-symbols-outlined text-[16px] text-amber-500">autorenew</span>
              <span id="label-loop-ping">Loop Ping: OFF</span>
            </button>

            <!-- Route Selector for Ping / Loop Ping -->
            <div class="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-mono">
              <span class="text-slate-400 font-bold pl-1">Rute:</span>
              <select id="sel-pdu-source" class="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-indigo-700 cursor-pointer"></select>
              <span class="text-slate-400 font-bold">➔</span>
              <select id="sel-pdu-target" class="bg-white px-2 py-1 rounded border border-slate-200 font-bold text-emerald-700 cursor-pointer"></select>
            </div>
          </div>

          <!-- Quick Actions, Fullscreen & Templates -->
          <div class="flex items-center gap-2 flex-wrap">
            
            <!-- Fullscreen Button -->
            <button id="btn-toggle-fullscreen" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs" title="Mode Layar Penuh (Fullscreen)">
              <span class="material-symbols-outlined text-[16px]">fullscreen</span>
              <span id="label-fullscreen">Fullscreen</span>
            </button>

            <!-- Inspect Selected Device -->
            <button id="btn-inspect-selected" class="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer">
              <span class="material-symbols-outlined text-[16px] text-slate-600">settings</span>
              <span id="label-inspect-selected">Konfigurasi: PC0</span>
            </button>

            <!-- Template Menu -->
            <div class="dropdown relative inline-block">
              <button id="btn-template-dropdown" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[16px] text-indigo-600">folder_open</span>
                <span>Template</span>
                <span class="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
              <div id="template-menu" class="hidden absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 text-xs font-mono">
                <button id="btn-tpl-standard" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center gap-2 text-slate-700 cursor-pointer">
                  <span class="material-symbols-outlined text-indigo-600 text-[18px]">account_tree</span>
                  <div>
                    <div class="font-bold">1. Lab Standar TKJ</div>
                    <div class="text-[10px] text-slate-400">PC - Switch - Router - Server</div>
                  </div>
                </button>
                <button id="btn-tpl-star" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center gap-2 text-slate-700 cursor-pointer">
                  <span class="material-symbols-outlined text-emerald-600 text-[18px]">hub</span>
                  <div>
                    <div class="font-bold">2. Lab Star LAN</div>
                    <div class="text-[10px] text-slate-400">2 PC + Switch + Server</div>
                  </div>
                </button>
                <button id="btn-tpl-p2p" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center gap-2 text-slate-700 cursor-pointer">
                  <span class="material-symbols-outlined text-amber-600 text-[18px]">swap_horiz</span>
                  <div>
                    <div class="font-bold">3. Lab Peer-to-Peer</div>
                    <div class="text-[10px] text-slate-400">PC ke PC (Cross-Over)</div>
                  </div>
                </button>
                <div class="border-t border-slate-100 my-1"></div>
                <button id="btn-tpl-clear" class="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer">
                  <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                  <div>
                    <div class="font-bold">Bersihkan Kanvas (Mulai Dari Awal)</div>
                    <div class="text-[10px] text-rose-400">Hapus semua perangkat</div>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Canvas Workspace -->
        <div class="relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 select-none h-[340px] sm:h-[420px] md:h-[480px]" id="cisco-canvas-wrapper">
          <canvas id="cisco-canvas" class="w-full h-full block cursor-crosshair"></canvas>

          <!-- Floating Guidance Banner -->
          <div class="absolute top-3 left-3 flex items-center gap-2 z-10 flex-wrap pointer-events-none">
            <div id="canvas-guidance-pill" class="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-200 flex items-center gap-2 shadow-lg">
              <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span id="canvas-guidance-text">Klik perangkat untuk memilih, seret untuk memindahkan posisi</span>
            </div>
          </div>

          <!-- Bottom-Right Cisco Status Card -->
          <div class="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-700 px-3.5 py-2.5 rounded-xl text-left font-mono text-[10px] sm:text-[11px] shadow-2xl max-w-xs z-10">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1 gap-4">
              <span class="text-slate-400 font-bold uppercase tracking-wider">Cisco PDU Status</span>
              <span id="badge-pdu-status" class="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                Successful
              </span>
            </div>
            <div id="text-pdu-route" class="text-slate-200 truncate font-bold">
              PC0 ➔ Server0 (ICMP)
            </div>
            <div id="text-pdu-message" class="text-slate-400 text-[10px] mt-0.5 leading-tight">
              Koneksi end-to-end normal (4 sent, 4 received, 0% loss).
            </div>
          </div>
        </div>

        <!-- Cisco Device Palette Box -->
        <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <h3 class="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-indigo-600">developer_board</span>
                <span>Kotak Alat &amp; Perangkat Cisco (Device Palette Box)</span>
              </h3>
            </div>
            <span class="text-[10px] sm:text-[11px] font-mono text-slate-500">
              Pilih alat kabel untuk menyambungkan port, atau klik ikon untuk menambah perangkat baru
            </span>
          </div>

          <!-- Palette Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            
            <!-- Category 1: Kursor & Alat PDU -->
            <div class="lg:col-span-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div class="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Mode Kursor / Alat</div>
              <div class="grid grid-cols-3 gap-1.5">
                <button id="tool-select" class="tool-btn p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer bg-indigo-600 text-white border-indigo-700 shadow-xs" data-tool="select">
                  <span class="material-symbols-outlined text-[18px]">near_me</span>
                  <span class="text-[10px]">Pilih/Geser</span>
                </button>
                <button id="tool-pdu" class="tool-btn p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100" data-tool="pdu" title="Kirim PDU Bebas: Klik perangkat sumber, lalu klik perangkat tujuan">
                  <span class="material-symbols-outlined text-[18px] text-amber-500">mail</span>
                  <span class="text-[10px]">Kirim PDU</span>
                </button>
                <button id="tool-delete" class="tool-btn p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100" data-tool="delete" title="Klik perangkat atau kabel untuk menghapus">
                  <span class="material-symbols-outlined text-[18px] text-rose-600">delete</span>
                  <span class="text-[10px]">Hapus</span>
                </button>
              </div>
            </div>

            <!-- Category 2: Kabel Jaringan -->
            <div class="lg:col-span-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div class="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Sambung Kabel Jaringan</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button id="tool-cable-straight" class="tool-btn p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100" data-tool="cable-straight" title="Kabel Straight-Through (Pilih Port Asal & Port Tujuan)">
                  <span class="material-symbols-outlined text-[18px] text-cyan-600">horizontal_rule</span>
                  <span class="text-[10px]">Straight-Through</span>
                </button>
                <button id="tool-cable-cross" class="tool-btn p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100" data-tool="cable-cross" title="Kabel Cross-Over (Koneksi perangkat sejenis)">
                  <span class="material-symbols-outlined text-[18px] text-amber-600">linear_scale</span>
                  <span class="text-[10px]">Cross-Over</span>
                </button>
              </div>
            </div>

            <!-- Category 3: Hardware Nodes Palette -->
            <div class="lg:col-span-6 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div class="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Tambah Perangkat Cisco &amp; Host</div>
              <div class="grid grid-cols-6 gap-1.5">
                <button class="btn-add-device p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 font-mono text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs" data-type="pc">
                  <span class="material-symbols-outlined text-[20px] text-indigo-600">laptop</span>
                  <span>+ PC</span>
                </button>
                <button class="btn-add-device p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 font-mono text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs" data-type="laptop">
                  <span class="material-symbols-outlined text-[20px] text-indigo-600">laptop_chromebook</span>
                  <span>+ Laptop</span>
                </button>
                <button class="btn-add-device p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 font-mono text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs" data-type="server">
                  <span class="material-symbols-outlined text-[20px] text-indigo-600">dns</span>
                  <span>+ Server</span>
                </button>
                <button class="btn-add-device p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 font-mono text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs" data-type="switch">
                  <span class="material-symbols-outlined text-[20px] text-cyan-600">hub</span>
                  <span>+ Switch</span>
                </button>
                <button class="btn-add-device p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 font-mono text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs" data-type="router">
                  <span class="material-symbols-outlined text-[20px] text-emerald-600">router</span>
                  <span>+ Router</span>
                </button>
                <button class="btn-add-device p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 font-mono text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer shadow-2xs" data-type="hub">
                  <span class="material-symbols-outlined text-[20px] text-amber-600">device_hub</span>
                  <span>+ Hub</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Event List Panel -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 class="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-indigo-600">list_alt</span>
                <span>Daftar Peristiwa Transmisi (Cisco Event List Panel)</span>
              </h3>
            </div>
            <span class="text-[11px] font-mono text-slate-500">Klik baris peristiwa untuk membedah <strong>Model OSI 7-Layer</strong></span>
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
              <tbody id="event-list-tbody" class="divide-y divide-slate-100">
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modals -->
        <div id="cisco-port-modal" class="hidden fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"></div>
        <div id="cisco-pdu-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"></div>
        <div id="cisco-device-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"></div>

      </div>
    `;

    setupEventListeners();
    setupCanvas();
    loadStandardTemplate();
    updateDomStatus();
    updateEventListDom();
  }

  // --------------------------------------------------------------------------
  // Update DOM Elements Dynamically
  // --------------------------------------------------------------------------
  function updateDomStatus() {
    const badge = document.getElementById("badge-pdu-status");
    const route = document.getElementById("text-pdu-route");
    const msg = document.getElementById("text-pdu-message");
    const inspectBtn = document.getElementById("label-inspect-selected");

    if (badge) {
      badge.textContent = state.lastPduResult.status;
      badge.className = `px-1.5 py-0.5 rounded text-[9px] font-extrabold ${state.lastPduResult.status === 'Successful' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : (state.lastPduResult.status === 'Failed' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-300')}`;
    }
    if (route) route.textContent = `${state.lastPduResult.source} ➔ ${state.lastPduResult.target} (${state.lastPduResult.type})`;
    if (msg) msg.textContent = state.lastPduResult.message;

    if (inspectBtn) {
      const dev = state.nodes[state.selectedDeviceId];
      inspectBtn.textContent = dev ? `Konfigurasi: ${dev.name}` : "Konfigurasi Perangkat";
    }

    // Populate dropdowns with ALL devices
    const selSrc = document.getElementById("sel-pdu-source");
    const selDst = document.getElementById("sel-pdu-target");
    if (selSrc && selDst) {
      const currentSrcVal = selSrc.value || Object.keys(state.nodes)[0];
      const currentDstVal = selDst.value || Object.keys(state.nodes)[1];

      const nodeIds = Object.keys(state.nodes);
      selSrc.innerHTML = nodeIds.map(id => `<option value="${id}" ${id === currentSrcVal ? 'selected' : ''}>${state.nodes[id].name}</option>`).join("");
      selDst.innerHTML = nodeIds.map(id => `<option value="${id}" ${id === currentDstVal ? 'selected' : ''}>${state.nodes[id].name}</option>`).join("");
    }
  }

  function updateActiveToolDom() {
    container.querySelectorAll(".tool-btn").forEach(btn => {
      const t = btn.dataset.tool;
      if (t === state.activeTool) {
        btn.className = "tool-btn p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer bg-indigo-600 text-white border-indigo-700 shadow-xs";
      } else {
        btn.className = "tool-btn p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100";
      }
    });

    const guideText = document.getElementById("canvas-guidance-text");
    if (guideText) {
      if (state.activeTool === "select") {
        guideText.textContent = "Kursor: Klik perangkat untuk memilih, seret untuk memindahkan posisi, klik 2x untuk membuka konfigurasi";
      } else if (state.activeTool === "cable-straight" || state.activeTool === "cable-cross") {
        if (!state.cablePending) {
          guideText.textContent = `Sambung Kabel: Klik perangkat PERTAMA (asal) untuk memilih port ${state.activeTool === 'cable-cross' ? 'Cross-Over' : 'Straight'}`;
        } else {
          guideText.textContent = `Kabel terpasang di ${state.nodes[state.cablePending.fromNodeId]?.name} (${state.cablePending.fromPort}). Klik perangkat KEDUA untuk memilih port tujuan!`;
        }
      } else if (state.activeTool === "pdu") {
        if (!state.pduPendingSource) {
          guideText.textContent = "Kirim PDU: Klik perangkat SUMBER (pengirim paket)";
        } else {
          guideText.textContent = `Sumber: ${state.nodes[state.pduPendingSource]?.name}. Sekarang klik perangkat TUJUAN mana saja untuk mengirim paket!`;
        }
      } else if (state.activeTool === "delete") {
        guideText.textContent = "Alat Hapus: Klik perangkat atau kabel untuk menghapusnya dari kanvas";
      }
    }
  }

  function updateEventListDom() {
    const tbody = document.getElementById("event-list-tbody");
    if (!tbody) return;

    if (state.simulationSteps.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-6 text-center text-slate-400 font-sans text-xs">
            Belum ada paket yang dikirim. Gunakan alat <strong>Kirim PDU (Amplop)</strong> di bawah atau aktifkan <strong>Loop Ping</strong> di atas untuk memulai transmisi.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.simulationSteps.map((s, idx) => {
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
    }).join("");

    tbody.querySelectorAll(".event-row").forEach(row => {
      row.addEventListener("click", () => {
        const stepIdx = parseInt(row.dataset.step, 10);
        openPduModal(stepIdx);
      });
    });
  }

  // --------------------------------------------------------------------------
  // Event Listeners Setup
  // --------------------------------------------------------------------------
  function setupEventListeners() {
    // Loop Ping (Continuous Ping Stream) Toggle
    document.getElementById("btn-toggle-loop-ping")?.addEventListener("click", () => {
      state.isLoopPing = !state.isLoopPing;
      const btn = document.getElementById("btn-toggle-loop-ping");
      const label = document.getElementById("label-loop-ping");

      if (state.isLoopPing) {
        sound.success();
        btn?.classList.remove("bg-slate-100", "text-slate-700");
        btn?.classList.add("bg-amber-500", "text-slate-950", "border-amber-600");
        if (label) label.textContent = "Loop Ping: ON";

        const triggerContinuousPing = () => {
          if (!state.isLoopPing) return;
          const nodeKeys = Object.keys(state.nodes);
          if (nodeKeys.length >= 2) {
            const srcId = document.getElementById("sel-pdu-source")?.value || nodeKeys[0];
            const dstId = document.getElementById("sel-pdu-target")?.value || nodeKeys[nodeKeys.length - 1];
            sendPacket(srcId, dstId);
          }
        };

        triggerContinuousPing();
        if (state.loopPingTimer) clearInterval(state.loopPingTimer);
        state.loopPingTimer = setInterval(triggerContinuousPing, 1400);
      } else {
        sound.click();
        if (state.loopPingTimer) {
          clearInterval(state.loopPingTimer);
          state.loopPingTimer = null;
        }
        btn?.classList.remove("bg-amber-500", "text-slate-950", "border-amber-600");
        btn?.classList.add("bg-slate-100", "text-slate-700");
        if (label) label.textContent = "Loop Ping: OFF";
      }
    });

    // Fullscreen Toggle
    document.getElementById("btn-toggle-fullscreen")?.addEventListener("click", () => {
      const target = document.getElementById("cisco-workbench-root") || container;
      if (!document.fullscreenElement) {
        if (target.requestFullscreen) {
          target.requestFullscreen().catch(() => {});
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const isFs = !!document.fullscreenElement;
      const label = document.getElementById("label-fullscreen");
      if (label) label.textContent = isFs ? "Keluar Fullscreen" : "Fullscreen";
      const canvas = document.getElementById("cisco-canvas");
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    });

    // Inspect selected
    document.getElementById("btn-inspect-selected")?.addEventListener("click", () => {
      if (state.selectedDeviceId) openDeviceModal(state.selectedDeviceId);
    });

    // Template Dropdown
    const tplDropdownBtn = document.getElementById("btn-template-dropdown");
    const tplMenu = document.getElementById("template-menu");
    tplDropdownBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      tplMenu?.classList.toggle("hidden");
    });
    tplMenu?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    window.addEventListener("click", () => {
      tplMenu?.classList.add("hidden");
    });

    const closeTplMenu = () => tplMenu?.classList.add("hidden");

    document.getElementById("btn-tpl-standard")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTplMenu();
      loadStandardTemplate();
      sound.success();
      updateDomStatus();
      updateEventListDom();
    });

    document.getElementById("btn-tpl-star")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTplMenu();
      loadStarLanTemplate();
      sound.success();
      updateDomStatus();
      updateEventListDom();
    });

    document.getElementById("btn-tpl-p2p")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTplMenu();
      loadPeerToPeerTemplate();
      sound.success();
      updateDomStatus();
      updateEventListDom();
    });

    document.getElementById("btn-tpl-clear")?.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTplMenu();
      clearCanvas();
      sound.click();
      updateDomStatus();
      updateEventListDom();
    });

    // Tool Buttons
    container.querySelectorAll(".tool-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeTool = btn.dataset.tool;
        state.cablePending = null;
        state.pduPendingSource = null;
        sound.click();
        updateActiveToolDom();
      });
    });

    // Add device buttons
    container.querySelectorAll(".btn-add-device").forEach(btn => {
      btn.addEventListener("click", () => {
        addDevice(btn.dataset.type);
      });
    });
  }

  function addDevice(type) {
    const spec = DEVICE_TYPES[type];
    if (!spec) return;

    sound.click();
    const count = Object.values(state.nodes).filter(n => n.type === type).length;
    const newId = `${type}_${Date.now().toString(36).slice(-4)}`;
    const name = `${spec.prefix}${count}`;

    const canvas = document.getElementById("cisco-canvas");
    const maxW = (canvas && canvas.width > 260) ? canvas.width : 760;
    const maxH = (canvas && canvas.height > 200) ? canvas.height : 420;

    const currentCount = Object.keys(state.nodes).length;
    const cols = maxW > 540 ? 5 : 3;
    const spacingX = maxW > 540 ? 115 : 85;
    const posX = Math.max(50, Math.min(maxW - 55, 65 + (currentCount % cols) * spacingX));
    const posY = Math.max(50, Math.min(maxH - 50, 75 + Math.floor(currentCount / cols) * 105));

    const baseOctet = 10 + currentCount;
    const ip = type === "router" ? "192.168.1.1" : (type === "server" ? "10.10.20.50" : `192.168.1.${baseOctet}`);

    state.nodes[newId] = {
      id: newId,
      name: name,
      type: type,
      model: spec.model,
      icon: spec.icon,
      ports: [...spec.ports],
      ip: ip,
      mask: spec.defaultMask,
      gateway: spec.defaultGateway,
      dns: "8.8.8.8",
      mac: `00:PT:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${count + 1}`,
      poweredOn: true,
      x: posX,
      y: posY
    };

    initCliHistories();
    state.selectedDeviceId = newId;
    updateDomStatus();
  }

  // --------------------------------------------------------------------------
  // Canvas Engine with Wiring Port Selection & 60FPS Flight Animation
  // --------------------------------------------------------------------------
  function setupCanvas() {
    const canvas = document.getElementById("cisco-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let isDragging = false;
    let draggedNodeId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        // Keep existing nodes within boundaries so they don't get pushed off-screen
        Object.values(state.nodes).forEach(n => {
          n.x = Math.max(50, Math.min(canvas.width - 50, n.x));
          n.y = Math.max(45, Math.min(canvas.height - 45, n.y));
        });
      }
    };
    resize();
    window.addEventListener("resize", resize);

    function getCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (cx - rect.left) * (canvas.width / rect.width),
        y: (cy - rect.top) * (canvas.height / rect.height)
      };
    }

    function findNodeAt(x, y) {
      const hitRadius = 45;
      for (const node of Object.values(state.nodes)) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius) return node;
      }
      return null;
    }

    // Pointer Down
    const handleDown = (e) => {
      const pos = getCoords(e);
      const clicked = findNodeAt(pos.x, pos.y);

      // 1. DELETE TOOL
      if (state.activeTool === "delete") {
        if (clicked) {
          sound.click();
          state.links = state.links.filter(l => l.fromNode !== clicked.id && l.toNode !== clicked.id);
          delete state.nodes[clicked.id];
          if (state.selectedDeviceId === clicked.id) state.selectedDeviceId = null;
          updateDomStatus();
        }
        return;
      }

      // 2. CABLE TOOLS (Choose Ports on Both Devices!)
      if (state.activeTool === "cable-straight" || state.activeTool === "cable-cross") {
        if (clicked) {
          const cableType = state.activeTool === "cable-cross" ? "cross" : "straight";

          if (!state.cablePending) {
            // Step 1: Open Port Picker for Source Node
            sound.click();
            openPortPicker(clicked, (chosenPort) => {
              state.cablePending = {
                fromNodeId: clicked.id,
                fromPort: chosenPort,
                cableType: cableType
              };
              updateActiveToolDom();
            });
          } else {
            // Step 2: Open Port Picker for Destination Node & Connect!
            if (clicked.id === state.cablePending.fromNodeId) {
              alert("Tidak dapat menghubungkan kabel ke perangkat yang sama.");
              return;
            }

            sound.click();
            openPortPicker(clicked, (chosenPort) => {
              const srcDev = state.nodes[state.cablePending.fromNodeId];
              state.links.push({
                id: `link_${Date.now().toString(36)}`,
                fromNode: state.cablePending.fromNodeId,
                fromPort: state.cablePending.fromPort,
                toNode: clicked.id,
                toPort: chosenPort,
                cableType: state.cablePending.cableType,
                status: "up"
              });

              sound.success();
              state.cablePending = null;
              state.activeTool = "select";
              updateActiveToolDom();
              updateDomStatus();

              const guideText = document.getElementById("canvas-guidance-text");
              if (guideText) {
                guideText.textContent = `✓ Kabel terhubung antara ${srcDev?.name} dan ${clicked.name}. Mode kembali ke Kursor. Klik ikon kabel lagi untuk menambah sambungan.`;
              }
            });
          }
        }
        return;
      }

      // 3. PDU TOOL (Send PDU freely anywhere!)
      if (state.activeTool === "pdu") {
        if (clicked) {
          if (!state.pduPendingSource) {
            state.pduPendingSource = clicked.id;
            sound.click();
            updateActiveToolDom();
          } else {
            const srcId = state.pduPendingSource;
            const dstId = clicked.id;
            state.pduPendingSource = null;
            sendPacket(srcId, dstId);
            updateActiveToolDom();
          }
        }
        return;
      }

      // 4. SELECT TOOL (Drag to Move & Select)
      if (clicked) {
        state.selectedDeviceId = clicked.id;
        isDragging = true;
        draggedNodeId = clicked.id;
        dragOffsetX = pos.x - clicked.x;
        dragOffsetY = pos.y - clicked.y;
        updateDomStatus();
      } else {
        state.selectedDeviceId = null;
        updateDomStatus();
      }
    };

    // Pointer Move
    const handleMove = (e) => {
      const pos = getCoords(e);
      state.pointerPos.x = pos.x;
      state.pointerPos.y = pos.y;
      state.pointerPos.active = true;

      if (isDragging && draggedNodeId && state.nodes[draggedNodeId]) {
        state.nodes[draggedNodeId].x = Math.max(45, Math.min(canvas.width - 45, pos.x - dragOffsetX));
        state.nodes[draggedNodeId].y = Math.max(45, Math.min(canvas.height - 45, pos.y - dragOffsetY));
      }
    };

    // Pointer Up
    const handleUp = () => {
      isDragging = false;
      draggedNodeId = null;
    };

    canvas.addEventListener("dblclick", (e) => {
      const pos = getCoords(e);
      const clicked = findNodeAt(pos.x, pos.y);
      if (clicked) openDeviceModal(clicked.id);
    });

    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleDown(e);
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      handleMove(e);
    }, { passive: false });

    window.addEventListener("touchend", handleUp);

    // ------------------------------------------------------------------------
    // 60FPS Continuous Animation Loop
    // ------------------------------------------------------------------------
    function animationLoop() {
      renderCanvasFrame(ctx, canvas.width, canvas.height);
      animFrameId = requestAnimationFrame(animationLoop);
    }
    animationLoop();
  }

  // --------------------------------------------------------------------------
  // Render Canvas Frame
  // --------------------------------------------------------------------------
  function renderCanvasFrame(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // 1. Grid
    ctx.fillStyle = "#0a0f1d";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Cables
    state.links.forEach(l => {
      const n1 = state.nodes[l.fromNode];
      const n2 = state.nodes[l.toNode];
      if (n1 && n2) {
        drawCableLine(ctx, n1.x, n1.y, n2.x, n2.y, l.cableType, l.fromPort, l.toPort);
      }
    });

    // 3. Live Rubberband Cable (from source port to pointer)
    if (state.cablePending && state.pointerPos.active) {
      const srcNode = state.nodes[state.cablePending.fromNodeId];
      if (srcNode) {
        ctx.save();
        ctx.strokeStyle = state.cablePending.cableType === "cross" ? "#f59e0b" : "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(srcNode.x, srcNode.y);
        ctx.lineTo(state.pointerPos.x, state.pointerPos.y);
        ctx.stroke();

        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(srcNode.x, srcNode.y, 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Hardware Devices
    Object.values(state.nodes).forEach(n => {
      drawDeviceBox(ctx, n.x, n.y, n);
    });

    // 5. Active Flying Packets (Render all concurrent/repeated packets!)
    updateAndDrawPackets(ctx);
  }

  function drawCableLine(ctx, x1, y1, x2, y2, cableType, port1, port2) {
    ctx.save();
    const isCross = cableType === "cross";
    ctx.strokeStyle = isCross ? "#f59e0b" : "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.setLineDash(isCross ? [8, 5] : []);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Link Lights
    ctx.fillStyle = "#10b981";
    drawLinkTriangle(ctx, x1 + (x2 - x1) * 0.16, y1 + (y2 - y1) * 0.16, true);
    drawLinkTriangle(ctx, x2 - (x2 - x1) * 0.16, y2 - (y2 - y1) * 0.16, false);

    // Port labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(port1 || "", x1 + (x2 - x1) * 0.22, y1 + (y2 - y1) * 0.22 - 6);
    ctx.fillText(port2 || "", x2 - (x2 - x1) * 0.22, y2 - (y2 - y1) * 0.22 - 6);
    ctx.restore();
  }

  function drawLinkTriangle(ctx, x, y, isForward) {
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

  function drawDeviceBox(ctx, x, y, node) {
    ctx.save();

    const isSelected = node.id === state.selectedDeviceId;
    const isCableSource = state.cablePending && state.cablePending.fromNodeId === node.id;
    const isPduSource = state.pduPendingSource === node.id;

    const cardW = 88;
    const cardH = 76;
    const halfW = cardW / 2;
    const halfH = cardH / 2;
    const radius = 10;

    if (isSelected || isCableSource || isPduSource) {
      ctx.shadowColor = isCableSource ? "#38bdf8" : (isPduSource ? "#f59e0b" : "#6366f1");
      ctx.shadowBlur = 16;
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = isCableSource ? "#38bdf8" : (isPduSource ? "#f59e0b" : (isSelected ? "#6366f1" : "rgba(148, 163, 184, 0.35)"));
    ctx.lineWidth = isSelected || isCableSource || isPduSource ? 2.5 : 1.5;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - halfW, y - halfH, cardW, cardH, radius) : ctx.rect(x - halfW, y - halfH, cardW, cardH);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Power LED
    ctx.fillStyle = node.poweredOn ? "#10b981" : "#ef4444";
    ctx.beginPath();
    ctx.arc(x + 33, y - 25, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Device Glyph Icon
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    const symbol = node.type === "switch" ? "☵" : (node.type === "router" ? "⨁" : (node.type === "server" ? "🗄️" : (node.type === "laptop" ? "💻" : "🖥️")));
    ctx.fillText(symbol, x, y - 4);

    // Device Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(node.name, x, y + 15);

    // IP Address
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.fillText(node.ip, x, y + 26);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // Animate Multiple/Repeated Flying Packets
  // --------------------------------------------------------------------------
  function updateAndDrawPackets(ctx) {
    if (state.activePackets.length === 0) return;

    for (let i = state.activePackets.length - 1; i >= 0; i--) {
      const p = state.activePackets[i];

      if (p.isFailed) {
        // Draw Red X failure mark
        const n = state.nodes[p.pathNodes[0]];
        if (n) {
          ctx.save();
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 20px monospace";
          ctx.textAlign = "center";
          ctx.fillText("✕ GAGAL", n.x, n.y - 42);
          ctx.restore();
        }
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          state.activePackets.splice(i, 1);
        }
        continue;
      }

      const n1 = state.nodes[p.pathNodes[p.legIndex]];
      const n2 = state.nodes[p.pathNodes[p.legIndex + 1]];

      if (!n1 || !n2) {
        state.activePackets.splice(i, 1);
        continue;
      }

      p.progress += p.speed;

      if (p.progress >= 1.0) {
        p.progress = 0;
        p.legIndex++;

        state.currentStepIndex = Math.min(state.simulationSteps.length - 1, p.legIndex);

        if (p.legIndex >= p.pathNodes.length - 1) {
          // Packet finished journey!
          state.activePackets.splice(i, 1);
          sound.success();
          continue;
        }
      }

      // Calculate coordinates along current hop
      const curX = n1.x + (n2.x - n1.x) * p.progress;
      const curY = n1.y + (n2.y - n1.y) * p.progress;

      // Draw Glowing Envelope
      ctx.save();
      ctx.translate(curX, curY - 32);

      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;

      const envW = 38;
      const envH = 24;

      ctx.fillStyle = p.color;
      ctx.fillRect(-envW / 2, -envH / 2, envW, envH);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-envW / 2, -envH / 2, envW, envH);

      ctx.beginPath();
      ctx.moveTo(-envW / 2, -envH / 2);
      ctx.lineTo(0, 3);
      ctx.lineTo(envW / 2, -envH / 2);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(p.label, 0, 7);

      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // Cisco PDU Information Window (Modal)
  // --------------------------------------------------------------------------
  function openPduModal(stepIdx) {
    const s = state.simulationSteps[stepIdx];
    if (!s) return;
    const modal = document.getElementById("cisco-pdu-modal");
    if (!modal) return;
    sound.click();

    modal.classList.remove("hidden");
    modal.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-5 shadow-2xl space-y-4 animate-scale-up text-left font-mono max-h-[88vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">mail</span>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">LANGKAH ${s.step} DARI ${state.simulationSteps.length}</span>
                <span class="text-xs text-slate-500">${s.time}</span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-0.5">PDU Information: ${s.atDevice} (${s.type})</h3>
            </div>
          </div>
          <button id="btn-close-pdu-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-sans">
          <strong>Analisis Paket:</strong> ${s.explanation}
        </div>

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
          Tutup
        </button>
      </div>
    `;

    document.getElementById("btn-close-pdu-modal")?.addEventListener("click", () => modal.classList.add("hidden"));
    document.getElementById("btn-close-pdu-modal-bottom")?.addEventListener("click", () => modal.classList.add("hidden"));
  }

  // --------------------------------------------------------------------------
  // Cisco Device Inspector Modal
  // --------------------------------------------------------------------------
  function openDeviceModal(deviceId) {
    const dev = state.nodes[deviceId];
    if (!dev) return;
    state.selectedDeviceId = deviceId;
    sound.click();

    const modal = document.getElementById("cisco-device-modal");
    if (!modal) return;
    modal.classList.remove("hidden");

    if (dev.type === "pc" || dev.type === "laptop" || dev.type === "server") {
      state.deviceActiveTab = "desktop";
    } else {
      state.deviceActiveTab = "cli";
    }

    renderDeviceModalContent();
  }

  function renderDeviceModalContent() {
    const dev = state.nodes[state.selectedDeviceId];
    const modal = document.getElementById("cisco-device-modal");
    if (!dev || !modal) return;

    modal.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-scale-up text-left font-mono max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-slate-900 text-indigo-400 border border-slate-700 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">${dev.icon}</span>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">${dev.model}</span>
                <span class="text-xs text-slate-500 font-bold">${dev.name}</span>
                <span class="w-2 h-2 rounded-full ${dev.poweredOn ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 mt-0.5">Konfigurasi &amp; Inspeksi Perangkat Cisco</h3>
            </div>
          </div>
          <button id="btn-close-dev-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
          ${(dev.type === 'pc' || dev.type === 'laptop' || dev.type === 'server') ? `
            <button id="dev-tab-desktop" class="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${state.deviceActiveTab === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">
              Desktop PC
            </button>
          ` : ''}
          <button id="dev-tab-cli" class="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${state.deviceActiveTab === 'cli' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">
            ${dev.type === 'switch' || dev.type === 'router' ? 'Cisco IOS CLI' : 'Terminal CMD'}
          </button>
          <button id="dev-tab-config" class="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${state.deviceActiveTab === 'config' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">
            Pengaturan Cepat (Config)
          </button>
          <button id="dev-tab-physical" class="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${state.deviceActiveTab === 'physical' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">
            Tampak Fisik (Chassis)
          </button>
        </div>

        <div class="min-h-[280px]">
          ${state.deviceActiveTab === 'desktop' ? renderDesktopTab(dev) : ''}
          ${state.deviceActiveTab === 'cli' ? renderCliTab(dev) : ''}
          ${state.deviceActiveTab === 'config' ? renderConfigTab(dev) : ''}
          ${state.deviceActiveTab === 'physical' ? renderPhysicalTab(dev) : ''}
        </div>
      </div>
    `;

    document.getElementById("btn-close-dev-modal")?.addEventListener("click", () => modal.classList.add("hidden"));

    document.getElementById("dev-tab-desktop")?.addEventListener("click", () => {
      state.deviceActiveTab = "desktop";
      renderDeviceModalContent();
    });
    document.getElementById("dev-tab-cli")?.addEventListener("click", () => {
      state.deviceActiveTab = "cli";
      renderDeviceModalContent();
    });
    document.getElementById("dev-tab-config")?.addEventListener("click", () => {
      state.deviceActiveTab = "config";
      renderDeviceModalContent();
    });
    document.getElementById("dev-tab-physical")?.addEventListener("click", () => {
      state.deviceActiveTab = "physical";
      renderDeviceModalContent();
    });

    document.getElementById("btn-toggle-power")?.addEventListener("click", () => {
      dev.poweredOn = !dev.poweredOn;
      sound.click();
      renderDeviceModalContent();
      updateDomStatus();
    });

    document.getElementById("btn-app-ipconfig")?.addEventListener("click", () => {
      state.activeDesktopApp = "ipconfig";
      renderDeviceModalContent();
    });
    document.getElementById("btn-app-cmd")?.addEventListener("click", () => {
      state.activeDesktopApp = "cmd";
      renderDeviceModalContent();
    });
    document.getElementById("btn-app-browser")?.addEventListener("click", () => {
      state.activeDesktopApp = "browser";
      renderDeviceModalContent();
    });

    document.getElementById("btn-save-ip-config")?.addEventListener("click", () => {
      const ipVal = document.getElementById("input-ip")?.value.trim();
      const maskVal = document.getElementById("input-mask")?.value.trim();
      const gwVal = document.getElementById("input-gw")?.value.trim();
      const dnsVal = document.getElementById("input-dns")?.value.trim();

      if (ipVal) dev.ip = ipVal;
      if (maskVal) dev.mask = maskVal;
      if (gwVal) dev.gateway = gwVal;
      if (dnsVal) dev.dns = dnsVal;

      sound.success();
      alert(`Konfigurasi IP untuk ${dev.name} berhasil disimpan!`);
      renderDeviceModalContent();
      updateDomStatus();
    });

    document.getElementById("btn-browser-go")?.addEventListener("click", () => {
      const urlInput = document.getElementById("browser-url-input")?.value.trim();
      handleBrowserNavigate(urlInput);
    });

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

  function renderDesktopTab(dev) {
    return `
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200">
          <button id="btn-app-ipconfig" class="px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${state.activeDesktopApp === 'ipconfig' ? 'bg-white shadow-xs border-indigo-500 text-indigo-700 font-bold' : 'bg-transparent text-slate-600 hover:bg-white'}">
            <span class="material-symbols-outlined text-[18px]">settings_ethernet</span>
            <span class="text-xs">IP Configuration</span>
          </button>
          <button id="btn-app-cmd" class="px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${state.activeDesktopApp === 'cmd' ? 'bg-white shadow-xs border-indigo-500 text-indigo-700 font-bold' : 'bg-transparent text-slate-600 hover:bg-white'}">
            <span class="material-symbols-outlined text-[18px]">terminal</span>
            <span class="text-xs">Command Prompt (CMD)</span>
          </button>
          <button id="btn-app-browser" class="px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${state.activeDesktopApp === 'browser' ? 'bg-white shadow-xs border-indigo-500 text-indigo-700 font-bold' : 'bg-transparent text-slate-600 hover:bg-white'}">
            <span class="material-symbols-outlined text-[18px]">language</span>
            <span class="text-xs">Web Browser</span>
          </button>
        </div>

        <div>
          ${state.activeDesktopApp === 'ipconfig' ? renderDesktopIpConfig(dev) : ''}
          ${state.activeDesktopApp === 'cmd' ? renderCliTab(dev) : ''}
          ${state.activeDesktopApp === 'browser' ? renderDesktopBrowser(dev) : ''}
        </div>
      </div>
    `;
  }

  function renderDesktopIpConfig(dev) {
    return `
      <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 font-sans">
        <div class="flex items-center justify-between border-b border-slate-200 pb-2">
          <div class="font-mono font-bold text-slate-800">FastEthernet0 IP Configuration</div>
        </div>

        <div class="grid grid-cols-2 gap-3 font-mono">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">IPv4 Address</label>
            <input id="input-ip" type="text" value="${dev.ip}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Subnet Mask</label>
            <input id="input-mask" type="text" value="${dev.mask}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Default Gateway</label>
            <input id="input-gw" type="text" value="${dev.gateway}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">DNS Server</label>
            <input id="input-dns" type="text" value="${dev.dns}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <button id="btn-save-ip-config" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold rounded-lg cursor-pointer transition-all">
          Simpan Konfigurasi IP
        </button>
      </div>
    `;
  }

  function renderDesktopBrowser(dev) {
    return `
      <div class="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
        <div class="p-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <span class="text-slate-400 font-mono text-xs">URL:</span>
          <input id="browser-url-input" type="text" placeholder="http://10.10.20.50 atau http://192.168.1.100" class="flex-1 px-3 py-1 bg-white border border-slate-300 rounded-md font-mono text-xs focus:outline-none focus:border-indigo-500" />
          <button id="btn-browser-go" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold rounded-md cursor-pointer">
            Go
          </button>
        </div>

        <div id="browser-viewport" class="p-6 min-h-[160px] flex flex-col items-center justify-center text-center space-y-2 bg-slate-50">
          <span class="material-symbols-outlined text-[36px] text-slate-300">public</span>
          <p class="text-xs text-slate-500 font-mono">
            Ketik alamat IP Server Web (contoh: <code>http://10.10.20.50</code>) lalu tekan <strong>Go</strong> untuk menguji koneksi HTTP.
          </p>
        </div>
      </div>
    `;
  }

  function handleBrowserNavigate(url) {
    const viewport = document.getElementById("browser-viewport");
    if (!viewport) return;

    sound.click();
    if (!url) {
      viewport.innerHTML = `<p class="text-rose-500 font-mono text-xs">Silakan masukkan URL tujuan.</p>`;
      return;
    }

    const cleanIp = url.replace("http://", "").replace("https://", "").replace("/", "").trim();
    const targetDev = Object.values(state.nodes).find(n => n.ip === cleanIp && (n.type === "server" || n.type === "pc"));

    if (targetDev && targetDev.poweredOn) {
      viewport.innerHTML = `
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left w-full space-y-2 font-sans animate-scale-up">
          <div class="flex items-center gap-2 text-emerald-700 font-bold font-mono">
            <span class="material-symbols-outlined text-[20px]">check_circle</span>
            <span>HTTP/1.1 200 OK - Selamat Datang di Server Web NetLearn!</span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed">
            Koneksi HTTP sukses tersambung ke <strong>${targetDev.name} (${targetDev.ip})</strong> melalui port 80.
            Paket Layer 7 (HTTP Request / Response) berhasil dikirim dan diterima secara sempurna!
          </p>
        </div>
      `;
      sound.success();
    } else {
      viewport.innerHTML = `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-left w-full space-y-2 font-sans animate-scale-up">
          <div class="flex items-center gap-2 text-rose-700 font-bold font-mono">
            <span class="material-symbols-outlined text-[20px]">error</span>
            <span>Request Time Out (404 / Connection Failed)</span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed">
            Tidak dapat terhubung ke alamat IP <code>${cleanIp}</code>. Periksa apakah perangkat target terhubung ke jaringan dan menyala.
          </p>
        </div>
      `;
      sound.error();
    }
  }

  function renderCliTab(dev) {
    const hist = state.cliHistory[dev.id] || [];
    const isCisco = dev.type === "switch" || dev.type === "router";
    const prompt = isCisco ? (state.cliState[dev.id]?.mode === "priv" ? `${dev.name}#` : `${dev.name}>`) : (dev.type === "server" ? "root@server:~#" : "C:\\>");

    return `
      <div class="space-y-2">
        <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono h-56 overflow-y-auto space-y-0.5" id="cli-scroll-box">
          ${hist.map(l => `<div>${escapeHtml(l)}</div>`).join("")}
        </div>
        <div class="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <span class="text-xs font-mono font-bold text-emerald-400 shrink-0">${prompt}</span>
          <input id="dev-cli-input" type="text" placeholder="${isCisco ? 'Ketik perintah Cisco IOS (contoh: enable, show ip int br, ping)...' : 'Ketik perintah CMD (contoh: ping 10.10.20.50, ipconfig)...'}" class="flex-1 bg-transparent border-0 text-xs font-mono text-white focus:outline-none placeholder:text-slate-600" />
        </div>
      </div>
    `;
  }

  function executeDeviceCliCommand(dev, rawCmd) {
    if (!rawCmd) return;
    const hist = state.cliHistory[dev.id] || [];
    const isCisco = dev.type === "switch" || dev.type === "router";
    const prompt = isCisco ? (state.cliState[dev.id]?.mode === "priv" ? `${dev.name}#` : `${dev.name}>`) : "C:\\>";

    hist.push(`${prompt} ${rawCmd}`);
    const lower = rawCmd.toLowerCase().trim();

    if (lower === "cls" || lower === "clear") {
      state.cliHistory[dev.id] = [];
      return;
    }

    if (lower === "help" || lower === "?") {
      if (isCisco) {
        hist.push(
          "Cisco IOS Commands:",
          "  enable                - Masuk ke Privileged EXEC mode",
          "  disable               - Kembali ke User EXEC mode",
          "  show ip int brief     - Menampilkan status interface & IP",
          "  show ip route         - Menampilkan tabel perutean (Routing Table)",
          "  show mac-address-table- Menampilkan tabel MAC address switch",
          "  ping <ip>             - Mengirim 5 paket ICMP Echo ke target",
          "  clear                 - Bersihkan layar konsol"
        );
      } else {
        hist.push(
          "Command Prompt Commands:",
          "  ipconfig              - Menampilkan konfigurasi IP dasar",
          "  ipconfig /all         - Menampilkan konfigurasi IP & MAC lengkap",
          "  ping <ip_or_name>     - Menguji konektivitas ICMP ke target",
          "  cls                   - Bersihkan layar"
        );
      }
      return;
    }

    if (lower.startsWith("ping")) {
      const parts = rawCmd.split(" ");
      const targetQuery = parts[1];
      if (!targetQuery) {
        hist.push("Usage: ping <target_ip_or_name>");
        return;
      }

      hist.push(`Pinging ${targetQuery} with 32 bytes of data:`);
      const targetDev = Object.values(state.nodes).find(n => n.ip === targetQuery || n.ip2 === targetQuery || n.name.toLowerCase() === targetQuery.toLowerCase());
      
      if (targetDev && targetDev.poweredOn) {
        const path = findPathBetween(dev.id, targetDev.id);
        if (path) {
          hist.push(
            `Reply from ${targetDev.ip}: bytes=32 time=0.82ms TTL=63`,
            `Reply from ${targetDev.ip}: bytes=32 time=0.79ms TTL=63`,
            `Reply from ${targetDev.ip}: bytes=32 time=0.81ms TTL=63`,
            `Reply from ${targetDev.ip}: bytes=32 time=0.85ms TTL=63`,
            "",
            `Ping statistics for ${targetDev.ip}: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`
          );
          sound.success();
          return;
        }
      }

      hist.push(
        "Request timed out.",
        "Request timed out.",
        "Request timed out.",
        "Request timed out.",
        "",
        `Ping statistics for ${targetQuery}: Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`
      );
      sound.error();
      return;
    }

    if (lower.startsWith("ipconfig")) {
      hist.push(
        "Windows IP Configuration",
        "",
        "Ethernet adapter Ethernet0:",
        `   IPv4 Address. . . . . . . . . . . : ${dev.ip}`,
        `   Subnet Mask . . . . . . . . . . . : ${dev.mask}`,
        `   Default Gateway . . . . . . . . . : ${dev.gateway}`
      );
      if (lower.includes("/all")) {
        hist.push(
          `   Physical Address. . . . . . . . . : ${dev.mac}`,
          `   DNS Servers . . . . . . . . . . . : ${dev.dns}`
        );
      }
      return;
    }

    if (isCisco) {
      if (lower === "enable" || lower === "en") {
        state.cliState[dev.id] = { mode: "priv", iface: "" };
        hist.push("");
        return;
      }
      if (lower === "disable") {
        state.cliState[dev.id] = { mode: "user", iface: "" };
        hist.push("");
        return;
      }
      if (lower.includes("show ip int") || lower.includes("sh ip int br")) {
        hist.push(
          "Interface              IP-Address      OK? Method Status                Protocol",
          `GigabitEthernet0/0/0   ${dev.ip}     YES manual up                    up`,
          `GigabitEthernet0/0/1   ${dev.ip2 || "10.10.20.1"}      YES manual up                    up`
        );
        return;
      }
      if (lower.includes("show ip route") || lower.includes("sh ip ro")) {
        hist.push(
          "Gateway of last resort is not set",
          "C    192.168.1.0/24 is directly connected, GigabitEthernet0/0/0",
          "C    10.10.20.0/24 is directly connected, GigabitEthernet0/0/1"
        );
        return;
      }
      if (lower.includes("show mac") || lower.includes("sh mac")) {
        hist.push(
          "          Mac Address Table",
          "-------------------------------------------",
          "Vlan    Mac Address       Type        Ports",
          "----    -----------       --------    -----",
          "   1    00aa.1122.3301    DYNAMIC     Fa0/1",
          "   1    00rt.5544.3301    DYNAMIC     Fa0/24"
        );
        return;
      }
    }

    hist.push(`Perintah '${rawCmd}' tidak dikenali. Ketik 'help' untuk daftar perintah.`);
  }

  function renderConfigTab(dev) {
    return `
      <div class="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Nama Perangkat</label>
            <input type="text" value="${dev.name}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Model Hardware</label>
            <input type="text" value="${dev.model}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">IP Address</label>
            <input type="text" value="${dev.ip}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">MAC Address Fisik</label>
            <input type="text" value="${dev.mac}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800" readonly />
          </div>
        </div>
      </div>
    `;
  }

  function renderPhysicalTab(dev) {
    return `
      <div class="space-y-4">
        <div class="p-6 rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-inner flex flex-col justify-between min-h-[180px] text-white">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full ${dev.poweredOn ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-rose-500'}"></span>
              <span class="text-xs font-bold text-slate-300">${dev.model}</span>
            </div>
            
            <button id="btn-toggle-power" class="px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${dev.poweredOn ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900' : 'bg-rose-950/80 text-rose-400 border-rose-500/50 hover:bg-rose-900'}">
              Power: ${dev.poweredOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <div class="py-4 flex items-center justify-around gap-2 flex-wrap">
            ${dev.ports.slice(0, 4).map(p => `
              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1 min-w-[70px]">
                <span class="text-[9px] text-slate-400 block font-mono">${p}</span>
                <div class="w-7 h-5 mx-auto rounded bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <span class="w-2 h-2 rounded-full ${dev.poweredOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}"></span>
                </div>
                <span class="text-[8px] text-emerald-400 block">Link/Act</span>
              </div>
            `).join("")}
          </div>

          <div class="text-[10px] text-slate-500 text-center border-t border-slate-800/80 pt-2">
            Cisco Systems Modular Networking Architecture &bull; FastEthernet / Gigabit Ports
          </div>
        </div>
      </div>
    `;
  }

  // Initial Mount
  mountUI();
}
