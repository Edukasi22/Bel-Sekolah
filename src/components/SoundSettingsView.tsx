import React, { useState, useEffect } from 'react';
import { SchoolSettings } from '../types';
import { soundEngine } from '../services/soundEngine';
import {
  Sliders,
  Volume2,
  Mic,
  Play,
  VolumeX,
  CheckCircle2,
  Clock,
  Radio,
  FileAudio,
  Sparkles,
} from 'lucide-react';

interface SoundSettingsViewProps {
  settings: SchoolSettings;
  onSaveSettings: (settings: SchoolSettings) => void;
  isAudioUnlocked: boolean;
  onUnlockAudio: () => void;
  onShowToast: (title: string, msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SoundSettingsView: React.FC<SoundSettingsViewProps> = ({
  settings,
  onSaveSettings,
  isAudioUnlocked,
  onUnlockAudio,
  onShowToast,
}) => {
  const [localSettings, setLocalSettings] = useState<SchoolSettings>(settings);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testSpeechText, setTestSpeechText] = useState(
    'Bel masuk sekolah. Selamat pagi anak-anak. Silakan masuk ke kelas masing-masing.'
  );

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    const updateVoices = () => {
      const voices = soundEngine.getVoices();
      setAvailableVoices(voices);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleChange = <K extends keyof SchoolSettings>(key: K, value: SchoolSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleTestBell = async () => {
    if (!isAudioUnlocked) await onUnlockAudio();
    await soundEngine.playBell(localSettings);
    onShowToast('Uji Coba Bel', 'Suara bel berhasil dimainkan.', 'success');
  };

  const handleTestSpeech = async () => {
    if (!isAudioUnlocked) await onUnlockAudio();
    await soundEngine.playAnnouncement(testSpeechText, localSettings);
    onShowToast('Uji Coba Suara', 'Pengumuman suara berhasil dimainkan.', 'success');
  };

  const handleStopSound = () => {
    soundEngine.stopSound();
    onShowToast('Suara Berhenti', 'Seluruh suara dan bel telah dihentikan.', 'info');
  };

  // Group Indonesian voices
  const indonesianVoices = availableVoices.filter(
    v => v.lang.toLowerCase().startsWith('id') || v.name.toLowerCase().includes('indonesia')
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-600" />
            <span>Pengaturan Suara & Bel</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sesuaikan volume, intonasi suara Bahasa Indonesia, jenis nada bel, dan jeda pengumuman
          </p>
        </div>

        {/* Global Test Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTestBell}
            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Volume2 className="h-4 w-4" />
            <span>🔊 TES BEL</span>
          </button>
          <button
            onClick={handleTestSpeech}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <Mic className="h-4 w-4" />
            <span>🗣️ TES SUARA</span>
          </button>
          <button
            onClick={handleStopSound}
            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 min-h-[44px]"
          >
            <VolumeX className="h-4 w-4" />
            <span>🔇 HENTIKAN SUARA</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Pengaturan Bel (Chime) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-amber-500" />
              <span>Sistem Nada Bel</span>
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.playBellSound}
                onChange={e => handleChange('playBellSound', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Bell Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Pilihan Nada Bel:</label>
            <div className="space-y-2">
              {/* Pilihan 1: File Audio Utama (Updated from user's chime) */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  localSettings.bellChimeType === 'file'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bellChimeType"
                  value="file"
                  checked={localSettings.bellChimeType === 'file'}
                  onChange={() => handleChange('bellChimeType', 'file')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                    <span>Audio Bel Sekolah (/audio/bel.mp3)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      ★ Rekomendasi (Aktif)
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Memutar rekaman nada lonceng 4-nada khas sekolah jernih berformat lokal offline.
                  </div>
                </div>
              </label>

              {/* Pilihan 2: Westminster Chimes Synthesizer */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  localSettings.bellChimeType === 'westminster'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bellChimeType"
                  value="westminster"
                  checked={localSettings.bellChimeType === 'westminster'}
                  onChange={() => handleChange('bellChimeType', 'westminster')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Westminster Chimes (Sintesis Harmonik Web Audio)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Sintesis nada tubular lonceng 4-nada (E5, C#5, B4, E4) via osilator Web Audio API.
                  </div>
                </div>
              </label>

              {/* Pilihan 3: Bel Elektronik Ding-Dong */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  localSettings.bellChimeType === 'electronic'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bellChimeType"
                  value="electronic"
                  checked={localSettings.bellChimeType === 'electronic'}
                  onChange={() => handleChange('bellChimeType', 'electronic')}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Bel Elektronik Ding-Dong (2 Nada Ringkas)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dua nada ketukan cepat, cocok untuk pergantian jam pendek.
                  </div>
                </div>
              </label>

              {/* Pilihan 4: Upload Custom Audio File */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  localSettings.bellChimeType === 'custom'
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="bellChimeType"
                  value="custom"
                  checked={localSettings.bellChimeType === 'custom'}
                  onChange={() => handleChange('bellChimeType', 'custom')}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    File Audio Tambahan Sendiri
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {localSettings.customAudioName ? (
                      <span className="text-blue-700 font-semibold">
                        File aktif: {localSettings.customAudioName}
                      </span>
                    ) : (
                      'Unggah berkas rekaman suara bel sendiri (.mp3 / .wav).'
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 transition">
                      <FileAudio className="h-3.5 w-3.5 text-blue-600" />
                      <span>{localSettings.customAudioName ? 'Ganti File Audio' : 'Pilih Berkas Audio'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            onShowToast('Ukuran File Besar', 'Maksimal ukuran audio adalah 5 MB.', 'warning');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            const updated = {
                              ...localSettings,
                              bellChimeType: 'custom' as const,
                              customAudioBase64: base64,
                              customAudioName: file.name,
                            };
                            setLocalSettings(updated);
                            onSaveSettings(updated);
                            onShowToast('Audio Berhasil Dimuat', `Audio "${file.name}" aktif sebagai nada bel.`, 'success');
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Bell Volume Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Volume Bel:</span>
              <span className="text-blue-600 font-mono">{localSettings.bellVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localSettings.bellVolume}
              onChange={e => handleChange('bellVolume', parseInt(e.target.value, 10))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Delay Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Jeda antara Bel dan Pengumuman:</span>
              </span>
              <span className="text-blue-600 font-mono">{localSettings.bellDelaySeconds} detik</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={localSettings.bellDelaySeconds}
              onChange={e => handleChange('bellDelaySeconds', parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Memberikan jeda hening setelah nada bel berhenti sebelum narator berbicara.
            </span>
          </div>
        </div>

        {/* Section 2: Pengaturan Suara Pengumuman (TTS) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Mic className="h-4 w-4 text-emerald-600" />
              <span>Pengumuman Suara (SpeechSynthesis)</span>
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.playAnnouncement}
                onChange={e => handleChange('playAnnouncement', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Voice Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilihan Suara (Voice Bahasa Indonesia):
            </label>
            <select
              value={localSettings.selectedVoiceURI}
              onChange={e => handleChange('selectedVoiceURI', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white min-h-[42px] focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Otomatis (Pilih Voice Bahasa Indonesia Terbaik)</option>
              {indonesianVoices.length > 0 && (
                <optgroup label="Suara Bahasa Indonesia Terdeteksi:">
                  {indonesianVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      🇮🇩 {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Seluruh Suara Perangkat:">
                {availableVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </optgroup>
            </select>

            {indonesianVoices.length > 0 ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 mt-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {indonesianVoices.length} suara Bahasa Indonesia tersedia pada perangkat ini.
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-amber-700 mt-1.5">
                ⚠️ Suara spesifik Bahasa Indonesia belum terinstal di browser ini. Sistem akan menggunakan suara default browser.
              </div>
            )}
          </div>

          {/* Speech Volume */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Volume Pengumuman:</span>
              <span className="text-emerald-600 font-mono">{localSettings.speechVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={localSettings.speechVolume}
              onChange={e => handleChange('speechVolume', parseInt(e.target.value, 10))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Speech Rate (Speed) */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Kecepatan Bicara (Speed):</span>
              <span className="text-emerald-600 font-mono">{localSettings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={localSettings.speechRate}
              onChange={e => handleChange('speechRate', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Speech Pitch */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Nada Suara (Pitch):</span>
              <span className="text-emerald-600 font-mono">{localSettings.speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={localSettings.speechPitch}
              onChange={e => handleChange('speechPitch', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
            />
          </div>

          {/* Test Utterance Box */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Pengujian Suara:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={testSpeechText}
                onChange={e => setTestSpeechText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs min-h-[42px]"
              />
              <button
                type="button"
                onClick={handleTestSpeech}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 min-h-[42px]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Uji</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
