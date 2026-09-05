import { supabase, syncAppState, fetchAppState } from '../lib/supabase';

// Cloud Sync for EduProgress Parent Report via Supabase
export async function saveReportToCloud(studentId, payload) {
  const stdId = studentId?.startsWith('std-') ? studentId : `std-${studentId}`;
  const reportData = {
    notes: payload.notes || {},
    status: payload.status || {},
    selectedChapters: payload.selectedChapters || null,
    prePost: payload.prePost || null,
    updatedAt: new Date().toISOString()
  };

  // 1. Simpan ke Supabase tabel parent_reports jika ada
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('parent_reports')
        .upsert({
          student_id: stdId,
          report_data: reportData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' });

      if (!error) {
        return { success: true, data: reportData };
      }
    } catch (err) {
      console.warn('[Supabase parent_reports]:', err);
    }
  }

  // 2. Fallback simpan ke app_sync_data di Supabase
  await syncAppState(`report_${stdId}`, reportData);

  // 3. Simpan juga ke localStorage browser
  try {
    localStorage.setItem(`eduprogress_cloud_report_${stdId}`, JSON.stringify(reportData));
  } catch (e) {}

  return { success: true, data: reportData };
}

export async function fetchReportFromCloud(studentId) {
  const stdId = studentId?.startsWith('std-') ? studentId : `std-${studentId}`;

  // 1. Ambil dari Supabase parent_reports
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('parent_reports')
        .select('report_data')
        .eq('student_id', stdId)
        .single();

      if (!error && data?.report_data) {
        return data.report_data;
      }
    } catch (err) {
      console.warn('[Supabase fetchReportFromCloud]:', err);
    }
  }

  // 2. Ambil dari app_sync_data di Supabase
  const fallbackCloud = await fetchAppState(`report_${stdId}`);
  if (fallbackCloud) return fallbackCloud;

  // 3. Ambil dari localStorage
  try {
    const local = localStorage.getItem(`eduprogress_cloud_report_${stdId}`);
    return local ? JSON.parse(local) : null;
  } catch (e) {
    return null;
  }
}

