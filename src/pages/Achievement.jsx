import React from 'react';
import { INITIAL_ACHIEVEMENTS } from '../data/initialData';
import GlassCard from '../components/GlassCard';
import { Trophy, Star, Award, Sparkles, Medal } from 'lucide-react';

export default function Achievement() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 p-6 rounded-4xl text-slate-900 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Trophy className="w-3.5 h-3.5" /> Ruang Penghargaan & Prestasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Prestasi & Rekam Jejak Siswa</h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            Daftar kejuaraan akademis, non-akademis, tahfidz Al-Qur'an, dan penghargaan apresiasi sekolah.
          </p>
        </div>
      </div>

      {/* Grid Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_ACHIEVEMENTS.map((ach) => (
          <GlassCard key={ach.id} className="relative overflow-hidden space-y-4">
            <div className={`w-14 h-14 rounded-3xl bg-gradient-to-br ${ach.badgeColor} text-white flex items-center justify-center text-3xl shadow-lg`}>
              {ach.icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  {ach.category}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{ach.year}</span>
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-2">{ach.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ach.description}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
