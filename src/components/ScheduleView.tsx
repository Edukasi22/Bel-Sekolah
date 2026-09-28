import React, { useState, useMemo } from 'react';
import { ScheduleItem, DayOfWeek, BellType } from '../types';
import { SAMPLE_SCHEDULES } from '../services/storage';
import {
  Plus,
  Search,
  Filter,
  Play,
  Edit2,
  Trash2,
  Download,
  Upload,
  Check,
  X,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const DAYS_LIST: Array<{ key: DayOfWeek | 'all'; label: string }> = [
  { key: 'all', label: 'Semua Hari' },
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
];

const BELL_TYPES: Array<{ value: BellType; label: string }> = [
  { value: 'masuk', label: 'Masuk Sekolah' },
  { value: 'pergantian', label: 'Pergantian Jam' },
  { value: 'istirahat', label: 'Istirahat' },
  { value: 'selesai_istirahat', label: 'Selesai Istirahat' },
  { value: 'pulang', label: 'Pulang Sekolah' },
  { value: 'upacara', label: 'Upacara Bendera' },
  { value: 'khusus', label: 'Kegiatan Khusus' },
  { value: 'lainnya', label: 'Lainnya' },
];

const DAY_ORDER: Record<DayOfWeek, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
};

interface ScheduleViewProps {
  schedules: ScheduleItem[];
  onSaveSchedules: (schedules: ScheduleItem[]) => void;
  onPreview: (item: ScheduleItem) => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImportCSV: (file: File) => void;
  onImportJSON: (file: File) => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedules,
  onSaveSchedules,
  onPreview,
  onExportJSON,
  onExportCSV,
  onImportCSV,
  onImportJSON,
  onShowToast,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);

  // Form State
  const [formDay, setFormDay] = useState<DayOfWeek>('monday');
  const [formTime, setFormTime] = useState('07:00');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<BellType>('masuk');
  const [formMessage, setFormMessage] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);

  // Template dropdown modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Filter & Sort
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => {
        if (selectedDay !== 'all' && s.day !== selectedDay) return false;
        if (selectedType !== 'all' && s.type !== selectedType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = s.title.toLowerCase().includes(q);
          const matchMsg = s.message.toLowerCase().includes(q);
          const matchTime = s.time.includes(q);
          if (!matchTitle && !matchMsg && !matchTime) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by Day then by Time
        const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
        if (dayDiff !== 0) return dayDiff;
        return a.time.localeCompare(b.time);
      });
  }, [schedules, selectedDay, selectedType, searchQuery]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormDay(selectedDay === 'all' ? 'monday' : selectedDay);
    setFormTime('07:00');
    setFormTitle('Masuk Sekolah');
    setFormType('masuk');
    setFormMessage('Bel masuk sekolah. Selamat pagi anak-anak. Silakan masuk ke kelas masing-masing dan bersiap mengikuti pembelajaran.');
    setFormEnabled(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormDay(item.day);
    setFormTime(item.time);
    setFormTitle(item.title);
    setFormType(item.type);
    setFormMessage(item.message);
    setFormEnabled(item.enabled);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast('Validasi Gagal', 'Nama kegiatan wajib diisi.', 'warning');
      return;
    }
    if (!formTime || !/^\d{2}:\d{2}$/.test(formTime)) {
      onShowToast('Validasi Gagal', 'Format jam tidak valid (harus HH:mm).', 'warning');
      return;
    }

    // Check duplicate warning
    const isDuplicate = schedules.some(
      s => s.day === formDay && s.time === formTime && (!editingItem || s.id !== editingItem.id)
    );
    if (isDuplicate) {
      if (!confirm(`Peringatan: Sudah ada jadwal pada hari ${formDay} pukul ${formTime}. Tetap simpan?`)) {
        return;
      }
    }

    if (editingItem) {
      // Update
      const updated = schedules.map(s =>
        s.id === editingItem.id
          ? {
              ...s,
              day: formDay,
              time: formTime,
              title: formTitle.trim(),
              type: formType,
              message: formMessage.trim(),
              enabled: formEnabled,
            }
          : s
      );
      onSaveSchedules(updated);
      onShowToast('Berhasil Disimpan', `Jadwal "${formTitle}" telah diperbarui.`, 'success');
    } else {
      // Add
      const newItem: ScheduleItem = {
        id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        day: formDay,
        time: formTime,
        title: formTitle.trim(),
        type: formType,
        message: formMessage.trim(),
        enabled: formEnabled,
      };
      onSaveSchedules([...schedules, newItem]);
      onShowToast('Berhasil Ditambahkan', `Jadwal "${formTitle}" berhasil dibuat.`, 'success');
    }

    setIsFormOpen(false);
  };

  const handleToggleEnable = (id: string) => {
    const updated = schedules.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onSaveSchedules(updated);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    const updated = schedules.filter(s => s.id !== itemToDelete.id);
    onSaveSchedules(updated);
    onShowToast('Jadwal Dihapus', `Jadwal "${itemToDelete.title}" telah dihapus.`, 'success');
    setItemToDelete(null);
  };

  // Preset speech updater based on type
  const handleTypeChange = (newType: BellType) => {
    setFormType(newType);
    if (!editingItem) {
      if (newType === 'masuk') {
        setFormTitle('Masuk Sekolah');
        setFormMessage('Bel masuk sekolah. Selamat pagi anak-anak. Silakan masuk ke kelas masing-masing dan bersiap mengikuti pembelajaran.');
      } else if (newType === 'pergantian') {
        setFormTitle('Pergantian Jam Pelajaran');
        setFormMessage('Bel pergantian jam pelajaran. Silakan bersiap untuk mengikuti pelajaran berikutnya.');
      } else if (newType === 'istirahat') {
        setFormTitle('Istirahat');
        setFormMessage('Bel istirahat. Anak-anak dipersilakan beristirahat dan tetap menjaga ketertiban.');
      } else if (newType === 'selesai_istirahat') {
        setFormTitle('Selesai Istirahat');
        setFormMessage('Bel selesai istirahat. Silakan kembali ke kelas dan bersiap melanjutkan pembelajaran.');
      } else if (newType === 'pulang') {
        setFormTitle('Pulang Sekolah');
        setFormMessage('Bel pulang sekolah. Kegiatan pembelajaran hari ini telah selesai. Hati-hati di perjalanan dan sampai jumpa.');
      } else if (newType === 'upacara') {
        setFormTitle('Upacara Bendera');
        setFormMessage('Bel upacara bendera hari Senin. Seluruh siswa dan guru dipersilakan segera menuju ke lapangan upacara.');
      }
    }
  };

  const applyTemplate = (type: 'normal' | 'jumat' | 'reset_sample') => {
    if (type === 'normal') {
      // Normal SD day (Mon-Thu) template
      const normalDay: ScheduleItem[] = [
        { id: 'tn-1', day: 'monday', time: '07:00', title: 'Masuk Sekolah', type: 'masuk', message: 'Bel masuk sekolah. Selamat pagi anak-anak.', enabled: true },
        { id: 'tn-2', day: 'monday', time: '07:45', title: 'Pelajaran 1', type: 'masuk', message: 'Bel masuk pelajaran pertama dimulai.', enabled: true },
        { id: 'tn-3', day: 'monday', time: '08:30', title: 'Pelajaran 2', type: 'pergantian', message: 'Bel pergantian jam pelajaran kedua.', enabled: true },
        { id: 'tn-4', day: 'monday', time: '09:15', title: 'Pelajaran 3', type: 'pergantian', message: 'Bel pergantian jam pelajaran ketiga.', enabled: true },
        { id: 'tn-5', day: 'monday', time: '09:45', title: 'Istirahat', type: 'istirahat', message: 'Bel istirahat. Anak-anak dipersilakan beristirahat.', enabled: true },
        { id: 'tn-6', day: 'monday', time: '10:15', title: 'Masuk Setelah Istirahat', type: 'selesai_istirahat', message: 'Bel selesai istirahat. Silakan kembali ke ruang kelas.', enabled: true },
        { id: 'tn-7', day: 'monday', time: '11:00', title: 'Pelajaran 4', type: 'pergantian', message: 'Bel pergantian jam pelajaran keempat.', enabled: true },
        { id: 'tn-8', day: 'monday', time: '11:45', title: 'Pelajaran 5', type: 'pergantian', message: 'Bel pergantian jam pelajaran kelima.', enabled: true },
        { id: 'tn-9', day: 'monday', time: '12:30', title: 'Pulang Sekolah', type: 'pulang', message: 'Bel pulang sekolah. Pembelajaran telah selesai.', enabled: true },
      ];
      // Replicate to Monday if confirmed
      if (confirm('Terapkan template normal SD untuk hari Senin?')) {
        const withoutMon = schedules.filter(s => s.day !== 'monday');
        onSaveSchedules([...withoutMon, ...normalDay]);
        onShowToast('Template Diterapkan', 'Template Normal SD berhasil diterapkan ke hari Senin.', 'success');
      }
    } else if (type === 'jumat') {
      const jumatDay: ScheduleItem[] = [
        { id: 'tj-1', day: 'friday', time: '07:00', title: 'Senam Pagi', type: 'khusus', message: 'Bel senam pagi hari Jumat.', enabled: true },
        { id: 'tj-2', day: 'friday', time: '07:45', title: 'Jam Pelajaran 1', type: 'masuk', message: 'Bel masuk pelajaran pertama.', enabled: true },
        { id: 'tj-3', day: 'friday', time: '08:45', title: 'Istirahat', type: 'istirahat', message: 'Bel istirahat Jumat.', enabled: true },
        { id: 'tj-4', day: 'friday', time: '09:15', title: 'Jam Pelajaran 2', type: 'pergantian', message: 'Bel masuk jam pelajaran kedua.', enabled: true },
        { id: 'tj-5', day: 'friday', time: '10:30', title: 'Pulang Jumat', type: 'pulang', message: 'Bel pulang sekolah hari Jumat.', enabled: true },
      ];
      if (confirm('Terapkan template Jumat (pembelajaran singkat) ke hari Jumat?')) {
        const withoutFri = schedules.filter(s => s.day !== 'friday');
        onSaveSchedules([...withoutFri, ...jumatDay]);
        onShowToast('Template Diterapkan', 'Template Jumat berhasil diterapkan.', 'success');
      }
    } else if (type === 'reset_sample') {
      if (confirm('Pulihkan seluruh jadwal ke contoh bawaan SD lengkap (Senin s/d Sabtu)?')) {
        onSaveSchedules(SAMPLE_SCHEDULES);
        onShowToast('Jadwal Dipulihkan', 'Jadwal contoh SD berhasil dipulihkan.', 'success');
      }
    }
    setShowTemplateModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Jadwal Bel Mingguan</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur waktu dan bunyi bel otomatis untuk hari Senin hingga Minggu
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Template Jadwal</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            <span>+ TAMBAH JADWAL</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        {/* Day Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          {DAYS_LIST.map(d => (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`px-3 py-2 rounded-xl whitespace-nowrap transition min-h-[40px] ${
                selectedDay === d.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kegiatan, jam, atau pesan suara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[42px]"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              aria-label="Filter berdasarkan jenis bel"
              className="w-full sm:w-48 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[42px]"
            >
              <option value="all">Semua Jenis Bel</option>
              {BELL_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick CSV Export */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={onExportCSV}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1 min-h-[42px]"
              title="Unduh jadwal sebagai CSV"
            >
              <Download className="h-4 w-4" />
              <span className="hidden md:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schedules Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Menampilkan {filteredSchedules.length} Jadwal
          </span>
          {selectedDay !== 'all' && (
            <span className="text-xs font-semibold text-blue-600">
              Hari {DAYS_LIST.find(d => d.key === selectedDay)?.label}
            </span>
          )}
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Filter className="h-10 w-10 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium">Tidak ada jadwal yang sesuai filter.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Jadwal Sekarang
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSchedules.map(item => {
              const dayLabel = DAYS_LIST.find(d => d.key === item.day)?.label || item.day;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    !item.enabled ? 'bg-slate-50/70 opacity-60' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    {/* Time Badge */}
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-3 py-1.5 text-center font-mono font-black text-base shrink-0">
                      {item.time}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {dayLabel}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">{item.title}</h4>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        "{item.message}"
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                    {/* Enable Toggle */}
                    <button
                      onClick={() => handleToggleEnable(item.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 min-h-[38px] ${
                        item.enabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      }`}
                      title={item.enabled ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    >
                      <span className={`h-2 w-2 rounded-full ${item.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{item.enabled ? 'Aktif' : 'Nonaktif'}</span>
                    </button>

                    {/* Preview / Tes */}
                    <button
                      onClick={() => onPreview(item)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Preview Suara & Bel"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Edit Jadwal"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setItemToDelete(item)}
                      className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal (Add / Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Edit Jadwal Bel' : 'Tambah Jadwal Bel Baru'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Day */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hari <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formDay}
                    onChange={e => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[42px]"
                  >
                    {DAYS_LIST.filter(d => d.key !== 'all').map(d => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jam (24 Jam) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[42px]"
                  />
                </div>
              </div>

              {/* Title & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kegiatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Masuk Sekolah"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Bel
                  </label>
                  <select
                    value={formType}
                    onChange={e => handleTypeChange(e.target.value as BellType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[42px]"
                  >
                    {BELL_TYPES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message (Text-to-speech) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Suara (Pengumuman Bahasa Indonesia)
                </label>
                <textarea
                  rows={3}
                  placeholder="Kalimat pengumuman yang dibacakan setelah suara bel..."
                  value={formMessage}
                  onChange={e => setFormMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Pesan ini akan diucapkan otomatis dengan suara Bahasa Indonesia saat bel berbunyi.
                </span>
              </div>

              {/* Enabled Switch */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Jadwal Aktif</span>
                  <span className="text-[11px] text-slate-500">
                    Nyalakan agar jadwal ini dapat dieksekusi otomatis
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={e => setFormEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs min-h-[44px]"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus jadwal <strong>"{itemToDelete.title}"</strong> ({itemToDelete.time})?
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 min-h-[44px]"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs min-h-[44px]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Pilih Template Jadwal</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => applyTemplate('normal')}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
                  TEMPLATE SD NORMAL (07:00 - 12:30)
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Masuk 07:00, Pelajaran 1-3, Istirahat 09:45, Selesai Istirahat 10:15, Pelajaran 4-5, Pulang 12:30.
                </div>
              </button>

              <button
                onClick={() => applyTemplate('jumat')}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
                  TEMPLATE JUMAT (PEMBELAJARAN SINGKAT)
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Senam 07:00, Jam 1 07:45, Istirahat 08:45, Jam 2 09:15, Pulang 10:30 (Persiapan Sholat Jumat).
                </div>
              </button>

              <button
                onClick={() => applyTemplate('reset_sample')}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group"
              >
                <div className="font-bold text-sm text-slate-900 group-hover:text-blue-700">
                  PULIHKAN JADWAL SD LENGKAP (SENIN - SABTU)
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Memuat kembali paket jadwal lengkap bawaan sekolah dasar dari hari Senin sampai Sabtu.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
