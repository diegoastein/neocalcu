import { useState, useEffect, useCallback } from 'react';

const STEPS = [
  {
    target: 'patient-input',
    title: 'Ingresá el peso',
    text: 'Todos los cálculos se ajustan automáticamente al peso que ingresás acá arriba.',
  },
  {
    target: 'drug-search',
    title: 'Buscá un medicamento',
    text: 'Escribí el nombre y filtramos entre más de 200 drogas de la UCIN al instante.',
  },
  {
    target: 'drug-list',
    title: 'Dosis al toque',
    text: 'Tocá cualquier medicamento y obtenés la dosis exacta para el peso que ingresaste.',
  },
];

export default function OnboardingTooltip() {
  const [done, setDone] = useState(() => !!localStorage.getItem('neo_onboarding_done'));
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<{ arrowLeft: number; cardTop: number } | null>(null);

  const calcPos = useCallback(() => {
    if (done) return;
    const el = document.querySelector(`[data-onboarding="${STEPS[step].target}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = Math.min(Math.max(rect.left + rect.width / 2, 22), window.innerWidth - 22);
    const rawTop = rect.bottom + 8;
    const cardTop = Math.min(rawTop, window.innerHeight - 220);
    setPos({ arrowLeft: centerX, cardTop });
  }, [step, done]);

  useEffect(() => {
    requestAnimationFrame(calcPos);
  }, [calcPos]);

  if (done) return null;

  const advance = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem('neo_onboarding_done', '1');
      setDone(true);
    }
  };

  const current = STEPS[step];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={advance} />

      {pos && (
        <>
          {/* Arrow */}
          <div
            className="fixed w-4 h-4 bg-brand-700 rotate-45 z-[42]"
            style={{ top: pos.cardTop - 8, left: pos.arrowLeft - 8 }}
          />
          {/* Card */}
          <div
            className="fixed left-4 right-4 bg-brand-700 rounded-2xl shadow-2xl p-5 z-[43]"
            style={{ top: pos.cardTop }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
                  Cómo funciona
                </span>
                <span className="text-white/60 text-xs">{step + 1} / {STEPS.length}</span>
              </div>
              <button
                onClick={advance}
                className="text-white/50 hover:text-white text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Dots */}
            <div className="flex gap-1.5 mb-3">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-5 bg-white' : i < step ? 'w-1.5 bg-white/40' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <p className="font-bold text-white text-base mb-1">{current.title}</p>
            <p className="text-sm text-white/80 mb-4 leading-relaxed">{current.text}</p>

            <button
              onClick={advance}
              className="w-full py-2.5 bg-white hover:bg-brand-50 text-brand-800 text-sm font-bold rounded-xl transition-colors"
            >
              {step < STEPS.length - 1 ? 'Entendido →' : '¡Listo, empezar!'}
            </button>
          </div>
        </>
      )}
    </>
  );
}
