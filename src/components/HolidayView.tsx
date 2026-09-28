import React, { useState } from 'react';
import { HolidayItem } from '../types';
import { SAMPLE_HOLIDAYS } from '../services/storage';
import { Plus, Trash2, Palmtree, X, AlertTriangle, Calendar } from 'lucide-react';

interface HolidayViewProps {
  holidays: HolidayItem[];
  onSaveHolidays: (holidays: HolidayItem[]) => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const HolidayView: React.FC<HolidayViewProps> = ({
  holidays,
  onSaveHolidays,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HolidayItem | null>(null);

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setName('Libur Semester Ganjil');
    setDescription('Libur akhir semester');
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      onShowToast('Validasi Gagal', 'Tanggal dan nama libur wajib diisi.', 'warning');
      return;
    }

    const newItem: HolidayItem = {
      id: `hol-${Date.now()}`,
      date,
      name: name.trim(),
      description: description.trim(),
    };

    onSaveHolidays([...holidays, newItem]);
    onShowToast('Tersimpan', `Hari libur "${name}" berhasil ditambahkan.`, 'success');
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    const updated = holidays.filter(h => h.id !== itemToDelete.id);
    onSaveHolidays(updated);
    setItemToDelete(null);
    onShowToast('Dihapus', 'Hari libur berhasil dihapus.', 'success');
  };

  const handleResetHolidays = () => {
    if (confirm('Pulihkan daftar hari libur nasional bawaan?')) {
      onSaveHolidays(SAMPLE_HOLIDAYS);
      onShowToast('Dipulihkan', 'Daftar hari libur bawaan telah dipulihkan.', 'success');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Palmtree className="h-5 w-5 text-emerald-600" />
            <span>Daftar Hari Libur Sekolah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Saat tanggal jatuh pada hari libur, sistem bel otomatis otomatis dinonaktifkan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetHolidays}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition min-h-[44px]"
          >
            Libur Standar
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>+ TAMBAH HARI LIBUR</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {holidays.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Palmtree className="h-10 w-10 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium">Belum ada hari libur terdaftar.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {holidays
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(item => (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-3 py-1.5 text-center font-mono font-bold text-xs shrink-0 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{item.date}</span>
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
                    title="Hapus Hari Libur"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Hari Libur Sekolah</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Libur</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Hari Libur</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hari Kemerdekaan RI / Libur Semester"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Libur Nasional atau Cuti Bersama"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[42px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs min-h-[44px]"
                >
                  Simpan Hari Libur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Hari Libur?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Hapus <strong>"{itemToDelete.name}"</strong> ({itemToDelete.date}) dari daftar libur?
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold min-h-[44px]"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[44px]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
