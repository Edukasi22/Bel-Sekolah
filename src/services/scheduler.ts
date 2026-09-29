import { DayOfWeek, ScheduleItem, SpecialSchedule, HolidayItem, SchoolSettings, NextBellInfo } from '../types';
import { storage } from './storage';
import { soundEngine } from './soundEngine';

export interface ClockState {
  timeStr: string;         // "HH:mm:ss"
  hours: string;           // "07"
  minutes: string;         // "35"
  seconds: string;         // "24"
  dayName: string;         // "Senin"
  dateFormatted: string;   // "Senin, 28 September 2026"
  dayOfWeek: DayOfWeek;    // "monday"
  dateISO: string;         // "2026-09-28"
  timestamp: number;
}

const INDONESIAN_DAYS: Record<DayOfWeek, string> = {
  sunday: 'Minggu',
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
};

const DAY_INDEX_MAP: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type ScheduleTriggerCallback = (item: ScheduleItem | SpecialSchedule, isSpecial: boolean) => void;
type MissedScheduleCallback = (missedItems: Array<{ title: string; time: string }>) => void;

class SchedulerService {
  private timerId: number | null = null;
  private lastTickTimestamp: number = Date.now();
  private triggeredKeys: Set<string> = new Set();
  private triggerListeners: ScheduleTriggerCallback[] = [];
  private missedListeners: MissedScheduleCallback[] = [];
  
  // Test Mode simulation
  private isTestMode: boolean = false;
  private simulatedOffsetMs: number = 0; // Simulated time offset

  constructor() {
    this.cleanOldTriggerKeys();
  }

  public onBellTrigger(cb: ScheduleTriggerCallback): () => void {
    this.triggerListeners.push(cb);
    return () => {
      this.triggerListeners = this.triggerListeners.filter(c => c !== cb);
    };
  }

  public onMissedSchedule(cb: MissedScheduleCallback): () => void {
    this.missedListeners.push(cb);
    return () => {
      this.missedListeners = this.missedListeners.filter(c => c !== cb);
    };
  }

  public setTestMode(enabled: boolean): void {
    this.isTestMode = enabled;
    if (!enabled) {
      this.simulatedOffsetMs = 0;
    }
  }

  public getIsTestMode(): boolean {
    return this.isTestMode;
  }

  public setSimulatedTime(timeStr: string, settings: SchoolSettings): void {
    // "HH:mm" or "HH:mm:ss"
    const current = this.getCurrentDate(settings);
    const parts = timeStr.split(':');
    const target = new Date(current);
    target.setHours(parseInt(parts[0], 10), parseInt(parts[1] || '0', 10), parseInt(parts[2] || '0', 10), 0);
    this.simulatedOffsetMs = target.getTime() - Date.now();
  }

  public resetSimulatedTime(): void {
    this.simulatedOffsetMs = 0;
  }

  // Get current date considering timezone and test mode
  public getCurrentDate(settings?: SchoolSettings): Date {
    const nowMs = Date.now() + (this.isTestMode ? this.simulatedOffsetMs : 0);
    const localDate = new Date(nowMs);

    if (!settings || settings.timezone === 'local') {
      return localDate;
    }

    try {
      // Format to specific Indonesian timezone
      const tzString = localDate.toLocaleString('en-US', { timeZone: settings.timezone });
      return new Date(tzString);
    } catch {
      return localDate;
    }
  }

  public getClockState(settings?: SchoolSettings): ClockState {
    const d = this.getCurrentDate(settings);
    const dayOfWeek = DAY_INDEX_MAP[d.getDay()];
    const dayName = INDONESIAN_DAYS[dayOfWeek];

    const year = d.getFullYear();
    const monthIndex = d.getMonth();
    const dateNum = d.getDate();

    const dateFormatted = `${dayName}, ${dateNum} ${INDONESIAN_MONTHS[monthIndex]} ${year}`;
    const dateISO = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    return {
      timeStr,
      hours,
      minutes,
      seconds,
      dayName,
      dateFormatted,
      dayOfWeek,
      dateISO,
      timestamp: d.getTime(),
    };
  }

