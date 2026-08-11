import React from 'react';
import { INITIAL_ASSESSMENTS } from '../data/initialData';
import GlassCard from '../components/GlassCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { FileCheck2, Sparkles, Award, Calendar, CheckCircle } from 'lucide-react';

export default function Assessment() {
  const chartData = INITIAL_ASSESSMENTS.map(a => ({
    name: a.subject,
    Nilai: a.score
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Asesmen Pembelajaran Siswa
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Halaman Hasil Asesmen</h1>
          <p className="text-xs sm:text-sm text-purple-100">
            Rekapitulasi Asesmen Formatif, Sumatif, Proyek, Praktik, Observasi, dan Portofolio.
          </p>
        </div>
      </div>

      {/* Recharts Assessment Score Visualizer */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-500" /> Visualisasi Grafik Nilai Asesmen
          </h3>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11, fontWeight: 'bold' }} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff' }} />
              <Bar dataKey="Nilai" fill="#8b5cf6" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_ASSESSMENTS.map((ass) => (
          <GlassCard key={ass.id} className="flex flex-col justify-between space-y-3 border-t-4 border-t-purple-400">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300">
                  {ass.category}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {ass.date}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{ass.title}</h3>
              <p className="text-xs text-slate-500 font-medium">Mata Pelajaran: <span className="font-bold text-slate-700 dark:text-slate-300">{ass.subject}</span></p>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{ass.description}"</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Predikat</p>
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{ass.predicate}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-extrabold text-slate-400">Nilai Akhir</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{ass.score}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
