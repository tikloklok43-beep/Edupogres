import { useEffect, useState } from 'react';
import { getNotes, saveNote } from '../lib/supabase';

const EMPTY_NOTE = { content: '', category: 'Umum', teacher: 'Ustadz Iski' };

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [note, setNote] = useState(EMPTY_NOTE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotes()
      .then(setNotes)
      .catch((queryError) => setError(queryError.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const savedNote = await saveNote({
        ...note,
        date: new Date().toISOString().slice(0, 10),
      });
      setNotes((current) => [savedNote, ...current.filter((item) => item.id !== savedNote.id)]);
      setNote(EMPTY_NOTE);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Memuat catatan...</div>;
  if (error) return <div className="p-6 text-rose-600 font-bold">Gagal memuat catatan: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <form onSubmit={handleSave} className="space-y-3">
        <input value={note.category} onChange={(event) => setNote({ ...note, category: event.target.value })} placeholder="Kategori" className="border rounded p-2 w-full" />
        <textarea required value={note.content} onChange={(event) => setNote({ ...note, content: event.target.value })} placeholder="Tulis catatan..." className="border rounded p-2 w-full" />
        <button disabled={saving} className="bg-indigo-600 text-white rounded px-4 py-2">{saving ? 'Menyimpan...' : 'Simpan catatan'}</button>
      </form>
      <div className="space-y-3">
        {notes.map((item) => <article key={item.id} className="border rounded p-4"><strong>{item.category}</strong><p>{item.content}</p></article>)}
      </div>
    </div>
  );
}