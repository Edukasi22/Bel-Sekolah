import { ScheduleItem, SpecialSchedule, HolidayItem, BellLog } from '../types';
import { SAMPLE_SCHEDULES, SAMPLE_HOLIDAYS } from './storage';

const DB_NAME = 'BelSekolahSD_Database';
const DB_VERSION = 1;

const STORES = {
  SCHEDULES: 'schedules',
  SPECIAL_SCHEDULES: 'specialSchedules',
  HOLIDAYS: 'holidays',
  LOGS: 'logs',
};

class IndexedDBService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB tidak didukung pada browser ini.'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Store Jadwal Mingguan
        if (!db.objectStoreNames.contains(STORES.SCHEDULES)) {
          const scheduleStore = db.createObjectStore(STORES.SCHEDULES, { keyPath: 'id' });
          scheduleStore.createIndex('day', 'day', { unique: false });
          scheduleStore.createIndex('time', 'time', { unique: false });
        }

        // 2. Store Jadwal Khusus
        if (!db.objectStoreNames.contains(STORES.SPECIAL_SCHEDULES)) {
          const specialStore = db.createObjectStore(STORES.SPECIAL_SCHEDULES, { keyPath: 'id' });
          specialStore.createIndex('date', 'date', { unique: false });
        }

        // 3. Store Hari Libur
        if (!db.objectStoreNames.contains(STORES.HOLIDAYS)) {
          const holidayStore = db.createObjectStore(STORES.HOLIDAYS, { keyPath: 'id' });
          holidayStore.createIndex('date', 'date', { unique: false });
        }

        // 4. Store Riwayat Bel
        if (!db.objectStoreNames.contains(STORES.LOGS)) {
          const logStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // Diagnostic Test
  public async testConnection(): Promise<boolean> {
    try {
      const db = await this.getDB();
      return !!db;
    } catch {
      return false;
    }
  }

  // SCHEDULES (Jadwal Mingguan)
  public async getSchedules(): Promise<ScheduleItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SCHEDULES, 'readonly');
        const store = tx.objectStore(STORES.SCHEDULES);
        const req = store.getAll();

        req.onsuccess = () => {
          const result = req.result as ScheduleItem[];
          if (!result || result.length === 0) {
            // Cek apakah ada data di localStorage lama atau gunakan data contoh
            const fallbackRaw = localStorage.getItem('bel_sd_schedules_v1');
            if (fallbackRaw) {
              try {
                const parsed = JSON.parse(fallbackRaw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  this.saveSchedules(parsed).catch(() => {});
                  resolve(parsed);
                  return;
                }
              } catch {
                // ignore
              }
            }
            // Seed sample data
            this.saveSchedules(SAMPLE_SCHEDULES).catch(() => {});
            resolve(SAMPLE_SCHEDULES);
          } else {
            resolve(result);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback ke localStorage jika IndexedDB diblokir
      const raw = localStorage.getItem('bel_sd_schedules_v1');
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return SAMPLE_SCHEDULES;
        }
      }
      return SAMPLE_SCHEDULES;
    }
  }

  public async saveSchedules(schedules: ScheduleItem[]): Promise<void> {
    // Selalu sinkronkan ke localStorage sebagai secondary backup
    try {
      localStorage.setItem('bel_sd_schedules_v1', JSON.stringify(schedules));
    } catch {
      // ignore
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SCHEDULES, 'readwrite');
        const store = tx.objectStore(STORES.SCHEDULES);

        // Bersihkan store lama lalu isi ulang
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          for (const item of schedules) {
            store.put(item);
          }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Gagal menyimpan jadwal ke IndexedDB, menggunakan localStorage:', err);
    }
  }

  // SPECIAL SCHEDULES (Jadwal Khusus)
  public async getSpecialSchedules(): Promise<SpecialSchedule[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SPECIAL_SCHEDULES, 'readonly');
        const store = tx.objectStore(STORES.SPECIAL_SCHEDULES);
        const req = store.getAll();

        req.onsuccess = () => {
          const result = req.result as SpecialSchedule[];
          resolve(result || []);
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = localStorage.getItem('bel_sd_special_schedules_v1');
      return raw ? JSON.parse(raw) : [];
    }
  }

  public async saveSpecialSchedules(specials: SpecialSchedule[]): Promise<void> {
    try {
      localStorage.setItem('bel_sd_special_schedules_v1', JSON.stringify(specials));
    } catch {
      // ignore
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.SPECIAL_SCHEDULES, 'readwrite');
        const store = tx.objectStore(STORES.SPECIAL_SCHEDULES);
        store.clear().onsuccess = () => {
          for (const item of specials) {
            store.put(item);
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Gagal simpan jadwal khusus ke IndexedDB:', err);
    }
  }

  // HOLIDAYS (Hari Libur)
  public async getHolidays(): Promise<HolidayItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.HOLIDAYS, 'readonly');
        const store = tx.objectStore(STORES.HOLIDAYS);
        const req = store.getAll();

        req.onsuccess = () => {
          const result = req.result as HolidayItem[];
          if (!result || result.length === 0) {
            this.saveHolidays(SAMPLE_HOLIDAYS).catch(() => {});
            resolve(SAMPLE_HOLIDAYS);
          } else {
            resolve(result);
          }
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = localStorage.getItem('bel_sd_holidays_v1');
      return raw ? JSON.parse(raw) : SAMPLE_HOLIDAYS;
    }
  }

  public async saveHolidays(holidays: HolidayItem[]): Promise<void> {
    try {
      localStorage.setItem('bel_sd_holidays_v1', JSON.stringify(holidays));
    } catch {
      // ignore
    }

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.HOLIDAYS, 'readwrite');
        const store = tx.objectStore(STORES.HOLIDAYS);
        store.clear().onsuccess = () => {
          for (const item of holidays) {
            store.put(item);
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Gagal simpan hari libur ke IndexedDB:', err);
    }
  }

  // LOGS (Riwayat Bel)
  public async getLogs(): Promise<BellLog[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.LOGS, 'readonly');
        const store = tx.objectStore(STORES.LOGS);
        const req = store.getAll();

        req.onsuccess = () => {
          const result = (req.result as BellLog[]) || [];
          result.sort((a, b) => b.timestamp - a.timestamp);
          resolve(result);
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      const raw = localStorage.getItem('bel_sd_logs_v1');
      return raw ? JSON.parse(raw) : [];
    }
  }

  public async addLog(log: Omit<BellLog, 'id' | 'timestamp'>): Promise<BellLog> {
    const newLog: BellLog = {
      ...log,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };

    try {
      const db = await this.getDB();
      const tx = db.transaction(STORES.LOGS, 'readwrite');
      const store = tx.objectStore(STORES.LOGS);
      store.put(newLog);
    } catch {
      // fallback
      const old = localStorage.getItem('bel_sd_logs_v1');
      const list = old ? JSON.parse(old) : [];
      localStorage.setItem('bel_sd_logs_v1', JSON.stringify([newLog, ...list].slice(0, 200)));
    }

    return newLog;
  }

  public async clearLogs(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORES.LOGS, 'readwrite');
      tx.objectStore(STORES.LOGS).clear();
    } catch {
      localStorage.removeItem('bel_sd_logs_v1');
    }
  }

  // RESET ALL DATA IN INDEXEDDB
  public async resetAll(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(
        [STORES.SCHEDULES, STORES.SPECIAL_SCHEDULES, STORES.HOLIDAYS, STORES.LOGS],
        'readwrite'
      );
      tx.objectStore(STORES.SCHEDULES).clear();
      tx.objectStore(STORES.SPECIAL_SCHEDULES).clear();
      tx.objectStore(STORES.HOLIDAYS).clear();
      tx.objectStore(STORES.LOGS).clear();
    } catch (err) {
      console.warn('Gagal reset IndexedDB:', err);
    }
  }
}

export const indexedDb = new IndexedDBService();
