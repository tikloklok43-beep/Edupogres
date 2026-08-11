import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { DEFAULT_SCHEDULE } from '../data/initialData';
import { ShieldCheck, Database, RefreshCw, Download, Upload, Plus, Trash2, Edit, Save, FileJson } from 'lucide-react';

const emptyStudent = {
  id: '',
  name: '',
  nisn: '',
  className: '',
  homeroomTeacher: '',
  homeroomAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=150&auto=format&fit=crop&q=80',
  attendanceRate: 0,
  totalAchievements: 0,
  totalMemorization: '',
  averageScore: 0,
  overallProgress: 0,
  parentName: '',
  parentPhone: '',
  parentEmail: ''
};

const emptyTpEntry = (subjectLabel = 'Mapel Baru') => ({
  subject: subjectLabel,
  teacher: 'Guru Pengampu',
  chapters: [{ chapter: 'Bab 1', tps: ['TP baru 1'] }]
});

export default function AdminPanel() {
  const { students, setStudents, tpData, setTpData, scheduleData, setScheduleData, resetAllData } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  const [studentDraft, setStudentDraft] = useState(emptyStudent);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');

  const [scheduleDraft, setScheduleDraft] = useState(scheduleData || DEFAULT_SCHEDULE);
  const [newSubjectKey, setNewSubjectKey] = useState('');
  const [selectedSubjectKey, setSelectedSubjectKey] = useState(Object.keys(tpData || {})[0] || '');
  const [tpDraft, setTpDraft] = useState(emptyTpEntry(Object.keys(tpData || {})[0] || 'Mapel Baru'));

  useEffect(() => {
    if (!students.length) {
      setStudentDraft(emptyStudent);
      setSelectedStudentId('');
      return;
    }

    const found = students.find((s) => s.id === selectedStudentId) || students[0];
    setSelectedStudentId(found.id);
    setStudentDraft({ ...emptyStudent, ...found });
  }, [students, selectedStudentId]);

  useEffect(() => {
    setScheduleDraft(scheduleData || DEFAULT_SCHEDULE);
  }, [scheduleData]);

  useEffect(() => {
    if (!tpData || !Object.keys(tpData).length) {
      setSelectedSubjectKey('');
      setTpDraft(emptyTpEntry('Mapel Baru'));
      return;
    }

    const key = tpData[selectedSubjectKey] ? selectedSubjectKey : Object.keys(tpData)[0];
    setSelectedSubjectKey(key);
    setTpDraft({
      ...tpData[key],
      subject: tpData[key]?.subject || key,
      teacher: tpData[key]?.teacher || 'Guru Pengampu',
      chapters: (tpData[key]?.chapters || []).map((chapter) => ({
        ...chapter,
        tps: [...(chapter.tps || [])]
      }))
    });
  }, [tpData, selectedSubjectKey]);

  const updateStudentField = (field, value) => {
    setStudentDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleStudentImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar (JPG, PNG, atau WEBP).');
      event.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran foto maksimal 10 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxDimension = 800;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        updateStudentField('avatar', canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleTeacherImageChange = (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Pilih file gambar (JPG, PNG, atau WEBP).');
      event.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran foto maksimal 10 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 800 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        setScheduleDraft((prev) => ({
          ...prev,
          teacherMapping: (prev.teacherMapping || []).map((teacher, teacherIndex) => (
            teacherIndex === index ? { ...teacher, avatar: canvas.toDataURL('image/jpeg', 0.82) } : teacher
          ))
        }));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddStudent = () => {
    const newId = `std-${Date.now()}`;
    const newStudent = { ...emptyStudent, id: newId, name: 'Siswa Baru', nisn: '0000000000', className: 'Kelas Baru', homeroomTeacher: 'Guru Kelas', parentName: 'Orang Tua' };
    setStudents((prev) => [...prev, newStudent]);
    setSelectedStudentId(newId);
    setStudentDraft(newStudent);
    setActiveTab('students');
  };

  const handleSaveStudent = () => {
    if (!studentDraft.name.trim()) {
      alert('Nama siswa tidak boleh kosong.');
      return;
    }

    const cleanedStudent = {
      ...studentDraft,
      id: studentDraft.id || `std-${Date.now()}`,
      name: studentDraft.name.trim(),
      nisn: studentDraft.nisn || '0000000000',
      className: studentDraft.className || 'Kelas Baru',
      homeroomTeacher: studentDraft.homeroomTeacher || 'Guru Kelas',
      attendanceRate: Number(studentDraft.attendanceRate) || 0,
      averageScore: Number(studentDraft.averageScore) || 0,
      overallProgress: Number(studentDraft.overallProgress) || 0,
      totalAchievements: Number(studentDraft.totalAchievements) || 0
    };

    setStudents((prev) => {
      const exists = prev.some((item) => item.id === cleanedStudent.id);
      if (exists) {
        return prev.map((item) => (item.id === cleanedStudent.id ? cleanedStudent : item));
      }
      return [...prev, cleanedStudent];
    });

    setSelectedStudentId(cleanedStudent.id);
    setStudentDraft(cleanedStudent);
    alert('✅ Data siswa berhasil disimpan.');
  };

  const handleDeleteStudent = (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus siswa ini?')) return;
    setStudents((prev) => prev.filter((student) => student.id !== id));
  };

  const updateScheduleCell = (rowIndex, key, value) => {
    setScheduleDraft((prev) => {
      const nextRows = [...(prev.timeSlots || [])];
      nextRows[rowIndex] = { ...nextRows[rowIndex], [key]: value };
      return { ...prev, timeSlots: nextRows };
    });
  };

  const saveSchedule = () => {
    setScheduleData(scheduleDraft);
    alert('✅ Jadwal pelajaran berhasil disimpan.');
  };

  const addSubject = () => {
    const cleanedKey = newSubjectKey.trim();
    if (!cleanedKey) return;
    if (tpData[cleanedKey]) {
      alert('Nama mapel tersebut sudah ada.');
      return;
    }

    const newEntry = emptyTpEntry(cleanedKey);
    setTpData((prev) => ({ ...prev, [cleanedKey]: newEntry }));
    setSelectedSubjectKey(cleanedKey);
    setNewSubjectKey('');
  };

  const saveTpSubject = () => {
    if (!selectedSubjectKey) return;

    const safeChapters = (tpDraft.chapters || []).map((chapter) => ({
      ...chapter,
      tps: (chapter.tps || []).filter((line) => line && line.trim())
    }));

    const payload = {
      ...tpDraft,
      subject: tpDraft.subject || selectedSubjectKey,
      teacher: tpDraft.teacher || 'Guru Pengampu',
      chapters: safeChapters.length ? safeChapters : [{ chapter: 'Bab 1', tps: ['TP baru 1'] }]
    };

    setTpData((prev) => ({ ...prev, [selectedSubjectKey]: payload }));
    alert('✅ Data TP berhasil disimpan.');
  };

  const addTpChapter = () => {
    setTpDraft((prev) => ({
      ...prev,
      chapters: [...(prev.chapters || []), { chapter: `Bab ${((prev.chapters || []).length + 1)}`, tps: ['TP baru'] }]
    }));
  };

  const updateTpChapter = (chapterIndex, field, value) => {
    setTpDraft((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter, index) => index === chapterIndex ? { ...chapter, [field]: value } : chapter)
    }));
  };

  const updateTpLine = (chapterIndex, tpIndex, value) => {
    setTpDraft((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter, idx) =>
        idx === chapterIndex
          ? { ...chapter, tps: chapter.tps.map((line, lineIndex) => (lineIndex === tpIndex ? value : line)) }
          : chapter
      )
    }));
  };

  const addTpLine = (chapterIndex) => {
    setTpDraft((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter, idx) =>
        idx === chapterIndex ? { ...chapter, tps: [...chapter.tps, `TP baru ${chapter.tps.length + 1}`] } : chapter
      )
    }));
  };

  const removeTpLine = (chapterIndex, tpIndex) => {
    setTpDraft((prev) => ({
      ...prev,
      chapters: prev.chapters.map((chapter, idx) =>
        idx === chapterIndex
          ? { ...chapter, tps: chapter.tps.filter((_, lineIndex) => lineIndex !== tpIndex) }
          : chapter
      )
    }));
  };

  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      setIsBackingUp(false);
      const payload = { students, scheduleData: scheduleDraft, tpData, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'eduprogress-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('✅ Backup data berhasil dibuat dan file JSON sudah diunduh.');
    }, 600);
  };

  const handleRestore = () => {
    if (window.confirm('Apakah Anda yakin ingin memulihkan data default?')) {
      resetAllData();
      alert('✅ Data default berhasil dipulihkan.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrator & Fitur Kelola Sistem
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Panel Manajemen EduProgress</h1>
          <p className="text-xs sm:text-sm text-amber-100">
            Ubah data siswa, jadwal pelajaran, dan TP tanpa perlu edit kode lagi. Semua perubahan tersimpan otomatis di browser.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'students', label: `👨‍🎓 Kelola Data Siswa (${students.length})` },
          { key: 'schedule', label: '📅 Jadwal Pelajaran' },
          { key: 'tp', label: '🎯 TP & Mapel' },
          { key: 'backup', label: '💾 Backup & Restore' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
              activeTab === tab.key ? 'bg-amber-500 text-white shadow-md' : 'bg-white dark:bg-slate-900 border text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'students' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Daftar Siswa</h3>
              <button onClick={handleAddStudent} className="px-3.5 py-1.5 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-1 shadow">
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-extrabold">
                  <tr>
                    <th className="p-2">Nama</th>
                    <th className="p-2">Kelas</th>
                    <th className="p-2">Wali Kelas</th>
                    <th className="p-2">Kehadiran</th>
                    <th className="p-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/70">
                      <td className="p-2">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                          <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full object-cover border border-sky-200" />
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td className="p-2">{student.className}</td>
                      <td className="p-2">{student.homeroomTeacher}</td>
                      <td className="p-2 font-bold text-emerald-600">{student.attendanceRate || 0}%</td>
                      <td className="p-2 text-right space-x-1">
                        <button onClick={() => setSelectedStudentId(student.id)} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteStudent(student.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
              {studentDraft.id ? 'Edit Siswa' : 'Tambah Siswa'}
            </h3>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Nama lengkap</span>
                <input value={studentDraft.name} onChange={(e) => updateStudentField('name', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">NISN</span>
                <input value={studentDraft.nisn} onChange={(e) => updateStudentField('nisn', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Kelas</span>
                <input value={studentDraft.className} onChange={(e) => updateStudentField('className', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Wali kelas</span>
                <input value={studentDraft.homeroomTeacher} onChange={(e) => updateStudentField('homeroomTeacher', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
              <div className="space-y-2">
                <span className="font-bold text-slate-600">Foto profil siswa</span>
                <div className="flex items-center gap-3">
                  <img src={studentDraft.avatar} alt={studentDraft.name || 'Foto siswa'} className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-200" />
                  <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-sky-300 bg-sky-50 px-3 py-2.5 text-center font-bold text-sky-700 hover:bg-sky-100">
                    Pilih foto dari perangkat
                    <input type="file" accept="image/*" onChange={handleStudentImageChange} className="sr-only" />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">Foto akan diperkecil otomatis dan tersimpan di browser saat data siswa disimpan.</p>
              </div>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Nama orang tua</span>
                <input value={studentDraft.parentName} onChange={(e) => updateStudentField('parentName', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Nomor WA orang tua</span>
                <input value={studentDraft.parentPhone} onChange={(e) => updateStudentField('parentPhone', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Email orang tua</span>
                <input value={studentDraft.parentEmail} onChange={(e) => updateStudentField('parentEmail', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold text-slate-600">Kehadiran %</span>
                  <input type="number" value={studentDraft.attendanceRate} onChange={(e) => updateStudentField('attendanceRate', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2.5" />
                </label>
                <label className="space-y-1">
                  <span className="font-bold text-slate-600">Nilai rata-rata</span>
                  <input type="number" value={studentDraft.averageScore} onChange={(e) => updateStudentField('averageScore', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2.5" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="font-bold text-slate-600">Progress %</span>
                  <input type="number" value={studentDraft.overallProgress} onChange={(e) => updateStudentField('overallProgress', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2.5" />
                </label>
                <label className="space-y-1">
                  <span className="font-bold text-slate-600">Prestasi</span>
                  <input type="number" value={studentDraft.totalAchievements} onChange={(e) => updateStudentField('totalAchievements', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2.5" />
                </label>
              </div>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Hafalan / catatan</span>
                <input value={studentDraft.totalMemorization} onChange={(e) => updateStudentField('totalMemorization', e.target.value)} className="w-full rounded-xl border border-slate-200 p-2.5" />
              </label>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveStudent} className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow">
                <Save className="w-4 h-4" /> Simpan Siswa
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'schedule' && (
        <GlassCard className="space-y-4 overflow-x-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Edit Jadwal Pelajaran</h3>
            <button onClick={() => setScheduleDraft(DEFAULT_SCHEDULE)} className="px-3.5 py-1.5 bg-amber-500 text-slate-900 font-extrabold text-xs rounded-2xl flex items-center gap-1 shadow">
              <FileJson className="w-4 h-4" /> Reset
            </button>
          </div>

          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-extrabold">
                <th className="p-2 border">No</th>
                <th className="p-2 border">Waktu</th>
                <th className="p-2 border">Durasi</th>
                <th className="p-2 border">Senin</th>
                <th className="p-2 border">Selasa</th>
                <th className="p-2 border">Rabu</th>
                <th className="p-2 border">Kamis</th>
                <th className="p-2 border">Jumat</th>
              </tr>
            </thead>
            <tbody>
              {(scheduleDraft.timeSlots || []).map((row, rowIndex) => (
                <tr key={row.no ?? rowIndex} className="align-top">
                  <td className="p-1 border font-bold text-slate-400">{row.no}</td>
                  <td className="p-1 border"><input value={row.time || ''} onChange={(e) => updateScheduleCell(rowIndex, 'time', e.target.value)} className="w-full min-w-[90px] rounded border border-slate-200 p-1.5" /></td>
                  <td className="p-1 border"><input value={row.dur || ''} onChange={(e) => updateScheduleCell(rowIndex, 'dur', e.target.value)} className="w-full min-w-[60px] rounded border border-slate-200 p-1.5" /></td>
                  {['senin', 'selasa', 'rabu', 'kamis', 'jumat'].map((day) => (
                    <td key={day} className="p-1 border">
                      <input
                        value={row[day] || ''}
                        onChange={(e) => updateScheduleCell(rowIndex, day, e.target.value)}
                        className="w-full min-w-[90px] rounded border border-slate-200 p-1.5"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <button onClick={saveSchedule} className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow">
              <Save className="w-4 h-4" /> Simpan Jadwal
            </button>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Foto Profil Guru Pengajar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(scheduleDraft.teacherMapping || []).map((teacher, index) => (
                <div key={`${teacher.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <img src={teacher.avatar} alt={teacher.name} className="w-14 h-14 rounded-full object-cover border-2 border-amber-300" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold truncate">{teacher.name}</p>
                    <label className="inline-block mt-1 cursor-pointer text-[10px] font-bold text-sky-600 hover:text-sky-800">
                      Ganti foto
                      <input type="file" accept="image/*" onChange={(event) => handleTeacherImageChange(index, event)} className="sr-only" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">Pilih foto, lalu klik Simpan Jadwal agar perubahan tersimpan.</p>
          </div>
        </GlassCard>
      )}

      {activeTab === 'tp' && (
        <div className="grid grid-cols-1 xl:grid-cols-[0.7fr_1.3fr] gap-6">
          <GlassCard className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Mapel TP</h3>

            <div className="flex gap-2">
              <input value={newSubjectKey} onChange={(e) => setNewSubjectKey(e.target.value)} placeholder="Nama mapel baru" className="flex-1 rounded-xl border border-slate-200 p-2.5 text-xs" />
              <button onClick={addSubject} className="px-3 py-2 bg-sky-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>

            <div className="space-y-2">
              {Object.keys(tpData || {}).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedSubjectKey(key)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-bold transition ${
                    selectedSubjectKey === key ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Edit Tujuan Pembelajaran</h3>

            {selectedSubjectKey && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs">
                    <span className="font-bold text-slate-600">Nama mapel</span>
                    <input value={tpDraft.subject || ''} onChange={(e) => setTpDraft((prev) => ({ ...prev, subject: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5" />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="font-bold text-slate-600">Guru pengampu</span>
                    <input value={tpDraft.teacher || ''} onChange={(e) => setTpDraft((prev) => ({ ...prev, teacher: e.target.value }))} className="w-full rounded-xl border border-slate-200 p-2.5" />
                  </label>
                </div>

                {(tpDraft.chapters || []).map((chapter, chapterIndex) => (
                  <div key={`${selectedSubjectKey}-${chapterIndex}`} className="rounded-2xl border border-slate-200 p-3 space-y-3">
                    <input
                      value={chapter.chapter || ''}
                      onChange={(e) => updateTpChapter(chapterIndex, 'chapter', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold"
                    />

                    <div className="space-y-2">
                      {(chapter.tps || []).map((line, tpIndex) => (
                        <div key={`${chapterIndex}-tp-${tpIndex}`} className="flex gap-2 items-center">
                          <input
                            value={line}
                            onChange={(e) => updateTpLine(chapterIndex, tpIndex, e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 p-2.5 text-[11px]"
                          />
                          <button onClick={() => removeTpLine(chapterIndex, tpIndex)} className="p-2 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button onClick={() => addTpLine(chapterIndex)} className="px-3 py-2 bg-sky-500 text-white text-[10px] font-extrabold rounded-xl">Tambah TP</button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between">
                  <button onClick={addTpChapter} className="px-3 py-2 bg-amber-500 text-slate-900 font-extrabold text-xs rounded-xl">+ Tambah Bab</button>
                  <button onClick={saveTpSubject} className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow">
                    <Save className="w-4 h-4" /> Simpan TP
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="space-y-4 border-l-4 border-l-emerald-500">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-500" /> Backup Data Lokal
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh data siswa, jadwal, dan TP yang saat ini tersimpan di browser ke file JSON.
            </p>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow transition flex items-center justify-center gap-2"
            >
              <Database className="w-4 h-4" />
              <span>{isBackingUp ? 'Membuat Backup...' : 'Unduh Backup Data (.json)'}</span>
            </button>
            {backupStatus && <p className="text-xs font-bold text-emerald-600 text-center">{backupStatus}</p>}
          </GlassCard>

          <GlassCard className="space-y-4 border-l-4 border-l-amber-500">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" /> Restore Data Default
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kembalikan semua data ke baseline awal tanpa harus menulis ulang di file code.
            </p>
            <button
              onClick={handleRestore}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs rounded-2xl shadow transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore Data Default</span>
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
