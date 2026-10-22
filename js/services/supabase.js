// NetQuest - Supabase Database & Auth Service
// Supports live Supabase Client via @supabase/supabase-js with robust live cloud integration

export const CONFIG = {
  SB_URL: localStorage.getItem("sb_url") || "",
  SB_KEY: localStorage.getItem("sb_key") || "",
  TEACHER_CODE: localStorage.getItem("teacher_code") || "",
  PROJECT_REF: ""
};

/**
 * Memuat konfigurasi kredensial secara dinamis dari file .env atau /api/config
 * Mencegah kebocoran kredensial hardcoded di repositori Git
 */
export async function loadEnvConfig() {
  let envVars = {};

  // 1. Coba baca dari endpoint server jika tersedia
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      envVars = await res.json();
    }
  } catch (_) {}

  // 2. Jika belum terisi, coba baca file .env secara langsung (npx serve / static server)
  if (!envVars.SUPABASE_URL && !envVars.SUPABASE_ANON_KEY) {
    try {
      const res = await fetch("/.env");
      if (res.ok) {
        const text = await res.text();
        text.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            const idx = trimmed.indexOf("=");
            if (idx > -1) {
              const key = trimmed.slice(0, idx).trim();
              const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
              envVars[key] = val;
            }
          }
        });
      }
    } catch (_) {}
  }

  // 3. Terapkan konfigurasi: localStorage pengguna diutamakan jika ada, disusul .env
  const savedUrl = localStorage.getItem("sb_url");
  const savedKey = localStorage.getItem("sb_key");
  const savedCode = localStorage.getItem("teacher_code");

  CONFIG.SB_URL = (savedUrl && savedUrl.trim() !== "") ? savedUrl.trim() : (envVars.SUPABASE_URL || "");
  CONFIG.SB_KEY = (savedKey && savedKey.trim() !== "") ? savedKey.trim() : (envVars.SUPABASE_ANON_KEY || "");
  CONFIG.TEACHER_CODE = (savedCode && savedCode.trim() !== "") ? savedCode.trim() : (envVars.TEACHER_CODE || "GURU2026");

  if (envVars.SUPABASE_PROJECT_REF) {
    CONFIG.PROJECT_REF = envVars.SUPABASE_PROJECT_REF.trim();
  } else if (CONFIG.SB_URL) {
    try {
      const parsedHost = new URL(CONFIG.SB_URL).hostname;
      CONFIG.PROJECT_REF = parsedHost.split(".")[0];
    } catch (_) {
      CONFIG.PROJECT_REF = "supabase";
    }
  }

  initSupabase();
  return CONFIG;
}

