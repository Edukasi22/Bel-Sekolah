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

export type VoiceSource = 'local_voice' | 'tts';

export type VoiceMode = 'local_voice' | 'tts' | 'bell_only' | 'bell_and_voice';

export interface CustomAudioRecord {
  key: string;       // 'masuk', 'pergantianJam', 'istirahat', 'selesaiIstirahat', 'pulang', 'upacara', 'kegiatanKhusus', 'bell'
  name: string;      // original filename (e.g., 'pengumuman-masuk.mp3')
  mimeType: string;  // 'audio/mpeg', 'audio/wav', etc.
  base64: string;    // Data URL
  size: number;      // File size in bytes
  updatedAt: number; // Timestamp
}

export interface AudioAssetCheck {
  key: string;
  label: string;
  filename: string;
  url: string;
  expectedText: string;
  status: 'available' | 'custom_uploaded' | 'missing';
  size?: number;
  customName?: string;
}

export type AudioReadinessState = 'AUDIO_READY' | 'AUDIO_INCOMPLETE' | 'AUDIO_ERROR';

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
  voiceMode?: VoiceMode;
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
  voiceMode?: VoiceMode;
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
  
  // Prioritas Suara: 'local_voice' (Prioritas 1: File MP3 Wanita Lokal) atau 'tts' (Prioritas 2: SpeechSynthesis)
  voiceSource: VoiceSource;
  voiceMode: VoiceMode;
  announcementVolume: number; // 0 - 100
  bellVolume: number;         // 0 - 100
  bellDelaySeconds: number;   // 0 - 5 seconds
  ttsFallbackOnMissing: boolean; // Jangan fallback TTS otomatis kecuali diizinkan user
  
  // Audio Bel
  bellChimeType: 'westminster' | 'electronic' | 'file' | 'custom';
  customAudioBase64?: string;
  customAudioName?: string;
  
  // TTS Settings
  speechVolume: number;   // 0 - 100
  speechRate: number;     // 0.5 - 1.5
  speechPitch: number;    // 0.5 - 1.5
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
  audioReadiness: AudioReadinessState;
  missingAudiosCount: number;
  speechSupported: boolean;
  indonesianVoiceAvailable: boolean;
  voicesCount: number;
  selectedVoiceName: string;
  isTestMode: boolean;
  simulatedTime: string | null; // "HH:mm:ss" if set
  activeHolidayToday: HolidayItem | null;
}
