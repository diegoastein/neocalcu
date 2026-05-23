import { useState, useEffect, useRef } from 'react';
import { trackEvent } from '../utils/analytics';
import PatientInput from '../components/PatientInput';
import BilirubinCalculator from '../components/BilirubinCalculator';
import ROPCalculator from '../components/ROPCalculator';
import FinnceganCalculator from '../components/FinnceganCalculator';
import IntergrowthCalculator from '../components/IntergrowthCalculator';
import AdmissionSummary from '../components/AdmissionSummary';
import NutricionParenteralCalculator from '../components/NutricionParenteralCalculator';
import ShareResultButton from '../components/ShareResultButton';
import { scores } from '../data/scores';
import { formulas } from '../data/formulas';
import { usePatient } from '../context/PatientContext';
import { useFavorites } from '../context/FavoritesContext';
import { useMembership } from '../context/MembershipContext';

interface ScoreState {
  [itemId: string]: number;
}

interface CalculadorasPageProps {
  initialId?: string | null;
  onOpenSubscription?: () => void;
}

const colorMap: { [key: string]: string } = {
  green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200',
  yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200',
  orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200',
  red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200',
};

type Section = 'scores' | 'formulas';

export default function CalculadorasPage({ initialId, onOpenSubscription }: CalculadorasPageProps = {}) {
  const getInitialSection = (id: string | null | undefined): Section => {
    if (id && formulas.some((f) => f.id === id)) return 'formulas';
    return 'scores';
  };

  const [activeSection, setActiveSection] = useState<Section>(getInitialSection(initialId));
  const [expandedId, setExpandedId] = useState<string | null>(initialId ?? null);
  const [scoreStates, setScoreStates] = useState<Record<string, ScoreState>>({});
  const [inputsMap, setInputsMap] = useState<Record<string, Record<string, string>>>({});
  const { patient } = usePatient();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { active: isPremium } = useMembership();
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const switchSection = (section: Section) => {
    setActiveSection(section);
    setExpandedId(null);
  };

  const toggle = (id: string) => {
    const next = expandedId === id ? null : id;
    if (next) {
      trackEvent('select_calculator', {
        calculator_id: next,
        type: scores.some((s) => s.id === next) ? 'score' : 'formula',
      });
      setTimeout(() => {
        itemRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
    setExpandedId(next);
  };

  // Pre-fill peso cuando se abre una fórmula que lo requiere
  useEffect(() => {
    if (!expandedId) return;
    const formula = formulas.find((f) => f.id === expandedId);
    if (formula?.inputs.some((inp) => inp.id === 'peso')) {
      setInputsMap((prev) => ({
        ...prev,
        [expandedId]: { ...prev[expandedId], peso: String(patient.weightGrams / 1000) },
      }));
    }
  }, [expandedId, patient.weightGrams]);

  const getFormulaInputs = (id: string) => inputsMap[id] ?? {};
  const getScoreState = (id: string) => scoreStates[id] ?? {};

  const parseInputs = (formulaId: string): Record<string, number> => {
    const vars: Record<string, number> = {};
    for (const [k, v] of Object.entries(getFormulaInputs(formulaId))) {
      const parsed = parseFloat(v);
      if (!isNaN(parsed)) vars[k] = parsed;
    }
    return vars;
  };

  const calcFormula = (formulaId: string): number | null => {
    const f = formulas.find((x) => x.id === formulaId);
    if (!f || !f.formula) return null;
    const vars = parseInputs(formulaId);
    if (f.formula.includes('peso') && !vars['peso']) vars['peso'] = patient.weightGrams / 1000;
    try {
      const result = eval(
        f.formula.replace(/\b([a-z_][a-z0-9_]*)\b/g, (m) =>
          vars[m] !== undefined ? vars[m].toString() : m
        )
      );
      return typeof result === 'number' ? result : null;
    } catch { return null; }
  };

  const calcMultiple = (formulaId: string): Record<string, number> => {
    const f = formulas.find((x) => x.id === formulaId);
    if (!f?.calculations) return {};
    const vars = parseInputs(formulaId);
    if (!vars['peso']) vars['peso'] = patient.weightGrams / 1000;
    f.inputs.forEach((inp) => { if (!(inp.id in vars)) vars[inp.id] = 0; });
    const calculations = f.calculations as Record<string, string>;
    const hidden = new Set(f.calculationsHidden ?? []);
    const results: Record<string, number> = {};
    for (const key of Object.keys(calculations)) {
      try {
        const processed = calculations[key].replace(/\b([a-z_][a-z0-9_]*)\b/g, (m) =>
          vars[m] !== undefined ? vars[m].toString() : m
        );
        const val = eval(processed);
        if (typeof val === 'number' && !isNaN(val)) {
          vars[key] = val;
          if (!hidden.has(key)) results[key] = val;
        }
      } catch { /* skip */ }
    }
    return results;
  };

  const renderScoreContent = (scoreId: string) => {
    const score = scores.find((s) => s.id === scoreId)!;
    const state = getScoreState(scoreId);
    const total = Object.values(state).reduce((a, b) => a + b, 0);
    const allAnswered = score.items.length > 0 && score.items.every((item) => state[item.id] !== undefined);
    const interpretation = allAnswered
      ? score.interpretation.find((i) => total >= i.min && total <= i.max) ?? null
      : null;
    const isSpecial = score.admissionSummary || score.bilirubinCalculator || score.ropCalculator || score.finneganCalculator || score.intergrowthCalculator;

    if (score.isPremium && !isPremium) {
      return (
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">Función para suscriptores</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clasificá el peso al nacer como AEG, PEG o GEG con percentil estimado según INTERGROWTH-21st.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-brand-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
        {score.subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{score.subtitle}</p>}
        {score.description && <p className="text-xs text-slate-500 dark:text-slate-400">{score.description}</p>}

        {score.admissionSummary && <AdmissionSummary onSubscribe={onOpenSubscription} />}
        {score.bilirubinCalculator && <BilirubinCalculator references={score.references} />}
        {score.ropCalculator && <ROPCalculator references={score.references} />}
        {score.finneganCalculator && <FinnceganCalculator references={score.references} />}
        {score.intergrowthCalculator && <IntergrowthCalculator />}

        {!isSpecial && (
          <div className="space-y-4">
            {score.items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{item.name}</h3>
                <div className="space-y-2">
                  {item.values.map((value) => (
                    <label key={value.score} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name={`${scoreId}-${item.id}`}
                        value={value.score}
                        checked={state[item.id] === value.score}
                        onChange={() =>
                          setScoreStates((prev) => ({
                            ...prev,
                            [scoreId]: { ...prev[scoreId], [item.id]: value.score },
                          }))
                        }
                        className="w-4 h-4 text-brand-800 dark:text-brand-400 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value.label}</p>
                        {value.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{value.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-brand-800 dark:text-brand-400 bg-brand-50 dark:bg-slate-800 px-2 py-1 rounded">
                        {value.score}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {allAnswered && (
              <div className="space-y-4">
                <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-4">
                  <p className="text-xs text-brand-600 dark:text-brand-400 mb-1">Puntuación total</p>
                  <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{total}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                    Rango: {score.minScore}–{score.maxScore}
                  </p>
                </div>
                {interpretation && (
                  <div className={`rounded p-4 border ${colorMap[interpretation.color]}`}>
                    <h4 className="font-semibold mb-2">
                      {interpretation.color === 'green' && '✓ '}
                      {(interpretation.color === 'yellow' || interpretation.color === 'orange') && '⚠️ '}
                      {interpretation.color === 'red' && '🚨 '}
                      {interpretation.label}
                    </h4>
                    <p className="text-sm">{interpretation.action}</p>
                  </div>
                )}
                <ShareResultButton
                  title={score.name}
                  text={[
                    `${score.name} — NeoCalcu`,
                    `Puntuación: ${total} / ${score.maxScore}`,
                    interpretation?.label ?? '',
                    interpretation?.action ?? '',
                  ].filter(Boolean).join('\n')}
                />
                {score.references.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Referencias:</span> {score.references.join(' • ')}
                  </p>
                )}
              </div>
            )}

            {Object.keys(state).length > 0 && (
              <button
                onClick={() => setScoreStates((prev) => ({ ...prev, [scoreId]: {} }))}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFormulaContent = (formulaId: string) => {
    const f = formulas.find((x) => x.id === formulaId)!;

    if (f.nptCalculator) {
      return (
        <div className="bg-brand-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4">
          {f.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{f.description}</p>}
          <NutricionParenteralCalculator reference={f.reference} />
        </div>
      );
    }

    const inputs = getFormulaInputs(formulaId);
    const formulaResult = calcFormula(formulaId);
    const allFilled = f.inputs.filter((inp) => inp.required).every((inp) => {
      const v = parseFloat(inputs[inp.id] ?? '');
      return !isNaN(v) && v > 0;
    });

    return (
      <div className="bg-brand-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
        {f.description && <p className="text-sm text-slate-600 dark:text-slate-400">{f.description}</p>}

        {f.formula && (
          <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded p-3">
            <p className="text-xs text-brand-600 dark:text-brand-400 mb-2 font-medium">Fórmula</p>
            <code className="text-sm text-brand-900 dark:text-brand-200 font-mono break-words">{f.formula}</code>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Datos de entrada</h3>
          {f.inputs.map((input) => (
            <div key={input.id}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {input.label} ({input.unit})
                {input.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={inputs[input.id] ?? ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  setInputsMap((prev) => ({
                    ...prev,
                    [formulaId]: { ...prev[formulaId], [input.id]: raw },
                  }));
                }}
                onBlur={(e) => {
                  const raw = e.target.value;
                  const v = parseFloat(raw);
                  if (raw !== '' && !isNaN(v)) {
                    setInputsMap((prev) => ({
                      ...prev,
                      [formulaId]: { ...prev[formulaId], [input.id]: String(v) },
                    }));
                  }
                }}
                placeholder={`Ingresa ${input.label.toLowerCase()}`}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          ))}
        </div>

        {!f.calculations && allFilled && formulaResult !== null && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded p-4">
              <p className="text-xs text-brand-600 dark:text-brand-400 mb-2 font-medium">Resultado</p>
              <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{formulaResult.toFixed(2)}</p>
              <p className="text-sm text-brand-700 dark:text-brand-300 mt-2">
                {f.resultLabel}: {f.resultUnit}
              </p>
            </div>
            <ShareResultButton
              title={f.name}
              text={`${f.name} — NeoCalcu\n${f.resultLabel}: ${formulaResult.toFixed(2)} ${f.resultUnit}`}
            />
          </div>
        )}

        {f.calculations && allFilled && (() => {
          const results = calcMultiple(formulaId);
          const labels = f.calculationsLabels ?? {};
          const units = f.calculationsUnits ?? {};
          const lines = Object.entries(results).map(([k, v]) =>
            `${labels[k] ?? k}: ${v.toFixed(2)}${units[k] ? ' ' + units[k] : ''}`
          );
          return (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Resultados</h3>
              {Object.entries(results).map(([key, value]) => (
                <div key={key} className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded p-3">
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">{labels[key] ?? key}</p>
                  <p className="text-2xl font-bold text-brand-900 dark:text-brand-200">{value.toFixed(2)}</p>
                  {units[key] && <p className="text-xs text-brand-700 dark:text-brand-300 mt-1">{units[key]}</p>}
                </div>
              ))}
              <ShareResultButton
                title={f.name}
                text={`${f.name} — NeoCalcu\n${lines.join('\n')}`}
              />
            </div>
          );
        })()}

        {f.notes && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3">
            <p className="text-xs text-amber-900 dark:text-amber-200">
              <span className="font-medium">Nota:</span> {f.notes}
            </p>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Referencia:</span> {f.reference}
        </p>
      </div>
    );
  };

  const kit = scores.find((s) => s.id === 'admision_neonatal')!;
  const regularScores = scores.filter((s) => s.id !== 'admision_neonatal');

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      <PatientInput />

      {/* Card Kit del Paciente Crítico */}
      <div className="px-3 pt-3 pb-0 bg-white dark:bg-slate-950">
        <div
          ref={(el) => { itemRefs.current[kit.id] = el; }}
          className="rounded-xl border-2 border-brand-700 dark:border-brand-500 overflow-hidden"
        >
          <button
            onClick={() => toggle(kit.id)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-brand-700 dark:bg-brand-700 text-white text-left"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 font-semibold text-sm">{kit.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(kit.id); }}
              className="transition flex-shrink-0"
              title={isFavorite(kit.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
            >
              <svg className={`w-5 h-5 transition-colors ${isFavorite(kit.id) ? 'text-amber-400 fill-amber-400' : 'text-white/60 fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            </button>
            <span className="text-xl flex-shrink-0 ml-1 select-none opacity-80">
              {expandedId === kit.id ? '−' : '+'}
            </span>
          </button>
          {expandedId === kit.id && renderScoreContent(kit.id)}
        </div>
      </div>

      {/* INTERGROWTH-21st — teaser para no suscriptores */}
      {!isPremium && (
        <div className="px-3 pt-2 pb-0 bg-white dark:bg-slate-950">
          <button
            onClick={() => { setActiveSection('scores'); toggle('intergrowth_clasificador'); trackEvent('open_intergrowth_teaser'); }}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-brand-700 dark:border-brand-500 rounded-xl text-left"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-brand-700 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">INTERGROWTH-21st</p>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-brand-700 text-white">Pro</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Clasificador AEG / PEG / GEG con percentil estimado</p>
            </div>
            <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Tabs fijos */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-16 z-10 mt-3">
        <button
          onClick={() => switchSection('scores')}
          className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${
            activeSection === 'scores'
              ? 'border-brand-600 text-brand-700 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Índices clínicos
        </button>
        <button
          onClick={() => switchSection('formulas')}
          className={`flex-1 py-2.5 text-sm font-semibold transition border-b-2 ${
            activeSection === 'formulas'
              ? 'border-brand-600 text-brand-700 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          Fórmulas
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {activeSection === 'scores' && (
          <div data-onboarding="calculadora-select" className="divide-y divide-slate-200 dark:divide-slate-700">
            {regularScores.map((score) => (
              <div
                key={score.id}
                ref={(el) => { itemRefs.current[score.id] = el; }}
                className="bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-start p-4">
                  <button onClick={() => toggle(score.id)} className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{score.name}</h3>
                      {score.isPremium && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-brand-700 text-white flex-shrink-0">Pro</span>
                      )}
                    </div>
                    {score.subtitle && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{score.subtitle}</p>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(score.id); }}
                    className="transition flex-shrink-0 ml-2"
                    title={isFavorite(score.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                  >
                    <svg className={`w-5 h-5 transition-colors ${isFavorite(score.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </button>
                  <span className="text-2xl text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2 select-none">
                    {expandedId === score.id ? '−' : '+'}
                  </span>
                </div>
                {expandedId === score.id && renderScoreContent(score.id)}
              </div>
            ))}
          </div>
        )}

        {activeSection === 'formulas' && (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {formulas.map((formula) => (
              <div
                key={formula.id}
                ref={(el) => { itemRefs.current[formula.id] = el; }}
                className="bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex items-start p-4">
                  <button onClick={() => toggle(formula.id)} className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{formula.name}</h3>
                    {formula.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{formula.description}</p>
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(formula.id); }}
                    className="transition flex-shrink-0 ml-2"
                    title={isFavorite(formula.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                  >
                    <svg className={`w-5 h-5 transition-colors ${isFavorite(formula.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </button>
                  <span className="text-2xl text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2 select-none">
                    {expandedId === formula.id ? '−' : '+'}
                  </span>
                </div>
                {expandedId === formula.id && renderFormulaContent(formula.id)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
