// NetLearn - Buku Panduan Tata Cara Penggunaan Aplikasi (ID) & User Guide (EN)

export const MANUAL_BOOK = {
  id: {
    title: "Panduan Pengguna NetLearn",
    subtitle: "Panduan Lengkap Langkah Demi Langkah Media Pembelajaran Mandiri Jaringan Komputer TKJ",
    sections: [
      {
        title: "1. Pengenalan & Fitur Utama Aplikasi NetLearn",
        content: `
<p class="leading-relaxed"><strong>NetLearn</strong> adalah platform media pembelajaran interaktif mandiri yang dikembangkan khusus untuk mata pelajaran Jaringan Komputer pada kompetensi keahlian Teknik Komputer dan Jaringan (TKJ). Aplikasi ini menggabungkan materi ajar terstandar industri, laboratorium simulasi virtual, evaluasi berbasis studi kasus HOTS, serta gamifikasi prestasi belajar.</p>
<div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">📚 6 Modul Kurikulum TKJ</strong>
    <p class="text-xs text-on-surface-variant">Materi komprehensif mulai dari dasar jaringan, OSI 7 Layer, IP Addressing, subnetting VLSM, routing, transmisi kabel, hingga troubleshooting.</p>
  </div>
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">⚡ Lab Simulasi & VLSM</strong>
    <p class="text-xs text-on-surface-variant">Kalkulator subnetting otomatis berbasis Variable Length Subnet Masking (VLSM) dan simulator topologi jaringan interaktif.</p>
  </div>
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">🎯 Evaluasi Kognitif HOTS</strong>
    <p class="text-xs text-on-surface-variant">Pretest diagnostik 25 butir soal dan Posttest akhir 25 butir soal untuk mengukur efektivitas peningkatan pemahaman siswa (Normalized Gain Score).</p>
  </div>
  <div class="p-3 bg-surface-container-low rounded-lg border border-outline-variant">
    <strong class="text-primary font-mono text-xs block mb-1">🏆 Prestasi & Telemetri Belajar</strong>
    <p class="text-xs text-on-surface-variant">Pelacakan progres perolehan XP, kenaikan level kemahiran jaringan, serta pembukaan 8 lencana prestasi akademik resmi.</p>
  </div>
</div>
`
      },
      {
        title: "2. Tata Cara Pendaftaran Akun & Masuk Aplikasi",
        content: `
<p class="leading-relaxed">Sebelum dapat mengakses materi dan simulator, setiap siswa diharapkan memiliki akun belajar mandiri.</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Aplikasi</strong>: Akses halaman utama NetLearn melalui peramban web pada komputer lab atau ponsel pintar Anda.</li>
  <li><strong>Mendaftar Akun Siswa Baru</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Pilih tab <em>"Daftar Akun Baru"</em> pada kotak autentikasi.</li>
      <li>Ketikkan <strong>Nama Lengkap Siswa</strong> secara jelas sesuai daftar presensi sekolah.</li>
      <li>Pilih <strong>Kelas Siswa (TKJ)</strong> langsung dari menu dropdown (tersedia pilihan kelas <em>X TKJ 1, X TKJ 2, XI TKJ 1, XI TKJ 2, XII TKJ 1, XII TKJ 2</em>). Anda tidak perlu mengetik nama kelas secara manual.</li>
      <li>Masukkan <strong>Alamat Email</strong> aktif dan buat <strong>Kata Sandi</strong> minimal 6 karakter.</li>
      <li>Tekan tombol <strong>"Buat Akun NetLearn"</strong>. Akun Anda akan langsung dibuat dan sesi belajar dimulai dengan progres awal 0%.</li>
    </ul>
  </li>
  <li><strong>Pilihan Masuk Cepat dengan Akun Google (SSO)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Tekan tombol <strong>"Masuk dengan Akun Google"</strong> / <strong>"Daftar Cepat dengan Akun Google"</strong>.</li>
      <li>Pilih email Google Anda. Sistem akan secara otomatis mendaftarkan dan menghubungkan akun belajar Anda secara instan.</li>
    </ul>
  </li>
  <li><strong>Masuk ke Akun Terdaftar</strong>: Buka tab <em>"Masuk ke Akun"</em>, ketikkan email dan kata sandi Anda, lalu klik <strong>"Masuk ke NetLearn"</strong>.</li>
  <li><strong>Keluar dari Akun (Logout)</strong>: Klik tombol keluar (ikon logout) pada sidebar kiri bawah atau pada kartu sesi di halaman <em>Profil & Pengaturan</em> setelah selesai menggunakan perangkat bersama.</li>
</ol>
`
      },
      {
        title: "3. Tata Cara Mempelajari Modul & Menonton Video Interaktif",
        content: `
<p class="leading-relaxed">Kurikulum NetLearn disusun secara bertahap untuk memandu penguasaan konsep jaringan secara mendalam:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Menu Materi</strong>: Klik menu <strong>"Modul & Materi"</strong> pada bilah navigasi sebelah kiri.</li>
  <li><strong>Daftar 6 Modul Pembelajaran</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li><strong>Modul 1</strong>: Pengantar Jaringan, Klasifikasi Jaringan (LAN, MAN, WAN), dan Analisis Topologi Fisik & Logika.</li>
      <li><strong>Modul 2</strong>: Perangkat Keras Jaringan, Switch Tingkat Lanjut, Router Gateway, dan Mekanisme Protokol ARP.</li>
      <li><strong>Modul 3</strong>: Pengalamatan IP IPv4, Subnetting Berjenjang, dan Arsitektur VLSM (Variable Length Subnet Mask).</li>
      <li><strong>Modul 4</strong>: Dasar-Dasar Routing (Routing Statis, Dynamic Routing RIP, OSPF, EIGRP, BGP).</li>
      <li><strong>Modul 5</strong>: Media Transmisi, Karakteristik Kabel UTP/STP, Fiber Optic, dan Standar Susunan Kabel T568A/B.</li>
      <li><strong>Modul 6</strong>: Model Referensi OSI 7 Layer dan Arsitektur Protokol TCP/IP (Enkapsulasi & Dekapsulasi).</li>
    </ul>
  </li>
  <li><strong>Membaca Materi Interaktif</strong>: Klik tombol <strong>"Baca Materi"</strong> pada salah satu kartu modul untuk membuka lembar modul interaktif lengkap dengan diagram, formula, dan contoh penerapan.</li>
  <li><strong>Menyelesaikan Modul</strong>: Gulir ke bagian paling bawah modul dan klik tombol <strong>"Tandai Selesai Dibaca"</strong>. Sistem akan memberikan <strong>+100 XP</strong> dan memperbarui persentase progres belajar di Dashboard.</li>
  <li><strong>Mengunduh Modul untuk Belajar Offline</strong>: Pada kartu modul atau pembaca modul, klik tombol <strong>"Unduh Modul (.doc)"</strong> untuk mengunduh dokumen pembelajaran resmi dalam format Microsoft Word yang siap dicetak.</li>
  <li><strong>Menonton Video Penjelasan</strong>: Buka tab <strong>"Video Pembelajaran"</strong> untuk memutar video kurasi pengajar yang mengulas visualisasi simulasi jaringan dan penjelasan praktikum.</li>
</ol>
`
      },
      {
        title: "4. Tata Cara Menggunakan Simulator Lab Jaringan & Kalkulator VLSM",
        content: `
<p class="leading-relaxed">Fitur simulasi lab memungkinkan siswa merancang dan menguji skema pengalamatan jaringan tanpa memerlukan perangkat keras fisik berbiaya tinggi.</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Menu Lab</strong>: Klik menu <strong>"Lab Simulasi & VLSM"</strong> pada navigasi sebelah kiri.</li>
  <li><strong>Menggunakan Kalkulator Subnetting VLSM</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Masukkan <em>Major Network IP Address</em> dan prefix awal (contoh: <code>192.168.10.0/24</code>).</li>
      <li>Tentukan kebutuhan jumlah host perangkat untuk masing-masing subnet (misal: <em>Lab Komputer 1 = 50 host</em>, <em>Ruang Guru = 25 host</em>, <em>Tata Usaha = 10 host</em>, <em>Koneksi Antar Router = 2 host</em>).</li>
      <li>Klik tombol <strong>"Hitung Alokasi VLSM"</strong>.</li>
      <li>Sistem akan menyusun tabel perhitungan secara otomatis dari kebutuhan host terbesar ke terkecil, menampilkan: <em>Prefix Mask Baru, Network ID, Subnet Mask Desimal, Range IP Host yang Valid, dan Broadcast ID</em>.</li>
    </ul>
  </li>
  <li><strong>Eksplorasi Topologi Virtual Jaringan</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Amati diagram topologi jaringan yang terhubung ke switch dan gateway router.</li>
      <li>Jalankan uji pengiriman paket (simulasi ping & traceroute) untuk memverifikasi keterhubungan rute host antar segmen subnet.</li>
    </ul>
  </li>
</ol>
`
      },
      {
        title: "5. Tata Cara Evaluasi Kognitif: Pretest, Posttest HOTS, dan Bank Soal",
        content: `
<p class="leading-relaxed">Evaluasi di NetLearn menggunakan instrumen 25 butir soal cerita bertipe HOTS (Higher Order Thinking Skills) yang telah divalidasi oleh ahli materi:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Mengerjakan Pretest Diagnostik (Awal Pembelajaran)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Buka menu <strong>"Pretest Diagnostik"</strong> sebelum mulai membaca modul kurikulum.</li>
      <li>Jawab 25 butir soal studi kasus secara mandiri. Pretest ini bertujuan mengidentifikasi pengetahuan awal dan kelemahan spesifik siswa.</li>
      <li>Setelah selesai, tekan <strong>"Kirim Jawaban"</strong> untuk mengunci skor baseline Anda.</li>
    </ul>
  </li>
  <li><strong>Mengerjakan Posttest HOTS (Akhir Pembelajaran)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Setelah mempelajari seluruh 6 modul materi dan video, buka menu <strong>"Posttest HOTS"</strong>.</li>
      <li>Jawab 25 butir soal evaluasi akhir yang menguji kemampuan analisis pemecahan masalah (troubleshooting) jaringan.</li>
      <li>Setelah dikirim, sistem akan langsung menampilkan perbandingan skor Pretest vs Posttest dan menghitung <strong>Normalized Gain Score (g)</strong>:
        <br/><code class="text-primary font-bold">g = (Posttest - Pretest) / (25 - Pretest)</code>
      </li>
      <li>Kategori Gain: <em>Tinggi (g &ge; 0.70)</em>, <em>Sedang (0.30 &le; g &lt; 0.70)</em>, dan <em>Rendah (g &lt; 0.30)</em>.</li>
    </ul>
  </li>
  <li><strong>Mengunduh Laporan Diagnostik Kognitif</strong>: Pada lembar hasil ujian, klik tombol <strong>"Unduh Laporan Diagnostik (.doc)"</strong> untuk mengunduh bukti fisik rekap capaian belajar dalam format Word.</li>
  <li><strong>Latihan Mandiri dengan Bank Soal Kuis</strong>: Buka menu <strong>"Kuis & Bank Soal"</strong> kapan saja untuk mengasah pemahaman dengan soal-soal latihan per topik modul disertai pembahasan kunci jawaban instan.</li>
</ol>
`
      },
      {
        title: "6. Tata Cara Mengubah Nama Pengguna, Foto Profil & Memantau Prestasi",
        content: `
<p class="leading-relaxed">Setiap pengguna memiliki kendali penuh atas identitas akun dan dapat memantau capaian prestasinya secara real-time:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Membuka Halaman Profil</strong>: Klik menu <strong>"Profil & Pengaturan"</strong> pada sidebar navigasi, atau klik kartu nama Anda di pojok kiri bawah.</li>
  <li><strong>Mengubah Nama Pengguna</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Pada bagian formulir <em>"Edit Identitas Pengguna & Foto Profil"</em>, ketikkan nama lengkap baru Anda pada kolom <strong>Nama Lengkap Siswa</strong>.</li>
      <li>Jika Anda seorang siswa, Anda juga dapat menyesuaikan pilihan <strong>Kelas Siswa (TKJ)</strong> jika terjadi pemindahan kelas.</li>
    </ul>
  </li>
  <li><strong>Mengubah Foto Profil (Avatar)</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Klik tombol <strong>"Pilih Foto Baru"</strong> untuk mengunggah gambar foto dari perangkat komputer atau HP Anda (format JPG/PNG).</li>
      <li>Anda juga dapat memilih avatar preset yang telah disediakan dengan sekali klik.</li>
      <li>Untuk menghapus foto profil dan kembali ke inisial huruf standar, tekan tombol <strong>"Hapus Foto"</strong>.</li>
    </ul>
  </li>
  <li><strong>Menyimpan Perubahan</strong>: Tekan tombol <strong>"Simpan Perubahan"</strong>. Nama dan foto baru Anda akan langsung diperbarui di seluruh bagian aplikasi (sidebar, dashboard, dan riwayat tugas).</li>
  <li><strong>Memantau Lencana Prestasi (Badges)</strong>: Pada bagian <em>Koleksi Lencana Prestasi Akademik</em>, amati 8 lencana penghargaan yang dapat Anda buka (seperti <em>Langkah Pertama, Kolektor Modul, Pembelajar Visual, Pakar Subnetting, Master Model OSI, Juara Posttest, Peningkatan Positif, dan Net Grandmaster</em>).</li>
</ol>
`
      },
      {
        title: "7. Panduan Khusus Guru & Instruktur (Panel Manajemen Guru)",
        content: `
<p class="leading-relaxed">Pengajar memiliki hak akses administratif khusus untuk memantau perkembangan seluruh siswa di kelasnya:</p>
<ol class="list-decimal pl-5 space-y-2 mt-2">
  <li><strong>Masuk sebagai Guru</strong>: Masuk menggunakan akun terdaftar yang memiliki hak akses Guru/Instruktur. Menu khusus <strong>"Panel Guru"</strong> akan muncul secara otomatis di sidebar navigasi.</li>
  <li><strong>Memantau Kohort & Analitik Kelas</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Lihat kartu ringkasan: Rata-rata Skor Pretest, Rata-rata Skor Posttest, Rata-rata Normalisasi Peningkatan (Gain Score), serta Persentase Ketuntasan Belajar Kelas.</li>
      <li>Lihat diagram distribusi kemampuan kognitif siswa (Tuntas vs Belum Tuntas).</li>
    </ul>
  </li>
  <li><strong>Mengekspor Rekap Nilai ke Excel/CSV</strong>:
    <ul class="list-disc pl-5 mt-1 space-y-1 text-on-surface-variant">
      <li>Pada tabel rekapitulasi siswa, klik tombol <strong>"Ekspor Data Siswa (CSV)"</strong>.</li>
      <li>File spreadsheet CSV akan diunduh secara otomatis berisi nama siswa, kelas, email, nilai pretest, nilai posttest, nilai gain ($g$), dan status ketuntasan yang siap diolah untuk daftar nilai rapor.</li>
    </ul>
  </li>
  <li><strong>Mengelola Pustaka Video Pembelajaran</strong>: Guru dapat menambahkan tautan video YouTube edukasi baru ke kurikulum siswa dengan menekan tombol <strong>"Tambah Video Baru"</strong> pada panel video.</li>
</ol>
`
      }
    ]
  },

  en: {
    title: "NetLearn User Guide & Application Handbook",
    subtitle: "Complete Step-by-Step Guide for Computer Networking Vocational Learning Platform",
    sections: [
      {
        title: "1. Overview & Core Features of NetLearn",
        content: `
<p class="leading-relaxed"><strong>NetLearn</strong> is an interactive self-directed educational platform designed for Computer Network Engineering (TKJ) coursework. It integrates industry-standard curriculum modules, interactive virtual laboratories, HOTS scenario-based evaluations, and gamification telemetries.</p>
`
      },
      {
        title: "2. User Registration & Sign In Workflow",
        content: `
<p class="leading-relaxed">New students can create an account by selecting the <em>Register</em> tab, entering full name, selecting their TKJ class from the dropdown menu, and setting an email and password. Alternatively, Quick Sign-In with Google provides seamless instant account provisioning.</p>
`
      },
      {
        title: "3. Learning Curriculum Modules & Watching Video Lectures",
        content: `
<p class="leading-relaxed">Access 6 comprehensive curriculum modules from Network Fundamentals to OSI 7 Layer & TCP/IP. Mark modules as completed to earn XP, and download Word-compatible study documents for offline reference.</p>
`
      },
      {
        title: "4. Network Simulator & VLSM Subnet Calculator",
        content: `
<p class="leading-relaxed">Calculate optimal Variable Length Subnet Masking (VLSM) allocations and explore network topologies with zero hardware costs.</p>
`
      },
      {
        title: "5. Cognitive Assessments: Pretest, Posttest HOTS & Question Bank",
        content: `
<p class="leading-relaxed">Complete baseline 25-question Pretest and final 25-question Posttest to measure cognitive progression using Hake's Normalized Gain Score formula ($g$). Download official diagnostic reports in Word format.</p>
`
      },
      {
        title: "6. Updating User Profile (Name & Photo) and Tracking Badges",
        content: `
<p class="leading-relaxed">Customize your account credentials under <em>Profile & Settings</em>. Upload custom avatar photos or choose presets, update full names, and inspect 8 unlocked achievement credential badges.</p>
`
      },
      {
        title: "7. Teacher & Instructor Administration Guide",
        content: `
<p class="leading-relaxed">Instructors can monitor real-time class performance metrics, inspect Pretest/Posttest distributions, and export cohort gradebooks to CSV spreadsheet format for grading.</p>
`
      }
    ]
  }
};
