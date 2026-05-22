import { useEffect, useState } from 'react';
import DisclaimerModal from './DisclaimerModal';
import { RedeemResult, RecoverResult, RecoverByCouponResult, MembershipInfo } from '../hooks/useDonationReminder';

type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  canInstall: boolean;
  onInstall: () => void;
  onDonate: () => void;
  onRedeem: (code: string) => Promise<RedeemResult>;
  onRecover: (email: string) => Promise<RecoverResult>;
  onRecoverByCoupon: (code: string) => Promise<RecoverByCouponResult>;
  membership?: MembershipInfo;
}

const themeModes: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Día' },
  { value: 'dark', label: 'Noche' },
];

const redeemMessages: Record<RedeemResult, string> = {
  success: '¡Código canjeado! Gracias por tu apoyo.',
  invalid: 'Código inválido. Revisá que esté bien escrito.',
  used: 'Este código ya fue utilizado.',
  error: 'Sin conexión. Intentá de nuevo.',
};

const recoverMessages: Record<RecoverResult, string> = {
  success: '¡Suscripción recuperada! Gracias por tu apoyo.',
  not_found: 'No encontramos una suscripción con ese email.',
  expired: 'La suscripción de ese email venció. Podés renovar.',
  error: 'Sin conexión. Intentá de nuevo.',
};

const recoverByCouponMessages: Record<RecoverByCouponResult, string> = {
  success: '¡Suscripción recuperada! Gracias por tu apoyo.',
  not_found: 'Código no encontrado. Verificá que esté bien escrito.',
  not_redeemed: 'Ese código todavía no fue canjeado.',
  error: 'Sin conexión. Intentá de nuevo.',
};

