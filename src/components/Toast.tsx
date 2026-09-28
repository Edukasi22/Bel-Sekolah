import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-2">
      {toasts.map(toast => {
        let bg = 'bg-blue-600 text-white border-blue-700';
        let Icon = Info;

        if (toast.type === 'success') {
          bg = 'bg-emerald-600 text-white border-emerald-700';
          Icon = CheckCircle2;
        } else if (toast.type === 'warning' || toast.type === 'error') {
          bg = 'bg-amber-600 text-white border-amber-700';
          Icon = AlertTriangle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl shadow-black/10 transition-all transform animate-in slide-in-from-top-2 ${bg}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
              <div className="text-xs opacity-95 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition"
              aria-label="Tutup pemberitahuan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
