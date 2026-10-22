// NetQuest - Interactive Network Simulations & 3D Visualizer Lab
// Rich animated simulations, 3D WebGL topology renderings, and interactive labs for all 6 topics.

export function renderTopicSimulation(topicId, container) {
  switch (topicId) {
    case 1:
      renderSimulationScope(container);
      break;
    case 2:
      renderSimulationTopology(container);
      break;
    case 3:
      renderSimulationOSI(container);
      break;
    case 4:
      renderSimulationSubnetting(container);
      break;
    case 5:
      renderSimulationHardware(container);
      break;
    case 6:
      renderSimulationServices(container);
      break;
    default:
      renderSimulationScope(container);
  }
}

// ============================================================================
// TOPIK 1: SIMULASI JANGKAUAN JARINGAN (PAN, LAN, MAN, WAN)
// ============================================================================
function renderSimulationScope(container) {
  container.innerHTML = `
    <div class="sim-wrapper">
      <div class="sim-controls-bar">
        <span style="font-weight: 700; font-size: 0.9rem; color: var(--primary);">🌐 Pilih Cakupan Jaringan:</span>
        <div class="btn-group-toggle">
          <button class="btn btn-sm btn-outline active sim-scope-btn" data-scope="pan">PAN (10m)</button>
          <button class="btn btn-sm btn-outline sim-scope-btn" data-scope="lan">LAN (100m)</button>
          <button class="btn btn-sm btn-outline sim-scope-btn" data-scope="man">MAN (15km)</button>
          <button class="btn btn-sm btn-outline sim-scope-btn" data-scope="wan">WAN (Global)</button>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-run-ping-test">⚡ Uji Kirim Paket</button>
      </div>

      <div class="sim-canvas-container" style="position: relative; height: 320px; background: #070b12; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-subtle);">
        <canvas id="scope-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
        <div id="scope-telemetry-badge" style="position: absolute; bottom: 12px; left: 12px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); border: 1px solid var(--border-neon); border-radius: var(--radius-sm); padding: 8px 14px; font-family: var(--font-mono); font-size: 0.82rem; color: #38bdf8;">
          Latency: <span id="telemetry-rtt">0.8 ms</span> | Throughput: <span id="telemetry-speed">24 Mbps</span> | Jangkauan: <span id="telemetry-range">&lt; 10 Meter</span>
        </div>
      </div>

      <div class="sim-info-box" id="scope-info-box" style="margin-top: 1rem; padding: 1rem; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 0.9rem;">
        <!-- Dynamic case study card -->
      </div>
    </div>
  `;

  const canvas = document.getElementById("scope-canvas");
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  let currentScope = "pan";
  let pulseRadius = 0;
  let packets = [];

  const scopeData = {
    pan: {
      title: "Personal Area Network (PAN) - Contoh Kasus: Smartwatch & AR Headset di Ruang Operasi",
      desc: "Menghubungkan perangkat pribadi dalam radius tubuh &lt; 10 meter (Bluetooth BLE / UWB). Tidak membebani jaringan luar, latensi sangat rendah (&lt; 1ms), throughput moderat (1 - 24 Mbps).",
      rtt: "0.8 ms",
      speed: "24 Mbps",
      range: "&lt; 10 Meter",
      nodeCount: 3,
      color: "#00ff9d"
    },
    lan: {
      title: "Local Area Network (LAN) - Contoh Kasus: Laboratorium Komputer Sekolah",
      desc: "Menghubungkan 30 komputer lab dalam satu gedung menggunakan Gigabit Ethernet Switch Cat6. Kecepatan 1.000 Mbps (1 Gbps) dengan latensi &lt; 2ms tanpa melalui internet luar.",
      rtt: "1.4 ms",
      speed: "1 Gbps (1000 Mbps)",
      range: "100 m - 1 km",
      nodeCount: 6,
      color: "#38bdf8"
    },
    man: {
      title: "Metropolitan Area Network (MAN) - Contoh Kasus: Rumah Sakit & 4 Klinik Satelit",
      desc: "Menghubungkan gedung rumah sakit pusat dengan 4 klinik satelit dalam radius 15 km di satu kota melalui cincin serat optik (Leased Fiber Ring). Latensi 8 ms terjamin untuk rekam medis real-time.",
      rtt: "8.2 ms",
      speed: "10 Gbps",
      range: "15 - 50 km",
      nodeCount: 5,
      color: "#a855f7"
    },
    wan: {
      title: "Wide Area Network (WAN) - Contoh Kasus: Koneksi Jakarta ke Server Tokyo & Frankfurt",
      desc: "Jaringan antar-negara melintasi benua melalui kabel optik bawah laut dan satelit. Menghubungkan jutaan router dengan latensi 35 - 180 ms.",
      rtt: "142.5 ms",
      speed: "100 Gbps Backbone",
      range: "Antar Benua (Global)",
      nodeCount: 8,
      color: "#ec4899"
    }
  };

  function updateInfo() {
    const data = scopeData[currentScope];
    document.getElementById("telemetry-rtt").textContent = data.rtt;
    document.getElementById("telemetry-speed").textContent = data.speed;
    document.getElementById("telemetry-range").textContent = data.range;

    document.getElementById("scope-info-box").innerHTML = `
      <div style="font-weight: 700; color: ${data.color}; margin-bottom: 0.35rem;">📍 ${data.title}</div>
      <p style="color: var(--text-muted); line-height: 1.5;">${data.desc}</p>
    `;
  }

  container.querySelectorAll(".sim-scope-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".sim-scope-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentScope = btn.dataset.scope;
      pulseRadius = 0;
      packets = [];
      updateInfo();
    });
  });

  document.getElementById("btn-run-ping-test")?.addEventListener("click", () => {
    const data = scopeData[currentScope];
    for (let i = 0; i < 5; i++) {
      packets.push({
        x: width / 2,
        y: height / 2,
        targetAngle: Math.random() * Math.PI * 2,
        dist: 0,
        maxDist: Math.min(width, height) * 0.42,
        color: data.color
      });
    }
  });

  updateInfo();

  let animId;
  function animate() {
    ctx.clearRect(0, 0, width, height);
    const data = scopeData[currentScope];
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw range rings
    pulseRadius = (pulseRadius + 0.6) % 120;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius + 30, 0, Math.PI * 2);
    ctx.strokeStyle = `${data.color}25`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central Node
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.fillStyle = data.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = data.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#090d16";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("HOST", centerX, centerY + 3);

    // Peripheral Nodes
    const count = data.nodeCount;
    const ringRadius = Math.min(width, height) * 0.35;
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const nx = centerX + Math.cos(angle) * ringRadius;
      const ny = centerY + Math.sin(angle) * ringRadius;

      // Link line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = `${data.color}40`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node circle
      ctx.beginPath();
      ctx.arc(nx, ny, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = data.color;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }

    // Draw moving test packets
    for (let pIdx = packets.length - 1; pIdx >= 0; pIdx--) {
      const p = packets[pIdx];
      p.dist += 2.5;
      const px = p.x + Math.cos(p.targetAngle) * p.dist;
      const py = p.y + Math.sin(p.targetAngle) * p.dist;

      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (p.dist >= p.maxDist) {
        packets.splice(pIdx, 1);
      }
    }

    animId = requestAnimationFrame(animate);
  }
  animate();
}