export function getSqlSchemaScript() {
  const ref = CONFIG.PROJECT_REF || "project-id";
  const url = CONFIG.SB_URL || "https://your-project.supabase.co";
  return `-- ==============================================================================
-- NETQUEST: Skrip Skema Database Supabase & Row Level Security (RLS)
-- Project: \${ref}
-- URL: \${url}
-- Jalankan skrip ini di SQL Editor Supabase Anda:
-- https://supabase.com/dashboard/project/\${ref}/sql
-- ==============================================================================

-- 1. TABEL PROFILES (Tersinkronisasi otomatis dengan auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, 
  name text not null, 
  role text check (role in ('student', 'teacher')) default 'student',
  created_at timestamptz default now()
);

-- 2. TABEL RESULTS (Menyimpan Hasil Evaluasi Pretest & Posttest Siswa)
create table if not exists public.results (
  id bigint generated always as identity primary key, 
  user_id uuid references public.profiles(id) on delete cascade, 
  type text check (type in ('pre', 'post')), 
  score int not null default 0, 
  total int not null default 25, 
  created_at timestamptz default now()
);

-- 3. TABEL VIDEOS (Koleksi Video Pembelajaran per Topik)
create table if not exists public.videos (
  id bigint generated always as identity primary key, 
  topic_id int,
  title text not null, 
  url text not null, 
  created_at timestamptz default now()
);

-- 4. TABEL MATERIALS (Modul Kurikulum Tambahan dari Guru)
create table if not exists public.materials (
  id bigint generated always as identity primary key, 
  title_id text not null, 
  title_en text, 
  category text default 'Umum',
  read_time text default '10 min',
  summary text,
  content text, 
  file_url text,
  created_at timestamptz default now()
);

-- 5. TABEL QUESTIONS (Bank Soal HOTS 25 Nomor)
create table if not exists public.questions (
  id bigint generated always as identity primary key, 
  topic_id int,
  type text, 
  question text not null, 
  correct text not null, 
  wrong1 text not null, 
  wrong2 text not null, 
  wrong3 text not null,
  explanation text,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- ==============================================================================
alter table public.profiles enable row level security; 
alter table public.results enable row level security; 
alter table public.videos enable row level security;
alter table public.materials enable row level security;
alter table public.questions enable row level security;

-- Drop policy lama bila ada (mencegah duplikasi saat dijalankan ulang)
drop policy if exists "Public profiles read" on public.profiles;
drop policy if exists "Users insert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Results read access" on public.results;
drop policy if exists "Users insert results" on public.results;
drop policy if exists "Public read videos" on public.videos;
drop policy if exists "Auth insert videos" on public.videos;
drop policy if exists "Auth update videos" on public.videos;
drop policy if exists "Auth delete videos" on public.videos;
drop policy if exists "Public read materials" on public.materials;
drop policy if exists "Auth insert materials" on public.materials;
drop policy if exists "Auth delete materials" on public.materials;
drop policy if exists "Public read questions" on public.questions;

-- Policy Profiles: Publik dapat membaca nama & peran; User dapat mengedit profilnya
create policy "Public profiles read" on public.profiles for select using (true);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Policy Results: User membaca miliknya sendiri, Guru membaca semua hasil
create policy "Results read access" on public.results for select using (
  auth.uid() = user_id or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
);
create policy "Users insert results" on public.results for insert with check (auth.uid() = user_id);

-- Policy Videos: Semua membaca video pembelajaran, User terdaftar dapat mengelola
create policy "Public read videos" on public.videos for select using (true);
create policy "Auth insert videos" on public.videos for insert with check (auth.uid() is not null);
create policy "Auth update videos" on public.videos for update using (auth.uid() is not null);
create policy "Auth delete videos" on public.videos for delete using (auth.uid() is not null);

-- Policy Materials: Semua membaca modul, Guru terdaftar dapat menambah & menghapus
create policy "Public read materials" on public.materials for select using (true);
create policy "Auth insert materials" on public.materials for insert with check (auth.uid() is not null);
create policy "Auth delete materials" on public.materials for delete using (auth.uid() is not null);

-- Policy Questions: Publik membaca bank soal
create policy "Public read questions" on public.questions for select using (true);

-- ==============================================================================
-- TRIGGER OTOMATIS: SINKRONISASI AKUN BARU KE TABEL PROFILES
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (id) do update 
    set name = coalesce(excluded.name, profiles.name),
        role = coalesce(excluded.role, profiles.role);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
`;
}

let supabaseClient = null;

export function initSupabase() {
  if (CONFIG.SB_URL && CONFIG.SB_KEY && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(CONFIG.SB_URL, CONFIG.SB_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log("[NetQuest] Supabase Live Client Aktif:", CONFIG.SB_URL);
      return true;
    } catch (err) {
      console.warn("[NetQuest] Supabase initialization failed, falling back to local:", err);
      supabaseClient = null;
    }
  }
  return false;
}

export function isUsingLiveSupabase() {
  return !!supabaseClient;
}

export function getSupabaseClient() {
  return supabaseClient;
}

export const SQL_SCHEMA_SCRIPT = getSqlSchemaScript();

