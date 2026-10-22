# NetQuest Project Guidelines

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `.agents/plugins/anti-slop/antislop.md` (core) and then the skill for the task:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: download `antislop.md` again, or run `npx antislop-ai --update` if it was installed as skill folders.
<!-- antislop:end -->

## Website Design & Anti-AI-Slop Skills Suite

Proyek ini telah dikonfigurasi dengan ekosistem multi-skill untuk menghasilkan antarmuka web berkualitas tinggi, terarah, dan terbebas dari artefak klise AI generik:

### 1. Peran dan Pembagian Tugas Skill
- **Frontend Design** (`.agents/skills/frontend-design/SKILL.md`): Menentukan arah visual yang berkarakter, palet warna otentik, tipografi intensional, dan identitas desain yang sesuai dengan bidang subjek.
- **Frontend Craft** (`.agents/skills/frontend-craft/SKILL.md`): Membangun implementasi kode frontend yang matang, presisi spasi, ritme komponen, dan eliminasi pola template massal (*density-based slop detection*).
- **UI/UX Designer** (`.agents/skills/ui-ux-designer/SKILL.md`): Meningkatkan hierarki visual, arsitektur informasi, alur navigasi, konsistensi desain berbasis token, dan standar aksesibilitas inklusif (WCAG).
- **Design Slop** (`.agents/skills/design-slop/SKILL.md`): Pengawas dan auditor pola desain generik AI (mencegah *card soup*, gradien dekoratif tanpa makna, badge statistik palsu, dan elemen tanpa fungsi).
- **Anti-Slop** (`.agents/plugins/anti-slop/antislop.md` & `.agents/skills/antislop-*/`): Filter inti pembersih teks/copywriting klise, penguji kontras rasio warna (`contrast-check.py`), tata letak mobile adaptif, serta higienitas komentar kode.

### 2. Pedoman Penggunaan & Workflow
- **Pilih Sesuai Kebutuhan**: Aktifkan kombinasi skill yang relevan dengan tugas spesifik (tidak memaksakan seluruh instrumen jika tugas hanya mencakup komponen spesifik).
- **Tanpa Elemen Klise AI**: Hindari kartu berlebihan (*bento slop* tanpa alasan), gradien ungu-biru template, animasi lambat yang tidak dipicu pengguna, teks copywriting AI generik, dan statistik dekoratif palsu.
- **Konsistensi & Stabilitas**: Pertahankan identitas visual yang kokoh, aksesibilitas penuh (keyboard navigation & kontras), dan integritas fitur/fungsionalitas aplikasi yang sudah berjalan.
- **Validasi Sebelum Finalisasi**: Jalankan pemeriksaan antarmuka (UI/UX) dan fungsionalitas secara menyeluruh sebelum pekerjaan diserahkan.