export default function SettingsPanel({
  isOpen,
  onClose,
  themeMode,
  onThemeChange,
  canInstall,
  onInstall,
  onDonate,
  onRedeem,
  onRecover,
  onRecoverByCoupon,
  membership,
}: SettingsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<RedeemResult | null>(null);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverMode, setRecoverMode] = useState<'email' | 'code'>('email');
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverCode, setRecoverCode] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverResult, setRecoverResult] = useState<RecoverResult | null>(null);
  const [recoverByCouponResult, setRecoverByCouponResult] = useState<RecoverByCouponResult | null>(null);

  const handleShare = async () => {
    const url = 'https://www.neocalcu.pro';
    const shareData = { title: 'NeoCalcu', text: 'Calculadora clínica para neonatología', url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeemSubmit = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponResult(null);
    const result = await onRedeem(couponCode);
    setCouponResult(result);
    setCouponLoading(false);
    if (result === 'success') setCouponCode('');
  };

  const handleCouponToggle = () => {
    setCouponOpen(v => !v);
    setCouponResult(null);
    setCouponCode('');
  };

  const handleRecoverToggle = () => {
    setRecoverOpen(v => !v);
    setRecoverResult(null);
    setRecoverByCouponResult(null);
    setRecoverEmail('');
    setRecoverCode('');
  };

  const handleRecoverSubmit = async () => {
    if (!recoverEmail.trim()) return;
    setRecoverLoading(true);
    setRecoverResult(null);
    const result = await onRecover(recoverEmail);
    setRecoverResult(result);
    setRecoverLoading(false);
  };

  const handleRecoverByCouponSubmit = async () => {
    if (!recoverCode.trim()) return;
    setRecoverLoading(true);
    setRecoverByCouponResult(null);
    const result = await onRecoverByCoupon(recoverCode);
    setRecoverByCouponResult(result);
    setRecoverLoading(false);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setCouponOpen(false);
      setCouponCode('');
      setCouponResult(null);
      setRecoverOpen(false);
      setRecoverEmail('');
      setRecoverCode('');
      setRecoverResult(null);
      setRecoverByCouponResult(null);
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 max-w-[90vw] z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-250 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Configuración</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">

          {/* Apariencia */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Apariencia
            </h3>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              {themeModes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onThemeChange(value)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    themeMode === value
                      ? 'bg-brand-800 dark:bg-brand-700 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Instalar app */}
          {canInstall && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Instalar aplicación
              </h3>
              <button
                onClick={onInstall}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Instalar NeoCalcu
              </button>
            </section>
          )}

          {/* Compartir */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Compartir
            </h3>
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-brand-600 dark:text-brand-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-brand-600 dark:text-brand-400">Enlace copiado</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z" />
                  </svg>
                  Compartir NeoCalcu
                </>
              )}
            </button>
          </section>

          {/* Contacto */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Contacto
            </h3>
            <a
              href="mailto:info@neomonitor.pro"
              className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-400 hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              info@neomonitor.pro
            </a>
            <a
              href="https://www.instagram.com/neomonitor.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-400 hover:underline mt-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 shrink-0">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              @neomonitor.pro
            </a>
          </section>

          {/* Donación / Membresía */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {membership?.active ? 'Membresía' : 'Apoyá el proyecto'}
            </h3>

            {membership?.active ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    ¡Gracias por apoyar NeoCalcu!
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Plan {membership.plan === 'anual' ? 'anual' : 'mensual'}
                    {membership.expiresAt && (
                      <> · Activo hasta {membership.expiresAt.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { onClose(); onDonate(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                    <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
                  </svg>
                  Suscripción NeoCalcu Pro
                </button>

                {/* Cupón */}
                <button
                  onClick={handleCouponToggle}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-center pt-1"
                >
                  ¿Tenés un código de regalo?
                </button>

                {couponOpen && (
                  <div className="mt-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                        onKeyDown={e => e.key === 'Enter' && handleRedeemSubmit()}
                        placeholder="XXXXXXXX"
                        maxLength={12}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        autoFocus
                      />
                      <button
                        onClick={handleRedeemSubmit}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                      >
                        {couponLoading ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : 'Canjear'}
                      </button>
                    </div>
                    {couponResult && (
                      <p className={`text-xs px-1 ${couponResult === 'success' ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'}`}>
                        {redeemMessages[couponResult]}
                      </p>
                    )}
                  </div>
                )}

                {/* Recuperar suscripción */}
                <button
                  onClick={handleRecoverToggle}
                  className="text-xs text-slate-400 dark:text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-center"
                >
                  ¿Cambiaste de dispositivo?
                </button>

                {recoverOpen && (
                  <div className="space-y-2">
                    {/* Toggle email / código */}
                    <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        onClick={() => { setRecoverMode('email'); setRecoverResult(null); setRecoverByCouponResult(null); }}
                        className={`flex-1 py-1.5 font-medium transition-colors ${recoverMode === 'email' ? 'bg-brand-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                      >
                        Por email
                      </button>
                      <button
                        onClick={() => { setRecoverMode('code'); setRecoverResult(null); setRecoverByCouponResult(null); }}
                        className={`flex-1 py-1.5 font-medium transition-colors ${recoverMode === 'code' ? 'bg-brand-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
                      >
                        Por código
                      </button>
                    </div>

                    {recoverMode === 'email' ? (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={recoverEmail}
                            onChange={e => { setRecoverEmail(e.target.value); setRecoverResult(null); }}
                            onKeyDown={e => e.key === 'Enter' && handleRecoverSubmit()}
                            placeholder="email con el que pagaste"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            autoFocus
                          />
                          <button
                            onClick={handleRecoverSubmit}
                            disabled={recoverLoading || !recoverEmail.trim()}
                            className="px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                          >
                            {recoverLoading ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            ) : 'OK'}
                          </button>
                        </div>
                        {recoverResult && (
                          <p className={`text-xs px-1 ${recoverResult === 'success' ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'}`}>
                            {recoverMessages[recoverResult]}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={recoverCode}
                            onChange={e => { setRecoverCode(e.target.value.toUpperCase()); setRecoverByCouponResult(null); }}
                            onKeyDown={e => e.key === 'Enter' && handleRecoverByCouponSubmit()}
                            placeholder="XXXXXXXX"
                            maxLength={12}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-mono tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            autoFocus
                          />
                          <button
                            onClick={handleRecoverByCouponSubmit}
                            disabled={recoverLoading || !recoverCode.trim()}
                            className="px-3 py-2 rounded-lg bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                          >
                            {recoverLoading ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            ) : 'OK'}
                          </button>
                        </div>
                        {recoverByCouponResult && (
                          <p className={`text-xs px-1 ${recoverByCouponResult === 'success' ? 'text-brand-600 dark:text-brand-400' : 'text-red-500 dark:text-red-400'}`}>
                            {recoverByCouponMessages[recoverByCouponResult]}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Más de Neomonitor */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Más de Neomonitor
            </h3>
            <a
              href="https://www.getneomonitor.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-400 hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              www.getneomonitor.pro
            </a>
          </section>
        </div>

        {/* Footer — Acerca de */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button
            onClick={() => setDisclaimerOpen(true)}
            className="w-full text-left text-xs text-brand-700 dark:text-brand-400 hover:underline font-medium"
          >
            Acerca de NeoCalcu
          </button>
          <p className="text-xs text-center text-slate-300 dark:text-slate-600">
            NeoCalcu · Neomonitor
          </p>
        </div>
      </aside>

      <DisclaimerModal isOpen={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </>
  );
}
