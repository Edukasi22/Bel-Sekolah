import React, { useState } from 'react';
import { BellLog } from '../types';
import { History, Trash2, Download, CheckCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface HistoryViewProps {
  logs: BellLog[];
  onClearLogs: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  logs,
  onClearLogs,
  onShowToast,
}) => {
  const [filterDate, setFilterDate] = useState('');

  const handleExportCSV = () => {
    if (logs.length === 0) {
      onShowToast('Riwayat Kosong', 'Tidak ada riwayat untuk diekspor.', 'warning');
      return;
    }

    const headers = ['Tanggal', 'Jam', 'Kegiatan', 'Jenis', 'Pesan', 'Status'];
    const rows = logs.map(l => [
      `"${l.date}"`,
      `"${l.time}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.type}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      `"${l.status}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `riwayat-bel-sekolah-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Ekspor Berhasil', 'File CSV riwayat bel berhasil diunduh.', 'success');
  };

  const handleClear = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan seluruh catatan riwayat bel?')) {
      onClearLogs();
      onShowToast('Riwayat Dihapus', 'Seluruh riwayat bel telah dikosongkan.', 'info');
    }
  };

  const filteredLogs = filterDate ? logs.filter(l => l.date === filterDate) : logs;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <span>Catatan Riwayat Bunyi Bel</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log eksekusi bel otomatis dan bel manual untuk keperluan monitoring dan administrasi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold min-h-[44px]"
            title="Filter berdasarkan tanggal"
          />
          {filterDate && (
            <button
              onClick={() => setFilterDate('')}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold min-h-[44px]"
            >
              Semua
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Trash2 className="h-4 w-4" />
            <span>Hapus Riwayat</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredLogs.length} catatan aktivitas</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <History className="h-10 w-10 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium">Belum ada riwayat aktivitas bel.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kegiatan</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Pesan Suara</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="h-3 w-3" /> Berhasil
                    </span>
                  );

                  if (log.status === 'Terlewat') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" /> Terlewat (Sleep)
                      </span>
                    );
                  } else if (log.status === 'Manual') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Manual
                      </span>
                    );
                  } else if (log.status === 'Gagal') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Gagal
                      </span>
                    );
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 whitespace-nowrap font-mono">
                        <div className="font-bold text-slate-900">{log.time}</div>
                        <div className="text-[10px] text-slate-400">{log.date}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {log.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {statusBadge}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
