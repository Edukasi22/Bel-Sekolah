import React from 'react';
import { Bell, Sparkles, Check, Trash } from 'lucide-react';

interface FirstRunModalProps {
  isOpen: boolean;
  onUseSampleData: () => void;
  onStartEmpty: () => void;
}

export const FirstRunModal: React.FC<FirstRunModalProps> = ({
  isOpen,
  onUseSampleData,
  onStartEmpty,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-amber-300 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
          <Bell className="h-8 w-8 fill-current" />
        </div>

        <span className="text-[11px] font-bold tracking-widest text-blue-600 uppercase px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
          DATA CONTOH AWAL
        </span>

        <h2 className="text-xl font-black text-slate-900 mt-3">
          Selamat Datang di BEL SEKOLAH SD
        </h2>

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Aplikasi telah dilengkapi dengan contoh jadwal kegiatan standar Sekolah Dasar (SD) di Indonesia untuk hari Senin sampai Sabtu (Upacara, Masuk, Istirahat, Pergantian Jam, Pulang).
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onUseSampleData}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Check className="h-4 w-4" />
            <span>Gunakan Data Contoh</span>
          </button>

          <button
            onClick={onStartEmpty}
            className="w-full py-3.5 px-4 rounded-2xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition min-h-[48px]"
          >
            Mulai dengan Jadwal Kosong
          </button>
        </div>
      </div>
    </div>
  );
};
