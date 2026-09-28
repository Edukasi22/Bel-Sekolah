import React, { useState } from 'react';
import { SpecialSchedule, BellType } from '../types';
import { Plus, Trash2, Edit2, Play, CalendarCheck2, X, AlertTriangle } from 'lucide-react';

interface SpecialScheduleViewProps {
  specialSchedules: SpecialSchedule[];
  onSaveSpecialSchedules: (schedules: SpecialSchedule[]) => void;
  onPreview: (item: SpecialSchedule) => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SpecialScheduleView: React.FC<SpecialScheduleViewProps> = ({
  specialSchedules,
  onSaveSpecialSchedules,
  onPreview,
  onShowToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SpecialSchedule | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SpecialSchedule | null>(null);

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('07:00');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<BellType>('khusus');
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(true);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().split('T')[0]);
    setTime('07:00');
    setTitle('Upacara HUT Kemerdekaan');
    setType('upacara');
    setMessage('Perhatian seluruh siswa dan dewan guru, upacara bendera khusus akan segera dimulai.');
    setEnabled(true);
    setIsOpen(true);
  };

  const handleOpenEdit = (item: SpecialSchedule) => {
    setEditingItem(item);
    setDate(item.date);
    setTime(item.time);
    setTitle(item.title);
    setType(item.type);
    setMessage(item.message);
    setEnabled(item.enabled);
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      onShowToast('Validasi Gagal', 'Tanggal, jam, dan nama kegiatan wajib diisi.', 'warning');
      return;
    }

    if (editingItem) {
      const updated = specialSchedules.map(s =>
        s.id === editingItem.id ? { ...s, date, time, title: title.trim(), type, message: message.trim(), enabled } : s
      );
      onSaveSpecialSchedules(updated);
      onShowToast('Tersimpan', `Jadwal khusus "${title}" telah diperbarui.`, 'success');
    } else {
      const newItem: SpecialSchedule = {
        id: `spec-${Date.now()}`,
        date,
        time,
        title: title.trim(),
        type,
        message: message.trim(),
        enabled,
      };
      onSaveSpecialSchedules([...specialSchedules, newItem]);
      onShowToast('Ditambahkan', `Jadwal khusus "${title}" telah dibuat.`, 'success');
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    const updated = specialSchedules.filter(s => s.id !== itemToDelete.id);
    onSaveSpecialSchedules(updated);
    setItemToDelete(null);
    onShowToast('Dihapus', 'Jadwal khusus berhasil dihapus.', 'success');
  };

  const handleToggle = (id: string) => {
    const updated = specialSchedules.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onSaveSpecialSchedules(updated);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-blue-600" />
            <span>Jadwal Khusus (Tanggal Tertentu)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Jadwal untuk ujian, upacara hari besar, rapat, atau acara khusus dengan prioritas tinggi pada tanggal yang ditentukan
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>+ TAMBAH JADWAL KHUSUS</span>
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {specialSchedules.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CalendarCheck2 className="h-10 w-10 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium">Belum ada jadwal khusus yang ditambahkan.</p>
            <p className="text-xs text-slate-400 mt-1">
              Gunakan fitur ini untuk membuat jadwal ujian semester, peringatan hari nasional, atau kegiatan istimewa lainnya.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {specialSchedules.map(item => (
              <div
                key={item.id}
                className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  !item.enabled ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3 py-1.5 text-center font-mono font-black text-base shrink-0">
                    {item.time}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                        📅 {item.date}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 min-h-[38px] ${
                      item.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span>{item.enabled ? 'Aktif' : 'Nonaktif'}</span>
                  </button>

                  <button
                    onClick={() => onPreview(item)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Tes Bel & Pesan"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setItemToDelete(item)}
                    className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Jadwal Khusus' : 'Tambah Jadwal Khusus'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam (24 Jam)</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono min-h-[42px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Upacara HUT RI / Ujian Akhir Semester"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pesan Suara Bahasa Indonesia</label>
                <textarea
                  rows={3}
                  placeholder="Pesan pengumuman suara yang akan dibacakan..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-800">Aktif</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                  className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs min-h-[44px]"
                >
                  Simpan Jadwal Khusus
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
            <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-600 mt-2">
              Hapus jadwal khusus <strong>"{itemToDelete.title}"</strong> ({itemToDelete.date})?
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
