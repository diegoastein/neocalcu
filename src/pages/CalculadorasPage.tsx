import { useState, useEffect } from 'react';
import PatientInput from '../components/PatientInput';
import TooltipHint from '../components/TooltipHint';
import { useTooltip } from '../hooks/useTooltip';
import BilirubinCalculator from '../components/BilirubinCalculator';
import ROPCalculator from '../components/ROPCalculator';
import FinnceganCalculator from '../components/FinnceganCalculator';
import ShareResultButton from '../components/ShareResultButton';
import { scores } from '../data/scores';
import { formulas } from '../data/formulas';
import { usePatient } from '../context/PatientContext';
import { useFavorites } from '../context/FavoritesContext';

type ItemType = 'score' | 'formula';

interface ScoreState {
  [itemId: string]: number;
}

interface CalculadorasPageProps {
  initialId?: string | null;
}

export default function CalculadorasPage({ initialId }: CalculadorasPageProps = {}) {
  const getInitialType = (id: string | null | undefined): ItemType => {
    if (id && formulas.some((f) => f.id === id)) return 'formula';
    return 'score';
  };

  const [selectedId, setSelectedId] = useState<string>(initialId || scores[0]?.id || '');
  const [selectedType, setSelectedType] = useState<ItemType>(getInitialType(initialId));
  const [scoreState, setScoreState] = useState<ScoreState>({});
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const { patient } = usePatient();
  const { toggleFavorite, isFavorite } = useFavorites();

  const currentScore = selectedType === 'score' ? scores.find((s) => s.id === selectedId) : undefined;
  const currentFormula = selectedType === 'formula' ? formulas.find((f) => f.id === selectedId) : undefined;

  const handleSelect = (value: string) => {
    const isScore = scores.some((s) => s.id === value);
    setSelectedId(value);
    setSelectedType(isScore ? 'score' : 'formula');
    setScoreState({});
    setInputs({});
  };

  useEffect(() => {
    if (currentFormula && currentFormula.inputs.some((inp) => inp.id === 'peso')) {
      setInputs((prev) => ({ ...prev, peso: patient.weightGrams / 1000 }));
    }
  }, [currentFormula, patient.weightGrams]);

  // — Score logic —
  const currentScoreItems = currentScore?.items || [];
  const totalScore = Object.values(scoreState).reduce((a, b) => a + b, 0);
  const allScoreAnswered =
    currentScoreItems.length > 0 && currentScoreItems.every((item) => scoreState[item.id] !== undefined);

  const getInterpretation = () => {
    if (!currentScore) return null;
    return currentScore.interpretation.find((i) => totalScore >= i.min && totalScore <= i.max);
  };
  const interpretation = allScoreAnswered ? getInterpretation() : null;

  const colorMap: { [key: string]: string } = {
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200',
    yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200',
    orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200',
  };

  // — Formula logic —
  const calculateFormula = (): number | null => {
    if (!currentFormula || !currentFormula.formula) return null;
    const variables: Record<string, number> = { ...inputs };
    if (currentFormula.formula.includes('peso') && !variables['peso']) {
      variables['peso'] = patient.weightGrams / 1000;
    }
    try {
      const result = eval(
        currentFormula.formula.replace(/\b([a-z_][a-z0-9_]*)\b/g, (match) =>
          variables[match] !== undefined ? variables[match].toString() : match
        )
      );
      return typeof result === 'number' ? result : null;
    } catch {
      return null;
    }
  };

  const calculateMultipleFormulas = (): Record<string, number> => {
    if (!currentFormula?.calculations) return {};
    const variables: Record<string, number> = { ...inputs };
    if (!variables['peso']) variables['peso'] = patient.weightGrams / 1000;
    currentFormula.inputs.forEach((inp) => {
      if (!(inp.id in variables)) variables[inp.id] = 0;
    });
    const calculations = currentFormula.calculations as Record<string, string>;
    const hidden = new Set(currentFormula.calculationsHidden ?? []);
    const results: Record<string, number> = {};
    for (const key of Object.keys(calculations)) {
      try {
        const processed = calculations[key].replace(/\b([a-z_][a-z0-9_]*)\b/g, (m) =>
          variables[m] !== undefined ? variables[m].toString() : m
        );
        const val = eval(processed);
        if (typeof val === 'number' && !isNaN(val)) {
          variables[key] = val;
          if (!hidden.has(key)) results[key] = val;
        }
      } catch { /* skip */ }
    }
    return results;
  };

  const tip = useTooltip('calculadoras');

  const formulaResult = calculateFormula();
  const allRequiredInputsFilled = currentFormula
    ? currentFormula.inputs.filter((inp) => inp.required).every((inp) => inputs[inp.id] !== undefined && inputs[inp.id] > 0)
    : false;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      <PatientInput />

      {tip.visible && (
        <TooltipHint
          text="Elegí un índice clínico o fórmula en el selector. El peso del paciente activo se completa automáticamente."
          onDismiss={tip.dismiss}
        />
      )}

      {/* Selector unificado */}
      <div className="bg-brand-50 dark:bg-slate-900 border-b border-brand-200 dark:border-slate-700 px-4 py-3 sticky top-16 z-10">
        <label className="block text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide mb-2">
          Selecciona índice o fórmula
        </label>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full appearance-none px-4 py-3 pr-10 border-2 border-brand-400 dark:border-brand-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-base focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <optgroup label="Índices clínicos">
              {scores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </optgroup>
            <optgroup label="Fórmulas">
              {formulas.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </optgroup>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-brand-500 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* ——— SCORE ——— */}
        {currentScore && (
          <div className="p-4 space-y-4">
            <section>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentScore.name}</h1>
                </div>
                <button
                  onClick={() => toggleFavorite(currentScore.id)}
                  className="text-2xl hover:scale-110 transition flex-shrink-0"
                  title={isFavorite(currentScore.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite(currentScore.id) ? '⭐' : '☆'}
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{currentScore.subtitle}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{currentScore.description}</p>
            </section>

            {currentScore.bilirubinCalculator && (
              <BilirubinCalculator references={currentScore.references} />
            )}
            {currentScore.ropCalculator && (
              <ROPCalculator references={currentScore.references} />
            )}
            {currentScore.finneganCalculator && (
              <FinnceganCalculator references={currentScore.references} />
            )}

            <section className="space-y-4">
              {!currentScore.bilirubinCalculator && !currentScore.ropCalculator && !currentScore.finneganCalculator && currentScore.items.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{item.name}</h3>
                  <div className="space-y-2">
                    {item.values.map((value) => (
                      <label key={value.score} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={item.id}
                          value={value.score}
                          checked={scoreState[item.id] === value.score}
                          onChange={() => setScoreState({ ...scoreState, [item.id]: value.score })}
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
            </section>

            {!currentScore.bilirubinCalculator && !currentScore.ropCalculator && !currentScore.finneganCalculator && allScoreAnswered && (
              <section className="space-y-4">
                <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-4">
                  <p className="text-xs text-brand-600 dark:text-brand-400 mb-1">Puntuación total</p>
                  <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{totalScore}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                    Rango: {currentScore.minScore}–{currentScore.maxScore}
                  </p>
                </div>
                {interpretation && (
                  <div className={`rounded p-4 border ${colorMap[interpretation.color]}`}>
                    <h4 className="font-semibold mb-2">
                      {interpretation.color === 'green' && '✓ '}
                      {interpretation.color === 'yellow' && '⚠️ '}
                      {interpretation.color === 'orange' && '⚠️ '}
                      {interpretation.color === 'red' && '🚨 '}
                      {interpretation.label}
                    </h4>
                    <p className="text-sm">{interpretation.action}</p>
                  </div>
                )}
                <ShareResultButton
                  title={currentScore.name}
                  text={[
                    `${currentScore.name} — NeoCalcu`,
                    `Puntuación: ${totalScore} / ${currentScore.maxScore}`,
                    interpretation ? `${interpretation.label}` : '',
                    interpretation ? interpretation.action : '',
                  ].filter(Boolean).join('\n')}
                />
                {currentScore.references.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Referencias:</span> {currentScore.references.join(' • ')}
                  </p>
                )}
              </section>
            )}

            {!currentScore.bilirubinCalculator && !currentScore.ropCalculator && !currentScore.finneganCalculator && Object.keys(scoreState).length > 0 && (
              <button
                onClick={() => setScoreState({})}
                className="w-full mt-4 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* ——— FORMULA ——— */}
        {currentFormula && (
          <div className="p-4 space-y-4">
            <section>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentFormula.name}</h1>
                </div>
                <button
                  onClick={() => toggleFavorite(currentFormula.id)}
                  className="text-2xl hover:scale-110 transition flex-shrink-0"
                  title={isFavorite(currentFormula.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite(currentFormula.id) ? '⭐' : '☆'}
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{currentFormula.description}</p>
            </section>

            {currentFormula.formula && (
              <section className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-3">
                <p className="text-xs text-brand-600 dark:text-brand-400 mb-2 font-medium">Fórmula</p>
                <code className="text-sm text-brand-900 dark:text-brand-200 font-mono break-words">
                  {currentFormula.formula}
                </code>
              </section>
            )}

            <section className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Datos de entrada</h3>
              {currentFormula.inputs.map((input) => (
                <div key={input.id}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {input.label} ({input.unit})
                    {input.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="number"
                    value={inputs[input.id] || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) setInputs({ ...inputs, [input.id]: value });
                    }}
                    placeholder={`Ingresa ${input.label.toLowerCase()}`}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}
            </section>

            {!currentFormula.calculations && allRequiredInputsFilled && formulaResult !== null && (
              <section className="space-y-3">
                <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-4">
                  <p className="text-xs text-brand-600 dark:text-brand-400 mb-2 font-medium">Resultado</p>
                  <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{formulaResult.toFixed(2)}</p>
                  <p className="text-sm text-brand-700 dark:text-brand-300 mt-2">
                    {currentFormula.resultLabel}: {currentFormula.resultUnit}
                  </p>
                </div>
                <ShareResultButton
                  title={currentFormula.name}
                  text={`${currentFormula.name} — NeoCalcu\n${currentFormula.resultLabel}: ${formulaResult.toFixed(2)} ${currentFormula.resultUnit}`}
                />
              </section>
            )}

            {currentFormula.calculations && allRequiredInputsFilled && (
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Resultados</h3>
                {(() => {
                  const results = calculateMultipleFormulas();
                  const labels = currentFormula.calculationsLabels ?? {};
                  const units = currentFormula.calculationsUnits ?? {};
                  const lines = Object.entries(results).map(([key, value]) =>
                    `${labels[key] ?? key}: ${value.toFixed(2)}${units[key] ? ' ' + units[key] : ''}`
                  );
                  return (
                    <>
                      {Object.entries(results).map(([key, value]) => (
                        <div key={key} className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-3">
                          <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">{labels[key] ?? key}</p>
                          <p className="text-2xl font-bold text-brand-900 dark:text-brand-200">{value.toFixed(2)}</p>
                          {units[key] && <p className="text-xs text-brand-700 dark:text-brand-300 mt-1">{units[key]}</p>}
                        </div>
                      ))}
                      <ShareResultButton
                        title={currentFormula.name}
                        text={`${currentFormula.name} — NeoCalcu\n${lines.join('\n')}`}
                      />
                    </>
                  );
                })()}
              </section>
            )}

            {currentFormula.notes && (
              <section className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3">
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-medium">Nota:</span> {currentFormula.notes}
                </p>
              </section>
            )}

            <section>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">Referencia:</span> {currentFormula.reference}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
