import React from 'react';
import { Database } from 'lucide-react';

export default function PenyimpananPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-cyan-500" />
        <h1 className="text-3xl font-black tracking-tight">Penyimpanan Laporan</h1>
      </div>
      <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-300">
          Halaman ini akan berisi arsip atau penyimpanan dari laporan-laporan perkembangan anak yang telah dikirimkan kepada orang tua.
          Guru dapat menggunakan halaman ini untuk melacak dan meninjau riwayat perkembangan setiap anak dari waktu ke waktu.
        </p>
        <p className="mt-4 text-sm font-bold text-amber-600 dark:text-amber-400">
          Fitur untuk menampilkan data laporan akan segera dikembangkan di sini.
        </p>
      </div>
    </div>
  );
}