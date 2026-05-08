import { useEffect, useState } from 'react';

interface FirstAccessDisclaimerProps {
  onAccept: () => void;
}

export default function FirstAccessDisclaimer({ onAccept }: FirstAccessDisclaimerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('disclaimerAccepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setIsVisible(false);
    onAccept();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg shadow-2xl">
          {/* Content */}
          <div className="px-6 py-8 text-center space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                Aviso importante
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Al utilizar esta herramienta, usted reconoce que es un profesional de la salud y que verificará los cálculos de forma independiente.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-sm font-semibold transition-colors"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