  // Check today's holiday
  public getTodayHoliday(settings?: SchoolSettings): HolidayItem | null {
    const clock = this.getClockState(settings);
    const holidays = storage.getHolidays();
    return holidays.find(h => h.date === clock.dateISO) || null;
  }

  // Check schedules to trigger at this exact minute
  public checkAndTrigger(settings: SchoolSettings): void {
    if (!settings.systemEnabled || !settings.autoRun) return;

    // Check holiday
    const holiday = this.getTodayHoliday(settings);
    if (holiday) {
      // Holiday mode: do not ring automatic regular bells
      return;
    }

    const clock = this.getClockState(settings);
    const currentTimeHHmm = `${clock.hours}:${clock.minutes}`;

    // 1. Check Special Schedules for today
    const specialSchedules = storage.getSpecialSchedules().filter(s => s.enabled && s.date === clock.dateISO);
    for (const spec of specialSchedules) {
      if (spec.time === currentTimeHHmm) {
        const triggerKey = `${clock.dateISO}_${currentTimeHHmm}_${spec.id}`;
        if (!this.triggeredKeys.has(triggerKey)) {
          this.triggeredKeys.add(triggerKey);
          this.executeTrigger(spec, true, settings);
          return; // Priority handled
        }
      }
    }

    // 2. Check Day Schedules
    if (!settings.activeDays.includes(clock.dayOfWeek)) {
      return;
    }

    const schedules = storage.getSchedules().filter(s => s.enabled && s.day === clock.dayOfWeek);
    for (const item of schedules) {
      if (item.time === currentTimeHHmm) {
        const triggerKey = `${clock.dateISO}_${currentTimeHHmm}_${item.id}`;
        if (!this.triggeredKeys.has(triggerKey)) {
          this.triggeredKeys.add(triggerKey);
          this.executeTrigger(item, false, settings);
          return;
        }
      }
    }
  }

  // Execute trigger action
  public async executeTrigger(
    item: ScheduleItem | SpecialSchedule,
    isSpecial: boolean,
    settings: SchoolSettings
  ): Promise<void> {
    const clock = this.getClockState(settings);

    // 1. Notify listeners / UI
    this.triggerListeners.forEach(listener => listener(item, isSpecial));

    // 2. Play sound sequence (Prioritas 1: Suara Wanita Lokal, Offline First)
    try {
      await soundEngine.playBellAndAnnouncement(item.type, settings, item.message, item.method);

      // 3. Record in Log as Success
      storage.addLog({
        date: clock.dateISO,
        time: clock.timeStr,
        title: item.title,
        type: item.type,
        message: item.message,
        status: 'Berhasil',
      });
    } catch (err) {
      console.error('Gagal menjalankan suara bel:', err);
      storage.addLog({
        date: clock.dateISO,
        time: clock.timeStr,
        title: item.title,
        type: item.type,
        message: item.message,
        status: 'Gagal',
      });
    }

    // 4. Send Desktop Notification if supported
    this.sendNotification(item.title, item.message);
  }

  // Handle sleep/wake gap
  public checkSleepGap(settings: SchoolSettings): void {
    const now = Date.now();
    const elapsed = now - this.lastTickTimestamp;
    this.lastTickTimestamp = now;

    // If gap is more than 65 seconds (laptop was suspended or sleeping)
    if (elapsed > 65000) {
      console.log(`[Scheduler] Terdeteksi laptop bangun dari sleep (selisih ${Math.round(elapsed / 1000)} detik)`);
      const clock = this.getClockState(settings);

      // Check which schedules fell within this gap
      const daySchedules = storage.getSchedules().filter(s => s.enabled && s.day === clock.dayOfWeek);
      const missed: Array<{ title: string; time: string }> = [];

      for (const item of daySchedules) {
        const [schH, schM] = item.time.split(':').map(Number);
        const schDate = this.getCurrentDate(settings);
        schDate.setHours(schH, schM, 0, 0);
        const schTimestamp = schDate.getTime();

        // If schedule time fell inside the sleep interval [now - elapsed, now - 60s]
        if (schTimestamp >= (now - elapsed) && schTimestamp < (now - 60000)) {
          const triggerKey = `${clock.dateISO}_${item.time}_${item.id}`;
          if (!this.triggeredKeys.has(triggerKey)) {
            this.triggeredKeys.add(triggerKey); // Do not ring delayed!
            missed.push({ title: item.title, time: item.time });
            storage.addLog({
              date: clock.dateISO,
              time: item.time + ':00',
              title: item.title,
              type: item.type,
              message: item.message,
              status: 'Terlewat',
            });
          }
        }
      }

      if (missed.length > 0) {
        this.missedListeners.forEach(cb => cb(missed));
      }
    }
  }

