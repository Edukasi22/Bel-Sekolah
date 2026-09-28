import React, { useState, useEffect } from 'react';
import { SchoolSettings, NextBellInfo, ScheduleItem, SpecialSchedule } from '../types';
import { ClockState } from '../services/scheduler';
import { Bell, X, Maximize2, Minimize2, Volume2, Calendar, Clock, Sparkles } from 'lucide-react';

interface ScreenDisplayModeProps {
  onClose: () => void;
  clock: ClockState;
  nextBell: NextBellInfo;
  settings: SchoolSettings;
  isAudioUnlocked: boolean;
  onOpenManualBell: () => void;
  todaySchedules: Array<ScheduleItem | SpecialSchedule>;
}

export const ScreenDisplayMode: React.FC<ScreenDisplayModeProps> = ({
  onClose,
  clock,
  nextBell,
  settings,
  isAudioUnlocked,
  onOpenManualBell,
  todaySchedules,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Find current running activity if any
  const currentTimeHHmm = `${clock.hours}:${clock.minutes}`;
  const pastSchedules = todaySchedules.filter(s => s.time <= currentTimeHHmm);
  const currentActivity = pastSchedules.length > 0 ? pastSchedules[pastSchedules.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Top Bar: School Branding & Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-2xl bg-white/10 p-1.5 border border-white/20 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-blue-600 flex items-center justify-center text-amber-300 shrink-0 shadow-lg">
              <Bell className="h-8 w-8 sm:h-10 sm:w-10 fill-current" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white uppercase drop-shadow-md truncate">
              {settings.schoolName || 'UPTD SD NEGERI OEHENDAK'}
            </h1>
            <p className="text-sm sm:text-base font-semibold text-blue-200 mt-0.5">
              SISTEM BEL SEKOLAH OTOMATIS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenManualBell}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg transition flex items-center gap-2 min-h-[44px]"
          >
            <Bell className="h-4 w-4 fill-current text-amber-300" />
            <span>BEL MANUAL</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Tutup Mode Layar Bel (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Center Section: GIANT DIGITAL CLOCK */}
      <div className="my-auto text-center py-6">
        <div className="text-lg sm:text-2xl font-bold uppercase tracking-widest text-amber-400 drop-shadow-sm flex items-center justify-center gap-2 mb-2">
          <Calendar className="h-6 w-6" />
          <span>{clock.dateFormatted}</span>
        </div>

        {/* Huge 24-hr Time */}
        <div className="font-mono font-black tracking-tighter text-7xl sm:text-9xl md:text-[11rem] leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] select-none">
          <span>{clock.hours}</span>
          <span className="text-amber-400 animate-pulse">:</span>
          <span>{clock.minutes}</span>
          <span className="text-amber-400 animate-pulse">:</span>
          <span className="text-blue-300 text-6xl sm:text-8xl md:text-[9rem]">{clock.seconds}</span>
        </div>

        {currentActivity && (
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-blue-100 text-sm sm:text-base font-semibold">
            <span>Kegiatan Sekarang:</span>
            <span className="text-amber-300 font-bold">{currentActivity.title}</span>
          </div>
        )}
      </div>

      {/* Bottom Section: NEXT BELL & COUNTDOWN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Next Bell Card */}
        <div className="md:col-span-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-200 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              BEL BERIKUTNYA
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
              {nextBell.type.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-4">
            <span className="font-mono font-black text-4xl sm:text-6xl text-white">
              {nextBell.time}
            </span>
            <span className="text-lg sm:text-2xl font-bold text-amber-300 truncate">
              {nextBell.title}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${nextBell.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Big Countdown Card */}
        <div className="md:col-span-6 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 backdrop-blur-md border border-white/20 rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              HITUNG MUNDUR (COUNTDOWN)
            </span>
            <div className="flex items-center gap-2 text-xs font-bold">
              {isAudioUnlocked ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  SISTEM AKTIF
                </span>
              ) : (
                <span className="text-amber-400">PERLU AKTIVASI</span>
              )}
            </div>
          </div>

          <div className="mt-2 text-center md:text-right">
            <div className="font-mono font-black text-5xl sm:text-7xl text-white tracking-tight drop-shadow-md">
              {nextBell.formattedCountdown}
            </div>
            <span className="text-xs text-blue-200 mt-1 block">
              Menuju bel berbunyi otomatis
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
