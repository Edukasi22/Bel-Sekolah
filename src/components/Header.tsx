import React, { useState } from 'react';
import { SchoolSettings } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { soundEngine } from '../services/soundEngine';
import { Bell, Maximize2, Minimize2, Tv, Download, Menu, Sparkles, Volume2 } from 'lucide-react';

interface HeaderProps {
  settings: SchoolSettings;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onOpenScreenMode: () => void;
  onToggleSidebar: () => void;
  isTestMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isAudioUnlocked,
  onUnlockAudio,
  onOpenScreenMode,
  onToggleSidebar,
  isTestMode,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Left side: Hamburger + School Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* School Logo / Default Bell Badge */}
          <div className="flex items-center gap-3 min-w-0">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo Sekolah"
                className="h-10 w-10 rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-xs shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 flex items-center justify-center text-amber-400 shadow-xs shrink-0">
                <Bell className="h-5 w-5 fill-current" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight truncate">
                  BEL SEKOLAH SD
                </h1>
                {settings.schoolName && (
                  <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 truncate max-w-[200px] xl:max-w-xs">
                    {settings.schoolName}
                  </span>
                )}
                {isTestMode && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                    <Sparkles className="h-3 w-3" /> MODE TEST
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                Sistem Bel Sekolah Otomatis Berbasis Web & PWA
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Indicators & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Online/Offline Status */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* Bell System Ready Status */}
          {isAudioUnlocked ? (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>SISTEM BEL AKTIF</span>
            </div>
          ) : (
            <button
              onClick={onUnlockAudio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition min-h-[40px] animate-bounce"
              title="Klik untuk mengaktifkan audio browser"
            >
              <Volume2 className="h-4 w-4" />
              <span>AKTIFKAN BEL</span>
            </button>
          )}

          {/* In-App PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition min-h-[40px]"
              title="Pasang aplikasi di desktop atau layar utama"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pasang PWA</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <>
              <button
                onClick={() => setShowIOSModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 min-h-[40px]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Pasang iOS</span>
              </button>

              {showIOSModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                  <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800">
                    <h3 className="text-base font-bold text-slate-900">
                      Pasang di iPhone / iPad
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      1. Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah alat Safari.<br />
                      2. Gulir ke bawah lalu ketuk <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                    </p>
                    <button
                      onClick={() => setShowIOSModal(false)}
                      className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                    >
                      Mengerti
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mode Layar Bel (Screen Display Mode for Hallways / Projectors) */}
          <button
            onClick={onOpenScreenMode}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-semibold transition min-h-[40px]"
            title="Buka tampilan layar besar untuk proyektor / speaker sekolah"
          >
            <Tv className="h-4 w-4" />
            <span className="hidden md:inline">Layar Bel</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition min-h-[40px] min-w-[40px]"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