// ============================================================================
// TOPIK 2: SIMULASI TOPOLOGI 3D & 2D (BUS, STAR, RING, MESH, TREE)
// ============================================================================
function renderSimulationTopology(container) {
  container.innerHTML = `
    <div class="sim-wrapper">
      <div class="sim-controls-bar">
        <span style="font-weight: 700; font-size: 0.9rem; color: var(--primary);">🕸️ Bentuk Topologi:</span>
        <div class="btn-group-toggle">
          <button class="btn btn-sm btn-outline active topo-btn" data-topo="bus">Bus</button>
          <button class="btn btn-sm btn-outline topo-btn" data-topo="star">Star</button>
          <button class="btn btn-sm btn-outline topo-btn" data-topo="ring">Ring</button>
          <button class="btn btn-sm btn-outline topo-btn" data-topo="mesh">Mesh</button>
          <button class="btn btn-sm btn-outline topo-btn" data-topo="tree">Tree</button>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary btn-sm" id="btn-topo-send">🚀 Kirim Paket</button>
          <button class="btn btn-secondary btn-sm" id="btn-topo-break" style="color: var(--accent-rose);">⚠️ Simulasi Rusak</button>
        </div>
      </div>

      <div class="sim-canvas-container" style="position: relative; height: 350px; background: #070b12; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-subtle);">
        <canvas id="topo-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
        <div id="topo-alert-overlay" style="display: none; position: absolute; top: 12px; right: 12px; background: rgba(244, 63, 94, 0.9); color: white; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.78rem; font-weight: 700; box-shadow: 0 0 15px rgba(244,63,94,0.5);">
          🚨 SIGNAL BOUNCE / LINK DOWN
        </div>
      </div>

      <div class="sim-info-box" id="topo-info-box" style="margin-top: 1rem; padding: 1rem; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 0.9rem;">
        <!-- Dynamic Topology Analysis -->
      </div>
    </div>
  `;

  const canvas = document.getElementById("topo-canvas");
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  let currentTopo = "bus";
  let isBroken = false;
  let packetAnim = { active: false, progress: 0, from: 0, to: 3 };

  const topoDescriptions = {
    bus: {
      name: "Topologi Bus (Linear)",
      desc: "Semua perangkat berderet pada kabel backbone koaksial tunggal. Wajib ada <strong>terminator 50-ohm</strong> di kedua ujung. Jika terminator dilepas, terjadi <em>signal reflection</em> (pantulan sinyal) yang merusak seluruh komunikasi!",
      breakEffect: "Terminator ujung dilepas! Sinyal listrik memantul tak beraturan (signal collision) dan seluruh bus mati."
    },
    star: {
      name: "Topologi Star (Bintang)",
      desc: "Setiap workstation terhubung ke satu Switch sentral. Jika salah satu workstation kabelnya putus, workstation lain tetap beroperasi normal.",
      breakEffect: "Switch sentral mengalami kegagalan listrik (Single Point of Failure)! Seluruh workstation terputus serentak."
    },
    ring: {
      name: "Topologi Ring (Cincin)",
      desc: "Node terhubung melingkar searah. Menggunakan mekanisme peredaran <em>Token Passing</em> (IEEE 802.5). Bebas tabrakan data (collision-free).",
      breakEffect: "Satu sambungan kabel ring terputus! Peredaran token terhenti dan jaringan cincin lumpuh total."
    },
    mesh: {
      name: "Topologi Full Mesh (Jala Redundan)",
      desc: "Setiap server terhubung ke setiap server lain (n*(n-1)/2 koneksi). Toleransi kesalahan 99.999% paling tinggi untuk bursa saham & perbankan.",
      breakEffect: "Link utama terputus, namun paket data otomatis dialihkan (auto-reroute) lewat jalur alternatif tanpa downtime!"
    },
    tree: {
      name: "Topologi Tree (Pohon / Hierarchical)",
      desc: "Kombinasi hierarkis (Core Switch -> Distribution Switch -> Access Switch) umum di gedung bertingkat 4 lantai.",
      breakEffect: "Switch Distribusi Lantai 3 putus! Hanya Lantai 3 yang terisolasi, sementara Lantai 1, 2, dan 4 normal."
    }
  };

  function updateTopoInfo() {
    const data = topoDescriptions[currentTopo];
    const alertBox = document.getElementById("topo-alert-overlay");
    if (isBroken) {
      alertBox.style.display = "block";
      alertBox.textContent = `🚨 ${data.breakEffect}`;
    } else {
      alertBox.style.display = "none";
    }

    document.getElementById("topo-info-box").innerHTML = `
      <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.35rem;">⚡ ${data.name}</div>
      <p style="color: var(--text-muted); line-height: 1.5;">${data.desc}</p>
      ${isBroken ? `<p style="color: var(--accent-rose); font-weight: 600; margin-top: 0.4rem;">⚠️ Efek Gangguan: ${data.breakEffect}</p>` : ""}
    `;
  }

  container.querySelectorAll(".topo-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".topo-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTopo = btn.dataset.topo;
      isBroken = false;
      packetAnim.active = false;
      updateTopoInfo();
    });
  });

  document.getElementById("btn-topo-send")?.addEventListener("click", () => {
    packetAnim.active = true;
    packetAnim.progress = 0;
  });

  document.getElementById("btn-topo-break")?.addEventListener("click", () => {
    isBroken = !isBroken;
    updateTopoInfo();
  });

  updateTopoInfo();

  function animate() {
    ctx.clearRect(0, 0, width, height);

    if (currentTopo === "bus") {
      drawBusTopology();
    } else if (currentTopo === "star") {
      drawStarTopology();
    } else if (currentTopo === "ring") {
      drawRingTopology();
    } else if (currentTopo === "mesh") {
      drawMeshTopology();
    } else if (currentTopo === "tree") {
      drawTreeTopology();
    }

    if (packetAnim.active) {
      packetAnim.progress += 0.02;
      if (packetAnim.progress >= 1) packetAnim.active = false;
    }

    requestAnimationFrame(animate);
  }
  animate();

  function drawBusTopology() {
    const y = height / 2;
    // Backbone line
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(width - 80, y);
    ctx.strokeStyle = isBroken ? "var(--accent-rose)" : "var(--primary)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Terminators
    ctx.fillStyle = isBroken ? "#475569" : "#f59e0b";
    ctx.fillRect(65, y - 10, 15, 20);
    ctx.fillRect(width - 80, y - 10, 15, 20);

    // Nodes
    const nodeCount = 5;
    for (let i = 0; i < nodeCount; i++) {
      const x = 120 + (i * (width - 240)) / (nodeCount - 1);
      // Drop cable
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - 60);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node box
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "var(--primary)";
      ctx.lineWidth = 2;
      ctx.fillRect(x - 20, y - 90, 40, 30);
      ctx.strokeRect(x - 20, y - 90, 40, 30);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`PC ${i + 1}`, x, y - 72);
    }

    // Packet
    if (packetAnim.active) {
      const startX = 120;
      const endX = 120 + (3 * (width - 240)) / 4;
      const curX = startX + (endX - startX) * packetAnim.progress;
      ctx.beginPath();
      ctx.arc(curX, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = isBroken ? "var(--accent-rose)" : "#00ff9d";
      ctx.fill();
    }
  }

  function drawStarTopology() {
    const cx = width / 2;
    const cy = height / 2;

    // Central Switch
    ctx.fillStyle = isBroken ? "var(--accent-rose)" : "#0284c7";
    ctx.fillRect(cx - 30, cy - 20, 60, 40);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(cx - 30, cy - 20, 60, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isBroken ? "DEAD" : "SWITCH", cx, cy + 4);

    const nodes = 6;
    const radius = 110;
    for (let i = 0; i < nodes; i++) {
      const angle = (i * 2 * Math.PI) / nodes;
      const nx = cx + Math.cos(angle) * radius;
      const ny = cy + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = isBroken ? "rgba(244, 63, 94, 0.3)" : "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "var(--primary)";
      ctx.beginPath();
      ctx.arc(nx, ny, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`PC${i + 1}`, nx, ny + 3);
    }
  }

  function drawRingTopology() {
    const cx = width / 2;
    const cy = height / 2;
    const r = 100;
    const count = 5;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isBroken ? "rgba(244, 63, 94, 0.4)" : "var(--primary)";
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < count; i++) {
      const a = (i * 2 * Math.PI) / count;
      const nx = cx + Math.cos(a) * r;
      const ny = cy + Math.sin(a) * r;

      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, ny, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`N${i + 1}`, nx, ny + 3);
    }
  }

  function drawMeshTopology() {
    const cx = width / 2;
    const cy = height / 2;
    const count = 5;
    const r = 110;
    const pos = [];

    for (let i = 0; i < count; i++) {
      const a = (i * 2 * Math.PI) / count;
      pos.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }

    // Interconnect all
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        ctx.beginPath();
        ctx.moveTo(pos[i].x, pos[i].y);
        ctx.lineTo(pos[j].x, pos[j].y);
        ctx.strokeStyle = "rgba(0, 255, 157, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    pos.forEach((p, idx) => {
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#00ff9d";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`SRV${idx + 1}`, p.x, p.y + 3);
    });
  }

  function drawTreeTopology() {
    const cx = width / 2;
    // Core
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(cx - 30, 40, 60, 30);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("CORE", cx, 60);

    // Distribution
    const distXs = [cx - 120, cx, cx + 120];
    distXs.forEach((dx, idx) => {
      ctx.beginPath();
      ctx.moveTo(cx, 70);
      ctx.lineTo(dx, 120);
      ctx.strokeStyle = idx === 2 && isBroken ? "var(--accent-rose)" : "rgba(0, 240, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = idx === 2 && isBroken ? "var(--accent-rose)" : "#1e293b";
      ctx.strokeStyle = "var(--primary)";
      ctx.fillRect(dx - 25, 120, 50, 25);
      ctx.strokeRect(dx - 25, 120, 50, 25);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Lantai ${idx + 1}`, dx, 137);
    });
  }
}

// ============================================================================
// TOPIK 3: SIMULASI 7 LAPISAN OSI & TCP 3-WAY HANDSHAKE
// ============================================================================
function renderSimulationOSI(container) {
  let activeTab = "encap";
  let step = 0;

  function update() {
    container.innerHTML = `
      <div class="sim-wrapper">
        <div class="sim-controls-bar">
          <span style="font-weight: 700; font-size: 0.9rem; color: var(--primary);">📚 Laboratorium Protokol:</span>
          <div class="btn-group-toggle">
            <button class="btn btn-sm btn-outline ${activeTab === "encap" ? "active" : ""} tab-encap-btn">1. Enkapsulasi PDU</button>
            <button class="btn btn-sm btn-outline ${activeTab === "handshake" ? "active" : ""} tab-handshake-btn">2. TCP 3-Way Handshake vs UDP</button>
          </div>
        </div>

        ${activeTab === "encap" ? renderEncapLab() : renderHandshakeLab()}
      </div>
    `;

    container.querySelector(".tab-encap-btn")?.addEventListener("click", () => {
      activeTab = "encap";
      step = 0;
      update();
    });

    container.querySelector(".tab-handshake-btn")?.addEventListener("click", () => {
      activeTab = "handshake";
      update();
    });

    attachLabEvents();
  }

  function renderEncapLab() {
    const steps = [
      { layer: "Layer 7: Application", pdu: "Data Payload", content: '{"pesan": "Transfer Rp 500.000", "ke": "Rekening 88201"}', color: "#a855f7" },
      { layer: "Layer 4: Transport (TCP)", pdu: "Segment", content: '[TCP Port Asal: 54120 | Port Tujuan: 443 (HTTPS) | Seq: 101] + Payload Data', color: "#00f0ff" },
      { layer: "Layer 3: Network (IP)", pdu: "Packet", content: '[IP Sumber: 192.168.1.50 | IP Tujuan: 103.20.15.4 | TTL: 64] + TCP Header + Data', color: "#38bdf8" },
      { layer: "Layer 2: Data Link (Ethernet)", pdu: "Frame", content: '[MAC Asal: A4:83:E7:... | MAC Tujuan: FC:FB:FB:... | Preamble] + IP Packet + [FCS CRC32]', color: "#10b981" },
      { layer: "Layer 1: Physical", pdu: "Bits", content: '01001101 01100001 01100011 01101000 01101001 01101110 01100101 (Gelombang Listrik / Pulsa Cahaya Optik)', color: "#f59e0b" }
    ];

    return `
      <div style="background: #070b12; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <span style="font-weight: 700; color: #38bdf8;">Alur Enkapsulasi Paket Data (Dari Aplikasi ke Kabel Fisik)</span>
          <button class="btn btn-primary btn-sm" id="btn-next-encap-step">
            ${step < 4 ? "Langkah Enkapsulasi Berikutnya ⬇️" : "Reset Enkapsulasi 🔄"}
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${steps.map((s, idx) => {
            const isVisible = idx <= step;
            return `
              <div style="padding: 1rem; border-radius: var(--radius-sm); border: 1px solid ${isVisible ? s.color : "rgba(255,255,255,0.05)"}; background: ${isVisible ? "rgba(15, 23, 42, 0.8)" : "rgba(15, 23, 42, 0.2)"}; opacity: ${isVisible ? 1 : 0.35}; transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 700; color: ${s.color};">
                  <span>${s.layer}</span>
                  <span style="font-family: var(--font-mono); background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px;">PDU: ${s.pdu}</span>
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.8rem; color: #cbd5e1; margin-top: 0.4rem; word-break: break-all;">
                  ${s.content}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderHandshakeLab() {
    return `
      <div style="background: #070b12; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <span style="font-weight: 700; color: var(--primary);">Simulasi TCP 3-Way Handshake (SYN ➔ SYN-ACK ➔ ACK)</span>
          <button class="btn btn-primary btn-sm" id="btn-start-handshake">Mulai Handshake</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; text-align: center; margin: 1.5rem 0;">
          <div style="background: rgba(30, 41, 59, 0.6); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="font-size: 1.5rem;">💻</div>
            <div style="font-weight: 700;">Klien (Browser)</div>
            <div style="font-size: 0.8rem; color: var(--text-dim);">IP: 192.168.1.10</div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.6); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <div style="font-size: 1.5rem;">🖥️</div>
            <div style="font-weight: 700;">Web Server</div>
            <div style="font-size: 0.8rem; color: var(--text-dim);">IP: 103.20.15.4 (Port 443)</div>
          </div>
        </div>

        <div id="handshake-log-box" style="font-family: var(--font-mono); font-size: 0.82rem; background: #090d16; padding: 1rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); min-height: 110px; line-height: 1.6; color: #38bdf8;">
          Tekan "Mulai Handshake" untuk mengamati pertukaran paket kontrol SYN, SYN-ACK, dan ACK sebelum data terkirim.
        </div>
      </div>
    `;
  }

  function attachLabEvents() {
    document.getElementById("btn-next-encap-step")?.addEventListener("click", () => {
      step = step < 4 ? step + 1 : 0;
      update();
    });

    document.getElementById("btn-start-handshake")?.addEventListener("click", () => {
      const logBox = document.getElementById("handshake-log-box");
      logBox.innerHTML = `[0.0ms] Klien mengirim: <strong>SYN (Sequence = 100)</strong> ➔ Meminta buka sesi.<br/>`;
      setTimeout(() => {
        logBox.innerHTML += `[14.2ms] Server merespons: <strong>SYN-ACK (Seq = 300, Ack = 101)</strong> ➔ Server setuju.<br/>`;
      }, 700);
      setTimeout(() => {
        logBox.innerHTML += `[28.5ms] Klien mengirim: <strong>ACK (Ack = 301)</strong> ➔ Koneksi Terbuka (ESTABLISHED)!<br/>`;
        logBox.innerHTML += `<span style="color: #00ff9d;">✓ Sesi TCP siap mengalirkan data HTTP/HTTPS dengan aman dan terurut.</span>`;
      }, 1400);
    });
  }

  update();
}

// ============================================================================
// TOPIK 4: KALKULATOR SUBNETTING INTERAKTIF & VISUAL BIT SLICER
// ============================================================================
function renderSimulationSubnetting(container) {
  let ipInput = "192.168.10.0";
  let cidr = 27;

  function calculate() {
    const maskBits = cidr;
    const hostBits = 32 - maskBits;
    const totalHosts = Math.pow(2, hostBits);
    const usableHosts = Math.max(0, totalHosts - 2);

    const maskOctets = [];
    for (let i = 0; i < 4; i++) {
      const bits = Math.max(0, Math.min(8, maskBits - i * 8));
      let octet = 0;
      for (let b = 0; b < bits; b++) {
        octet += Math.pow(2, 7 - b);
      }
      maskOctets.push(octet);
    }
    const maskStr = maskOctets.join(".");

    // Parse IP
    const ipParts = ipInput.split(".").map(n => parseInt(n, 10) || 0);
    const ipNum = ((ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3]) >>> 0;
    const maskNum = (0xffffffff << (32 - maskBits)) >>> 0;

    const netNum = (ipNum & maskNum) >>> 0;
    const bcastNum = (netNum | ~maskNum) >>> 0;

    const numToIp = num => [
      (num >>> 24) & 255,
      (num >>> 16) & 255,
      (num >>> 8) & 255,
      num & 255
    ].join(".");

    const netIp = numToIp(netNum);
    const bcastIp = numToIp(bcastNum);
    const firstHost = usableHosts > 0 ? numToIp(netNum + 1) : "-";
    const lastHost = usableHosts > 0 ? numToIp(bcastNum - 1) : "-";

    return { maskStr, netIp, bcastIp, firstHost, lastHost, usableHosts, totalHosts };
  }

  function render() {
    const res = calculate();
    container.innerHTML = `
      <div class="sim-wrapper">
        <div style="background: #070b12; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
            <div>
              <label class="form-label">Alamat IPv4 Dasar:</label>
              <input type="text" class="form-input" id="subnet-ip-in" value="${ipInput}" style="font-family: var(--font-mono);">
            </div>
            <div>
              <label class="form-label">Prefiks Notasi CIDR: <strong style="color: var(--primary);">/${cidr}</strong></label>
              <input type="range" min="24" max="30" value="${cidr}" id="subnet-cidr-slider" style="width: 100%; margin-top: 8px;">
            </div>
          </div>

          <!-- 32-bit visualizer -->
          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.8rem; color: var(--text-dim); margin-bottom: 0.4rem;">
              Representasi 32-Bit (<span style="color: #38bdf8;">Bit Jaringan: ${cidr}</span> | <span style="color: #f59e0b;">Bit Host: ${32 - cidr}</span>)
            </div>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${Array.from({ length: 32 }, (_, i) => {
                const isNet = i < cidr;
                return `
                  <div style="width: calc((100% - 31*4px) / 32); min-width: 10px; height: 24px; border-radius: 3px; background: ${isNet ? "#0284c7" : "#d97706"}; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-family: var(--font-mono); color: #fff;">
                    ${isNet ? "1" : "0"}
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Output Grid -->
          <div class="hero-stats-row">
            <div class="stat-box">
              <span class="stat-label">Subnet Mask</span>
              <span class="stat-value" style="font-size: 1.15rem; color: #38bdf8;">${res.maskStr}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Network ID</span>
              <span class="stat-value" style="font-size: 1.15rem; color: #00ff9d;">${res.netIp}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Broadcast ID</span>
              <span class="stat-value" style="font-size: 1.15rem; color: #f43f5e;">${res.bcastIp}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Host Valid</span>
              <span class="stat-value" style="font-size: 1.15rem; color: #fbbf24;">${res.usableHosts} host</span>
            </div>
          </div>

          <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted); background: rgba(15, 23, 42, 0.6); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <strong>Rentang Alamat Host yang Boleh Dipakai:</strong> <code>${res.firstHost}</code> s.d. <code>${res.lastHost}</code>
          </div>
        </div>
      </div>
    `;

    document.getElementById("subnet-cidr-slider")?.addEventListener("input", e => {
      cidr = parseInt(e.target.value, 10);
      render();
    });

    document.getElementById("subnet-ip-in")?.addEventListener("change", e => {
      ipInput = e.target.value.trim();
      render();
    });
  }

  render();
}

// ============================================================================
// TOPIK 5: SIMULASI HUB VS SWITCH VS ROUTER & CRIMPING T568B
// ============================================================================
function renderSimulationHardware(container) {
  let mode = "switch";

  function render() {
    container.innerHTML = `
      <div class="sim-wrapper">
        <div class="sim-controls-bar">
          <span style="font-weight: 700; font-size: 0.9rem; color: var(--primary);">🔌 Pilih Mode Konsentrator:</span>
          <div class="btn-group-toggle">
            <button class="btn btn-sm btn-outline ${mode === "hub" ? "active" : ""} hw-mode-btn" data-mode="hub">1. Hub (Layer 1)</button>
            <button class="btn btn-sm btn-outline ${mode === "switch" ? "active" : ""} hw-mode-btn" data-mode="switch">2. Switch (Layer 2)</button>
            <button class="btn btn-sm btn-outline ${mode === "crimp" ? "active" : ""} hw-mode-btn" data-mode="crimp">3. Susunan Pin T568B</button>
          </div>
          ${mode !== "crimp" ? `<button class="btn btn-primary btn-sm" id="btn-send-hw-frame">Kirim Frame ke PC 3</button>` : ""}
        </div>

        <div style="background: #070b12; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 1rem;">
          ${mode === "crimp" ? renderCrimpingGuide() : renderDeviceCollisionLab()}
        </div>
      </div>
    `;

    container.querySelectorAll(".hw-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        render();
      });
    });

    document.getElementById("btn-send-hw-frame")?.addEventListener("click", () => {
      runFrameForwardingAnimation();
    });
  }

  function renderDeviceCollisionLab() {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div>
            <span style="font-weight: 700; color: ${mode === "hub" ? "var(--accent-amber)" : "var(--primary)"};">
              ${mode === "hub" ? "Hub (Blind Repeater - 1 Shared Collision Domain)" : "Switch (Cerdas - Dedicated Collision Domain per Port via MAC CAM Table)"}
            </span>
          </div>
        </div>

        <div id="hw-anim-view" style="position: relative; height: 260px; background: #0c121e; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-around;">
          <div class="hw-pc" id="pc-1" style="text-align: center;">
            <div style="font-size: 2rem;">💻</div>
            <div style="font-weight: 700; font-size: 0.85rem;">PC 1 (Pengirim)</div>
            <div style="font-size: 0.72rem; color: var(--text-dim);">MAC: 00:AA</div>
          </div>

          <div style="background: ${mode === "hub" ? "#d97706" : "#0284c7"}; padding: 1rem 1.5rem; border-radius: var(--radius-md); text-align: center; color: #fff; font-weight: 800; font-size: 1.1rem; border: 2px solid #fff; box-shadow: 0 0 15px rgba(0,0,0,0.5);">
            ${mode === "hub" ? "HUB 16-Port" : "SWITCH 16-Port"}
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="hw-pc" id="pc-2" style="text-align: center; padding: 4px 10px; background: rgba(30,41,59,0.5); border-radius: 6px;">
              PC 2 (MAC: 00:BB)
            </div>
            <div class="hw-pc" id="pc-3" style="text-align: center; padding: 4px 10px; background: rgba(30,41,59,0.5); border-radius: 6px;">
              PC 3 (Target: 00:CC)
            </div>
            <div class="hw-pc" id="pc-4" style="text-align: center; padding: 4px 10px; background: rgba(30,41,59,0.5); border-radius: 6px;">
              PC 4 (MAC: 00:DD)
            </div>
          </div>
        </div>

        <div id="hw-log" style="font-family: var(--font-mono); font-size: 0.82rem; margin-top: 1rem; color: var(--text-muted); background: #090d16; padding: 0.75rem; border-radius: 4px;">
          Klik tombol "Kirim Frame ke PC 3" di atas untuk melihat perbedaan jalur data antara Hub vs Switch.
        </div>
      </div>
    `;
  }

  function runFrameForwardingAnimation() {
    const log = document.getElementById("hw-log");
    if (!log) return;

    if (mode === "hub") {
      log.innerHTML = `[Frame Dikirim] PC 1 mengirim frame ke Hub.<br/>`;
      setTimeout(() => {
        log.innerHTML += `<span style="color: var(--accent-amber);">[Hub Replikasi Massal] Hub membanjiri (flood) frame ke SEMUA port (PC 2, PC 3, PC 4) sekaligus! Privasi rentan disadap packet sniffer.</span>`;
      }, 600);
    } else {
      log.innerHTML = `[Frame Dikirim] PC 1 mengirim frame ke Switch.<br/>`;
      setTimeout(() => {
        log.innerHTML += `<span style="color: var(--accent-green);">[Switch CAM Lookup] Switch memeriksa tabel MAC: Tujuan 00:CC ada di Port 3. Frame HANYA dikirim ke PC 3 secara unicast (Bebas Tabrakan)!</span>`;
      }, 600);
    }
  }

  function renderCrimpingGuide() {
    const pins = [
      { num: 1, name: "Putih-Oranye", color: "#f97316", striped: true },
      { num: 2, name: "Oranye", color: "#ea580c", striped: false },
      { num: 3, name: "Putih-Hijau", color: "#22c55e", striped: true },
      { num: 4, name: "Biru", color: "#3b82f6", striped: false },
      { num: 5, name: "Putih-Biru", color: "#60a5fa", striped: true },
      { num: 6, name: "Hijau", color: "#16a34a", striped: false },
      { num: 7, name: "Putih-Cokelat", color: "#a16207", striped: true },
      { num: 8, name: "Cokelat", color: "#78350f", striped: false }
    ];

    return `
      <div>
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 0.5rem;">
          Standar Susunan Kabel UTP Straight-Through EIA/TIA-568B:
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          Kedua ujung kabel menggunakan standar T568B yang sama untuk menghubungkan perangkat berbeda jenis (PC ke Switch atau Switch ke Router).
        </p>

        <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
          ${pins.map(p => `
            <div style="width: 75px; text-align: center; background: #0c121e; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 4px;">
              <div style="height: 60px; width: 14px; margin: 0 auto 6px auto; border-radius: 3px; background: ${p.color}; border: ${p.striped ? "2px dashed #ffffff" : "1px solid rgba(255,255,255,0.2)"};"></div>
              <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.8rem; color: var(--primary);">Pin ${p.num}</div>
              <div style="font-size: 0.68rem; color: #cbd5e1; line-height: 1.2; margin-top: 2px;">${p.name}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  render();
}

// ============================================================================
// TOPIK 6: SIMULASI LAYANAN DNS, DHCP & TERMINAL CLI TROUBLESHOOTING
// ============================================================================
function renderSimulationServices(container) {
  let terminalHistory = [
    "NetQuest Network Troubleshooting Console v2.0",
    "Ketik 'help' untuk melihat daftar perintah pengujian jaringan."
  ];

  function render() {
    container.innerHTML = `
      <div class="sim-wrapper">
        <div style="background: #070b12; padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span style="font-weight: 700; color: #00f0ff;">💻 Interactive Network CLI Terminal</span>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm" id="btn-quick-ping">ping 8.8.8.8</button>
              <button class="btn btn-secondary btn-sm" id="btn-quick-dns">ping portal.kantor.co.id</button>
              <button class="btn btn-secondary btn-sm" id="btn-quick-ipconfig">ipconfig /all</button>
            </div>
          </div>

          <div id="cli-screen" style="background: #05080e; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 1rem; height: 260px; overflow-y: auto; font-family: var(--font-mono); font-size: 0.82rem; color: #38bdf8; line-height: 1.6;">
            ${terminalHistory.map(line => `<div>${escapeHtml(line)}</div>`).join("")}
          </div>

          <form id="cli-form" style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
            <span style="color: var(--primary); font-family: var(--font-mono); line-height: 38px;">admin@netquest:~$</span>
            <input type="text" class="form-input" id="cli-input" placeholder="contoh: ping 8.8.8.8 atau tracert atau help" style="font-family: var(--font-mono); flex: 1;">
            <button type="submit" class="btn btn-primary btn-sm">Jalankan</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById("cli-form")?.addEventListener("submit", e => {
      e.preventDefault();
      const input = document.getElementById("cli-input");
      const cmd = input.value.trim();
      if (cmd) {
        processCommand(cmd);
        input.value = "";
      }
    });

    document.getElementById("btn-quick-ping")?.addEventListener("click", () => processCommand("ping 8.8.8.8"));
    document.getElementById("btn-quick-dns")?.addEventListener("click", () => processCommand("ping portal.kantor.co.id"));
    document.getElementById("btn-quick-ipconfig")?.addEventListener("click", () => processCommand("ipconfig /all"));
  }

  function processCommand(cmd) {
    terminalHistory.push(`admin@netquest:~$ ${cmd}`);
    const lower = cmd.toLowerCase();

    if (lower === "help") {
      terminalHistory.push(
        "Perintah yang didukung:",
        "  ping <ip/host>        - Menguji konektivitas end-to-end ICMP",
        "  tracert <ip>          - Melacak jalur router antar subnet",
        "  ipconfig /all         - Menampilkan konfigurasi IP, subnet, MAC, dan DHCP",
        "  nslookup <domain>     - Menguji resolusi nama Domain Name System",
        "  clear                 - Membersihkan layar konsol"
      );
    } else if (lower.startsWith("ping 8.8.8.8")) {
      terminalHistory.push(
        "Pinging 8.8.8.8 with 32 bytes of data:",
        "Reply from 8.8.8.8: bytes=32 time=12ms TTL=117",
        "Reply from 8.8.8.8: bytes=32 time=11ms TTL=117",
        "Reply from 8.8.8.8: bytes=32 time=13ms TTL=117",
        "Ping statistics: Packets: Sent = 3, Received = 3, Lost = 0 (0% loss)."
      );
    } else if (lower.startsWith("ping portal.kantor.co.id")) {
      terminalHistory.push(
        "Ping request could not find host portal.kantor.co.id. Please check the name and try again.",
        "ANALISIS TROUBLESHOOTING: Ping ke IP langsung berhasil tetapi nama domain gagal.",
        "Akar masalah: Server DNS lokal tidak merespons atau DNS Resolver miskonfigurasi!"
      );
    } else if (lower.startsWith("ipconfig")) {
      terminalHistory.push(
        "Ethernet adapter Local Area Connection:",
        "   Connection-specific DNS Suffix  . : netquest.internal",
        "   IPv4 Address. . . . . . . . . . . : 192.168.10.45",
        "   Subnet Mask . . . . . . . . . . . : 255.255.255.224 (/27)",
        "   Default Gateway . . . . . . . . . : 192.168.10.1",
        "   DHCP Server . . . . . . . . . . . : 192.168.10.1 (Lease: 24h)",
        "   DNS Servers . . . . . . . . . . . : 8.8.8.8, 1.1.1.1"
      );
    } else if (lower.startsWith("tracert")) {
      terminalHistory.push(
        "Tracing route to 103.20.15.4 over a maximum of 30 hops:",
        "  1    <1 ms    <1 ms    <1 ms  192.168.10.1 (Default Gateway)",
        "  2     4 ms     5 ms     4 ms  10.100.0.1 (Distribution Switch)",
        "  3     8 ms     8 ms     7 ms  103.20.15.4 (Tujuan Akhir)",
        "Trace complete."
      );
    } else if (lower === "clear") {
      terminalHistory = [];
    } else {
      terminalHistory.push(`'${cmd}' tidak dikenali. Ketik 'help' untuk daftar perintah.`);
    }

    render();
    const screen = document.getElementById("cli-screen");
    if (screen) screen.scrollTop = screen.scrollHeight;
  }

  render();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
