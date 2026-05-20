import { useEffect, useState } from 'react';
import { RecoverResult } from '../hooks/useDonationReminder';

const COUNTDOWN_SECONDS = 30;

interface Props {
  onDonate: () => void;
  onDismiss: () => void;
  onRecover: (email: string) => Promise<RecoverResult>;
}

const recoverMessages: Record<RecoverResult, string> = {
  success: '¡Suscripción recuperada! Gracias por tu apoyo.',
  not_found: 'No encontramos una suscripción con ese email.',
  expired: 'La suscripción de ese email venció. Podés renovar.',
  error: 'Sin conexión. Intentá de nuevo.',
};

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

export default function DonationToast({ onDonate, onDismiss, onRecover }: Props) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverResult, setRecoverResult] = useState<RecoverResult | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (recoverOpen) return; // pausar countdown mientras el usuario escribe
    if (countdown <= 0) {
      onDismiss();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onDismiss, recoverOpen]);

  const handleRecoverToggle = () => {
    setRecoverOpen(v => !v);
    setRecoverResult(null);
    setRecoverEmail('');
  };

  const handleRecoverSubmit = async () => {
    if (!recoverEmail.trim()) return;
    setRecoverLoading(true);
    setRecoverResult(null);
    const result = await onRecover(recoverEmail);
    setRecoverResult(result);
    setRecoverLoading(false);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl border-t border-x border-brand-200 dark:border-slate-600 p-5 relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xl">☕</span>
          {!recoverOpen && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Se cierra en {countdown}s
            </span>
          )}
        </div>

        <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          ¿Te resulta útil NeoCalcu?
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          Apoyá este proyecto y ayudás a que siga creciendo.
        </p>
        <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-3">
          Próximamente funciones exclusivas para suscriptores.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onDonate}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-xl py-2.5 px-4 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            Suscribirse
          </button>

          <button
            onClick={handleRecoverToggle}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-center pt-1"
          >
            ¿Ya donaste? Recuperá tu suscripción
          </button>

          {recoverOpen && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={recoverEmail}
                  onChange={e => { setRecoverEmail(e.target.value); setRecoverResult(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleRecoverSubmit()}
                  placeholder="email con el que pagaste"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
                <button
                  onClick={handleRecoverSubmit}
                  disabled={recoverLoading || !recoverEmail.trim()}
                  className="px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {recoverLoading ? <Spinner /> : 'OK'}
                </button>
              </div>
              {recoverResult && (
                <p className={`text-xs px-1 ${recoverResult === 'success' ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'}`}>
                  {recoverMessages[recoverResult]}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
