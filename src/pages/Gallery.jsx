import React, { useState, useEffect } from 'react';
import { INITIAL_GALLERY } from '../data/initialData';
import GlassCard from '../components/GlassCard';
import axios from 'axios';
import { Image, Video, Heart, Calendar, Sparkles, Plus, Trash2, X, Upload, Loader2 } from 'lucide-react';
import { syncAppState, fetchAppState } from '../lib/supabase';

const CATEGORIES = ['Field Trip', 'Kegiatan Proyek', 'Praktikum', 'Festival', 'Kegiatan Sekolah', 'Foto Kelas'];
const GALLERY_STORAGE_KEY = 'eduprogress_gallery';

export default function Gallery() {
  const [gallery, setGallery] = useState(() => {
    try {
      const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_GALLERY;
    } catch (e) {
      return INITIAL_GALLERY;
    }
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], url: '', file: null });
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Cloud hydration from Supabase & API
  useEffect(() => {
    async function loadCloudGallery() {
      const cloud = await fetchAppState('gallery');
      if (cloud && Array.isArray(cloud) && cloud.length > 0) {
        setGallery(cloud);
        try {
          localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(cloud));
        } catch (e) {}
      } else {
        axios.get('/api/gallery')
          .then(res => {
            if (res.data?.success && res.data.data?.length) {
              setGallery(res.data.data);
            }
          })
          .catch(() => {});
      }
    }
    loadCloudGallery();
  }, []);

  const saveGallery = (newGallery) => {
    setGallery(newGallery);
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newGallery));
    } catch (e) {}
    syncAppState('gallery', newGallery);
  };

  const toggleLike = (id) => {
    const updated = gallery.map(g => g.id === id ? { ...g, likes: (g.likes || 0) + 1 } : g);
    saveGallery(updated);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm(f => ({ ...f, file }));
  };

  const handleUpload = async () => {
    setUploading(true);
    const newDoc = {
      id: `gal-${Date.now()}`,
      title: form.title || 'Dokumentasi Sekolah',
      category: form.category || 'Kegiatan Sekolah',
      date: new Date().toISOString().split('T')[0],
      imageUrl: form.url || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60',
      likes: 0
    };

    try {
      const fd = new FormData();
      fd.append('title', form.title || 'Dokumentasi Baru');
      fd.append('category', form.category || 'Kegiatan Proyek');
      if (form.file) {
        fd.append('file', form.file);
      } else if (form.url) {
        fd.append('url', form.url);
      }
      const res = await axios.post('/api/gallery', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data.data) {
        const updated = [res.data.data, ...gallery];
        saveGallery(updated);
      } else {
        saveGallery([newDoc, ...gallery]);
      }
    } catch (err) {
      saveGallery([newDoc, ...gallery]);
    } finally {
      setForm({ title: '', category: CATEGORIES[0], url: '', file: null });
      setShowUploadModal(false);
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/gallery/${id}`);
    } catch (err) {}
    const updated = gallery.filter(g => g.id !== id);
    saveGallery(updated);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 p-6 rounded-4xl text-slate-900 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Image className="w-3.5 h-3.5" /> Dokumentasi & Galeri Sekolah
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Galeri Kegiatan Pembelajaran</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Kumpulan foto & video seru Field Trip, Proyek P5, Praktikum, dan Festival Budaya.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-2xl shadow-lg hover:bg-slate-800 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Unggah Foto / Video
        </button>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gallery.map((item) => (
          <GlassCard key={item.id} className="space-y-3">
            <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group">
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" controls />
              ) : (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              )}
              <span className="absolute top-3 left-3 px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold rounded-full">
                {item.category}
              </span>
              <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 text-[10px] font-bold rounded-xl">
                {item.date}
              </span>

              {/* Delete Button */}
              <button
                onClick={() => setConfirmDelete(item)}
                className="absolute top-3 right-3 p-2 bg-rose-500/90 backdrop-blur-md text-white rounded-full hover:bg-rose-600 transition shadow-md"
                title="Hapus item"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {item.type === 'video' && (
                <span className="absolute bottom-3 left-3 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-extrabold rounded-full flex items-center gap-1">
                  <Video className="w-3 h-3" /> Video
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{item.title}</h3>
              <button
                onClick={() => toggleLike(item.id)}
                className="flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 rounded-full border border-rose-200 dark:border-rose-800 text-xs font-bold hover:scale-105 transition"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> {item.likes || 0}
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-4xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Unggah ke Galeri</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Judul Dokumentasi</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Contoh: Lomba Mewarnai 17 Agustus"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Pilih File (Foto / Video)</label>
                <input
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileChange}
                  className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl"
                />
                {form.file && (
                  <p className="mt-1 text-[10px] text-emerald-600 font-bold truncate">✓ {form.file.name}</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                <span>— atau —</span>
              </div>

              <div>
                <label className="block font-bold mb-1">Atau Tempel Link Gambar/Video</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://... (opsional)"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-bold text-xs rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || (!form.file && !form.url)}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Mengunggah...' : 'Unggah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-4xl p-6 shadow-2xl space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Hapus Item Galeri?</h3>
            <p className="text-xs text-slate-500 font-medium">
              "{confirmDelete.title}" akan dihapus permanen dari galeri. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-bold text-xs rounded-2xl"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="px-4 py-2 bg-rose-500 text-white font-extrabold text-xs rounded-2xl hover:bg-rose-600 transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
}
