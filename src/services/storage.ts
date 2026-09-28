import { ScheduleItem, SpecialSchedule, HolidayItem, BellLog, SchoolSettings, DayOfWeek } from '../types';
import { indexedDb } from './indexedDb';

const STORAGE_KEYS = {
  SCHEDULES: 'bel_sd_schedules_v1',
  SPECIAL_SCHEDULES: 'bel_sd_special_schedules_v1',
  HOLIDAYS: 'bel_sd_holidays_v1',
  LOGS: 'bel_sd_logs_v1',
  SETTINGS: 'bel_sd_settings_v1',
  HAS_INITIALIZED: 'bel_sd_has_initialized_v1',
  LAST_TRIGGERED: 'bel_sd_last_triggered_v1',
};

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'UPTD SD NEGERI OEHENDAK',
  schoolAddress: 'Jl. Pendidikan No. 12, Indonesia',
  operatorName: 'Bpk. Operator Sekolah',
  phoneNumber: '0812-3456-7890',
  logoUrl: '',
  timezone: 'Asia/Makassar',
  systemEnabled: true,
  autoRun: true,
  playBellSound: true,
  playAnnouncement: true,
  activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  bellVolume: 90,
  speechVolume: 100,
  speechRate: 0.95,
  speechPitch: 1.0,
  bellDelaySeconds: 1.0,
  bellChimeType: 'westminster',
  selectedVoiceURI: '',
  browserNotifications: true,
};