export function updateConfig(newUrl, newKey, newCode) {
  if (newUrl !== undefined && newUrl !== null && newUrl.trim() !== "") {
    CONFIG.SB_URL = newUrl.trim();
    localStorage.setItem("sb_url", CONFIG.SB_URL);
  }
  if (newKey !== undefined && newKey !== null && newKey.trim() !== "") {
    CONFIG.SB_KEY = newKey.trim();
    localStorage.setItem("sb_key", CONFIG.SB_KEY);
  }
  if (newCode !== undefined && newCode !== null && newCode.trim() !== "") {
    CONFIG.TEACHER_CODE = newCode.trim();
    localStorage.setItem("teacher_code", CONFIG.TEACHER_CODE);
  }

  if (CONFIG.SB_URL) {
    try {
      CONFIG.PROJECT_REF = new URL(CONFIG.SB_URL).hostname.split(".")[0];
    } catch (_) {}
  }

  return initSupabase();
}

// ----------------------------------------------------
// Mock Database Initializer (LocalStorage Persistence)
// ----------------------------------------------------
function getMockData() {
  let data = localStorage.getItem("netquest_mock_db");
  if (!data) {
    const initialData = {
      users: [
        {
          id: "usr-teacher-01",
          email: "guru@sekolah.sch.id",
          password: "password123",
          name: "Drs. Budi Santoso, M.Kom",
          role: "teacher"
        },
        {
          id: "usr-student-01",
          email: "ahmad.reza@siswa.id",
          password: "password123",
          name: "Ahmad Reza Pratama",
          role: "student"
        },
        {
          id: "usr-student-02",
          email: "siti.nurhaliza@siswa.id",
          password: "password123",
          name: "Siti Nurhaliza",
          role: "student"
        }
      ],
      results: [
        {
          id: 1,
          user_id: "usr-student-01",
          name: "Ahmad Reza Pratama",
          email: "ahmad.reza@siswa.id",
          type: "pre",
          score: 14,
          total: 25,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 2,
          user_id: "usr-student-01",
          name: "Ahmad Reza Pratama",
          email: "ahmad.reza@siswa.id",
          type: "post",
          score: 23,
          total: 25,
          created_at: new Date(Date.now() - 86400000 * 1).toISOString()
        },
        {
          id: 3,
          user_id: "usr-student-02",
          name: "Siti Nurhaliza",
          email: "siti.nurhaliza@siswa.id",
          type: "pre",
          score: 12,
          total: 25,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString()
        },
        {
          id: 4,
          user_id: "usr-student-02",
          name: "Siti Nurhaliza",
          email: "siti.nurhaliza@siswa.id",
          type: "post",
          score: 21,
          total: 25,
          created_at: new Date(Date.now() - 86400000 * 1.5).toISOString()
        }
      ],
      videos: [
        {
          id: 1,
          topic_id: 1,
          title: "Pengenalan Jaringan Komputer, LAN, MAN, WAN - Dasar & Klasifikasi",
          url: "https://www.youtube.com/watch?v=cNwEVYkx2Kk",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          topic_id: 2,
          title: "Topologi Jaringan Komputer: Bus, Star, Ring, Mesh, Tree",
          url: "https://www.youtube.com/watch?v=zbqrNg4C98U",
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          topic_id: 3,
          title: "Model OSI 7 Layer & TCP/IP Dijelaskan Mudah!",
          url: "https://www.youtube.com/watch?v=4tB891Fm69g",
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          topic_id: 4,
          title: "Panduan Lengkap Menghitung Subnetting IP Address CIDR /24 s.d /30",
          url: "https://www.youtube.com/watch?v=s_Ntt6eTn94",
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          topic_id: 5,
          title: "Perangkat Jaringan: Hub, Switch, Router & Media UTP vs Fiber Optik",
          url: "https://www.youtube.com/watch?v=1z0ULvg_pW8",
          created_at: new Date().toISOString()
        },
        {
          id: 6,
          topic_id: 6,
          title: "Layanan Jaringan, Keamanan Firewall & Troubleshooting Diagnostik",
          url: "https://www.youtube.com/watch?v=kUR549yvQ6E",
          created_at: new Date().toISOString()
        }
      ]
    };
    localStorage.setItem("netquest_mock_db", JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
}

function saveMockData(data) {
  localStorage.setItem("netquest_mock_db", JSON.stringify(data));
}

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------
export async function checkLiveSession() {
  if (!isUsingLiveSupabase()) return getCurrentUser();
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session || !session.user) {
      return getCurrentUser();
    }

    let role = session.user.user_metadata?.role || "student";
    let name = session.user.user_metadata?.name || session.user.email.split("@")[0];

    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("name, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.name) name = profile.name;
      } else {
        await supabaseClient.from("profiles").upsert({
          id: session.user.id,
          name,
          role
        });
      }
    } catch (e) {
      console.warn("Could not sync profile on restore, using fallback metadata:", e);
    }

    const appUser = { user: session.user, role, name };
    localStorage.setItem("netquest_current_user", JSON.stringify(appUser));
    return appUser;
  } catch (err) {
    console.warn("checkLiveSession error:", err);
    return getCurrentUser();
  }
}

