import { useState } from 'react';
import type { RegisterEmailResult } from '../hooks/useDonationReminder';

interface Props {
  onRegister: (email: string) => Promise<RegisterEmailResult>;
  onDismiss: () => void;
}

export default function EmailCaptureModal({ onRegister, onDismiss }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterEmailResult | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    const r = await onRegister(email);
    setResult(r);
    setLoading(false);
  };

  if (result === 'success') {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onDismiss} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
            <div className="text-4xl">✅</div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Email registrado
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Podés recuperar tu suscripción desde cualquier dispositivo usando este email.
            </p>
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 space-y-4">
          <div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Registrá tu email
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Es el único respaldo de tu suscripción. Si borrás la app o cambiás de dispositivo, lo necesitás para recuperar el acceso.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Al recuperarla en otro dispositivo, este pierde el acceso — la suscripción queda activa en uno solo.
            </p>
          </div>

          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setResult(null); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="tu@email.com"
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {result === 'error' && (
            <p className="text-xs text-red-500 dark:text-red-400">
              No se pudo registrar. Verificá tu conexión e intentá de nuevo.
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar email'}
            </button>
            <button
              onClick={onDismiss}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-center py-1"
            >
              Lo hago en otro momento
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
