import { useState } from 'react';
import PatientInput from '../components/PatientInput';
import { procedures } from '../data/procedures';

export default function ProceduresPage() {
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);
  const [formulaInputs, setFormulaInputs] = useState<Record<string, number>>({});

  const toggleProcedure = (id: string) => {
    setExpandedProcedure(expandedProcedure === id ? null : id);
  };

  const calculateFormula = (formula: string, input: number): string => {
    const kg = input / 1000;
    try {
      const result = eval(formula.replace(/peso\(kg\)/g, kg.toString()));
      return parseFloat(result).toFixed(2);
    } catch {
      return '—';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <PatientInput />

      {/* Procedures list */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="divide-y divide-slate-200">
          {procedures.map((proc) => (
            <div key={proc.id} className="bg-white">
              <button
                onClick={() => toggleProcedure(proc.id)}
                className="w-full text-left p-4 hover:bg-blue-50 transition border-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{proc.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{proc.description}</p>
                  </div>
                  <span className="text-2xl text-slate-300">
                    {expandedProcedure === proc.id ? '−' : '+'}
                  </span>
                </div>
              </button>

              {/* Expanded content */}
              {expandedProcedure === proc.id && (
                <div className="bg-blue-50 border-t border-slate-200 p-4 space-y-4">
                  {/* Formulas */}
                  {proc.formulas && proc.formulas.length > 0 && (
                    <section>
                      <h4 className="font-semibold text-slate-900 mb-3">Fórmulas</h4>
                      <div className="space-y-3">
                        {proc.formulas.map((f, idx) => (
                          <div key={idx} className="bg-white rounded p-3 border border-slate-200">
                            <p className="text-sm font-medium text-slate-900 mb-2">{f.label}</p>
                            <p className="text-xs text-slate-600 mb-2">{f.description}</p>
                            <p className="text-sm text-slate-700 mb-3">
                              <span className="font-mono bg-slate-100 px-2 py-1 rounded">{f.formula}</span>
                            </p>

                            {/* Input */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
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
                                className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Result */}
                            {formulaInputs[`${proc.id}-${idx}`] > 0 && (
                              <div className="bg-green-50 rounded p-3 border-l-4 border-green-500">
                                <p className="text-xs text-slate-600 mb-1">Resultado</p>
                                <p className="text-2xl font-bold text-green-900">
                                  {calculateFormula(f.formula, formulaInputs[`${proc.id}-${idx}`])}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">{f.resultUnit}</p>
                              </div>
                            )}

                            {f.reference && (
                              <p className="text-xs text-slate-500 mt-2">
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
                      <h4 className="font-semibold text-slate-900 mb-3">Pasos del procedimiento</h4>
                      <ol className="space-y-2">
                        {proc.steps.map((s, idx) => (
                          <li key={idx} className="flex gap-3">
                            <span className="font-semibold text-blue-800 flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <div>
                              <p className="text-sm text-slate-900">{s.step}</p>
                              {s.note && (
                                <p className="text-xs text-amber-700 mt-1 bg-amber-50 p-2 rounded mt-1">
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
                      <h4 className="font-semibold text-slate-900 mb-2">Materiales</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                        {proc.materials.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Warnings */}
                  {proc.warnings && proc.warnings.length > 0 && (
                    <section className="bg-red-50 border border-red-200 rounded p-3">
                      <h4 className="font-semibold text-red-900 mb-2">⚠️ Advertencias</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                        {proc.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* References */}
                  {proc.references.length > 0 && (
                    <section>
                      <p className="text-xs text-slate-500">
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
