import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Vite hanya mengekspos environment variable yang tersedia saat build.
// Mendukung nama VITE_* dan nama NEXT_PUBLIC_* dari Vercel.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
  || import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || import.meta.env.SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function getNotes() {
      if (!supabase) {
        setError('Konfigurasi Supabase belum tersedia.');
        return;
      }

      const { data, error: queryError } = await supabase.from('notes').select();
      if (queryError) {
        setError(queryError.message);
        return;
      }
      setNotes(data || []);
    }
    getNotes();
  }, []);

  if (error) {
    return <div className="p-6 text-rose-600 font-bold">Gagal memuat catatan: {error}</div>;
  }

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}