// Standard Indonesian Primary School sample schedules
export const SAMPLE_SCHEDULES: ScheduleItem[] = [
  // SENIN
  {
    id: 'sch-mon-1',
    day: 'monday',
    time: '07:00',
    title: 'Upacara Bendera',
    type: 'upacara',
    message: 'Bel upacara bendera hari Senin. Selamat pagi bapak ibu guru dan anak-anak, seluruh siswa dipersilakan menuju ke lapangan upacara dengan tertib dan rapi.',
    enabled: true,
  },
  {
    id: 'sch-mon-2',
    day: 'monday',
    time: '07:45',
    title: 'Jam Pelajaran 1',
    type: 'masuk',
    message: 'Bel masuk kelas jam pelajaran pertama dimulai. Selamat belajar anak-anak.',
    enabled: true,
  },
  {
    id: 'sch-mon-3',
    day: 'monday',
    time: '08:20',
    title: 'Jam Pelajaran 2',
    type: 'pergantian',
    message: 'Bel pergantian jam pelajaran kedua. Silakan bersiap untuk mengikuti pelajaran berikutnya.',
    enabled: true,
  },
  {
    id: 'sch-mon-4',
    day: 'monday',
    time: '08:55',
    title: 'Jam Pelajaran 3',
    type: 'pergantian',
    message: 'Bel pergantian jam pelajaran ketiga. Silakan ikuti instruksi guru pengajar.',
    enabled: true,
  },
  {
    id: 'sch-mon-5',
    day: 'monday',
    time: '09:30',
    title: 'Istirahat Pertama',
    type: 'istirahat',
    message: 'Bel istirahat pertama. Anak-anak dipersilakan beristirahat dan tetap menjaga kebersihan lingkungan sekolah.',
    enabled: true,
  },
  {
    id: 'sch-mon-6',
    day: 'monday',
    time: '09:50',
    title: 'Selesai Istirahat 1',
    type: 'selesai_istirahat',
    message: 'Bel selesai istirahat. Waktu istirahat telah selesai, anak-anak dipersilakan kembali ke kelas masing-masing.',
    enabled: true,
  },
  {
    id: 'sch-mon-7',
    day: 'monday',
    time: '10:25',
    title: 'Jam Pelajaran 4',
    type: 'pergantian',
    message: 'Bel pergantian jam pelajaran keempat. Silakan lanjutkan kegiatan belajar.',
    enabled: true,
  },
  {
    id: 'sch-mon-8',
    day: 'monday',
    time: '11:00',
    title: 'Jam Pelajaran 5',
    type: 'pergantian',
    message: 'Bel pergantian jam pelajaran kelima. Tetap semangat belajar anak-anak.',
    enabled: true,
  },
  {
    id: 'sch-mon-9',
    day: 'monday',
    time: '11:35',
    title: 'Istirahat Kedua',
    type: 'istirahat',
    message: 'Bel istirahat kedua. Silakan makan siang dan beristirahat sejenak.',
    enabled: true,
  },
  {
    id: 'sch-mon-10',
    day: 'monday',
    time: '11:55',
    title: 'Selesai Istirahat 2',
    type: 'selesai_istirahat',
    message: 'Bel selesai istirahat. Silakan kembali ke ruang kelas dengan tertib.',
    enabled: true,
  },
  {
    id: 'sch-mon-11',
    day: 'monday',
    time: '12:30',
    title: 'Pulang Sekolah',
    type: 'pulang',
    message: 'Bel pulang sekolah. Kegiatan pembelajaran hari ini telah selesai. Rapikan meja belajarmu, berdoa, berhati-hati di jalan dan sampai jumpa esok hari.',
    enabled: true,
  },

  // SELASA
  {
    id: 'sch-tue-1',
    day: 'tuesday',
    time: '07:00',
    title: 'Masuk Sekolah',
    type: 'masuk',
    message: 'Bel masuk sekolah. Selamat pagi anak-anak, silakan masuk ke kelas masing-masing dan bersiap mengikuti doa pagi.',
    enabled: true,
  },
  {
    id: 'sch-tue-2',
    day: 'tuesday',
    time: '08:10',
    title: 'Pergantian Jam Pelajaran',
    type: 'pergantian',
    message: 'Bel pergantian jam pelajaran. Silakan bersiap untuk mengikuti pelajaran berikutnya.',
    enabled: true,
  },
  {
    id: 'sch-tue-3',
    day: 'tuesday',
    time: '09:40',
    title: 'Istirahat',
    type: 'istirahat',
    message: 'Bel istirahat. Anak-anak dipersilakan beristirahat dan menikmati makanan dengan tertib.',
    enabled: true,
  },
  {
    id: 'sch-tue-4',
    day: 'tuesday',
    time: '10:00',
    title: 'Selesai Istirahat',
    type: 'selesai_istirahat',
    message: 'Bel selesai istirahat. Silakan segera kembali ke kelas masing-masing.',
    enabled: true,
  },
  {
    id: 'sch-tue-5',
    day: 'tuesday',
    time: '12:30',
    title: 'Pulang Sekolah',
    type: 'pulang',
    message: 'Bel pulang sekolah. Kegiatan belajar hari ini telah selesai. Selamat siang dan hati-hati di perjalanan.',
    enabled: true,
  },

  // RABU
  {
    id: 'sch-wed-1',
    day: 'wednesday',
    time: '07:00',
    title: 'Masuk Sekolah (Literasi)',
    type: 'masuk',
    message: 'Bel masuk sekolah. Selamat pagi anak-anak, silakan membaca buku literasi pagi selama 15 menit.',
    enabled: true,
  },
  {
    id: 'sch-wed-2',
    day: 'wednesday',
    time: '08:10',
    title: 'Pergantian Jam Pelajaran',
    type: 'pergantian',
    message: 'Bel pergantian jam pelajaran. Silakan bersiap untuk pelajaran selanjutnya.',
    enabled: true,
  },
  {
    id: 'sch-wed-3',
    day: 'wednesday',
    time: '09:40',
    title: 'Istirahat',
    type: 'istirahat',
    message: 'Bel istirahat. Anak-anak dipersilakan beristirahat.',
    enabled: true,
  },
  {
    id: 'sch-wed-4',
    day: 'wednesday',
    time: '10:00',
    title: 'Selesai Istirahat',
    type: 'selesai_istirahat',
    message: 'Bel selesai istirahat. Silakan kembali ke ruang kelas.',
    enabled: true,
  },
  {
    id: 'sch-wed-5',
    day: 'wednesday',
    time: '12:30',
    title: 'Pulang Sekolah',
    type: 'pulang',
    message: 'Bel pulang sekolah. Kegiatan pembelajaran telah selesai. Hati-hati di perjalanan pulang.',
    enabled: true,
  },

  // KAMIS
  {
    id: 'sch-thu-1',
    day: 'thursday',
    time: '07:00',
    title: 'Masuk Sekolah',
    type: 'masuk',
    message: 'Bel masuk sekolah. Selamat pagi anak-anak, silakan masuk ke kelas masing-masing.',
    enabled: true,
  },
  {
    id: 'sch-thu-2',
    day: 'thursday',
    time: '09:40',
    title: 'Istirahat',
    type: 'istirahat',
    message: 'Bel istirahat. Anak-anak dipersilakan beristirahat.',
    enabled: true,
  },
  {
    id: 'sch-thu-3',
    day: 'thursday',
    time: '10:00',
    title: 'Selesai Istirahat',
    type: 'selesai_istirahat',
    message: 'Bel selesai istirahat. Silakan kembali ke kelas.',
    enabled: true,
  },
  {
    id: 'sch-thu-4',
    day: 'thursday',
    time: '12:30',
    title: 'Pulang Sekolah',
    type: 'pulang',
    message: 'Bel pulang sekolah. Sampai jumpa besok hari.',
    enabled: true,
  },

  // JUMAT
  {
    id: 'sch-fri-1',
    day: 'friday',
    time: '07:00',
    title: 'Senam Pagi / Jumat Bersih',
    type: 'khusus',
    message: 'Bel kegiatan Jumat pagi. Seluruh guru dan siswa dipersilakan berkumpul di halaman untuk senam pagi bersama.',
    enabled: true,
  },
  {
    id: 'sch-fri-2',
    day: 'friday',
    time: '07:45',
    title: 'Jam Pelajaran 1',
    type: 'masuk',
    message: 'Bel masuk jam pelajaran pertama hari Jumat. Silakan masuk ke kelas.',
    enabled: true,
  },
  {
    id: 'sch-fri-3',
    day: 'friday',
    time: '09:00',
    title: 'Istirahat Jumat',
    type: 'istirahat',
    message: 'Bel istirahat. Anak-anak dipersilakan beristirahat sejenak.',
    enabled: true,
  },
  {
    id: 'sch-fri-4',
    day: 'friday',
    time: '09:20',
    title: 'Selesai Istirahat',
    type: 'selesai_istirahat',
    message: 'Bel selesai istirahat. Silakan kembali ke kelas.',
    enabled: true,
  },
  {
    id: 'sch-fri-5',
    day: 'friday',
    time: '11:00',
    title: 'Pulang Hari Jumat',
    type: 'pulang',
    message: 'Bel pulang hari Jumat. Pembelajaran hari ini selesai. Bagi siswa muslim dipersilakan bersiap menunaikan ibadah Sholat Jumat.',
    enabled: true,
  },

  // SABTU
  {
    id: 'sch-sat-1',
    day: 'saturday',
    time: '07:00',
    title: 'Masuk / Pramuka & Ekstrakurikuler',
    type: 'khusus',
    message: 'Bel masuk kegiatan Sabtu. Selamat pagi, silakan bersiap mengikuti kegiatan ekstrakurikuler dan pramuka.',
    enabled: true,
  },
  {
    id: 'sch-sat-2',
    day: 'saturday',
    time: '09:30',
    title: 'Istirahat',
    type: 'istirahat',
    message: 'Bel istirahat. Silakan beristirahat.',
    enabled: true,
  },
  {
    id: 'sch-sat-3',
    day: 'saturday',
    time: '11:00',
    title: 'Pulang Ekstrakurikuler',
    type: 'pulang',
    message: 'Bel kegiatan selesai. Selamat berakhir pekan bersama keluarga dan sampai jumpa hari Senin.',
    enabled: true,
  },
];

