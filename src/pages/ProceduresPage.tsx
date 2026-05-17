import { useState, useRef } from 'react';
import { trackEvent } from '../utils/analytics';
import PatientInput from '../components/PatientInput';
import ProcedureNotes from '../components/ProcedureNotes';
import { procedures } from '../data/procedures';
import { useFavorites } from '../context/FavoritesContext';
import { usePatient } from '../context/PatientContext';

interface ProceduresPageProps {
  initialExpanded?: string | null;
}

export default function ProceduresPage({ initialExpanded = null }: ProceduresPageProps) {
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(initialExpanded);
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>({});
  const { toggleFavorite, isFavorite } = useFavorites();
  const { patient } = usePatient();
  const procedureRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleProcedure = (id: string) => {
    const next = expandedProcedure === id ? null : id;
    setExpandedProcedure(next);
    if (next) {
      trackEvent('open_procedure', { procedure_id: next });
      setTimeout(() => {
        procedureRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  };

  const calculateFormula = (formula: string, input: number, allInputs?: Record<string, number>): string => {
    const patientKg = patient.weightGrams / 1000;
    try {
      let processedFormula = formula
        .replace(/peso\(kg\)/g, patientKg.toString())
        .replace(/peso_kg/g, patientKg.toString());

      if (allInputs) {
        processedFormula = processedFormula.replace(/\b([a-z_][a-z0-9_]*)\b/g, (match) => {
          if (allInputs[match] !== undefined) {
            return allInputs[match].toString();
          }
          return match;
        });
      }

      const result = eval(processedFormula);
      return parseFloat(result).toFixed(2);
    } catch {
      return '—';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      <PatientInput />

      {/* Procedures list */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div data-onboarding="procedures-list" className="divide-y divide-slate-200 dark:divide-slate-700">
          {[...procedures].sort((a, b) => a.name.localeCompare(b.name, 'es')).map((proc) => (
            <div key={proc.id} ref={el => { procedureRefs.current[proc.id] = el; }} className="bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 transition">
              <div className="flex items-start p-4">
                <button
                  onClick={() => toggleProcedure(proc.id)}
                  className="flex-1 text-left border-0 hover:bg-brand-50 dark:hover:bg-slate-800"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">{proc.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{proc.description}</p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(proc.id);
                  }}
                  className="text-2xl hover:scale-110 transition flex-shrink-0 ml-2"
                  title={isFavorite(proc.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite(proc.id) ? '⭐' : '☆'}
                </button>
                <span className="text-2xl text-slate-300 dark:text-slate-600 flex-shrink-0 ml-2">
                  {expandedProcedure === proc.id ? '−' : '+'}
                </span>
              </div>

              {/* Expanded content */}
              {expandedProcedure === proc.id && (
                <div className="bg-brand-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
                  {/* Formulas */}
                  {proc.formulas && proc.formulas.length > 0 && (
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Fórmulas</h4>
                      <div className="space-y-3">
                        {proc.formulas.map((f, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 rounded p-3 border border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">{f.label}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{f.description}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{f.formula}</span>
                            </p>

                            {/* Inputs - Multiple or single */}
                            {(f as any).inputs ? (
                              <div className="mb-3 space-y-2">
                                {(f as any).inputs.map((inp: any) => (
                                  <div key={inp.id}>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                      {inp.label} ({inp.unit})
                                    </label>
                                    <input
                                      type="number"
                                      value={formulaInputs[`${proc.id}-${idx}-${inp.id}`] || ''}
                                      onChange={(e) =>
                                        setFormulaInputs({
                                          ...formulaInputs,
                                          [`${proc.id}-${idx}-${inp.id}`]: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      placeholder="Ingresa valor"
                                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : f.variableLabel.toLowerCase().includes('peso') ? (
                              <div className="mb-3 bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs text-slate-600 dark:text-slate-300">
                                <p className="font-medium mb-1">Peso registrado:</p>
                                <p>{(patient.weightGrams / 1000).toFixed(2)} kg ({patient.weightGrams} g)</p>
                              </div>
                            ) : (
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                  {f.variableLabel} ({f.variableUnit})
                                </label>
                                <input
                                  type="number"
                                  value={formulaInputs[`${proc.id}-${idx}`] || ''}
                                  onChange={(e) =>
                                    setFormulaInputs({
                                      ...formulaInputs,
                                      [`${proc.id}-${idx}`]: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  placeholder="Ingresa valor"
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                                />
                              </div>
                            )}

                            {/* Result */}
                            {(() => {
                              const hasMultipleInputs = (f as any).inputs;
                              const isFilled = hasMultipleInputs
                                ? (f as any).inputs.every((inp: any) => formulaInputs[`${proc.id}-${idx}-${inp.id}`])
                                : f.variableLabel.toLowerCase().includes('peso') || formulaInputs[`${proc.id}-${idx}`] > 0;

                              if (!isFilled) return null;

                              const allInputs = hasMultipleInputs
                                ? (f as any).inputs.reduce((acc: any, inp: any) => ({
                                    ...acc,
                                    [inp.id]: formulaInputs[`${proc.id}-${idx}-${inp.id}`] || 0,
                                  }), {})
                                : undefined;

                              return (
                                <div className="bg-brand-50 dark:bg-slate-800 rounded p-3 border-l-4 border-brand-500 dark:border-brand-400">
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Resultado</p>
                                  <p className="text-2xl font-bold text-brand-900 dark:text-brand-200">
                                    {calculateFormula(f.formula, formulaInputs[`${proc.id}-${idx}`] || 0, allInputs)}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{f.resultUnit}</p>
                                </div>
                              );
                            })()}

                            {f.reference && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                <span className="font-medium">Ref:</span> {f.reference}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Steps */}
                  {proc.steps && proc.steps.length > 0 && (
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Pasos del procedimiento</h4>
                      <ol className="space-y-2">
                        {proc.steps.map((s, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="font-semibold text-brand-800 dark:text-brand-400 flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <div>
                              <p className="text-sm text-slate-900 dark:text-slate-100">{s.step}</p>
                              {s.note && (
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 bg-amber-50 dark:bg-amber-950 p-2 rounded mt-1">
                                  ⚠️ {s.note}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </section>
                  )}

                  {/* Materials */}
                  {proc.materials && proc.materials.length > 0 && (
                    <section>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Materiales</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        {proc.materials.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Warnings */}
                  {proc.warnings && proc.warnings.length > 0 && (
                    <section className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3">
                      <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">⚠️ Advertencias</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-300">
                        {proc.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Notas del servicio */}
                  <ProcedureNotes procedureId={proc.id} />

                  {/* References */}
                  {proc.references.length > 0 && (
                    <section>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium">Referencias:</span> {proc.references.join(' • ')}
                      </p>
                    </section>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
