import { useEffect, useState } from 'react';

const EXPIRY = new Date('2026-06-01T00:00:00-03:00');

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, EXPIRY.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(Math.max(0, EXPIRY.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  const days = Math.floor(timeLeft / 86_400_000);
  const hours = Math.floor((timeLeft % 86_400_000) / 3_600_000);
  const mins = Math.floor((timeLeft % 3_600_000) / 60_000);
  const secs = Math.floor((timeLeft % 60_000) / 1_000);
  return { days, hours, mins, secs, expired: timeLeft === 0 };
}

export function PromoHeaderBadge({ onClick }: { onClick: () => void }) {
  const { days, hours, mins, secs, expired } = useCountdown();
  if (expired) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-amber-900 text-xs font-bold transition-colors animate-pulse"
      aria-label="Promo Residencias 2×1"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
      </svg>
      <span className="whitespace-nowrap">Promo Residencias 2×1</span>
      <span className="font-mono opacity-80 whitespace-nowrap">
        {days > 0
          ? `${days}d ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}`
          : `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`}
      </span>
    </button>
  );
}

interface OverlayProps {
  onClose: () => void;
  onDonate: (plan: 'mensual' | 'anual') => void;
  loadingPlan: 'mensual' | 'anual' | null;
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center min-w-[2.5rem]">
      <span className="text-2xl font-bold leading-none tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-widest opacity-60 mt-0.5">{label}</span>
    </div>
  );
}

export default function PromoResidenciasOverlay({ onClose, onDonate, loadingPlan }: OverlayProps) {
  const { days, hours, mins, secs, expired } = useCountdown();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banda decorativa superior */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

        <div className="px-6 pt-5 pb-7">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Título */}
          <div className="text-center mb-4">
            <span className="inline-block bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
              Promo especial residencias
            </span>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
              2 suscripciones por el precio de 1
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Una para vos, otra para un colega de residencia
            </p>
          </div>

          {/* Beneficios */}
          <ul className="space-y-2 mb-5">
            {[
              'Calculadora de dosis por peso en tiempo real',
              'Calculadora de inotrópicos interactiva',
              'Múltiples pacientes simultáneos',
              'Notas de servicio por procedimiento',
              'Compartir resultados de cálculo',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5 text-brand-600">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          {/* Countdown */}
          {!expired ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3 mb-5">
              <p className="text-xs text-center text-amber-700 dark:text-amber-400 mb-2 font-semibold uppercase tracking-wider">
                La promo vence en
              </p>
              <div className="flex justify-center items-center gap-1 text-amber-900 dark:text-amber-200">
                <Digit value={days} label="días" />
                <span className="text-xl font-bold opacity-40 mb-3">:</span>
                <Digit value={hours} label="hs" />
                <span className="text-xl font-bold opacity-40 mb-3">:</span>
                <Digit value={mins} label="min" />
                <span className="text-xl font-bold opacity-40 mb-3">:</span>
                <Digit value={secs} label="seg" />
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/30 rounded-xl px-4 py-3 mb-5 text-center text-sm text-red-600 dark:text-red-400 font-semibold">
              Esta promoción ya expiró
            </div>
          )}

          {/* Botones de pago */}
          {!expired && (
            <div className="space-y-2 mb-4">
              <button
                onClick={() => onDonate('mensual')}
                disabled={loadingPlan !== null}
                className="flex items-center justify-center gap-2 w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors"
              >
                {loadingPlan === 'mensual' ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                  </svg>
                )}
                Mensual — $3.500
              </button>
              <button
                onClick={() => onDonate('anual')}
                disabled={loadingPlan !== null}
                className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors"
              >
                {loadingPlan === 'anual' ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                  </svg>
                )}
                Anual — $28.000
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md font-normal">-33%</span>
              </button>
            </div>
          )}

          {/* CTA Instagram */}
          <a
            href="https://www.instagram.com/neocalcu.pro/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold text-sm py-2.5 rounded-xl transition-opacity hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Consultas por Instagram
          </a>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-2">
            Respondemos todos los mensajes directos
          </p>
        </div>
      </div>
    </div>
  );
}
