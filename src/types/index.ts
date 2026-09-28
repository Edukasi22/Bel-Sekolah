export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type BellType =
  | 'masuk'
  | 'pergantian'
  | 'istirahat'
  | 'selesai_istirahat'
  | 'pulang'
  | 'upacara'
  | 'khusus'
  | 'manual'
  | 'lainnya';

export type BellMethod = 'tts' | 'audio' | 'both';

export interface ScheduleItem {
  id: string;
  day: DayOfWeek;
  time: string; // "HH:mm" (24h format)
  title: string;
  type: BellType;
  message: string;
  enabled: boolean;
  method?: BellMethod;
  customAudioId?: string;
}

export interface SpecialSchedule {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  title: string;
  type: BellType;
  message: string;
  enabled: boolean;
  method?: BellMethod;
}

export interface HolidayItem {
  id: string;
  date: string; // "YYYY-MM-DD"
  name: string;
  description?: string;
}

export interface BellLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm:ss"
  title: string;
  type: BellType;
  message: string;
  status: 'Berhasil' | 'Gagal' | 'Terlewat' | 'Manual';
  timestamp: number;
}

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  operatorName: string;
  phoneNumber: string;
  logoUrl: string; // base64 or empty
  timezone: 'Asia/Makassar' | 'Asia/Jakarta' | 'Asia/Jayapura' | 'local';
  systemEnabled: boolean; // Master bell switch
  autoRun: boolean;       // Automatically execute schedules
  playBellSound: boolean; // Enable chime
  playAnnouncement: boolean; // Enable voice
  activeDays: DayOfWeek[];
  bellVolume: number;     // 0 - 100
  speechVolume: number;   // 0 - 100
  speechRate: number;     // 0.5 - 1.5
  speechPitch: number;    // 0.5 - 1.5
  bellDelaySeconds: number; // 0 - 5 seconds
  bellChimeType: 'westminster' | 'electronic' | 'file';
  selectedVoiceURI: string;
  browserNotifications: boolean;
}

export interface NextBellInfo {
  schedule: ScheduleItem | SpecialSchedule | null;
  isSpecial: boolean;
  time: string;
  title: string;
  type: BellType;
  countdownSeconds: number;
  formattedCountdown: string;
  progressPercent: number;
}

export interface SystemStatus {
  isOnline: boolean;
  isAudioReady: boolean;
  speechSupported: boolean;
  indonesianVoiceAvailable: boolean;
  voicesCount: number;
  selectedVoiceName: string;
  isTestMode: boolean;
  simulatedTime: string | null; // "HH:mm:ss" if set
  activeHolidayToday: HolidayItem | null;
}
