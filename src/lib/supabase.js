import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured() {
  return !!supabase;
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error('VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum dikonfigurasi di file .env');
  }
  return supabase;
}

/**
 * Menyimpan data state global ke Supabase (Generic Store & Dedicated Sync).
 */
export async function syncAppState(key, data) {
  if (!supabase) return null;
  try {
    const { error } = await supabase
      .from('app_sync_data')
      .upsert({
        key,
        data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    if (error && error.code !== '42P01') {
      console.warn(`[Supabase Sync] (${key}):`, error.message);
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase Sync] Gagal sinkron ${key}:`, err);
    return false;
  }
}

/**
 * Menyinkronkan daftar siswa ke tabel `students` di Supabase.
 */
export async function syncStudentsTable(students) {
  if (!supabase || !Array.isArray(students)) return;
  try {
    const rows = students.map((s) => ({
      id: s.id,
      name: s.name,
      nisn: s.nisn || '',
      class_name: s.className || '',
      homeroom_teacher: s.homeroomTeacher || '',
      avatar: s.avatar || '',
      parent_name: s.parentName || '',
      parent_phone: s.parentPhone || '',
      parent_email: s.parentEmail || '',
      average_score: s.averageScore || 0,
      attendance_rate: s.attendanceRate || 100,
      overall_progress: s.overallProgress || 0,
      total_achievements: s.totalAchievements || 0,
      updated_at: new Date().toISOString()
    }));
    await supabase.from('students').upsert(rows, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase students table sync]:', e);
  }
}

/**
 * Menyinkronkan nilai siswa ke tabel `student_grades` di Supabase.
 */
export async function syncGradesTable(grades) {
  if (!supabase || !grades || typeof grades !== 'object') return;
  try {
    const rows = [];
    Object.entries(grades).forEach(([studentId, subjectMap]) => {
      if (typeof subjectMap === 'object') {
        Object.entries(subjectMap).forEach(([subjectId, gradeData]) => {
          rows.push({
            student_id: studentId,
            subject_id: subjectId,
            grades_data: gradeData,
            updated_at: new Date().toISOString()
          });
        });
      }
    });
    if (rows.length > 0) {
      await supabase.from('student_grades').upsert(rows, { onConflict: 'student_id,subject_id' });
    }
  } catch (e) {
    console.warn('[Supabase student_grades table sync]:', e);
  }
}

/**
 * Menyinkronkan prestasi siswa ke tabel `achievements` di Supabase.
 */
export async function syncAchievementsTable(achievements) {
  if (!supabase || !Array.isArray(achievements)) return;
  try {
    const rows = achievements.map((a) => ({
      id: a.id || `ach-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      student_id: a.studentId || 'std-1',
      title: a.title,
      category: a.category || 'Umum',
      date: a.date || new Date().toISOString().split('T')[0],
      icon: a.icon || 'award',
      description: a.description || '',
      created_at: new Date().toISOString()
    }));
    await supabase.from('achievements').upsert(rows, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase achievements table sync]:', e);
  }
}

/**
 * Mengambil data state global dari Supabase.
 */
export async function fetchAppState(key) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_sync_data')
      .select('data')
      .eq('key', key)
      .single();
    if (error) return null;
    return data?.data || null;
  } catch (err) {
    console.warn(`[Supabase Fetch] Gagal mengambil ${key}:`, err);
    return null;
  }
}

/**
 * Mengambil semua catatan dari tabel `notes` atau cloud sync.
 */
export async function getNotes() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return data;
  } catch (err) {
    console.warn('[Supabase getNotes]:', err);
  }
  const fallback = await fetchAppState('notes');
  return fallback || [];
}

/**
 * Menambahkan catatan baru ke tabel `notes`.
 */
export async function insertNote(note) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('notes')
    .insert(note)
    .select()
    .single();

  if (error) {
    // Fallback sync to generic store
    const existing = (await fetchAppState('notes')) || [];
    const newNote = { ...note, id: note.id || `note-${Date.now()}`, created_at: new Date().toISOString() };
    const updated = [newNote, ...existing];
    await syncAppState('notes', updated);
    return newNote;
  }
  return data;
}

/**
 * Memperbarui catatan berdasarkan id.
 */
export async function updateNote(id, changes) {
  const client = ensureSupabase();
  const { data, error } = await client
    .from('notes')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Insert jika belum memiliki id, atau update jika id sudah ada.
 */
export async function saveNote(note) {
  return note.id ? updateNote(note.id, note) : insertNote(note);
}

/**
 * Mengganti password pengguna yang sedang memiliki sesi Supabase aktif.
 */
export async function updatePassword(password) {
  const client = ensureSupabase();
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

/**
 * Mengirim email pemulihan password ke alamat pengguna.
 */
export async function sendPasswordResetEmail(email) {
  const client = ensureSupabase();
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/settings`,
  });
  if (error) throw error;
  return data;
}