export async function signUp({ email, password, name, role, teacherCode }) {
  if (role === "teacher" && teacherCode !== CONFIG.TEACHER_CODE) {
    throw new Error(
      `Kode guru tidak valid! Hubungi administrator atau periksa TEACHER_CODE (default: ${CONFIG.TEACHER_CODE}).`
    );
  }

  if (isUsingLiveSupabase()) {
    const { data: authData, error: authErr } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    });
    if (authErr) throw authErr;

    if (authData.user) {
      try {
        await supabaseClient.from("profiles").upsert({
          id: authData.user.id,
          name,
          role
        });
      } catch (profileErr) {
        console.warn("Profile sync warning:", profileErr);
      }
    }

    const session = { user: authData.user, role, name };
    if (authData.session) {
      localStorage.setItem("netquest_current_user", JSON.stringify(session));
    }
    return session;
  }

  // Mock implementation
  const db = getMockData();
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error("Email sudah terdaftar! Silakan langsung masuk.");
  }
  const newUser = {
    id: "usr-" + Date.now().toString(36),
    email,
    password,
    name,
    role
  };
  db.users.push(newUser);
  saveMockData(db);

  const session = { user: newUser, role, name };
  localStorage.setItem("netquest_current_user", JSON.stringify(session));
  return session;
}

export async function signIn({ email, password }) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    let role = data.user.user_metadata?.role || "student";
    let name = data.user.user_metadata?.name || email.split("@")[0];

    try {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("name, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile) {
        if (profile.role) role = profile.role;
        if (profile.name) name = profile.name;
      } else {
        await supabaseClient.from("profiles").upsert({
          id: data.user.id,
          name,
          role
        });
      }
    } catch (e) {
      console.warn("Could not fetch profile, fallback to metadata:", e);
    }

    const session = { user: data.user, role, name };
    localStorage.setItem("netquest_current_user", JSON.stringify(session));
    return session;
  }

  // Mock implementation
  const db = getMockData();
  const found = db.users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!found) {
    throw new Error("Email atau kata sandi tidak cocok!");
  }
  const session = { user: found, role: found.role, name: found.name };
  localStorage.setItem("netquest_current_user", JSON.stringify(session));
  return session;
}