  // Calculate Next Bell Information
  public getNextBellInfo(settings: SchoolSettings): NextBellInfo {
    const clock = this.getClockState(settings);
    const currentMinutes = parseInt(clock.hours, 10) * 60 + parseInt(clock.minutes, 10);
    const currentSeconds = currentMinutes * 60 + parseInt(clock.seconds, 10);

    // Look for special schedules first
    const specials = storage.getSpecialSchedules()
      .filter(s => s.enabled && s.date === clock.dateISO)
      .sort((a, b) => a.time.localeCompare(b.time));

    // Regular schedules today
    const regular = storage.getSchedules()
      .filter(s => s.enabled && s.day === clock.dayOfWeek)
      .sort((a, b) => a.time.localeCompare(b.time));

    interface Candidate {
      schedule: ScheduleItem | SpecialSchedule;
      isSpecial: boolean;
      totalSeconds: number;
    }

    const candidates: Candidate[] = [];

    // Add specials
    specials.forEach(s => {
      const [h, m] = s.time.split(':').map(Number);
      candidates.push({ schedule: s, isSpecial: true, totalSeconds: h * 3600 + m * 60 });
    });

    // Add regulars if no special collision
    regular.forEach(r => {
      const [h, m] = r.time.split(':').map(Number);
      candidates.push({ schedule: r, isSpecial: false, totalSeconds: h * 3600 + m * 60 });
    });

    candidates.sort((a, b) => a.totalSeconds - b.totalSeconds);

    // Find next upcoming today
    const nextCandidate = candidates.find(c => c.totalSeconds > currentSeconds);

    if (nextCandidate) {
      const diffSec = nextCandidate.totalSeconds - currentSeconds;
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      const formattedCountdown = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Progress calculation
      const prevCandidates = candidates.filter(c => c.totalSeconds <= currentSeconds);
      const prevSec = prevCandidates.length > 0 ? prevCandidates[prevCandidates.length - 1].totalSeconds : currentSeconds - 3600;
      const totalSpan = Math.max(60, nextCandidate.totalSeconds - prevSec);
      const elapsed = Math.max(0, currentSeconds - prevSec);
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalSpan) * 100)));

      return {
        schedule: nextCandidate.schedule,
        isSpecial: nextCandidate.isSpecial,
        time: nextCandidate.schedule.time,
        title: nextCandidate.schedule.title,
        type: nextCandidate.schedule.type,
        countdownSeconds: diffSec,
        formattedCountdown,
        progressPercent,
      };
    }

    // No more bells today
    return {
      schedule: null,
      isSpecial: false,
      time: '--:--',
      title: 'Tidak ada bel lagi hari ini',
      type: 'lainnya',
      countdownSeconds: 0,
      formattedCountdown: '00:00:00',
      progressPercent: 100,
    };
  }

  // Force trigger next schedule immediately (used in Test Mode)
  public triggerNextScheduleNow(settings: SchoolSettings): boolean {
    const next = this.getNextBellInfo(settings);
    if (!next.schedule) return false;
    this.executeTrigger(next.schedule, next.isSpecial, settings);
    return true;
  }

  // Notifications
  public requestNotificationPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }

  private sendNotification(title: string, body: string): void {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`🔔 Bel Sekolah SD: ${title}`, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/favicon.png',
        });
      } catch {
        // Ignore notification error
      }
    }
  }

  private cleanOldTriggerKeys(): void {
    // Keep set bounded
    if (this.triggeredKeys.size > 500) {
      this.triggeredKeys.clear();
    }
  }
}

export const scheduler = new SchedulerService();
