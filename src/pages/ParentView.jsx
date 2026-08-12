import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { INITIAL_STUDENTS } from '../data/initialData';
import ParentReport from './ParentReport';

export default function ParentView() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const { students } = useAuth();

  let selectedChapters = null;
  try {
    const encodedChapters = searchParams.get('bab');
    if (encodedChapters !== null) {
      const parsedChapters = JSON.parse(encodedChapters);
      if (Array.isArray(parsedChapters)) selectedChapters = parsedChapters;
    }
  } catch (e) {
    // Keep legacy links usable when the optional filter is invalid.
  }

  const student = students?.find(s => s.id === studentId) || INITIAL_STUDENTS.find(s => s.id === studentId);

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-lg font-black text-slate-800 mb-2">Laporan Tidak Ditemukan</h1>
          <p className="text-xs text-slate-500">Link laporan ini tidak valid atau telah kedaluwarsa. Silakan minta kembali link terbaru dari Wali Kelas.</p>
        </div>
      </div>
    );
  }

  return <ParentReport student={student} selectedChapters={selectedChapters} />;
}