export const SAMPLE_HOLIDAYS: HolidayItem[] = [
  { id: 'hol-1', date: '2026-08-17', name: 'Hari Kemerdekaan RI Ke-81', description: 'Libur Nasional Kemerdekaan RI' },
  { id: 'hol-2', date: '2026-12-25', name: 'Hari Raya Natal', description: 'Libur Nasional Hari Natal' },
  { id: 'hol-3', date: '2026-01-01', name: 'Tahun Baru Masehi', description: 'Tahun Baru' },
  { id: 'hol-4', date: '2026-05-01', name: 'Hari Buruh Internasional', description: 'Libur Nasional' },
  { id: 'hol-5', date: '2026-05-02', name: 'Hari Pendidikan Nasional', description: 'Peringatan Hardiknas' },
];

class StorageService {
  // Check if first initialization
  public hasInitialized(): boolean {
    return localStorage.getItem(STORAGE_KEYS.HAS_INITIALIZED) === 'true';
  }

  public setInitialized(hasInit: boolean): void {
    localStorage.setItem(STORAGE_KEYS.HAS_INITIALIZED, hasInit ? 'true' : 'false');
  }

  // Schedules
  public getSchedules(): ScheduleItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (!raw) {
      return SAMPLE_SCHEDULES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SAMPLE_SCHEDULES;
    }
  }

  public saveSchedules(schedules: ScheduleItem[]): void {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    indexedDb.saveSchedules(schedules).catch(() => {});
  }

  // Special Schedules
  public getSpecialSchedules(): SpecialSchedule[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SPECIAL_SCHEDULES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveSpecialSchedules(schedules: SpecialSchedule[]): void {
    localStorage.setItem(STORAGE_KEYS.SPECIAL_SCHEDULES, JSON.stringify(schedules));
    indexedDb.saveSpecialSchedules(schedules).catch(() => {});
  }

  // Holidays
  public getHolidays(): HolidayItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    if (!raw) return SAMPLE_HOLIDAYS;
    try {
      return JSON.parse(raw);
    } catch {
      return SAMPLE_HOLIDAYS;
    }
  }

  public saveHolidays(holidays: HolidayItem[]): void {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
    indexedDb.saveHolidays(holidays).catch(() => {});
  }

  // School Settings (disimpan di LocalStorage untuk konfigurasi sederhana sesuai requirement)
  public getSettings(): SchoolSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SCHOOL_SETTINGS;
    try {
      return { ...DEFAULT_SCHOOL_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SCHOOL_SETTINGS;
    }
  }

  public saveSettings(settings: SchoolSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // History / Logs
  public getLogs(): BellLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public addLog(log: Omit<BellLog, 'id' | 'timestamp'>): BellLog {
    const logs = this.getLogs();
    const newLog: BellLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };
    // Keep max 200 logs
    const updated = [newLog, ...logs].slice(0, 200);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    indexedDb.addLog(log).catch(() => {});
    return newLog;
  }

  public clearLogs(): void {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    indexedDb.clearLogs().catch(() => {});
  }

  // Backup & Restore
  public createBackupJSON(): string {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      schedules: this.getSchedules(),
      specialSchedules: this.getSpecialSchedules(),
      holidays: this.getHolidays(),
      logs: this.getLogs(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  public restoreBackup(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || (!data.schedules && !data.settings)) {
        return { success: false, message: 'Format file cadangan tidak valid (struktur data tidak sesuai).' };
      }

      if (Array.isArray(data.schedules)) {
        this.saveSchedules(data.schedules);
      }
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings({ ...DEFAULT_SCHOOL_SETTINGS, ...data.settings });
      }
      if (Array.isArray(data.specialSchedules)) {
        this.saveSpecialSchedules(data.specialSchedules);
      }
      if (Array.isArray(data.holidays)) {
        this.saveHolidays(data.holidays);
      }
      if (Array.isArray(data.logs)) {
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
      }

      return {
        success: true,
        message: 'Data berhasil dipulihkan dari cadangan.',
        count: Array.isArray(data.schedules) ? data.schedules.length : 0,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan parsing file';
      return { success: false, message: `Gagal membaca file backup: ${msg}` };
    }
  }

  // Reset all data
  public resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.SPECIAL_SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.HOLIDAYS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.LAST_TRIGGERED);
    this.setInitialized(false);
    indexedDb.resetAll().catch(() => {});
  }

  // Export to CSV
  public exportSchedulesToCSV(schedules: ScheduleItem[]): string {
    const headers = ['ID', 'Hari', 'Jam', 'Nama Kegiatan', 'Jenis', 'Pesan Suara', 'Aktif'];
    const rows = schedules.map(s => [
      `"${s.id}"`,
      `"${s.day}"`,
      `"${s.time}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.type}"`,
      `"${s.message.replace(/"/g, '""')}"`,
      s.enabled ? '1' : '0',
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  // Import from CSV
  public importSchedulesFromCSV(csvText: string): { success: boolean; count: number; message: string } {
    try {
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        return { success: false, count: 0, message: 'File CSV kosong atau tidak memiliki baris data.' };
      }

      const imported: ScheduleItem[] = [];
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitter handling quotes
        const match = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
        if (!match || match.length < 5) continue;

        const clean = match.map(m => {
          let str = m.replace(/^,/, '').trim();
          if (str.startsWith('"') && str.endsWith('"')) {
            str = str.slice(1, -1).replace(/""/g, '"');
          }
          return str;
        });

        const day = (clean[1]?.toLowerCase() as DayOfWeek) || 'monday';
        const time = clean[2]?.slice(0, 5) || '07:00';
        const title = clean[3] || 'Kegiatan Bel';
        const type = (clean[4] as ScheduleItem['type']) || 'masuk';
        const message = clean[5] || title;
        const enabled = clean[6] === '1' || clean[6]?.toLowerCase() === 'true';

        imported.push({
          id: clean[0] || `sch-imp-${Date.now()}-${i}`,
          day,
          time,
          title,
          type,
          message,
          enabled,
        });
      }

      if (imported.length === 0) {
        return { success: false, count: 0, message: 'Tidak ada baris jadwal yang valid dalam CSV.' };
      }

      // Merge with existing schedules
      const existing = this.getSchedules();
      const existingIds = new Set(existing.map(s => s.id));
      const finalSchedules = [...existing];

      for (const item of imported) {
        if (!existingIds.has(item.id)) {
          finalSchedules.push(item);
        } else {
          // Replace matching ID
          const idx = finalSchedules.findIndex(s => s.id === item.id);
          if (idx !== -1) finalSchedules[idx] = item;
        }
      }

      this.saveSchedules(finalSchedules);
      return {
        success: true,
        count: imported.length,
        message: `Berhasil mengimpor ${imported.length} jadwal dari file CSV.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan parsing CSV';
      return { success: false, count: 0, message: `Gagal impor CSV: ${msg}` };
    }
  }
}

export const storage = new StorageService();
