import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, BookOpen, ChevronDown, Clock, GraduationCap, Star, School } from 'lucide-react';

// Status badge styles
const statusStyles = {
  'Sangat Paham': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Paham':        'bg-sky-100 text-sky-700 border-sky-200',
  'Sedang Proses':'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Cukup Paham':  'bg-amber-100 text-amber-700 border-amber-200',
  'Belum Paham':  'bg-rose-100 text-rose-700 border-rose-200',
};

const statusIcon = {
  'Sangat Paham': '🌟',
  'Paham':        '✅',
  'Sedang Proses':'⏳',
  'Cukup Paham':  '📝',
  'Belum Paham':  '💪',
};

/**
 * Halaman Laporan TP untuk Orang Tua — TANPA MENU, TANPA NAVBAR
 * Diakses via /ortu/:studentId
 */
export default function ParentReport({ student, selectedChapters = null }) {
  const { tpData: globalTpData } = useAuth();

  const [tpStatusOverrides, setTpStatusOverrides] = useState({});
  const [expandedSubjects, setExpandedSubjects] = useState({});

  // Load saved statuses from localStorage
  useEffect(() => {
    if (!student?.id) return;
    try {
      const raw = localStorage.getItem(`tpStatus_${student.id}`);
      if (raw) setTpStatusOverrides(JSON.parse(raw));
    } catch (e) { /* ignore */ }
  }, [student?.id]);

  if (!student) return null;

  // Build chapters data from globalTpData
  const reportData = (!globalTpData || Object.keys(globalTpData).length === 0)
    ? []
    : Object.entries(globalTpData).map(([key, subjObj]) => {
        const chapters = (subjObj.chapters || []).map(chap => ({
          title: chap.chapter,
          tps: (chap.tps || []).map(tpText => ({
            text: tpText,
            status: tpStatusOverrides[tpText] || 'Paham'
          }))
        }));

        // Apply chapter filter if provided (from teacher's selection)
        const filteredChapters = selectedChapters
          ? chapters.filter(c => selectedChapters.includes(c.title))
          : chapters;

        return {
          subject: subjObj.subject || key,
          teacher: subjObj.teacher || 'Ustadz Iski',
          chapters: filteredChapters
        };
      }).filter(s => s.chapters.length > 0 && s.chapters.some(c => c.tps.length > 0));

  const toggleSubject = (subject) => {
    setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
  };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50">

      {/* TOP HEADER — Sekolah Identity, tanpa navbar aplikasi */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 px-4 py-6 text-white">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
              🎓
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-100">Sistem Monitoring EduProgress</p>
              <h1 className="text-xl font-black">Laporan Tujuan Pembelajaran</h1>
              <p className="text-xs text-emerald-200">Kurikulum Merdeka TA 2026/2027</p>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="bg-white/15 backdrop-blur-md rounded-3xl p-4 flex items-center gap-4 border border-white/20">
            <img
              src={student.avatar}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white/60 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Laporan untuk Ananda</p>
              <h2 className="text-xl font-black truncate">{student.name}</h2>
              <p className="text-xs text-emerald-100">{student.className}</p>
              <p className="text-xs text-emerald-200 mt-0.5">Wali Kelas: <span className="font-bold text-white">{student.homeroomTeacher}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* DATE & Info Banner */}
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black text-amber-800">📅 {today}</p>
            <p className="text-[10px] text-amber-600 font-bold">
              Laporan ini menampilkan Bab-Bab yang sudah dipelajari ananda di sekolah.
            </p>
          </div>
          <div className="w-8 h-8 bg-amber-200 rounded-xl flex items-center justify-center text-base shrink-0">
            📊
          </div>
        </div>
      </div>

      {/* Subjects & Bab List */}
      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-4">

        {reportData.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-black text-slate-800">Belum Ada Data TP</p>
            <p className="text-xs text-slate-500 mt-1">Guru belum menginput Bab & Tujuan Pembelajaran untuk laporan ini.</p>
          </div>
        ) : reportData.map((subj) => {
          const isExpanded = expandedSubjects[subj.subject] !== false; // Default expanded
          const totalTps = subj.chapters.reduce((sum, c) => sum + c.tps.length, 0);
          const pahamCount = subj.chapters.reduce((sum, c) =>
            sum + c.tps.filter(t => t.status === 'Sangat Paham' || t.status === 'Paham').length, 0);

          return (
            <div key={subj.subject} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              
              {/* Subject Header — Clickable Accordion */}
              <button
                onClick={() => toggleSubject(subj.subject)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{subj.subject}</h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {subj.teacher} · {subj.chapters.length} Bab · {pahamCount}/{totalTps} TP Tercapai
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    {totalTps > 0 ? Math.round((pahamCount / totalTps) * 100) : 0}%
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Chapters & TPs */}
              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {subj.chapters.map((chap, chapIdx) => (
                    <div key={chapIdx} className="p-4 space-y-3">
                      
                      {/* Chapter Title — Prominently Displayed */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shrink-0">
                          <BookOpen className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h4 className="font-black text-sm text-slate-800">{chap.title}</h4>
                      </div>

                      {/* TPs List */}
                      <div className="space-y-2 pl-9">
                        {chap.tps.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Belum ada Tujuan Pembelajaran di Bab ini.</p>
                        ) : chap.tps.map((tp, tpIdx) => (
                          <div
                            key={tpIdx}
                            className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-100"
                          >
                            <span className="text-base shrink-0 mt-0.5">{statusIcon[tp.status] || '•'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">{tp.text}</p>
                              <span className={`mt-1 inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-black ${statusStyles[tp.status] || statusStyles['Paham']}`}>
                                {tp.status === 'Sedang Proses' ? (
                                  <><Clock className="w-2.5 h-2.5" /> Sedang Proses</>
                                ) : tp.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Legend */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">📖 Keterangan Status Capaian</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(statusStyles).map(([status, cls]) => (
              <div key={status} className={`flex items-center gap-1.5 px-2 py-1 rounded-xl border text-[10px] font-bold ${cls}`}>
                <span>{statusIcon[status]}</span> {status}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4 space-y-1">
          <p className="font-black">{student.homeroomTeacher || 'Wali Kelas'}</p>
          <p>Wali Kelas {student.className}</p>
          <p className="text-[10px]">Laporan ini dibuat otomatis oleh Sistem EduProgress</p>
        </div>

      </div>
    </div>
  );
}
