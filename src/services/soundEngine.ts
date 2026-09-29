import { SchoolSettings, BellType, BellMethod, AudioAssetCheck, AudioReadinessState } from '../types';
import { indexedDb } from './indexedDb';

export const ANNOUNCEMENT_AUDIO_MAP: Record<
  string,
  { filename: string; url: string; label: string; defaultText: string; storeKey: string }
> = {
  masuk: {
    filename: 'masuk.mp3',
    url: '/audio/suara-wanita/masuk.mp3',
    label: 'Bel Masuk Sekolah',
    defaultText:
      'Bel masuk sekolah. Selamat pagi anak-anak. Silakan masuk ke kelas masing-masing dan bersiap mengikuti pembelajaran.',
    storeKey: 'masuk',
  },
  pergantian: {
    filename: 'pergantian-jam.mp3',
    url: '/audio/suara-wanita/pergantian-jam.mp3',
    label: 'Pergantian Jam Pelajaran',
    defaultText: 'Bel pergantian jam pelajaran. Silakan bersiap untuk mengikuti pelajaran berikutnya.',
    storeKey: 'pergantianJam',
  },
  pergantianJam: {
    filename: 'pergantian-jam.mp3',
    url: '/audio/suara-wanita/pergantian-jam.mp3',
    label: 'Pergantian Jam Pelajaran',
    defaultText: 'Bel pergantian jam pelajaran. Silakan bersiap untuk mengikuti pelajaran berikutnya.',
    storeKey: 'pergantianJam',
  },
  istirahat: {
    filename: 'istirahat.mp3',
    url: '/audio/suara-wanita/istirahat.mp3',
    label: 'Bel Istirahat',
    defaultText: 'Bel istirahat. Anak-anak dipersilakan beristirahat.',
    storeKey: 'istirahat',
  },
  selesai_istirahat: {
    filename: 'selesai-istirahat.mp3',
    url: '/audio/suara-wanita/selesai-istirahat.mp3',
    label: 'Bel Selesai Istirahat',
    defaultText:
      'Bel selesai istirahat. Anak-anak dipersilakan kembali ke kelas dan bersiap mengikuti pembelajaran.',
    storeKey: 'selesaiIstirahat',
  },
  selesaiIstirahat: {
    filename: 'selesai-istirahat.mp3',
    url: '/audio/suara-wanita/selesai-istirahat.mp3',
    label: 'Bel Selesai Istirahat',
    defaultText:
      'Bel selesai istirahat. Anak-anak dipersilakan kembali ke kelas dan bersiap mengikuti pembelajaran.',
    storeKey: 'selesaiIstirahat',
  },
  pulang: {
    filename: 'pulang.mp3',
    url: '/audio/suara-wanita/pulang.mp3',
    label: 'Bel Pulang Sekolah',
    defaultText:
      'Bel pulang sekolah. Kegiatan pembelajaran hari ini telah selesai. Hati-hati di perjalanan dan sampai jumpa.',
    storeKey: 'pulang',
  },
  upacara: {
    filename: 'upacara.mp3',
    url: '/audio/suara-wanita/upacara.mp3',
    label: 'Upacara Bendera',
    defaultText:
      'Perhatian kepada seluruh siswa dan dewan guru, upacara bendera akan segera dimulai. Silakan menuju lapangan sekolah dengan tertib.',
    storeKey: 'upacara',
  },
  khusus: {
    filename: 'kegiatan-khusus.mp3',
    url: '/audio/suara-wanita/kegiatan-khusus.mp3',
    label: 'Kegiatan Khusus Sekolah',
    defaultText:
      'Perhatian, kegiatan khusus sekolah akan segera dimulai. Silakan bersiap mengikuti petunjuk dari bapak dan ibu guru.',
    storeKey: 'kegiatanKhusus',
  },
  kegiatanKhusus: {
    filename: 'kegiatan-khusus.mp3',
    url: '/audio/suara-wanita/kegiatan-khusus.mp3',
    label: 'Kegiatan Khusus Sekolah',
    defaultText:
      'Perhatian, kegiatan khusus sekolah akan segera dimulai. Silakan bersiap mengikuti petunjuk dari bapak dan ibu guru.',
    storeKey: 'kegiatanKhusus',
  },
  contoh: {
    filename: 'contoh-suara.mp3',
    url: '/audio/suara-wanita/contoh-suara.mp3',
    label: 'Uji Contoh Suara Wanita',
    defaultText: 'Ini adalah contoh suara pengumuman wanita Bahasa Indonesia untuk sistem bel sekolah.',
    storeKey: 'contoh',
  },
};

