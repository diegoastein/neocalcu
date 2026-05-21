import { useState } from 'react';
import { trackEvent } from '../utils/analytics';

const TAKENOS = {
  mensual: 'https://app.takenos.com/pay/05547496-42c4-440c-877c-b1d3edafe33c',
  anual: 'https://app.takenos.com/pay/16e073fa-e2c2-4063-a380-817635be14de',
};

interface Props {
  onClose: () => void;
  onArgentina: (plan: 'mensual' | 'anual') => Promise<void>;
  loadingPlan: 'mensual' | 'anual' | null;
}

type Region = null | 'ar' | 'intl';

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-4"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
        <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10z" clipRule="evenodd" />
      </svg>
      Cambiar región
    </button>
  );
}

export default function SubscriptionModal({ onClose, onArgentina, loadingPlan }: Props) {
  const [region, setRegion] = useState<Region>(null);
  const isLoading = loadingPlan !== null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-brand-500 to-brand-700" />

        <div className="px-6 pt-5 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          {region === null && (
            <>
              <div className="text-center mb-5 pr-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Suscripción NeoCalcu Pro</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">¿Desde dónde vas a pagar?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setRegion('ar')}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-brand-200 dark:border-brand-800 hover:border-brand-500 dark:hover:border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-left transition-colors"
                >
                  <span className="text-2xl">🇦🇷</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Argentina</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pago con MercadoPago</p>
                  </div>
                </button>
                <button
                  onClick={() => setRegion('intl')}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 bg-slate-50 dark:bg-slate-700/30 text-left transition-colors"
                >
                  <span className="text-2xl">🌎</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Resto del mundo</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tarjeta de crédito o débito internacional</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {region === 'ar' && (
            <>
              <BackButton onClick={() => setRegion(null)} />
              <div className="text-center mb-4 pr-6">
                <h2 className="text-base font-bold text-slate-800 dark:text-white">🇦🇷 Pago con MercadoPago</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Elegí tu plan</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onArgentina('mensual')}
                  disabled={isLoading}
                  className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPlan === 'mensual' ? <><Spinner /> Preparando...</> : 'Mensual — $3.500'}
                </button>
                <button
                  onClick={() => onArgentina('anual')}
                  disabled={isLoading}
                  className="w-full bg-brand-800 hover:bg-brand-900 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPlan === 'anual' ? (
                    <><Spinner /> Preparando...</>
                  ) : (
                    <>Anual — $28.000 <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md font-normal">-20%</span></>
                  )}
                </button>
              </div>
            </>
          )}

          {region === 'intl' && (
            <>
              <BackButton onClick={() => setRegion(null)} />
              <div className="text-center mb-4 pr-6">
                <h2 className="text-base font-bold text-slate-800 dark:text-white">🌎 Pago internacional</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tarjeta de crédito o débito</p>
              </div>
              <div className="flex flex-col gap-2 mb-4">
                <a
                  href={TAKENOS.mensual}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('click_apoyar', { source: 'subscription_modal', plan: 'mensual', gateway: 'takenos' })}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-xl py-3 text-sm text-center transition-colors block"
                >
                  <span>Mensual — USD 3</span>
                  <span className="block text-xs font-normal opacity-70">Se abre en nueva pestaña</span>
                </a>
                <a
                  href={TAKENOS.anual}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('click_apoyar', { source: 'subscription_modal', plan: 'anual', gateway: 'takenos' })}
                  className="w-full bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl py-3 text-sm text-center transition-colors block"
                >
                  <span>Anual — USD 20 <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md font-normal">-45%</span></span>
                  <span className="block text-xs font-normal opacity-70">Se abre en nueva pestaña</span>
                </a>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3">
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Después de pagar, escribinos por Instagram con el comprobante y activamos tu suscripción en menos de 24 hs.
                </p>
                <a
                  href="https://www.instagram.com/neomonitor.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  @neomonitor.pro
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
