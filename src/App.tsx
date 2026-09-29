import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ScheduleItem,
  SpecialSchedule,
  HolidayItem,
  BellLog,
  SchoolSettings,
  NextBellInfo,
  AudioReadinessState,
} from './types';
import { storage, SAMPLE_SCHEDULES, DEFAULT_SCHOOL_SETTINGS } from './services/storage';
import { indexedDb } from './services/indexedDb';
import { scheduler, ClockState } from './services/scheduler';
import { soundEngine } from './services/soundEngine';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SystemStatusView } from './components/SystemStatusView';
import { ScheduleView } from './components/ScheduleView';
import { SpecialScheduleView } from './components/SpecialScheduleView';
import { HolidayView } from './components/HolidayView';
import { ManualBellModal } from './components/ManualBellModal';
import { SoundSettingsView } from './components/SoundSettingsView';
import { SchoolSettingsView } from './components/SchoolSettingsView';
import { HistoryView } from './components/HistoryView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { ScreenDisplayMode } from './components/ScreenDisplayMode';
import { BackupRestoreView } from './components/BackupRestoreView';
import { FirstRunModal } from './components/FirstRunModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScreenMode, setIsScreenMode] = useState(false);
  const [isManualBellOpen, setIsManualBellOpen] = useState(false);
  const [showFirstRunModal, setShowFirstRunModal] = useState(false);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  // Audio Readiness & Offline Voice State (Requirements #8, #9, #10, #20)
  const [audioReadiness, setAudioReadiness] = useState<AudioReadinessState>('AUDIO_INCOMPLETE');
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  const [missingAudioModal, setMissingAudioModal] = useState<{
    url: string;
    filename: string;
    label: string;
    type: string;
  } | null>(null);

  // App Data (Loaded from IndexedDB and LocalStorage)
  const [settings, setSettings] = useState<SchoolSettings>(() => storage.getSettings());
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => storage.getSchedules());
  const [specialSchedules, setSpecialSchedules] = useState<SpecialSchedule[]>(() => storage.getSpecialSchedules());
  const [holidays, setHolidays] = useState<HolidayItem[]>(() => storage.getHolidays());
  const [logs, setLogs] = useState<BellLog[]>(() => storage.getLogs());

  // Audio & Clock State
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [clock, setClock] = useState<ClockState>(() => scheduler.getClockState(settings));
  const [nextBell, setNextBell] = useState<NextBellInfo>(() => scheduler.getNextBellInfo(settings));
  const [todayHoliday, setTodayHoliday] = useState<HolidayItem | null>(() => scheduler.getTodayHoliday(settings));
  const [missedWarning, setMissedWarning] = useState<Array<{ title: string; time: string }> | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isOnline = useOnlineStatus();

  const addToast = useCallback((title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Muat data dari IndexedDB saat pertama kali dibuka untuk menjamin data offline
  useEffect(() => {
    const loadFromIndexedDB = async () => {
      try {
        const [idbSchedules, idbSpecials, idbHolidays, idbLogs] = await Promise.all([
          indexedDb.getSchedules(),
          indexedDb.getSpecialSchedules(),
          indexedDb.getHolidays(),
          indexedDb.getLogs(),
        ]);

        if (idbSchedules && idbSchedules.length > 0) {
          setSchedules(idbSchedules);
        }
        if (idbSpecials && idbSpecials.length > 0) {
          setSpecialSchedules(idbSpecials);
        }
        if (idbHolidays && idbHolidays.length > 0) {
          setHolidays(idbHolidays);
        }
        if (idbLogs && idbLogs.length > 0) {
          setLogs(idbLogs);
        }
      } catch (err) {
        console.warn('Inisialisasi IndexedDB fallback:', err);
      }
    };

    loadFromIndexedDB();
  }, []);

  // Listen for Service Worker update event
  useEffect(() => {
    const handleUpdate = () => {
      setSwUpdateAvailable(true);
      addToast('Pembaruan Tersedia', 'Versi baru aplikasi Bel Sekolah SD telah dicache.', 'info');
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, [addToast]);

  // Check first run initialization
  useEffect(() => {
    if (!storage.hasInitialized()) {
      setShowFirstRunModal(true);
    }
  }, []);

  // Refresh audio readiness state
  const refreshAudioReadiness = useCallback(async () => {
    try {
      const res = await soundEngine.checkAudioAssets();
      setAudioReadiness(res.state);
      setMissingFiles(res.missingFiles);
    } catch {
      setAudioReadiness('AUDIO_ERROR');
    }
  }, []);

  // Check audio readiness on initial startup and listen to missing audio events
  useEffect(() => {
    refreshAudioReadiness();

    const handleMissing = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setMissingAudioModal(detail);
    };

    window.addEventListener('audio-asset-missing', handleMissing);
    return () => window.removeEventListener('audio-asset-missing', handleMissing);
  }, [refreshAudioReadiness]);

  // Subscribe to audio engine status
  useEffect(() => {
    const unsub = soundEngine.subscribeStatus(ready => {
      setIsAudioUnlocked(ready);
    });
    return unsub;
  }, []);

  // Subscribe to missed schedule alerts (sleep detection)
  useEffect(() => {
    const unsubMissed = scheduler.onMissedSchedule(missed => {
      setMissedWarning(missed);
      setLogs(storage.getLogs());
    });

    const unsubTrigger = scheduler.onBellTrigger((item, isSpecial) => {
      addToast(
        '🔔 Bel Berbunyi',
        `${item.title} (${item.time}) sedang dijalankan.`,
        'success'
      );
      setLogs(storage.getLogs());
    });

    return () => {
      unsubMissed();
      unsubTrigger();
    };
  }, [addToast]);

  // Main 1-second Clock and Scheduler Loop
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Update Clock
      const newClock = scheduler.getClockState(settings);
      setClock(newClock);

      // 2. Check Sleep gap
      scheduler.checkSleepGap(settings);

      // 3. Trigger bell if time matches
      scheduler.checkAndTrigger(settings);

      // 4. Update Next Bell
      const nb = scheduler.getNextBellInfo(settings);
      setNextBell(nb);

      // 5. Update Today's Holiday
      const hol = scheduler.getTodayHoliday(settings);
      setTodayHoliday(hol);
    }, 1000);

    return () => clearInterval(timer);
  }, [settings]);

  // Unlock Audio Handler (Section 10: Unlock -> Preload -> Validate -> Ready)
  const handleUnlockAudio = async () => {
    const ok = await soundEngine.unlockAudio();
    await soundEngine.preloadAudioAssets();
    await refreshAudioReadiness();
    if (ok) {
      addToast(
        '🟢 Suara Bel Siap',
        'Audio browser diaktifkan, aset dipreload, dan divalidasi.',
        'success'
      );
    }
  };

  // Save Handlers
  const handleSaveSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleSaveSchedules = (newSchedules: ScheduleItem[]) => {
    setSchedules(newSchedules);
    storage.saveSchedules(newSchedules);
  };

  const handleSaveSpecialSchedules = (newSpecials: SpecialSchedule[]) => {
    setSpecialSchedules(newSpecials);
    storage.saveSpecialSchedules(newSpecials);
  };

  const handleSaveHolidays = (newHolidays: HolidayItem[]) => {
    setHolidays(newHolidays);
    storage.saveHolidays(newHolidays);
  };

  const handleClearLogs = () => {
    storage.clearLogs();
    setLogs([]);
  };

  const handleReloadAllData = () => {
    setSettings(storage.getSettings());
    setSchedules(storage.getSchedules());
    setSpecialSchedules(storage.getSpecialSchedules());
    setHolidays(storage.getHolidays());
    setLogs(storage.getLogs());
  };

  // Preview / Test Single Schedule
  const handlePreviewSchedule = async (item: ScheduleItem | SpecialSchedule) => {
    if (!isAudioUnlocked) await handleUnlockAudio();
    addToast('Uji Coba Bel', `Memainkan "${item.title}" (${item.time})...`, 'info');
    await soundEngine.executeSequence(item.message, settings, item.method || 'both');
  };

  // Manual Bell Logging
  const handleLogManualBell = (title: string, message: string) => {
    const newLog = storage.addLog({
      date: clock.dateISO,
      time: clock.timeStr,
      title,
      type: 'manual',
      message,
      status: 'Manual',
    });
    setLogs(prev => [newLog, ...prev]);
  };

  // First Run Handlers
  const handleUseSampleData = () => {
    storage.saveSchedules(SAMPLE_SCHEDULES);
    setSchedules(SAMPLE_SCHEDULES);
    storage.setInitialized(true);
    setShowFirstRunModal(false);
    addToast('Data Contoh Siap', 'Jadwal contoh SD berhasil dimuat.', 'success');
  };

  const handleStartEmpty = () => {
    storage.saveSchedules([]);
    setSchedules([]);
    storage.setInitialized(true);
    setShowFirstRunModal(false);
    addToast('Jadwal Kosong', 'Silakan tambahkan jadwal baru sesuai kebutuhan sekolah Anda.', 'info');
  };

  // Trigger Next Schedule Now (Test Mode action)
  const handleTriggerNextNow = () => {
    const success = scheduler.triggerNextScheduleNow(settings);
    if (!success) {
      addToast('Simulasi', 'Tidak ada jadwal tersisa hari ini untuk dibunyikan.', 'warning');
    }
  };

  // Today's Schedules for current day
  const todaySchedules = useMemo(() => {
    const regular = schedules.filter(s => s.enabled && s.day === clock.dayOfWeek);
    const specials = specialSchedules.filter(s => s.enabled && s.date === clock.dateISO);
    return [...specials, ...regular].sort((a, b) => a.time.localeCompare(b.time));
  }, [schedules, specialSchedules, clock.dayOfWeek, clock.dateISO]);

  // Export handlers
  const handleExportJSON = () => {
    const jsonStr = storage.createBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-bel-sekolah-${clock.dateISO}.json`;
    a.click();
    addToast('Ekspor Berhasil', 'File jadwal JSON berhasil diunduh.', 'success');
  };

  const handleExportCSV = () => {
    const csvStr = storage.exportSchedulesToCSV(schedules);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jadwal-bel-sekolah-${clock.dateISO}.csv`;
    a.click();
    addToast('Ekspor Berhasil', 'File jadwal CSV berhasil diunduh.', 'success');
  };

  const handleImportCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const res = storage.importSchedulesFromCSV(text);
      if (res.success) {
        setSchedules(storage.getSchedules());
        addToast('Impor Berhasil', res.message, 'success');
      } else {
        addToast('Impor Gagal', res.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const res = storage.restoreBackup(text);
      if (res.success) {
        handleReloadAllData();
        addToast('Impor Berhasil', res.message, 'success');
      } else {
        addToast('Impor Gagal', res.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Mode Layar Bel (Large Hallway / TV Display Overlay) */}
      {isScreenMode && (
        <ScreenDisplayMode
          onClose={() => setIsScreenMode(false)}
          clock={clock}
          nextBell={nextBell}
          settings={settings}
          isAudioUnlocked={isAudioUnlocked}
          onOpenManualBell={() => setIsManualBellOpen(true)}
          todaySchedules={todaySchedules}
        />
      )}

      {/* Manual Bell Modal */}
      <ManualBellModal
        isOpen={isManualBellOpen}
        onClose={() => setIsManualBellOpen(false)}
        settings={settings}
        isAudioUnlocked={isAudioUnlocked}
        onUnlockAudio={handleUnlockAudio}
        onShowToast={addToast}
        onLogManualBell={handleLogManualBell}
      />

      {/* First Run Initializer Modal */}
      <FirstRunModal
        isOpen={showFirstRunModal}
        onUseSampleData={handleUseSampleData}
        onStartEmpty={handleStartEmpty}
      />

      {/* App Header */}
      <Header
        settings={settings}
        isAudioUnlocked={isAudioUnlocked}
        audioReadiness={audioReadiness}
        onNavigateToSounds={() => setActiveTab('sound')}
        onUnlockAudio={handleUnlockAudio}
        onOpenScreenMode={() => setIsScreenMode(true)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isTestMode={isTestMode}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4">
          {/* PWA Update Banner */}
          {swUpdateAvailable && (
            <div className="rounded-2xl bg-indigo-600 text-white p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Versi Baru Bel Sekolah SD Telah Tersedia!</h4>
                  <p className="text-xs text-indigo-100">
                    Aplikasi dan cache telah diperbarui di latar belakang. Muat ulang halaman untuk menerapkan versi terbaru.
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-xs transition min-h-[40px] shrink-0"
              >
                Muat Ulang Sekarang
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              clock={clock}
              nextBell={nextBell}
              todaySchedules={todaySchedules}
              settings={settings}
              isAudioUnlocked={isAudioUnlocked}
              audioReadiness={audioReadiness}
              missingFiles={missingFiles}
              onNavigateToSounds={() => setActiveTab('sound')}
              onUnlockAudio={handleUnlockAudio}
              onOpenManualBell={() => setIsManualBellOpen(true)}
              todayHoliday={todayHoliday}
              missedWarning={missedWarning}
              onDismissMissedWarning={() => setMissedWarning(null)}
              onPreviewSchedule={handlePreviewSchedule}
              isTestMode={isTestMode}
              onTriggerNextNow={handleTriggerNextNow}
            />
          )}

          {activeTab === 'status' && (
            <SystemStatusView
              settings={settings}
              isAudioUnlocked={isAudioUnlocked}
              onUnlockAudio={handleUnlockAudio}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'schedules' && (
            <ScheduleView
              schedules={schedules}
              onSaveSchedules={handleSaveSchedules}
              onPreview={handlePreviewSchedule}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
              onImportCSV={handleImportCSV}
              onImportJSON={handleImportJSON}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'special' && (
            <SpecialScheduleView
              specialSchedules={specialSchedules}
              onSaveSpecialSchedules={handleSaveSpecialSchedules}
              onPreview={handlePreviewSchedule}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'holidays' && (
            <HolidayView
              holidays={holidays}
              onSaveHolidays={handleSaveHolidays}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'manual' && (
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setIsManualBellOpen(true)}
                className="w-full py-6 px-8 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-3"
              >
                <span>🔔 BUKA KONTROL BEL MANUAL</span>
              </button>
            </div>
          )}

          {activeTab === 'sound' && (
            <SoundSettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              isAudioUnlocked={isAudioUnlocked}
              onUnlockAudio={handleUnlockAudio}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'school' && (
            <SchoolSettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              logs={logs}
              onClearLogs={handleClearLogs}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'diagnostics' && (
            <DiagnosticsView
              clock={clock}
              settings={settings}
              isAudioUnlocked={isAudioUnlocked}
              onUnlockAudio={handleUnlockAudio}
              isTestMode={isTestMode}
              onToggleTestMode={setIsTestMode}
              onTriggerNextNow={handleTriggerNextNow}
              onShowToast={addToast}
            />
          )}

          {activeTab === 'backup' && (
            <BackupRestoreView
              onReloadAllData={handleReloadAllData}
              onShowToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Missing Audio Modal (Requirement #20) */}
      {missingAudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-2xl shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">⚠️ AUDIO TIDAK TERSEDIA</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{missingAudioModal.url}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Berkas rekaman suara wanita untuk <strong>{missingAudioModal.label}</strong> belum tersedia di folder offline (<code>public/audio/suara-wanita/</code>) maupun di IndexedDB.
            </p>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  setMissingAudioModal(null);
                  await soundEngine.playAnnouncement(missingAudioModal.type, settings);
                }}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 min-h-[40px]"
              >
                Coba Lagi
              </button>

              <button
                onClick={async () => {
                  const updated = { ...settings, voiceSource: 'tts' as const };
                  handleSaveSettings(updated);
                  setMissingAudioModal(null);
                  addToast('Mode TTS Diaktifkan', 'Pengumuman dialihkan ke Text-to-Speech browser.', 'info');
                  await soundEngine.playAnnouncement(missingAudioModal.type, updated);
                }}
                className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold min-h-[40px]"
              >
                Gunakan TTS
              </button>

              <button
                onClick={async () => {
                  setMissingAudioModal(null);
                  await soundEngine.playBell(settings);
                }}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 min-h-[40px]"
              >
                Bel Saja
              </button>

              <button
                onClick={() => {
                  setMissingAudioModal(null);
                  setActiveTab('sound');
                }}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold min-h-[40px]"
              >
                Pengaturan Suara
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Toast Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
          <span>Mode Offline Aktif — Seluruh jadwal dan suara tetap beroperasi dari perangkat lokal.</span>
        </div>
      )}
    </div>
  );
}
