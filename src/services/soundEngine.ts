import { SchoolSettings } from '../types';

class SoundEngine {
  private audioContext: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private onStatusChangeCallbacks: Array<(ready: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for speech synthesis voices loaded
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

  // Get AudioContext lazily or safely
  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

      // Ensure SpeechSynthesis is resumed on user click without generating error events
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch {
          // ignore
        }
      }

      this.isUnlocked = true;
      this.notifyStatus();
      return true;
    } catch (err) {
      console.error('Gagal mengaktifkan AudioContext:', err);
      this.isUnlocked = true; // Still allow best-effort
      this.notifyStatus();
      return false;
    }
  }

  public isAudioReady(): boolean {
    return this.isUnlocked;
  }

  // Retrieve all available voices and Indonesian voice
  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices();
  }

  public getIndonesianVoices(): SpeechSynthesisVoice[] {
    const all = this.getVoices();
    return all.filter(v => v.lang.toLowerCase().startsWith('id') || v.name.toLowerCase().includes('indonesia'));
  }

  // Play synthesized chime (Westminster or Electronic)
  public playSynthesizedBell(type: 'westminster' | 'electronic' = 'westminster', volumePercent = 90): Promise<void> {
    return new Promise(resolve => {
      try {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const masterGain = ctx.createGain();
        const gainVal = Math.max(0, Math.min(1, (volumePercent / 100) * 0.8));
        masterGain.gain.setValueAtTime(gainVal, ctx.currentTime);
        masterGain.connect(ctx.destination);

        const startTime = ctx.currentTime + 0.05;

        if (type === 'westminster') {
          // Classic 4-note Westminster Chimes: E5 -> C#5 -> B4 -> E4 matching user's audio
          const notes = [
            { freq: 659.25, dur: 0.72, delay: 0.0 },   // E5
            { freq: 554.37, dur: 0.72, delay: 0.75 },  // C#5
            { freq: 493.88, dur: 0.72, delay: 1.50 },  // B4
            { freq: 329.63, dur: 1.50, delay: 2.25 },  // E4
          ];

          notes.forEach(note => {
            const noteStart = startTime + note.delay;
            // Fundamental (warm body)
            this.createBellHarmonic(ctx, masterGain, note.freq, noteStart, note.dur, 0.9);
            // Octave
            this.createBellHarmonic(ctx, masterGain, note.freq * 2.0, noteStart, note.dur * 0.75, 0.35);
            // Bell Tierce (characteristic minor 3rd harmonic of tubular bell)
            this.createBellHarmonic(ctx, masterGain, note.freq * 2.76, noteStart, note.dur * 0.6, 0.22);
            // Metallic chime shimmer
            this.createBellHarmonic(ctx, masterGain, note.freq * 3.98, noteStart, note.dur * 0.4, 0.12);
          });

          const totalDuration = 2.25 + 1.50 + 0.3;
          setTimeout(resolve, totalDuration * 1000);
        } else {
          // Dual-Tone Electronic Ding-Dong (High Ding -> Low Dong)
          const notes = [
            { freq: 880.0, dur: 0.8, delay: 0.0 }, // A5 (Ding)
            { freq: 659.25, dur: 1.4, delay: 0.8 }, // E5 (Dong)
          ];

          notes.forEach(note => {
            const noteStart = startTime + note.delay;
            this.createBellHarmonic(ctx, masterGain, note.freq, noteStart, note.dur, 1.0);
            this.createBellHarmonic(ctx, masterGain, note.freq * 2.76, noteStart, note.dur * 0.6, 0.35);
          });

          setTimeout(resolve, 2400);
        }
      } catch (err) {
        console.error('Error playing synthesized bell:', err);
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
    amplitude: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    // Fast attack
    gain.gain.exponentialRampToValueAtTime(amplitude * 0.5, startTime + 0.02);
    // Smooth natural exponential decay
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);

    this.activeOscillators.push(osc);
    osc.onended = () => {
      this.activeOscillators = this.activeOscillators.filter(o => o !== osc);
    };
  }

  // Play audio file (/audio/bel.mp3 or .wav)
  public playAudioFile(url = '/audio/bel.mp3', volumePercent = 90): Promise<void> {
    return new Promise(resolve => {
      try {
        const audio = new Audio(url);
        this.currentAudioElement = audio;
        audio.volume = Math.max(0, Math.min(1, volumePercent / 100));

        audio.onended = () => {
          this.currentAudioElement = null;
          resolve();
        };

        audio.onerror = () => {
          console.warn(`File audio ${url} tidak dapat dimuat, menggunakan chime synthesizer...`);
          // Fallback to synthesized chime
          this.playSynthesizedBell('westminster', volumePercent).then(resolve);
        };

        audio.play().catch(e => {
          console.warn('Audio play rejected, falling back to synthesized chime:', e);
          this.playSynthesizedBell('westminster', volumePercent).then(resolve);
        });
      } catch (e) {
        console.warn('Audio creation error, fallback to synth:', e);
        this.playSynthesizedBell('westminster', volumePercent).then(resolve);
      }
    });
  }

  // Master bell playback based on settings
  public async playBell(settings: SchoolSettings): Promise<void> {
    if (!settings.playBellSound) return;

    if (settings.bellChimeType === 'custom' && settings.customAudioBase64) {
      await this.playAudioFile(settings.customAudioBase64, settings.bellVolume);
    } else if (settings.bellChimeType === 'electronic') {
      await this.playSynthesizedBell('electronic', settings.bellVolume);
    } else if (settings.bellChimeType === 'westminster') {
      await this.playSynthesizedBell('westminster', settings.bellVolume);
    } else {
      // Default 'file': Plays /audio/bel.mp3 (the authentic 4-tone chime audio)
      await this.playAudioFile('/audio/bel.mp3', settings.bellVolume);
    }
  }

  // Play Indonesian Text-to-Speech Announcement
  public playAnnouncement(text: string, settings: SchoolSettings): Promise<void> {
    return new Promise(resolve => {
      if (!settings.playAnnouncement || !text.trim()) {
        resolve();
        return;
      }

      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis API tidak didukung pada browser ini.');
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

      // Small delay to ensure browser speech engine is ready
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          this.currentUtterance = utterance;

          utterance.lang = 'id-ID';
          utterance.volume = Math.max(0, Math.min(1, settings.speechVolume / 100));
          utterance.rate = Math.max(0.5, Math.min(2.0, settings.speechRate));
          utterance.pitch = Math.max(0.5, Math.min(2.0, settings.speechPitch));

          const voices = this.getVoices();
          // Try configured voice
          if (settings.selectedVoiceURI) {
            const found = voices.find(v => v.voiceURI === settings.selectedVoiceURI);
            if (found) {
              utterance.voice = found;
            }
          }

          // If no specific voice matched, find any Indonesian voice
          if (!utterance.voice) {
            const idVoice = voices.find(v => v.lang.toLowerCase().startsWith('id') || v.lang.toLowerCase() === 'id-id');
            if (idVoice) {
              utterance.voice = idVoice;
            }
          }

          let isResolved = false;
          const finish = () => {
            if (!isResolved) {
              isResolved = true;
              this.currentUtterance = null;
              resolve();
            }
          };

          utterance.onend = () => {
            finish();
          };

          utterance.onerror = (e) => {
            // 'canceled' and 'interrupted' are standard browser cancellation events
            const errType = (e as SpeechSynthesisErrorEvent).error;
            if (errType !== 'canceled' && errType !== 'interrupted') {
              console.warn(`SpeechSynthesis notice: ${errType || 'playback event'}`);
            }
            finish();
          };

          // Safety timeout in case speech synthesis stalls
          const wordsCount = text.split(/\s+/).length;
          const expectedDurationMs = Math.max(5000, (wordsCount / 1.5) * 1000 + 4000);
          setTimeout(() => {
            finish();
          }, expectedDurationMs);

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('SpeechSynthesis speak error:', err);
          resolve();
        }
      }, 50);
    });
  }

  // Complete bell execution sequence:
  // 1. Play Bell -> 2. Wait Delay -> 3. Play Announcement -> 4. Finished
  public async executeSequence(
    announcementText: string,
    settings: SchoolSettings,
    method: 'tts' | 'audio' | 'both' = 'both'
  ): Promise<void> {
    if (!this.isUnlocked) {
      await this.unlockAudio();
    }

    // Step 1: Bell sound (if enabled and requested by method)
    if (method !== 'tts' && settings.playBellSound) {
      await this.playBell(settings);
    }

    // Step 2: Delay
    if (method === 'both' && settings.playBellSound && settings.playAnnouncement && announcementText.trim()) {
      const delayMs = Math.max(0, settings.bellDelaySeconds * 1000);
      await new Promise(r => setTimeout(r, delayMs));
    }

    // Step 3: Announcement
    if (method !== 'audio' && settings.playAnnouncement && announcementText.trim()) {
      await this.playAnnouncement(announcementText, settings);
    }
  }

  // Stop any active sound, chime, or speech
  public stopSound(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore already stopped
      }
    });
    this.activeOscillators = [];
    this.currentUtterance = null;
  }

  // Quick tests
  public async testBell(settings: SchoolSettings): Promise<void> {
    await this.unlockAudio();
    await this.playBell(settings);
  }

  public async testSpeech(text: string, settings: SchoolSettings): Promise<void> {
    await this.unlockAudio();
    await this.playAnnouncement(text || 'Selamat pagi bapak ibu guru dan anak-anak sekalian. Selamat datang di sekolah.', settings);
  }
}

export const soundEngine = new SoundEngine();