export interface AudioAssetCheckResult {
  state: AudioReadinessState;
  items: AudioAssetCheck[];
  missingCount: number;
  readyCount: number;
  missingFiles: string[];
}

class SoundEngine {
  private audioContext: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private isBusy: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private onStatusChangeCallbacks: Array<(ready: boolean) => void> = [];
  private audioElementsPreloadCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          // Re-evaluate voices
        };
      }
    }
  }

  public subscribeStatus(cb: (ready: boolean) => void): () => void {
    this.onStatusChangeCallbacks.push(cb);
    cb(this.isUnlocked);
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter(c => c !== cb);
    };
  }

  private notifyStatus(): void {
    this.onStatusChangeCallbacks.forEach(cb => cb(this.isUnlocked));
  }

  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    return this.audioContext;
  }

  // Unlock AudioContext and SpeechSynthesis on user click
  public async unlockAudio(): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Play a short silent buffer to satisfy browser autoplay policy
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch {
          // ignore
        }
      }

      this.isUnlocked = true;
      this.notifyStatus();

      // Preload local audio assets in background
      this.preloadAudioAssets().catch(() => {});

      return true;
    } catch (err) {
      console.error('Gagal mengaktifkan AudioContext:', err);
      this.isUnlocked = true;
      this.notifyStatus();
      return false;
    }
  }

  public isAudioReady(): boolean {
    return this.isUnlocked;
  }

  public isPlaybackBusy(): boolean {
    return this.isBusy;
  }

  // Preload audio files into HTMLAudioElements for 0-latency playback
  public async preloadAudioAssets(): Promise<void> {
    const urlsToPreload = [
      '/audio/bel.mp3',
      '/audio/bel.wav',
      '/audio/suara-wanita/masuk.mp3',
      '/audio/suara-wanita/pergantian-jam.mp3',
      '/audio/suara-wanita/istirahat.mp3',
      '/audio/suara-wanita/selesai-istirahat.mp3',
      '/audio/suara-wanita/pulang.mp3',
      '/audio/suara-wanita/upacara.mp3',
      '/audio/suara-wanita/kegiatan-khusus.mp3',
    ];

    for (const url of urlsToPreload) {
      try {
        if (!this.audioElementsPreloadCache.has(url)) {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = url;
          this.audioElementsPreloadCache.set(url, audio);
        }
      } catch {
        // ignore
      }
    }
  }

  // Comprehensive Audio Readiness Check
  public async checkAudioAssets(): Promise<AudioAssetCheckResult> {
    const customAudios = await indexedDb.getAllCustomAudios();
    const checkedItems: AudioAssetCheck[] = [];
    const missingFiles: string[] = [];

    // 1. Check Bell sound
    let bellStatus: 'available' | 'custom_uploaded' | 'missing' = 'missing';
    let bellCustomName: string | undefined;
    if (customAudios['bell']) {
      bellStatus = 'custom_uploaded';
      bellCustomName = customAudios['bell'].name;
    } else {
      const isBellAvailable = await this.testUrlAvailability('/audio/bel.mp3');
      bellStatus = isBellAvailable ? 'available' : 'missing';
    }

    checkedItems.push({
      key: 'bel',
      label: 'Nada Bel Utama',
      filename: 'bel.mp3',
      url: '/audio/bel.mp3',
      expectedText: 'Nada lonceng sekolah Westminster 4-nada (E5, C#5, B4, E4)',
      status: bellStatus,
      customName: bellCustomName,
    });

    if (bellStatus === 'missing') {
      missingFiles.push('/audio/bel.mp3');
    }

    // 2. Check Announcements (Unique keys)
    const uniqueKeys = [
      'masuk',
      'pergantianJam',
      'istirahat',
      'selesaiIstirahat',
      'pulang',
      'upacara',
      'kegiatanKhusus',
    ];

    for (const key of uniqueKeys) {
      const info = ANNOUNCEMENT_AUDIO_MAP[key];
      if (!info) continue;

      let status: 'available' | 'custom_uploaded' | 'missing' = 'missing';
      let customName: string | undefined;

      if (customAudios[info.storeKey]) {
        status = 'custom_uploaded';
        customName = customAudios[info.storeKey].name;
      } else {
        const isUrlOk = await this.testUrlAvailability(info.url);
        status = isUrlOk ? 'available' : 'missing';
      }

      if (status === 'missing') {
        missingFiles.push(info.url);
      }

      checkedItems.push({
        key: info.storeKey,
        label: info.label,
        filename: info.filename,
        url: info.url,
        expectedText: info.defaultText,
        status,
        customName,
      });
    }

    const readyCount = checkedItems.filter(i => i.status !== 'missing').length;
    const missingCount = checkedItems.length - readyCount;

    let state: AudioReadinessState = 'AUDIO_READY';
    if (missingCount > 0) {
      state = 'AUDIO_INCOMPLETE';
    }

    return {
      state,
      items: checkedItems,
      missingCount,
      readyCount,
      missingFiles,
    };
  }

  // Test URL availability in Cache Storage first, then Network
  private async testUrlAvailability(url: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // 1. Cek di Cache Storage
    if ('caches' in window) {
      try {
        const match = await caches.match(url);
        if (match && (match.status === 200 || match.status === 0)) {
          return true;
        }
      } catch {
        // ignore
      }
    }

    // 2. Cek via fetch HEAD / GET ringan saat online
    if (navigator.onLine) {
      try {
        const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
        if (res.ok) return true;
      } catch {
        // ignore
      }
    }

    return false;
  }

  // Play an audio file URL or Base64 data with precise volume control
  public playAudioFile(url: string, volumePercent: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio();
        this.currentAudioElement = audio;
        audio.volume = Math.max(0, Math.min(1, volumePercent / 100));
        audio.src = url;

        let isEnded = false;
        const cleanup = () => {
          if (!isEnded) {
            isEnded = true;
            this.currentAudioElement = null;
            resolve();
          }
        };

        audio.onended = cleanup;
        audio.onerror = () => {
          this.currentAudioElement = null;
          reject(new Error(`Gagal memuat file audio: ${url}`));
        };

        audio.play().catch(e => {
          this.currentAudioElement = null;
          reject(e);
        });
      } catch (err) {
        this.currentAudioElement = null;
        reject(err);
      }
    });
  }

  // Play Bell Chime (Priority 1: custom uploaded, Priority 2: /audio/bel.mp3, Priority 3: Web Audio Synth)
  public async playBell(settings: SchoolSettings): Promise<void> {
    if (!settings.playBellSound) return;

    if (settings.bellChimeType === 'custom' && settings.customAudioBase64) {
      await this.playAudioFile(settings.customAudioBase64, settings.bellVolume);
      return;
    }

    // Check if custom bell in IndexedDB exists
    const customBell = await indexedDb.getCustomAudio('bell');
    if (customBell && customBell.base64) {
      await this.playAudioFile(customBell.base64, settings.bellVolume);
      return;
    }

    if (settings.bellChimeType === 'electronic') {
      await this.playSynthesizedBell('electronic', settings.bellVolume);
      return;
    }

    if (settings.bellChimeType === 'westminster') {
      await this.playSynthesizedBell('westminster', settings.bellVolume);
      return;
    }

    // Default 'file' (/audio/bel.mp3) with automatic Web Audio synthesizer fallback if file unavailable
    try {
      await this.playAudioFile('/audio/bel.mp3', settings.bellVolume);
    } catch {
      console.warn('File audio bel.mp3 tidak tersedia, menggunakan sintesis Westminster...');
      await this.playSynthesizedBell('westminster', settings.bellVolume);
    }
  }

  // Play Announcement:
  // PRIORITAS 1: Audio custom dari IndexedDB
  // PRIORITAS 2: File MP3 lokal di /audio/suara-wanita/
  // PRIORITAS 3: Text-to-Speech HANYA jika mode TTS aktif atau user mengizinkan fallback
  // PRIORITAS 4: Bel saja tanpa crash
  public async playAnnouncement(
    announcementType: BellType | string,
    settings: SchoolSettings,
    fallbackText?: string
  ): Promise<void> {
    if (!settings.playAnnouncement) return;

    const info = ANNOUNCEMENT_AUDIO_MAP[announcementType] || ANNOUNCEMENT_AUDIO_MAP.masuk;
    const textToSpeak = fallbackText || info.defaultText;
    const volume = settings.announcementVolume || 90;

    // A. JIKA PENGGUNA MEMILIH MODE TEXT-TO-SPEECH (PRIORITAS 2 TTS)
    if (settings.voiceSource === 'tts' || settings.voiceMode === 'tts') {
      await this.speakText(textToSpeak, settings);
      return;
    }

    // B. PRIORITAS 1: CEK AUDIO CUSTOM DARI INDEXEDDB
    try {
      const customAudio = await indexedDb.getCustomAudio(info.storeKey);
      if (customAudio && customAudio.base64) {
        await this.playAudioFile(customAudio.base64, volume);
        return;
      }
    } catch (err) {
      console.warn('Pengecekan custom audio gagal:', err);
    }

    // C. PRIORITAS 1 (B): FILE MP3 LOKAL DI /audio/suara-wanita/
    try {
      await this.playAudioFile(info.url, volume);
      return;
    } catch (err) {
      console.warn(`File audio lokal ${info.url} belum tersedia.`);

      // Dispatch event agar UI menampilkan peringatan banner
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('audio-asset-missing', {
            detail: {
              url: info.url,
              filename: info.filename,
              label: info.label,
              type: announcementType,
            },
          })
        );
      }

      // D. FALLBACK HANYA JIKA USER MENGAKTIFKAN ttsFallbackOnMissing
      if (settings.ttsFallbackOnMissing) {
        console.log('Menggunakan TTS fallback darurat karena diizinkan pengguna.');
        await this.speakText(textToSpeak, settings);
      } else {
        console.log('TTS fallback dinonaktifkan. Pengumuman suara dilewati untuk menjaga integritas audio.');
      }
    }
  }

  // Sequence: Bell -> Delay -> Announcement
  public async playBellAndAnnouncement(
    announcementType: BellType | string,
    settings: SchoolSettings,
    fallbackText?: string,
    methodOverride?: BellMethod
  ): Promise<void> {
    if (this.isBusy) {
      console.warn('Pemutaran audio sedang berlangsung, mencegah tumpang tindih suara.');
      return;
    }

    this.isBusy = true;

    try {
      if (!this.isUnlocked) {
        await this.unlockAudio();
      }

      const mode = settings.voiceMode || 'bell_and_voice';
      const shouldPlayBell =
        settings.playBellSound &&
        methodOverride !== 'tts' &&
        mode !== 'local_voice' &&
        mode !== 'tts';

      const shouldPlayVoice =
        settings.playAnnouncement &&
        methodOverride !== 'audio' &&
        mode !== 'bell_only';

      // 1. Putar Nada Bel
      if (shouldPlayBell) {
        await this.playBell(settings);
      }

      // 2. Jeda Antara Bel dan Pengumuman
      if (shouldPlayBell && shouldPlayVoice) {
        const delayMs = Math.max(0, (settings.bellDelaySeconds ?? 1.0) * 1000);
        if (delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }

      // 3. Putar Pengumuman Suara
      if (shouldPlayVoice) {
        await this.playAnnouncement(announcementType, settings, fallbackText);
      }
    } finally {
      this.isBusy = false;
    }
  }

  // Alias for backwards compatibility
  public async executeSequence(
    announcementText: string,
    settings: SchoolSettings,
    method: BellMethod = 'both',
    bellType: BellType = 'masuk'
  ): Promise<void> {
    await this.playBellAndAnnouncement(bellType, settings, announcementText, method);
  }

  // SpeechSynthesis Engine (Fitur Tambahan TTS)
  private speakText(text: string, settings: SchoolSettings): Promise<void> {
    return new Promise(resolve => {
      if (!text.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        window.speechSynthesis.resume();
      } catch {
        // Safe catch
      }

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          this.currentUtterance = utterance;

          utterance.lang = 'id-ID';
          utterance.volume = Math.max(0, Math.min(1, (settings.speechVolume || 100) / 100));
          utterance.rate = Math.max(0.5, Math.min(2.0, settings.speechRate || 0.95));
          utterance.pitch = Math.max(0.5, Math.min(2.0, settings.speechPitch || 1.0));

          const voices = this.getVoices();
          if (settings.selectedVoiceURI) {
            const found = voices.find(v => v.voiceURI === settings.selectedVoiceURI);
            if (found) utterance.voice = found;
          }

          if (!utterance.voice) {
            const idVoice = voices.find(
              v => v.lang.toLowerCase().startsWith('id') || v.lang.toLowerCase() === 'id-id'
            );
            if (idVoice) utterance.voice = idVoice;
          }

          let isResolved = false;
          const finish = () => {
            if (!isResolved) {
              isResolved = true;
              this.currentUtterance = null;
              resolve();
            }
          };

          utterance.onend = finish;
          utterance.onerror = finish;

          const wordsCount = text.split(/\s+/).length;
          const expectedDurationMs = Math.max(5000, (wordsCount / 1.5) * 1000 + 4000);
          setTimeout(finish, expectedDurationMs);

          window.speechSynthesis.speak(utterance);
        } catch {
          resolve();
        }
      }, 50);
    });
  }

  // Synthesized Chime Fallbacks (Web Audio API)
  public playSynthesizedBell(type: 'westminster' | 'electronic', volumePercent: number): Promise<void> {
    return new Promise(resolve => {
      try {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volumePercent / 100)), ctx.currentTime);
        masterGain.connect(ctx.destination);

        const startTime = ctx.currentTime + 0.05;

        if (type === 'westminster') {
          // Classic 4-note Westminster: E5 -> C#5 -> B4 -> E4
          const notes = [
            { freq: 659.25, dur: 0.72, delay: 0.0 },
            { freq: 554.37, dur: 0.72, delay: 0.75 },
            { freq: 493.88, dur: 0.72, delay: 1.5 },
            { freq: 329.63, dur: 1.5, delay: 2.25 },
          ];

          notes.forEach(note => {
            const noteStart = startTime + note.delay;
            this.createBellHarmonic(ctx, masterGain, note.freq, noteStart, note.dur, 0.9);
            this.createBellHarmonic(ctx, masterGain, note.freq * 2.0, noteStart, note.dur * 0.75, 0.35);
            this.createBellHarmonic(ctx, masterGain, note.freq * 2.76, noteStart, note.dur * 0.6, 0.22);
            this.createBellHarmonic(ctx, masterGain, note.freq * 3.98, noteStart, note.dur * 0.4, 0.12);
          });

          const totalDuration = 2.25 + 1.5 + 0.3;
          setTimeout(resolve, totalDuration * 1000);
        } else {
          // Electronic Ding-Dong (784Hz -> 523Hz)
          this.createBellHarmonic(ctx, masterGain, 783.99, startTime, 0.8, 0.9);
          this.createBellHarmonic(ctx, masterGain, 523.25, startTime + 0.7, 1.2, 0.9);
          setTimeout(resolve, 2000);
        }
      } catch (err) {
        console.error('Synthesizer error:', err);
        resolve();
      }
    });
  }

  private createBellHarmonic(
    ctx: AudioContext,
    destination: AudioNode,
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainLevel), startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    this.activeOscillators.push(osc);
    setTimeout(() => {
      this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
    }, (startTime - ctx.currentTime + duration + 0.1) * 1000);
  }

  // Stop All Audio Immediately
  public stopAllAudio(): void {
    this.isBusy = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudioElement = null;
    }
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.activeOscillators = [];
    this.currentUtterance = null;
  }

  // Alias for backward compatibility
  public stopSound(): void {
    this.stopAllAudio();
  }

  // SpeechSynthesis helpers
  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }

  public getIndonesianVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter(
      v => v.lang.toLowerCase().startsWith('id') || v.name.toLowerCase().includes('indonesia')
    );
  }
}

export const soundEngine = new SoundEngine();
