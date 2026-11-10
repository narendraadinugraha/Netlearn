// NetQuest - 6 Modul Materi Pembelajaran Jaringan Komputer (Bilingual ID/EN)
// Sesuai kurikulum TKJ: Lengkap dengan ilustrasi visual diagram, studi kasus nyata, dan Word export.

export const MATERIALS = [
  {
    id: 1,
    slug: "network-types",
    title_id: "1. Pengantar & Jenis Jaringan Komputer",
    title_en: "1. Introduction & Types of Computer Networks",
    category: "Dasar Jaringan / Network Fundamentals",
    readTime: "9 min",
    icon: "🌐",
    video: {
      url: "https://www.youtube.com/watch?v=cNwEVYkx2Kk",
      embedUrl: "https://www.youtube-nocookie.com/embed/cNwEVYkx2Kk?rel=0&modestbranding=1",
      title_id: "Pengenalan Jaringan Komputer, LAN, MAN, WAN - Dasar & Klasifikasi",
      title_en: "Introduction to Computer Networks, LAN, MAN, WAN - Fundamentals",
      duration: "11:25",
      channel: "NetLearn Academy",
      keyTakeaways_id: [
        "Definisi jaringan komputer dan perbedaan utama PAN, LAN, MAN, WAN",
        "Karakteristik jangkauan jarak dan bandwidth masing-masing cakupan",
        "Kapan memilih jaringan lokal privat vs WAN publik berskala global"
      ],
      keyTakeaways_en: [
        "Definition of computer networks and distinctions between PAN, LAN, MAN, WAN",
        "Distance reach, throughput, and latency profiles across scopes",
        "Architectural trade-offs when designing enterprise local vs wide-area links"
      ]
    },
    summary_id: "Memahami definisi jaringan komputer, klasifikasi berdasarkan jangkauan geografis: PAN, LAN, MAN, dan WAN beserta karakteristik latensi, bandwidth, dan contoh penerapan di lapangan.",
    summary_en: "Understand computer network definitions, classification based on geographic reach: PAN, LAN, MAN, and WAN along with latency and throughput characteristics.",
    content_id: `
<h2>1. Pengantar Jaringan Komputer</h2>
<p>Jaringan komputer adalah kumpulan dua atau lebih sistem komputer otonom yang saling terhubung melalui media transmisi kabel (seperti kabel tembaga UTP atau serat optik) maupun media nirkabel (gelombang radio frekuensi Wi-Fi/Bluetooth) dengan tujuan utama saling bertukar data, berbagi sumber daya komputasi (printer, penyimpanan data bersama/NAS, server aplikasi), dan menjalin komunikasi secara real-time.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod1_network_scopes.svg" alt="Diagram Klasifikasi Jaringan PAN LAN MAN WAN" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Gambar 1.1: Diagram Ilustrasi Klasifikasi Jangkauan Jaringan (PAN, LAN, MAN, WAN)</figcaption>
</figure>

<h3>Klasifikasi Berdasarkan Cakupan Geografis:</h3>
<ul>
  <li><strong>1. PAN (Personal Area Network)</strong>:
    <ul>
      <li><strong>Jangkauan</strong>: Sangat pendek, umumnya di bawah 10 meter (sekeliling ruang personal).</li>
      <li><strong>Media &amp; Teknologi</strong>: Bluetooth Low Energy (BLE), Zigbee, Ultra-Wideband (UWB), dan kabel USB.</li>
      <li><strong>Karakteristik</strong>: Konsumsi daya baterai sangat hemat, konfigurasi otomatis tanpa setup rumit (ad-hoc), throughput berkisar 1 - 24 Mbps dengan latensi sangat rendah (&lt; 1 ms).</li>
      <li><strong>Contoh Nyata</strong>: Sinkronisasi data antara smartwatch dengan smartphone pengguna, tethering nirkabel ponsel ke laptop, atau sambungan wireless headset TWS.</li>
    </ul>
  </li>
  <li><strong>2. LAN (Local Area Network)</strong>:
    <ul>
      <li><strong>Jangkauan</strong>: 100 meter hingga 1 kilometer (lingkungan terbatas satu ruangan kelas, laboratorium komputer, atau satu gedung sekolah/perkantoran).</li>
      <li><strong>Media &amp; Teknologi</strong>: Kabel tembaga terpilin UTP (Cat5e/Cat6) dengan Switch Gigabit Ethernet (IEEE 802.3), serta Access Point Wi-Fi 6 (IEEE 802.11ax).</li>
      <li><strong>Karakteristik</strong>: Throughput kecepatan tinggi (100 Mbps hingga 10 Gbps) dengan latensi lokal sangat minim (&lt; 2 ms). Dikelola dan dimiliki secara privat oleh institusi sekolah atau perusahaan tanpa ketergantungan biaya sewa saluran ke penyedia eksternal.</li>
      <li><strong>Contoh Nyata</strong>: Jaringan 36 unit komputer di Laboratorium Komputer TKJ yang terhubung ke satu Switch 48-port dan server lokal Ujian Berbasis Komputer (CBT).</li>
    </ul>
  </li>
  <li><strong>3. MAN (Metropolitan Area Network)</strong>:
    <ul>
      <li><strong>Jangkauan</strong>: 5 hingga 50 kilometer (mencakup wilayah satu kota besar atau kawasan metropolitan).</li>
      <li><strong>Media &amp; Teknologi</strong>: Kabel serat optik bawah tanah (Dark Fiber / Metro Ethernet) dan koneksi nirkabel Point-to-Point gelombang mikro (Microwave Link).</li>
      <li><strong>Karakteristik</strong>: Menggabungkan beberapa LAN yang terpisah lokasi geografis dalam satu kota, berkecepatan tinggi dengan jaminan kualitas layanan (SLA) dari konsorsium penyedia telekomunikasi.</li>
      <li><strong>Contoh Nyata</strong>: Jaringan terpadu Dinas Pendidikan Kota yang menghubungkan seluruh gedung SMKN dan SMPN se-kota ke pusat data balai kota untuk sinkronisasi presensi dan e-rapor.</li>
    </ul>
  </li>
  <li><strong>4. WAN (Wide Area Network)</strong>:
    <ul>
      <li><strong>Jangkauan</strong>: Antar-kota, lintas provinsi, antar-negara, hingga antar-benua (skala global).</li>
      <li><strong>Media &amp; Teknologi</strong>: Kabel serat optik bawah laut (Subsea Cable Systems), satelit komunikasi orbit rendah (LEO) seperti Starlink, serta sirkuit sewa MPLS dan SD-WAN.</li>
      <li><strong>Karakteristik</strong>: Kompleksitas perutean rute sangat tinggi melibatkan ribuan router otonom (BGP Autonomous Systems), latensi lebih besar (20 ms hingga 250 ms bergantung jarak jarak tempuh cahaya), dan dikelola oleh banyak ISP tier-1 dunia.</li>
      <li><strong>Contoh Nyata</strong>: Jaringan Internet global yang menghubungkan pengguna di Indonesia ke pusat data Google di Singapura atau server cloud AWS di Amerika Serikat.</li>
    </ul>
  </li>
</ul>

<h3>Tabel Matriks Komparasi 4 Kategori Jaringan:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Tipe Jaringan</th><th>Radius Jangkauan</th><th>Kecepatan (Throughput)</th><th>Latensi Khas</th><th>Hak Kepemilikan</th><th>Biaya Instalasi</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>PAN</strong></td><td>&lt; 10 meter</td><td>1 - 24 Mbps</td><td>&lt; 1 ms</td><td>Pribadi (Personal)</td><td>Sangat Rendah</td></tr>
    <tr><td><strong>LAN</strong></td><td>100 m - 1 km</td><td>1 Gbps - 10 Gbps</td><td>&lt; 2 ms</td><td>Institusi / Sekolah Privat</td><td>Rendah - Sedang</td></tr>
    <tr><td><strong>MAN</strong></td><td>5 - 50 km</td><td>100 Mbps - 10 Gbps</td><td>5 - 20 ms</td><td>Pemerintah / Provider Kota</td><td>Tinggi</td></tr>
    <tr><td><strong>WAN</strong></td><td>Lintas Negara / Global</td><td>10 Mbps - 100+ Gbps</td><td>30 - 300 ms</td><td>Kolektif Multi-ISP Global</td><td>Sangat Tinggi</td></tr>
  </tbody>
</table>

<h3>Studi Kasus Desain Jaringan SMK:</h3>
<p>Dalam merancang jaringan sekolah kejuruan, teknisi TKJ membangun <strong>LAN</strong> internal di setiap ruang praktikum menggunakan kabel Cat6 yang dihubungkan ke Switch distribusi. Seluruh switch gedung dihubungkan kembali menggunakan kabel Fiber Optik multimode ke Core Switch di ruang server sekolah. Untuk mengakses materi ajar nasional dan sinkronisasi Dapodik ke kementerian di Jakarta, Router Gateway sekolah menyewa jalur sambungan internet pita lebar dari ISP yang terhubung ke jaringan <strong>WAN</strong>.</p>
`,
    content_en: `
<h2>1. Introduction to Computer Networks</h2>
<p>A computer network is an interconnected collection of autonomous computing systems communicating via physical cables or wireless transmission channels to share digital assets, compute resources, and establish synchronous communication.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod1_network_scopes.svg" alt="Network Scopes Classification PAN LAN MAN WAN" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Figure 1.1: Visual Classification of Computer Network Scopes (PAN, LAN, MAN, WAN)</figcaption>
</figure>

<h3>Geographic Scope Breakdown:</h3>
<ul>
  <li><strong>1. PAN (Personal Area Network)</strong>: Radius under 10 meters. Bluetooth BLE, Zigbee, UWB. Ultra-low power, zero-configuration pairing. Examples: Smartwatches, headsets, tablets.</li>
  <li><strong>2. LAN (Local Area Network)</strong>: 100 meters up to 1 kilometer. Gigabit Ethernet (IEEE 802.3), Wi-Fi 6. Privately owned, sub-2ms latency, 1-10 Gbps speeds. Examples: Vocational computer laboratories, campus buildings.</li>
  <li><strong>3. MAN (Metropolitan Area Network)</strong>: 5 to 50 kilometers. Dark fiber leased lines, Metro-E rings. Interconnects municipal clinics, branch offices, smart city traffic grids.</li>
  <li><strong>4. WAN (Wide Area Network)</strong>: Continental and global reach. Submarine fiber cables, satellite backbones, BGP routing. Forms the global Internet infrastructure.</li>
</ul>

<h3>Network Comparison Matrix:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Type</th><th>Coverage</th><th>Average Speed</th><th>Latency</th><th>Ownership</th><th>Cost</th></tr>
  </thead>
  <tbody>
    <tr><td>PAN</td><td>&lt; 10 m</td><td>1 - 24 Mbps</td><td>&lt; 1 ms</td><td>Individual</td><td>Minimal</td></tr>
    <tr><td>LAN</td><td>100 m - 1 km</td><td>1 - 10 Gbps</td><td>&lt; 2 ms</td><td>Private Enterprise</td><td>Moderate</td></tr>
    <tr><td>MAN</td><td>5 - 50 km</td><td>100 Mbps - 10 Gbps</td><td>5 - 20 ms</td><td>Carrier / Municipal</td><td>High</td></tr>
    <tr><td>WAN</td><td>Global</td><td>10 Mbps - 100+ Gbps</td><td>30 - 300 ms</td><td>Multi-Carrier / Consortia</td><td>Very High</td></tr>
  </tbody>
</table>
`
  },
  {
    id: 2,
    slug: "topologies",
    title_id: "2. Topologi Jaringan Komputer",
    title_en: "2. Network Topologies",
    category: "Arsitektur / Network Architecture",
    readTime: "10 min",
    icon: "🕸️",
    video: {
      url: "https://www.youtube.com/watch?v=zbqrNg4C98U",
      embedUrl: "https://www.youtube-nocookie.com/embed/zbqrNg4C98U?rel=0&modestbranding=1",
      title_id: "Topologi Jaringan Komputer: Bus, Star, Ring, Mesh, Tree",
      title_en: "Computer Network Topologies: Bus, Star, Ring, Mesh, Tree",
      duration: "14:10",
      channel: "NetLearn Academy",
      keyTakeaways_id: [
        "Prinsip transmisi dan terminator 50-ohm pada topologi Bus",
        "Peran konsentrator sentral (switch) pada topologi Star dan single point of failure",
        "Keandalan penuh topologi Full Mesh serta rumus kalkulasi link N*(N-1)/2"
      ],
      keyTakeaways_en: [
        "Transmission dynamics and 50-ohm termination in Bus networks",
        "Central switch switching logic in Star topologies and fault isolation",
        "Full Mesh link redundancy and calculating point-to-point links via N*(N-1)/2"
      ]
    },
    summary_id: "Analisis komparatif topologi fisik dan logis: Bus, Star, Ring, Mesh, dan Tree beserta kelebihan, kelemahan, rumus kebutuhan kabel, serta analisis titik kegagalan tunggal (SPOF).",
    summary_en: "Comparative analysis of physical and logical topologies: Bus, Star, Ring, Mesh, and Tree with pros, cons, and single points of failure (SPOF).",
    content_id: `
<h2>2. Topologi Jaringan Komputer</h2>
<p>Topologi jaringan mendefinisikan struktur geometris bagaimana perangkat-perangkat jaringan (node) saling dihubungkan satu sama lain. Terdapat dua perspektif utama:</p>
<ul>
  <li><strong>Topologi Fisik (Physical Topology)</strong>: Tata letak penataan kabel fisik, konektor, dan letak penempatan perangkat secara nyata di ruangan.</li>
  <li><strong>Topologi Logis (Logical Topology)</strong>: Alur pergerakan sinyal data aktual yang ditransmisikan melintasi media jaringan dari pengirim ke penerima.</li>
</ul>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod2_topologies.svg" alt="Diagram 5 Topologi Fisik Jaringan Komputer" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Gambar 2.1: Diagram Arsitektur 5 Topologi Fisik &amp; Logis Jaringan Komputer</figcaption>
</figure>

<h3>1. Topologi Bus (Linear Bus)</h3>
<ul>
  <li><strong>Arsitektur</strong>: Semua perangkat komputer terhubung secara serial pada satu kabel tulang punggung (backbone) koaksial tunggal (10Base2/Thinnet) menggunakan konektor T (BNC T-Connector).</li>
  <li><strong>Syarat Mutlak (Terminator 50-Ohm)</strong>: Kedua ujung kabel backbone wajib dipasangi resistor penutup (Terminator 50Ω). Terminator ini berfungsi menyerap energi listrik sinyal ketika tiba di ujung kabel. <em>Jika terminator lepas atau kabel putus di titik mana pun, sinyal akan memantul balik (Signal Reflection/Bounce) dan menabrak paket lain, menyebabkan seluruh jaringan lumpuh seketika!</em></li>
  <li><strong>Kelebihan</strong>: Hemat penggunaan kabel, instalasi awal murah dan sangat sederhana.</li>
  <li><strong>Kelemahan</strong>: Sangat rentan tabrakan data (collision), performa drop tajam bila node bertambah, dan sangat sulit melacak titik kabel yang mengalami kerusakan.</li>
</ul>

<h3>2. Topologi Star (Bintang) - Standar Industri Modern</h3>
<ul>
  <li><strong>Arsitektur</strong>: Setiap stasiun kerja (PC) terhubung langsung melalui kabel UTP independen ke satu konsentrator sentral (Switch Layer 2 atau Hub).</li>
  <li><strong>Kelebihan</strong>: 
    <ol>
      <li><strong>Isolasi Kesalahan Sempurna</strong>: Jika salah satu kabel PC putus atau kartu jaringan rusak, seluruh komputer lain di jaringan tetap dapat bekerja normal 100%.</li>
      <li><strong>Kemudahan Troubleshooting</strong>: Indikator LED link pada switch langsung padam jika terjadi kendala pada kabel klien terkait.</li>
    </ol>
  </li>
  <li><strong>Kelemahan</strong>: Membutuhkan kuantitas kabel yang jauh lebih panjang dan perangkat switch sentral bertindak sebagai <strong>Single Point of Failure (SPOF)</strong>. Jika switch sentral padam, maka seluruh stasiun kerja terputus.</li>
</ul>

<h3>3. Topologi Ring (Cincin)</h3>
<ul>
  <li><strong>Arsitektur</strong>: Setiap stasiun kerja terhubung melingkar tertutup membentuk cincin, di mana setiap node terhubung ke dua node tetangga di sampingnya.</li>
  <li><strong>Mekanisme Token Passing (IEEE 802.5)</strong>: Paket data beredar searah jarum jam dikendalikan oleh frame kecil khusus yang disebut <em>Token</em>. Komputer hanya diperbolehkan mentransmisikan data jika berhasil menangkap token kosong.</li>
  <li><strong>Kelebihan</strong>: Benar-benar bebas tabrakan data (Collision-Free) karena transmisi data diatur bergiliran secara deterministik.</li>
  <li><strong>Kelemahan</strong>: Jika salah satu kabel atau kartu jaringan satu stasiun kerja putus, sirkulasi token terhenti dan mematikan seluruh jaringan (kecuali menggunakan sistem ring ganda seperti FDDI Dual-Ring).</li>
</ul>

<h3>4. Topologi Mesh (Jala Redundan)</h3>
<ul>
  <li><strong>Arsitektur</strong>: Setiap node memiliki koneksi langsung ke node lainnya. Terbagi menjadi <em>Full Mesh</em> (setiap node terhubung ke setiap node lain) dan <em>Partial Mesh</em>.</li>
  <li><strong>Rumus Kebutuhan Jalur Kabel Full Mesh</strong>: 
    <br/><code style="font-weight:bold; color:#38bdf8;">Jumlah Link = [ N * (N - 1) ] / 2</code> (di mana N = Jumlah Komputer/Router).
    <br/><em>Contoh: Untuk 6 router core, diperlukan [6 * 5] / 2 = 15 tautan kabel dedicated!</em>
  </li>
  <li><strong>Kelebihan</strong>: Toleransi kesalahan tertinggi (Fault Tolerance 99.999%). Jika 2 kabel utama terputus, paket data secara otomatis diarahkan lewat jalur lain tanpa downtime sama sekali.</li>
  <li><strong>Kelemahan</strong>: Biaya perangkat dan instalasi kabel sangat tinggi, memerlukan banyak port kartu antarmuka jaringan (NIC). Umumnya dikhususkan untuk backbone server perbankan dan ISP.</li>
</ul>

<h3>5. Topologi Tree (Pohon / Hierarkis)</h3>
<ul>
  <li><strong>Arsitektur</strong>: Penggabungan beberapa topologi Star yang disusun bertingkat (hierarki 3 lapis standar Cisco: <strong>Core Layer</strong>, <strong>Distribution Layer</strong>, dan <strong>Access Layer</strong>).</li>
  <li><strong>Kelebihan</strong>: Sangat mudah diskalakan, manajemen per departemen/lantai gedung sangat rapi dan modular.</li>
  <li><strong>Kelemahan</strong>: Kegagalan pada Core Switch paling atas akan memutus lalu lintas antar cabang atau antar lantai.</li>
</ul>
`,
    content_en: `
<h2>2. Computer Network Topologies</h2>
<p>Network topology models the physical and logical configuration of nodes (workstations, routers, switches) in a telecommunication network.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod2_topologies.svg" alt="Physical Network Topologies Diagram" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Figure 2.1: Physical &amp; Logical Topologies Architecture Diagram</figcaption>
</figure>

<h3>Topologies Evaluation:</h3>
<ul>
  <li><strong>Bus</strong>: Central coaxial backbone terminated with 50-ohm resistors. Missing termination causes electrical reflections and complete channel failure.</li>
  <li><strong>Star</strong>: Point-to-point lines to a central switch. Excellent fault isolation, but the central switch is a Single Point of Failure (SPOF).</li>
  <li><strong>Ring</strong>: Deterministic Token Passing scheme (IEEE 802.5). Collision-free, but vulnerable to single node failures unless dual-homed.</li>
  <li><strong>Mesh (Full Mesh)</strong>: Interconnects every node to every other node via formula <code>N*(N-1)/2</code>. Highest availability and redundancy.</li>
  <li><strong>Tree</strong>: Hierarchical multi-tier star (Core, Distribution, Access layers) common in enterprise campus networks.</li>
</ul>
`
  },
  {
    id: 3,
    slug: "osi-tcpip",
    title_id: "3. Model OSI & Protokol TCP/IP",
    title_en: "3. OSI Model & TCP/IP Protocol Suite",
    category: "Protokol / Protocol Standards",
    readTime: "11 min",
    icon: "📚",
    video: {
      url: "https://www.youtube.com/watch?v=LANW3m7UgWs",
      embedUrl: "https://www.youtube.com/embed/LANW3m7UgWs?rel=0",
      title_id: "Model OSI 7 Layer & TCP/IP Dijelaskan Mudah (Animasi)",
      title_en: "OSI 7 Layers & TCP/IP Protocol Suite Explained",
      duration: "11:45",
      channel: "CertBros",
      keyTakeaways_id: [
        "Fungsi masing-masing 7 lapisan OSI dari Physical hingga Application",
        "Mekanisme enkapsulasi data: Data -> Segment -> Packet -> Frame -> Bits",
        "Perbedaan mendasar 3-Way Handshake TCP vs kecepatan koneksi UDP"
      ],
      keyTakeaways_en: [
        "Function of each 7 OSI layers from Physical to Application",
        "Data encapsulation lifecycle: Data -> Segment -> Packet -> Frame -> Bits",
        "Comparison of TCP 3-Way Handshake reliability vs lightweight UDP speed"
      ]
    },
    summary_id: "Studi 7 Lapisan OSI vs 4 Lapisan TCP/IP, proses penambahan header enkapsulasi/de-enkapsulasi PDU, perbandingan mendalam TCP (handshake) vs UDP (real-time stream).",
    summary_en: "Study of the 7-Layer OSI vs 4-Layer TCP/IP model, PDU encapsulation process, and deep comparison of TCP (handshake, reliable) vs UDP (connectionless, real-time).",
    content_id: `
<h2>3. Model Referensi OSI & Arsitektur Protokol TCP/IP</h2>
<p>Standardisasi komunikasi data global didasarkan pada model konseptual <strong>OSI (Open Systems Interconnection)</strong> 7 lapisan yang dikeluarkan oleh badan standar dunia ISO (ISO 7498), serta model implementasi nyata internet yaitu <strong>TCP/IP</strong> 4 lapisan.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod3_osi_layers.svg" alt="Diagram Model OSI 7 Layer dan Enkapsulasi PDU" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Gambar 3.1: Diagram 7 Lapisan OSI, TCP/IP, dan Siklus Enkapsulasi Header PDU</figcaption>
</figure>

<h3>Rincian 7 Lapisan Model OSI (Urutan dari Lapisan Tertinggi ke Terendah):</h3>
<ol>
  <li><strong>Layer 7 - Application Layer (Lapisan Aplikasi)</strong>:
    <ul>
      <li><strong>Fungsi</strong>: Antarmuka langsung tempat program perangkat lunak berinteraksi dengan layanan jaringan.</li>
      <li><strong>Protokol Populer</strong>: HTTP/HTTPS (Web, Port 80/443), DNS (Resolusi Domain, Port 53), DHCP (Alokasi IP, Port 67/68), SMTP/IMAP (Email), FTP/SFTP (Berkas), SSH (Akses Remote, Port 22).</li>
      <li><strong>Satuan Data (PDU)</strong>: Data.</li>
    </ul>
  </li>
  <li><strong>Layer 6 - Presentation Layer (Lapisan Presentasi)</strong>:
    <ul>
      <li><strong>Fungsi</strong>: Translasi format representasi data (seperti UTF-8, ASCII), kompresi file (GZIP), serta enkripsi dan dekripsi data (SSL/TLS).</li>
      <li><strong>Satuan Data (PDU)</strong>: Data.</li>
    </ul>
  </li>
  <li><strong>Layer 5 - Session Layer (Lapisan Sesi)</strong>:
    <ul>
      <li><strong>Fungsi</strong>: Membuka, mengelola, mengawasi dialog sinkronisasi, dan menutup sesi komunikasi antar aplikasi.</li>
      <li><strong>Protokol</strong>: NetBIOS, RPC (Remote Procedure Call), PPTP, TLS Session ID.</li>
      <li><strong>Satuan Data (PDU)</strong>: Data.</li>
    </ul>
  </li>
  <li><strong>Layer 4 - Transport Layer (Lapisan Transpor)</strong>:
    <ul>
      <li><strong>Fungsi</strong>: Pengiriman data ujung ke ujung (end-to-end), multiplexing nomor port layanan (Source Port &amp; Destination Port), segmentasi data, flow control, serta error recovery.</li>
      <li><strong>Protokol Utama</strong>: TCP (Andal, Berorientasi Koneksi) dan UDP (Cepat, Tanpa Koneksi).</li>
      <li><strong>Satuan Data (PDU)</strong>: <strong>Segment</strong> (pada TCP) atau <strong>Datagram</strong> (pada UDP).</li>
    </ul>
  </li>
  <li><strong>Layer 3 - Network Layer (Lapisan Jaringan)</strong>:
    <ul>
      <li><strong>Fungsi</strong>: Pengalamatan logis global (IPv4 dan IPv6) serta penentuan rute terbaik (Path Selection/Routing) melintasi berbagai subnet yang berbeda.</li>
      <li><strong>Protokol &amp; Perangkat</strong>: IP, ICMP (Ping), ARP, OSPF, BGP. Perangkat utamanya adalah <strong>Router</strong> dan Layer-3 Switch.</li>
      <li><strong>Satuan Data (PDU)</strong>: <strong>Packet</strong>.</li>
    </ul>
  </li>
  <li><strong>Layer 2 - Data Link Layer (Lapisan Tautan Data)</strong>:
    <ul>
      <li><strong>Fungsi</strong>: Pengalamatan perangkat keras fisik lokal (Media Access Control / MAC Address 48-bit), pembentukan bingkai data (Framing), deteksi kerusakan transmisi menggunakan checksum (FCS / CRC-32), dan kontrol akses media (CSMA/CD pada kabel Ethernet).</li>
      <li><strong>Protokol &amp; Perangkat</strong>: Ethernet (IEEE 802.3), Wi-Fi (IEEE 802.11). Perangkat utamanya adalah <strong>Switch Layer 2</strong> dan Network Interface Card (NIC).</li>
      <li><strong>Satuan Data (PDU)</strong>: <strong>Frame</strong>.</li>
    </ul>
  </li>
  <li><strong>Layer 1 - Physical Layer (Lapisan Fisik)</strong>:
    <ul>
      <li><strong>Fungsi</strong>: Mentransmisikan bit-bit biner mentah (angka 0 dan 1) melintasi media fisik dalam bentuk gelombang voltase listrik (kabel tembaga), denyut cahaya optik (fiber optik), atau sinyal radio RF (wireless).</li>
      <li><strong>Perangkat</strong>: Kabel UTP, Konektor RJ-45, Transceiver Fiber Optik (SFP+), Hub, dan Repeater sinyal.</li>
      <li><strong>Satuan Data (PDU)</strong>: <strong>Bits</strong>.</li>
    </ul>
  </li>
</ol>

<h3>Mekanisme Enkapsulasi &amp; De-Enkapsulasi Data:</h3>
<p>Ketika pengguna mengirim data (misalnya mengirim formulir login):</p>
<ol>
  <li><strong>Enkapsulasi (Sisi Pengirim)</strong>: Data aplikasi turun ke Transport Layer (diberi <em>Header TCP</em> berisi port tujuan 443 → menjadi <strong>Segment</strong>) → turun ke Network Layer (diberi <em>Header IP</em> berisi IP Pengirim &amp; IP Server Tujuan → menjadi <strong>Packet</strong>) → turun ke Data Link Layer (diberi <em>Header MAC</em> dan ditutup <em>Trailer CRC</em> pemeriksaan error → menjadi <strong>Frame</strong>) → diubah menjadi <strong>Bits</strong> sinyal elektrik pada kabel fisik.</li>
  <li><strong>De-Enkapsulasi (Sisi Penerima)</strong>: Di server tujuan, proses berjalan terbalik ke atas (Decapsulation): Kabel menerima bit → Switch memverifikasi frame MAC &amp; CRC → Router membongkar header IP → Sistem operasi membongkar header TCP dan mencocokkan nomor port → Data diserahkan murni ke aplikasi Web Server.</li>
</ol>

<h3>Perbandingan Vital: TCP vs UDP:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Parameter</th><th>TCP (Transmission Control Protocol)</th><th>UDP (User Datagram Protocol)</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Sifat Hubungan</strong></td><td>Connection-Oriented (Wajib 3-Way Handshake)</td><td>Connectionless (Kirim langsung tanpa handshake)</td></tr>
    <tr><td><strong>Jaminan Pengiriman</strong></td><td>Pasti (Ada konfirmasi ACK &amp; retransmisi paket hilang)</td><td>Best Effort (Tidak ada konfirmasi &amp; tanpa retransmisi)</td></tr>
    <tr><td><strong>Urutan Paket</strong></td><td>Dijamin urut sesuai Sequence Number</td><td>Bisa tiba tidak beraturan</td></tr>
    <tr><td><strong>Ukuran Header</strong></td><td>20 - 60 Byte (Memiliki kontrol bit SYN, ACK, FIN)</td><td>Hanya 8 Byte (Sangat ringan dan hemat overhead)</td></tr>
    <tr><td><strong>Kecepatan</strong></td><td>Moderat (Karena beban overhead dan pelacakan ACK)</td><td>Sangat Cepat dengan latensi minimal</td></tr>
    <tr><td><strong>Contoh Aplikasi</strong></td><td>Web HTTPS, Transaksi Bank, Email, SSH, Transfer File</td><td>Streaming Video Live, Game Online Realtime, VoIP, DNS Query</td></tr>
  </tbody>
</table>
`,
    content_en: `
<h2>3. OSI Reference Model & TCP/IP Architecture</h2>
<p>Standardized networking relies on ISO 7498 (7-layer OSI model) and RFC standards (4-layer TCP/IP stack) to orchestrate interoperability.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod3_osi_layers.svg" alt="OSI 7 Layers and Encapsulation Diagram" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Figure 3.1: 7-Layer OSI Reference Architecture and Encapsulation Lifecycles</figcaption>
</figure>

<h3>Layer Taxonomy & PDU Units:</h3>
<ul>
  <li><strong>Layer 7 (Application)</strong>: User interface & APIs (HTTP, DNS, DHCP, SSH). PDU: Data.</li>
  <li><strong>Layer 6 (Presentation)</strong>: Format encryption (TLS), compression, data encoding. PDU: Data.</li>
  <li><strong>Layer 5 (Session)</strong>: Dialogue control, socket maintenance. PDU: Data.</li>
  <li><strong>Layer 4 (Transport)</strong>: Port multiplexing, reliability, flow control. TCP / UDP. PDU: Segment.</li>
  <li><strong>Layer 3 (Network)</strong>: Logical IP addressing, best-path routing. Routers. PDU: Packet.</li>
  <li><strong>Layer 2 (Data Link)</strong>: MAC addressing, framing, CRC32 checks. Switches. PDU: Frame.</li>
  <li><strong>Layer 1 (Physical)</strong>: Raw bitstreams over physical copper, fiber, or RF media. PDU: Bits.</li>
</ul>
`
  },
  {
    id: 4,
    slug: "ip-subnetting",
    title_id: "4. Pengalamatan IP & Subnetting",
    title_en: "4. IP Addressing & Subnetting",
    category: "Pengalamatan / IP Addressing",
    readTime: "12 min",
    icon: "🧮",
    video: {
      url: "https://www.youtube.com/watch?v=r080Y7iM7Tk",
      embedUrl: "https://www.youtube.com/embed/r080Y7iM7Tk?rel=0",
      title_id: "Subnet Mask & Subnetting IPv4 Dijelaskan Lengkap (Animasi)",
      title_en: "Subnet Mask & IPv4 Subnetting Explained",
      duration: "13:20",
      channel: "PowerCert Animated Videos",
      keyTakeaways_id: [
        "Struktur 32-bit IPv4 dan pemecahan Network ID vs Host ID",
        "Rumus jumlah subnet (2^x) dan jumlah host valid per subnet (2^y - 2)",
        "Langkah cepat menentukan Network Address, Rentang Host Valid, dan Broadcast Address"
      ],
      keyTakeaways_en: [
        "32-bit IPv4 layout and splitting Network ID vs Host ID bits",
        "Mathematical formulas for subnet counts (2^x) and usable hosts (2^y - 2)",
        "Techniques for identifying Network ID, usable range, and Broadcast Address"
      ]
    },
    summary_id: "Struktur IPv4 32-bit, kelas IP, rentang IP privat RFC 1918, rumus perhitungan subnetting CIDR (/24 s.d. /30), Network ID, Broadcast, dan simulasi alokasi VLSM untuk kebutuhan departemen.",
    summary_en: "32-bit IPv4 structure, Class A/B/C, RFC 1918 private ranges, CIDR subnet calculation formulas (/24 to /30), Network ID, Broadcast, and usable hosts.",
    content_id: `
<h2>4. Pengalamatan IPv4 & Teknik Subnetting CIDR / VLSM</h2>
<p>Alamat <strong>IPv4 (Internet Protocol version 4)</strong> terdiri dari <strong>32 bit biner</strong> yang dikelompokkan ke dalam 4 bagian oktet (masing-masing 8 bit), dipisahkan oleh tanda titik dalam format desimal titik (Dotted-Decimal Notation), seperti: <code>192.168.10.1</code>.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod4_subnetting_structure.svg" alt="Diagram Struktur IPv4 dan Subnetting CIDR" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Gambar 4.1: Struktur 32-Bit Biner IPv4, Pembagian Blok Subnet, dan Rumus Emas CIDR</figcaption>
</figure>

<h3>Rentang Alamat IP Privat (RFC 1918):</h3>
<p>Alamat IP privat adalah alamat khusus yang dialokasikan oleh IANA untuk jaringan lokal (LAN) internal dan tidak dapat dirutekan secara langsung di internet publik tanpa melalui NAT (Network Address Translation):</p>
<ul>
  <li><strong>Kelas A Privat</strong>: <code>10.0.0.0</code> s.d. <code>10.255.255.255</code> (Prefix: <code>10.0.0.0/8</code>, menyediakan 16.777.214 host).</li>
  <li><strong>Kelas B Privat</strong>: <code>172.16.0.0</code> s.d. <code>172.31.255.255</code> (Prefix: <code>172.16.0.0/12</code>, menyediakan 1.048.574 host).</li>
  <li><strong>Kelas C Privat</strong>: <code>192.168.0.0</code> s.d. <code>192.168.255.255</code> (Prefix: <code>192.168.0.0/16</code>, menyediakan 65.534 host dalam 256 blok /24).</li>
  <li><strong>Alamat Khusus Lainnya</strong>: <code>127.0.0.1</code> (Loopback testing localhost) dan <code>169.254.0.0/16</code> (APIPA saat gagal DHCP).</li>
</ul>

<h3>Konsep Subnetting &amp; Notasi CIDR:</h3>
<p><strong>Subnetting</strong> adalah teknik membagi satu blok jaringan besar menjadi beberapa sub-jaringan (subnet) logis yang lebih teratur. Tujuannya:</p>
<ol>
  <li><strong>Menghemat Alokasi IP</strong> agar tidak banyak IP yang terbuang sia-sia.</li>
  <li><strong>Membatasi Ukuran Broadcast Domain</strong> sehingga lalu lintas broadcast ARP tidak membebani seluruh komputer sekolah.</li>
  <li><strong>Meningkatkan Keamanan Jaringan</strong> dengan membatasi komunikasi antar departemen menggunakan Access Control List (ACL) pada Router.</li>
</ol>

<h3>Rumus Emas Subnetting:</h3>
<ul>
  <li><strong>1. Jumlah Subnet yang Dihasilkan</strong>: <code>2^s</code> (di mana <em>s</em> adalah jumlah bit 1 yang dipinjam dari host portion).</li>
  <li><strong>2. Jumlah Host Valid per Subnet</strong>: <code>2^h - 2</code> (di mana <em>h</em> adalah jumlah bit 0 yang tersisa untuk host portion).
    <br/><em>Mengapa dikurangi 2? Karena:</em>
    <ol>
      <li>Alamat IP pertama adalah <strong>Network Address</strong> (identitas pengenal blok subnet).</li>
      <li>Alamat IP terakhir adalah <strong>Broadcast Address</strong> (alamat khusus untuk mengirim pesan ke semua host di subnet tersebut).</li>
    </ol>
  </li>
  <li><strong>3. Ukuran Interval Blok (Block Size)</strong>: <code>256 - Nilai Oktet Terakhir Subnet Mask</code>.</li>
</ul>

<h3>Tabel Referensi Cepat Notasi Prefix CIDR (/24 s.d. /30):</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Prefix CIDR</th><th>Subnet Mask Desimal</th><th>Biner Oktet Terakhir</th><th>Interval Blok</th><th>Host Valid</th><th>Penerapan Nyata di Sekolah / Kantor</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>/24</strong></td><td>255.255.255.0</td><td>00000000</td><td>256</td><td>254 host</td><td>Subnet LAN standar 1 lab besar</td></tr>
    <tr><td><strong>/25</strong></td><td>255.255.255.128</td><td>10000000</td><td>128</td><td>126 host</td><td>Pembagian 2 divisi gedung</td></tr>
    <tr><td><strong>/26</strong></td><td>255.255.255.192</td><td>11000000</td><td>64</td><td>62 host</td><td>1 Lab TKJ (Misal: 50 unit PC)</td></tr>
    <tr><td><strong>/27</strong></td><td>255.255.255.224</td><td>11100000</td><td>32</td><td>30 host</td><td>Ruang Guru / Lab Bahasa (25 unit PC)</td></tr>
    <tr><td><strong>/28</strong></td><td>255.255.255.240</td><td>11110000</td><td>16</td><td>14 host</td><td>Ruang Tata Usaha / Server Farm DMZ</td></tr>
    <tr><td><strong>/29</strong></td><td>255.255.255.248</td><td>11111000</td><td>8</td><td>6 host</td><td>Klaster Firewall Publik</td></tr>
    <tr><td><strong>/30</strong></td><td>255.255.255.252</td><td>11111100</td><td>4</td><td>2 host</td><td>Tautan Router ke Router (Point-to-Point WAN)</td></tr>
  </tbody>
</table>

<h3>Studi Kasus Perhitungan Subnetting /26:</h3>
<p>Diberikan blok IP: <code>192.168.10.0/26</code>. Berapakah subnet mask, jumlah subnet, host valid, dan rincian subnet-nya?</p>
<ul>
  <li>Prefix /26 berarti ada 26 bit biner 1. Pada oktet ke-4 terdapat 2 bit biner 1 (<code>11000000</code> biner = 192 desimal).</li>
  <li><strong>Subnet Mask</strong> = <code>255.255.255.192</code>.</li>
  <li><strong>Jumlah Subnet</strong> = <code>2^2 = 4 Subnet</code>.</li>
  <li><strong>Host per Subnet</strong> = <code>2^6 - 2 = 64 - 2 = 62 Host Valid</code>.</li>
  <li><strong>Interval Blok</strong> = <code>256 - 192 = 64</code>. Subnet bertambah kelipatan 64:
    <ol>
      <li><strong>Subnet 1</strong>: Network <code>192.168.10.0</code> | Host <code>192.168.10.1 - 192.168.10.62</code> | Broadcast <code>192.168.10.63</code></li>
      <li><strong>Subnet 2</strong>: Network <code>192.168.10.64</code> | Host <code>192.168.10.65 - 192.168.10.126</code> | Broadcast <code>192.168.10.127</code></li>
      <li><strong>Subnet 3</strong>: Network <code>192.168.10.128</code> | Host <code>192.168.10.129 - 192.168.10.190</code> | Broadcast <code>192.168.10.191</code></li>
      <li><strong>Subnet 4</strong>: Network <code>192.168.10.192</code> | Host <code>192.168.10.193 - 192.168.10.254</code> | Broadcast <code>192.168.10.255</code></li>
    </ol>
  </li>
</ul>
`,
    content_en: `
<h2>4. IPv4 Addressing & CIDR Subnetting</h2>
<p>IPv4 consists of 32 binary bits arranged into four 8-bit octets in dotted-decimal format (e.g. 192.168.10.1).</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod4_subnetting_structure.svg" alt="IPv4 Subnetting Structure Diagram" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Figure 4.1: 32-Bit Binary Layout, Subnet Blocks, and CIDR Math</figcaption>
</figure>

<h3>Subnetting Principles:</h3>
<ul>
  <li>Subnets Generated: <code>2^s</code> (s = borrowed network bits).</li>
  <li>Usable Hosts: <code>2^h - 2</code> (h = remaining host bits, reserving Network ID and Broadcast ID).</li>
  <li>Block Increment: <code>256 - Subnet Mask Octet</code>.</li>
</ul>
`
  },
  {
    id: 5,
    slug: "devices-media",
    title_id: "5. Perangkat Keras & Media Transmisi",
    title_en: "5. Hardware Devices & Transmission Media",
    category: "Perangkat / Hardware & Media",
    readTime: "10 min",
    icon: "🔌",
    video: {
      url: "https://www.youtube.com/watch?v=1z0ULvg_pW8",
      embedUrl: "https://www.youtube-nocookie.com/embed/1z0ULvg_pW8?rel=0&modestbranding=1",
      title_id: "Perangkat Jaringan: Hub, Switch, Router & Media UTP vs Fiber Optik",
      title_en: "Network Hardware: Hub, Switch, Router & Media UTP vs Fiber Optic",
      duration: "13:50",
      channel: "NetLearn Academy",
      keyTakeaways_id: [
        "Perbedaan mendasar broadcast domain Hub vs switching table MAC address pada Switch",
        "Peran Router Layer 3 dalam routing paket antar segmen network yang berbeda",
        "Karakteristik fisik kabel tembaga UTP Cat6 (maksimal 100m) vs serat optik Single/Multi-mode"
      ],
      keyTakeaways_en: [
        "Collision domain broadcasting in Hubs vs MAC address lookup in Switches",
        "Layer 3 routing operations across discrete subnets by Routers",
        "Physical traits of UTP Cat6 copper (100m limit) vs Single/Multi-mode Fiber Optic"
      ]
    },
    summary_id: "Perbedaan Hub vs Switch vs Router, perbandingan collision dan broadcast domain, kabel twisted-pair UTP Cat6 vs Fiber Optik, serta panduan praktis crimping kabel T568B vs T568A.",
    summary_en: "Differences between Hub vs Switch vs Router, twisted-pair UTP Cat5e/Cat6 vs Fiber Optics (Single-Mode vs Multi-Mode), and crimping standards T568A vs T568B.",
    content_id: `
<h2>5. Perangkat Keras Jaringan &amp; Media Transmisi</h2>
<p>Kinerja jaringan sangat ditentukan oleh pemilihan perangkat keras konsentrator dan media transmisi fisik yang tepat.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod5_hardware_media.svg" alt="Diagram Perangkat Jaringan dan Standar Crimping UTP T568B" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Gambar 5.1: Perbandingan Hub vs Switch vs Router dan Susunan 8 Pin Kabel UTP T568B</figcaption>
</figure>

<h3>Tiga Perangkat Konsentrator Utama:</h3>
<ol>
  <li><strong>Hub (Layer 1 - Physical) - Repeater Pasif</strong>:
    <ul>
      <li><strong>Prinsip Kerja</strong>: Perangkat 'buta' yang hanya mereplikasi sinyal listrik masuk ke seluruh port lainnya tanpa memeriksa alamat MAC tujuan.</li>
      <li><strong>Dampak</strong>: Semua port berbagi <strong>1 Collision Domain</strong> dan <strong>1 Broadcast Domain</strong>. Jika 2 komputer mentransmisikan data bersamaan, terjadi tabrakan sinyal (collision). Keamanan sangat rendah karena data dapat disadap komputer mana pun di port lain (sniffing). Kini telah ditinggalkan (obsolete).</li>
    </ul>
  </li>
  <li><strong>Switch (Layer 2 - Data Link) - Konsentrator Cerdas</strong>:
    <ul>
      <li><strong>Prinsip Kerja</strong>: Memeriksa header MAC address pengirim dan tujuan pada frame. Switch membangun dan menyimpan <em>Tabel MAC (CAM Table - Content Addressable Memory)</em> secara dinamis. Frame hanya diteruskan secara selektif (unicast) ke port tempat komputer tujuan berada.</li>
      <li><strong>Dampak</strong>: Setiap port switch merupakan <strong>Collision Domain independen</strong> (Full-Duplex, bebas tabrakan antar port). Namun, secara default semua port masih berbagi <strong>1 Broadcast Domain</strong> yang sama.</li>
    </ul>
  </li>
  <li><strong>Router (Layer 3 - Network) - Gerbang Antar-Subnet (Gateway)</strong>:
    <ul>
      <li><strong>Prinsip Kerja</strong>: Menganalisis header IP Address pada paket data untuk menentukan rute terbaik (Best Path) menghubungkan jaringan logis (subnet) yang berbeda.</li>
      <li><strong>Dampak</strong>: Router bertindak sebagai pembatas (boundary) yang <strong>memecah Broadcast Domain</strong>. Pesan broadcast ARP dari satu lab tidak akan diteruskan oleh router ke lab lain, menjaga efisiensi bandwidth secara keseluruhan.</li>
    </ul>
  </li>
</ol>

<h3>Media Transmisi Fisik: UTP vs Fiber Optik:</h3>
<ul>
  <li><strong>Kabel Tembaga UTP (Unshielded Twisted Pair)</strong>:
    <ul>
      <li>Berisi 4 pasang (8 kabel) kawat tembaga berinsulasi yang dipilin berpasangan untuk membatalkan interferensi elektromagnetik dan crosstalk antar kabel.</li>
      <li><strong>Batas Jarak Maksimum Standar</strong>: <strong>100 meter</strong> (90 meter kabel horizontal + 10 meter patch cord). Jika melebihi 100m, terjadi pelemahan sinyal (attenuation) yang menyebabkan packet loss.</li>
      <li><strong>Kategori Populer</strong>: Cat5e (hingga 1 Gbps), Cat6 (hingga 10 Gbps pada jarak &lt; 55 m), Cat6A (10 Gbps penuh hingga 100 m).</li>
    </ul>
  </li>
  <li><strong>Kabel Serat Optik (Fiber Optic)</strong>:
    <ul>
      <li>Mentransmisikan berkas pulsa cahaya di dalam serat kaca silika. <strong>100% Kebal terhadap interferensi gelombang elektromagnetik (EMI)</strong> dan bahaya sambaran petir.</li>
      <li><strong>Single-Mode Fiber (SMF)</strong>: Diameter inti kaca sangat kecil (~9 mikron), menggunakan sinar laser inframerah. Mampu menjangkau jarak puluhan kilometer tanpa repeater. Digunakan untuk kabel bawah laut, backbone ISP, dan jaringan MAN antar gedung sekolah.</li>
      <li><strong>Multi-Mode Fiber (MMF)</strong>: Diameter inti kaca lebih besar (~50 mikron), menggunakan sumber cahaya LED. Jarak jangkauan hingga 550 meter. Ideal untuk interkoneksi switch server dalam satu ruang data center.</li>
    </ul>
  </li>
</ul>

<h3>Standar Susunan Pin Kabel UTP (EIA/TIA 568B):</h3>
<p>Urutan warna 8 pin standar T568B dari kiri ke kanan (dilihat dengan posisi klip konektor RJ-45 menghadap ke bawah/belakang):</p>
<ol>
  <li><strong>Pin 1</strong>: Putih-Oranye (Tx+)</li>
  <li><strong>Pin 2</strong>: Oranye (Tx-)</li>
  <li><strong>Pin 3</strong>: Putih-Hijau (Rx+)</li>
  <li><strong>Pin 4</strong>: Biru</li>
  <li><strong>Pin 5</strong>: Putih-Biru</li>
  <li><strong>Pin 6</strong>: Hijau (Rx-)</li>
  <li><strong>Pin 7</strong>: Putih-Cokelat</li>
  <li><strong>Pin 8</strong>: Cokelat</li>
</ol>
<p><strong>Tipe Pemasangan Kabel:</strong></p>
<ul>
  <li><strong>Straight-Through</strong>: Kedua ujung kabel menggunakan susunan pin yang sama (T568B ke T568B). Digunakan untuk menghubungkan dua perangkat yang <em>berbeda level fungsi</em>: PC ke Switch, Switch ke Router.</li>
  <li><strong>Crossover</strong>: Ujung satu T568A dan ujung lainnya T568B. Digunakan untuk menghubungkan dua perangkat yang <em>selevel fungsi</em>: PC langsung ke PC, Switch ke Switch tanpa fitur Auto-MDIX.</li>
</ul>
`,
    content_en: `
<h2>5. Network Hardware & Transmission Media</h2>
<p>Hardware devices and cabling standards constitute the foundational physical fabric of modern enterprise communication.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod5_hardware_media.svg" alt="Network Hardware and T568B Pinout Diagram" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Figure 5.1: Device Domains Comparison and T568B Pinout Standards</figcaption>
</figure>

<h3>Device Domain Boundaries:</h3>
<ul>
  <li><strong>Hub</strong>: 1 Shared Collision Domain, 1 Shared Broadcast Domain.</li>
  <li><strong>Switch</strong>: Collision Domain isolated per port via CAM tables, 1 Shared Broadcast Domain.</li>
  <li><strong>Router</strong>: Breaks both Collision and Broadcast Domains across distinct IP subnets.</li>
</ul>

<h3>T568B Pinout Sequence:</h3>
<p>1: White-Orange, 2: Orange, 3: White-Green, 4: Blue, 5: White-Blue, 6: Green, 7: White-Brown, 8: Brown.</p>
`
  },
  {
    id: 6,
    slug: "services-security",
    title_id: "6. Layanan Jaringan, Keamanan & Troubleshooting",
    title_en: "6. Services, Security & Troubleshooting",
    category: "Layanan & Keamanan / Services & Security",
    readTime: "11 min",
    icon: "🛡️",
    video: {
      url: "https://www.youtube.com/watch?v=Wj00fweUXqU",
      embedUrl: "https://www.youtube.com/embed/Wj00fweUXqU?rel=0",
      title_id: "Cara Kerja DNS Server & Resolusi Nama Jaringan (Animasi)",
      title_en: "How a DNS Server (Domain Name System) Works",
      duration: "10:45",
      channel: "PowerCert Animated Videos",
      keyTakeaways_id: [
        "Alur siklus 4 langkah DHCP: Discover -> Offer -> Request -> Acknowledge (DORA)",
        "Resolusi hierarki nama Domain Name System (DNS) pada port UDP 53",
        "Praktik perintah diagnostik command line: ping, traceroute, nslookup, dan netstat"
      ],
      keyTakeaways_en: [
        "Four-step DHCP allocation process: Discover -> Offer -> Request -> Acknowledge (DORA)",
        "Hierarchical name resolution in DNS over UDP port 53",
        "Hands-on CLI diagnostic procedures using ping, traceroute, nslookup, and netstat"
      ]
    },
    summary_id: "Prinsip kerja DNS resolver, alur 4 tahap D-O-R-A pada DHCP, enkripsi HTTPS SSL/TLS, proteksi Firewall (Stateful & ACL), serta teknik troubleshooting diagnostik berbasis CLI (Ping, Traceroute, Netstat, NSLookup).",
    summary_en: "Operational principles of DNS resolvers, 4-step D-O-R-A DHCP flow, HTTPS SSL/TLS encryption, Firewall filtering, and diagnostic troubleshooting (Ping, Traceroute, Netstat).",
    content_id: `
<h2>6. Layanan Jaringan, Keamanan &amp; Troubleshooting Diagnostik</h2>
<p>Agar jaringan dapat dimanfaatkan oleh pengguna akhir, diperlukan integrasi layanan aplikasi inti (DNS dan DHCP), sistem proteksi keamanan perimeter, serta keterampilan diagnostik pemecahan masalah.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod6_dns_dhcp_dora.svg" alt="Diagram Alur DHCP DORA dan Resolusi DNS" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Gambar 6.1: Alur 4 Tahap DHCP D-O-R-A dan Hierarki Kueri Resolusi DNS</figcaption>
</figure>

<h3>1. Domain Name System (DNS) - Port UDP 53</h3>
<p>DNS berfungsi sebagai sistem direktori terdistribusi global yang menerjemahkan nama domain yang ramah manusia (seperti <code>smkn1.sch.id</code>) menjadi alamat IP biner mesin (seperti <code>103.144.20.5</code>). Alur resolusinya bekerja secara hierarkis:</p>
<ol>
  <li><strong>Local Cache &amp; Recursive Resolver (ISP)</strong>: Mengecek apakah IP domain sudah tersimpan di cache komputer klien atau DNS server lokal ISP.</li>
  <li><strong>Root Nameserver (.)</strong>: Jika tidak ada di cache, kueri dilempar ke salah satu dari 13 klaster Root Nameserver dunia untuk menanyakan server penanggung jawab Top-Level Domain (TLD).</li>
  <li><strong>TLD Nameserver (.id / .com / .edu)</strong>: Mengarahkan kueri ke server otoritatif domain institusi yang bersangkutan (misal: pengelola domain .id yaitu PANDI).</li>
  <li><strong>Authoritative Nameserver</strong>: Server resmi milik pengelola domain yang menyimpan <em>Zone File</em> asli. Server ini memberikan jawaban final alamat IP (Rekord A/AAAA) kembali ke klien.</li>
</ol>

<h3>2. Dynamic Host Configuration Protocol (DHCP) - Port UDP 67 &amp; 68</h3>
<p>Layanan otomatisasi konfigurasi jaringan ke komputer klien tanpa perlu memasukkan IP secara manual satu per satu. Proses alokasi berjalan melalui 4 tahap (<strong>D-O-R-A</strong>):</p>
<ol>
  <li><strong>1. Discover (Broadcast)</strong>: Klien PC yang baru dinyalakan belum memiliki IP, sehingga memancarkan paket broadcast ke alamat <code>255.255.255.255</code> mencari keberadaan DHCP Server di jaringan.</li>
  <li><strong>2. Offer (Unicast / Broadcast)</strong>: Server DHCP yang mendengar pesan tersebut memeriksa pool IP yang tersedia, lalu menawarkan satu IP (misal: <code>192.168.1.15</code>), Subnet Mask, Gateway, dan masa sewa (Lease Time).</li>
  <li><strong>3. Request (Broadcast)</strong>: Klien mengirim pesan resmi menyetujui tawaran IP tersebut. Pesan dibroadcast agar server DHCP lain (jika ada lebih dari 1) mengetahui bahwa penawaran mereka dilepas kembali.</li>
  <li><strong>4. Acknowledge (ACK - Unicast)</strong>: Server DHCP mengonfirmasi, mencatat MAC address klien dalam tabel sewa (binding table), dan menyerahkan konfigurasi IP penuh kepada klien.</li>
</ol>

<h3>3. Keamanan Protokol HTTPS &amp; TLS (Port TCP 443)</h3>
<p>Protokol HTTP biasa (Port 80) mengirim data dalam format teks terbuka (plaintext), sehingga kredensial login dan kata sandi dapat disadap di jaringan publik (Wi-Fi sniffing). <strong>HTTPS</strong> menyelimuti komunikasi dengan lapisan kriptografi <strong>TLS (Transport Layer Security)</strong> menggunakan enkripsi asimetris saat pertukaran kunci dan enkripsi simetris AES saat pengiriman data payload, menjamin kerahasiaan dan integritas data.</p>

<h3>4. Firewall &amp; Aturan Penyaringan Paket (ACL)</h3>
<ul>
  <li><strong>Prinsip Stateful Packet Inspection</strong>: Firewall modern melacak status koneksi TCP (SYN, ESTABLISHED) dan hanya mengizinkan paket balasan masuk yang sesuai dengan sesi yang diprakarsai dari dalam jaringan lokal.</li>
  <li><strong>Prinsip Implicit Deny (Penolakan Bawaan)</strong>: Setiap baris aturan Access Control List (ACL) pada router selalu diakhiri dengan aturan penolakan implisit di baris terbawah (<code>deny any any</code>). Segala paket yang tidak secara tegas diizinkan (permit) akan otomatis dibuang (dropped).</li>
</ul>

<h3>5. Perangkat Perintah Diagnostik Troubleshooting CLI:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Perintah CLI</th><th>Fungsi Diagnostik</th><th>Contoh Eksekusi</th></tr>
  </thead>
  <tbody>
    <tr><td><code>ping &lt;ip/domain&gt;</code></td><td>Menguji konektivitas end-to-end dengan paket ICMP Echo Request/Reply dan mengukur latensi RTT serta packet loss.</td><td><code>ping 8.8.8.8</code></td></tr>
    <tr><td><code>tracert &lt;ip/domain&gt;</code></td><td>Melacak setiap lompatan router perantara (hop) yang dilewati paket data dan mendeteksi titik bottleneck.</td><td><code>tracert google.com</code></td></tr>
    <tr><td><code>nslookup &lt;domain&gt;</code></td><td>Menguji fungsi penerjemahan DNS Server dan memeriksa query rekord A/CNAME/MX domain.</td><td><code>nslookup smkn1.sch.id</code></td></tr>
    <tr><td><code>ipconfig /all</code></td><td>Menampilkan konfigurasi lengkap kartu jaringan (IP Address, Subnet Mask, Default Gateway, DNS, MAC Address).</td><td><code>ipconfig /all</code></td></tr>
    <tr><td><code>netstat -ano</code></td><td>Menampilkan seluruh soket koneksi jaringan TCP/UDP yang sedang aktif beserta nomor port dan Process ID (PID).</td><td><code>netstat -ano</code></td></tr>
    <tr><td><code>arp -a</code></td><td>Menampilkan pemetaan tabel ARP lokal (pasangan IP Address dengan MAC Address perangkat tetangga).</td><td><code>arp -a</code></td></tr>
  </tbody>
</table>
`,
    content_en: `
<h2>6. Network Services, Security & Troubleshooting</h2>
<p>End-to-end operation requires essential application services (DNS & DHCP), packet filtering firewalls, and rigorous command-line troubleshooting practices.</p>

<figure style="margin: 1.25rem 0; text-align: center;">
  <img src="assets/images/materials/mod6_dns_dhcp_dora.svg" alt="DHCP DORA and DNS Resolution Diagram" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #334155;" />
  <figcaption style="font-size: 0.8rem; color: #94a3b8; font-family: monospace; margin-top: 6px;">Figure 6.1: DHCP 4-Step DORA Allocation and Hierarchical DNS Resolution</figcaption>
</figure>

<h3>Core Services & Diagnostic Toolkit:</h3>
<ul>
  <li><strong>DNS (Port 53 UDP)</strong>: Hierarchical domain resolution: Root (.) -> TLD (.id, .com) -> Authoritative Nameservers.</li>
  <li><strong>DHCP D-O-R-A</strong>: Discover (Broadcast), Offer, Request, Acknowledge (ACK).</li>
  <li><strong>CLI Tools</strong>: <code>ping</code> (ICMP latency test), <code>tracert</code> (path hop tracer), <code>nslookup</code> (DNS verification), <code>ipconfig /all</code> (adapter telemetry), <code>netstat -ano</code> (open ports & sockets).</li>
</ul>
`
  }
];

export function getYouTubeEmbedUrl(url) {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`;
  }
  return url;
}