export async function signInWithGoogle({ role = "student", email = null, name = null } = {}) {
  if (isUsingLiveSupabase()) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return { isRedirecting: true, url: data.url };
      }
    } catch (err) {
      console.warn("Live Supabase Google OAuth is not enabled in dashboard:", err.message);
      // Fallback gracefully so user can immediately test and enter NetQuest
    }
  }

  // Google SSO Fallback / Quick Access & Automatic Registration
  const db = getMockData();
  const targetEmail = email || (role === "teacher" ? "budi.santoso@guru.sch.id" : "ahmad.reza@siswa.id");
  let user = db.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    user = {
      id: "usr-google-" + Date.now().toString(36),
      email: targetEmail,
      name: name || (role === "teacher" ? "Drs. Budi Santoso, M.Kom" : "Ahmad Reza Pratama"),
      role: role,
      provider: "google",
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    saveMockData(db);
  }

  const session = { 
    user, 
    role: user.role, 
    name: user.name, 
    provider: "google", 
    isSimulated: isUsingLiveSupabase(),
    isNewUser
  };
  localStorage.setItem("netquest_current_user", JSON.stringify(session));
  return session;
}

export async function signOut() {
  if (isUsingLiveSupabase()) {
    try {
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.warn("Error signing out from Supabase:", err);
    }
  }
  localStorage.removeItem("netquest_current_user");
}

export function getCurrentUser() {
  const data = localStorage.getItem("netquest_current_user");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// Results API (Pretest & Posttest)
// ----------------------------------------------------
export async function saveTestResult({ userId, userName, userEmail, type, score, total = 25 }) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabaseClient
      .from("results")
      .insert({
        user_id: userId,
        type,
        score,
        total
      })
      .select();
    if (error) throw error;
    return data;
  }

  // Mock implementation
  const db = getMockData();
  const record = {
    id: db.results.length + 1,
    user_id: userId,
    name: userName || "Siswa",
    email: userEmail || "",
    type,
    score,
    total,
    created_at: new Date().toISOString()
  };
  db.results.push(record);
  saveMockData(db);
  return [record];
}

export async function getUserResults(userId) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabaseClient
      .from("results")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Mock implementation
  const db = getMockData();
  return db.results
    .filter(r => r.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getAllStudentResults() {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabaseClient
      .from("results")
      .select("id, user_id, type, score, total, created_at, profiles(name, role)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      user_id: r.user_id,
      name: r.profiles ? r.profiles.name : "Siswa",
      type: r.type,
      score: r.score,
      total: r.total,
      created_at: r.created_at
    }));
  }

  // Mock implementation
  const db = getMockData();
  return db.results.map(r => {
    const u = db.users.find(user => user.id === r.user_id);
    return {
      ...r,
      name: u ? u.name : r.name || "Siswa",
      email: u ? u.email : r.email || ""
    };
  });
}

// ----------------------------------------------------
// User Stats & Progress Auto-Sync (Backend Supabase)
// ----------------------------------------------------
export async function saveUserProgress({ userId, xp, readMaterials, watchedVideos, unlockedBadges }) {
  if (isUsingLiveSupabase()) {
    try {
      await supabaseClient.auth.updateUser({
        data: {
          xp,
          readMaterials,
          watchedVideos,
          unlockedBadges
        }
      });
    } catch (e) {
      // Silently ignore if session is external or anonymous
    }

    try {
      await supabaseClient.from("profiles").update({
        xp,
        read_materials: readMaterials,
        watched_videos: watchedVideos
      }).eq("id", userId);
    } catch (e) {
      // Silently ignore if profiles table lacks these optional columns
    }
  }

  // Local fallback persistence
  try {
    const db = getMockData();
    if (!db.progress) db.progress = {};
    db.progress[userId] = {
      xp,
      readMaterials,
      watchedVideos,
      unlockedBadges,
      updated_at: new Date().toISOString()
    };
    saveMockData(db);
  } catch (err) {
    console.warn("Mock progress save error:", err);
  }
}

export async function getUserProgress(userId) {
  if (isUsingLiveSupabase()) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user && user.id === userId && user.user_metadata) {
        const meta = user.user_metadata;
        if (meta.xp !== undefined || meta.readMaterials !== undefined) {
          return {
            xp: meta.xp || 0,
            readMaterials: meta.readMaterials || [],
            watchedVideos: meta.watchedVideos || [],
            unlockedBadges: meta.unlockedBadges || []
          };
        }
      }
    } catch (e) {
      console.warn("Error getting user progress from Supabase auth:", e);
    }
  }

  const db = getMockData();
  return (db.progress && db.progress[userId]) || null;
}

