// NetLearn - Buku Panduan Tata Cara Penggunaan Aplikasi (ID) & User Guide (EN)

export const MANUAL_BOOK = {
  id: {
    title: "Panduan Pengguna NetLearn",
    subtitle: "Petunjuk Lengkap Eksplorasi Media Pembelajaran Mandiri Jaringan Komputer TKJ",
    sections: [
      {
        title: "1. Pengenalan & Fitur Unggulan NetLearn",
        content: `
<p class="leading-relaxed"><strong>NetLearn</strong> adalah platform pembelajaran mandiri interaktif yang dirancang khusus untuk mata pelajaran Jaringan Komputer pada kompetensi keahlian Teknik Komputer dan Jaringan (TKJ). NetLearn mengintegrasikan laboratorium virtual berstandar industri Cisco Packet Tracer, petualangan 3D mini game perkotaan jaringan, kurikulum 6 modul TKJ, dan instrumen evaluasi kognitif HOTS.</p>
<div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">⚡ Lab Cisco Packet Tracer & 5 Topologi</strong>
    <p class="text-xs text-on-surface-variant">Simulasi transmisi paket PDU realtime & step-by-step, Event List Table, inspeksi 7-Layer OSI, CLI terminal Cisco IOS, serta 5 topologi fisik (Bus, Star, Ring, Mesh, Tree).</p>
  </div>
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">🚗 NetDrive 3D: Network Quest City</strong>
    <p class="text-xs text-on-surface-variant">Jelajahi kota metropolitan 36 blok dengan kendaraan kurir paket data, antar paket TCP/UDP ke server gedung, selesaikan 6 pos kuis protokol, dan pantau radar mini-map.</p>
  </div>
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">📚 6 Modul Kurikulum Merdeka & SKKNI</strong>
    <p class="text-xs text-on-surface-variant">Materi interaktif lengkap mulai dari Dasar Jaringan, Perangkat Keras & ARP, IPv4 & VLSM, Routing, Media Transmisi, hingga OSI 7-Layer & TCP/IP.</p>
  </div>
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">🎯 Evaluasi HOTS & Telemetri Belajar</strong>
    <p class="text-xs text-on-surface-variant">Uji pemahaman kognitif melalui Pretest & Posttest 25 soal cerita analitis untuk mengukur Normalized Gain Score ($g$) dan raih 8 lencana prestasi belajar.</p>
  </div>
</div>
`
      },
      {
        title: "2. Tata Cara Pendaftaran Akun & Masuk Aplikasi",
        content: `
<p class="leading-relaxed">Setiap siswa dapat membuat akun belajar mandiri atau langsung masuk menggunakan akun Google terintegrasi:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Aplikasi</strong>: Akses halaman NetLearn melalui peramban web pada komputer lab atau smartphone Anda.</li>
  <li><strong>Pilihan Masuk Cepat dengan Akun Google (SSO)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Tekan tombol <strong>"Masuk dengan Akun Google"</strong> pada layar autentikasi.</li>
      <li>Pilih akun Google Anda. Sistem akan langsung menghubungkan profil Anda secara instan tanpa perlu mengingat kata sandi tambahan.</li>
    </ul>
  </li>
  <li><strong>Mendaftar Akun Siswa Baru (Manual)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Pilih tab <em>"Daftar Akun Baru"</em> pada kotak autentikasi.</li>
      <li>Ketikkan <strong>Nama Lengkap Siswa</strong> secara jelas sesuai presensi sekolah.</li>
      <li>Pilih <strong>Kelas Siswa (TKJ)</strong> dari menu dropdown (tersedia pilihan kelas <em>X TKJ 1, X TKJ 2, XI TKJ 1, XI TKJ 2, XII TKJ 1, XII TKJ 2</em>).</li>
      <li>Masukkan <strong>Alamat Email</strong> aktif dan buat <strong>Kata Sandi</strong> minimal 6 karakter.</li>
      <li>Tekan tombol <strong>"Buat Akun NetLearn"</strong>. Akun Anda akan langsung dibuat dan sesi belajar dimulai.</li>
    </ul>
  </li>
  <li><strong>Keluar dari Akun (Logout)</strong>: Klik tombol keluar (ikon logout) pada sidebar navigasi atau pada kartu sesi di halaman <em>Profil</em> setelah selesai belajar.</li>
</ol>
`
      },
      {
        title: "3. Tata Cara Mempelajari Modul & Menonton Video Interaktif",
        content: `
<p class="leading-relaxed">Kurikulum NetLearn disusun secara terstruktur untuk menguasai arsitektur jaringan secara mendalam:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Menu Materi</strong>: Klik menu <strong>"Materi & Modul"</strong> pada navigasi sebelah kiri atau header atas.</li>
  <li><strong>Daftar 6 Modul Pembelajaran</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li><strong>Modul 1</strong>: Pengantar Jaringan, Klasifikasi (PAN, LAN, MAN, WAN), Bandwidth, Latensi, dan Diagram Topologi.</li>
      <li><strong>Modul 2</strong>: Perangkat Keras Jaringan, Switch L2, Router Gateway, Collision Domain, dan Protokol ARP.</li>
      <li><strong>Modul 3</strong>: Pengalamatan IP IPv4, Subnetting CIDR Prefix, dan Perhitungan VLSM Ruangan.</li>
      <li><strong>Modul 4</strong>: Dasar-Dasar Routing (Routing Statis, Dynamic RIP, OSPF, EIGRP, BGP) dan Next Hop.</li>
      <li><strong>Modul 5</strong>: Media Transmisi, Karakteristik Kabel UTP/STP T568A/B, Serat Optik, dan Atenuasi.</li>
      <li><strong>Modul 6</strong>: Model Referensi OSI 7 Layer dan Arsitektur TCP/IP (Enkapsulasi L2–L7, DNS, DHCP DORA).</li>
    </ul>
  </li>
  <li><strong>Membaca Materi Interaktif</strong>: Klik <strong>"Baca Materi"</strong> pada salah satu kartu modul untuk membaca lembar modul interaktif lengkap dengan skema diagram arsitektur.</li>
  <li><strong>Menyelesaikan Modul & Klaim XP</strong>: Gulir ke bagian bawah materi lalu klik tombol <strong>"Tandai Selesai Dibaca"</strong> untuk memperoleh <strong>+100 XP</strong>.</li>
  <li><strong>Mengunduh Modul untuk Belajar Offline</strong>: Klik tombol <strong>"Unduh Modul (.doc)"</strong> untuk mengunduh dokumen modul resmi dalam format Microsoft Word yang siap dipelajari secara luring.</li>
  <li><strong>Menonton Video Pembelajaran</strong>: Buka tab <strong>"Video Pembelajaran"</strong> untuk memutar video penjelasan praktikum dan animasi simulasi jaringan.</li>
</ol>
`
      },
      {
        title: "4. Tata Cara Menggunakan Simulator Cisco Packet Tracer & 5 Topologi",
        content: `
<p class="leading-relaxed">Laboratorium virtual NetLearn menghadirkan simulator jaringan berstandar Cisco Packet Tracer yang dapat dijalankan langsung di browser:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Laboratorium Virtual</strong>: Klik menu <strong>"Lab Simulasi"</strong> pada navigasi utama.</li>
  <li><strong>Simulasi Pengiriman Paket Data (Cisco Packet Tracer Mode)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li><strong>Mode Realtime</strong>: Tekan tombol <em>"Kirim Simple PDU (Ping)"</em> untuk menguji konektivitas langsung antara Laptop Siswa (PC-A), Switch 2960, Router Core 2911, hingga Server Web.</li>
      <li><strong>Mode Simulasi (Event List)</strong>: Pilih mode <em>"⏱️ Mode Simulasi"</em> untuk menjalankan inspeksi frame per frame. Gunakan tombol <strong>"Maju 1 Langkah (Step)"</strong> atau <strong>"Auto Play"</strong> untuk melihat pergerakan amplop PDU di sepanjang kabel.</li>
      <li><strong>PDU Inspector (Amplop Paket)</strong>: Klik tombol amplop atau baris pada tabel Event List untuk membuka jendela analisis <strong>Model OSI 7-Layer</strong> (Inbound & Outbound PDU: Physical, Data Link MAC, Network IPv4/ARP/ICMP, Transport, dan Application).</li>
      <li><strong>Cisco Physical Chassis & IOS CLI Terminal</strong>: Klik salah satu ikon perangkat pada kanvas kerja untuk membuka panel inspeksi perangkat. Anda dapat mengamati tampak fisik port chassis (Fa0/1 s.d Fa0/24) dan menjalankan perintah CLI Cisco IOS nyata (seperti <code>enable</code>, <code>show ip interface brief</code>, <code>ping</code>, dan <code>show ip route</code>).</li>
      <li><strong>Simulasi Gangguan Kabel Putus</strong>: Tekan tombol <em>"Putuskan Kabel Fa0/1"</em> untuk menguji respon jaringan saat kabel fisik putus, dan amati lampu link berubah merah serta paket dinyatakan drop/gagal.</li>
    </ul>
  </li>
  <li><strong>Eksplorasi 5 Topologi Fisik Interaktif</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Pilih tab <strong>"5 Topologi Jaringan Fisik"</strong>. Tersedia 5 pilihan bentuk topologi: <em>Bus (Kabel Koaksial & Terminator 50Ω), Star (Sentral Switch L2), Ring (Token Ring FDDI), Full Mesh (Redundansi Matriks), dan Tree (Hirarki 3-Tier)</em>.</li>
      <li>Tekan <strong>"Kirim Simple PDU"</strong> untuk melihat animasi aliran data, atau tekan <strong>"Simulasi Putus Link"</strong> untuk melihat analisis kegagalan fisik (Single Point of Failure / Signal Reflection).</li>
    </ul>
  </li>
  <li><strong>Kalkulator Subnetting VLSM</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Pilih tab <strong>"Kalkulator Pembagi IP (Subnetting)"</strong> untuk membagi alokasi IP otomatis berdasarkan kebutuhan host ruangan sekolah dengan efisiensi mask maksimal.</li>
    </ul>
  </li>
</ol>
`
      },
      {
        title: "5. Tata Cara Bermain Mini Game 3D: NetDrive 3D (Network Quest City)",
        content: `
<p class="leading-relaxed"><strong>NetDrive 3D: Network Quest City</strong> adalah mini game petualangan 3D interaktif di mana siswa mengendarai kendaraan jaringan melintasi kota metropolitan untuk menyelesaikan misi kurir paket data dan tantangan kuis protokol:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Mini Game 3D</strong>: Akses melalui menu <strong>"Mini Game 3D"</strong> atau tombol peluncur cepat di Dashboard utama.</li>
  <li><strong>Kontrol Kendaraan</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Gunakan tombol panah <strong>[W / ⬆️]</strong> untuk gas maju, <strong>[S / ⬇️]</strong> untuk rem dan mundur.</li>
      <li>Gunakan <strong>[A / ⬅️]</strong> dan <strong>[D / ➡️]</strong> untuk berbelok ke kiri dan kanan.</li>
      <li>Gunakan <strong>[Spasi]</strong> untuk rem tangan (handbrake) saat bermanuver di tikungan jalan.</li>
      <li>Tekan tombol <strong>[R]</strong> kapan saja untuk mereset posisi kendaraan kembali ke titik awal jika tersesat atau menabrak rintangan.</li>
    </ul>
  </li>
  <li><strong>Misi Kurir Paket Data (Data Delivery Quest)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Amati kartu misi di pojok kiri atas layar (menampilkan tipe paket seperti <em>TCP HTTPS:443, UDP DNS:53, ICMP Echo, atau SSH:22</em>).</li>
      <li>Ikuti arah panah panduan pada <strong>Radar Mini-Map GPS</strong> di pojok kanan bawah menuju gedung server tujuan.</li>
      <li>Masuki lingkaran zona pengantaran untuk menyelesaikan transmisi paket data dan raih tambahan skor kurir.</li>
    </ul>
  </li>
  <li><strong>Menyelesaikan 6 Pos Tantangan Protokol Jaringan</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Kendarai mobil Anda menuju 6 titik pos checkpoint protokol yang tersebar di sepanjang jalan raya kota: <em>Pos 1 (Dasar Jaringan), Pos 2 (Perangkat & ARP), Pos 3 (Subnetting IP), Pos 4 (Routing Protocol), Pos 5 (Media Transmisi), dan Pos 6 (Model OSI & Keamanan Jaringan)</em>.</li>
      <li>Dekati pos hingga muncul jendela tantangan kuis interaktif HOTS. Jawab dengan benar untuk menuntaskan pos dan memperoleh skor prestasi.</li>
    </ul>
  </li>
  <li><strong>Pilihan Koleksi 10 Kendaraan Keren</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Gunakan dropdown pilihan mobil pada toolbar atas untuk berganti kendaraan secara bebas (tersedia <em>Mobil Kurir Paket Data, Cyber Future Supercar, Sports Sedan Turbo, Luxury Cyber SUV, Mobil Polisi Siber, Formula Racer, Taksi Kota, dan Ambulans Jaringan</em>).</li>
    </ul>
  </li>
</ol>
`
      },
      {
        title: "6. Tata Cara Evaluasi Kognitif HOTS: Pretest & Posttest",
        content: `
<p class="leading-relaxed">Evaluasi pembelajaran di NetLearn menggunakan instrumen soal bertipe HOTS (Higher Order Thinking Skills) untuk mengukur daya analisis, sintesis, dan evaluasi siswa:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Mengerjakan Pretest Diagnostik (Awal Pembelajaran)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Buka menu <strong>"Evaluasi HOTS"</strong> lalu pilih <em>Pretest Diagnostik</em> sebelum Anda mulai mempelajari seluruh modul.</li>
      <li>Jawab 25 butir soal cerita studi kasus untuk mengidentifikasi kemampuan awal Anda.</li>
      <li>Setelah selesai, kirim jawaban untuk mengunci skor baseline Anda.</li>
    </ul>
  </li>
  <li><strong>Mengerjakan Posttest HOTS (Akhir Pembelajaran)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Setelah mempelajari seluruh modul kurikulum dan bereksperimen di simulator lab, kerjakan <em>Posttest HOTS</em>.</li>
      <li>Sistem akan membandingkan hasil Pretest vs Posttest dan menghitung <strong>Normalized Gain Score ($g$)</strong>:
        <br/><code class="text-primary font-bold">g = (Posttest - Pretest) / (25 - Pretest)</code>
      </li>
      <li>Kategori Peningkatan: <em>Tinggi ($g \ge 0.70$)</em>, <em>Sedang ($0.30 \le g < 0.70$)</em>, dan <em>Rendah ($g < 0.30$)</em>.</li>
    </ul>
  </li>
  <li><strong>Mengunduh Laporan Diagnostik Kognitif</strong>: Pada lembar hasil ujian, klik tombol <strong>"Unduh Laporan (.doc)"</strong> untuk mengunduh rekapitulasi capaian kognitif resmi berformat Microsoft Word.</li>
</ol>
`
      },
      {
        title: "7. Tata Cara Mengelola Profil Siswa & Memantau Prestasi",
        content: `
<p class="leading-relaxed">Setiap siswa memiliki kendali penuh atas identitas profil belajarnya dan dapat memantau perolehan XP serta lencana akademik:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Halaman Profil</strong>: Klik menu <strong>"Profil"</strong> pada navigasi utama, atau klik kartu foto nama Anda di pojok kiri bawah.</li>
  <li><strong>Memperbarui Nama Lengkap & Kelas</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Pada formulir profil, Anda dapat memperbarui <strong>Nama Lengkap Siswa</strong> dan menyesuaikan pilihan <strong>Kelas TKJ</strong> jika diperlukan.</li>
    </ul>
  </li>
  <li><strong>Mengganti Foto Profil (Avatar)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Klik tombol <strong>"Pilih Foto Baru"</strong> untuk mengunggah foto profil dari komputer atau smartphone Anda (format JPG/PNG).</li>
      <li>Anda juga dapat memilih avatar preset siswa yang telah disediakan dengan sekali klik.</li>
    </ul>
  </li>
  <li><strong>Menyimpan Perubahan</strong>: Klik tombol <strong>"Simpan Perubahan Profil"</strong>. Data nama dan foto profil akan langsung diperbarui di seluruh bagian aplikasi.</li>
  <li><strong>Koleksi Lencana Prestasi Akademik</strong>: Amati 8 lencana penghargaan yang telah Anda buka di halaman profil (seperti <em>Langkah Pertama, Kolektor Modul, Pembelajar Visual, Pakar Subnetting, Master Model OSI, Juara Posttest, Peningkatan Positif, dan Net Grandmaster</em>).</li>
</ol>
`
      }
    ]
  },

  en: {
    title: "NetLearn User Guide",
    subtitle: "Complete Hands-on Guide for Computer Network Vocational Self-Directed Learning",
    sections: [
      {
        title: "1. Overview & Highlight Features of NetLearn",
        content: `
<p class="leading-relaxed"><strong>NetLearn</strong> is an interactive vocational learning workstation engineered specifically for Computer Network Engineering (TKJ). It integrates industry-standard Cisco Packet Tracer virtual laboratories, an open-world 3D networking city minigame, 6 accredited curriculum modules, and HOTS cognitive diagnostic assessments.</p>
`
      },
      {
        title: "2. Student Account Registration & Sign-In Workflow",
        content: `
<p class="leading-relaxed">Students can register manually by providing their full name, selecting their TKJ class from the dropdown menu, and setting an email and password. Alternatively, Quick Sign-In with Google provides instant authentication with a single click.</p>
`
      },
      {
        title: "3. Learning Curriculum Modules & Interactive Offline Study",
        content: `
<p class="leading-relaxed">Access 6 comprehensive curriculum modules covering Network Fundamentals, Hardware & ARP, IPv4 VLSM, Routing, Transmission Media, and OSI 7-Layer & TCP/IP. Mark modules as completed to earn XP, and download Word-compatible documents for offline reference.</p>
`
      },
      {
        title: "4. Cisco Packet Tracer Lab Simulator & 5 Physical Topologies",
        content: `
<p class="leading-relaxed">Experience a realistic Cisco Packet Tracer simulation in your browser: toggle Realtime and Simulation modes, observe packet transitions in the Event List, dissect 7 OSI Layer headers in the PDU Inspector, access the Cisco Physical Chassis & IOS CLI Terminal, and explore 5 physical topologies (Bus, Star, Ring, Mesh, Tree).</p>
`
      },
      {
        title: "5. Playing NetDrive 3D: Network Quest City (3D Minigame)",
        content: `
<p class="leading-relaxed">Drive a networking vehicle across a 36-superblock metropolitan city: deliver TCP/UDP data packets to destination server towers, complete 6 protocol checkpoint challenges, navigate with a calibrated GPS radar mini-map, and choose from 10 distinct vehicles.</p>
`
      },
      {
        title: "6. HOTS Cognitive Diagnostic Evaluations: Pretest & Posttest",
        content: `
<p class="leading-relaxed">Take the 25-question scenario-based Pretest and Posttest to benchmark your analytical skills. The system automatically calculates your Normalized Gain Score ($g$) and generates downloadable Word diagnostic certificates.</p>
`
      },
      {
        title: "7. Managing Student Profile & Tracking Academic Badges",
        content: `
<p class="leading-relaxed">Manage your student credentials, adjust your class assignment, upload a custom avatar photo, and monitor your XP progress along with 8 unlockable academic achievement badges.</p>
`
      }
    ]
  }
};
