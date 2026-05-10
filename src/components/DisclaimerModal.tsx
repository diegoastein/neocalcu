import { useEffect } from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
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

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Acerca de NeoCalcu</h2>
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

          {/* Content */}
          <div className="px-6 py-6 space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Aviso Legal y Responsabilidad</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">1. Propósito de la aplicación</h4>
                  <p className="text-sm leading-relaxed">
                    Esta herramienta (NeoCalcu) ha sido desarrollada con fines exclusivamente informativos y como soporte para la práctica profesional. Su objetivo es facilitar el cálculo de dosis y parámetros clínicos basados en literatura médica de referencia.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">2. Fuentes de información</h4>
                  <p className="text-sm leading-relaxed">
                    Los algoritmos y datos utilizados en esta aplicación se basan en las recomendaciones vigentes de la Sociedad Argentina de Pediatría (SAP) y el manual Neofax. No obstante, el desarrollador no garantiza que la información esté libre de errores o totalmente actualizada, dada la constante evolución de la ciencia médica.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">3. Uso profesional exclusivo</h4>
                  <p className="text-sm leading-relaxed">
                    Esta aplicación está dirigida únicamente a profesionales de la salud. No debe ser utilizada por personas ajenas al ámbito médico para el diagnóstico o tratamiento de condiciones de salud.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">4. Responsabilidad del usuario</h4>
                  <p className="text-sm leading-relaxed">
                    El uso de esta herramienta y la aplicación de los resultados obtenidos son responsabilidad exclusiva del profesional que la utiliza. Los cálculos deben ser verificados siempre por el profesional antes de cualquier intervención clínica. El desarrollador no se responsabiliza por daños o perjuicios derivados de errores en los datos, fallos en el software o interpretaciones incorrectas de la información proporcionada.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">5. Independencia</h4>
                  <p className="text-sm leading-relaxed">
                    Esta aplicación es un proyecto independiente y no cuenta con el aval oficial, patrocinio ni afiliación con la Sociedad Argentina de Pediatría (SAP) ni con los editores de Neofax.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-brand-800 hover:bg-brand-900 text-white text-sm font-medium transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
