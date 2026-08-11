import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { INITIAL_CP_DATA } from '../data/initialData';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import confetti from 'canvas-confetti';
import {
  Target,
  Sparkles,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  FileCheck,
  CheckCircle2,
  Upload,
  Plus
} from 'lucide-react';

export default function LearningOutcomes() {
  const { selectedStudent, tpData, scheduleData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const subjectList = Object.entries(tpData || {}).map(([id, item]) => ({
    id,
    name: item?.subject || id,
    teacher: item?.teacher || 'Guru Pengampu',
    avatar: scheduleData?.teacherMapping?.find((teacher) => teacher.name === item?.teacher)?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    progress: 85,
    status: 'Mahir'
  }));

  const initialSubId = searchParams.get('subject') || subjectList[0]?.id || 'mtk';
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubId);
  const [cpList, setCpList] = useState(INITIAL_CP_DATA);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const activeSubject = subjectList.find(s => s.id === selectedSubjectId) || subjectList[0] || { id: 'mtk', name: 'Mapel', teacher: 'Guru', avatar: '', progress: 0, status: 'Mahir' };
  const activeCps = cpList[selectedSubjectId] || INITIAL_CP_DATA['mtk'];

  const handleStatusChange = (cpId, newStatus, newProgress) => {
    setCpList(prev => {
      const updatedList = { ...prev };
      if (!updatedList[selectedSubjectId]) updatedList[selectedSubjectId] = [];
      const itemIndex = updatedList[selectedSubjectId].findIndex(c => c.id === cpId);
      if (itemIndex > -1) {
        updatedList[selectedSubjectId][itemIndex] = {
          ...updatedList[selectedSubjectId][itemIndex],
          status: newStatus,
          progress: newProgress
        };
      }
      return updatedList;
    });

    if (newStatus === 'Sangat Mahir' || newStatus === 'Mahir') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 p-6 rounded-4xl text-slate-900 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Target className="w-3.5 h-3.5" /> Capaian Pembelajaran (CP) Kurikulum Merdeka
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Detail CP per Mata Pelajaran</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Monitoring indikator kompetensi dasar & upload bukti pembelajaran siswa.
          </p>
        </div>

        {/* Subject Dropdown Selector */}
        <select
          value={selectedSubjectId}
          onChange={(e) => setSelectedSubjectId(e.target.value)}
          className="px-4 py-2.5 bg-white text-slate-900 font-extrabold text-xs rounded-2xl border-2 border-slate-900/10 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
        >
          {subjectList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.teacher.split(' ')[0]})
            </option>
          ))}
        </select>
      </div>

      {/* Active Subject Banner */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <img src={activeSubject.avatar} alt={activeSubject.teacher} className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-300" />
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{activeSubject.name}</h2>
            <p className="text-xs text-slate-500 font-medium">Pengampu: <span className="font-bold text-slate-700 dark:text-slate-300">{activeSubject.teacher}</span> | Kemajuan: <span className="font-extrabold text-emerald-600">{activeSubject.progress}%</span></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const phone = selectedStudent.parentPhone || "6281234567891";
              const msg = `Assalamu'alaikum Wr. Wb. Yth. Bapak/Ibu ${selectedStudent.parentName},\n\nBerikut adalah Rekapitulasi Capaian Pembelajaran (CP) mata pelajaran *${activeSubject.name}* untuk ananda *${selectedStudent.name}*:\n\n📊 *PERSENTASE CP: ${activeSubject.progress}% (${activeSubject.status})*\n\nTerima kasih atas bimbingannya! 🌟\n-- Ustadz Iski (Kelas 5 SDQ - Madani Al washiyyah)`;
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-1.5"
          >
            <span>📱 Kirim CP Mapel ini via WA</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-extrabold text-xs rounded-2xl shadow-md hover:brightness-105 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Upload Bukti CP
          </button>
        </div>
      </div>


      {/* List of CP Items */}
      <div className="space-y-6">
        {activeCps.map((cp) => (
          <GlassCard key={cp.id} className="space-y-4">
            
            {/* Title & Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-300">
                  {cp.code}
                </span>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">
                  {cp.title}
                </h3>
              </div>

              {/* Status Selector Switcher Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: "Belum", prog: 15, color: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
                  { label: "Mulai Berkembang", prog: 40, color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
                  { label: "Berkembang", prog: 70, color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
                  { label: "Mahir", prog: 85, color: "bg-sky-100 text-sky-700 hover:bg-sky-200" },
                  { label: "Sangat Mahir", prog: 98, color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" }
                ].map((st) => (
                  <button
                    key={st.label}
                    onClick={() => handleStatusChange(cp.id, st.label, st.prog)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition ${st.color} ${
                      cp.status === st.label ? 'ring-2 ring-slate-800 dark:ring-white scale-105 font-black' : 'opacity-70'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar Component */}
            <ProgressBar progress={cp.progress} status={cp.status} />

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {cp.description}
            </p>

            {/* Teacher Note */}
            {cp.teacherNote && (
              <div className="p-3 bg-amber-50/80 dark:bg-slate-800/80 rounded-2xl border border-amber-200 dark:border-slate-700/60 text-xs">
                <p className="font-extrabold text-amber-800 dark:text-amber-300 mb-0.5">Catatan Masukan Guru:</p>
                <p className="text-slate-700 dark:text-slate-200 italic">"{cp.teacherNote}"</p>
              </div>
            )}

            {/* Evidences Section (Bukti Foto, Video, Dokumen) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs">
              
              {cp.proofPhoto && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4 text-sky-500" /> Bukti Foto:
                  </span>
                  <a href={cp.proofPhoto} target="_blank" rel="noreferrer" className="text-sky-600 font-extrabold hover:underline">
                    Lihat Foto →
                  </a>
                </div>
              )}

              {cp.proofVideo && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <Video className="w-4 h-4 text-rose-500" /> Bukti Video:
                  </span>
                  <a href={cp.proofVideo} target="_blank" rel="noreferrer" className="text-rose-600 font-extrabold hover:underline">
                    Putar Video →
                  </a>
                </div>
              )}

              {cp.proofDoc && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 flex items-center gap-1">
                    <FileCheck className="w-4 h-4 text-emerald-500" /> Dokumen:
                  </span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono">
                    {cp.proofDoc}
                  </span>
                </div>
              )}

              <div className="ml-auto text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Diperbarui: {cp.date}
              </div>
            </div>

          </GlassCard>
        ))}
      </div>

      {/* Modal Upload Bukti Belajar */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-4xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Upload Bukti Capaian Pembelajaran</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Pilih File Bukti (Foto/Video/PDF)</label>
                <input type="file" className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              </div>
              <div>
                <label className="block font-bold mb-1">Catatan Tambahan</label>
                <textarea rows="3" placeholder="Tuliskan keterangan karya atau bukti CP..." className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 font-bold text-xs rounded-2xl">Batal</button>
              <button onClick={() => { setShowUploadModal(false); alert('Bukti CP berhasil diunggah!'); }} className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl">Unggah Berkas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
