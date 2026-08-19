import React from 'react';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import ProgressBar from '../components/ProgressBar';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Sparkles,
  Trophy,
  CalendarCheck,
  BookOpen,
  Award,
  Bell,
  Heart,
  TrendingUp,
  UserCheck,
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { selectedStudent, user, tpData, achievements } = useAuth();
  const navigate = useNavigate();

  const totalPrestasi = achievements.filter((item) => item.studentId === selectedStudent.id).length;

  const reportTpSummary = Object.values(tpData || {}).reduce((summary, subject) => {
    (subject.chapters || []).forEach((chapter) => {
      (chapter.tps || []).forEach((tp) => {
        summary.total += 1;
        let status = 'Paham';
        try {
          const overrides = JSON.parse(localStorage.getItem(`tpStatus_${selectedStudent.id}`) || '{}');
          status = overrides[tp] || status;
        } catch (error) {
          // Use the report default when local storage is unavailable.
        }
        if (status === 'Sangat Paham' || status === 'Paham') summary.achieved += 1;
      });
    });
    return summary;
  }, { total: 0, achieved: 0 });

  // Recharts Mock Data for student performance
  const scoreTrendData = [
    { month: 'Jan', Nilai: 85, Target: 80 },
    { month: 'Feb', Nilai: 88, Target: 82 },
    { month: 'Mar', Nilai: 90, Target: 85 },
    { month: 'Apr', Nilai: 89, Target: 85 },
    { month: 'Mei', Nilai: 94, Target: 88 },
    { month: 'Jun', Nilai: 96, Target: 90 },
    { month: 'Jul', Nilai: 95, Target: 90 }
  ];

  const cpRadarData = [
    { subject: 'PAI', value: 92 },
    { subject: 'PPKn', value: 90 },
    { subject: 'B.Indo', value: 88 },
    { subject: 'MTK', value: 85 },
    { subject: 'IPA', value: 94 },
    { subject: 'IPS', value: 82 },
    { subject: 'B.Ing', value: 89 },
    { subject: 'Seni', value: 95 }
  ];

  const academicEvents = [
    { date: "05 Agu", title: "Field Trip Edukasi Sains Kebun Raya", color: "bg-sky-500" },
    { date: "12 Agu", title: "Asesmen Sumatif Bab 1 Matematika", color: "bg-amber-500" },
    { date: "17 Agu", title: "Pentas Seni & Lomba Peringatan Kemerdekaan", color: "bg-rose-500" },
    { date: "25 Agu", title: "Pertemuan Orang Tua & Pameran Karya P5", color: "bg-emerald-500" }
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header Welcome Banner */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={selectedStudent.avatar}
              alt={selectedStudent.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-white/80 shadow-xl"
            />
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-spin" /> {selectedStudent.className}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{selectedStudent.name}</h1>
              <p className="text-xs sm:text-sm text-sky-50 font-medium">
                NISN: <span className="font-extrabold">{selectedStudent.nisn}</span> | Wali Kelas: <span className="font-bold">{selectedStudent.homeroomTeacher}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                const phone = selectedStudent.parentPhone || "6281234567891";
                const msg = `Assalamu'alaikum Wr. Wb. Yth. Bapak/Ibu ${selectedStudent.parentName},\n\nBerikut adalah Rekapitulasi Capaian Pembelajaran (CP) Kurikulum Merdeka untuk ananda:\n\n👤 Nama Siswa: *${selectedStudent.name}*\n🆔 NISN: ${selectedStudent.nisn}\n🏫 Kelas: ${selectedStudent.className}\n\n📊 *PERSENTASE KEMAJUAN BELAJAR: ${selectedStudent.overallProgress}%*\n• Rata-rata Nilai: *${selectedStudent.averageScore}*\n• Kehadiran: *${selectedStudent.attendanceRate}%*\n• Hafalan: *${selectedStudent.totalMemorization}*\n\nTerima kasih atas dukungan Bapak/Ibu di rumah! 🌟\n-- Wali Kelas: ${selectedStudent.homeroomTeacher}`;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
            >
              <span>📱 Kirim Rekap CP via WhatsApp</span>
            </button>

            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md p-3 rounded-3xl border border-white/20">
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-sky-100">Total Progres Belajar</p>
                <p className="text-2xl font-black">{selectedStudent.overallProgress}%</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-300 text-slate-900 flex items-center justify-center text-xl shadow-lg">
                🏆
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Key Stats Cards (Kehadiran, Prestasi, Hafalan, Nilai Rata-rata) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <GlassCard className="border-l-4 border-l-sky-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Persentase Kehadiran</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {selectedStudent.attendanceRate}%
              </h3>
              <p className="text-[10px] text-emerald-500 font-bold mt-1">Sangat Rajin & Disiplin ✨</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-amber-400 cursor-pointer hover:shadow-md transition" onClick={() => navigate('/achievements')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Prestasi</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {totalPrestasi} Penghargaan
              </h3>
              <p className="text-[10px] text-amber-500 font-bold mt-1">Klik untuk kelola prestasi 🏆</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-emerald-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tujuan Pembelajaran</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {reportTpSummary.achieved}/{reportTpSummary.total} TP
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">TP tercapai dari Laporan TP Anak</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-purple-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Rata-Rata Nilai</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {selectedStudent.averageScore}
              </h3>
              <p className="text-[10px] text-purple-500 font-bold mt-1">Predikat A (Sangat Baik) 🌟</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-500 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>

      </div>

      {/* 3. Visual Charts Grid (Perkembangan Nilai & Radar Capaian Pembelajaran) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Trend Nilai Belum & Semester ini */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-500" /> Grafik Perkembangan Nilai Belajar
              </h3>
              <p className="text-xs text-slate-400">Peningkatan performa akademis dari bulan ke bulan</p>
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 dark:bg-sky-950 px-3 py-1 rounded-full border border-sky-200 dark:border-sky-800">
              Semester Genap 2026
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreTrendData}>
                <defs>
                  <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis domain={[60, 100]} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff' }}
                />
                <Area type="monotone" dataKey="Nilai" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorNilai)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Right: Radar Analysis CP Mapel */}
        <GlassCard className="space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Analisis Capaian CP
            </h3>
            <p className="text-xs text-slate-400">Pemetaan kekuatan potensi per mata pelajaran</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={cpRadarData}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Capaian CP" dataKey="value" stroke="#f59e0b" fill="#fbbf24" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* 4. Bottom Grid: Kalender Akademik & Notifikasi Catatan Guru */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Kalender Akademik */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-500" /> Kalender Agenda Sekolah
            </h3>
            <button 
              onClick={() => navigate('/attendance')}
              className="text-xs font-bold text-sky-500 hover:underline"
            >
              Lihat Semuanya →
            </button>
          </div>

          <div className="space-y-2.5">
            {academicEvents.map((evt, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-700/60">
                <div className={`px-3 py-1.5 ${evt.color} text-white font-extrabold text-xs rounded-xl shadow-sm text-center min-w-[65px]`}>
                  {evt.date}
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{evt.title}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right: Notifikasi Perkembangan dari Guru */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" /> Notifikasi & Catatan Wali Kelas
            </h3>
            <button 
              onClick={() => navigate('/daily-notes')}
              className="text-xs font-bold text-sky-500 hover:underline"
            >
              Buka Catatan →
            </button>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800/80 rounded-3xl border border-amber-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
              <Heart className="w-4 h-4 text-rose-500" /> Catatan Spesial Hari Ini:
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
              "Ananda {selectedStudent.name} hari ini sangat aktif dalam diskusi kelompok IPA dan menunjukkan kepemimpinan yang santun saat berbagi tugas dengan teman sekelas."
            </p>
            <p className="text-[10px] font-bold text-slate-400 text-right">— {selectedStudent.homeroomTeacher}</p>
          </div>
        </GlassCard>

      </div>

    </div>
  );
}
