import React from 'react';
import { ClockState } from '../services/scheduler';
import { SchoolSettings, NextBellInfo, ScheduleItem, SpecialSchedule, HolidayItem, AudioReadinessState } from '../types';
import { soundEngine } from '../services/soundEngine';
import {
  Clock,
  Bell,
  Play,
  Volume2,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Palmtree,
  VolumeX,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Mic,
} from 'lucide-react';

interface DashboardViewProps {
  clock: ClockState;
  nextBell: NextBellInfo;
  todaySchedules: Array<ScheduleItem | SpecialSchedule>;
  settings: SchoolSettings;
  isAudioUnlocked: boolean;
  audioReadiness?: AudioReadinessState;
  missingFiles?: string[];
  onNavigateToSounds?: () => void;
  onUnlockAudio: () => void;
  onOpenManualBell: () => void;
  todayHoliday: HolidayItem | null;
  missedWarning: Array<{ title: string; time: string }> | null;
  onDismissMissedWarning: () => void;
  onPreviewSchedule: (item: ScheduleItem | SpecialSchedule) => void;
  isTestMode: boolean;
  onTriggerNextNow: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  clock,
  nextBell,
  todaySchedules,
  settings,
  isAudioUnlocked,
  audioReadiness = 'AUDIO_READY',
  missingFiles = [],
  onNavigateToSounds,
  onUnlockAudio,
  onOpenManualBell,
  todayHoliday,
  missedWarning,
  onDismissMissedWarning,
  onPreviewSchedule,
  isTestMode,
  onTriggerNextNow,
}) => {
  // Calculate completed count
  const currentTimeHHmm = `${clock.hours}:${clock.minutes}`;
  const totalCount = todaySchedules.length;
  const completedCount = todaySchedules.filter(s => s.time < currentTimeHHmm).length;

  const handleTestSound = async () => {
    if (!isAudioUnlocked) {
      await onUnlockAudio();
    }
    await soundEngine.executeSequence(
      'Uji coba suara bel sekolah. Sistem siap beroperasi.',
      settings,
      'both'
    );
  };

  const handleStopSound = () => {
    soundEngine.stopSound();
  };

  return (
    <div className="space-y-6">
      {/* Autoplay Browser Activation Alert Banner */}
      {!isAudioUnlocked && (
        <div className="rounded-2xl bg-amber-500 p-5 text-white shadow-lg border border-amber-600 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Volume2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">AKTIFKAN SISTEM BEL SEKARANG</h2>
              <p className="text-xs text-amber-100 mt-0.5">
                Browser membatasi suara otomatis sebelum Anda berinteraksi. Klik tombol berikut agar sistem membuka audio, memvalidasi file suara, dan siap berjalan otomatis.
              </p>
            </div>
          </div>
          <button
            onClick={onUnlockAudio}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-white text-amber-800 font-bold text-sm shadow-md hover:bg-amber-50 active:scale-95 transition min-h-[44px] shrink-0"
          >
            [ AKTIFKAN BEL SEKARANG ]
          </button>
        </div>
      )}

      {/* Status Suara Sekolah (Requirement #8: Audio Preload & Readiness) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              audioReadiness === 'AUDIO_READY' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {audioReadiness === 'AUDIO_READY' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                SUARA SEKOLAH
              </span>
              {audioReadiness === 'AUDIO_READY' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  ✓ Siap digunakan offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                  ⚠️ Audio belum lengkap ({missingFiles.length} berkas)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {audioReadiness === 'AUDIO_READY'
                ? 'Seluruh rekaman suara pengumuman wanita dan nada bel telah terverifikasi di IndexedDB & Cache Storage.'
                : `Berkas belum ada: ${missingFiles.slice(0, 3).join(', ')}${
                    missingFiles.length > 3 ? '...' : ''
                  }. Pengumuman dapat dilengkapi melalui menu Pengaturan Suara.`}
            </p>
          </div>
        </div>

        {audioReadiness !== 'AUDIO_READY' && onNavigateToSounds && (
          <button
            onClick={onNavigateToSounds}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition shrink-0 min-h-[40px] flex items-center gap-1.5 justify-center"
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Lengkapi Suara Wanita</span>
          </button>
        )}
      </div>

      {/* Sleep Detection Banner */}
      {missedWarning && missedWarning.length > 0 && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex items-start justify-between gap-3 text-blue-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block text-sm mb-0.5">Pemberitahuan: Laptop Baru Bangun dari Mode Sleep</span>
              Ditemukan {missedWarning.length} jadwal bel pada waktu tidur laptop:{' '}
              <strong>{missedWarning.map(m => `${m.title} (${m.time})`).join(', ')}</strong>.
              Sistem telah mencatatnya sebagai riwayat terlewat agar speaker sekolah tidak berbunyi berurutan secara mendadak.
            </div>
          </div>
          <button
            onClick={onDismissMissedWarning}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 transition min-h-[44px]"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Holiday Alert Banner */}
      {todayHoliday && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-4 text-emerald-900 flex items-center gap-3 shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Palmtree className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-1.5">
              <span>🏖️ HARI LIBUR SEKOLAH:</span>
              <span className="text-emerald-800">{todayHoliday.name}</span>
            </div>
            <p className="text-xs text-emerald-700 mt-0.5">
              Bel otomatis dijeda untuk hari ini. Bel manual tetap dapat dijalankan kapan saja jika diperlukan.
            </p>
          </div>
        </div>
      )}

      {/* Top Section: Digital Clock & Next Bell Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Big Digital Clock Card (5 cols on lg) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between">
          {/* Subtle background decoration */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none blur-xl" />
          <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-amber-400/10 pointer-events-none blur-lg" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-400" />
                JAM DIGITAL SEKOLAH
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-blue-100 border border-white/10">
                {settings.timezone === 'local' ? 'Lokal' : settings.timezone.replace('Asia/', '')} (24 Jam)
              </span>
            </div>

            {/* Giant 24h Clock Display */}
            <div className="my-5 flex items-baseline justify-center sm:justify-start gap-1 font-mono tracking-tight font-extrabold select-none">
              <span className="text-5xl sm:text-6xl text-white drop-shadow-sm">{clock.hours}</span>
              <span className="text-4xl sm:text-5xl text-amber-400 animate-pulse">:</span>
              <span className="text-5xl sm:text-6xl text-white drop-shadow-sm">{clock.minutes}</span>
              <span className="text-4xl sm:text-5xl text-amber-400 animate-pulse">:</span>
              <span className="text-3xl sm:text-4xl text-blue-200">{clock.seconds}</span>
            </div>

            <div className="text-sm sm:text-base font-semibold text-blue-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-300" />
              <span>{clock.dateFormatted}</span>
            </div>
          </div>

          {/* System status pill at bottom of clock card */}
          <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="text-blue-200">Kondisi Sistem:</span>
            {isAudioUnlocked ? (
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                🟢 SISTEM AKTIF
              </span>
            ) : (
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                🟡 BELUM DIAKTIFKAN
              </span>
            )}
          </div>
        </div>

        {/* Next Bell Card (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Bell className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  BEL BERIKUTNYA
                </span>
              </div>

              {nextBell.schedule && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                  {nextBell.type.replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                  {nextBell.time}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-1 line-clamp-1">
                  {nextBell.title}
                </h3>
              </div>

              {/* Big Countdown Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center sm:text-right shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Bel berbunyi dalam:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono tracking-tight block mt-0.5">
                  {nextBell.formattedCountdown}
                </span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            {nextBell.schedule && (
              <div className="mt-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                  <span>Progres menuju waktu bel:</span>
                  <span>{nextBell.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${nextBell.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Test Mode Quick Fire Action */}
          {isTestMode && nextBell.schedule && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Simulasi Jadwal
              </span>
              <button
                onClick={onTriggerNextNow}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 min-h-[36px]"
              >
                <Zap className="h-3.5 w-3.5" />
                Bunyikan Sekarang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle Section: Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Button 1: BEL MANUAL */}
        <button
          onClick={onOpenManualBell}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold shadow-md shadow-blue-700/20 hover:from-blue-700 hover:to-blue-800 active:scale-98 transition group min-h-[88px]"
        >
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Bell className="h-5 w-5 fill-current text-amber-300" />
          </div>
          <span className="text-xs sm:text-sm tracking-wide">🔔 BEL MANUAL</span>
        </button>

        {/* Button 2: TES SUARA */}
        <button
          onClick={handleTestSound}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold shadow-xs hover:bg-slate-50 hover:border-slate-300 active:scale-98 transition group min-h-[88px]"
        >
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Volume2 className="h-5 w-5" />
          </div>
          <span className="text-xs sm:text-sm tracking-wide">🔊 TES SUARA</span>
        </button>

        {/* Button 3: HENTIKAN SUARA */}
        <button
          onClick={handleStopSound}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold shadow-xs hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 active:scale-98 transition group min-h-[88px]"
        >
          <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <VolumeX className="h-5 w-5" />
          </div>
          <span className="text-xs sm:text-sm tracking-wide">🔇 HENTIKAN SUARA</span>
        </button>

        {/* Button 4: REKAP HARI INI */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-slate-200 text-slate-800 shadow-xs min-h-[88px]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Jadwal Hari Ini</span>
          <div className="text-lg sm:text-xl font-black text-slate-800 mt-0.5">
            <span className="text-blue-700">{completedCount}</span> / {totalCount} Selesai
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {totalCount - completedCount} bel tersisa
          </span>
        </div>
      </div>

      {/* Bottom Section: Today's Schedule Table / Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Daftar Jadwal Bel Hari Ini ({clock.dayName})</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan bel otomatis yang akan dibunyikan pada hari ini
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {todaySchedules.length} Kegiatan
          </span>
        </div>

        {todaySchedules.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="h-12 w-12 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-sm font-medium">Tidak ada jadwal bel aktif untuk hari ini.</p>
            <p className="text-xs text-slate-400 mt-1">
              Buka menu "Jadwal Bel" untuk menambahkan atau mengaktifkan jadwal hari {clock.dayName}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todaySchedules.map((item, idx) => {
              const isPast = item.time < currentTimeHHmm;
              const isNext = nextBell.schedule?.id === item.id;

              return (
                <div
                  key={item.id || idx}
                  className={`p-4 sm:px-6 flex items-center justify-between gap-4 transition-colors ${
                    isNext
                      ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                      : isPast
                      ? 'bg-slate-50/40 opacity-70'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Status Icon */}
                    <div className="shrink-0">
                      {isPast ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : isNext ? (
                        <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white animate-pulse">
                          <Bell className="h-3 w-3 fill-current text-amber-300" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="font-mono text-base sm:text-lg font-bold text-slate-900 shrink-0">
                      {item.time}
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {item.type}
                        </span>
                        {isNext && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            BERIKUTNYA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5 hidden sm:block">
                        {item.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onPreviewSchedule(item)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white hover:border-blue-400 hover:text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition min-h-[36px]"
                      title="Tes bunyikan bel dan pesan sekarang"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span className="hidden sm:inline">Tes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
