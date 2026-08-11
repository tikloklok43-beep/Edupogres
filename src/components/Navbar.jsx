import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Contrast,
  UserCheck,
  ChevronDown,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onSearchQuery }) {
  const { user, selectedStudent, switchStudent, students, demoAccounts, loginWithRole } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showStudentMenu, setShowStudentMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (onSearchQuery) {
      onSearchQuery(e.target.value);
    }
  };

  const notifications = [
    { id: 1, title: "Nilai Asesmen Baru", desc: "Ustadz Iski telah menginput Nilai Matematika: 95 (A)", time: "10 menit lalu", unread: true },
    { id: 2, title: "Progres CP Mahir!", desc: "Seni Rupa: CP 1.2 meraih predikat Sangat Mahir 🎉", time: "1 jam lalu", unread: true },
    { id: 3, title: "Catatan Guru Baru", desc: "Ustadz Ahmad: 'Hari ini ananda rajin menyimak PAI'", time: "3 jam lalu", unread: false }
  ];

  return (
    <header className="sticky top-0 z-40 glass-nav px-4 lg:px-8 py-3 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Role Badge */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-400 via-emerald-400 to-amber-300 p-0.5 shadow-md group-hover:scale-105 transition transform">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center text-xl">
                🎒
              </div>
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-sky-600 via-emerald-500 to-amber-500 bg-clip-text text-transparent font-sans tracking-tight">
                EduProgress
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-full ml-2 border border-sky-200 dark:border-sky-800">
                Kurikulum Merdeka
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Cari Siswa, NISN, Guru, Mapel, atau CP..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Student Selector Switcher (All 9 Students) */}
          <div className="relative">
            <button
              onClick={() => setShowStudentMenu(!showStudentMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-2xl hover:bg-sky-100 dark:hover:bg-slate-700 transition"
            >
              <img
                src={selectedStudent.avatar}
                alt={selectedStudent.name}
                className="w-7 h-7 rounded-full object-cover border border-amber-300"
              />
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                  {selectedStudent.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">{selectedStudent.className}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showStudentMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Pilih Peserta Didik (9 Siswa)</p>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {students.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        switchStudent(st.id);
                        setShowStudentMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-2xl flex items-center gap-2.5 hover:bg-sky-50 dark:hover:bg-slate-800 transition ${
                        selectedStudent.id === st.id ? 'bg-sky-100 dark:bg-sky-950 font-bold border border-sky-300 dark:border-sky-700' : ''
                      }`}
                    >
                      <img src={st.avatar} alt={st.name} className="w-7 h-7 rounded-full object-cover" />
                      <div className="flex-1 truncate">
                        <p className="text-xs text-slate-800 dark:text-slate-100 font-semibold">{st.name}</p>
                        <p className="text-[10px] text-slate-400">NISN: {st.nisn}</p>
                      </div>
                      {selectedStudent.id === st.id && <CheckCircle2 className="w-4 h-4 text-sky-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Guru Kelas Role Badge */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-900 font-black text-xs rounded-2xl shadow-sm">
            <UserCheck className="w-4 h-4" />
            <span>Guru / Wali Kelas</span>
          </div>


          {/* Theme Mode Toggle (Light / Dark / High Contrast) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => toggleTheme('light')}
              className={`p-1.5 rounded-xl text-xs transition ${themeMode === 'light' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Mode Terang"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleTheme('dark')}
              className={`p-1.5 rounded-xl text-xs transition ${themeMode === 'dark' ? 'bg-slate-700 text-sky-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Mode Gelap"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleTheme('high-contrast')}
              className={`p-1.5 rounded-xl text-xs transition ${themeMode === 'high-contrast' ? 'bg-yellow-400 text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="High Contrast Mode"
            >
              <Contrast className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-ping"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-sky-500" /> Notifikasi Terbaru
                  </h4>
                  <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">3 Baru</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="p-2.5 bg-sky-50/60 dark:bg-slate-800/60 rounded-2xl text-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{n.title}</p>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{n.desc}</p>
                      <p className="text-[9px] text-slate-400 mt-1 font-medium">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
