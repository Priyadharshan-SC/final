import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-industrial-900 border border-industrial-border rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              variant === 'danger'
                ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                : variant === 'success'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-950/80 text-blue-400 border border-blue-500/30'
            }`}
          >
            {variant === 'danger' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition border border-industrial-border"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition shadow-md ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                : variant === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                : 'bg-brand-blue hover:bg-brand-blueHover shadow-blue-900/40'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
