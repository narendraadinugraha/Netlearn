// NetQuest - 25 Soal Cerita HOTS Jaringan Komputer (Bilingual ID/EN)
// Higher Order Thinking Skills: Analisis, Evaluasi, & Pemecahan Masalah

export const HOTS_QUESTIONS = [
  // --- TOPIK 1: Pengantar & Jenis Jaringan (PAN, LAN, MAN, WAN) ---
  {
    id: 1,
    topic: 1,
    topic_id: "Pengantar & Jenis Jaringan",
    topic_en: "Introduction & Network Types",
    question_id: "Sebuah rumah sakit rujukan provinsi memiliki gedung utama, gedung laboratorium radiologi berjarak 200 meter, dan 4 klinik satelit yang tersebar di radius 15 km dalam satu kota metropolitan. Semua fasilitas memerlukan akses rekam medis real-time terpusat dengan latensi sangat rendah. Arsitektur cakupan jaringan apa yang paling tepat untuk menghubungkan seluruh gedung utama dan klinik satelit tersebut?",
    question_en: "A provincial referral hospital has a main campus, a radiology lab building 200 meters away, and 4 satellite clinics scattered within a 15 km radius across a single metropolitan city. All facilities require centralized real-time medical record access with ultra-low latency. Which network scope architecture is most appropriate to interconnect the main building and satellite clinics?",
    options_id: [
      { text: "Metropolitan Area Network (MAN) dengan leased fiber-optic ring antar klinik", correct: true },
      { text: "Local Area Network (LAN) tunggal menggunakan kabel UTP Cat6 tanpa repeater", correct: false },
      { text: "Personal Area Network (PAN) berbasis mesh Bluetooth Low Energy (BLE)", correct: false },
      { text: "Wide Area Network (WAN) publik berbasis koneksi satelit geostasioner (GEO)", correct: false }
    ],
    options_en: [
      { text: "Metropolitan Area Network (MAN) with a leased fiber-optic ring across clinics", correct: true },
      { text: "Single Local Area Network (LAN) using UTP Cat6 cabling without repeaters", correct: false },
      { text: "Personal Area Network (PAN) based on Bluetooth Low Energy (BLE) mesh", correct: false },
      { text: "Public Wide Area Network (WAN) relying on geostationary satellite (GEO) links", correct: false }
    ],
    explanation_id: "MAN mencakup area geografis satu kota/metropolitan (radius 5-50 km). Koneksi fiber-optic berkecepatan tinggi menyediakan throughput besar dan latensi sangat rendah yang dibutuhkan data medis.",
    explanation_en: "A MAN covers a city-wide geographic area (5-50 km). High-speed fiber-optic links provide high throughput and ultra-low latency required for real-time medical records."
  },
  {
    id: 2,
    topic: 1,
    topic_id: "Pengantar & Jenis Jaringan",
    topic_en: "Introduction & Network Types",
    question_id: "Seorang dokter bedah menggunakan headset AR (Augmented Reality) yang terhubung nirkabel ke smartwatch dan tablet monitor tanda vital di dalam ruang operasi (radius 2 meter). Sistem sering mengalami gangguan interferensi saat peralatan elektrokauter dinyalakan. Evaluasi solusi terbaik untuk mengamankan komunikasi data berjarak dekat ini:",
    question_en: "A surgeon uses an AR headset wirelessly tethered to a smartwatch and a vital signs monitor tablet inside an operating theater (2-meter radius). The system frequently suffers interference when electrocautery devices are active. Evaluate the best solution to ensure reliable short-range data exchange:",
    options_id: [
      { text: "Mengoptimalkan Wireless PAN (WPAN) dengan frekuensi 5 GHz / UWB (Ultra-Wideband) yang tahan interferensi", correct: true },
      { text: "Mengganti seluruh koneksi dengan jaringan satelit WAN berkecepatan tinggi", correct: false },
      { text: "Memperluas cakupan area menjadi MAN dengan memasang antena radio omni di atap rumah sakit", correct: false },
      { text: "Menghubungkan perangkat ke jaringan Wi-Fi publik 2.4 GHz rumah sakit", correct: false }
    ],
    options_en: [
      { text: "Optimize Wireless PAN (WPAN) utilizing interference-resistant 5 GHz / UWB (Ultra-Wideband)", correct: true },
      { text: "Replace all connections with a high-speed satellite WAN link", correct: false },
      { text: "Expand the network scope to a MAN by mounting omnidirectional radio towers on the roof", correct: false },
      { text: "Connect all wearable devices to the hospital's public 2.4 GHz Wi-Fi network", correct: false }
    ],
    explanation_id: "Jaringan dalam radius tubuh (< 10 meter) adalah PAN. Menggunakan frekuensi UWB atau 5 GHz mengurangi tabrakan gelombang elektromagnetik dari peralatan medis tanpa overhead jaringan luar.",
    explanation_en: "Body-area/short-distance networks (< 10m) are PANs. Using UWB or 5 GHz minimizes interference from operating room electro-surgical equipment without external network overhead."
  },
  {
    id: 3,
    topic: 1,
    topic_id: "Pengantar & Jenis Jaringan",
    topic_en: "Introduction & Network Types",
    question_id: "Perusahaan logistik multinasional ingin menghubungkan kantor pusat di Jakarta dengan gudang di Tokyo dan Frankfurt. Mereka bimbang antara VPN Internet publik atau SD-WAN dengan koneksi MPLS privat. Jika prioritas utama adalah SLA latensi terjamin dan pemulihan jalur otomatis (failover), rekomendasi arsitektur mana yang paling tepat?",
    question_en: "A multinational logistics firm needs to connect its headquarters in Jakarta with hubs in Tokyo and Frankfurt. They are deciding between public Internet VPN or SD-WAN over private MPLS. If guaranteed SLA latency and automatic failover are paramount, which WAN architecture is recommended?",
    options_id: [
      { text: "SD-WAN hibrida (MPLS SLA terjamin + backup Internet terenkripsi dengan Dynamic Path Steering)", correct: true },
      { text: "Kabel tembaga LAN langsung bawah laut tanpa router perantara", correct: false },
      { text: "Jaringan PAN Bluetooth berdaya pancar tinggi antar benua", correct: false },
      { text: "Koneksi dial-up PSTN point-to-point konvensional", correct: false }
    ],
    options_en: [
      { text: "Hybrid SD-WAN (SLA-backed private MPLS + encrypted Internet backup with Dynamic Path Steering)", correct: true },
      { text: "Direct point-to-point subsea copper LAN cabling without intermediate routers", correct: false },
      { text: "Long-range Bluetooth PAN mesh linking continents", correct: false },
      { text: "Conventional dial-up PSTN point-to-point leased lines", correct: false }
    ],
    explanation_id: "WAN antar-negara memerlukan keandalan tinggi. SD-WAN hibrida menggabungkan jaminan SLA MPLS dengan efisiensi fallback Internet publik otomatis saat jalur utama terganggu.",
    explanation_en: "Intercontinental WAN requires robust SLAs. Hybrid SD-WAN pairs deterministic MPLS pathways with dynamic, automated path steering over encrypted secondary links."
  },
  {
    id: 4,
    topic: 1,
    topic_id: "Pengantar & Jenis Jaringan",
    topic_en: "Introduction & Network Types",
    question_id: "Di sebuah sekolah menengah, laboratorium komputer A dan B berada di lantai yang sama terpisah sekat kaca 10 meter. Siswa mengeluh transfer berkas antar komputer sangat lambat. Analisis menunjukkan bahwa berkas dari Lab A dialihkan keluar ke server cloud di Singapura sebelum diunduh Lab B. Tindakan rekayasa lokal apa yang harus dilakukan?",
    question_en: "In a high school, computer labs A and B are on the same floor separated by a glass partition 10 meters apart. Students report file transfers between labs are extremely slow. Inspection reveals local files route out to a cloud server in Singapore before downloading back. What local engineering action should be taken?",
    options_id: [
      { text: "Membangun Local Area Network (LAN) langsung dengan Gigabit Switch lokal dan file-server internal", correct: true },
      { text: "Mengganti kartu jaringan komputer dengan modem dial-up 56 kbps", correct: false },
      { text: "Mengubah seluruh komputer menjadi koneksi PAN nirkabel inframerah", correct: false },
      { text: "Membeli bandwidth satelit WAN tambahan tanpa mengubah topologi lokal", correct: false }
    ],
    options_en: [
      { text: "Establish a direct local LAN with an internal Gigabit Switch and local file-share server", correct: true },
      { text: "Replace network cards with legacy 56 kbps dial-up modems", correct: false },
      { text: "Convert all workstations to line-of-sight infrared PAN adapters", correct: false },
      { text: "Purchase higher satellite WAN bandwidth without modifying local topology", correct: false }
    ],
    explanation_id: "Lalu lintas data antar komputer yang berada dalam satu gedung harus diproses di level LAN internal melalui switch lokal berkecepatan tinggi tanpa membebani gateway WAN/Internet.",
    explanation_en: "Intra-building traffic should be switched at the local LAN layer via high-speed gigabit switches rather than routing out across external WAN/cloud gateways."
  },

  // --- TOPIK 2: Topologi Jaringan (Bus, Star, Ring, Mesh, Tree) ---
  {
    id: 5,
    topic: 2,
    topic_id: "Topologi Jaringan",
    topic_en: "Network Topologies",
    question_id: "Sebuah pabrik tekstil masih menggunakan topologi Bus linear dengan kabel koaksial 10BASE2. Suatu pagi, seluruh komputer di lini produksi tiba-tiba terputus serentak. Teknisi menemukan kabel utama tidak putus, namun salah satu konektor T di ujung terjatuh dan penutup logamnya (terminator) hilang. Mengapa hilangnya satu terminator menyebabkan seluruh jaringan lumpuh?",
    question_en: "A textile plant still runs a linear Bus topology on 10BASE2 coaxial cabling. One morning, all workstations on the production floor disconnect simultaneously. Technicians find the cable is intact, but an end T-connector lost its metal cap (terminator). Why does losing one terminator paralyze the entire network?",
    options_id: [
      { text: "Sinyal listrik tidak diserap di ujung kabel sehingga memantul (signal reflection) dan merusak semua paket data", correct: true },
      { text: "Terminator berfungsi sebagai pembangkit listrik utama untuk semua kartu jaringan", correct: false },
      { text: "Topologi Bus otomatis berubah menjadi Ring terbalik yang memicu loop tak terhingga", correct: false },
      { text: "Switch pusat terkunci karena alamat IP terminator tidak dapat di-ping", correct: false }
    ],
    options_en: [
      { text: "Electrical signals are not absorbed at the end, causing signal bounce (reflection) that corrupts all data frames", correct: true },
      { text: "The terminator acts as the primary electrical generator powering the NIC cards", correct: false },
      { text: "The Bus topology spontaneously inverts into a Ring topology causing an infinite loop", correct: false },
      { text: "The central core switch locks up because the terminator IP fails to respond to pings", correct: false }
    ],
    explanation_id: "Pada topologi Bus, terminator (biasanya resistor 50 ohm) wajib ada di kedua ujung kabel untuk menyerap sinyal. Tanpa terminator, pantulan sinyal (signal reflection) memicu tabrakan data (collision) fatal.",
    explanation_en: "In a Bus topology, 50-ohm terminators at both ends absorb signals. Without termination, signal reflection causes continuous collisions, corrupting all bus communication."
  },
  {
    id: 6,
    topic: 2,
    topic_id: "Topologi Jaringan",
    topic_en: "Network Topologies",
    question_id: "Sebuah bursa perdagangan saham membutuhkan ketersediaan jaringan 99.999% (five nines). Setiap detik downtime menimbulkan kerugian miliaran rupiah. Di antara 6 server transaksi utama, topologi manakah yang memberikan toleransi kesalahan (fault tolerance) tertinggi jika terjadi kegagalan beberapa link secara simultan?",
    question_en: "A stock exchange requires 99.999% network availability. Every second of downtime causes catastrophic financial loss. Among 6 core trading servers, which topology delivers the highest fault tolerance against multiple simultaneous link failures?",
    options_id: [
      { text: "Full Mesh (setiap server terhubung langsung ke 5 server lainnya secara redundan)", correct: true },
      { text: "Single Star (seluruh server bergantung pada satu unmanaged switch 8-port)", correct: false },
      { text: "Single Ring (token passing satu arah tanpa proteksi counter-rotating)", correct: false },
      { text: "Linear Bus (semua server terhubung berderet pada satu backbone)", correct: false }
    ],
    options_en: [
      { text: "Full Mesh (every server is directly interconnected to all other 5 servers redundantly)", correct: true },
      { text: "Single Star (all servers rely on a single unmanaged 8-port switch)", correct: false },
      { text: "Single Ring (unidirectional token-passing without counter-rotating protection)", correct: false },
      { text: "Linear Bus (all servers chained consecutively along a single backbone)", correct: false }
    ],
    explanation_id: "Full Mesh menyediakan jalur alternatif terbanyak (n*(n-1)/2 = 15 link untuk 6 node). Jika beberapa link putus, paket data tetap dapat menemukan jalur alternatif tanpa single point of failure.",
    explanation_en: "Full Mesh provides maximum redundancy (n*(n-1)/2 = 15 links for 6 nodes). If multiple links fail, packets reroute via alternate dedicated links with zero downtime."
  },
  {
    id: 7,
    topic: 2,
    topic_id: "Topologi Jaringan",
    topic_en: "Network Topologies",
    question_id: "Sebuah gedung perkantoran 4 lantai menerapkan topologi Tree (Hierarchical Star). Lantai 1-4 masing-masing memiliki Switch Distribusi yang terhubung ke satu Switch Inti (Core Switch) di lantai dasar. Tiba-tiba karyawan di Lantai 3 tidak bisa mengakses Internet maupun server Lantai 1, tetapi karyawan Lantai 1, 2, dan 4 bekerja normal. Komponen manakah yang paling mungkin mengalami kegagalan?",
    question_en: "A 4-story corporate building uses a Tree (Hierarchical Star) topology. Floors 1 to 4 each feature a Distribution Switch linking to a central Core Switch in the basement. Suddenly Floor 3 staff cannot reach the Internet or Floor 1 servers, while Floors 1, 2, and 4 operate normally. Which component most likely failed?",
    options_id: [
      { text: "Switch Distribusi Lantai 3 atau kabel uplink dari Lantai 3 ke Core Switch", correct: true },
      { text: "Core Switch utama di lantai dasar", correct: false },
      { text: "Router Gateway ISP pusat penyedia internet", correct: false },
      { text: "Seluruh kabel terminator di Lantai 1 dan Lantai 4", correct: false }
    ],
    options_en: [
      { text: "Floor 3's Distribution Switch or the uplink cable connecting Floor 3 to the Core Switch", correct: true },
      { text: "The primary Core Switch in the basement", correct: false },
      { text: "The ISP Gateway router providing public Internet access", correct: false },
      { text: "All cable terminators on Floor 1 and Floor 4", correct: false }
    ],
    explanation_id: "Pada topologi Tree, jika Core Switch atau Router mati, seluruh gedung terputus. Namun karena hanya Lantai 3 yang terisolasi, titik kegagalannya ada pada node percabangan lokal Lantai 3 (Switch distribusi atau kabel uplink-nya).",
    explanation_en: "In a Tree topology, core failure disconnects the entire enterprise. Because only Floor 3 is isolated, the failure point is localized to Floor 3's distribution switch or its uplink."
  },
  {
    id: 8,
    topic: 2,
    topic_id: "Topologi Jaringan",
    topic_en: "Network Topologies",
    question_id: "Analisis kelemahan kritis dari topologi Ring konvensional berarah tunggal dibandingkan dengan topologi Star:",
    question_en: "Analyze the critical weakness of a conventional unidirectional Ring topology compared to a Star topology:",
    options_id: [
      { text: "Kerusakan pada satu kabel atau kartu jaringan satu workstation dapat memutus seluruh sirkuit komunikasi", correct: true },
      { text: "Topologi Ring membutuhkan konsentrator switch berharga jauh lebih mahal daripada Star", correct: false },
      { text: "Topologi Ring menghasilkan tabrakan data (collision) lebih banyak daripada Bus", correct: false },
      { text: "Topologi Ring tidak mendukung pengiriman berkas multimedia", correct: false }
    ],
    options_en: [
      { text: "A physical break in a single cable segment or one failed NIC halts the entire ring's token circulation", correct: true },
      { text: "Ring topologies demand far more costly central enterprise switches than Star", correct: false },
      { text: "Ring topologies generate significantly higher packet collisions than Bus topologies", correct: false },
      { text: "Ring networks are fundamentally incapable of transmitting multimedia frames", correct: false }
    ],
    explanation_id: "Pada Ring satu arah (single ring token passing), setiap node bertindak sebagai pengulang (repeater). Jika satu workstation mati atau kabelnya putus, token tidak dapat berputar dan seluruh jaringan runtuh.",
    explanation_en: "In a single ring, each node actively regenerates and forwards tokens. If any workstation powers off or a cable breaks, token circulation breaks, dropping the whole network."
  },

  // --- TOPIK 3: Model OSI & TCP/IP (Lapisan, TCP vs UDP) ---
  {
    id: 9,
    topic: 3,
    topic_id: "Model OSI & TCP/IP",
    topic_en: "OSI & TCP/IP Models",
    question_id: "Administrator jaringan mengamati lalu lintas paket dengan Wireshark. Sebuah aplikasi telekonferensi video menggunakan port UDP 5004, sedangkan transfer dokumen keuangan menggunakan port TCP 443. Manajer menanyakan mengapa video streaming tidak memakai TCP agar tidak ada frame yang hilang. Jawaban analisis teknis yang paling tepat adalah:",
    question_en: "A network admin inspects packets using Wireshark. A video conference uses UDP port 5004, while financial document transfers use TCP port 443. The manager asks why video streaming does not use TCP to avoid lost frames. What is the most accurate technical analysis?",
    options_id: [
      { text: "Mekanisme retransmisi TCP dan 3-Way Handshake menyebabkan jeda (jitter/latency) yang merusak interaksi suara/video waktu-nyata", correct: true },
      { text: "Protokol TCP tidak mampu mengalirkan data berukuran lebih dari 1 Megabyte", correct: false },
      { text: "UDP memiliki enkripsi internal kuantum yang otomatis memperbaiki citra video", correct: false },
      { text: "Header UDP lebih besar daripada header TCP sehingga membawa lebih banyak piksel", correct: false }
    ],
    options_en: [
      { text: "TCP retransmission and flow control induce jitter and latency unacceptable for interactive real-time voice/video", correct: true },
      { text: "TCP protocol is fundamentally incapable of streaming payloads exceeding 1 Megabyte", correct: false },
      { text: "UDP incorporates native quantum encryption that automatically reconstructs dropped video pixels", correct: false },
      { text: "UDP headers are significantly larger than TCP headers, carrying more video data per packet", correct: false }
    ],
    explanation_id: "UDP bersifat connectionless tanpa jaminan retransmisi (best-effort), sehingga memiliki overhead rendah dan latensi minimal. Pada video call waktu-nyata, kehilangan 1 frame lebih baik daripada video membeku (freeze) akibat menunggu paket TCP diulang.",
    explanation_en: "UDP is connectionless without retransmissions. Real-time audio/video tolerates occasional lost packets far better than freezing/jitter caused by TCP retransmission delays."
  },
  {
    id: 10,
    topic: 3,
    topic_id: "Model OSI & TCP/IP",
    topic_en: "OSI & TCP/IP Models",
    question_id: "Ketika pengguna memasukkan URL 'https://bankrakyat.id' di browser, terjadi proses enkapsulasi data dari aplikasi hingga transmisi fisik. Pasangan nama unit data (PDU) dan lapisan OSI yang tepat saat data telah diberi header IP oleh sistem operasi adalah:",
    question_en: "When a user navigates to 'https://bankrakyat.id' in a browser, data encapsulation proceeds from application down to physical transmission. What is the correct Protocol Data Unit (PDU) and OSI layer once the operating system attaches an IP header?",
    options_id: [
      { text: "Paket (Packet) pada Network Layer (Lapisan 3)", correct: true },
      { text: "Frame pada Physical Layer (Lapisan 1)", correct: false },
      { text: "Segmen (Segment) pada Data Link Layer (Lapisan 2)", correct: false },
      { text: "Bit pada Transport Layer (Lapisan 4)", correct: false }
    ],
    options_en: [
      { text: "Packet at the Network Layer (Layer 3)", correct: true },
      { text: "Frame at the Physical Layer (Layer 1)", correct: false },
      { text: "Segment at the Data Link Layer (Layer 2)", correct: false },
      { text: "Bit at the Transport Layer (Layer 4)", correct: false }
    ],
    explanation_id: "Urutan PDU enkapsulasi: Data (Layer 7-5) -> Segment (Layer 4 - Transport) -> Packet (Layer 3 - Network, dengan header IP) -> Frame (Layer 2 - Data Link, dengan MAC) -> Bits (Layer 1 - Physical).",
    explanation_en: "PDU progression: Data (L7-5) -> Segment (L4 Transport) -> Packet (L3 Network with IP header) -> Frame (L2 Data Link with MAC addresses) -> Bits (L1 Physical)."
  },
  {
    id: 11,
    topic: 3,
    topic_id: "Model OSI & TCP/IP",
    topic_en: "OSI & TCP/IP Models",
    question_id: "Seorang engineer menemukan serangan siber di mana server web dibanjiri paket dengan flag SYN aktif tanpa pernah mengirimkan paket ACK balasan, menghabiskan seluruh memori antrean koneksi server. Berdasarkan model TCP/IP, serangan 'SYN Flood' ini mengeksploitasi mekanisme apa pada Transport Layer?",
    question_en: "A cybersecurity engineer detects an attack where a web server is flooded with SYN packets without ever completing the handshake with an ACK, exhausting the server's connection backlog. Under the TCP/IP model, which Transport Layer mechanism does this 'SYN Flood' exploit?",
    options_id: [
      { text: "TCP 3-Way Handshake (SYN -> SYN-ACK -> ACK)", correct: true },
      { text: "UDP Datagram Checksum Verification", correct: false },
      { text: "ARP Table Poisoning Broadcast", correct: false },
      { text: "DNS Recursive Iteration Cache Lookup", correct: false }
    ],
    options_en: [
      { text: "TCP 3-Way Handshake (SYN -> SYN-ACK -> ACK)", correct: true },
      { text: "UDP Datagram Checksum Verification", correct: false },
      { text: "ARP Table Poisoning Broadcast", correct: false },
      { text: "DNS Recursive Iteration Cache Lookup", correct: false }
    ],
    explanation_id: "TCP 3-Way Handshake membuka koneksi dengan SYN, menunggu server membalas SYN-ACK dan mengalokasikan memori, lalu klien mengirim ACK. Penyerang sengaja tidak mengirim ACK sehingga koneksi 'half-open' memenuhi tabel memori server.",
    explanation_en: "The TCP 3-Way Handshake initiates sessions with SYN, SYN-ACK, ACK. Attackers flood SYN packets and ignore SYN-ACKs, exhausting server memory with half-open sockets."
  },
  {
    id: 12,
    topic: 3,
    topic_id: "Model OSI & TCP/IP",
    topic_en: "OSI & TCP/IP Models",
    question_id: "Dua komputer pada subnet yang sama dapat saling bertukar frame Ethernet secara langsung. Namun saat komputer A ingin mengirim data ke server di internet, paket harus diteruskan melalui Default Gateway. Lapisan OSI manakah yang bertanggung jawab mengambil keputusan perutean (routing) antar jaringan berbeda tersebut?",
    question_en: "Two hosts on the same subnet exchange Ethernet frames directly. However, when Host A sends data to an Internet server, the traffic must be routed via a Default Gateway. Which OSI layer is responsible for logical path determination and routing across diverse networks?",
    options_id: [
      { text: "Network Layer (Lapisan 3)", correct: true },
      { text: "Data Link Layer (Lapisan 2)", correct: false },
      { text: "Session Layer (Lapisan 5)", correct: false },
      { text: "Transport Layer (Lapisan 4)", correct: false }
    ],
    options_en: [
      { text: "Network Layer (Layer 3)", correct: true },
      { text: "Data Link Layer (Layer 2)", correct: false },
      { text: "Session Layer (Layer 5)", correct: false },
      { text: "Transport Layer (Layer 4)", correct: false }
    ],
    explanation_id: "Lapisan Network (Layer 3) bertanggung jawab atas pengalamatan logis (IP address) dan routing paket melintasi batasan jaringan lokal menuju jaringan remote melalui router.",
    explanation_en: "Layer 3 (Network Layer) manages logical addressing (IP) and routing decisions to move packets across multiple autonomous networks and gateways."
  },

  // --- TOPIK 4: IP Address & Subnetting (Kelas IP, subnet mask, CIDR) ---
  {
    id: 13,
    topic: 4,
    topic_id: "IP Address & Subnetting",
    topic_en: "IP Address & Subnetting",
    question_id: "Sebuah divisi riset mendapatkan alokasi blok IP 192.168.10.0/26. Manajer divisi meminta agar blok tersebut dibagi lagi untuk 2 sub-tim: Tim Kecerdasan Buatan (membutuhkan 25 host) dan Tim Robotika (membutuhkan 12 host). Berapakah subnet mask baru yang paling efisien untuk Tim Kecerdasan Buatan tanpa membuang ruang alamat berlebihan?",
    question_en: "A research division is allocated the IP block 192.168.10.0/26. The department manager instructs you to subdivide this block into 2 sub-teams: AI Team (requiring 25 usable hosts) and Robotics Team (requiring 12 usable hosts). What is the most efficient subnet mask for the AI Team?",
    options_id: [
      { text: "/27 (255.255.255.224), menyediakan 30 host valid (2^5 - 2 = 30)", correct: true },
      { text: "/28 (255.255.255.240), menyediakan 14 host valid", correct: false },
      { text: "/25 (255.255.255.128), menyediakan 126 host valid", correct: false },
      { text: "/29 (255.255.255.248), menyediakan 6 host valid", correct: false }
    ],
    options_en: [
      { text: "/27 (255.255.255.224), providing 30 usable host addresses (2^5 - 2 = 30)", correct: true },
      { text: "/28 (255.255.255.240), providing 14 usable host addresses", correct: false },
      { text: "/25 (255.255.255.128), providing 126 usable host addresses", correct: false },
      { text: "/29 (255.255.255.248), providing 6 usable host addresses", correct: false }
    ],
    explanation_id: "Kebutuhan: 25 host. Rumus host = 2^h - 2. Jika h=4 (/28) -> 16 - 2 = 14 host (kurang). Jika h=5 (/27) -> 32 - 2 = 30 host (cukup dan efisien). Subnet mask /27 adalah 255.255.255.224.",
    explanation_en: "Need: 25 hosts. Usable hosts = 2^h - 2. With h=4 (/28) -> 14 hosts (insufficient). With h=5 (/27) -> 30 hosts (fits 25 hosts perfectly with minimal waste). Mask is 255.255.255.224."
  },
  {
    id: 14,
    topic: 4,
    topic_id: "IP Address & Subnetting",
    topic_en: "IP Address & Subnetting",
    question_id: "Host A memiliki alamat IP 172.16.50.65/28. Seorang teknisi junior keliru memasukkan IP 172.16.50.79 pada Host B dan mengeluh Host B tidak dapat berkomunikasi sama sekali dengan host lain. Analisis penyebab mengapa IP 172.16.50.79 ditolak atau gagal mengirim paket:",
    question_en: "Host A has IP 172.16.50.65/28. A junior technician inadvertently assigns IP 172.16.50.79 to Host B and reports Host B cannot communicate with any host. Analyze why IP 172.16.50.79 fails:",
    options_id: [
      { text: "172.16.50.79 adalah Broadcast Address dari subnet tersebut, bukan alamat host yang valid", correct: true },
      { text: "172.16.50.79 adalah alamat Network ID dari subnet berikutnya", correct: false },
      { text: "Subnet mask /28 hanya membolehkan angka genap pada oktet terakhir", correct: false },
      { text: "Alamat IP tersebut berada di luar rentang IP privat kelas B", correct: false }
    ],
    options_en: [
      { text: "172.16.50.79 is the subnet's Broadcast Address, not an assignable host address", correct: true },
      { text: "172.16.50.79 is the Network ID of the subsequent subnet", correct: false },
      { text: "A /28 subnet mask strictly prohibits odd integers in the last octet", correct: false },
      { text: "The IP address falls completely outside the RFC 1918 Class B private address scope", correct: false }
    ],
    options_en: [
      { text: "172.16.50.79 is the subnet's Broadcast Address, not an assignable host address", correct: true },
      { text: "172.16.50.79 is the Network ID of the subsequent subnet", correct: false },
      { text: "A /28 subnet mask strictly prohibits odd integers in the last octet", correct: false },
      { text: "The IP address falls completely outside the RFC 1918 Class B private address scope", correct: false }
    ],
    explanation_id: "Blok /28 memiliki lompatan subnet 16 IP (256-240 = 16). Subnet dimulai dari 172.16.50.64 (Network ID). Rentang host valid: .65 sampai .78. Alamat .79 adalah Broadcast Address subnet ini sehingga tidak boleh digunakan oleh host.",
    explanation_en: "For /28, block size is 16. Subnet ID is 172.16.50.64. Usable range is .65 through .78. Address .79 is the reserved subnet broadcast address and cannot be assigned to an interface."
  },
  {
    id: 15,
    topic: 4,
    topic_id: "IP Address & Subnetting",
    topic_en: "IP Address & Subnetting",
    question_id: "Sebuah perusahaan ISP ingin menghubungkan router gateway pelanggan dengan router POP ISP melalui tautan kabel serial point-to-point (hanya butuh 2 alamat IP host). Notasi CIDR manakah yang paling ideal untuk mencegah pemborosan alamat IPv4 publik?",
    question_en: "An ISP needs to interconnect a customer edge router with its POP provider router across a point-to-point link (requiring strictly 2 usable host IPs). Which CIDR prefix notation is ideal to prevent IPv4 address exhaustion?",
    options_id: [
      { text: "/30 (menyediakan tepat 2 host yang dapat digunakan: 4 - 2 = 2)", correct: true },
      { text: "/24 (menyediakan 254 host)", correct: false },
      { text: "/28 (menyediakan 14 host)", correct: false },
      { text: "/16 (menyediakan 65.534 host)", correct: false }
    ],
    options_en: [
      { text: "/30 (provides exactly 2 usable host addresses: 4 - 2 = 2)", correct: true },
      { text: "/24 (provides 254 usable host addresses)", correct: false },
      { text: "/28 (provides 14 usable host addresses)", correct: false },
      { text: "/16 (provides 65,534 usable host addresses)", correct: false }
    ],
    explanation_id: "Prefix /30 menghasilkan total 4 alamat: 1 Network ID, 2 usable host IP (untuk masing-masing router), dan 1 Broadcast IP. Ini adalah standar efisiensi link point-to-point.",
    explanation_en: "A /30 prefix produces 4 total IP addresses: 1 network ID, 2 usable IPs (one for each router interface), and 1 broadcast IP, preventing waste on point-to-point links."
  },
  {
    id: 16,
    topic: 4,
    topic_id: "IP Address & Subnetting",
    topic_en: "IP Address & Subnetting",
    question_id: "Komputer A dikonfigurasi dengan IP 10.0.1.100 mask 255.255.255.0. Komputer B dikonfigurasi dengan IP 10.0.2.100 mask 255.255.255.0. Kedua komputer dihubungkan ke switch unmanaged yang sama tanpa router. Mengapa Komputer A tidak dapat melakukan ping ke Komputer B?",
    question_en: "Host A is configured with IP 10.0.1.100 mask 255.255.255.0. Host B is configured with IP 10.0.2.100 mask 255.255.255.0. Both hosts are plugged into the same unmanaged switch without a router. Why can Host A not ping Host B?",
    options_id: [
      { text: "Keduanya berada pada Network ID berbeda (10.0.1.0 vs 10.0.2.0) sehingga memerlukan Default Gateway / Router Layer 3", correct: true },
      { text: "Switch unmanaged hanya mengizinkan alamat IP yang berawalan 192.168", correct: false },
      { text: "Kabel UTP tidak dapat menghantarkan paket IP kelas A", correct: false },
      { text: "Kedua komputer memiliki subnet mask yang sama sehingga terjadi tabrakan alamat", correct: false }
    ],
    options_en: [
      { text: "Both reside on different Network IDs (10.0.1.0 vs 10.0.2.0) requiring a Layer 3 Default Gateway / Router", correct: true },
      { text: "Unmanaged switches strictly permit IP addresses starting with 192.168", correct: false },
      { text: "UTP cables are incapable of conducting Class A IP datagrams", correct: false },
      { text: "Both hosts share the same subnet mask causing an address collision", correct: false }
    ],
    explanation_id: "Dengan mask /24 (255.255.255.0), ketiga oktet pertama adalah network portion. Komputer A (10.0.1.x) menganggap Komputer B (10.0.2.x) berada di jaringan luar, sehingga mencari default gateway yang tidak ada.",
    explanation_en: "With a /24 mask, the first 3 octets define the network. Host A determines Host B is on a remote subnet and attempts to route via a non-existent gateway, failing communication."
  },

  // --- TOPIK 5: Perangkat & Media Transmisi (Hub, switch, router, UTP, fiber) ---
  {
    id: 17,
    topic: 5,
    topic_id: "Perangkat & Media Transmisi",
    topic_en: "Devices & Transmission Media",
    question_id: "Laboratorium universitas mengganti hub 16-port lama dengan switch manageable 16-port baru. Seketika performa jaringan meningkat drastis dan software packet analyzer tidak lagi melihat lalu lintas percakapan komputer lain. Evaluasi perubahan fundamental arsitektur apa yang terjadi di lapisan Data Link?",
    question_en: "A university computer lab replaces a legacy 16-port hub with a new 16-port managed switch. Immediately network performance skyrockets and packet sniffing tools no longer intercept other hosts' private conversations. Evaluate the fundamental Layer 2 architectural change that occurred:",
    options_id: [
      { text: "Switch memecah 1 collision domain besar menjadi 16 collision domain independen dengan tabel CAM / MAC address", correct: true },
      { text: "Switch mengubah transmisi sinyal kabel tembaga menjadi sinyal gelombang radio", correct: false },
      { text: "Hub mematikan seluruh firewall internal sedangkan switch menyalakannya otomatis", correct: false },
      { text: "Switch menghapus broadcast domain menjadi nol", correct: false }
    ],
    options_en: [
      { text: "The switch partitions 1 giant collision domain into 16 dedicated collision domains using a MAC CAM table", correct: true },
      { text: "The switch converts copper electrical transmissions into airborne radio signals", correct: false },
      { text: "The hub disabled all workstation firewalls whereas the switch enabled them", correct: false },
      { text: "The switch reduces the broadcast domain down to zero", correct: false }
    ],
    explanation_id: "Hub bekerja di Layer 1 dan mem-broadcast sinyal ke semua port (1 shared collision domain). Switch bekerja di Layer 2 (Data Link) dan membuat micro-segmentation: setiap port memiliki collision domain tersendiri berdasarkan tabel MAC.",
    explanation_en: "A hub is a Layer 1 repeater sharing 1 collision domain. A Layer 2 switch isolates each port into its own dedicated collision domain via MAC address inspection (CAM table)."
  },
  {
    id: 18,
    topic: 5,
    topic_id: "Perangkat & Media Transmisi",
    topic_en: "Devices & Transmission Media",
    question_id: "Sebuah pabrik peleburan baja ingin menghubungkan ruang kontrol ke workshop berjarak 800 meter yang dipenuhi motor listrik raksasa dan generator induksi berkekuatan tinggi. Kabel UTP Cat6 yang dipasang sebelumnya mengalami 'packet loss' parah dan CRC error kontinu. Rekomendasi media transmisi yang paling kebal terhadap gangguan elektromagnetik (EMI) adalah:",
    question_en: "A steel smelting plant needs to link its control room to a heavy machinery workshop 800 meters away adjacent to massive electric induction generators. The existing Cat6 UTP cable suffers severe packet loss and CRC errors. Which transmission medium is entirely immune to electromagnetic interference (EMI)?",
    options_id: [
      { text: "Kabel Fiber Optik Single-Mode (menggunakan pulsa cahaya di dalam serat kaca murni)", correct: true },
      { text: "Kabel Koaksial RG-58 tanpa pelindung", correct: false },
      { text: "Kabel UTP Cat5e unshielded dengan penguat sinyal analog", correct: false },
      { text: "Kabel tembaga listrik 220V jalur ganda (Powerline)", correct: false }
    ],
    options_en: [
      { text: "Single-Mode Fiber Optic Cable (transmitting light pulses through pure silica glass dielectric)", correct: true },
      { text: "Unshielded RG-58 Coaxial Cable", correct: false },
      { text: "Unshielded Cat5e UTP cable paired with analog repeaters", correct: false },
      { text: "Dual-conductor 220V electrical copper Powerline networking", correct: false }
    ],
    explanation_id: "Kabel fiber optik mentransmisikan data dalam bentuk gelombang cahaya (bukan arus listrik), sehingga 100% kebal terhadap radiasi elektromagnetik (EMI) dan mampu menempuh jarak > 800m tanpa degradasi sinyal.",
    explanation_en: "Fiber optic cables transmit optical pulses through a non-conductive dielectric glass medium, making them completely immune to EMI and capable of spans far exceeding copper's 100m limit."
  },
  {
    id: 19,
    topic: 5,
    topic_id: "Perangkat & Media Transmisi",
    topic_en: "Devices & Transmission Media",
    question_id: "Dua kantor cabang terhubung ke router sentral. Karyawan Cabang A dapat saling bertukar data secara normal, tetapi saat mengirim file besar ke Cabang B, router mengalami pemakaian CPU 99% dan 'buffer drop'. Manakah fungsi router yang paling membebani kinerjanya saat memproses paket antar jaringan?",
    question_en: "Two branch offices link to a central router. Branch A communicates smoothly internally, but sending high-volume transfers to Branch B drives router CPU usage to 99% with packet drops. Which routing engine function accounts for this heavy processing load?",
    options_id: [
      { text: "Pemeriksaan header IP Layer 3, de-enkapsulasi/re-enkapsulasi frame Layer 2, dan lookup tabel routing untuk setiap paket", correct: true },
      { text: "Penyusunan kabel fisik dan penyesuaian resistansi arus listrik", correct: false },
      { text: "Penggantian format file dokumen Word menjadi PDF secara otomatis", correct: false },
      { text: "Pembersihan debu elektrostatik pada kartu port ethernet", correct: false }
    ],
    options_en: [
      { text: "Layer 3 IP header verification, Layer 2 frame de/re-encapsulation, and route table lookup per packet", correct: true },
      { text: "Physical cable rearrangement and electrical current resistance tuning", correct: false },
      { text: "Automatic server-side document format transcoding from Word to PDF", correct: false },
      { text: "Electrostatic dust purging across the physical interface connectors", correct: false }
    ],
    explanation_id: "Router bekerja di Layer 3: router harus membuka frame Layer 2, membaca IP tujuan di Layer 3, mencari rute terbaik di routing table, menghitung ulang checksum, dan membungkus kembali ke frame Layer 2 baru.",
    explanation_en: "A router operates at Layer 3: it strips Layer 2 headers, inspects Layer 3 destination IPs, executes route table lookups, decrements TTL, recalculates checksums, and re-encapsulates the frame."
  },
  {
    id: 20,
    topic: 5,
    topic_id: "Perangkat & Media Transmisi",
    topic_en: "Devices & Transmission Media",
    question_id: "Seorang teknisi jaringan mengkrimping kabel UTP untuk menghubungkan Switch ke Router. Standar susunan kabel yang benar pada kedua ujung kabel Straight-Through menurut EIA/TIA-568B adalah:",
    question_en: "A technician terminates a UTP cable to interconnect a Switch to a Router. What is the standard pinout order at both ends for a Straight-Through cable under EIA/TIA-568B?",
    options_id: [
      { text: "Putih-Oranye, Oranye, Putih-Hijau, Biru, Putih-Biru, Hijau, Putih-Cokelat, Cokelat", correct: true },
      { text: "Putih-Hijau, Hijau, Putih-Oranye, Biru, Putih-Biru, Oranye, Putih-Cokelat, Cokelat", correct: false },
      { text: "Cokelat, Putih-Cokelat, Hijau, Putih-Biru, Biru, Putih-Hijau, Oranye, Putih-Oranye", correct: false },
      { text: "Putih-Biru, Biru, Putih-Oranye, Oranye, Putih-Hijau, Hijau, Putih-Cokelat, Cokelat", correct: false }
    ],
    options_en: [
      { text: "White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown", correct: true },
      { text: "White-Green, Green, White-Orange, Blue, White-Blue, Orange, White-Brown, Brown", correct: false },
      { text: "Brown, White-Brown, Green, White-Blue, Blue, White-Green, Orange, White-Orange", correct: false },
      { text: "White-Blue, Blue, White-Orange, Orange, White-Green, Green, White-Brown, Brown", correct: false }
    ],
    explanation_id: "Standar T568B secara berurutan pin 1-8 adalah: 1: Putih-Oranye, 2: Oranye, 3: Putih-Hijau, 4: Biru, 5: Putih-Biru, 6: Hijau, 7: Putih-Cokelat, 8: Cokelat.",
    explanation_en: "The EIA/TIA-568B standard pinout from pin 1 to 8 is: White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown."
  },

  // --- TOPIK 6: Layanan, Keamanan & Troubleshooting (DNS, DHCP, HTTPS, firewall, ping) ---
  {
    id: 21,
    topic: 6,
    topic_id: "Layanan, Keamanan & Troubleshooting",
    topic_en: "Services, Security & Troubleshooting",
    question_id: "Seorang karyawan kantor mengeluh tidak dapat membuka situs 'portal.kantor.co.id' dan muncul pesan 'Server Not Found'. Teknisi mencoba melakukan perintah 'ping 103.20.15.4' (IP asli server tersebut) dan ping berhasil dengan 0% packet loss. Evaluasi letak sumber permasalahan layanan jaringan:",
    question_en: "An office worker cannot load 'portal.kantor.co.id', receiving a 'Server Not Found' error. A technician runs 'ping 103.20.15.4' (the server's direct IP) and receives 0% packet loss replies. Evaluate the root cause of this network issue:",
    options_id: [
      { text: "Kegagalan layanan Domain Name System (DNS) atau kesalahan konfigurasi DNS resolver pada klien", correct: true },
      { text: "Kabel fiber optik bawah laut antar pulau putus total", correct: false },
      { text: "Kartu jaringan (NIC) komputer klien rusak secara fisik", correct: false },
      { text: "Layanan Dynamic Host Configuration Protocol (DHCP) kehabisan alamat MAC", correct: false }
    ],
    options_en: [
      { text: "Failure of Domain Name System (DNS) resolution or misconfigured DNS client resolver", correct: true },
      { text: "Subsea inter-island fiber optic backbones have sustained a physical severance", correct: false },
      { text: "The client workstation's physical Network Interface Card (NIC) is blown", correct: false },
      { text: "The Dynamic Host Configuration Protocol (DHCP) pool has exhausted MAC addresses", correct: false }
    ],
    explanation_id: "Karena ping ke IP langsung berhasil, jalur Layer 1 sampai Layer 3 berfungsi sempurna. Masalah ketidakmampuan menerjemahkan nama domain 'portal.kantor.co.id' menjadi IP membuktikan adanya kegagalan pada layanan DNS.",
    explanation_en: "Successful ping to the raw IP confirms Layer 1-3 network connectivity is intact. The failure to resolve human-readable domain names indicates a client DNS resolver or DNS server failure."
  },
  {
    id: 22,
    topic: 6,
    topic_id: "Layanan, Keamanan & Troubleshooting",
    topic_en: "Services, Security & Troubleshooting",
    question_id: "Laptop seorang mahasiswa mendapatkan alamat IP otomatis 169.254.120.45 dengan subnet mask 255.255.0.0 saat terhubung ke Wi-Fi kampus. Laptop sama sekali tidak bisa terhubung ke Internet. Apa yang sedang terjadi pada proses alokasi jaringan mahasiswa tersebut?",
    question_en: "A student laptop receives an automatic IP address 169.254.120.45 with mask 255.255.0.0 upon connecting to campus Wi-Fi. The laptop cannot browse the web. What is happening during this client's network allocation process?",
    options_id: [
      { text: "Sistem operasi menetapkan alamat APIPA (Automatic Private IP Addressing) karena server DHCP kampus tidak merespons", correct: true },
      { text: "Mahasiswa berhasil mendapatkan alamat IP publik global dengan prioritas bandwidth tertinggi", correct: false },
      { text: "Router kampus mengalokasikan subnet riset khusus untuk pengetesan kecepatan tinggi", correct: false },
      { text: "Firewall kampus secara otomatis memblokir nomor IMEI laptop", correct: false }
    ],
    options_en: [
      { text: "The OS assigned an APIPA (Automatic Private IP Addressing) fallback IP because the DHCP server failed to respond", correct: true },
      { text: "The student successfully leased a top-tier public IP address with maximum bandwidth priority", correct: false },
      { text: "The campus router routed the student to a high-speed research DMZ subnet", correct: false },
      { text: "The campus hardware firewall automatically quarantined the device's IMEI identifier", correct: false }
    ],
    explanation_id: "Rentang 169.254.0.0/16 adalah alamat link-local APIPA. Windows/OS menetapkannya secara otomatis ketika permintaan DHCP Discover/Request tidak dijawab oleh server DHCP (misalnya pool habis atau link putus).",
    explanation_en: "The 169.254.0.0/16 range is reserved for APIPA link-local addresses, automatically generated when a client sends DHCP Discover messages but receives no DHCPOFFER from a server."
  },
  {
    id: 23,
    topic: 6,
    topic_id: "Layanan, Keamanan & Troubleshooting",
    topic_en: "Services, Security & Troubleshooting",
    question_id: "Mengapa transaksi perbankan daring wajib menggunakan HTTPS (port 443) dengan sertifikat SSL/TLS valid dibandingkan HTTP biasa (port 80)? Analisis ancaman keamanan yang dicegah:",
    question_en: "Why must online banking applications mandate HTTPS (port 443) backed by valid SSL/TLS certificates over plain HTTP (port 80)? Analyze the security threat prevented:",
    options_id: [
      { text: "Mencegah serangan Man-in-the-Middle (MitM) dan penyadapan data sensitif melalui enkripsi kriptografis asimetris/simetris", correct: true },
      { text: "Mempercepat waktu booting komputer nasabah saat login", correct: false },
      { text: "Mencegah kabel fiber optik bank putus akibat panas berlebih", correct: false },
      { text: "Menjamin bahwa nasabah tidak akan pernah lupa kata sandi rekening", correct: false }
    ],
    options_en: [
      { text: "Prevents Man-in-the-Middle (MitM) eavesdropping and packet sniffing via asymmetric/symmetric cryptographic encryption", correct: true },
      { text: "Accelerates client operating system boot times during user credential entry", correct: false },
      { text: "Shields subsea bank optical fibers from overheating under heavy traffic", correct: false },
      { text: "Guarantees bank customers can never forget their account authentication pins", correct: false }
    ],
    explanation_id: "HTTP mengirim data secara plaintext (teks terbuka) sehingga mudah disadap oleh pihak ketiga di jaringan yang sama. HTTPS mengenkripsi payload dengan TLS (Transport Layer Security) untuk menjamin kerahasiaan, integritas data, dan keaslian server.",
    explanation_en: "HTTP transmits credentials as plaintext, vulnerable to network sniffing. HTTPS wraps payloads in TLS encryption, guaranteeing confidentiality, message integrity, and server authentication."
  },
  {
    id: 24,
    topic: 6,
    topic_id: "Layanan, Keamanan & Troubleshooting",
    topic_en: "Services, Security & Troubleshooting",
    question_id: "Saat melakukan pengujian konektivitas dengan perintah 'ping 192.168.1.1', administrator menerima pesan 'TTL Expired in Transit'. Analisis teknis apa yang menerangkan arti dari pesan galat ICMP tersebut?",
    question_en: "When testing connectivity with 'ping 192.168.1.1', a network administrator receives 'TTL Expired in Transit'. What is the technical analysis explaining this ICMP error message?",
    options_id: [
      { text: "Terjadi perulangan routing tanpa akhir (Routing Loop) di mana paket berputar antar-router hingga nilai TTL berkurang mencapai 0", correct: true },
      { text: "Kabel UTP yang digunakan terlalu pendek sehingga sinyal sampai mendahului waktu", correct: false },
      { text: "Server tujuan sedang mematikan layanan HTTP untuk pemeliharaan rutin", correct: false },
      { text: "Konektor RJ45 pada switch kotor terkena debu berminyak", correct: false }
    ],
    options_en: [
      { text: "An infinite routing loop exists where packets circulate between routers until the Time-to-Live (TTL) decrements to 0", correct: true },
      { text: "The UTP patch cord is physically too short causing signals to arrive prematurely", correct: false },
      { text: "The destination server has turned off its HTTP daemon for routine scheduled maintenance", correct: false },
      { text: "The RJ45 connector on the switch port is coated in oily dust residue", correct: false }
    ],
    explanation_id: "Setiap kali paket melewati router, field TTL (Time to Live) di header IP dikurangi 1. Jika ada miskonfigurasi routing loop, paket berputar terus hingga TTL=0. Router kemudian membuang paket dan mengirim pesan ICMP 'TTL Expired in Transit' untuk mencegah kemacetan jaringan permanen.",
    explanation_en: "Each router hop decrements the IP header's TTL field by 1. In a routing loop, packets circulate continuously until TTL=0, prompting the router to drop the datagram and emit ICMP Type 11 (TTL Expired)."
  },
  {
    id: 25,
    topic: 6,
    topic_id: "Layanan, Keamanan & Troubleshooting",
    topic_en: "Services, Security & Troubleshooting",
    question_id: "Sebuah server basis data MySQL (port 3306) ditempatkan di zona privat (LAN internal). Administrator ingin memastikan bahwa server ini hanya dapat diakses oleh Web Server (IP 192.168.1.10) dan seluruh akses dari jaringan luar atau workstation lain harus ditolak. Solusi firewall paling tepat pada router/firewall adalah:",
    question_en: "A MySQL database server (port 3306) resides in an internal private zone. The administrator must ensure this server accepts queries solely from Web Server (IP 192.168.1.10) and blocks all other internal or external workstations. What is the most appropriate firewall rule configuration?",
    options_id: [
      { text: "Access Control List (ACL): Permit TCP host 192.168.1.10 eq 3306, diikuti Deny TCP any eq 3306 di akhir aturan (Implicit Deny)", correct: true },
      { text: "Membuka seluruh port dari 1 sampai 65535 untuk semua alamat IP tanpa otentikasi", correct: false },
      { text: "Mengganti kabel koneksi database dengan kabel crossover UTP tanpa filter", correct: false },
      { text: "Mengubah nama komputer database menjadi huruf kapital semua", correct: false }
    ],
    options_en: [
      { text: "Access Control List (ACL): Permit TCP host 192.168.1.10 eq 3306, followed by Deny TCP any eq 3306 (Implicit Deny)", correct: true },
      { text: "Open all ports 1 through 65535 globally to any IP source without restrictions", correct: false },
      { text: "Replace the database patch cable with an unmanaged crossover cable", correct: false },
      { text: "Convert the database server operating system hostname to all uppercase characters", correct: false }
    ],
    explanation_id: "Prinsip Least Privilege dan Stateful Firewall / ACL: membuat aturan izin (permit) spesifik untuk IP sumber terpercaya (192.168.1.10) ke IP dan port tujuan (3306), lalu menerapkan penolakan (deny all) untuk sisa lalu lintas lainnya.",
    explanation_en: "Following the Principle of Least Privilege, an ingress ACL explicitly permits traffic only from source IP 192.168.1.10 destined for port 3306, while dropping all other requests via default implicit deny."
  }
];
