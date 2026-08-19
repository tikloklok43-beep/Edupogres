import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useParams } from 'react-router-dom';
import { FileSpreadsheet, Printer, Download, FileText, CheckCircle2, Share2, ChevronDown, Clock, Filter, CheckSquare, Square, BookOpen, Link as LinkIcon, TrendingUp, Award, Target, Edit3, Save, X, Sparkles } from 'lucide-react';
import { saveSentReport } from '../utils/reportArchive';

// API base URL
const API_BASE = (typeof window !== 'undefined' && window.location.origin.startsWith('http') && window.location.port !== '5173')
  ? window.location.origin
  : (typeof import.meta !== 'undefined' && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

const statusStyles = {
  'Sangat Paham': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Paham':        'bg-sky-100 text-sky-700 border-sky-200',
  'Sedang Proses':'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Cukup Paham':  'bg-amber-100 text-amber-700 border-amber-200',
  'Belum Paham':  'bg-rose-100 text-rose-700 border-rose-200',
};

const STATUS_OPTIONS = ['Sangat Paham', 'Paham', 'Sedang Proses', 'Cukup Paham', 'Belum Paham'];

// Deterministic default Pre-Test & Post-Test scores based on student ID & chapter title
export const getDefaultPrePostScores = (studentId, chapterTitle) => {
  let hash = 0;
  const str = `${studentId || 'std'}_${chapterTitle}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const preTest = 58 + (absHash % 22); // 58 - 79
  const postTest = Math.min(100, preTest + 14 + (absHash % 18)); // preTest + 14..31
  return { preTest, postTest };
};

// Points system per TP status
export const getTpPoints = (status) => {
  switch (status) {
    case 'Sangat Paham': return 25;
    case 'Paham': return 20;
    case 'Cukup Paham': return 15;
    case 'Sedang Proses': return 0;
    case 'Belum Paham': return 5;
    default: return 0;
  }
};

const renderStatusLabel = (status) => status === 'Sedang Proses' ? (
  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Sedang Proses</span>
) : status;

const shouldShowTeacherNote = (status) => status === 'Paham' || status === 'Cukup Paham' || status === 'Belum Paham';

// Build report data per subject, per chapter, per TP
const buildDynamicReportData = (globalTpData) => {
  if (!globalTpData || Object.keys(globalTpData).length === 0) return [];

  return Object.entries(globalTpData).map(([key, subjObj]) => {
    const chapters = (subjObj.chapters || []).map(chap => ({
      title: chap.chapter,
      tps: (chap.tps || []).map(tpText => ({
        text: tpText,
        status: 'Paham'
      }))
    }));

    return {
      subject: subjObj.subject || key,
      teacher: subjObj.teacher || 'Ustadz Iski',
      chapters
    };
  });
};

export default function Reports({ parentAccess = false }) {
  const { selectedStudent, students, tpData: globalTpData } = useAuth();
  const [searchParams] = useSearchParams();
  const params = useParams();

  const routeStudentId = params.studentId || searchParams.get('student');
  const studentId = routeStudentId || selectedStudent?.id;
  const targetStudent = students.find((item) => item.id === studentId) || selectedStudent;
  const isParentView = parentAccess || searchParams.get('mode') === 'parent';

  // Per-student TP status and notes overrides
  const [tpStatusByStudent, setTpStatusByStudent] = useState({});
  const [tpNotesByStudent, setTpNotesByStudent] = useState({});
  const [prePostByStudent, setPrePostByStudent] = useState({});
  const [editingPrePost, setEditingPrePost] = useState(null); // { chapTitle, preTest, postTest }
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const studentKey = targetStudent?.id;

  // All chapters list for filter
  const baseReportData = buildDynamicReportData(globalTpData);
  const allChapters = baseReportData.flatMap(s => s.chapters.map(c => ({ subject: s.subject, chapter: c.title })));

  const [selectedChapters, setSelectedChapters] = useState(() =>
    allChapters.map(c => c.chapter)
  );

  // Re-sync selectedChapters when globalTpData changes
  useEffect(() => {
    const fresh = buildDynamicReportData(globalTpData).flatMap(s => s.chapters.map(c => c.title));
    setSelectedChapters(prev => {
      // Keep existing selections, add new chapters as checked
      const existing = new Set(prev);
      fresh.forEach(c => existing.add(c));
      return [...existing];
    });
  }, [globalTpData]);

  const buildTpData = (overrides, notes) => {
    const overrideMap = overrides || {};
    const noteMap = notes || {};
    return buildDynamicReportData(globalTpData).map(subj => ({
      ...subj,
      chapters: subj.chapters.map(chap => ({
        ...chap,
        tps: chap.tps.map(tp => ({
          ...tp,
          status: overrideMap[tp.text] || tp.status,
          note: noteMap[tp.text] || ''
        }))
      }))
    }));
  };

  useEffect(() => {
    if (!studentKey) return;
    try {
      const rawPrePost = localStorage.getItem(`tpPrePost_${studentKey}`);
      if (rawPrePost) {
        setPrePostByStudent(prev => ({ ...prev, [studentKey]: JSON.parse(rawPrePost) }));
      }
    } catch (e) { /* ignore */ }

    let cancelled = false;
    let localOverrides = {};
    let localNotes = {};
    try {
      const statusRaw = localStorage.getItem(`tpStatus_${studentKey}`);
      localOverrides = statusRaw ? JSON.parse(statusRaw) : {};
      const notesRaw = localStorage.getItem(`tpNotes_${studentKey}`);
      localNotes = notesRaw ? JSON.parse(notesRaw) : {};
    } catch (e) { /* ignore */ }

    fetch(`${API_BASE}/api/tp-report-status/${studentKey}`)
      .then(res => res.json())
      .then(json => {
        if (cancelled) return;
        const serverOverrides = (json && json.data) || {};
        const merged = { ...localOverrides, ...serverOverrides };
        setTpStatusByStudent(prev => ({
          ...prev,
          [studentKey]: { data: buildTpData(merged, localNotes), overrides: merged }
        }));
        setTpNotesByStudent(prev => ({ ...prev, [studentKey]: localNotes }));
      })
      .catch(() => {
        if (!cancelled) {
          setTpStatusByStudent(prev => ({
            ...prev,
            [studentKey]: { data: buildTpData(localOverrides, localNotes), overrides: localOverrides }
          }));
          setTpNotesByStudent(prev => ({ ...prev, [studentKey]: localNotes }));
        }
      });

    return () => { cancelled = true; };
  }, [studentKey, globalTpData]);

  const getPrePostScores = (chapTitle) => {
    const studentScores = prePostByStudent[studentKey] || {};
    if (studentScores[chapTitle]) {
      return studentScores[chapTitle];
    }
    return getDefaultPrePostScores(studentKey, chapTitle);
  };

  const handleSavePrePost = (chapTitle, preVal, postVal) => {
    if (!studentKey) return;
    const current = prePostByStudent[studentKey] || {};
    const updated = {
      ...current,
      [chapTitle]: { preTest: Math.min(100, Math.max(0, Number(preVal) || 0)), postTest: Math.min(100, Math.max(0, Number(postVal) || 0)) }
    };
    setPrePostByStudent(prev => ({ ...prev, [studentKey]: updated }));
    try {
      localStorage.setItem(`tpPrePost_${studentKey}`, JSON.stringify(updated));
    } catch (e) { }
    setEditingPrePost(null);
  };

  const rawTpData = (tpStatusByStudent[studentKey] || {}).data || buildDynamicReportData(globalTpData);
  const rawNotes = (tpNotesByStudent[studentKey] || {});

  // Filter only selected chapters
  const tpData = rawTpData.map(subj => ({
    ...subj,
    chapters: (subj.chapters || []).filter(chap => selectedChapters.includes(chap.title))
  })).filter(subj => subj.chapters.length > 0);

  const handleToggleChapter = (chapTitle) => {
    setSelectedChapters(prev =>
      prev.includes(chapTitle)
        ? prev.filter(c => c !== chapTitle)
        : [...prev, chapTitle]
    );
  };

  const handleStatusChange = (tpText, newStatus) => {
    if (!targetStudent) return;
    const key = targetStudent.id;
    const currentOverrides = (tpStatusByStudent[key] || {}).overrides || {};
    const currentNotes = (tpNotesByStudent[key] || {});
    const newOverrides = { ...currentOverrides, [tpText]: newStatus };

    setTpStatusByStudent(prev => ({
      ...prev,
      [key]: { data: buildTpData(newOverrides, currentNotes), overrides: newOverrides }
    }));
    setOpenDropdown(null);

    try { localStorage.setItem(`tpStatus_${key}`, JSON.stringify(newOverrides)); } catch (e) { }
    fetch(`${API_BASE}/api/tp-report-status/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tpText, status: newStatus })
    }).catch(() => { });
  };

  const handleNoteChange = (tpText, noteValue) => {
    if (!targetStudent) return;
    const key = targetStudent.id;
    const currentOverrides = (tpStatusByStudent[key] || {}).overrides || {};
    const currentNotes = (tpNotesByStudent[key] || {});
    const newNotes = { ...currentNotes, [tpText]: noteValue };

    setTpNotesByStudent(prev => ({
      ...prev,
      [key]: newNotes
    }));
    setTpStatusByStudent(prev => ({
      ...prev,
      [key]: { data: buildTpData(currentOverrides, newNotes), overrides: currentOverrides }
    }));

    try { localStorage.setItem(`tpNotes_${key}`, JSON.stringify(newNotes)); } catch (e) { }
  };

  // Include selected chapters in public link (omitted when all chapters selected for clean short URL)
  const parentLink = (() => {
    const url = new URL(`/ortu/${targetStudent?.id}`, window.location.origin);
    const isAllSelected = allChapters.length > 0 && selectedChapters.length === allChapters.length;
    
    if (!isAllSelected) {
      const allTitles = allChapters.map(c => c.chapter);
      const selectedIndices = selectedChapters
        .map(title => allTitles.indexOf(title))
        .filter(idx => idx !== -1);

      if (selectedIndices.length > 0 && selectedIndices.length < allTitles.length) {
        url.searchParams.set('b', selectedIndices.join(','));
      } else {
        url.searchParams.set('bab', JSON.stringify(selectedChapters));
      }
    }
    return url.toString();
  })();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(parentLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const handleShareToParent = () => {
    if (!targetStudent) return;

    // Build summary from selected chapters only
    const summaryLines = tpData.map(s => {
      const chapLines = s.chapters.map(chap => {
        const tpLines = chap.tps.map(t => `    - ${t.text} (${t.status})`).join('\n');
        return `  📖 *${chap.title}*\n${tpLines}`;
      }).join('\n');
      return `📌 *${s.subject}* (${s.teacher}):\n${chapLines}`;
    }).join('\n\n');

    const phone = targetStudent.parentPhone || '6281234567891';
    const message = `Assalamu'alaikum Wr. Wb.\nYth. Bapak/Ibu ${targetStudent.parentName},\n\nBerikut laporan Capaian Tujuan Pembelajaran (TP) ananda *${targetStudent.name}* (${targetStudent.className}) untuk Bab yang sudah dipelajari:\n\n${summaryLines}\n\n📱 *Lihat Laporan Lengkap secara Online:*\n👉 ${parentLink}\n\n_(Klik link di atas untuk melihat laporan perkembangan ananda secara visual & lengkap, langsung dari HP Bapak/Ibu)_\n\nWassalamu'alaikum Wr. Wb.\n-- ${targetStudent.homeroomTeacher || 'Wali Kelas'}`;

    saveSentReport({
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      className: targetStudent.className,
      nisn: targetStudent.nisn,
      parentName: targetStudent.parentName,
      parentPhone: phone,
      selectedChapters: [...selectedChapters],
      chapterCount: selectedChapters.length,
      tpCount: tpData.reduce((sum, s) => sum + s.chapters.reduce((c, ch) => c + ch.tps.length, 0), 0),
      parentLink,
      sentBy: targetStudent.homeroomTeacher || 'Wali Kelas'
    });

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!targetStudent) return null;

  return (
    <div className={isParentView ? 'min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8' : 'space-y-6 pb-12'}>

      {/* TOP HEADER (Teacher View Only) */}
      {!isParentView && (
        <div className="no-print bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 p-6 rounded-4xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Laporan TP Anak — Mode Guru
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Tujuan Pembelajaran per Bab</h1>
            <p className="text-xs sm:text-sm text-emerald-100">
              Pilih Bab yang sudah dipelajari → Kirim laporan ke orang tua via WhatsApp beserta link halaman laporan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-4 py-2.5 font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2 border ${
                showFilterPanel
                  ? 'bg-amber-400 text-slate-900 border-amber-300'
                  : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter Bab ({selectedChapters.length})
            </button>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2 border ${
                linkCopied ? 'bg-emerald-400 text-white border-emerald-300' : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
              }`}
            >
              <LinkIcon className="w-4 h-4" /> {linkCopied ? 'Link Disalin! ✓' : 'Salin Link Ortu'}
            </button>
            <button
              onClick={handleShareToParent}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2 border border-emerald-400"
            >
              <Share2 className="w-4 h-4" /> Kirim WA + Link ke Ortu
            </button>
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow transition flex items-center gap-2">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          </div>
        </div>
      )}

      {/* LINK PREVIEW (Teacher View Only) */}
      {!isParentView && (
        <div className="no-print p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <p className="text-xs font-black text-sky-800 dark:text-sky-300">🔗 Link Laporan untuk Orang Tua (Tanpa Login)</p>
              <p className="text-[11px] text-sky-600 dark:text-sky-400 font-mono break-all">{parentLink}</p>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className={`px-4 py-1.5 font-extrabold text-[11px] rounded-xl shrink-0 transition ${
              linkCopied ? 'bg-emerald-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-600'
            }`}
          >
            {linkCopied ? '✓ Tersalin!' : 'Salin Link'}
          </button>
        </div>
      )}

      {/* FILTER PANEL: Pilih Bab yang Sudah Dipelajari */}
      {!isParentView && showFilterPanel && (
        <div className="no-print p-5 bg-amber-50 dark:bg-amber-950/40 rounded-3xl border-2 border-amber-300 space-y-4 shadow-lg animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <h3 className="font-black text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Pilih Bab Yang Sudah Dipelajari
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                ✅ Centang = sudah dipelajari (akan tampil di laporan & dikirim ke ortu). ⬜ Kosong = belum dipelajari (tidak dikirim).
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setSelectedChapters(allChapters.map(c => c.chapter))}
                className="px-3 py-1.5 bg-amber-200 text-amber-900 font-extrabold text-[11px] rounded-xl hover:bg-amber-300 transition"
              >
                Pilih Semua
              </button>
              <button
                onClick={() => setSelectedChapters([])}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-extrabold text-[11px] rounded-xl hover:bg-slate-300 transition"
              >
                Hapus Semua
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {buildDynamicReportData(globalTpData).map((subj) => (
              <div key={subj.subject} className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 space-y-2">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">{subj.subject}</p>
                {subj.chapters.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Belum ada Bab ditambahkan.</p>
                ) : subj.chapters.map((chap) => {
                  const isChecked = selectedChapters.includes(chap.title);
                  return (
                    <button
                      key={chap.title}
                      onClick={() => handleToggleChapter(chap.title)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition ${
                        isChecked
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-50 text-slate-400 hover:bg-amber-100/50 border border-slate-200'
                      }`}
                    >
                      {isChecked
                        ? <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        : <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      }
                      <span className="truncate">{chap.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-slate-400">{chap.tps.length} TP</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN REPORT CONTAINER */}
      <div className="print-container bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

        {/* Report Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Laporan Tujuan Pembelajaran</p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">{targetStudent.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-300">{targetStudent.className} • NISN {targetStudent.nisn}</p>
            <p className="text-xs text-slate-400 dark:text-slate-400">Wali Kelas: <span className="font-bold text-slate-600 dark:text-slate-300">{targetStudent.homeroomTeacher}</span></p>
          </div>
          <div className="flex flex-col gap-2 items-start sm:items-end">
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-extrabold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              {isParentView ? 'Laporan untuk Orang Tua' : `${selectedChapters.length} Bab Terpilih`}
            </div>
            {!isParentView && (
              <p className="text-[10px] text-slate-400 font-bold">
                Kurikulum Merdeka TA 2026/2027
              </p>
            )}
          </div>
        </div>

        {/* Edit mode info (Teacher only) */}
        {!isParentView && (
          <div className="no-print rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 font-bold flex flex-wrap items-center justify-between gap-2">
            <span>✏️ Klik badge status pada setiap TP untuk mengubahnya. Klik <strong>"Filter Bab"</strong> untuk memilih Bab yang sudah dipelajari sebelum kirim ke orang tua.</span>
            <button onClick={() => setShowFilterPanel(true)} className="px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-extrabold shrink-0">
              Buka Filter
            </button>
          </div>
        )}

        {/* Subjects + Bab + TP List */}
        <div className="space-y-6">
          {tpData.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 font-bold border-2 border-dashed rounded-3xl space-y-2">
              <p className="text-2xl">📋</p>
              <p>Belum ada Bab yang dipilih atau data TP belum diinput.</p>
              {!isParentView && (
                <button onClick={() => setShowFilterPanel(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-extrabold text-xs">
                  Buka Filter Bab
                </button>
              )}
            </div>
          ) : tpData.map((subj) => (
            <div key={subj.subject} className="space-y-3">
              {/* Subject Header */}
              <div className="flex items-center gap-2 border-b-2 border-slate-200 dark:border-slate-700 pb-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-xs">📚</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">{subj.subject}</h3>
                  <p className="text-[10px] text-slate-500 font-bold">Pengampu: {subj.teacher}</p>
                </div>
              </div>

              {/* Chapters */}
              {subj.chapters.map((chap, chapIdx) => {
                const scores = getPrePostScores(chap.title);
                const chapTotalPoints = chap.tps.reduce((sum, tp) => sum + getTpPoints(tp.status), 0);
                const chapMaxPoints = chap.tps.length * 25;
                const isEditingThis = editingPrePost && editingPrePost.chapTitle === chap.title;

                return (
                <div key={chapIdx} className="pl-3 sm:pl-6 border-l-4 border-emerald-300 dark:border-emerald-700 space-y-2">

                  {/* Chapter Title */}
                  <div className="flex items-center gap-2 py-1">
                    <BookOpen className="w-4 h-4 text-sky-500 shrink-0" />
                    <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">{chap.title}</h4>
                  </div>

                  {/* Pre-Test & Post-Test + Total Points per Bab */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Pre-Test */}
                    <div className="flex items-center gap-2 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 px-3 py-2">
                      <div className="w-7 h-7 rounded-xl bg-orange-400 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-black">📝</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-600 dark:text-orange-400">Pre-Test</p>
                        {isEditingThis ? (
                          <input type="number" min="0" max="100" defaultValue={editingPrePost.preTest}
                            onChange={e => setEditingPrePost(p => ({ ...p, preTest: e.target.value }))}
                            className="w-16 text-sm font-black text-orange-700 bg-white dark:bg-slate-800 border border-orange-300 rounded-lg px-1.5 py-0.5" />
                        ) : (
                          <p className="text-lg font-black text-orange-700 dark:text-orange-300 leading-tight">{scores.preTest}<span className="text-[10px] font-bold text-orange-400 ml-0.5">/100</span></p>
                        )}
                      </div>
                    </div>
                    {/* Post-Test */}
                    <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 px-3 py-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-black">✅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">Post-Test</p>
                        {isEditingThis ? (
                          <input type="number" min="0" max="100" defaultValue={editingPrePost.postTest}
                            onChange={e => setEditingPrePost(p => ({ ...p, postTest: e.target.value }))}
                            className="w-16 text-sm font-black text-emerald-700 bg-white dark:bg-slate-800 border border-emerald-300 rounded-lg px-1.5 py-0.5" />
                        ) : (
                          <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 leading-tight">{scores.postTest}<span className="text-[10px] font-bold text-emerald-400 ml-0.5">/100</span></p>
                        )}
                      </div>
                      {scores.postTest > scores.preTest && (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-full">
                          +{scores.postTest - scores.preTest}
                        </span>
                      )}
                    </div>
                    {/* Total Points Bab */}
                    <div className="flex items-center gap-2 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30 px-3 py-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-600 dark:text-purple-400">Total Point</p>
                        <p className="text-lg font-black text-purple-700 dark:text-purple-300 leading-tight">{chapTotalPoints}<span className="text-[10px] font-bold text-purple-400 ml-0.5">/{chapMaxPoints}</span></p>
                      </div>
                      <div className="w-10 h-10 relative">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#a855f7" strokeWidth="3"
                            strokeDasharray={`${chapMaxPoints > 0 ? (chapTotalPoints / chapMaxPoints) * 88 : 0} 88`}
                            strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-purple-600">
                          {chapMaxPoints > 0 ? Math.round(chapTotalPoints / chapMaxPoints * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Edit Pre/Post Button (teacher only) */}
                  {!isParentView && (
                    <div className="no-print flex items-center gap-2 pl-1">
                      {isEditingThis ? (
                        <>
                          <button onClick={() => handleSavePrePost(chap.title, editingPrePost.preTest, editingPrePost.postTest)}
                            className="px-2.5 py-1 bg-emerald-500 text-white font-extrabold text-[10px] rounded-xl flex items-center gap-1 hover:bg-emerald-600 transition">
                            <Save className="w-3 h-3" /> Simpan
                          </button>
                          <button onClick={() => setEditingPrePost(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-600 font-extrabold text-[10px] rounded-xl flex items-center gap-1 hover:bg-slate-300 transition">
                            <X className="w-3 h-3" /> Batal
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setEditingPrePost({ chapTitle: chap.title, preTest: scores.preTest, postTest: scores.postTest })}
                          className="px-2.5 py-1 bg-sky-50 text-sky-600 border border-sky-200 font-extrabold text-[10px] rounded-xl flex items-center gap-1 hover:bg-sky-100 transition">
                          <Edit3 className="w-3 h-3" /> Edit Nilai Pre/Post-Test
                        </button>
                      )}
                    </div>
                  )}

                  {/* TPs in this chapter */}
                  <div className="space-y-1.5 pl-6">
                    {chap.tps.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Belum ada TP di bab ini.</p>
                    ) : chap.tps.map((tp, tpIdx) => {
                      const isOpen = openDropdown === `${chap.title}__${tp.text}`;
                      const tpPoints = getTpPoints(tp.status);
                      return (
                        <div key={tpIdx} className="flex flex-col gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                          <div className="flex items-start gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{tp.text}</p>

                              {/* Status Badge + Point Badge */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="relative inline-block">
                                  <button
                                    onClick={() => isParentView ? null : setOpenDropdown(isOpen ? null : `${chap.title}__${tp.text}`)}
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black ${statusStyles[tp.status]} ${
                                      isParentView ? 'cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-sm transition'
                                    }`}
                                  >
                                    {renderStatusLabel(tp.status)}
                                    {!isParentView && <ChevronDown className="w-3 h-3" />}
                                  </button>

                                  {/* Status Dropdown */}
                                  {isOpen && !isParentView && (
                                    <div className="absolute left-0 top-full mt-1 z-20 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-1.5">
                                      {STATUS_OPTIONS.map(opt => (
                                        <button
                                          key={opt}
                                          onClick={() => handleStatusChange(tp.text, opt)}
                                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-[10px] font-black text-left cursor-pointer transition ${
                                            tp.status === opt ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                          }`}
                                        >
                                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${statusStyles[opt]}`}>{renderStatusLabel(opt)}</span>
                                          {tp.status === opt && <span className="text-emerald-500">✓</span>}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </span>

                                {tp.status === 'Sedang Proses' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-100 text-slate-500 text-[10px] font-black dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                                    <Clock className="w-3 h-3 text-slate-400" /> Tanpa Nilai
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-black dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300">
                                    <Award className="w-3 h-3 text-purple-500" /> +{tpPoints} Pt
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {shouldShowTeacherNote(tp.status) && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 text-slate-700 dark:text-amber-100">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-700">Catatan Guru</span>
                              </div>
                              <textarea
                                value={tp.note || ''}
                                onChange={(e) => handleNoteChange(tp.text, e.target.value)}
                                rows={3}
                                placeholder="Tuliskan masukan atau saran untuk TP ini..."
                                className="w-full resize-none rounded-2xl border border-amber-300 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-700 dark:text-slate-100"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          ))}
        </div>

        {/* Signature */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-end text-xs">
          <div className="space-y-1 text-slate-500">
            <p className="font-bold">EduProgress — Sistem Monitoring Perkembangan Peserta Didik</p>
            <p className="text-[10px]">Kurikulum Merdeka TA 2026/2027</p>
          </div>
          <div className="text-center space-y-10">
            <p className="font-extrabold text-slate-700 dark:text-slate-300">Kelas 5 SDQ - Madani Al washiyyah</p>
            <p className="font-black underline text-slate-900 dark:text-slate-100">{targetStudent.homeroomTeacher || 'Ustadz Iski'}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
