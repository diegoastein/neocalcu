import { useState, useEffect, useCallback } from 'react';

interface OnboardingStep {
  target: string;
  title: string;
  text: string;
}

interface OnboardingTooltipProps {
  steps: OnboardingStep[];
  storageKey: string;
  legacyKey?: string;
}

export default function OnboardingTooltip({ steps, storageKey, legacyKey }: OnboardingTooltipProps) {
  const [done, setDone] = useState(() =>
    !!localStorage.getItem(storageKey) || !!(legacyKey && localStorage.getItem(legacyKey))
  );
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<{ arrowLeft: number; cardTop: number } | null>(null);

  const markDone = useCallback(() => {
    localStorage.setItem(storageKey, '1');
    setDone(true);
  }, [storageKey]);

  const calcPos = useCallback(() => {
    if (done) return;
    const el = document.querySelector(`[data-onboarding="${steps[step].target}"]`);
    if (!el) {
      setPos({ arrowLeft: -999, cardTop: Math.round(window.innerHeight * 0.35) });
      return;
    }
    const rect = el.getBoundingClientRect();
    const centerX = Math.min(Math.max(rect.left + rect.width / 2, 22), window.innerWidth - 22);
    const rawTop = rect.bottom + 8;
    const cardTop = Math.min(rawTop, window.innerHeight - 220);
    setPos({ arrowLeft: centerX, cardTop });
  }, [step, done, steps]);

  useEffect(() => {
    requestAnimationFrame(calcPos);
  }, [calcPos]);

  if (done) return null;

  const advance = () => {
    if (step < steps.length - 1) {
      setPos(null);
      setStep(s => s + 1);
    } else {
      markDone();
    }
  };

  const current = steps[step];
  const showArrow = pos && pos.arrowLeft !== -999;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70" onClick={advance} />

      {pos && (
        <>
          {showArrow && (
            <div
              className="fixed w-4 h-4 bg-brand-700 rotate-45 z-[42]"
              style={{ top: pos.cardTop - 8, left: pos.arrowLeft - 8 }}
            />
          )}
          <div
            className="fixed left-4 right-4 bg-brand-700 rounded-2xl shadow-2xl p-5 z-[43]"
            style={{ top: pos.cardTop }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
                  Cómo funciona
                </span>
                <span className="text-white/60 text-xs">{step + 1} / {steps.length}</span>
              </div>
              <button
                onClick={markDone}
                className="text-white/50 hover:text-white text-2xl leading-none transition-colors"
                title="Saltear todo"
              >
                ×
              </button>
            </div>

            <div className="flex gap-1.5 mb-3">
              {steps.map((_, i) => (
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

            <div className="flex items-center gap-3">
              <button
                onClick={advance}
                className="flex-1 py-2.5 bg-white hover:bg-brand-50 text-brand-800 text-sm font-bold rounded-xl transition-colors"
              >
                {step < steps.length - 1 ? 'Entendido →' : '¡Listo, empezar!'}
              </button>
              {step < steps.length - 1 && (
                <button
                  onClick={markDone}
                  className="text-white/50 hover:text-white text-sm transition-colors whitespace-nowrap"
                >
                  Saltear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
