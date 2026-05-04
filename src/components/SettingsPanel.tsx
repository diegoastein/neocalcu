import { useEffect, useState } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  canInstall: boolean;
  onInstall: () => void;
}

const themeModes: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Día' },
  { value: 'dark', label: 'Noche' },
];

export default function SettingsPanel({
  isOpen,
  onClose,
  themeMode,
  onThemeChange,
  canInstall,
  onInstall,
}: SettingsPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = 'https://diegoastein.github.io/neocalcu/';
    const shareData = { title: 'NeoCalcu', text: 'Calculadora clínica para neonatología', url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* cancelado */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

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

          {/* Aviso legal */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Aviso legal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              NeoCalcu es una herramienta de referencia clínica con fines informativos y educativos. Los cálculos y la información proporcionada no reemplazan el juicio clínico del profesional de la salud ni constituyen una recomendación médica.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              El uso de esta aplicación es responsabilidad exclusiva del usuario. Los autores, colaboradores y Neomonitor no asumen ninguna responsabilidad por daños, perjuicios o consecuencias derivadas directa o indirectamente del uso de esta información en la práctica clínica.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            NeoCalcu · Neomonitor
          </p>
        </div>
      </aside>
    </>
  );
}
