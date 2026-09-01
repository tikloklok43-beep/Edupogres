import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updatePassword, sendPasswordResetEmail } from '../lib/supabase';
import GlassCard from '../components/GlassCard';
import { Settings as SettingsIcon, Sun, Moon, Contrast, UserCheck, Lock } from 'lucide-react';

export default function Settings() {
  const { user, selectedStudent } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    if (password.length < 6) {
      setPasswordError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmation) {
      setPasswordError('Konfirmasi password tidak sama.');
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmation('');
      setPasswordMessage('Password berhasil diganti.');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePasswordReset() {
    setPasswordMessage('');
    setPasswordError('');
    if (!user?.email) {
      setPasswordError('Email pengguna tidak tersedia.');
      return;
    }
    try {
      await sendPasswordResetEmail(user.email);
      setPasswordMessage(`Link reset password telah dikirim ke ${user.email}.`);
    } catch (error) {
      setPasswordError(error.message);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <SettingsIcon className="w-3.5 h-3.5" /> Pengaturan Sistem & Profil
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Pengaturan & Aksesibilitas</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Kelola profil pengguna, preferensi tema tampilan (Light/Dark/High Contrast), dan notifikasi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left: User Profile Summary */}
        <GlassCard className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-500" /> Profil Pengguna Aktif
          </h3>

          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl border">
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-amber-300" />
            <div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{user.name}</h4>
              <p className="text-xs font-bold text-amber-600">{user.role}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-semibold">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex justify-between">
              <span className="text-slate-500">Status Akun:</span>
              <span className="font-extrabold text-emerald-600">Terverifikasi (Aktif)</span>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl flex justify-between">
              <span className="text-slate-500">Siswa yang Dipantau:</span>
              <span className="font-extrabold text-sky-600">{selectedStudent.name}</span>
            </div>
          </div>
        </GlassCard>

        {/* Password management */}
        <GlassCard className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" /> Keamanan Akun
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password baru" className="w-full border rounded-xl p-3 text-sm bg-white dark:bg-slate-800" />
            <input type="password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Konfirmasi password baru" className="w-full border rounded-xl p-3 text-sm bg-white dark:bg-slate-800" />
            <button disabled={savingPassword} className="w-full rounded-xl bg-indigo-600 text-white p-3 text-sm font-bold disabled:opacity-50">{savingPassword ? 'Menyimpan...' : 'Ganti Password'}</button>
          </form>
          <button type="button" onClick={handlePasswordReset} className="w-full rounded-xl border-indigo-300 text-indigo-600 p-3 text-sm font-bold">Kirim Link Reset ke Email</button>
          {passwordMessage && <p className="text-sm font-semibold text-emerald-600">{passwordMessage}</p>}
          {passwordError && <p className="text-sm font-semibold text-rose-600">{passwordError}</p>}
        </GlassCard>

        {/* Right: Theme & Display Accessibility Settings */}
        <GlassCard className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" /> Preferensi Tampilan & Aksesibilitas
          </h3>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500">Pilih Mode Tampilan Layar:</p>

            <button
              onClick={() => toggleTheme('light')}
              className={`w-full p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition ${
                themeMode === 'light' ? 'bg-amber-100 border-amber-400 text-amber-900 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-500" /> Mode Terang (Light Mode)
              </div>
              {themeMode === 'light' && <span className="text-[10px] bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full font-black">Aktif</span>}
            </button>

            <button
              onClick={() => toggleTheme('dark')}
              className={`w-full p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition ${
                themeMode === 'dark' ? 'bg-sky-950 border-sky-600 text-sky-200 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-sky-400" /> Mode Gelap (Dark Mode)
              </div>
              {themeMode === 'dark' && <span className="text-[10px] bg-sky-500 text-white px-2 py-0.5 rounded-full font-black">Aktif</span>}
            </button>

            <button
              onClick={() => toggleTheme('high-contrast')}
              className={`w-full p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-between transition ${
                themeMode === 'high-contrast' ? 'bg-yellow-400 text-black border-black shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Contrast className="w-4 h-4 text-yellow-500" /> High Contrast Mode (Kontras Tinggi)
              </div>
              {themeMode === 'high-contrast' && <span className="text-[10px] bg-black text-yellow-300 px-2 py-0.5 rounded-full font-black">Aktif</span>}
            </button>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
