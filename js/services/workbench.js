// NetQuest - Cisco Packet Tracer Style Interactive Virtual Network Lab
// Complete Drag-and-Drop Canvas, Device Palette, Interactive Wiring Modal,
// In-depth Device Inspector (PC Desktop IP Config / Command Prompt / Web Browser, Cisco IOS CLI),
// Dynamic Pathfinding & Packet Tracer Simulation with OSI 7-Layer PDU Dissector & Fullscreen Support!

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
    simState: "idle", // "idle" | "playing" | "paused" | "finished"
    currentStepIndex: 0,
    playbackSpeed: 1,

    // Active tool: "select" | "cable-straight" | "cable-cross" | "delete" | "pdu"
    activeTool: "select",
    cablePending: null, // { fromNodeId, fromPort, cableType }
    pduPendingSource: null, // nodeId

    selectedDeviceId: "pc0",
    deviceModalOpen: false,
    deviceActiveTab: "desktop", // "desktop" | "config" | "cli" | "physical"
    activeDesktopApp: "ipconfig", // "ipconfig" | "cmd" | "browser"
    pduModalOpen: false,
    activePduStep: null,

    // Port selection modal state
    portModal: null,

    // Last PDU Transaction status
    lastPduResult: {
      status: "Successful",
      source: "PC0",
      target: "Server0",
      type: "ICMP",
      time: "0.82 ms",
      message: "Ping sukses! Koneksi end-to-end normal (4 sent, 4 received, 0% loss)."
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
    pointerPos: { x: 0, y: 0, active: false }
  };

  let simInterval = null;

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
  // Pre-configured Topologies
  // --------------------------------------------------------------------------
  function loadStandardTemplate() {
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
        x: 95,
        y: 170
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
        x: 285,
        y: 170
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
        x: 475,
        y: 170
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
        x: 665,
        y: 170
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
    initCliHistories();
    runPduPathfinding("pc0", "srv0", false);
  }

  function loadPeerToPeerTemplate() {
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
        x: 200,
        y: 170
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
        x: 540,
        y: 170
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
    initCliHistories();
    runPduPathfinding("pc0", "pc1", false);
  }

  function loadStarLanTemplate() {
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
        x: 380,
        y: 170
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
        x: 150,
        y: 90
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
        x: 150,
        y: 250
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
        x: 610,
        y: 170
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
    initCliHistories();
    runPduPathfinding("pc0", "srv0", false);
  }

  function clearCanvas() {
    state.nodes = {};
    state.links = [];
    state.simulationSteps = [];
    state.selectedDeviceId = null;
    state.cablePending = null;
    state.pduPendingSource = null;
    state.lastPduResult = {
      status: "Idle",
      source: "-",
      target: "-",
      type: "-",
      time: "-",
      message: "Kanvas kosong. Tambahkan perangkat dari panel bawah lalu hubungkan kabel untuk mulai berpraktik."
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
            `C:\\> rem Perangkat Aktif: ${dev.name} (${dev.model})`,
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
  // Network Pathfinding & Simulation Engine
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

  function runPduPathfinding(srcId, dstId, triggerSound = true) {
    const src = state.nodes[srcId];
    const dst = state.nodes[dstId];

    if (!src || !dst) {
      state.simulationSteps = [];
      return;
    }

    if (!src.poweredOn) {
      state.lastPduResult = {
        status: "Failed",
        source: src.name,
        target: dst.name,
        type: "ICMP",
        time: "0.00 ms",
        message: `Gagal: Perangkat sumber (${src.name}) dalam kondisi mati (Power OFF). Nyalakan daya di Device Inspector.`
      };
      if (triggerSound) sound.error();
      return;
    }

    if (!dst.poweredOn) {
      state.lastPduResult = {
        status: "Failed",
        source: src.name,
        target: dst.name,
        type: "ICMP",
        time: "0.00 ms",
        message: `Gagal: Perangkat tujuan (${dst.name}) dalam kondisi mati (Power OFF). Nyalakan daya di Device Inspector.`
      };
      if (triggerSound) sound.error();
      return;
    }

    const path = findPathBetween(srcId, dstId);
    if (!path || path.length < 2) {
      state.lastPduResult = {
        status: "Failed",
        source: src.name,
        target: dst.name,
        type: "ICMP",
        time: "0.00 ms",
        message: `Gagal: Tidak ada jalur kabel fisik yang menghubungkan ${src.name} dengan ${dst.name}.`
      };
      if (triggerSound) sound.error();
      generateFailedSteps(src, dst, "Kabel Terputus / Belum Dihubungkan");
      return;
    }

    const sameSub = isSameSubnet(src.ip, dst.ip, src.mask);
    const hasRouter = path.some(nid => state.nodes[nid]?.type === "router");

    if (!sameSub && !hasRouter) {
      state.lastPduResult = {
        status: "Failed",
        source: src.name,
        target: dst.name,
        type: "ICMP",
        time: "0.00 ms",
        message: `Gagal: ${src.name} (${src.ip}) dan ${dst.name} (${dst.ip}) berbeda subnet tanpa Router.`
      };
      if (triggerSound) sound.error();
      generateFailedSteps(src, dst, "Destination Host Unreachable (Beda Subnet & Tiada Router)");
      return;
    }

    if (!sameSub && hasRouter) {
      const routerNode = state.nodes[path.find(nid => state.nodes[nid]?.type === "router")];
      if (src.gateway !== routerNode.ip && src.gateway !== routerNode.ip2) {
        state.lastPduResult = {
          status: "Failed",
          source: src.name,
          target: dst.name,
          type: "ICMP",
          time: "0.00 ms",
          message: `Gagal: Default Gateway pada ${src.name} (${src.gateway}) tidak mengarah ke IP Router.`
        };
        if (triggerSound) sound.error();
        generateFailedSteps(src, dst, "Default Gateway Mismatch / Routing Error");
        return;
      }
    }

    // Build Success Steps
    const steps = [];
    let stepNum = 1;
    let t = 0.0;

    const firstHop = state.nodes[path[1]];
    steps.push({
      step: stepNum++,
      time: `${t.toFixed(3)}s`,
      lastDevice: src.name,
      atDevice: src.name,
      targetDevice: firstHop.name,
      type: "ARP",
      color: "#06b6d4",
      info: `ARP Request: Who has ${sameSub ? dst.ip : src.gateway}? Tell ${src.ip} (Broadcast FF:FF:FF:FF:FF:FF)`,
      pduLayer: 2,
      osiInfo: {
        l7: "Application: N/A (Address Resolution Protocol)",
        l4: "Transport: N/A",
        l3: `Network: ARP Request for ${sameSub ? dst.ip : src.gateway}`,
        l2: `Ethernet II: Src MAC ${src.mac} -> Dst MAC FF:FF:FF:FF:FF:FF (Broadcast)`,
        l1: "Physical: Tx Frame to copper cable"
      },
      explanation: `${src.name} ingin mengirim paket ke ${sameSub ? dst.name : 'Gateway'}, namun belum mengetahui MAC address fisiknya. Dibuat paket ARP Request broadcast.`
    });

    t += 0.004;
    steps.push({
      step: stepNum++,
      time: `${t.toFixed(3)}s`,
      lastDevice: src.name,
      atDevice: firstHop.name,
      targetDevice: firstHop.name,
      type: "ARP",
      color: "#06b6d4",
      info: `${firstHop.name} menerima ARP frame, mencatat MAC, dan membalas ARP Reply unicast`,
      pduLayer: 2,
      osiInfo: {
        l7: "Application: N/A",
        l4: "Transport: N/A",
        l3: "Network: ARP Reply",
        l2: `Ethernet II: Src MAC ${firstHop.mac} -> Dst MAC ${src.mac}`,
        l1: "Physical: FastEthernet / Gigabit Rx/Tx"
      },
      explanation: `${firstHop.name} mencatat port frame dan membalas alamat MAC unicast ke ${src.name}.`
    });

    // Forward Path (Echo Request)
    for (let i = 0; i < path.length - 1; i++) {
      t += 0.008;
      const curr = state.nodes[path[i]];
      const next = state.nodes[path[i + 1]];
      const isRouter = curr.type === "router";

      steps.push({
        step: stepNum++,
        time: `${t.toFixed(3)}s`,
        lastDevice: curr.name,
        atDevice: next.name,
        targetDevice: next.name,
        type: "ICMP",
        color: "#f59e0b",
        info: isRouter
          ? `Router mencari tabel rute -> Dekremen TTL=127 -> Meneruskan ke ${next.name}`
          : `ICMP Echo Request (Type 8): Src ${src.ip} -> Dst ${dst.ip} (TTL=128)`,
        pduLayer: 3,
        osiInfo: {
          l7: "Application: Ping Utility (Payload 32 bytes abcdef...)",
          l4: "Transport: ICMP Control Message (Type 8 Echo Request)",
          l3: `Network: IPv4 Header (Src: ${src.ip}, Dst: ${dst.ip}, Protocol: 1 ICMP, TTL: ${isRouter ? 127 : 128})`,
          l2: `Ethernet II: Src MAC ${curr.mac} -> Dst MAC ${next.mac}`,
          l1: "Physical: Copper Interface Transmission"
        },
        explanation: `${curr.name} meneruskan paket ICMP Echo Request ke hop berikutnya (${next.name}).`
      });
    }

    // Destination Echo Reply
    t += 0.006;
    steps.push({
      step: stepNum++,
      time: `${t.toFixed(3)}s`,
      lastDevice: state.nodes[path[path.length - 2]].name,
      atDevice: dst.name,
      targetDevice: dst.name,
      type: "ICMP",
      color: "#10b981",
      info: `${dst.name} menerima Echo Request dan membalas dengan ICMP Echo Reply (Type 0, Code 0)`,
      pduLayer: 4,
      osiInfo: {
        l7: "Application: ICMP Daemon / Web Stack",
        l4: "Transport: ICMP Type 0 Echo Reply",
        l3: `Network: IPv4 Header (Src: ${dst.ip}, Dst: ${src.ip}, TTL: 64)`,
        l2: `Ethernet II: Src MAC ${dst.mac} -> Dst MAC ${src.mac}`,
        l1: "Physical: Rx / Tx Packet Frame"
      },
      explanation: `Target ${dst.name} memproses paket ping dan segera membalas kembali ke ${src.name}.`
    });

    // Return Path
    for (let i = path.length - 1; i > 0; i--) {
      t += 0.008;
      const curr = state.nodes[path[i]];
      const prev = state.nodes[path[i - 1]];

      steps.push({
        step: stepNum++,
        time: `${t.toFixed(3)}s`,
        lastDevice: curr.name,
        atDevice: prev.name,
        targetDevice: prev.name,
        type: "ICMP",
        color: "#10b981",
        info: prev.id === src.id
          ? `Ping Sukses! ${src.name} menerima Echo Reply dari ${dst.ip}: bytes=32 time=0.82ms TTL=63 (0% loss)`
          : `Meneruskan balasan Echo Reply: dari ${curr.name} ke ${prev.name}`,
        pduLayer: prev.id === src.id ? 7 : 3,
        osiInfo: {
          l7: prev.id === src.id ? "Application: Ping Selesai: 4 terkirim, 4 diterima (100% SUKSES)" : "Application: Transit",
          l4: "Transport: ICMP Reply Completed",
          l3: `Network: IPv4 Header (Src: ${dst.ip}, Dst: ${src.ip}, TTL: 63)`,
          l2: `Ethernet II: Frame Diterima di ${prev.name}`,
          l1: "Physical: FastEthernet / Gigabit Rx"
        },
        explanation: prev.id === src.id
          ? `${src.name} telah menerima balasan paket ping secara lengkap. Transmisi PDU BERHASIL 100%! 🎉`
          : `Paket balasan bergerak mundur menuju sumber melalui ${prev.name}.`
      });
    }

    state.simulationSteps = steps;
    state.currentStepIndex = 0;
    state.lastPduResult = {
      status: "Successful",
      source: src.name,
      target: dst.name,
      type: "ICMP",
      time: "0.82 ms",
      message: `Ping Sukses! ${src.name} <-> ${dst.name} terhubung normal melalui ${path.length - 1} hop kabel.`
    };

    if (triggerSound) sound.success();
  }

  function generateFailedSteps(src, dst, reason) {
    state.simulationSteps = [
      {
        step: 1,
        time: "0.000s",
        lastDevice: src.name,
        atDevice: src.name,
        targetDevice: dst.name,
        type: "ICMP",
        color: "#ef4444",
        info: `ICMP Echo Request: ${src.name} (${src.ip}) -> ${dst.name} (${dst.ip}) - Gagal!`,
        pduLayer: 3,
        osiInfo: {
          l7: "Application: Ping Utility Timeout",
          l4: "Transport: ICMP Request Unanswered",
          l3: `Network: Error - ${reason}`,
          l2: "Ethernet II: Frame Dropped",
          l1: "Physical: Link Inactive / Down"
        },
        explanation: `Paket tidak dapat ditransmisikan karena: ${reason}. Silakan periksa sambungan kabel atau konfigurasi IP di Device Inspector.`
      }
    ];
    state.currentStepIndex = 0;
  }

  // --------------------------------------------------------------------------
  // Main Render Routine
  // --------------------------------------------------------------------------
  function render() {
    const selectedDev = state.nodes[state.selectedDeviceId];

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- Cisco Packet Tracer Style Top Control Toolbar -->
        <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          
          <!-- Mode Selector & Simulation Playback -->
          <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span class="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 uppercase">Mode:</span>
            <div class="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
              <button id="btn-mode-realtime" class="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${state.mode === 'realtime' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                ⚡ Realtime
              </button>
              <button id="btn-mode-simulation" class="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${state.mode === 'simulation' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}">
                ⏱️ Simulasi (Step)
              </button>
            </div>

            <!-- Fast Action: Realtime Ping Button -->
            <button id="btn-quick-ping" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
              <span class="material-symbols-outlined text-[16px]">send</span>
              <span>Kirim Simple PDU (Ping)</span>
            </button>

            <!-- Simulation Step Controls -->
            ${state.mode === 'simulation' ? `
              <div class="flex items-center gap-1">
                <button id="btn-sim-play" class="px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                  <span class="material-symbols-outlined text-[15px] sm:text-[16px]">${state.simState === 'playing' ? 'pause' : 'play_arrow'}</span>
                  <span>${state.simState === 'playing' ? 'Jeda' : 'Auto Play'}</span>
                </button>
                <button id="btn-sim-step" class="px-2.5 sm:px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer" title="Maju 1 Langkah">
                  <span class="material-symbols-outlined text-[15px] sm:text-[16px]">step_over</span>
                  <span>Step</span>
                </button>
                <button id="btn-sim-reset" class="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer" title="Reset Paket">
                  <span class="material-symbols-outlined text-[16px]">restart_alt</span>
                </button>
              </div>
            ` : ''}
          </div>

          <!-- Top Right Presets & Quick Inspector -->
          <div class="flex items-center gap-1.5 flex-wrap">
            
            <!-- Quick Inspect Button -->
            <button id="btn-inspect-selected" class="px-3 py-1.5 ${selectedDev ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'} font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer" ${!selectedDev ? 'disabled' : ''}>
              <span class="material-symbols-outlined text-[16px]">settings</span>
              <span>${selectedDev ? `Konfigurasi: ${selectedDev.name}` : 'Pilih Perangkat'}</span>
            </button>

            <!-- Template Menu Dropdown -->
            <div class="dropdown relative inline-block">
              <button id="btn-template-dropdown" class="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-mono text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-[16px] text-indigo-600">folder_open</span>
                <span>Template Lab</span>
                <span class="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
              <div id="template-menu" class="hidden absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-40 text-xs font-mono">
                <button id="btn-tpl-standard" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center gap-2 text-slate-700">
                  <span class="material-symbols-outlined text-indigo-600 text-[18px]">account_tree</span>
                  <div>
                    <div class="font-bold">1. Lab Standar TKJ</div>
                    <div class="text-[10px] text-slate-400">PC - Switch - Router - Server</div>
                  </div>
                </button>
                <button id="btn-tpl-star" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center gap-2 text-slate-700">
                  <span class="material-symbols-outlined text-emerald-600 text-[18px]">hub</span>
                  <div>
                    <div class="font-bold">2. Lab Star LAN Sekolah</div>
                    <div class="text-[10px] text-slate-400">2 PC + Switch + Server</div>
                  </div>
                </button>
                <button id="btn-tpl-p2p" class="w-full text-left px-3.5 py-2 hover:bg-indigo-50 flex items-center gap-2 text-slate-700">
                  <span class="material-symbols-outlined text-amber-600 text-[18px]">swap_horiz</span>
                  <div>
                    <div class="font-bold">3. Lab Peer-to-Peer</div>
                    <div class="text-[10px] text-slate-400">PC ke PC (Cross-Over)</div>
                  </div>
                </button>
                <div class="border-t border-slate-100 my-1"></div>
                <button id="btn-tpl-clear" class="w-full text-left px-3.5 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600">
                  <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                  <div>
                    <div class="font-bold">Kanvas Kosong (Mulai Dari Awal)</div>
                    <div class="text-[10px] text-rose-400">Bersihkan seluruh perangkat</div>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- Cisco Workspace Canvas Wrapper -->
        <div class="relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-900 select-none h-[320px] sm:h-[400px] md:h-[460px]" id="cisco-canvas-wrapper">
          <canvas id="cisco-canvas" class="w-full h-full block cursor-crosshair"></canvas>

          <!-- Floating Instructions & Current Tool Pill -->
          <div class="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 flex items-center gap-2 z-10 flex-wrap">
            <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-200 flex items-center gap-2 shadow-lg">
              <span class="w-2 h-2 rounded-full ${state.activeTool === 'select' ? 'bg-indigo-400' : (state.activeTool === 'delete' ? 'bg-rose-400' : (state.activeTool === 'pdu' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'))}"></span>
              <span>
                ${state.activeTool === 'select' 
                  ? 'Kursor: Klik perangkat untuk pilih &amp; geser, klik 2x untuk buka konfigurasi' 
                  : (state.activeTool === 'pdu'
                      ? (state.pduPendingSource ? `Klik perangkat target untuk kirim paket dari ${state.nodes[state.pduPendingSource]?.name || 'asal'}...` : 'Klik perangkat asal untuk kirim paket PDU...')
                      : (state.activeTool === 'delete' 
                          ? 'Alat Hapus: Klik perangkat atau kabel untuk menghapusnya' 
                          : (state.cablePending ? `Kabel terpasang di ${state.nodes[state.cablePending.fromNodeId]?.name || ''} (${state.cablePending.fromPort}). Sekarang klik perangkat tujuan!` : 'Tarik Kabel: Klik perangkat asal untuk memilih port'))
                  )}
              </span>
            </div>

            ${selectedDev ? `
              <button id="btn-quick-inspect-pill" class="bg-indigo-600/90 hover:bg-indigo-500 backdrop-blur-md border border-indigo-400 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold text-white flex items-center gap-1.5 shadow-lg cursor-pointer animate-scale-up">
                <span class="material-symbols-outlined text-[14px]">tune</span>
                <span>Buka ${selectedDev.name}</span>
              </button>
            ` : ''}
          </div>

          <!-- Top-Right Step Indicator -->
          <div class="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 bg-slate-900/90 backdrop-blur-md border border-amber-500/50 px-3 py-1.5 rounded-xl text-[11px] font-mono text-amber-300 flex items-center gap-2 shadow-xl z-10">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Langkah: <strong>${state.simulationSteps.length > 0 ? (state.currentStepIndex + 1) : 0} / ${state.simulationSteps.length}</strong></span>
          </div>

          <!-- Bottom-Right Cisco Status Card -->
          <div class="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-3 bg-slate-950/90 backdrop-blur-md border border-slate-700 px-3 py-2 rounded-xl text-left font-mono text-[10px] sm:text-[11px] shadow-2xl max-w-xs z-10">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1 gap-4">
              <span class="text-slate-400 font-bold uppercase tracking-wider">Cisco PDU Status</span>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold ${state.lastPduResult.status === 'Successful' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : (state.lastPduResult.status === 'Failed' ? 'bg-rose-950 text-rose-400 border border-rose-500/40' : 'bg-slate-800 text-slate-300')}">
                ${state.lastPduResult.status}
              </span>
            </div>
            <div class="text-slate-300 truncate">
              <strong>${state.lastPduResult.source}</strong> ➔ <strong>${state.lastPduResult.target}</strong> (${state.lastPduResult.type})
            </div>
            <div class="text-slate-400 text-[10px] mt-0.5 leading-tight">
              ${state.lastPduResult.message}
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
              Klik ikon perangkat untuk menambahkannya ke kanvas bebas
            </span>
          </div>

          <!-- Palette Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            
            <!-- Category 1: Kursor & Alat PDU -->
            <div class="lg:col-span-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div class="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Mode Kursor / Alat</div>
              <div class="grid grid-cols-3 gap-1.5">
                <button id="tool-select" class="p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${state.activeTool === 'select' ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}">
                  <span class="material-symbols-outlined text-[18px]">near_me</span>
                  <span class="text-[10px]">Pilih/Geser</span>
                </button>
                <button id="tool-pdu" class="p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${state.activeTool === 'pdu' ? 'bg-amber-500 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}" title="Add Simple PDU: Uji Ping antar 2 perangkat di kanvas">
                  <span class="material-symbols-outlined text-[18px]">mail</span>
                  <span class="text-[10px]">Kirim PDU</span>
                </button>
                <button id="tool-delete" class="p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${state.activeTool === 'delete' ? 'bg-rose-600 text-white border-rose-700 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                  <span class="text-[10px]">Hapus</span>
                </button>
              </div>
            </div>

            <!-- Category 2: Kabel Jaringan -->
            <div class="lg:col-span-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div class="text-[10px] font-mono font-bold text-slate-500 uppercase mb-1.5">Kabel Jaringan</div>
              <div class="grid grid-cols-2 gap-1.5">
                <button id="tool-cable-straight" class="p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${state.activeTool === 'cable-straight' ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}" title="Kabel Straight-Through: PC ke Switch atau Switch ke Router">
                  <span class="material-symbols-outlined text-[18px]">horizontal_rule</span>
                  <span class="text-[10px]">Straight</span>
                </button>
                <button id="tool-cable-cross" class="p-2 rounded-lg font-mono text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${state.activeTool === 'cable-cross' ? 'bg-amber-600 text-white border-amber-700 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}" title="Kabel Cross-Over: PC ke PC atau Switch ke Switch">
                  <span class="material-symbols-outlined text-[18px]">linear_scale</span>
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

        <!-- Cisco Packet Tracer Event List Panel -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 class="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px] text-indigo-600">list_alt</span>
                <span>Daftar Peristiwa Transmisi (Cisco Event List Panel)</span>
              </h3>
            </div>
            <span class="text-[11px] font-mono text-slate-500">Klik baris untuk membuka <strong>PDU Information (OSI 7 Layers)</strong></span>
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
                ${state.simulationSteps.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-6 text-center text-slate-400 font-sans text-xs">
                      Belum ada paket yang dikirim. Tekan tombol <strong>Kirim Simple PDU (Ping)</strong> atau gunakan <strong>Alat Kirim PDU (Amplop)</strong>.
                    </td>
                  </tr>
                ` : state.simulationSteps.map((s, idx) => {
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

        <!-- Dedicated Port Selection Modal -->
        <div id="cisco-port-modal" class="hidden fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        </div>

        <!-- Cisco PDU Information Window -->
        <div id="cisco-pdu-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        </div>

        <!-- Cisco Device Inspector Modal -->
        <div id="cisco-device-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        </div>

      </div>
    `;

    setupEvents();
    initCanvas();
  }

  // --------------------------------------------------------------------------
  // Event Listeners Setup
  // --------------------------------------------------------------------------
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

    // Quick Ping Button
    document.getElementById("btn-quick-ping")?.addEventListener("click", () => {
      triggerQuickPing();
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

    // Template Dropdown
    const tplDropdownBtn = document.getElementById("btn-template-dropdown");
    const tplMenu = document.getElementById("template-menu");
    tplDropdownBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      tplMenu?.classList.toggle("hidden");
    });
    window.addEventListener("click", () => {
      tplMenu?.classList.add("hidden");
    });

    document.getElementById("btn-tpl-standard")?.addEventListener("click", () => {
      loadStandardTemplate();
      sound.success();
      render();
    });

    document.getElementById("btn-tpl-star")?.addEventListener("click", () => {
      loadStarLanTemplate();
      sound.success();
      render();
    });

    document.getElementById("btn-tpl-p2p")?.addEventListener("click", () => {
      loadPeerToPeerTemplate();
      sound.success();
      render();
    });

    document.getElementById("btn-tpl-clear")?.addEventListener("click", () => {
      clearCanvas();
      sound.click();
      render();
    });

    // Inspect buttons
    document.getElementById("btn-inspect-selected")?.addEventListener("click", () => {
      if (state.selectedDeviceId) {
        openDeviceModal(state.selectedDeviceId);
      }
    });

    document.getElementById("btn-quick-inspect-pill")?.addEventListener("click", () => {
      if (state.selectedDeviceId) {
        openDeviceModal(state.selectedDeviceId);
      }
    });

    // Tool Buttons
    document.getElementById("tool-select")?.addEventListener("click", () => {
      state.activeTool = "select";
      state.cablePending = null;
      state.pduPendingSource = null;
      sound.click();
      render();
    });

    document.getElementById("tool-pdu")?.addEventListener("click", () => {
      state.activeTool = "pdu";
      state.cablePending = null;
      state.pduPendingSource = null;
      sound.click();
      render();
    });

    document.getElementById("tool-delete")?.addEventListener("click", () => {
      state.activeTool = "delete";
      state.cablePending = null;
      state.pduPendingSource = null;
      sound.click();
      render();
    });

    document.getElementById("tool-cable-straight")?.addEventListener("click", () => {
      state.activeTool = "cable-straight";
      state.cablePending = null;
      state.pduPendingSource = null;
      sound.click();
      render();
    });

    document.getElementById("tool-cable-cross")?.addEventListener("click", () => {
      state.activeTool = "cable-cross";
      state.cablePending = null;
      state.pduPendingSource = null;
      sound.click();
      render();
    });

    // Add device buttons
    container.querySelectorAll(".btn-add-device").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        addDeviceToCanvas(type);
      });
    });

    // Event row click -> open PDU Modal
    container.querySelectorAll(".event-row").forEach(row => {
      row.addEventListener("click", () => {
        const stepIdx = parseInt(row.dataset.step, 10);
        openPduModal(stepIdx);
      });
    });
  }

  // --------------------------------------------------------------------------
  // Trigger Quick Ping
  // --------------------------------------------------------------------------
  function triggerQuickPing() {
    sound.click();
    const pcNode = Object.values(state.nodes).find(n => n.type === "pc" || n.type === "laptop") || Object.values(state.nodes)[0];
    const targetNode = Object.values(state.nodes).find(n => n.id !== pcNode?.id);

    if (pcNode && targetNode) {
      runPduPathfinding(pcNode.id, targetNode.id, true);
      render();
      if (state.mode === "simulation") {
        playSimulation();
      }
    } else {
      alert("Harap tambahkan setidaknya 2 perangkat (contoh: PC dan Server) ke kanvas untuk menguji Ping.");
    }
  }

  // --------------------------------------------------------------------------
  // Add Device Functionality
  // --------------------------------------------------------------------------
  function addDeviceToCanvas(type) {
    const spec = DEVICE_TYPES[type];
    if (!spec) return;

    sound.click();
    const count = Object.values(state.nodes).filter(n => n.type === type).length;
    const newId = `${type}_${Date.now().toString(36).slice(-4)}`;
    const name = `${spec.prefix}${count}`;

    const currentCount = Object.keys(state.nodes).length;
    const posX = 100 + (currentCount % 5) * 115;
    const posY = 100 + Math.floor(currentCount / 5) * 125;

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
    render();
  }

  // --------------------------------------------------------------------------
  // Simulation Playback Loop
  // --------------------------------------------------------------------------
  function playSimulation() {
    if (state.simulationSteps.length === 0) {
      triggerQuickPing();
      return;
    }

    state.simState = "playing";
    sound.success();
    render();

    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => {
      if (state.currentStepIndex < state.simulationSteps.length - 1) {
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
    if (state.simulationSteps.length === 0) {
      triggerQuickPing();
      return;
    }

    if (state.currentStepIndex < state.simulationSteps.length - 1) {
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
  // Port Selection Modal (Interactive Wiring Dialog)
  // --------------------------------------------------------------------------
  function openPortSelectionModal(node) {
    const modal = document.getElementById("cisco-port-modal");
    if (!modal) return;

    const cableKind = state.activeTool === "cable-cross" ? "cross" : "straight";

    const portUsage = {};
    state.links.forEach(l => {
      if (l.fromNode === node.id) portUsage[l.fromPort] = state.nodes[l.toNode]?.name || "Perangkat";
      if (l.toNode === node.id) portUsage[l.toPort] = state.nodes[l.fromNode]?.name || "Perangkat";
    });

    const isSelectingSource = !state.cablePending;

    modal.classList.remove("hidden");
    modal.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-2xl space-y-4 animate-scale-up text-left font-mono">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg ${isSelectingSource ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'} flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">settings_ethernet</span>
            </span>
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                ${isSelectingSource ? 'Langkah 1: Pilih Port Asal' : 'Langkah 2: Hubungkan ke Port Tujuan'}
              </span>
              <h3 class="text-sm font-bold text-slate-900">${node.name} (${node.model})</h3>
            </div>
          </div>
          <button id="btn-close-port-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p class="text-xs text-slate-600 font-sans">
          ${isSelectingSource 
            ? `Pilih salah satu port fisik pada <strong>${node.name}</strong> untuk mencolokkan kabel <strong>${cableKind === 'cross' ? 'Cross-Over' : 'Straight-Through'}</strong>:` 
            : `Hubungkan kabel dari <strong>${state.nodes[state.cablePending.fromNodeId]?.name || ''} (${state.cablePending.fromPort})</strong> ke salah satu port tersedia pada <strong>${node.name}</strong>:`}
        </p>

        <div class="space-y-1.5 max-h-60 overflow-y-auto">
          ${node.ports.map(portName => {
            const connectedTo = portUsage[portName];
            const isOccupied = !!connectedTo;
            return `
              <button class="w-full text-left p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all ${isOccupied ? 'opacity-50 bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-slate-800 cursor-pointer shadow-2xs'}" data-port="${portName}" ${isOccupied ? 'disabled' : ''}>
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${isOccupied ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
                  <span class="font-bold">${portName}</span>
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded font-sans ${isOccupied ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                  ${isOccupied ? `Terhubung: ${connectedTo}` : 'Tersedia'}
                </span>
              </button>
            `;
          }).join("")}
        </div>

        <button id="btn-cancel-port-modal" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer">
          Batal
        </button>
      </div>
    `;

    const closeModal = () => {
      modal.classList.add("hidden");
    };

    document.getElementById("btn-close-port-modal")?.addEventListener("click", closeModal);
    document.getElementById("btn-cancel-port-modal")?.addEventListener("click", closeModal);

    modal.querySelectorAll("button[data-port]").forEach(btn => {
      btn.addEventListener("click", () => {
        const selectedPort = btn.dataset.port;
        closeModal();

        if (isSelectingSource) {
          sound.click();
          state.cablePending = {
            fromNodeId: node.id,
            fromPort: selectedPort,
            cableType: cableKind
          };
          render();
        } else {
          if (node.id === state.cablePending.fromNodeId) {
            alert("Tidak dapat menghubungkan kabel ke perangkat yang sama.");
            state.cablePending = null;
            render();
            return;
          }

          sound.success();
          state.links.push({
            id: `link_${Date.now().toString(36)}`,
            fromNode: state.cablePending.fromNodeId,
            fromPort: state.cablePending.fromPort,
            toNode: node.id,
            toPort: selectedPort,
            cableType: state.cablePending.cableType,
            status: "up"
          });

          state.cablePending = null;
          state.activeTool = "select";
          render();
        }
      });
    });
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
      <div class="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-scale-up text-left font-mono max-h-[88vh] overflow-y-auto">
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
              <h3 class="text-sm font-bold text-slate-900 mt-0.5">PDU Information at Device: ${s.atDevice} (${s.type})</h3>
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
  // Cisco Device Inspector Modal (Desktop, Config, CLI, Physical)
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

    document.getElementById("btn-close-dev-modal")?.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

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
      render();
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
      render();
    });

    document.getElementById("btn-preset-ip")?.addEventListener("click", () => {
      dev.ip = dev.type === "server" ? "10.10.20.50" : "192.168.1.10";
      dev.mask = "255.255.255.0";
      dev.gateway = dev.type === "server" ? "10.10.20.1" : "192.168.1.1";
      sound.click();
      renderDeviceModalContent();
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
          <button id="btn-preset-ip" class="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 rounded font-mono text-[10px] font-bold cursor-pointer">
            ✨ Auto IP Preset
          </button>
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
            Ketik alamat IP Server Web (misal: <code>http://10.10.20.50</code>) lalu tekan <strong>Go</strong> untuk menguji koneksi HTTP.
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
            `Ping statistics for ${targetDev.ip}:`,
            `    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`
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
        `Ping statistics for ${targetQuery}:`,
        `    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)`
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

  // --------------------------------------------------------------------------
  // Canvas Workspace Engine & Touch Dragging
  // --------------------------------------------------------------------------
  function initCanvas() {
    const canvas = document.getElementById("cisco-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let isDragging = false;
    let draggedNodeId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw(ctx, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    function findNodeAt(cx, cy) {
      const hitRadius = 42;
      for (const node of Object.values(state.nodes)) {
        const dx = cx - node.x;
        const dy = cy - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < hitRadius) {
          return node;
        }
      }
      return null;
    }

    // Pointer Down
    const handleDown = (e) => {
      const pos = getCanvasCoords(e);
      const clickedNode = findNodeAt(pos.x, pos.y);

      // Tool: DELETE
      if (state.activeTool === "delete") {
        if (clickedNode) {
          sound.click();
          state.links = state.links.filter(l => l.fromNode !== clickedNode.id && l.toNode !== clickedNode.id);
          delete state.nodes[clickedNode.id];
          if (state.selectedDeviceId === clickedNode.id) {
            state.selectedDeviceId = null;
          }
          render();
        }
        return;
      }

      // Tool: CABLE (Straight / Cross)
      if (state.activeTool === "cable-straight" || state.activeTool === "cable-cross") {
        if (clickedNode) {
          sound.click();
          openPortSelectionModal(clickedNode);
        }
        return;
      }

      // Tool: PDU (Envelope Ping)
      if (state.activeTool === "pdu") {
        if (clickedNode) {
          sound.click();
          if (!state.pduPendingSource) {
            state.pduPendingSource = clickedNode.id;
            state.lastPduResult = {
              status: "In Progress",
              source: clickedNode.name,
              target: "?",
              type: "ICMP",
              time: "0.00 ms",
              message: `Pilih perangkat target untuk mengirim paket dari ${clickedNode.name}...`
            };
            render();
          } else {
            const srcId = state.pduPendingSource;
            const dstId = clickedNode.id;
            state.pduPendingSource = null;
            state.activeTool = "select";
            runPduPathfinding(srcId, dstId, true);
            render();
          }
        }
        return;
      }

      // Tool: SELECT (Move / Tap)
      if (clickedNode) {
        state.selectedDeviceId = clickedNode.id;
        isDragging = true;
        draggedNodeId = clickedNode.id;
        dragOffsetX = pos.x - clickedNode.x;
        dragOffsetY = pos.y - clickedNode.y;

        const inspectBtn = document.getElementById("btn-inspect-selected");
        if (inspectBtn) {
          inspectBtn.removeAttribute("disabled");
          inspectBtn.classList.remove("bg-slate-100", "text-slate-400", "cursor-not-allowed");
          inspectBtn.classList.add("bg-indigo-600", "text-white", "hover:bg-indigo-700");
          inspectBtn.innerHTML = `
            <span class="material-symbols-outlined text-[16px]">settings</span>
            <span>Konfigurasi: ${clickedNode.name}</span>
          `;
        }

        draw(ctx, canvas.width, canvas.height);
      } else {
        state.selectedDeviceId = null;
        draw(ctx, canvas.width, canvas.height);
      }
    };

    // Pointer Move
    const handleMove = (e) => {
      const pos = getCanvasCoords(e);
      state.pointerPos.x = pos.x;
      state.pointerPos.y = pos.y;
      state.pointerPos.active = true;

      if (isDragging && draggedNodeId && state.nodes[draggedNodeId]) {
        state.nodes[draggedNodeId].x = Math.max(40, Math.min(canvas.width - 40, pos.x - dragOffsetX));
        state.nodes[draggedNodeId].y = Math.max(40, Math.min(canvas.height - 40, pos.y - dragOffsetY));
        draw(ctx, canvas.width, canvas.height);
      } else if (state.cablePending) {
        draw(ctx, canvas.width, canvas.height);
      }
    };

    // Pointer Up
    const handleUp = () => {
      if (isDragging) {
        isDragging = false;
        draggedNodeId = null;
      }
    };

    // Double-click to open inspector
    canvas.addEventListener("dblclick", (e) => {
      const pos = getCanvasCoords(e);
      const clickedNode = findNodeAt(pos.x, pos.y);
      if (clickedNode) {
        openDeviceModal(clickedNode.id);
      }
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
  }

  // --------------------------------------------------------------------------
  // Canvas Drawing Engine (Nodes, Cables, Rubberband, and Glowing Envelope)
  // --------------------------------------------------------------------------
  function draw(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);

    // Cisco Blueprint Grid Background
    ctx.fillStyle = "#0a0f1d";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
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

    // 1. Draw Links (Cables)
    state.links.forEach(link => {
      const n1 = state.nodes[link.fromNode];
      const n2 = state.nodes[link.toNode];
      if (n1 && n2) {
        drawCable(ctx, n1.x, n1.y, n2.x, n2.y, link.cableType, link.fromPort, link.toPort);
      }
    });

    // 2. Draw In-Progress Rubberband Cable
    if (state.cablePending && state.pointerPos.active) {
      const fromN = state.nodes[state.cablePending.fromNodeId];
      if (fromN) {
        ctx.save();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(fromN.x, fromN.y);
        ctx.lineTo(state.pointerPos.x, state.pointerPos.y);
        ctx.stroke();

        ctx.strokeStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(fromN.x, fromN.y, 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw Nodes (Hardware Devices)
    Object.values(state.nodes).forEach(node => {
      drawDevice(ctx, node.x, node.y, node);
    });

    // 4. Draw Active PDU Flight Animation
    const s = state.simulationSteps[state.currentStepIndex];
    if (s && state.nodes) {
      const activeDev = Object.values(state.nodes).find(n => n.name === s.atDevice);
      if (activeDev) {
        ctx.save();
        ctx.translate(activeDev.x, activeDev.y - 44);

        ctx.shadowColor = s.color || "#f59e0b";
        ctx.shadowBlur = 14;

        const envW = 40;
        const envH = 26;

        ctx.fillStyle = s.color || "#f59e0b";
        ctx.fillRect(-envW / 2, -envH / 2, envW, envH);

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-envW / 2, -envH / 2, envW, envH);

        ctx.beginPath();
        ctx.moveTo(-envW / 2, -envH / 2);
        ctx.lineTo(0, 4);
        ctx.lineTo(envW / 2, -envH / 2);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(s.type || "PDU", 0, 8);

        ctx.restore();
      }
    }
  }

  function drawCable(ctx, x1, y1, x2, y2, cableType, port1, port2) {
    ctx.save();

    const isCross = cableType === "cross";
    ctx.strokeStyle = isCross ? "#f59e0b" : "#38bdf8";
    ctx.lineWidth = 2.5;

    if (isCross) {
      ctx.setLineDash([8, 5]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = "#10b981";
    drawLinkLight(ctx, x1 + (x2 - x1) * 0.16, y1 + (y2 - y1) * 0.16, true);
    drawLinkLight(ctx, x2 - (x2 - x1) * 0.16, y2 - (y2 - y1) * 0.16, false);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(port1 || "", x1 + (x2 - x1) * 0.22, y1 + (y2 - y1) * 0.22 - 6);
    ctx.fillText(port2 || "", x2 - (x2 - x1) * 0.22, y2 - (y2 - y1) * 0.22 - 6);

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

  function drawDevice(ctx, x, y, node) {
    ctx.save();

    const isSelected = node.id === state.selectedDeviceId;
    const isPduSource = node.id === state.pduPendingSource;
    const isCableSource = state.cablePending && state.cablePending.fromNodeId === node.id;

    const cardW = 88;
    const cardH = 76;
    const halfW = cardW / 2;
    const halfH = cardH / 2;
    const radius = 10;

    if (isSelected || isPduSource || isCableSource) {
      ctx.shadowColor = isPduSource ? "#f59e0b" : (isCableSource ? "#38bdf8" : "#6366f1");
      ctx.shadowBlur = 16;
    }

    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = isPduSource ? "#f59e0b" : (isCableSource ? "#38bdf8" : (isSelected ? "#6366f1" : "rgba(148, 163, 184, 0.35)"));
    ctx.lineWidth = isSelected || isPduSource || isCableSource ? 2.5 : 1.5;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - halfW, y - halfH, cardW, cardH, radius) : ctx.rect(x - halfW, y - halfH, cardW, cardH);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.fillStyle = node.poweredOn ? "#10b981" : "#ef4444";
    ctx.beginPath();
    ctx.arc(x + 33, y - 25, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    const symbol = node.type === "switch" ? "☵" : (node.type === "router" ? "⨁" : (node.type === "server" ? "🗄️" : (node.type === "laptop" ? "💻" : "🖥️")));
    ctx.fillText(symbol, x, y - 4);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(node.name, x, y + 15);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.fillText(node.ip, x, y + 26);

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // Initial Boot
  // --------------------------------------------------------------------------
  loadStandardTemplate();
  render();
}
