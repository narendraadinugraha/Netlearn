// NetQuest 3D Mini-Game: NetDrive Metropolitan City Quest 3.1
// Full 360x360m metropolitan map with 36 packed superblocks (100+ buildings),
// accessible road junction checkpoints, accurate radar arrow orientation,
// TCP/UDP courier rush missions, and collectible protocol tokens!

import { HOTS_QUESTIONS } from "../data/questions.js";
import { sound } from "./gamification.js";

let animationFrameId = null;
let currentGameInstance = null;

export function cleanupNetQuestCityGame() {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    try {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } catch (e) {}
  }
  if (screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock(); } catch (e) {}
  }
  if (currentGameInstance) {
    currentGameInstance.destroy();
    currentGameInstance = null;
  }
}

export function initNetQuestCityGame(containerEl, options = {}) {
  cleanupNetQuestCityGame();

  const isId = options.lang === "id" || true;
  const onScoreUpdate = options.onScoreUpdate || (() => {});
  const onStationComplete = options.onStationComplete || (() => {});
  const onGameComplete = options.onGameComplete || (() => {});
  const onCourierComplete = options.onCourierComplete || (() => {});
  const onTokenCollect = options.onTokenCollect || (() => {});

  // Game Core State
  const gameState = {
    score: 0,
    solvedStations: new Map(),
    activeStation: null,
    isModalOpen: false,
    selectedCarModel: "delivery",
    availableCars: [
      { id: "delivery", name: "Mobil Kurir Paket Data", file: "delivery.glb", speed: 0.58, accel: 0.019, desc: "Van ekspedisi pengantar paket jaringan TCP/UDP berkapasitas tinggi" },
      { id: "race-future", name: "Cyber Future Supercar", file: "race-future.glb", speed: 0.68, accel: 0.024, desc: "Akselerasi kilat dan handling neon futuristik" },
      { id: "sedan-sports", name: "Sports Sedan Turbo", file: "sedan-sports.glb", speed: 0.60, accel: 0.020, desc: "Sedan sport lincah dengan drift stabil" },
      { id: "suv-luxury", name: "Luxury Cyber SUV", file: "suv-luxury.glb", speed: 0.52, accel: 0.016, desc: "Bodi kokoh dan suspensi tangguh" },
      { id: "police", name: "Mobil Patroli Siber", file: "police.glb", speed: 0.57, accel: 0.018, desc: "Dilengkapi sirine aura keamanan jaringan" },
      { id: "race", name: "Formula Super Racer", file: "race.glb", speed: 0.70, accel: 0.025, desc: "Kecepatan maksimal tertinggi di jalan lurus" },
      { id: "taxi", name: "Taksi Jaringan Kota", file: "taxi.glb", speed: 0.52, accel: 0.016, desc: "Mobil operasional handal di segala medan" },
      { id: "ambulance", name: "Ambulans Respons Cepat", file: "ambulance.glb", speed: 0.54, accel: 0.017, desc: "Unit tanggap darurat infrastruktur" },
      { id: "firetruck", name: "Truk Penyelamat Siber", file: "firetruck.glb", speed: 0.48, accel: 0.014, desc: "Kendaraan berat penanggulangan insiden" },
      { id: "sedan", name: "Sedan Klasik", file: "sedan.glb", speed: 0.52, accel: 0.016, desc: "Mobil harian praktis dan mudah dikendalikan" }
    ]
  };

  // Courier Mission System State
  const courierState = {
    totalDeliveries: 0,
    currentMissionIndex: 0,
    activeMission: null,
    pingTimer: 18,
    nitroAmount: 100,
    isNitroActive: false
  };

  // 6 Thematic Stations placed DIRECTLY AT WIDE ROAD INTERSECTIONS (Mudah Dijangkau!)
  // Avenues are at -120, -60, 0, 60, 120
  const STATIONS = [
    {
      id: 1,
      topic: 1,
      title: isId ? "Pos 1: Pengantar Jaringan (PAN/LAN/MAN/WAN)" : "Station 1: Network Fundamentals",
      district: isId ? "Persimpangan Avenue Utara (Z: -60)" : "North Avenue Junction",
      pos: { x: 0, z: -60 },
      color: 0x3b82f6,
      icon: "lan"
    },
    {
      id: 2,
      topic: 2,
      title: isId ? "Pos 2: Topologi & Switching Domain" : "Station 2: Topologies & Switching",
      district: isId ? "Persimpangan Avenue Timur (X: 60)" : "East Avenue Junction",
      pos: { x: 60, z: 0 },
      color: 0x8b5cf6,
      icon: "hub"
    },
    {
      id: 3,
      topic: 3,
      title: isId ? "Pos 3: Menara Protokol OSI 7 Layer" : "Station 3: 7-Layer OSI Protocol Tower",
      district: isId ? "Persimpangan Boulevard Selatan (Z: 60)" : "South Boulevard Junction",
      pos: { x: 0, z: 60 },
      color: 0x06b6d4,
      icon: "layers"
    },
    {
      id: 4,
      topic: 4,
      title: isId ? "Pos 4: Laboratorium Subnetting IPv4 & VLSM" : "Station 4: IPv4 Subnetting Lab",
      district: isId ? "Persimpangan Avenue Barat (X: -60)" : "West Avenue Junction",
      pos: { x: -60, z: 0 },
      color: 0x10b981,
      icon: "calculate"
    },
    {
      id: 5,
      topic: 5,
      title: isId ? "Pos 5: Terminal Media Kabel Fiber & UTP" : "Station 5: Fiber & UTP Media Terminal",
      district: isId ? "Persimpangan Avenue Tenggara (X: 60, Z: 60)" : "Southeast Junction",
      pos: { x: 60, z: 60 },
      color: 0xf59e0b,
      icon: "cable"
    },
    {
      id: 6,
      topic: 6,
      title: isId ? "Pos 6: Gateway Layanan DNS & DHCP Server" : "Station 6: DNS & DHCP Gateway Server",
      district: isId ? "Persimpangan Avenue Barat Laut (X: -60, Z: -60)" : "Northwest Junction",
      pos: { x: -60, z: -60 },
      color: 0xef4444,
      icon: "dns"
    }
  ];

  // 6 Courier Delivery Destinations placed on BROAD AVENUE JUNCTIONS (Leluasa & Bebas Tabrakan!)
  const DELIVERY_MISSIONS = [
    {
      id: "bank",
      title: "Kirim Paket Finansial Terenkripsi",
      targetName: "Bank Sentral Siber",
      targetDistrict: "Avenue Timur Laut (X: 120, Z: -60)",
      pos: { x: 120, z: -60 },
      type: "TCP",
      port: 443,
      protocol: "HTTPS / TLS 1.3",
      question: "Untuk memastikan transfer dana perbankan tidak mengalami kehilangan data (packet loss) dan terkirim utuh, protokol transport layer apa yang wajib digunakan?",
      options: [
        { text: "TCP (Transmission Control Protocol) karena reliable dan connection-oriented", correct: true },
        { text: "UDP (User Datagram Protocol) tanpa konfirmasi handshake", correct: false },
        { text: "ICMP Echo Request", correct: false },
        { text: "ARP (Address Resolution Protocol)", correct: false }
      ],
      explanation: "TCP menjamin reliabilitas transfer dengan mekanisme Three-Way Handshake, sequence number, dan retransmission bila paket hilang."
    },
    {
      id: "media",
      title: "Stream Siaran Langsung Olahraga",
      targetName: "Studio Broadcast Multimedia",
      targetDistrict: "Avenue Barat Daya (X: -120, Z: 60)",
      pos: { x: -120, z: 60 },
      type: "UDP",
      port: 1935,
      protocol: "RTP / UDP",
      question: "Siaran langsung video streaming memerlukan kecepatan tinggi dan toleran terhadap drop frame kecil. Mengapa UDP lebih tepat digunakan dibanding TCP?",
      options: [
        { text: "UDP tidak memiliki overhead acknowledgement (ACK) sehingga menghasilkan latensi paling minim", correct: true },
        { text: "UDP secara otomatis memulihkan paket yang hilang dengan retransmisi", correct: false },
        { text: "UDP membutuhkan waktu handshake 3 tahap yang lama", correct: false },
        { text: "UDP mengenkripsi seluruh video dengan kunci RSA 4096-bit", correct: false }
      ],
      explanation: "UDP connectionless dan tidak menunggu ACK, menjadikannya standar utama untuk real-time streaming dan game multiplayer."
    },
    {
      id: "dns",
      title: "Resolusi Domain Root Server",
      targetName: "Server DNS Tier-1 Nasional",
      targetDistrict: "Avenue Barat Laut (X: -60, Z: -120)",
      pos: { x: -60, z: -120 },
      type: "UDP",
      port: 53,
      protocol: "DNS Query / UDP",
      question: "Ketika komputer client meminta IP dari domain 'netlearn.id', peran utama dari DNS Server pada port 53 adalah?",
      options: [
        { text: "Menerjemahkan nama domain FQDN menjadi alamat IP tujuan", correct: true },
        { text: "Mengubah kabel UTP menjadi sinyal fiber optik", correct: false },
        { text: "Membagi bandwidth internet secara merata", correct: false },
        { text: "Memblokir serangan virus pada sistem operasi", correct: false }
      ],
      explanation: "DNS (Domain Name System) bekerja pada port 53 untuk menerjemahkan nama domain yang mudah diingat manusia menjadi alamat IP numerik."
    },
    {
      id: "campus",
      title: "Alokasi IP Massal Laboratorium",
      targetName: "Gedung Rektorat & Lab Kampus",
      targetDistrict: "Boulevard Kampus Selatan (X: 0, Z: 120)",
      pos: { x: 0, z: 120 },
      type: "UDP",
      port: 67,
      protocol: "DHCP DORA / UDP",
      question: "Urutan 4 tahap proses pertukaran pesan dalam protokol DHCP untuk membagikan IP address secara dinamis kepada client adalah?",
      options: [
        { text: "DORA: Discover -> Offer -> Request -> Acknowledge", correct: true },
        { text: "SYN -> SYN-ACK -> ACK -> FIN", correct: false },
        { text: "Ping -> Traceroute -> ARP -> DNS", correct: false },
        { text: "Connect -> Authenticate -> Authorize -> Close", correct: false }
      ],
      explanation: "DHCP menggunakan proses 4 langkah yang disingkat DORA: DHCPDiscover, DHCPOffer, DHCPRequest, dan DHCPAck."
    },
    {
      id: "hospital",
      title: "Koneksi Telemetri Pasien ICU",
      targetName: "Rumah Sakit Sentral CyberHealth",
      targetDistrict: "Avenue Medis Tenggara (X: 120, Z: 60)",
      pos: { x: 120, z: 60 },
      type: "TCP",
      port: 8883,
      protocol: "MQTT over TLS",
      question: "Gateway sensor medis ICU memiliki alamat 192.168.10.1 dengan prefix /26. Berapa jumlah host yang dapat dialokasikan dalam subnet tersebut?",
      options: [
        { text: "62 host valid (2^(32-26) - 2)", correct: true },
        { text: "254 host valid", correct: false },
        { text: "30 host valid", correct: false },
        { text: "126 host valid", correct: false }
      ],
      explanation: "Prefix /26 menyisakan 6 host bit (32 - 26 = 6). Total host valid = 2^6 - 2 = 64 - 2 = 62 host."
    },
    {
      id: "isp",
      title: "Sinkronisasi Routing BGP Kota",
      targetName: "Gateway Transit Internet Global",
      targetDistrict: "Boulevard Backbone Utara (X: 0, Z: -120)",
      pos: { x: 0, z: -120 },
      type: "TCP",
      port: 179,
      protocol: "BGP-4 / TCP",
      question: "Protokol routing exterior gateway yang menjadi tulang punggung pertukaran rute antar Autonomous System (AS) di seluruh dunia adalah?",
      options: [
        { text: "BGP (Border Gateway Protocol) pada port TCP 179", correct: true },
        { text: "RIP v2 (Routing Information Protocol)", correct: false },
        { text: "OSPF Internal Router Only", correct: false },
        { text: "STP (Spanning Tree Protocol)", correct: false }
      ],
      explanation: "BGP adalah de facto exterior routing protocol yang menghubungkan ribuan ISP dan Autonomous System global."
    }
  ];

  courierState.activeMission = DELIVERY_MISSIONS[0];

  // 1. Scene, Camera, Renderer Setup
  const width = containerEl.clientWidth || 920;
  const height = containerEl.clientHeight || 600;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6e8f8);
  scene.fog = new THREE.FogExp2(0xd6e8f8, 0.0035);

  const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 1200);
  camera.position.set(0, 6.5, -14);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  containerEl.innerHTML = "";
  containerEl.appendChild(renderer.domElement);

  // 2. Lighting System
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb8d2e8, 0.85);
  hemiLight.position.set(0, 80, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfffaed, 1.25);
  dirLight.position.set(80, 160, 60);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 10;
  dirLight.shadow.camera.far = 400;
  dirLight.shadow.camera.left = -180;
  dirLight.shadow.camera.right = 180;
  dirLight.shadow.camera.top = 180;
  dirLight.shadow.camera.bottom = -180;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // 3. Ground & Highway Infrastructure (360 x 360m)
  const MAP_BOUNDS = { minX: -160, maxX: 160, minZ: -160, maxZ: 160 };

  const groundGeo = new THREE.PlaneGeometry(360, 360);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  const asphaltMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
  const curbMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
  const yellowMarkMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  const avenues = [-120, -60, 0, 60, 120];
  const roadWidth = 15;

  avenues.forEach(pos => {
    // North-South Avenue
    const nsRoad = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, 340), asphaltMat);
    nsRoad.rotation.x = -Math.PI / 2;
    nsRoad.position.set(pos, 0.02, 0);
    nsRoad.receiveShadow = true;
    scene.add(nsRoad);

    // East-West Avenue
    const ewRoad = new THREE.Mesh(new THREE.PlaneGeometry(340, roadWidth), asphaltMat);
    ewRoad.rotation.x = -Math.PI / 2;
    ewRoad.position.set(0, 0.02, pos);
    ewRoad.receiveShadow = true;
    scene.add(ewRoad);

    // Dashed Center Markings (Yellow)
    for (let d = -160; d <= 160; d += 8) {
      const vDash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 4.2), yellowMarkMat);
      vDash.rotation.x = -Math.PI / 2;
      vDash.position.set(pos, 0.03, d);
      scene.add(vDash);

      const hDash = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.35), yellowMarkMat);
      hDash.rotation.x = -Math.PI / 2;
      hDash.position.set(d, 0.03, pos);
      scene.add(hDash);
    }
  });

  // Outer Ring Highway
  const highwayWidth = 12;
  const highwayPositions = [-145, 145];
  highwayPositions.forEach(p => {
    const nsHigh = new THREE.Mesh(new THREE.PlaneGeometry(highwayWidth, 320), asphaltMat);
    nsHigh.rotation.x = -Math.PI / 2;
    nsHigh.position.set(p, 0.02, 0);
    scene.add(nsHigh);

    const ewHigh = new THREE.Mesh(new THREE.PlaneGeometry(320, highwayWidth), asphaltMat);
    ewHigh.rotation.x = -Math.PI / 2;
    ewHigh.position.set(0, 0.02, p);
    scene.add(ewHigh);
  });

  // Perimeter Boundary Colliders
  const barrierGroup = new THREE.Group();
  scene.add(barrierGroup);
  const barrierMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35 });
  const bThick = 2.0;
  const bHeight = 8.0;

  const nBar = new THREE.Mesh(new THREE.BoxGeometry(320, bHeight, bThick), barrierMat);
  nBar.position.set(0, bHeight / 2, MAP_BOUNDS.minZ);
  barrierGroup.add(nBar);
  const sBar = new THREE.Mesh(new THREE.BoxGeometry(320, bHeight, bThick), barrierMat);
  sBar.position.set(0, bHeight / 2, MAP_BOUNDS.maxZ);
  barrierGroup.add(sBar);
  const wBar = new THREE.Mesh(new THREE.BoxGeometry(bThick, bHeight, 320), barrierMat);
  wBar.position.set(MAP_BOUNDS.minX, bHeight / 2, 0);
  barrierGroup.add(wBar);
  const eBar = new THREE.Mesh(new THREE.BoxGeometry(bThick, bHeight, 320), barrierMat);
  eBar.position.set(MAP_BOUNDS.maxX, bHeight / 2, 0);
  barrierGroup.add(eBar);

  // 4. Metropolitan Superblocks - FULLY POPULATING ALL VACANT LAND
  // 6x6 Grid of Superblock Centers covering internal and outer districts!
  // Values: -140, -90, -30, 30, 90, 140
  const cityObstacles = [];
  const gltfLoader = (window.THREE && window.THREE.GLTFLoader) ? new window.THREE.GLTFLoader() : null;

  const blockCoords = [-140, -90, -30, 30, 90, 140];
  const superblocks = [];

  blockCoords.forEach(bx => {
    blockCoords.forEach(bz => {
      let district = "commercial";
      if (bx >= 30 && bz <= -30) district = "financial"; // NE: Skyscrapers
      else if (bx <= -30 && bz <= -30) district = "datacenter"; // NW: Datacenter & Cloud
      else if (bx >= 30 && bz >= 30) district = "hospital"; // SE: Medical & Industrial
      else if (bx <= -30 && bz >= 30) district = "media"; // SW: Media & Telecom
      else if (Math.abs(bx) <= 30 && bz >= 30) district = "campus"; // S: Academic
      else if (Math.abs(bx) >= 120 || Math.abs(bz) >= 120) district = "industrial"; // Outer: Logistics & Industry

      superblocks.push({ x: bx, z: bz, district });
    });
  });

  const skyscraperCatalog = [
    "building-skyscraper-a.glb", "building-skyscraper-b.glb", "building-skyscraper-c.glb",
    "building-skyscraper-d.glb", "building-skyscraper-e.glb"
  ];
  const commercialCatalog = [
    "building-a.glb", "building-b.glb", "building-c.glb", "building-d.glb",
    "building-e.glb", "building-f.glb", "building-g.glb", "building-h.glb",
    "building-i.glb", "building-j.glb", "building-k.glb", "building-l.glb",
    "building-m.glb", "building-n.glb", "low-detail-building-wide-a.glb", "low-detail-building-wide-b.glb"
  ];
  const industrialCatalog = [
    "ind-building-o.glb", "ind-building-p.glb", "ind-building-q.glb", "ind-building-r.glb",
    "ind-building-s.glb", "ind-building-t.glb"
  ];
  const campusCatalog = [
    "low-detail-building-a.glb", "low-detail-building-b.glb", "low-detail-building-c.glb",
    "low-detail-building-d.glb", "low-detail-building-g.glb", "low-detail-building-h.glb",
    "low-detail-building-i.glb", "low-detail-building-j.glb", "low-detail-building-l.glb"
  ];

  function placeCleanBuilding(model, lotX, lotZ, maxDim, facingAngle) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    model.children.forEach(c => {
      c.position.x -= center.x;
      c.position.y -= box.min.y;
      c.position.z -= center.z;
    });

    const maxHoriz = Math.max(size.x, size.z, 0.1);
    const fitScale = Math.min((maxDim * 0.82) / maxHoriz, 15.0);
    model.scale.set(fitScale, fitScale, fitScale);
    model.rotation.y = facingAngle;
    model.position.set(lotX, 0.28, lotZ);

    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);

    const effW = Math.min(size.x * fitScale, maxDim) / 2;
    const effD = Math.min(size.z * fitScale, maxDim) / 2;
    cityObstacles.push({
      minX: lotX - effW - 0.4,
      maxX: lotX + effW + 0.4,
      minZ: lotZ - effD - 0.4,
      maxZ: lotZ + effD + 0.4
    });
  }

  // Populate ALL 36 superblocks (NO VACANT PLOTS!)
  superblocks.forEach((sb, sIdx) => {
    const isOuter = Math.abs(sb.x) >= 120 || Math.abs(sb.z) >= 120;
    const blockSize = isOuter ? 28 : 42;

    const sidewalk = new THREE.Mesh(new THREE.BoxGeometry(blockSize, 0.28, blockSize), curbMat);
    sidewalk.position.set(sb.x, 0.14, sb.z);
    sidewalk.receiveShadow = true;
    scene.add(sidewalk);

    if (isOuter) {
      // Single Grand Centerpiece on Outer Superblock
      let chosenFile = industrialCatalog[sIdx % industrialCatalog.length];
      if (sb.district === "financial") chosenFile = skyscraperCatalog[sIdx % skyscraperCatalog.length];
      else if (sb.district === "campus") chosenFile = campusCatalog[sIdx % campusCatalog.length];

      if (gltfLoader) {
        gltfLoader.load(
          `/assets/models/city/${chosenFile}`,
          (gltf) => placeCleanBuilding(gltf.scene, sb.x, sb.z, 22.0, 0),
          undefined,
          () => {}
        );
      }
    } else {
      // 4 Quadrant Buildings on Inner Superblocks (+-10.5m offset)
      const subOffsets = [
        { ox: -10.5, oz: -10.5, face: 0 },
        { ox: 10.5, oz: -10.5, face: Math.PI / 2 },
        { ox: 10.5, oz: 10.5, face: Math.PI },
        { ox: -10.5, oz: 10.5, face: -Math.PI / 2 }
      ];

      subOffsets.forEach((off, qIdx) => {
        const lotX = sb.x + off.ox;
        const lotZ = sb.z + off.oz;
        const lotKey = sIdx * 4 + qIdx;

        let chosenFile = commercialCatalog[lotKey % commercialCatalog.length];
        if (sb.district === "financial") chosenFile = skyscraperCatalog[lotKey % skyscraperCatalog.length];
        else if (sb.district === "datacenter" || sb.district === "hospital") chosenFile = industrialCatalog[lotKey % industrialCatalog.length];
        else if (sb.district === "campus") chosenFile = campusCatalog[lotKey % campusCatalog.length];

        if (gltfLoader) {
          gltfLoader.load(
            `/assets/models/city/${chosenFile}`,
            (gltf) => placeCleanBuilding(gltf.scene, lotX, lotZ, 17.5, off.face),
            undefined,
            () => {}
          );
        }
      });
    }
  });

  // 5. Environmental Urban Props
  const propList = [
    { file: "cone.glb", x: 8, z: 8, scale: 2.2 },
    { file: "cone.glb", x: -8, z: 8, scale: 2.2 },
    { file: "cone.glb", x: 8, z: -8, scale: 2.2 },
    { file: "cone.glb", x: -8, z: -8, scale: 2.2 },
    { file: "water-tower.glb", x: 135, z: 135, scale: 6.0 },
    { file: "windmill.glb", x: -135, z: 135, scale: 6.5 },
    { file: "chimney-large.glb", x: 135, z: -135, scale: 5.5 },
    { file: "shipping-container-a.glb", x: 90, z: 135, scale: 2.8, rotY: 0 },
    { file: "shipping-container-b.glb", x: 135, z: 90, scale: 2.8, rotY: 1.57 },
    { file: "solar-panel-flat.glb", x: -135, z: -90, scale: 3.2 },
    { file: "solar-panel-flat.glb", x: -90, z: -135, scale: 3.2 },
    { file: "detail-tank-large.glb", x: -135, z: -135, scale: 3.5 }
  ];

  propList.forEach(p => {
    if (gltfLoader) {
      gltfLoader.load(`/assets/models/props/${p.file}`, (gltf) => {
        const prop = gltf.scene;
        prop.position.set(p.x, 0.28, p.z);
        prop.scale.set(p.scale, p.scale, p.scale);
        if (p.rotY) prop.rotation.y = p.rotY;
        prop.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(prop);
      });
    }
  });

  // 6. Collectible Protocol Orbs & Nitro Boost Canisters
  const PROTOCOL_ITEMS = [
    { name: "IPv4", tip: "Pengalamatan 32-bit (4 oktet) dengan format Dotted Decimal", pos: { x: 0, z: -30 } },
    { name: "IPv6", tip: "Pengalamatan 128-bit heksadesimal menjawab keterbatasan IPv4", pos: { x: 0, z: 30 } },
    { name: "TCP", tip: "Transmission Control Protocol: Reliable, 3-Way Handshake (SYN, SYN-ACK, ACK)", pos: { x: 30, z: 0 } },
    { name: "UDP", tip: "User Datagram Protocol: Connectionless, latensi rendah untuk live streaming", pos: { x: -30, z: 0 } },
    { name: "DNS", tip: "Domain Name System (Port 53): Menerjemahkan domain ke alamat IP", pos: { x: 60, z: -30 } },
    { name: "DHCP", tip: "Dynamic Host Configuration (Port 67/68): Distribusi IP otomatis (DORA)", pos: { x: -60, z: 30 } },
    { name: "HTTPS", tip: "Hypertext Transfer Protocol Secure (Port 443) dengan enkripsi TLS", pos: { x: 30, z: 60 } },
    { name: "ARP", tip: "Address Resolution Protocol: Menemukan MAC address dari IP address", pos: { x: -30, z: -60 } },
    { name: "ICMP", tip: "Internet Control Message Protocol: Diagnostik jaringan (Ping & Traceroute)", pos: { x: 120, z: 0 } },
    { name: "BGP", tip: "Border Gateway Protocol (Port 179): Routing antar Autonomous System global", pos: { x: -120, z: 0 } },
    { name: "OSPF", tip: "Open Shortest Path First: Link-state interior routing protocol berbasis Dijkstra", pos: { x: 0, z: 90 } },
    { name: "VLAN", tip: "Virtual LAN (IEEE 802.1Q): Segmentasi broadcast domain secara logis", pos: { x: 0, z: -90 } }
  ];

  const protocolMeshes = [];
  PROTOCOL_ITEMS.forEach(item => {
    const orbGroup = new THREE.Group();
    orbGroup.position.set(item.pos.x, 1.2, item.pos.z);

    const geo = new THREE.OctahedronGeometry(0.9, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const mesh = new THREE.Mesh(geo, mat);
    orbGroup.add(mesh);

    const ringGeo = new THREE.TorusGeometry(1.4, 0.08, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    orbGroup.add(ring);

    scene.add(orbGroup);
    protocolMeshes.push({ item, group: orbGroup, mesh, ring, collected: false });
  });

  // Nitro Boost Canisters (8 on broad avenue lanes)
  const NITRO_LOCATIONS = [
    { x: 60, z: -120 }, { x: -60, z: -120 },
    { x: 120, z: 0 }, { x: 120, z: -120 },
    { x: -120, z: 0 }, { x: -120, z: 120 },
    { x: 60, z: 120 }, { x: -60, z: 120 }
  ];
  const nitroMeshes = [];
  NITRO_LOCATIONS.forEach(loc => {
    const nGroup = new THREE.Group();
    nGroup.position.set(loc.x, 1.0, loc.z);

    const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 16);
    const cylMat = new THREE.MeshLambertMaterial({ color: 0x06b6d4 });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    nGroup.add(cyl);

    const glowGeo = new THREE.RingGeometry(0.8, 1.2, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.9;
    nGroup.add(glow);

    scene.add(nGroup);
    nitroMeshes.push({ group: nGroup, cyl, loc, active: true });
  });

  // 7. Active Data Courier Holographic Target Beacon
  const courierBeaconGroup = new THREE.Group();
  scene.add(courierBeaconGroup);

  const courierRingGeo = new THREE.RingGeometry(3.8, 4.6, 32);
  const courierRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const courierRingMesh = new THREE.Mesh(courierRingGeo, courierRingMat);
  courierRingMesh.rotation.x = -Math.PI / 2;
  courierRingMesh.position.y = 0.08;
  courierBeaconGroup.add(courierRingMesh);

  const courierCylGeo = new THREE.CylinderGeometry(0.8, 1.6, 7.0, 16);
  const courierCylMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5 });
  const courierCylMesh = new THREE.Mesh(courierCylGeo, courierCylMat);
  courierCylMesh.position.y = 3.5;
  courierBeaconGroup.add(courierCylMesh);

  const courierCrystalGeo = new THREE.OctahedronGeometry(1.6, 0);
  const courierCrystalMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const courierCrystalMesh = new THREE.Mesh(courierCrystalGeo, courierCrystalMat);
  courierCrystalMesh.position.y = 8.5;
  courierBeaconGroup.add(courierCrystalMesh);

  function updateCourierBeaconTarget() {
    const m = courierState.activeMission;
    if (!m) {
      courierBeaconGroup.visible = false;
      return;
    }
    courierBeaconGroup.visible = true;
    courierBeaconGroup.position.set(m.pos.x, 0, m.pos.z);
    const col = m.type === "TCP" ? 0xf59e0b : 0x06b6d4;
    courierRingMat.color.setHex(col);
    courierCylMat.color.setHex(col);
    courierCrystalMat.color.setHex(col);

    const nameEl = document.getElementById("courier-target-name");
    const typeEl = document.getElementById("courier-target-type");
    if (nameEl) nameEl.textContent = `Tujuan: ${m.targetName}`;
    if (typeEl) typeEl.textContent = `[${m.type} ${m.protocol} :${m.port}]`;
  }
  updateCourierBeaconTarget();

  // 8. The 6 Quiz Stations Beacons
  const stationMeshes = [];
  STATIONS.forEach(sConfig => {
    const sGroup = new THREE.Group();
    sGroup.position.set(sConfig.pos.x, 0, sConfig.pos.z);

    const rGeo = new THREE.RingGeometry(3.0, 3.8, 32);
    const rMat = new THREE.MeshBasicMaterial({ color: sConfig.color, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.y = 0.08;
    sGroup.add(rMesh);

    const cGeo = new THREE.CylinderGeometry(0.5, 1.2, 5.5, 16);
    const cMat = new THREE.MeshLambertMaterial({ color: sConfig.color, transparent: true, opacity: 0.5 });
    const cMesh = new THREE.Mesh(cGeo, cMat);
    cMesh.position.y = 2.75;
    sGroup.add(cMesh);

    const oGeo = new THREE.OctahedronGeometry(1.3, 0);
    const oMat = new THREE.MeshBasicMaterial({ color: sConfig.color });
    const oMesh = new THREE.Mesh(oGeo, oMat);
    oMesh.position.y = 6.8;
    sGroup.add(oMesh);

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
    ctx.roundRect ? ctx.roundRect(4, 4, 392, 92, 16) : ctx.fillRect(4, 4, 392, 92);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`POS ${sConfig.id}: 5 SOAL HOTS`, 200, 56);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true });
    const sprite = new THREE.Sprite(labelMat);
    sprite.position.y = 9.2;
    sprite.scale.set(7.5, 1.9, 1);
    sGroup.add(sprite);

    scene.add(sGroup);
    stationMeshes.push({ config: sConfig, group: sGroup, ring: rMesh, orb: oMesh, sprite });
  });

  // 9. Vehicle & Player Driving System
  const carGroup = new THREE.Group();
  scene.add(carGroup);

  const leftHeadlight = new THREE.SpotLight(0xffffff, 2.5, 45, Math.PI / 6, 0.35, 1);
  leftHeadlight.position.set(-0.7, 0.7, 1.8);
  const leftTarget = new THREE.Object3D();
  leftTarget.position.set(-0.7, 0, 18);
  carGroup.add(leftHeadlight);
  carGroup.add(leftTarget);
  leftHeadlight.target = leftTarget;

  const rightHeadlight = new THREE.SpotLight(0xffffff, 2.5, 45, Math.PI / 6, 0.35, 1);
  rightHeadlight.position.set(0.7, 0.7, 1.8);
  const rightTarget = new THREE.Object3D();
  rightTarget.position.set(0.7, 0, 18);
  carGroup.add(rightHeadlight);
  carGroup.add(rightTarget);
  rightHeadlight.target = rightTarget;

  let currentCarMesh = null;

  function loadVehicleModel(carId = "delivery") {
    if (currentCarMesh) {
      carGroup.remove(currentCarMesh);
      currentCarMesh = null;
    }

    const carData = gameState.availableCars.find(c => c.id === carId) || gameState.availableCars[0];

    const fallbackVehicle = () => {
      const geo = new THREE.BoxGeometry(2.2, 1.2, 4.4);
      const mat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
      const m = new THREE.Mesh(geo, mat);
      m.position.y = 0.6;
      m.castShadow = true;
      currentCarMesh = m;
      carGroup.add(m);
    };

    if (gltfLoader) {
      gltfLoader.load(
        `/assets/models/cars/${carData.file}`,
        (gltf) => {
          const model = gltf.scene;
          model.position.set(0, 0, 0);
          model.scale.set(1.9, 1.9, 1.9);
          model.rotation.y = 0;

          model.traverse(child => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          currentCarMesh = model;
          carGroup.add(model);
        },
        undefined,
        fallbackVehicle
      );
    } else {
      fallbackVehicle();
    }
  }

  loadVehicleModel(gameState.selectedCarModel);

  // Car Physics State
  const carState = {
    x: 0,
    z: 0,
    speed: 0,
    angle: 0,
    baseMaxSpeed: 0.62,
    maxSpeed: 0.62,
    maxReverse: -0.25,
    accel: 0.022,
    brakeDecel: 0.048,
    friction: 0.968,
    steerSpeed: 0.038,
    drift: 1.0
  };

  const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    nitro: false
  };

  const handleKeyDown = (e) => {
    if (gameState.isModalOpen) return;
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.forward = true;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.backward = true;
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
    if (e.code === "Space") { keys.brake = true; carState.drift = 1.35; }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.nitro = true;
    if (e.code === "KeyR") resetCarPosition();
    if (e.code === "KeyE") triggerInteraction();
  };

  const handleKeyUp = (e) => {
    if (e.code === "ArrowUp" || e.code === "KeyW") keys.forward = false;
    if (e.code === "ArrowDown" || e.code === "KeyS") keys.backward = false;
    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    if (e.code === "Space") { keys.brake = false; carState.drift = 1.0; }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.nitro = false;
  };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  function resetCarPosition() {
    carState.x = 0;
    carState.z = 0;
    carState.speed = 0;
    carState.angle = 0;
    carGroup.position.set(0, 0.2, 0);
    carGroup.rotation.y = 0;
    camera.position.set(0, 6.5, -14);
    sound.click();
  }

  let toastTimer = null;
  function showInGameToast(msg) {
    const toast = document.getElementById("netgame-token-toast");
    const txt = document.getElementById("netgame-token-text");
    if (!toast || !txt) return;
    txt.textContent = msg;
    toast.classList.remove("opacity-0", "-translate-y-2");
    toast.classList.add("opacity-100", "translate-y-0");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("opacity-100", "translate-y-0");
      toast.classList.add("opacity-0", "-translate-y-2");
    }, 3500);
  }

  // 10. Interactions: Courier Delivery Handshake & Station Quiz
  function triggerInteraction() {
    const m = courierState.activeMission;
    if (m) {
      const dx = m.pos.x - carState.x;
      const dz = m.pos.z - carState.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 9.0) {
        openCourierDeliveryModal(m);
        return;
      }
    }

    let nearStation = null;
    let minDist = 9999;
    stationMeshes.forEach(s => {
      const dx = s.config.pos.x - carState.x;
      const dz = s.config.pos.z - carState.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < minDist) {
        minDist = d;
        nearStation = s;
      }
    });

    if (nearStation && minDist <= 9.0) {
      launchStationMission(nearStation);
    }
  }

  function openCourierDeliveryModal(mission) {
    gameState.isModalOpen = true;
    keys.forward = false;
    keys.backward = false;
    keys.nitro = false;
    carState.speed = 0;

    const overlay = document.getElementById("netgame-modal-overlay");
    if (!overlay) return;
    overlay.classList.remove("hidden");

    sound.click();

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-7 shadow-2xl space-y-4 animate-scale-up text-left">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">local_shipping</span>
            </span>
            <div>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 uppercase">MISI KURIR DATA: ${mission.type}</span>
              <h3 class="text-sm font-bold text-slate-900 font-display mt-0.5">${mission.title}</h3>
            </div>
          </div>
          <button id="btn-close-courier-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
          <div class="flex items-center justify-between text-[11px] text-slate-500">
            <span>Tujuan: <strong>${mission.targetName}</strong></span>
            <span class="text-indigo-600 font-bold">${mission.protocol} (Port ${mission.port})</span>
          </div>
          <p class="text-slate-800 font-sans font-medium text-xs mt-2 pt-2 border-t border-slate-200">
            ${mission.question}
          </p>
        </div>

        <div class="space-y-2" id="courier-options-list">
          ${mission.options.map((opt, idx) => `
            <button class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all font-mono text-xs text-slate-700 flex items-center gap-2.5 cursor-pointer courier-opt-btn" data-idx="${idx}">
              <span class="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">${String.fromCharCode(65 + idx)}</span>
              <span class="flex-1">${opt.text}</span>
            </button>
          `).join("")}
        </div>

        <div id="courier-result-box" class="hidden p-3 rounded-xl text-xs font-mono"></div>
      </div>
    `;

    document.getElementById("btn-close-courier-modal")?.addEventListener("click", () => {
      overlay.classList.add("hidden");
      gameState.isModalOpen = false;
    });

    const optButtons = overlay.querySelectorAll(".courier-opt-btn");
    optButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const chosenIdx = parseInt(btn.dataset.idx, 10);
        const isCorrect = mission.options[chosenIdx].correct;
        const resBox = document.getElementById("courier-result-box");

        optButtons.forEach((b, i) => {
          b.disabled = true;
          b.classList.remove("hover:border-amber-400", "hover:bg-amber-50/50");
          if (mission.options[i].correct) {
            b.classList.add("bg-emerald-50", "border-emerald-500", "text-emerald-900", "font-bold");
          } else if (i === chosenIdx) {
            b.classList.add("bg-rose-50", "border-rose-400", "text-rose-800");
          }
        });

        if (resBox) {
          resBox.classList.remove("hidden");
          if (isCorrect) {
            sound.correct();
            gameState.score += 150;
            courierState.totalDeliveries++;
            onCourierComplete(mission, courierState.totalDeliveries);
            onScoreUpdate(gameState.score, gameState.solvedStations.size, STATIONS.length);

            resBox.className = "p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1.5 text-xs font-mono";
            resBox.innerHTML = `
              <div class="font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">verified</span>
                <span>Handshake Berhasil! +150 XP</span>
              </div>
              <p class="text-[11px] text-emerald-800 font-sans">${mission.explanation}</p>
              <button id="btn-next-courier" class="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs rounded-xl cursor-pointer">
                Lanjut Misi Berikutnya &rarr;
              </button>
            `;

            document.getElementById("btn-next-courier")?.addEventListener("click", () => {
              overlay.classList.add("hidden");
              gameState.isModalOpen = false;
              courierState.currentMissionIndex = (courierState.currentMissionIndex + 1) % DELIVERY_MISSIONS.length;
              courierState.activeMission = DELIVERY_MISSIONS[courierState.currentMissionIndex];
              updateCourierBeaconTarget();
              showInGameToast(`Misi Baru: ${courierState.activeMission.title} (${courierState.activeMission.targetName})`);
            });
          } else {
            sound.incorrect();
            resBox.className = "p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1.5 text-xs font-mono";
            resBox.innerHTML = `
              <div class="font-bold flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[18px]">error</span>
                <span>Handshake Gagal (Packet Dropped)</span>
              </div>
              <p class="text-[11px] text-rose-800 font-sans">${mission.explanation}</p>
              <button id="btn-retry-courier" class="mt-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs rounded-xl cursor-pointer">
                Tutup & Coba Lagi
              </button>
            `;
            document.getElementById("btn-retry-courier")?.addEventListener("click", () => {
              overlay.classList.add("hidden");
              gameState.isModalOpen = false;
            });
          }
        }
      });
    });
  }

  function launchStationMission(stationObj) {
    gameState.isModalOpen = true;
    keys.forward = false;
    keys.backward = false;
    keys.nitro = false;
    carState.speed = 0;

    // Map stations 1..6 reliably to question topics in HOTS_QUESTIONS
    const topicMap = {
      1: ["Pengantar & Jenis Jaringan"],
      2: ["Topologi Jaringan", "Topologi Jaringan & Perangkat Switch/Hub"],
      3: ["Model OSI & TCP/IP", "Model OSI & Protokol Komunikasi"],
      4: ["IP Address & Subnetting", "Pengalamatan IPv4, Subnetting & VLSM"],
      5: ["Perangkat & Media Transmisi", "Media Transmisi & Pengkabelan"],
      6: ["Layanan, Keamanan & Troubleshooting"]
    };

    const targetTopics = topicMap[stationObj.config.id] || topicMap[stationObj.config.topic] || [];
    let topicQuestions = HOTS_QUESTIONS.filter(q => targetTopics.includes(q.topic_id));
    if (topicQuestions.length < 5) {
      // Safe fallback to guarantee 5 questions per station
      const startIdx = ((stationObj.config.id - 1) % 6) * 5;
      topicQuestions = HOTS_QUESTIONS.slice(startIdx, startIdx + 5);
    }
    const selectedQuestions = topicQuestions.slice(0, 5);

    open5QuestionsModal(stationObj, selectedQuestions, (score) => {
      gameState.isModalOpen = false;
      gameState.solvedStations.set(stationObj.config.id, { score, total: 5, passed: true });
      gameState.score += score * 30;

      onStationComplete(stationObj.config, score);
      onScoreUpdate(gameState.score, gameState.solvedStations.size, STATIONS.length);

      if (gameState.solvedStations.size >= STATIONS.length) {
        onGameComplete(gameState.score);
      }
    });
  }

  // 11. Main 60 FPS Game Loop
  let lastTime = performance.now();
  let activePromptKey = null;

  const gameLoop = (currentTime) => {
    animationFrameId = requestAnimationFrame(gameLoop);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;
    const now = currentTime;

    // Handle Nitro Boost
    if (keys.nitro && courierState.nitroAmount > 0) {
      courierState.isNitroActive = true;
      carState.maxSpeed = carState.baseMaxSpeed * 1.8;
      courierState.nitroAmount = Math.max(0, courierState.nitroAmount - delta * 22);
      camera.fov = 68;
    } else {
      courierState.isNitroActive = false;
      carState.maxSpeed = carState.baseMaxSpeed;
      camera.fov = 58;
    }
    camera.updateProjectionMatrix();

    const nitroBar = document.getElementById("netgame-nitro-bar");
    const nitroText = document.getElementById("netgame-nitro-text");
    if (nitroBar) nitroBar.style.width = `${Math.round(courierState.nitroAmount)}%`;
    if (nitroText) nitroText.textContent = `${Math.round(courierState.nitroAmount)}%`;

    // Car Dynamics Acceleration & Steering
    if (!gameState.isModalOpen) {
      const currentAccel = courierState.isNitroActive ? carState.accel * 2.2 : carState.accel;

      if (keys.forward) {
        carState.speed = Math.min(carState.maxSpeed, carState.speed + currentAccel);
      } else if (keys.backward) {
        carState.speed = Math.max(carState.maxReverse, carState.speed - currentAccel * 0.9);
      } else {
        carState.speed *= carState.friction;
        if (Math.abs(carState.speed) < 0.002) carState.speed = 0;
      }

      if (keys.brake) {
        if (carState.speed > 0) carState.speed = Math.max(0, carState.speed - carState.brakeDecel);
        else if (carState.speed < 0) carState.speed = Math.min(0, carState.speed + carState.brakeDecel);
      }

      if (Math.abs(carState.speed) > 0.005) {
        const steerDir = carState.speed > 0 ? 1 : -1;
        const actualSteer = carState.steerSpeed * carState.drift;
        if (keys.left) carState.angle += actualSteer * steerDir;
        if (keys.right) carState.angle -= actualSteer * steerDir;
      }

      const nextX = carState.x + Math.sin(carState.angle) * carState.speed;
      const nextZ = carState.z + Math.cos(carState.angle) * carState.speed;
      const carR = 1.35;

      let hitObstacle = false;
      for (let i = 0; i < cityObstacles.length; i++) {
        const ob = cityObstacles[i];
        if (nextX + carR > ob.minX && nextX - carR < ob.maxX && nextZ + carR > ob.minZ && nextZ - carR < ob.maxZ) {
          hitObstacle = true;
          break;
        }
      }

      if (!hitObstacle) {
        carState.x = nextX;
        carState.z = nextZ;
      } else {
        carState.speed *= -0.35;
      }

      if (carState.x <= MAP_BOUNDS.minX + carR || carState.x >= MAP_BOUNDS.maxX - carR ||
          carState.z <= MAP_BOUNDS.minZ + carR || carState.z >= MAP_BOUNDS.maxZ - carR) {
        carState.speed *= -0.3;
        carState.x = Math.max(MAP_BOUNDS.minX + carR, Math.min(MAP_BOUNDS.maxX - carR, carState.x));
        carState.z = Math.max(MAP_BOUNDS.minZ + carR, Math.min(MAP_BOUNDS.maxZ - carR, carState.z));
        showBoundaryAlert();
      }

      carGroup.position.set(carState.x, 0.2, carState.z);
      carGroup.rotation.y = carState.angle;
    }

    // Smooth Chase Camera
    const camDist = 13.5;
    const camH = 5.8;
    const targetCamX = carState.x - Math.sin(carState.angle) * camDist;
    const targetCamZ = carState.z - Math.cos(carState.angle) * camDist;
    const targetCamY = carGroup.position.y + camH;

    camera.position.x += (targetCamX - camera.position.x) * 0.1;
    camera.position.y += (targetCamY - camera.position.y) * 0.1;
    camera.position.z += (targetCamZ - camera.position.z) * 0.1;

    const lookTarget = new THREE.Vector3(
      carState.x + Math.sin(carState.angle) * 3.5,
      carGroup.position.y + 1.2,
      carState.z + Math.cos(carState.angle) * 3.5
    );
    camera.lookAt(lookTarget);

    // Rotate Beacons & Crystals
    stationMeshes.forEach((s, idx) => {
      s.orb.rotation.y += 0.025;
      s.orb.position.y = 6.8 + Math.sin(now * 0.003 + idx) * 0.35;
      s.ring.rotation.z += 0.01;
    });

    courierCrystalMesh.rotation.y += 0.03;
    courierCrystalMesh.rotation.x += 0.015;
    courierCrystalMesh.position.y = 8.5 + Math.sin(now * 0.004) * 0.45;
    courierRingMesh.rotation.z += 0.015;

    // Protocol Orbs collection
    protocolMeshes.forEach(p => {
      if (!p.collected) {
        p.mesh.rotation.y += 0.03;
        p.ring.rotation.z += 0.02;
        p.group.position.y = 1.2 + Math.sin(now * 0.004 + p.item.pos.x) * 0.25;

        const dx = p.item.pos.x - carState.x;
        const dz = p.item.pos.z - carState.z;
        if (Math.sqrt(dx * dx + dz * dz) < 3.2) {
          p.collected = true;
          p.group.visible = false;
          sound.correct();
          gameState.score += 30;
          onTokenCollect(p.item);
          onScoreUpdate(gameState.score, gameState.solvedStations.size, STATIONS.length);
          showInGameToast(`+30 XP! Token [${p.item.name}]: ${p.item.tip}`);
        }
      }
    });

    // Nitro Canisters collection
    nitroMeshes.forEach(n => {
      if (n.active) {
        n.cyl.rotation.y += 0.035;
        const dx = n.loc.x - carState.x;
        const dz = n.loc.z - carState.z;
        if (Math.sqrt(dx * dx + dz * dz) < 3.2) {
          n.active = false;
          n.group.visible = false;
          sound.badge();
          courierState.nitroAmount = 100;
          showInGameToast("NITRO PENUH 100%! Tahan [SHIFT] untuk Kecepatan Tinggi!");
          setTimeout(() => { n.active = true; n.group.visible = true; }, 25000);
        }
      }
    });

    // Distance to Active Courier Destination
    const curMission = courierState.activeMission;
    if (curMission) {
      const cdx = curMission.pos.x - carState.x;
      const cdz = curMission.pos.z - carState.z;
      const cDist = Math.round(Math.sqrt(cdx * cdx + cdz * cdz));
      const distEl = document.getElementById("courier-target-dist");
      const pingEl = document.getElementById("courier-ping");
      if (distEl) distEl.textContent = `Jarak: ${cDist} m`;
      if (pingEl) {
        const pingMs = Math.max(14, Math.round(14 + cDist * 0.08));
        pingEl.textContent = `Ping: ${pingMs} ms`;
      }
    }

    // Proximity Prompts
    let promptTarget = null;
    let promptDist = 9999;
    let isCourierPrompt = false;

    if (curMission) {
      const dx = curMission.pos.x - carState.x;
      const dz = curMission.pos.z - carState.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= 9.0) {
        promptDist = d;
        isCourierPrompt = true;
      }
    }

    if (!isCourierPrompt) {
      stationMeshes.forEach(s => {
        const dx = s.config.pos.x - carState.x;
        const dz = s.config.pos.z - carState.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < promptDist) {
          promptDist = d;
          promptTarget = s;
        }
      });
    }

    let desiredKey = null;
    let desiredType = null;
    if (isCourierPrompt && !gameState.isModalOpen) {
      desiredKey = "courier_" + (curMission ? curMission.id : "active");
      desiredType = "courier";
    } else if (promptTarget && promptDist <= 9.0 && !gameState.isModalOpen) {
      desiredKey = "station_" + promptTarget.config.id;
      desiredType = "station";
    }

    const promptEl = document.getElementById("netgame-prompt-container");
    if (promptEl) {
      if (!desiredKey) {
        if (activePromptKey !== null) {
          promptEl.classList.add("hidden");
          promptEl.innerHTML = "";
          activePromptKey = null;
        }
      } else if (desiredKey !== activePromptKey) {
        activePromptKey = desiredKey;
        promptEl.classList.remove("hidden");
        if (desiredType === "courier") {
          promptEl.innerHTML = `
            <div class="w-[92vw] max-w-sm sm:max-w-md px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-slate-900/95 text-white border border-amber-400 shadow-2xl flex items-center gap-2.5 sm:gap-3.5 backdrop-blur-md animate-bounce cursor-pointer touch-manipulation" id="btn-prompt-card-wrapper">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/40 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[20px] sm:text-[24px]">local_shipping</span>
              </div>
              <div class="text-left font-mono min-w-0 flex-1">
                <span class="block text-xs font-bold text-amber-300 truncate">${curMission.title}</span>
                <span class="block text-[10px] sm:text-[11px] text-slate-300 truncate">Tiba di ${curMission.targetName}</span>
              </div>
              <button type="button" class="px-3.5 sm:px-4 py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-mono font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all shrink-0 flex items-center gap-1 touch-manipulation" id="btn-prompt-enter-action">
                <span>Kirim</span>
                <span class="material-symbols-outlined text-[16px]">done_all</span>
              </button>
            </div>
          `;
          const handleEnter = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            promptEl.classList.add("hidden");
            activePromptKey = null;
            openCourierDeliveryModal(curMission);
          };
          const enterBtn = document.getElementById("btn-prompt-enter-action");
          const cardWrap = document.getElementById("btn-prompt-card-wrapper");
          enterBtn?.addEventListener("click", handleEnter);
          enterBtn?.addEventListener("touchend", handleEnter);
          cardWrap?.addEventListener("click", handleEnter);
        } else {
          const solvedInfo = gameState.solvedStations.get(promptTarget.config.id);
          promptEl.innerHTML = `
            <div class="w-[92vw] max-w-sm sm:max-w-md px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-slate-900/95 text-white border border-indigo-400/60 shadow-2xl flex items-center gap-2.5 sm:gap-3.5 backdrop-blur-md animate-bounce cursor-pointer touch-manipulation" id="btn-prompt-card-wrapper">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/40 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-[20px] sm:text-[24px]">${promptTarget.config.icon}</span>
              </div>
              <div class="text-left font-mono min-w-0 flex-1">
                <span class="block text-xs font-bold text-indigo-300 truncate">${promptTarget.config.title}</span>
                <span class="block text-[10px] sm:text-[11px] text-slate-300 truncate">${solvedInfo ? `Pos Tuntas: ${solvedInfo.score}/5 Benar` : "Tantangan 5 Soal HOTS"}</span>
              </div>
              <button type="button" class="px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-mono font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all shrink-0 flex items-center gap-1 touch-manipulation" id="btn-prompt-enter-action">
                <span>Masuk</span>
                <span class="material-symbols-outlined text-[16px]">play_arrow</span>
              </button>
            </div>
          `;
          const handleEnter = (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            promptEl.classList.add("hidden");
            activePromptKey = null;
            launchStationMission(promptTarget);
          };
          const enterBtn = document.getElementById("btn-prompt-enter-action");
          const cardWrap = document.getElementById("btn-prompt-card-wrapper");
          enterBtn?.addEventListener("click", handleEnter);
          enterBtn?.addEventListener("touchend", handleEnter);
          cardWrap?.addEventListener("click", handleEnter);
        }
      }
    }

    // Update Speedometer UI
    const speedEl = document.getElementById("netgame-speed-gauge");
    if (speedEl) {
      const speedKmh = Math.round(Math.abs(carState.speed) * 115);
      speedEl.textContent = `${speedKmh} km/h`;
      if (courierState.isNitroActive) {
        speedEl.classList.add("text-cyan-300");
        speedEl.classList.remove("text-emerald-400");
      } else {
        speedEl.classList.remove("text-cyan-300");
        speedEl.classList.add("text-emerald-400");
      }
    }

    // Render Minimap Radar with EXACT matching arrow heading
    renderRadarCanvas(carState, STATIONS, curMission, gameState.solvedStations, MAP_BOUNDS);

    renderer.render(scene, camera);
  };

  // Boundary Alert Handler
  let boundaryAlertTimer = null;
  function showBoundaryAlert() {
    const alertEl = document.getElementById("netgame-boundary-alert");
    if (!alertEl) return;
    alertEl.classList.remove("hidden");
    if (boundaryAlertTimer) clearTimeout(boundaryAlertTimer);
    boundaryAlertTimer = setTimeout(() => {
      alertEl.classList.add("hidden");
    }, 2500);
  }

  const handleResize = () => {
    if (!containerEl) return;
    const newW = containerEl.clientWidth || 920;
    const newH = containerEl.clientHeight || 600;
    camera.aspect = newW / newH;
    camera.updateProjectionMatrix();
    renderer.setSize(newW, newH);
  };

  window.addEventListener("resize", handleResize);

  animationFrameId = requestAnimationFrame(gameLoop);

  currentGameInstance = {
    setCar: (carId) => {
      gameState.selectedCarModel = carId;
      loadVehicleModel(carId);
      sound.click();
    },
    reset: resetCarPosition,
    teleport: (x, z) => { carState.x = x; carState.z = z; carGroup.position.set(x, 0.2, z); },
    destroy: () => {
      if (boundaryAlertTimer) clearTimeout(boundaryAlertTimer);
      if (toastTimer) clearTimeout(toastTimer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (containerEl && renderer.domElement && renderer.domElement.parentNode === containerEl) {
        containerEl.removeChild(renderer.domElement);
      }
      if (window._netgame === currentGameInstance) window._netgame = null;
    }
  };
  window._netgame = currentGameInstance;

  return currentGameInstance;
}

// 5-Question Mission Session Dialog Engine
function open5QuestionsModal(stationObj, questions, onFinished) {
  const isId = true;
  const overlay = document.getElementById("netgame-modal-overlay");
  if (!overlay) return;

  let currentQIdx = 0;
  let correctCount = 0;
  const userAnswers = [];

  const renderCurrentQuestion = () => {
    const q = questions[currentQIdx];
    const correctOptIdx = q.options_id.findIndex(opt => opt.correct === true);

    overlay.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 animate-scale-up text-left">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[20px]">${stationObj.config.icon}</span>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">${stationObj.config.district}</span>
                <span class="text-[11px] font-mono text-slate-500 font-bold">SOAL ${currentQIdx + 1} DARI 5</span>
              </div>
              <h3 class="text-sm font-bold text-slate-900 font-display mt-0.5">${stationObj.config.title}</h3>
            </div>
          </div>
          <button id="btn-close-game-modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div class="bg-indigo-600 h-full transition-all duration-300" style="width: ${((currentQIdx + 1) / 5) * 100}%"></div>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <p class="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans font-medium">
            ${isId ? q.question_id : (q.question_en || q.question_id)}
          </p>
        </div>

        <div class="space-y-2" id="modal-options-list">
          ${q.options_id.map((opt, idx) => `
            <button class="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all font-mono text-xs text-slate-700 flex items-center gap-2.5 cursor-pointer modal-opt-btn" data-idx="${idx}">
              <span class="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">${String.fromCharCode(65 + idx)}</span>
              <span class="flex-1">${opt.text}</span>
            </button>
          `).join("")}
        </div>

        <div id="modal-feedback-box" class="hidden p-3.5 rounded-xl text-xs font-mono"></div>
      </div>
    `;

    document.getElementById("btn-close-game-modal")?.addEventListener("click", () => {
      overlay.classList.add("hidden");
      if (onFinished) onFinished(correctCount);
    });

    const optButtons = overlay.querySelectorAll(".modal-opt-btn");
    optButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const selectedIdx = parseInt(btn.dataset.idx, 10);
        const isCorrect = selectedIdx === correctOptIdx;
        if (isCorrect) correctCount++;
        userAnswers.push({ qIdx: currentQIdx, selectedIdx, isCorrect });

        optButtons.forEach((b, i) => {
          b.disabled = true;
          b.classList.remove("hover:border-indigo-400", "hover:bg-indigo-50/40");
          if (i === correctOptIdx) {
            b.classList.add("bg-emerald-50", "border-emerald-500", "text-emerald-800", "font-bold");
          } else if (i === selectedIdx) {
            b.classList.add("bg-rose-50", "border-rose-400", "text-rose-700");
          }
        });

        const feedbackBox = document.getElementById("modal-feedback-box");
        if (feedbackBox) {
          feedbackBox.classList.remove("hidden");
          if (isCorrect) {
            sound.correct();
            feedbackBox.className = "p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-1";
            feedbackBox.innerHTML = `
              <div class="font-bold flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">verified</span> Jawaban Tepat (+30 Poin)</div>
              <p class="text-[11px] text-emerald-800 font-sans">${isId ? (q.explanation_id || "") : (q.explanation_en || "")}</p>
            `;
          } else {
            sound.incorrect();
            feedbackBox.className = "p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-1";
            feedbackBox.innerHTML = `
              <div class="font-bold flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">cancel</span> Jawaban Kurang Tepat</div>
              <p class="text-[11px] text-rose-800 font-sans">${isId ? (q.explanation_id || "") : (q.explanation_en || "")}</p>
            `;
          }
        }

        setTimeout(() => {
          if (currentQIdx < 4) {
            currentQIdx++;
            renderCurrentQuestion();
          } else {
            renderSummary();
          }
        }, 2200);
      });
    });
  };

  const renderSummary = () => {
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl border border-slate-200 max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-8 shadow-2xl text-center space-y-4 sm:space-y-5 animate-scale-up">
        <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
          <span class="material-symbols-outlined text-[36px]">emoji_events</span>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-900 font-display">Tantangan Pos Selesai!</h3>
          <p class="text-xs text-slate-500 font-mono mt-1">${stationObj.config.title}</p>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-around font-mono">
          <div>
            <div class="text-[10px] text-slate-500 uppercase">Jawaban Benar</div>
            <div class="text-xl font-bold text-emerald-600 mt-0.5">${correctCount} / 5</div>
          </div>
          <div class="w-px h-8 bg-slate-200"></div>
          <div>
            <div class="text-[10px] text-slate-500 uppercase">Poin Pos</div>
            <div class="text-xl font-bold text-indigo-600 mt-0.5">+${correctCount * 30}</div>
          </div>
        </div>
        <button id="btn-finish-modal" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs rounded-xl shadow cursor-pointer transition-all">
          Lanjut Jelajah Kota &rarr;
        </button>
      </div>
    `;

    document.getElementById("btn-finish-modal")?.addEventListener("click", () => {
      overlay.classList.add("hidden");
      if (onFinished) onFinished(correctCount);
    });
  };

  overlay.classList.remove("hidden");
  renderCurrentQuestion();
}

// 12. Minimap Radar Renderer (Flawless Arrow Orientation & Scaling)
function renderRadarCanvas(carState, stations, activeMission, solvedMap, mapBounds) {
  const canvas = document.getElementById("netgame-radar-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const scale = (size - 14) / 360;

  ctx.clearRect(0, 0, size, size);

  // Outer Scope
  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.beginPath();
  ctx.arc(center, center, center - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Radar Rings
  ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.45, 0, Math.PI * 2);
  ctx.arc(center, center, center * 0.8, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(center, 4);
  ctx.lineTo(center, size - 4);
  ctx.moveTo(4, center);
  ctx.lineTo(size - 4, center);
  ctx.stroke();

  // Quiz Stations
  stations.forEach(s => {
    const dx = (s.pos.x - carState.x) * scale;
    const dz = (s.pos.z - carState.z) * scale;
    const px = center + dx;
    const py = center + dz;

    const distFromCenter = Math.sqrt(dx * dx + dz * dz);
    if (distFromCenter < center - 6) {
      const isSolved = solvedMap.has(s.id);
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fillStyle = isSolved ? "#10b981" : "#f59e0b";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
  });

  // Active Courier Target (Diamond)
  if (activeMission) {
    const mdx = (activeMission.pos.x - carState.x) * scale;
    const mdz = (activeMission.pos.z - carState.z) * scale;
    const mpx = center + mdx;
    const mpy = center + mdz;
    const mDist = Math.sqrt(mdx * mdx + mdz * mdz);
    if (mDist < center - 6) {
      ctx.save();
      ctx.translate(mpx, mpy);
      ctx.fillStyle = activeMission.type === "TCP" ? "#f59e0b" : "#06b6d4";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Player Car (Center Arrow - EXACT 100% MATCHING CAR HEADING)
  // Car moves by (dx, dz) = (sin(angle), cos(angle)).
  // In canvas: px = center + dx, py = center + dz.
  // Direction vector on 2D screen is (sin(angle), cos(angle)).
  // Angle from +X axis is atan2(cos(angle), sin(angle)).
  ctx.save();
  ctx.translate(center, center);
  const headingScreenAngle = Math.atan2(Math.cos(carState.angle), Math.sin(carState.angle));
  ctx.rotate(headingScreenAngle);

  // Arrow geometry pointing along +X (direction of headingScreenAngle)
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-6, 5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, -5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
