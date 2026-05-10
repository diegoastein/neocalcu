import { useEffect, useState } from 'react';

const COUNTDOWN_SECONDS = 30;

interface Props {
  onDonate: () => Promise<void>;
  onDismiss: () => void;
  loading: boolean;
}

export default function DonationToast({ onDonate, onDismiss, loading }: Props) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      onDismiss();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onDismiss]);

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-50 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-brand-200 dark:border-slate-600 p-6 relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl">☕</span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Se cierra en {countdown}s
          </span>
        </div>

        <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          ¿Te resulta útil NeoCalcu?
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          Apoyá este proyecto y ayudás a que siga creciendo.
        </p>
        <p className="text-xs text-brand-700 dark:text-brand-300 mb-4">
          Un cafecito silencia este aviso por 30 días ☕
        </p>

        <button
          onClick={onDonate}
          disabled={loading}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 px-4 transition-colors flex items-center justify-center gap-2 text-base"
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Preparando pago...
            </>
          ) : (
            'Apoyá este proyecto — $3500'
          )}
        </button>
      </div>
    </div>
  );
}