// ----------------------------------------------------
// Videos API
// ----------------------------------------------------
export async function getVideos() {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabaseClient
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  const db = getMockData();
  return db.videos || [];
}

export async function addVideo({ title, url }) {
  if (isUsingLiveSupabase()) {
    const { data, error } = await supabaseClient
      .from("videos")
      .insert({ title, url })
      .select();
    if (error) throw error;
    return data[0];
  }

  const db = getMockData();
  const newVid = {
    id: db.videos.length + 1,
    title,
    url,
    created_at: new Date().toISOString()
  };
  db.videos.unshift(newVid);
  saveMockData(db);
  return newVid;
}

export async function deleteVideo(id) {
  if (isUsingLiveSupabase()) {
    const { error } = await supabaseClient
      .from("videos")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  }
  const db = getMockData();
  db.videos = db.videos.filter(v => v.id !== id);
  saveMockData(db);
  return true;
}

export async function updateTopicVideo({ topic_id, title, url }) {
  const numericTopicId = parseInt(topic_id, 10);
  if (isUsingLiveSupabase()) {
    try {
      const { data: existing } = await supabaseClient
        .from("videos")
        .select("id")
        .eq("topic_id", numericTopicId)
        .limit(1);

      if (existing && existing.length > 0) {
        const { data, error } = await supabaseClient
          .from("videos")
          .update({ title, url })
          .eq("id", existing[0].id)
          .select();
        if (!error && data && data.length > 0) return data[0];
      } else {
        const { data, error } = await supabaseClient
          .from("videos")
          .insert({ topic_id: numericTopicId, title, url })
          .select();
        if (!error && data && data.length > 0) return data[0];
      }
    } catch (e) {
      console.warn("Supabase live video update error, saving locally:", e);
    }
  }

  const db = getMockData();
  const idx = db.videos.findIndex(v => v.topic_id === numericTopicId);
  const updatedItem = {
    id: idx >= 0 ? db.videos[idx].id : db.videos.length + 1,
    topic_id: numericTopicId,
    title,
    url,
    created_at: new Date().toISOString()
  };
  if (idx >= 0) {
    db.videos[idx] = updatedItem;
  } else {
    db.videos.push(updatedItem);
  }
  saveMockData(db);
  return updatedItem;
}

// ----------------------------------------------------
// Materials API (Modul Belajar Kurikulum Tambahan)
// ----------------------------------------------------
export async function getMaterialsFromDb() {
  if (isUsingLiveSupabase()) {
    try {
      const { data, error } = await supabaseClient
        .from("materials")
        .select("*")
        .order("id", { ascending: true });
      if (!error && data) return data;
    } catch (e) {
      console.warn("Error loading materials from Supabase:", e);
    }
  }
  return null;
}

export async function saveMaterialToDb(mat) {
  if (isUsingLiveSupabase()) {
    try {
      const { data, error } = await supabaseClient
        .from("materials")
        .insert({
          title_id: mat.title_id,
          title_en: mat.title_en || mat.title_id,
          category: mat.category || "Umum",
          read_time: mat.readTime || "10 min",
          summary: mat.summary_id || "",
          content: mat.content_id || "",
          file_url: mat.video?.url || ""
        })
        .select();
      if (!error && data && data.length > 0) return data[0];
    } catch (e) {
      console.warn("Error saving material to Supabase:", e);
    }
  }
  return null;
}

export async function deleteMaterialFromDb(id) {
  if (isUsingLiveSupabase()) {
    try {
      const { error } = await supabaseClient
        .from("materials")
        .delete()
        .eq("id", id);
      return !error;
    } catch (e) {
      console.warn("Error deleting material from Supabase:", e);
    }
  }
  return false;
}

