// NetQuest - Manual Book (ID) & User Guide (EN) + Installation Guide

export const MANUAL_BOOK = {
  id: {
    title: "Manual Book: Panduan Pengguna NetQuest",
    subtitle: "Web Game Pembelajaran Jaringan Komputer Dwibahasa dengan Database Supabase",
    sections: [
      {
        title: "1. Tujuan & Peran Pengguna",
        content: `
<p>NetQuest dirancang sebagai media pembelajaran interaktif berbasis web untuk materi Jaringan Komputer yang dilengkapi dengan elemen gamifikasi (XP, Level, Lencana Prestasi).</p>
<ul>
  <li><strong>Siswa</strong>: Mengerjakan Pretest, mempelajari 6 modul materi & mengunduh dokumen Word, menonton video kurasi, mengerjakan Posttest, dan memantau riwayat peningkatan skor.</li>
  <li><strong>Guru (Admin)</strong>: Memiliki hak akses khusus (memerlukan kode guru) untuk memantau capaian skor seluruh siswa (Pretest, Posttest, perolehan Gain) serta mengelola pustaka video pembelajaran.</li>
</ul>
`
      },
      {
        title: "2. Petunjuk Alur Penggunaan (Langkah 10-16)",
        content: `
<ol start="10">
  <li><strong>Pendaftaran Akun</strong>: Buka aplikasi, pilih tab <em>Daftar</em>, isi nama lengkap, alamat email, dan kata sandi. Jika mendaftar sebagai Guru, wajib memasukkan <em>Kode Guru</em> resmi (sesuai <code>TEACHER_CODE</code> di file <code>.env</code>).</li>
  <li><strong>Masuk ke Aplikasi</strong>: Masuk dengan email dan kata sandi terdaftar; sistem akan mengarahkan Anda langsung ke <em>Beranda (Dashboard)</em>.</li>
  <li><strong>Mengerjakan Pretest</strong>: Buka menu <em>Pretest</em>, jawab 25 soal cerita HOTS secara seksama, perhatikan umpan balik langsung pada setiap pertanyaan, lalu tekan <em>Lanjut</em> hingga selesai untuk menyimpan skor awal.</li>
  <li><strong>Mempelajari Materi</strong>: Buka menu <em>Materi</em>, baca 6 topik pembelajaran yang tersedia secara runtut, dan tekan tombol <em>Unduh Modul (.doc)</em> untuk menyimpan salinan dokumen yang kompatibel dengan Microsoft Word.</li>
  <li><strong>Menonton Video</strong>: Buka menu <em>Video</em> untuk memperdalam pemahaman dengan menonton materi visual yang telah dikurasi oleh guru.</li>
  <li><strong>Mengerjakan Posttest</strong>: Setelah mempelajari seluruh materi dan video, buka menu <em>Posttest</em>. Jawab 25 soal cerita evaluasi akhir dan amati lonjakan perbandingan skor Anda di Dashboard.</li>
  <li><strong>Panel Guru (Admin)</strong>: Guru dapat membuka menu <em>Panel Guru</em> untuk melihat rekapan nilai siswa, mengekspor data ke Excel/CSV, serta menambahkan tautan video YouTube pembelajaran baru. Tekan <em>Keluar</em> setelah selesai beraktivitas.</li>
</ol>
`
      },
      {
        title: "3. Panduan Pemasangan & Integrasi Supabase (Langkah 17-20)",
        content: `
<ol start="17">
  <li><strong>Buat Proyek Supabase</strong>: Kunjungi <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>, buat proyek baru, lalu buka menu <em>SQL Editor</em>. Jalankan skrip SQL skema tabel (profiles, results, videos, questions, materials) beserta kebijakan Row Level Security (RLS) yang disediakan di Panel Guru.</li>
  <li><strong>Konfigurasi API Key</strong>: Salin <em>Project URL</em> dan <em>anon public key</em> dari dashboard Supabase Settings -> API, lalu masukkan ke dialog Pengaturan Supabase di NetQuest (atau konstanta SB_URL dan SB_KEY pada kode program). Ubah pula <code>TEACHER_CODE</code> sesuai kebutuhan institusi Anda.</li>
  <li><strong>Penyebaran (Deployment)</strong>: Unggah seluruh berkas proyek ke layanan hosting web statis gratis seperti Netlify, Vercel, atau GitHub Pages.</li>
  <li><strong>Catatan Keamanan Produksi</strong>: Kode guru di sisi klien berfungsi sebagai pengaman tingkat antarmuka dasar. Untuk lingkungan produksi resmi, ubah peran akun guru secara langsung melalui tabel <code>profiles</code> di Dashboard Supabase.</li>
</ol>
`
      }
    ]
  },

  en: {
    title: "NetQuest User Guide & Installation Manual",
    subtitle: "Bilingual Computer Networking Educational Web Game with Supabase Backend",
    sections: [
      {
        title: "1. Objectives & User Roles",
        content: `
<p>NetQuest is designed as an interactive web-based learning platform for Computer Networking, augmented with rich gamification elements (XP, Levels, Achievement Badges).</p>
<ul>
  <li><strong>Student</strong>: Take the Pretest, study 6 comprehensive modules & download Word-compatible docs, watch curated video lessons, take the Posttest, and track score gains.</li>
  <li><strong>Teacher (Admin)</strong>: Access privileged administration screens using the teacher passcode to inspect all student scores (Pretest, Posttest, Gain) and manage video lessons.</li>
</ul>
`
      },
      {
        title: "2. Operational Workflow (Steps 10-16)",
        content: `
<ol start="10">
  <li><strong>Registration</strong>: Open the app, select <em>Register</em>, fill in full name, email, and password. If registering as a Teacher, the designated <em>Teacher Passcode</em> is mandatory (configured via <code>TEACHER_CODE</code> in <code>.env</code>).</li>
  <li><strong>Sign In</strong>: Log in with your registered email and password to access the gamified <em>Dashboard</em>.</li>
  <li><strong>Pretest Quest</strong>: Navigate to <em>Pretest</em>, solve 25 scenario-based HOTS questions, observe instant analytical feedback, and click <em>Next</em> through completion to benchmark baseline knowledge.</li>
  <li><strong>Explore Modules</strong>: Open the <em>Materials</em> tab, study the 6 curated topics, and click <em>Download Module (.doc)</em> to obtain Word-compatible offline study materials.</li>
  <li><strong>Watch Video Lessons</strong>: Open the <em>Videos</em> section to watch teacher-curated visual explanations.</li>
  <li><strong>Posttest Evaluation</strong>: After finishing your studies, challenge the 25-question <em>Posttest</em> to evaluate knowledge retention and unlock growth badges on the Dashboard.</li>
  <li><strong>Teacher Admin Panel</strong>: Teachers can navigate to the <em>Teacher Panel</em> to monitor real-time class performance, export CSV scorecards, and add new video resources. Click <em>Log Out</em> upon session conclusion.</li>
</ol>
`
      },
      {
        title: "3. Deployment & Supabase Setup Guide (Steps 17-20)",
        content: `
<ol start="17">
  <li><strong>Supabase Project Creation</strong>: Sign up at <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>, create a project, and navigate to the <em>SQL Editor</em>. Run the database schema script (profiles, results, videos, questions, materials) and RLS security policies provided in the Teacher Panel.</li>
  <li><strong>Credential Configuration</strong>: Copy your <em>Project URL</em> and <em>anon public key</em> from Supabase Settings -> API, and input them via the NetQuest settings modal (or update SB_URL and SB_KEY constants in the code). Customize <code>TEACHER_CODE</code> as desired.</li>
  <li><strong>Static Hosting</strong>: Deploy the web application directly to static hosting platforms such as Netlify, Vercel, or GitHub Pages.</li>
  <li><strong>Production Security Note</strong>: The client-side teacher passcode serves as initial UI access gating. In formal production environments, set teacher privileges directly in the <code>profiles</code> table via the Supabase Dashboard.</li>
</ol>
`
      }
    ]
  }
};
