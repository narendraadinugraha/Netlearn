// NetQuest - Interactive Network Simulations & 3D Visualizer Lab
// Rich animated simulations, 3D WebGL topology renderings, and interactive labs for all 6 topics.

import { sound } from "./gamification.js";

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
    <div class="sim-wrapper space-y-4">
      <!-- Cisco Packet Tracer Style Controls Bar -->
      <div class="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-bold text-xs text-on-surface flex items-center gap-1.5 font-mono">
            <span class="material-symbols-outlined text-primary text-[18px]">hub</span>
            <span>Bentuk Topologi:</span>
          </span>
          <div class="inline-flex rounded-xl p-1 bg-surface-container border border-outline-variant gap-1">
            <button class="px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all topo-btn active cursor-pointer bg-primary text-on-primary shadow-xs" data-topo="bus">Bus</button>
            <button class="px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all topo-btn cursor-pointer text-on-surface-variant hover:text-on-surface" data-topo="star">Star</button>
            <button class="px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all topo-btn cursor-pointer text-on-surface-variant hover:text-on-surface" data-topo="ring">Ring</button>
            <button class="px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all topo-btn cursor-pointer text-on-surface-variant hover:text-on-surface" data-topo="mesh">Full Mesh</button>
            <button class="px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all topo-btn cursor-pointer text-on-surface-variant hover:text-on-surface" data-topo="tree">Tree (Hierarkis)</button>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <button class="px-3.5 py-2 bg-primary hover:bg-primary-container text-on-primary font-mono text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer" id="btn-topo-send">
            <span class="material-symbols-outlined text-[16px]">send</span>
            <span>Kirim Simple PDU [P]</span>
          </button>
          <button class="px-3.5 py-2 font-mono text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200" id="btn-topo-break">
            <span class="material-symbols-outlined text-[16px]">content_cut</span>
            <span>Simulasi Putus Link</span>
          </button>
        </div>
      </div>

      <!-- Cisco Cable & Interface Legend -->
      <div class="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-mono text-slate-300 flex-wrap gap-2">
        <div class="flex items-center gap-4 flex-wrap">
          <span class="text-slate-400 font-bold uppercase text-[10px]">Tipe Kabel Cisco:</span>
          <span class="flex items-center gap-1.5"><span class="w-4 h-1 bg-sky-400 rounded"></span> Copper Straight-Through</span>
          <span class="flex items-center gap-1.5"><span class="w-4 h-0.5 border-t-2 border-dashed border-amber-400"></span> Copper Cross-Over</span>
          <span class="flex items-center gap-1.5"><span class="text-rose-500 font-bold text-xs">⚡</span> Serial WAN DCE/DTE</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 bg-emerald-400 rotate-45 inline-block"></span> Link Light (▲ Up)</span>
        </div>
        <div class="text-[10px] text-slate-400">
          Cisco Packet Tracer Architecture Studio
        </div>
      </div>

      <!-- Canvas Stage -->
      <div class="relative w-full rounded-2xl overflow-hidden border border-outline-variant shadow-sm bg-slate-950" style="height: 380px;">
        <canvas id="topo-canvas" class="w-full h-full block"></canvas>
        
        <!-- Live Status Overlay -->
        <div id="topo-alert-overlay" class="hidden absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-rose-600/95 text-white border border-rose-400 font-mono text-xs font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 animate-bounce">
          <span class="material-symbols-outlined text-[16px]">error</span>
          <span id="topo-alert-text">KABEL TERPUTUS</span>
        </div>

        <!-- Selected Node Inspector Tooltip -->
        <div id="topo-node-inspector" class="absolute bottom-3 left-3 bg-slate-900/90 text-white border border-slate-700 px-3 py-2 rounded-xl text-xs font-mono backdrop-blur-md pointer-events-none flex items-center gap-2 shadow-lg">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span id="topo-inspector-text">Status: Jaringan Normal • Klik perangkat untuk melihat info</span>
        </div>
      </div>

      <!-- Detailed Specs & Educational Analysis Card -->
      <div class="p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xs space-y-3" id="topo-info-box">
        <!-- Injected dynamically -->
      </div>
    </div>
  `;

  const canvas = document.getElementById("topo-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  // Set canvas resolution
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  let width = (canvas.width = (rect.width || 800) * dpr);
  let height = (canvas.height = (rect.height || 380) * dpr);
  ctx.scale(dpr, dpr);
  const w = rect.width || 800;
  const h = rect.height || 380;

  // Authentic Network Vector Assets
  const icons = {
    workstation: new Image(),
    laptop: new Image(),
    switch: new Image(),
    router: new Image(),
    server: new Image(),
    firewall: new Image(),
    cloud: new Image(),
    packet: new Image()
  };
  icons.workstation.src = "assets/images/icons/workstation.svg";
  icons.laptop.src = "assets/images/icons/laptop.svg";
  icons.switch.src = "assets/images/icons/switch.svg";
  icons.router.src = "assets/images/icons/router.svg";
  icons.server.src = "assets/images/icons/server.svg";
  icons.firewall.src = "assets/images/icons/firewall.svg";
  icons.cloud.src = "assets/images/icons/cloud.svg";
  icons.packet.src = "assets/images/icons/packet.svg";

  let currentTopo = "bus";
  let isBroken = false;
  let packetAnim = { active: false, progress: 0, from: 0, to: 3 };
  let animFrameId = null;
  let tokenAngle = 0;

  const topoDescriptions = {
    bus: {
      name: "Topologi Bus (Backbone Linear)",
      media: "Kabel Koaksial RG-58 (Thicknet/Thinnet) & Konektor BNC T-Connector",
      terminator: "Terminator 50-Ohm di kedua ujung wajib terpasang",
      desc: "Semua perangkat berderet pada satu kabel koaksial tunggal (backbone). Paket dikirim ke seluruh bus (broadcast); hanya PC dengan MAC tujuan yang menerima data, sementara PC lain mengabaikannya.",
      breakEffect: "Terminator 50-ohm dilepas! Sinyal listrik memantul kembali (Signal Reflection Wave) sehingga gelombang tabrakan menghancurkan seluruh data di bus.",
      pros: "Hemat kabel, instalasi awal murah dan mudah untuk skala kecil.",
      cons: "Jika kabel utama putus atau terminator lepas, seluruh jaringan langsung lumpuh total. Sulit mendeteksi letak kabel rusak."
    },
    star: {
      name: "Topologi Star (Bintang Sentral Switch)",
      media: "Kabel Twisted Pair UTP Cat5e/Cat6 & Konektor RJ-45",
      terminator: "Tidak memerlukan terminator fisik (titik terminasi internal di port Switch)",
      desc: "Setiap perangkat memiliki kabel tersendiri yang terhubung langsung ke port Switch sentral. Switch membaca MAC Table dan meneruskan paket tepat ke port tujuan (Dedicated Collision Domain per Port).",
      breakEffect: "Switch Sentral mati total (Single Point of Failure)! Seluruh workstation terputus serentak, meskipun kabel masing-masing PC masih utuh.",
      pros: "Paling andal dan fleksibel: jika kabel salah satu PC putus, PC lain tetap bekerja 100% normal tanpa terganggu.",
      cons: "Membutuhkan kabel lebih panjang dan sangat bergantung pada keandalan perangkat Switch sentral."
    },
    ring: {
      name: "Topologi Ring (Token Ring IEEE 802.5)",
      media: "Kabel Fiber Optik FDDI atau STP (Shielded Twisted Pair)",
      terminator: "Cincin tertutup mandiri (Closed Loop)",
      desc: "Perangkat terhubung melingkar tertutup. Paket diedarkan searah jarum jam menggunakan tanda khusus berupa Token Elektronik. Hanya pemegang token yang berhak mengirim data, sehingga dijamin bebas tabrakan (Collision-Free).",
      breakEffect: "Satu ruas cincin terputus! Sirkulasi token berhenti dan komunikasi cincin terhenti (kecuali sistem Dual-Ring FDDI yang mampu self-healing).",
      pros: "Tidak pernah terjadi collision (tabrakan data), performa stabil saat lalu lintas jaringan padat.",
      cons: "Penambahan atau pemindahan satu node dapat mengganggu komunikasi seluruh cincin."
    },
    mesh: {
      name: "Topologi Full Mesh (Jala Redundan Penuh)",
      media: "Kabel Fiber Optik 10G/100G Multi-Core & Router Berkelompok",
      terminator: "Point-to-Point Full Matrix [N × (N - 1) ÷ 2 tautan]",
      desc: "Setiap node memiliki jalur langsung ke setiap node lainnya. Menawarkan toleransi kesalahan paling tinggi (High Availability 99.999%) karena selalu tersedia rute alternatif.",
      breakEffect: "Link utama terputus! Protokol perutean dinamis (OSPF) otomatis mengalihkan aliran data lewat tautan alternatif seketika (0ms downtime).",
      pros: "Sangat tangguh, zero downtime, tidak ada titik kegagalan tunggal (No Single Point of Failure).",
      cons: "Biaya kabel dan konfigurasi antarmuka sangat mahal; hanya digunakan pada Data Center & Backbone Inti ISP."
    },
    tree: {
      name: "Topologi Tree (Hierarkis Bertingkat 3-Tier)",
      media: "Fiber Optik untuk Backbone & UTP Cat6 untuk Jalur Distribusi/Akses",
      terminator: "Hirarki Tree Berjenjang: Core -> Distribution -> Access",
      desc: "Kombinasi bertingkat yang membagi jaringan ke dalam kelompok gedung/lantai. Switch Core mengatur rute antar gedung, Switch Distribusi membatasi broadcast domain, dan Switch Akses melayani komputer pengguna.",
      breakEffect: "Switch Distribusi Lantai 2 terputus! Hanya komputer di Lantai 2 yang terisolasi, sementara Lantai 1, 3, dan Switch Core tetap berfungsi normal.",
      pros: "Manajemen jaringan skala besar sangat terstruktur, mudah di-upgrade lantai per lantai.",
      cons: "Jika Switch Core puncak mengalami kegagalan, koneksi lintas lantai/gedung akan terputus."
    }
  };

  function updateTopoInfo() {
    const data = topoDescriptions[currentTopo];
    const alertBox = document.getElementById("topo-alert-overlay");
    const alertText = document.getElementById("topo-alert-text");
    const inspectorText = document.getElementById("topo-inspector-text");

    if (isBroken) {
      alertBox?.classList.remove("hidden");
      if (alertText) alertText.textContent = data.breakEffect.slice(0, 48) + "...";
      if (inspectorText) inspectorText.textContent = "Status: ⚠️ GANGGUAN TERDETEKSI — " + data.breakEffect;
    } else {
      alertBox?.classList.add("hidden");
      if (inspectorText) inspectorText.textContent = "Status: Jaringan Normal • Siap mentransmisikan paket data";
    }

    const infoBox = document.getElementById("topo-info-box");
    if (infoBox) {
      infoBox.innerHTML = `
        <div class="flex items-center justify-between border-b border-outline-variant pb-2.5">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full ${isBroken ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse"></span>
            <h3 class="text-sm font-bold text-on-surface font-display">${data.name}</h3>
          </div>
          <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${isBroken ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
            ${isBroken ? 'SIMULASI RUSAK AKTIF' : 'KONDISI SEHAT (ONLINE)'}
          </span>
        </div>

        <p class="text-xs text-on-surface-variant leading-relaxed font-sans">${data.desc}</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono">
          <div class="p-3 rounded-xl bg-surface-container-low border border-outline-variant space-y-1">
            <span class="text-[10px] text-outline uppercase block font-bold">Media Transmisi & Konektor:</span>
            <span class="text-on-surface font-medium">${data.media}</span>
            <span class="text-primary block text-[11px] pt-1">Terminasi: ${data.terminator}</span>
          </div>

          <div class="p-3 rounded-xl ${isBroken ? 'bg-rose-50 border border-rose-200 text-rose-900' : 'bg-surface-container-low border border-outline-variant text-on-surface'} space-y-1">
            <span class="text-[10px] ${isBroken ? 'text-rose-700' : 'text-outline'} uppercase block font-bold">Uji Ketahanan Gangguan Fisik:</span>
            <span class="text-xs font-medium leading-relaxed">${data.breakEffect}</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-sans">
            <strong class="font-mono text-emerald-800 block text-[11px] uppercase mb-1 font-bold">✅ Kelebihan:</strong>
            ${data.pros}
          </div>
          <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-sans">
            <strong class="font-mono text-amber-800 block text-[11px] uppercase mb-1 font-bold">⚠️ Kelemahan:</strong>
            ${data.cons}
          </div>
        </div>
      `;
    }
  }

  // Bind Buttons
  container.querySelectorAll(".topo-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".topo-btn").forEach(b => {
        b.classList.remove("active", "bg-primary", "text-on-primary", "shadow-xs");
        b.classList.add("text-on-surface-variant");
      });
      btn.classList.add("active", "bg-primary", "text-on-primary", "shadow-xs");
      btn.classList.remove("text-on-surface-variant");
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

  // Helper Drawing Functions
  function drawDevice(type, x, y, label, ip, isFaulty = false) {
    const size = 40;
    const img = icons[type];
    
    // Node shadow / glow
    ctx.save();
    if (isFaulty) {
      ctx.shadowColor = "rgba(239, 68, 68, 0.8)";
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = "rgba(56, 189, 248, 0.35)";
      ctx.shadowBlur = 10;
    }

    if (img && img.complete) {
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    } else {
      ctx.fillStyle = isFaulty ? "#ef4444" : "#1e293b";
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Device Badge Label
    ctx.fillStyle = isFaulty ? "#fee2e2" : "#0f172a";
    ctx.strokeStyle = isFaulty ? "#ef4444" : "#38bdf8";
    ctx.lineWidth = 1;
    const badgeW = Math.max(ctx.measureText(label).width + 16, 56);
    ctx.fillRect(x - badgeW / 2, y + size / 2 + 4, badgeW, 16);
    ctx.strokeRect(x - badgeW / 2, y + size / 2 + 4, badgeW, 16);

    ctx.font = "bold 9px monospace";
    ctx.fillStyle = isFaulty ? "#991b1b" : "#e2e8f0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x, y + size / 2 + 12);

    if (ip) {
      ctx.font = "8px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(ip, x, y + size / 2 + 25);
    }
  }

  function drawGridBg() {
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, w, h);

    // Subtle technical grid dots
    ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
    for (let gx = 20; gx < w; gx += 28) {
      for (let gy = 20; gy < h; gy += 28) {
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
    }
  }

  // 1. TOPOLOGI BUS (Linear Coaxial Backbone with BNC & Terminators)
  function drawBusTopology() {
    drawGridBg();
    const cy = h / 2 + 10;
    const startX = 75;
    const endX = w - 75;

    // Main Coaxial Backbone Line
    ctx.beginPath();
    ctx.moveTo(startX, cy);
    ctx.lineTo(endX, cy);
    ctx.strokeStyle = isBroken ? "#ef4444" : "#0284c7";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();

    // Backbone Inner Copper Core
    ctx.beginPath();
    ctx.moveTo(startX + 4, cy);
    ctx.lineTo(endX - 4, cy);
    ctx.strokeStyle = isBroken ? "#fca5a5" : "#38bdf8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 50-Ohm Terminators at Ends
    const drawTerminator = (x, isTermBroken) => {
      ctx.fillStyle = isTermBroken ? "#991b1b" : "#f59e0b";
      ctx.strokeStyle = isTermBroken ? "#ef4444" : "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.fillRect(x - 10, cy - 14, 20, 28);
      ctx.strokeRect(x - 10, cy - 14, 20, 28);

      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(isTermBroken ? "LEPAS!" : "50Ω", x, cy - 3);
      ctx.fillText("TERM", x, cy + 7);
    };

    drawTerminator(startX - 6, false);
    drawTerminator(endX + 6, isBroken);

    // 4 Workstation Drops
    const nodeCount = 4;
    for (let i = 0; i < nodeCount; i++) {
      const nx = startX + 60 + (i * (endX - startX - 120)) / (nodeCount - 1);
      const isTop = i % 2 === 0;
      const ny = isTop ? cy - 85 : cy + 85;

      // Drop Line
      ctx.beginPath();
      ctx.moveTo(nx, cy);
      ctx.lineTo(nx, isTop ? ny + 20 : ny - 20);
      ctx.strokeStyle = isBroken ? "rgba(239, 68, 68, 0.5)" : "rgba(56, 189, 248, 0.6)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // BNC T-Connector symbol at backbone
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.arc(nx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      drawDevice(i === 3 ? "server" : "workstation", nx, ny, `NODE ${i + 1}`, `192.168.1.${10 + i}`, isBroken);
    }

    // Packet / Signal Transmission
    if (packetAnim.active) {
      if (!isBroken) {
        const curX = startX + 60 + ((endX - startX - 120) * packetAnim.progress);
        ctx.drawImage(icons.packet, curX - 12, cy - 12, 24, 24);
      } else {
        // Signal reflection wave bouncing back and forth
        const bounceX = startX + (endX - startX) * Math.abs(Math.sin(packetAnim.progress * Math.PI * 3));
        ctx.beginPath();
        ctx.arc(bounceX, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
        ctx.fill();
        ctx.strokeStyle = "#ef4444";
        ctx.stroke();
        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText("COLLISION!", bounceX, cy - 18);
      }
    }
  }

  // 2. TOPOLOGI STAR (Central Switch with Radiating Cat6 UTP)
  function drawStarTopology() {
    drawGridBg();
    const cx = w / 2;
    const cy = h / 2 - 5;
    const radius = Math.min(w, h) * 0.32;
    const nodes = 6;

    // Cables from Switch to Nodes
    for (let i = 0; i < nodes; i++) {
      const angle = (i * 2 * Math.PI) / nodes - Math.PI / 2;
      const nx = cx + Math.cos(angle) * radius;
      const ny = cy + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = isBroken ? "rgba(239, 68, 68, 0.4)" : "#0284c7";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cat6 RJ45 port lights
      ctx.beginPath();
      ctx.arc(cx + Math.cos(angle) * 26, cy + Math.sin(angle) * 16, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isBroken ? "#ef4444" : "#22c55e";
      ctx.fill();

      const type = i === 0 ? "laptop" : (i === 3 ? "server" : "workstation");
      drawDevice(type, nx, ny, `PC-${i + 1}`, `192.168.1.${10 + i}`, isBroken);
    }

    // Central Switch Device
    drawDevice("switch", cx, cy, isBroken ? "SWITCH (OFFLINE)" : "CISCO L2 SWITCH", "192.168.1.1", isBroken);

    // Packet Animation: Host -> Switch -> Target
    if (packetAnim.active && !isBroken) {
      const p = packetAnim.progress;
      let px, py;
      if (p < 0.5) {
        // Laptop (node 0 at top) to Switch
        const fromAngle = -Math.PI / 2;
        const startX = cx + Math.cos(fromAngle) * radius;
        const startY = cy + Math.sin(fromAngle) * radius;
        px = startX + (cx - startX) * (p * 2);
        py = startY + (cy - startY) * (p * 2);
      } else {
        // Switch to Server (node 3 at bottom)
        const toAngle = Math.PI / 2;
        const targetX = cx + Math.cos(toAngle) * radius;
        const targetY = cy + Math.sin(toAngle) * radius;
        px = cx + (targetX - cx) * ((p - 0.5) * 2);
        py = cy + (targetY - cy) * ((p - 0.5) * 2);
      }
      ctx.drawImage(icons.packet, px - 11, py - 11, 22, 22);
    }
  }

  // 3. TOPOLOGI RING (Continuous Token Passing Cycle)
  function drawRingTopology() {
    drawGridBg();
    const cx = w / 2;
    const cy = h / 2 - 5;
    const radius = Math.min(w, h) * 0.32;
    const count = 5;

    // Dual-Ring Fiber Loop
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isBroken ? "rgba(239, 68, 68, 0.4)" : "#38bdf8";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner Secondary Ring (FDDI Self-Healing)
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 14, 0, Math.PI * 2);
    ctx.strokeStyle = isBroken ? "#ef4444" : "rgba(168, 85, 247, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw broken cut if active
    if (isBroken) {
      const breakAngle = Math.PI * 0.2;
      const bx = cx + Math.cos(breakAngle) * radius;
      const by = cy + Math.sin(breakAngle) * radius;
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✂️", bx, by);
    }

    // Stations
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const nx = cx + Math.cos(angle) * radius;
      const ny = cy + Math.sin(angle) * radius;
      drawDevice(i === 0 ? "laptop" : "workstation", nx, ny, `STATION-${i + 1}`, `10.0.0.${i + 1}`, isBroken);
    }

    // Rotating Token Emblem
    tokenAngle += isBroken ? 0 : 0.025;
    const tx = cx + Math.cos(tokenAngle) * radius;
    const ty = cy + Math.sin(tokenAngle) * radius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(tx, ty, 9, 0, Math.PI * 2);
    ctx.fillStyle = isBroken ? "#ef4444" : "#fbbf24";
    ctx.shadowColor = isBroken ? "#ef4444" : "#f59e0b";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.font = "bold 8px monospace";
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("T", tx, ty);
  }

  // 4. TOPOLOGI FULL MESH (Full Redundancy Matrix with Auto-Reroute)
  function drawMeshTopology() {
    drawGridBg();
    const cx = w / 2;
    const cy = h / 2 - 5;
    const radius = Math.min(w, h) * 0.32;
    const count = 5;
    const nodes = [];

    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      nodes.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        name: `ROUTER-${i + 1}`,
        ip: `172.16.${i + 1}.1`
      });
    }

    // Interconnect all nodes (5 * 4 / 2 = 10 links)
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const isCutLink = (i === 0 && j === 2 && isBroken);
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = isCutLink ? "#ef4444" : (isBroken ? "rgba(16, 185, 129, 0.45)" : "rgba(56, 189, 248, 0.35)");
        ctx.lineWidth = isCutLink ? 2.5 : 1.5;
        if (isCutLink) ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isCutLink) {
          const mx = (nodes[i].x + nodes[j].x) / 2;
          const my = (nodes[i].y + nodes[j].y) / 2;
          ctx.font = "14px sans-serif";
          ctx.fillText("✂️", mx, my);
        }
      }
    }

    // Draw Core Routers
    nodes.forEach((n, idx) => {
      drawDevice(idx === 2 ? "server" : "router", n.x, n.y, n.name, n.ip, false);
    });

    // Packet Transmission: Primary direct link or Auto-Reroute
    if (packetAnim.active) {
      const p = packetAnim.progress;
      let px, py;
      if (!isBroken) {
        // Direct link node 0 -> node 2
        px = nodes[0].x + (nodes[2].x - nodes[0].x) * p;
        py = nodes[0].y + (nodes[2].y - nodes[0].y) * p;
      } else {
        // Rerouted path: node 0 -> node 1 -> node 2
        if (p < 0.5) {
          px = nodes[0].x + (nodes[1].x - nodes[0].x) * (p * 2);
          py = nodes[0].y + (nodes[1].y - nodes[0].y) * (p * 2);
        } else {
          px = nodes[1].x + (nodes[2].x - nodes[1].x) * ((p - 0.5) * 2);
          py = nodes[1].y + (nodes[2].y - nodes[1].y) * ((p - 0.5) * 2);
        }
      }
      ctx.drawImage(icons.packet, px - 11, py - 11, 22, 22);
    }
  }

  // 5. TOPOLOGI TREE (3-Tier Hierarchical: Core -> Distribution -> Access)
  function drawTreeTopology() {
    drawGridBg();
    const cx = w / 2;

    // Tier 1: Core Router (Top)
    const coreX = cx;
    const coreY = 46;

    // Tier 2: 2 Distribution Switches
    const distY = 150;
    const dist1X = cx - 140;
    const dist2X = cx + 140;

    // Tier 3: 4 Access Workstations / Switches
    const accY = 270;
    const acc1X = dist1X - 60;
    const acc2X = dist1X + 60;
    const acc3X = dist2X - 60;
    const acc4X = dist2X + 60;

    // Cables Core -> Distribution
    ctx.beginPath();
    ctx.moveTo(coreX, coreY);
    ctx.lineTo(dist1X, distY);
    ctx.moveTo(coreX, coreY);
    ctx.lineTo(dist2X, distY);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cables Distribution -> Access
    const drawCable = (x1, y1, x2, y2, isCut) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isCut ? "#ef4444" : "#0284c7";
      ctx.lineWidth = isCut ? 2.5 : 2;
      if (isCut) ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (isCut) {
        ctx.font = "14px sans-serif";
        ctx.fillText("✂️", (x1 + x2) / 2, (y1 + y2) / 2);
      }
    };

    drawCable(dist1X, distY, acc1X, accY, false);
    drawCable(dist1X, distY, acc2X, accY, false);
    drawCable(dist2X, distY, acc3X, accY, isBroken);
    drawCable(dist2X, distY, acc4X, accY, false);

    // Draw Devices
    drawDevice("router", coreX, coreY, "CORE ROUTER", "10.0.0.1", false);
    drawDevice("switch", dist1X, distY, "DIST-GEDUNG A", "10.0.1.1", false);
    drawDevice("switch", dist2X, distY, "DIST-GEDUNG B", "10.0.2.1", false);

    drawDevice("workstation", acc1X, accY, "LAB-A1", "10.0.1.10", false);
    drawDevice("workstation", acc2X, accY, "LAB-A2", "10.0.1.11", false);
    drawDevice("workstation", acc3X, accY, "LAB-B1", "10.0.2.10", isBroken);
    drawDevice("server", acc4X, accY, "SERVER-B2", "10.0.2.50", false);

    // Tier Label Banners on the right
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText("TIER 1: CORE LAYER", 16, coreY + 4);
    ctx.fillText("TIER 2: DISTRIBUTION LAYER", 16, distY + 4);
    ctx.fillText("TIER 3: ACCESS ENDPOINTS", 16, accY + 4);
  }

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, w, h);

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
      packetAnim.progress += 0.022;
      if (packetAnim.progress >= 1) packetAnim.active = false;
    }

    animFrameId = requestAnimationFrame(animate);
  }

  animate();
}


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

// ============================================================================
// Re-export modularized workbench
export { renderUnifiedWorkbench } from "./workbench.js";
