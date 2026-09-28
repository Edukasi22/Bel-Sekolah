import React, { useState } from 'react';
import { SchoolSettings, DayOfWeek } from '../types';
import { scheduler } from '../services/scheduler';
import { Building2, Save, Upload, Trash2, Bell, Globe, ShieldCheck } from 'lucide-react';

interface SchoolSettingsViewProps {
  settings: SchoolSettings;
  onSaveSettings: (settings: SchoolSettings) => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const ALL_DAYS: Array<{ key: DayOfWeek; label: string }> = [
  { key: 'monday', label: 'Senin' },
  { key: 'tuesday', label: 'Selasa' },
  { key: 'wednesday', label: 'Rabu' },
  { key: 'thursday', label: 'Kamis' },
  { key: 'friday', label: 'Jumat' },
  { key: 'saturday', label: 'Sabtu' },
  { key: 'sunday', label: 'Minggu' },
];

export const SchoolSettingsView: React.FC<SchoolSettingsViewProps> = ({
  settings,
  onSaveSettings,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<SchoolSettings>(settings);

  const handleChange = <K extends keyof SchoolSettings>(key: K, value: SchoolSettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleDay = (day: DayOfWeek) => {
    const current = formData.activeDays;
    const exists = current.includes(day);
    const updated = exists ? current.filter(d => d !== day) : [...current, day];
    handleChange('activeDays', updated);
  };

  // Image Upload to Base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Ukuran File Terlalu Besar', 'Maksimal ukuran logo adalah 2 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const base64 = event.target?.result as string;
      handleChange('logoUrl', base64);
      onShowToast('Logo Diperbarui', 'Logo sekolah berhasil dimuat secara lokal.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    handleChange('logoUrl', '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onShowToast('Pengaturan Disimpan', 'Data sekolah dan otomasi berhasil diperbarui.', 'success');
  };

  const handleEnableNotification = () => {
    scheduler.requestNotificationPermission();
    handleChange('browserNotifications', true);
    onShowToast('Izin Diminta', 'Permintaan izin notifikasi browser telah dikirim.', 'info');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Pengaturan Identitas Sekolah & Otomasi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil sekolah dasar, zona waktu, dan aturan pelaksanaan bel
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 self-start sm:self-auto min-h-[44px]"
        >
          <Save className="h-4 w-4" />
          <span>SIMPAN PENGATURAN</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Identitas Sekolah (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span>Identitas Sekolah Dasar</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Sekolah <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.schoolName}
              onChange={e => handleChange('schoolName', e.target.value)}
              placeholder="Contoh: UPTD SD NEGERI OEHENDAK"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold min-h-[42px] focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Nama ini akan ditampilkan pada header dan Mode Layar Bel.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Sekolah</label>
            <textarea
              rows={2}
              value={formData.schoolAddress}
              onChange={e => handleChange('schoolAddress', e.target.value)}
              placeholder="Alamat lengkap sekolah..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[42px] focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Operator / Guru Piket</label>
              <input
                type="text"
                value={formData.operatorName}
                onChange={e => handleChange('operatorName', e.target.value)}
                placeholder="Nama operator"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[42px]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={e => handleChange('phoneNumber', e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[42px]"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">Logo Sekolah</label>
            <div className="flex items-center gap-4">
              {formData.logoUrl ? (
                <div className="relative group">
                  <img
                    src={formData.logoUrl}
                    alt="Logo Sekolah"
                    className="h-16 w-16 rounded-2xl object-contain border border-slate-200 bg-slate-50 p-1"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700"
                    title="Hapus Logo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs text-center p-1">
                  Tanpa Logo
                </div>
              )}

              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 min-h-[42px]">
                  <Upload className="h-4 w-4" />
                  <span>Unggah Logo Sekolah</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <div className="text-[11px] text-slate-500 mt-1">
                  Format PNG/JPG/WebP, maksimal 2MB. Logo disimpan di perangkat (offline-ready).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Otomasi & Zona Waktu (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Timezone */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" />
              <span>Zona Waktu Sekolah</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan Zona Waktu:</label>
              <select
                value={formData.timezone}
                onChange={e => handleChange('timezone', e.target.value as SchoolSettings['timezone'])}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold min-h-[42px]"
              >
                <option value="Asia/Makassar">WITA - Indonesia Bagian Tengah (Asia/Makassar)</option>
                <option value="Asia/Jakarta">WIB - Indonesia Bagian Barat (Asia/Jakarta)</option>
                <option value="Asia/Jayapura">WIT - Indonesia Bagian Timur (Asia/Jayapura)</option>
                <option value="local">Waktu Lokal Perangkat (Sesuai Jam Komputer)</option>
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Secara default diatur ke <strong>WITA (Asia/Makassar)</strong> sesuai lingkungan sekolah.
              </span>
            </div>
          </div>

          {/* Automation Switches */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Pengaturan Otomatisasi Bel</span>
            </h3>

            {/* Master Switch */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Aktifkan Sistem Bel</span>
                <span className="text-[11px] text-slate-500">Saklar master pengendali seluruh bel</span>
              </div>
              <input
                type="checkbox"
                checked={formData.systemEnabled}
                onChange={e => handleChange('systemEnabled', e.target.checked)}
                className="h-5 w-5 rounded text-blue-600"
              />
            </div>

            {/* Auto Run */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Jalankan Otomatis</span>
                <span className="text-[11px] text-slate-500">Membunyikan bel otomatis sesuai jadwal</span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoRun}
                onChange={e => handleChange('autoRun', e.target.checked)}
                className="h-5 w-5 rounded text-blue-600"
              />
            </div>

            {/* Active Days */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">Hari Aktif Bel:</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DAYS.map(d => {
                  const isActive = formData.activeDays.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => handleToggleDay(d.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[38px] ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Browser Notifications */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Notifikasi Desktop Browser</span>
                <span className="text-[11px] text-slate-500">Munculkan banner di layar saat bel berbunyi</span>
              </div>
              <button
                type="button"
                onClick={handleEnableNotification}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-xs font-bold transition min-h-[38px]"
              >
                Izinkan
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
