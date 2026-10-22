// NetQuest - 6 Modul Materi Pembelajaran Jaringan Komputer (Bilingual ID/EN)
// Sesuai silabus: Word-compatible export, ringkasan interaktif, dan materi mendalam.

export const MATERIALS = [
  {
    id: 1,
    slug: "network-types",
    title_id: "1. Pengantar & Jenis Jaringan Komputer",
    title_en: "1. Introduction & Types of Computer Networks",
    category: "Dasar Jaringan / Network Fundamentals",
    readTime: "8 min",
    icon: "🌐",
    video: {
      url: "https://www.youtube.com/watch?v=cNwEVYkx2Kk",
      embedUrl: "https://www.youtube-nocookie.com/embed/cNwEVYkx2Kk?rel=0&modestbranding=1",
      title_id: "Pengenalan Jaringan Komputer, LAN, MAN, WAN - Dasar & Klasifikasi",
      title_en: "Introduction to Computer Networks, LAN, MAN, WAN - Fundamentals",
      duration: "11:25",
      channel: "NetQuest Academy",
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
    summary_id: "Memahami definisi jaringan komputer, klasifikasi berdasarkan jangkauan geografis: PAN, LAN, MAN, dan WAN beserta karakteristik latensi dan throughput-nya.",
    summary_en: "Understand computer network definitions, classification based on geographic reach: PAN, LAN, MAN, and WAN along with latency and throughput characteristics.",
    content_id: `
<h2>1. Pengantar Jaringan Komputer</h2>
<p>Jaringan komputer adalah interkoneksi antara dua atau lebih perangkat komputasi otonom yang saling terhubung melalui media transmisi (kabel atau nirkabel) untuk berbagi sumber daya (data, berkas, printer, perangkat komputasi) dan bertukar informasi.</p>

<h3>Klasifikasi Berdasarkan Cakupan Geografis:</h3>
<ul>
  <li><strong>PAN (Personal Area Network)</strong>:
    <ul>
      <li>Jangkauan: Radius kurang dari 10 meter (lingkungan personal).</li>
      <li>Teknologi: Bluetooth, Zigbee, UWB (Ultra-Wideband), USB.</li>
      <li>Contoh: Koneksi smartwatch ke smartphone, headset wireless ke laptop.</li>
      <li>Karakteristik: Konsumsi daya sangat rendah, throughput moderat, konfigurasi otomatis (ad-hoc).</li>
    </ul>
  </li>
  <li><strong>LAN (Local Area Network)</strong>:
    <ul>
      <li>Jangkauan: 100 meter hingga 1 kilometer (ruang kelas, laboratorium, satu gedung kantor).</li>
      <li>Teknologi: Ethernet (IEEE 802.3 Cat5e/Cat6), Wi-Fi (IEEE 802.11 ax/ac).</li>
      <li>Kecepatan: 100 Mbps hingga 10 Gbps dengan latensi sangat rendah (< 2 ms).</li>
      <li>Kepemilikan: Dimiliki dan dikelola secara privat oleh satu institusi.</li>
    </ul>
  </li>
  <li><strong>MAN (Metropolitan Area Network)</strong>:
    <ul>
      <li>Jangkauan: 5 hingga 50 kilometer (mencakup satu area kota besar/metropolitan).</li>
      <li>Teknologi: Dark Fiber, Metro Ethernet (Metro-E), Leased Line fiber optic.</li>
      <li>Contoh: Jaringan perbankan antar kantor cabang dalam satu provinsi, jaringan smart city pemerintah kota.</li>
      <li>Karakteristik: Kecepatan tinggi, latensi rendah, dikelola oleh konsorsium penyedia telekomunikasi.</li>
    </ul>
  </li>
  <li><strong>WAN (Wide Area Network)</strong>:
    <ul>
      <li>Jangkauan: Antar-kota, antar-negara, hingga antar-benua (skala global).</li>
      <li>Teknologi: Kabel serat optik bawah laut (subsea cable), satelit orbit rendah (LEO) dan geostasioner (GEO), SD-WAN, MPLS.</li>
      <li>Contoh: Internet global.</li>
      <li>Karakteristik: Kompleksitas tinggi, latensi lebih tinggi (20 - 300 ms), melibatkan banyak ISP.</li>
    </ul>
  </li>
</ul>

<h3>Tabel Perbandingan Karakteristik Jaringan:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Tipe</th><th>Jangkauan</th><th>Kecepatan Rata-rata</th><th>Latensi</th><th>Biaya Instalasi</th></tr>
  </thead>
  <tbody>
    <tr><td>PAN</td><td>< 10 m</td><td>1 - 24 Mbps</td><td>Sangat Rendah</td><td>Sangat Murah</td></tr>
    <tr><td>LAN</td><td>100 m - 1 km</td><td>1 Gbps - 10 Gbps</td><td>< 2 ms</td><td>Rendah - Sedang</td></tr>
    <tr><td>MAN</td><td>5 - 50 km</td><td>100 Mbps - 10 Gbps</td><td>5 - 20 ms</td><td>Tinggi</td></tr>
    <tr><td>WAN</td><td>Global</td><td>10 Mbps - 100 Gbps</td><td>30 - 300 ms</td><td>Sangat Tinggi</td></tr>
  </tbody>
</table>
`,
    content_en: `
<h2>1. Introduction to Computer Networks</h2>
<p>A computer network is an interconnection of two or more autonomous computing devices linked via physical cables or wireless media to share resources (data, files, printers, hardware) and exchange digital packets.</p>

<h3>Geographic Scope Classification:</h3>
<ul>
  <li><strong>PAN (Personal Area Network)</strong>:
    <ul>
      <li>Coverage: Within 10 meters (personal space).</li>
      <li>Technologies: Bluetooth, Zigbee, Ultra-Wideband (UWB), USB.</li>
      <li>Examples: Smartwatch paired with a smartphone, wireless AR headset to tablet.</li>
      <li>Attributes: Minimal power consumption, modest throughput, ad-hoc connectivity.</li>
    </ul>
  </li>
  <li><strong>LAN (Local Area Network)</strong>:
    <ul>
      <li>Coverage: 100 meters to 1 kilometer (classrooms, lab rooms, single corporate building).</li>
      <li>Technologies: Ethernet (IEEE 802.3 Cat6/Cat6A), Wi-Fi (IEEE 802.11ax/ac).</li>
      <li>Speed: 100 Mbps up to 10 Gbps with negligible latency (< 2 ms).</li>
      <li>Ownership: Privately maintained and owned by a single enterprise.</li>
    </ul>
  </li>
  <li><strong>MAN (Metropolitan Area Network)</strong>:
    <ul>
      <li>Coverage: 5 to 50 kilometers (city-wide scale).</li>
      <li>Technologies: Metro Ethernet, Leased dark fiber optic rings.</li>
      <li>Examples: Inter-campus hospital clinics, municipal traffic camera networks.</li>
      <li>Attributes: High throughput, deterministic latency, provisioned by telecom carriers.</li>
    </ul>
  </li>
  <li><strong>WAN (Wide Area Network)</strong>:
    <ul>
      <li>Coverage: Trans-national, trans-continental, global.</li>
      <li>Technologies: Submarine fiber optic lines, satellite links, SD-WAN, MPLS circuits.</li>
      <li>Example: The global Internet.</li>
      <li>Attributes: High complexity, variable latency (20-300 ms), heterogeneous ISP routing.</li>
    </ul>
  </li>
</ul>

<h3>Network Comparison Matrix:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Type</th><th>Coverage</th><th>Average Throughput</th><th>Latency</th><th>Deployment Cost</th></tr>
  </thead>
  <tbody>
    <tr><td>PAN</td><td>< 10 m</td><td>1 - 24 Mbps</td><td>Very Low</td><td>Very Low</td></tr>
    <tr><td>LAN</td><td>100 m - 1 km</td><td>1 Gbps - 10 Gbps</td><td>< 2 ms</td><td>Low - Medium</td></tr>
    <tr><td>MAN</td><td>5 - 50 km</td><td>100 Mbps - 10 Gbps</td><td>5 - 20 ms</td><td>High</td></tr>
    <tr><td>WAN</td><td>Global</td><td>10 Mbps - 100 Gbps</td><td>30 - 300 ms</td><td>Very High</td></tr>
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
    readTime: "9 min",
    icon: "🕸️",
    video: {
      url: "https://www.youtube.com/watch?v=zbqrNg4C98U",
      embedUrl: "https://www.youtube-nocookie.com/embed/zbqrNg4C98U?rel=0&modestbranding=1",
      title_id: "Topologi Jaringan Komputer: Bus, Star, Ring, Mesh, Tree",
      title_en: "Computer Network Topologies: Bus, Star, Ring, Mesh, Tree",
      duration: "14:10",
      channel: "NetQuest Academy",
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
    summary_id: "Analisis komparatif topologi fisik dan logis: Bus, Star, Ring, Mesh, dan Tree beserta kelebihan, kelemahan, serta titik kegagalan tunggal (SPOF).",
    summary_en: "Comparative analysis of physical and logical topologies: Bus, Star, Ring, Mesh, and Tree with pros, cons, and single points of failure (SPOF).",
    content_id: `
<h2>2. Topologi Jaringan Komputer</h2>
<p>Topologi jaringan menentukan pola koneksi geometris antara node (komputer, printer, router) dalam jaringan. Terbagi atas <em>topologi fisik</em> (tata letak kabel sesungguhnya) dan <em>topologi logis</em> (alur aliran sinyal data).</p>

<h3>1. Topologi Bus</h3>
<ul>
  <li><strong>Karakteristik</strong>: Menggunakan satu kabel tulang punggung (backbone coaxial) tunggal yang menghubungkan semua perangkat secara berderet menggunakan T-connector.</li>
  <li><strong>Elemen Kritis</strong>: Wajib memiliki terminator 50-ohm di kedua ujung kabel untuk menyerap sinyal. Tanpa terminator, terjadi pantulan sinyal (signal bounce) yang memicu collision massal.</li>
  <li><strong>Kelebihan</strong>: Hemat kabel, sederhana untuk instalasi kecil.</li>
  <li><strong>Kelemahan</strong>: Jika kabel utama putus di mana saja, seluruh jaringan mati. Sulit melacak sumber gangguan.</li>
</ul>

<h3>2. Topologi Star (Bintang)</h3>
<ul>
  <li><strong>Karakteristik</strong>: Setiap workstation terhubung langsung ke satu konsentrator pusat (Switch atau Hub) melalui kabel UTP dedicated.</li>
  <li><strong>Kelebihan</strong>: Isolasi kesalahan tinggi (jika satu kabel workstation putus, perangkat lain tetap berjalan normal), mudah dikonfigurasi dan dikembangkan.</li>
  <li><strong>Kelemahan</strong>: Konsentrator sentral adalah <em>Single Point of Failure (SPOF)</em>. Jika switch pusat mati, seluruh jaringan lumpuh.</li>
</ul>

<h3>3. Topologi Ring (Cincin)</h3>
<ul>
  <li><strong>Karakteristik</strong>: Node terhubung melingkar tertutup di mana setiap node terhubung ke dua node tetangganya. Data mengalir searah menggunakan mekanisme <em>Token Passing</em> (IEEE 802.5).</li>
  <li><strong>Kelebihan</strong>: Tidak ada tabrakan data (collision-free) karena hanya pemegang token yang boleh mentransmisikan data.</li>
  <li><strong>Kelemahan</strong>: Kerusakan pada satu node atau kabel cincin memutus peredaran token dan mematikan seluruh jaringan (kecuali menggunakan dual-ring FDDI).</li>
</ul>

<h3>4. Topologi Mesh (Jala)</h3>
<ul>
  <li><strong>Karakteristik</strong>: Setiap perangkat memiliki koneksi redundan. Terbagi menjadi <em>Full Mesh</em> (setiap node terhubung ke setiap node lain: n*(n-1)/2 link) dan <em>Partial Mesh</em>.</li>
  <li><strong>Kelebihan</strong>: Toleransi kesalahan (fault tolerance) tertinggi. Ketersediaan jalur 99.999% tanpa SPOF.</li>
  <li><strong>Kelemahan</strong>: Biaya kabel dan port hardware sangat mahal, instalasi sangat rumit.</li>
</ul>

<h3>5. Topologi Tree (Pohon / Hierarchical Star)</h3>
<ul>
  <li><strong>Karakteristik</strong>: Kombinasi hierarkis dari beberapa topologi Star yang dihubungkan ke Core Switch utama. Umum digunakan pada gedung bertingkat (Core, Distribution, Access layer).</li>
  <li><strong>Kelebihan</strong>: Skalabilitas sangat baik, manajemen terpusat per departemen atau per lantai.</li>
  <li><strong>Kelemahan</strong>: Kegagalan pada Core Switch utama mematikan komunikasi antar cabang/lantai.</li>
</ul>
`,
    content_en: `
<h2>2. Computer Network Topologies</h2>
<p>Network topology defines the geometric arrangement of links and nodes (workstations, routers, switches). Distinctions exist between <em>physical topology</em> (physical cable layout) and <em>logical topology</em> (data flow paths).</p>

<h3>1. Bus Topology</h3>
<ul>
  <li><strong>Characteristics</strong>: A single central coaxial backbone connects all stations in series via BNC T-connectors.</li>
  <li><strong>Critical Element</strong>: Requires 50-ohm terminators at both endpoints to absorb electrical energy. Missing terminators cause signal reflections that corrupt all transmissions.</li>
  <li><strong>Pros</strong>: Low cable consumption, trivial initial setup.</li>
  <li><strong>Cons</strong>: Single severance disables entire network. Difficult troubleshooting.</li>
</ul>

<h3>2. Star Topology</h3>
<ul>
  <li><strong>Characteristics</strong>: Every station is tethered to a central switch/hub via point-to-point twisted pair cables.</li>
  <li><strong>Pros</strong>: High fault isolation (station cable drops do not affect peers), effortless scalability.</li>
  <li><strong>Cons</strong>: Central switch is a Single Point of Failure (SPOF). Total outage if core switch dies.</li>
</ul>

<h3>3. Ring Topology</h3>
<ul>
  <li><strong>Characteristics</strong>: Stations form a closed circular path where packets circulate unidirectionally regulated by <em>Token Passing</em>.</li>
  <li><strong>Pros</strong>: Deterministic bandwidth access, zero packet collisions.</li>
  <li><strong>Cons</strong>: A single broken station or cable segment halts token circulation and disables the entire ring (mitigated only via expensive counter-rotating dual rings).</li>
</ul>

<h3>4. Mesh Topology</h3>
<ul>
  <li><strong>Characteristics</strong>: High-density redundant links. <em>Full Mesh</em> connects every node to every other node (Formula: N*(N-1)/2 links).</li>
  <li><strong>Pros</strong>: Maximum fault tolerance, dedicated point-to-point bandwidth, no SPOF.</li>
  <li><strong>Cons</strong>: Astronomical cabling and port costs, complex administrative scaling.</li>
</ul>

<h3>5. Tree Topology (Hierarchical Star)</h3>
<ul>
  <li><strong>Characteristics</strong>: Multitiered star networks aggregated under distribution switches and a core root switch (Core, Distribution, Access tiers).</li>
  <li><strong>Pros</strong>: Excellent modularity, structured segment isolation.</li>
  <li><strong>Cons</strong>: Root core failure decouples cross-tier communication.</li>
</ul>
`
  },
  {
    id: 3,
    slug: "osi-tcpip",
    title_id: "3. Model OSI & Protokol TCP/IP",
    title_en: "3. OSI Model & TCP/IP Protocol Suite",
    category: "Protokol / Protocol Standards",
    readTime: "10 min",
    icon: "📚",
    video: {
      url: "https://www.youtube.com/watch?v=4tB891Fm69g",
      embedUrl: "https://www.youtube-nocookie.com/embed/4tB891Fm69g?rel=0&modestbranding=1",
      title_id: "Model OSI 7 Layer & TCP/IP Dijelaskan Mudah!",
      title_en: "OSI 7 Layers & TCP/IP Protocol Suite Explained",
      duration: "16:40",
      channel: "NetQuest Academy",
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
    summary_id: "Studi 7 Lapisan OSI vs 4 Lapisan TCP/IP, proses enkapsulasi/de-enkapsulasi PDU, perbandingan mendalam TCP (handshake, reliable) vs UDP (connectionless, real-time).",
    summary_en: "Study of the 7-Layer OSI vs 4-Layer TCP/IP model, PDU encapsulation process, and deep comparison of TCP (handshake, reliable) vs UDP (connectionless, real-time).",
    content_id: `
<h2>3. Model Referensi OSI & Arsitektur TCP/IP</h2>
<p>Model OSI (Open Systems Interconnection) adalah model konseptual 7 lapisan standar ISO untuk standardisasi komunikasi data. Sementara protokol Internet modern mengimplementasikan model TCP/IP 4 lapisan.</p>

<h3>7 Lapisan OSI (Dari Atas ke Bawah):</h3>
<ol>
  <li><strong>7. Application Layer</strong>: Antarmuka interaksi langsung dengan perangkat lunak pengguna. Protokol: HTTP, HTTPS, DNS, DHCP, FTP, SMTP.</li>
  <li><strong>6. Presentation Layer</strong>: Format data, kompresi, dan enkripsi/dekripsi. Contoh: SSL/TLS, JPEG, ASCII, UTF-8.</li>
  <li><strong>5. Session Layer</strong>: Membuka, memelihara, dan menutup sesi dialog antar aplikasi. Protokol: NetBIOS, RPC, PPTP.</li>
  <li><strong>4. Transport Layer</strong>: Pengiriman data end-to-end (ujung ke ujung), segmentasi data, flow control, dan error recovery. Protokol: TCP, UDP. <em>PDU: Segment</em>.</li>
  <li><strong>3. Network Layer</strong>: Pengalamatan logis (IP Address) dan penentuan rute terbaik (routing). Perangkat: Router. <em>PDU: Packet</em>.</li>
  <li><strong>2. Data Link Layer</strong>: Pengalamatan fisik (MAC Address), deteksi kesalahan frame (FCS/CRC), dan kontrol akses media (CSMA/CD). Perangkat: Switch, Bridge. <em>PDU: Frame</em>.</li>
  <li><strong>1. Physical Layer</strong>: Transmisi bit mentah (0 dan 1) melalui media fisik dalam bentuk pulsa listrik, cahaya, atau gelombang radio. Perangkat: Hub, Repeater, Kabel UTP, Fiber. <em>PDU: Bits</em>.</li>
</ol>

<h3>Enkapsulasi & De-Enkapsulasi Data:</h3>
<p>Saat data dikirim: Data Aplikasi -> diberi header TCP/UDP (Segment) -> diberi header IP (Packet) -> diberi header MAC & trailer CRC (Frame) -> diubah menjadi sinyal fisik (Bits). Pada penerima, terjadi proses kebalikannya (de-enkapsulasi).</p>

<h3>Perbandingan Kritis: TCP vs UDP</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Parameter</th><th>TCP (Transmission Control Protocol)</th><th>UDP (User Datagram Protocol)</th></tr>
  </thead>
  <tbody>
    <tr><td>Koneksi</td><td>Connection-Oriented (3-Way Handshake: SYN -> SYN-ACK -> ACK)</td><td>Connectionless (langsung kirim tanpa jabat tangan)</td></tr>
    <tr><td>Keandalan</td><td>Reliable (ada retransmisi paket yang hilang & checksum)</td><td>Unreliable (Best Effort, tidak ada retransmisi)</td></tr>
    <tr><td>Urutan Data</td><td>Paket disusun ulang sesuai nomor urut (Sequence Number)</td><td>Paket diterima dalam urutan apa pun yang tiba</td></tr>
    <tr><td>Kecepatan</td><td>Lebih lambat karena overhead header 20-60 byte & ack tracking</td><td>Sangat cepat dan ringan (header hanya 8 byte)</td></tr>
    <tr><td>Kasus Pakai</td><td>Web browsing (HTTPS), email (SMTP/IMAP), file transfer (SFTP)</td><td>Streaming video, VoIP, game online real-time, DNS query</td></tr>
  </tbody>
</table>
`,
    content_en: `
<h2>3. OSI Reference Model & TCP/IP Architecture</h2>
<p>The OSI (Open Systems Interconnection) reference model is an ISO standard theoretical framework decomposing network tasks into 7 distinct layers, while the practical Internet executes the 4-layer TCP/IP suite.</p>

<h3>7 OSI Layers (Top to Bottom):</h3>
<ol>
  <li><strong>7. Application Layer</strong>: User-facing interface. Protocols: HTTP, HTTPS, DNS, DHCP, SSH.</li>
  <li><strong>6. Presentation Layer</strong>: Data formatting, compression, and encryption/decryption (TLS, JSON, JPEG).</li>
  <li><strong>5. Session Layer</strong>: Establishes, orchestrates, and terminates inter-host dialogues (RPC, Sockets).</li>
  <li><strong>4. Transport Layer</strong>: End-to-end transport, port multiplexing, reliability, flow control. Protocols: TCP, UDP. <em>PDU: Segment</em>.</li>
  <li><strong>3. Network Layer</strong>: Logical addressing (IPv4/IPv6) and best-path routing. Devices: Routers, L3 Switches. <em>PDU: Packet</em>.</li>
  <li><strong>2. Data Link Layer</strong>: Hardware addressing (MAC), framing, CRC error detection, media access control. Devices: Switches. <em>PDU: Frame</em>.</li>
  <li><strong>1. Physical Layer</strong>: Raw bitstream transmission via electrical voltage, photon wavelengths, or RF signals. <em>PDU: Bits</em>.</li>
</ol>

<h3>TCP vs UDP Comparison:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>Criteria</th><th>TCP</th><th>UDP</th></tr>
  </thead>
  <tbody>
    <tr><td>Connection</td><td>Connection-Oriented (3-Way Handshake)</td><td>Connectionless</td></tr>
    <tr><td>Reliability</td><td>Guaranteed delivery with retransmissions</td><td>Best-effort, no acknowledgment</td></tr>
    <tr><td>Sequencing</td><td>Guaranteed packet reordering via sequence numbers</td><td>Packets arrive in arbitrary order</td></tr>
    <tr><td>Overhead</td><td>20-60 bytes header + latency</td><td>8 bytes compact header, ultra-fast</td></tr>
    <tr><td>Applications</td><td>HTTPS, Banking, SSH, SFTP, REST APIs</td><td>VoIP, Online Gaming, Video Streaming, DNS</td></tr>
  </tbody>
</table>
`
  },
  {
    id: 4,
    slug: "ip-subnetting",
    title_id: "4. Pengalamatan IP & Subnetting",
    title_en: "4. IP Addressing & Subnetting",
    category: "Pengalamatan / IP Addressing",
    readTime: "11 min",
    icon: "🧮",
    video: {
      url: "https://www.youtube.com/watch?v=s_Ntt6eTn94",
      embedUrl: "https://www.youtube-nocookie.com/embed/s_Ntt6eTn94?rel=0&modestbranding=1",
      title_id: "Panduan Lengkap Menghitung Subnetting IP Address CIDR /24 s.d /30",
      title_en: "Comprehensive Guide to IP Address Subnetting & CIDR",
      duration: "18:15",
      channel: "NetQuest Academy",
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
    summary_id: "Struktur IPv4 32-bit, kelas IP A/B/C, rentang IP privat RFC 1918, rumus perhitungan subnetting CIDR (/24 s.d. /30), Network ID, Broadcast, dan jumlah host valid.",
    summary_en: "32-bit IPv4 structure, Class A/B/C, RFC 1918 private ranges, CIDR subnet calculation formulas (/24 to /30), Network ID, Broadcast, and usable hosts.",
    content_id: `
<h2>4. Pengalamatan IPv4 & Subnetting CIDR</h2>
<p>Alamat IPv4 terdiri dari 32 bit biner yang dibagi menjadi 4 oktet (masing-masing 8 bit) dipisahkan oleh tanda titik (dot-decimal format, contoh: 192.168.1.1).</p>

<h3>Kelas Alamat IPv4 Tradisional:</h3>
<ul>
  <li><strong>Kelas A</strong>: 1.0.0.0 s.d. 126.255.255.255 (Default Mask: 255.0.0.0 atau /8). Untuk jaringan skala raksasa.</li>
  <li><strong>Kelas B</strong>: 128.0.0.0 s.d. 191.255.255.255 (Default Mask: 255.255.0.0 atau /16). Untuk organisasi menengah.</li>
  <li><strong>Kelas C</strong>: 192.0.0.0 s.d. 223.255.255.255 (Default Mask: 255.255.255.0 atau /24). Untuk jaringan lokal kecil (maks 254 host).</li>
  <li><strong>Rentang Privat (RFC 1918)</strong>: Tidak dapat dirutekan di internet publik:
    <ul>
      <li>10.0.0.0 - 10.255.255.255 (10.0.0.0/8)</li>
      <li>172.16.0.0 - 172.31.255.255 (172.16.0.0/12)</li>
      <li>192.168.0.0 - 192.168.255.255 (192.168.0.0/16)</li>
    </ul>
  </li>
  <li><strong>Alamat Khusus</strong>: 127.0.0.1 (Loopback localhost), 169.254.0.0/16 (APIPA).</li>
</ul>

<h3>Konsep Subnetting & CIDR (Classless Inter-Domain Routing):</h3>
<p>Subnetting adalah teknik membagi satu blok jaringan besar menjadi beberapa sub-jaringan (subnet) yang lebih kecil guna mengoptimalkan alokasi IP, mempersempit broadcast domain, dan meningkatkan keamanan antar divisi.</p>

<h3>Rumus Emas Subnetting:</h3>
<ul>
  <li><strong>Jumlah Subnet</strong> = <code>2^s</code> (s = jumlah bit 1 yang dipinjam dari host portion).</li>
  <li><strong>Jumlah Host per Subnet</strong> = <code>2^h - 2</code> (h = jumlah bit 0 yang tersisa untuk host portion). Dikurangi 2 karena:
    <ol>
      <li>Alamat pertama adalah <strong>Network ID</strong> (pengenal subnet).</li>
      <li>Alamat terakhir adalah <strong>Broadcast Address</strong> (pengiriman ke semua host dalam subnet).</li>
    </ol>
  </li>
  <li><strong>Ukuran Blok (Block Size)</strong> = <code>256 - Oktet Mask Subnet</code>.</li>
</ul>

<h3>Tabel Referensi Cepat Notasi CIDR:</h3>
<table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse:collapse; margin-top:12px;">
  <thead style="background:#1e293b; color:#38bdf8;">
    <tr><th>CIDR</th><th>Subnet Mask</th><th>Block Size</th><th>Host Valid</th><th>Penggunaan Umum</th></tr>
  </thead>
  <tbody>
    <tr><td>/24</td><td>255.255.255.0</td><td>256</td><td>254 host</td><td>Subnet LAN standar</td></tr>
    <tr><td>/25</td><td>255.255.255.128</td><td>128</td><td>126 host</td><td>Pembagian 2 departemen besar</td></tr>
    <tr><td>/26</td><td>255.255.255.192</td><td>64</td><td>62 host</td><td>Subnet divisi kantor (50 staf)</td></tr>
    <tr><td>/27</td><td>255.255.255.224</td><td>32</td><td>30 host</td><td>Laboratorium komputer (25 PC)</td></tr>
    <tr><td>/28</td><td>255.255.255.240</td><td>16</td><td>14 host</td><td>Server farm kecil / manajemen VLAN</td></tr>
    <tr><td>/29</td><td>255.255.255.248</td><td>8</td><td>6 host</td><td>Router DMZ publik cluster</td></tr>
    <tr><td>/30</td><td>255.255.255.252</td><td>4</td><td>2 host</td><td>Tautan Router ke Router (Point-to-Point)</td></tr>
  </tbody>
</table>
`,
    content_en: `
<h2>4. IPv4 Addressing & CIDR Subnetting</h2>
<p>IPv4 addresses comprise 32 binary bits divided into four 8-bit octets expressed in dot-decimal notation (e.g., 192.168.1.1).</p>

<h3>RFC 1918 Private Address Blocks:</h3>
<ul>
  <li>10.0.0.0/8 (10.0.0.0 - 10.255.255.255)</li>
  <li>172.16.0.0/12 (172.16.0.0 - 172.31.255.255)</li>
  <li>192.168.0.0/16 (192.168.0.0 - 192.168.255.255)</li>
  <li>Loopback: 127.0.0.1 | APIPA Link-Local: 169.254.0.0/16</li>
</ul>

<h3>Subnetting Calculations:</h3>
<ul>
  <li><strong>Usable Hosts</strong> = <code>2^h - 2</code> (where <em>h</em> is remaining host bits). Two IPs are always reserved:
    <ul>
      <li>First IP: <strong>Network Identifier</strong></li>
      <li>Last IP: <strong>Subnet Broadcast Identifier</strong></li>
    </ul>
  </li>
  <li><strong>Subnet Increment / Block Size</strong> = <code>256 - Subnet Mask Octet</code>.</li>
</ul>
`
  },
  {
    id: 5,
    slug: "devices-media",
    title_id: "5. Perangkat Keras & Media Transmisi",
    title_en: "5. Hardware Devices & Transmission Media",
    category: "Perangkat / Hardware & Media",
    readTime: "9 min",
    icon: "🔌",
    video: {
      url: "https://www.youtube.com/watch?v=1z0ULvg_pW8",
      embedUrl: "https://www.youtube-nocookie.com/embed/1z0ULvg_pW8?rel=0&modestbranding=1",
      title_id: "Perangkat Jaringan: Hub, Switch, Router & Media UTP vs Fiber Optik",
      title_en: "Network Hardware: Hub, Switch, Router & Media UTP vs Fiber Optic",
      duration: "13:50",
      channel: "NetQuest Academy",
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
    summary_id: "Perbedaan Hub vs Switch vs Router, kabel twisted-pair UTP Cat5e/Cat6 vs Fiber Optik (Single-Mode vs Multi-Mode), dan standar crimping T568A vs T568B.",
    summary_en: "Differences between Hub vs Switch vs Router, twisted-pair UTP Cat5e/Cat6 vs Fiber Optics (Single-Mode vs Multi-Mode), and crimping standards T568A vs T568B.",
    content_id: `
<h2>5. Perangkat Keras Jaringan & Media Transmisi</h2>

<h3>Perangkat Keras Jaringan Utama:</h3>
<ul>
  <li><strong>Hub (Layer 1 - Physical)</strong>: Perangkat konsentrator pasif yang mereplikasi bit ke semua port tanpa memeriksa alamat. Membagi bandwidth dan berbagi 1 collision domain besar. Sangat rentan tabrakan data dan kebocoran keamanan.</li>
  <li><strong>Switch (Layer 2 - Data Link)</strong>: Konsentrator cerdas yang membaca MAC address pengirim dan tujuan pada frame. Memiliki tabel CAM (Content Addressable Memory). Setiap port merupakan <em>collision domain independen</em>, namun tetap berbagi 1 broadcast domain secara default.</li>
  <li><strong>Router (Layer 3 - Network)</strong>: Perangkat perantara antar-jaringan berbeda (berbeda subnet atau teknologi). Membaca alamat IP, mengelola routing table dinamis (OSPF, BGP, RIP), dan <em>memecah broadcast domain</em>.</li>
</ul>

<h3>Media Transmisi Fisik:</h3>
<ul>
  <li><strong>Kabel UTP (Unshielded Twisted Pair)</strong>:
    <ul>
      <li>Terdiri dari 4 pasang kawat tembaga terpilin untuk mengurangi interferensi elektromagnetik (crosstalk).</li>
      <li>Panjang transmisi maksimum yang direkomendasikan adalah <strong>100 meter</strong>.</li>
      <li>Kategori: Cat5e (hingga 1 Gbps), Cat6 (hingga 10 Gbps pada jarak < 55 m), Cat6A (10 Gbps hingga 100 m).</li>
      <li>Konektor: RJ-45.</li>
    </ul>
  </li>
  <li><strong>Kabel Fiber Optik</strong>:
    <ul>
      <li>Mentransmisikan pulsa cahaya di dalam serat silika kaca murni. <strong>100% kebal terhadap gangguan gelombang elektromagnetik (EMI)</strong> dan lonjakan petir.</li>
      <li><strong>Single-Mode Fiber (SMF)</strong>: Inti kaca sangat kecil (~9 mikron), menggunakan sinar laser. Jangkauan puluhan kilometer. Digunakan untuk backbone ISP, MAN, dan kabel bawah laut.</li>
      <li><strong>Multi-Mode Fiber (MMF)</strong>: Inti kaca lebih besar (~50-62.5 mikron), menggunakan LED. Jangkauan hingga 500 meter. Digunakan untuk interkoneksi switch server dalam satu data center.</li>
    </ul>
  </li>
</ul>

<h3>Standar Susunan Pin Kabel UTP (EIA/TIA 568):</h3>
<ul>
  <li><strong>Standar T568B (Paling Populer)</strong>:
    <ol>
      <li>Putih-Oranye</li>
      <li>Oranye</li>
      <li>Putih-Hijau</li>
      <li>Biru</li>
      <li>Putih-Biru</li>
      <li>Hijau</li>
      <li>Putih-Cokelat</li>
      <li>Cokelat</li>
    </ol>
  </li>
  <li><strong>Straight-Through Cable</strong>: Kedua ujung menggunakan standar yang sama (T568B - T568B). Digunakan untuk menghubungkan perangkat berbeda jenis: PC ke Switch, Switch ke Router.</li>
  <li><strong>Crossover Cable</strong>: Ujung satu T568A, ujung lain T568B. Digunakan untuk menghubungkan perangkat sejenis (PC ke PC, Switch ke Switch tanpa Auto-MDIX).</li>
</ul>
`,
    content_en: `
<h2>5. Network Hardware & Transmission Media</h2>

<h3>Core Network Devices:</h3>
<ul>
  <li><strong>Hub (Layer 1)</strong>: Blind electrical repeater. Broadcasts incoming bits across all ports, sharing 1 collision domain. Inefficient and insecure.</li>
  <li><strong>Switch (Layer 2)</strong>: Intelligent frame switching using CAM tables. Isolates each port into dedicated collision domains while sharing a broadcast domain.</li>
  <li><strong>Router (Layer 3)</strong>: Connects distinct IP subnets, performs packet routing, and establishes broadcast domain boundaries.</li>
</ul>

<h3>Cabling & Media:</h3>
<ul>
  <li><strong>Twisted Pair (UTP)</strong>: Maximum run length of <strong>100 meters</strong> without repeaters. Cat6 delivers 1-10 Gbps. Terminated with RJ45 modular jacks.</li>
  <li><strong>Fiber Optic Cables</strong>: Completely immune to EMI.
    <ul>
      <li><strong>Single-Mode (SMF)</strong>: 9µm core, laser light source, covers tens of kilometers.</li>
      <li><strong>Multi-Mode (MMF)</strong>: 50-62.5µm core, LED source, runs up to 550m in data centers.</li>
    </ul>
  </li>
  <li><strong>T568B Pinout Standard</strong>: 1: Wh/Orange, 2: Orange, 3: Wh/Green, 4: Blue, 5: Wh/Blue, 6: Green, 7: Wh/Brown, 8: Brown.</li>
</ul>
`
  },
  {
    id: 6,
    slug: "services-security",
    title_id: "6. Layanan Jaringan, Keamanan & Troubleshooting",
    title_en: "6. Services, Security & Troubleshooting",
    category: "Layanan & Keamanan / Services & Security",
    readTime: "10 min",
    icon: "🛡️",
    video: {
      url: "https://www.youtube.com/watch?v=kUR549yvQ6E",
      embedUrl: "https://www.youtube-nocookie.com/embed/kUR549yvQ6E?rel=0&modestbranding=1",
      title_id: "Layanan Jaringan, Keamanan Firewall & Troubleshooting Diagnostik",
      title_en: "Network Services, Firewall Security & Diagnostic Troubleshooting",
      duration: "15:20",
      channel: "NetQuest Academy",
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
    summary_id: "Prinsip kerja DNS resolver, alur 4 tahap D-O-R-A pada DHCP, enkripsi HTTPS SSL/TLS, proteksi Firewall (Stateful & ACL), serta teknik troubleshooting diagnostik (Ping, Traceroute, Netstat).",
    summary_en: "Operational principles of DNS resolvers, 4-step D-O-R-A DHCP flow, HTTPS SSL/TLS encryption, Firewall filtering, and diagnostic troubleshooting (Ping, Traceroute, Netstat).",
    content_id: `
<h2>6. Layanan Jaringan, Keamanan & Troubleshooting</h2>

<h3>1. Domain Name System (DNS)</h3>
<ul>
  <li>Berfungsi sebagai 'buku telepon internet' yang menerjemahkan nama domain yang mudah dibaca manusia (seperti <code>google.com</code>) menjadi alamat IP mesin (seperti <code>142.250.190.46</code>).</li>
  <li>Berjalan pada port UDP 53 (dan TCP 53 untuk transfer zona).</li>
  <li>Hierarki: Root Server (.) -> TLD Server (.com, .id) -> Authoritative Nameserver.</li>
</ul>

<h3>2. Dynamic Host Configuration Protocol (DHCP)</h3>
<p>Layanan otomatisasi konfigurasi IP, subnet mask, default gateway, dan DNS server ke perangkat klien. Berjalan melalui 4 tahap (<strong>D-O-R-A</strong>):</p>
<ol>
  <li><strong>Discover</strong>: Klien mem-broadcast mencari server DHCP.</li>
  <li><strong>Offer</strong>: Server DHCP menawarkan IP yang tersedia beserta masa sewa (lease time).</li>
  <li><strong>Request</strong>: Klien menyetujui tawaran IP tersebut.</li>
  <li><strong>Acknowledge (ACK)</strong>: Server mengonfirmasi dan mencatat alokasi IP.</li>
</ol>

<h3>3. Keamanan HTTPS & TLS</h3>
<ul>
  <li>HTTP mentransmisikan data dalam teks terbuka (plaintext), rentan terhadap sniffing dan serangan Man-in-the-Middle (MitM).</li>
  <li>HTTPS (Port 443) membungkus data menggunakan protokol enkripsi TLS (Transport Layer Security) dengan sertifikat digital X.509 dari Certificate Authority (CA) terpercaya.</li>
</ul>

<h3>4. Firewall & Access Control List (ACL)</h3>
<ul>
  <li>Menyaring lalu lintas data masuk dan keluar berdasarkan aturan port, IP, protokol, atau status koneksi (Stateful Packet Inspection).</li>
  <li><strong>Prinsip Implicit Deny</strong>: Segala lalu lintas yang tidak secara eksplisit diizinkan (permit) akan otomatis ditolak (drop/deny) di akhir baris aturan.</li>
</ul>

<h3>5. Perintah Diagnostik Troubleshooting Esensial:</h3>
<ul>
  <li><code>ping [ip/domain]</code>: Menguji konektivitas end-to-end menggunakan paket ICMP Echo Request dan Echo Reply.</li>
  <li><code>traceroute [ip]</code> (atau <code>tracert</code> di Windows): Melacak setiap hop router yang dilewati paket data dan mendeteksi titik kemacetan/looping.</li>
  <li><code>nslookup [domain]</code>: Menguji fungsi resolusi DNS server.</li>
  <li><code>ipconfig /all</code> (atau <code>ip a</code> di Linux): Melihat konfigurasi IP, MAC, dan DHCP lease aktif.</li>
  <li><code>netstat -ano</code>: Memeriksa port yang sedang terbuka (listening) dan koneksi aktif.</li>
</ul>
`,
    content_en: `
<h2>6. Network Services, Security & Troubleshooting</h2>

<h3>1. Domain Name System (DNS)</h3>
<ul>
  <li>Acts as the directory resolving domain hostnames (e.g. <code>google.com</code>) into IP coordinates. Runs on UDP Port 53.</li>
  <li>Hierarchical tree: Root hints (.) -> Top-Level Domain (.org, .edu) -> Authoritative Nameserver.</li>
</ul>

<h3>2. DHCP (D-O-R-A Workflow)</h3>
<ol>
  <li><strong>Discover</strong>: Broadcast query by client searching for DHCP servers.</li>
  <li><strong>Offer</strong>: Unicast/broadcast proposition from DHCP server with lease terms.</li>
  <li><strong>Request</strong>: Formal reservation request from client.</li>
  <li><strong>Acknowledge (ACK)</strong>: Final commitment binding IP, gateway, and DNS parameters.</li>
</ol>

<h3>3. Security & HTTPS (Port 443)</h3>
<ul>
  <li>Encrypted TLS handshake establishes symmetric cryptographic session keys, protecting against eavesdropping and MITM tamper attacks.</li>
</ul>

<h3>4. Essential CLI Diagnostic Commands:</h3>
<ul>
  <li><code>ping &lt;host&gt;</code>: Verifies ICMP round-trip latency and packet loss.</li>
  <li><code>tracert &lt;host&gt;</code>: Identifies every Layer 3 intermediate router hop and latency bottlenecks.</li>
  <li><code>nslookup &lt;domain&gt;</code>: Validates DNS record queries.</li>
  <li><code>ipconfig /renew</code>: Flushes and re-leases DHCP settings.</li>
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
