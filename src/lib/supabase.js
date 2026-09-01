import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL belum dikonfigurasi.');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY atau VITE_SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Mengambil semua catatan dari tabel `notes`.
 */
export async function getNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Menambahkan catatan baru ke tabel `notes`.
 * Jangan kirim service-role key dari browser; RLS Supabase tetap berlaku.
 */
export async function insertNote(note) {
  const { data, error } = await supabase
    .from('notes')
    .insert(note)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Memperbarui catatan berdasarkan id.
 */
export async function updateNote(id, changes) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

/**
 * Mengirim email pemulihan password ke alamat pengguna.
 */
export async function sendPasswordResetEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/settings`,
  });
  if (error) throw error;
  return data;
}
