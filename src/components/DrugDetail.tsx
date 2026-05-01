import { useState } from 'react';
import { Drug, DosingRule } from '../types';
import { usePatient } from '../context/PatientContext';
import { matchDosingRule, calcDose } from '../utils/calculations';
import InotropicCalculator from './InotropicCalculator';

interface DrugDetailProps {
  drug: Drug;
  onClose: () => void;
}

export default function DrugDetail({ drug, onClose }: DrugDetailProps) {
  const { patient } = usePatient();
  const [selectedRuleIndex, setSelectedRuleIndex] = useState(0);

  const rules = drug.dosingRules || [];
  const availableRules =
    patient.gestAgeWeeks || patient.dayOfLife
      ? rules.filter((r) => {
          if (r.gaMin !== undefined && patient.gestAgeWeeks !== undefined && patient.gestAgeWeeks < r.gaMin) return false;
          if (r.gaMax !== undefined && patient.gestAgeWeeks !== undefined && patient.gestAgeWeeks >= r.gaMax)
            return false;
          if (r.dolMin !== undefined && patient.dayOfLife !== undefined && patient.dayOfLife < r.dolMin) return false;
          if (r.dolMax !== undefined && patient.dayOfLife !== undefined && patient.dayOfLife >= r.dolMax)
            return false;
          if (r.weightMinG !== undefined && patient.weightGrams < r.weightMinG) return false;
          if (r.weightMaxG !== undefined && patient.weightGrams >= r.weightMaxG) return false;
          return true;
        })
      : rules;

  const selectedRule = availableRules[selectedRuleIndex];
  const hasValidPreparation = drug.preparation && drug.preparation.concentrationMgMl;
  const calculation = selectedRule && hasValidPreparation ? calcDose(selectedRule, drug.preparation, patient.weightGrams) : null;
  const matchedRule = matchDosingRule(rules, patient);

  const categoryBadgeColor: { [key: string]: string } = {
    antibiotico: 'bg-blue-100 text-blue-800',
    antiviral: 'bg-purple-100 text-purple-800',
    antifungico: 'bg-orange-100 text-orange-800',
    cardiovascular: 'bg-red-100 text-red-800',
    analgesico_sedante: 'bg-indigo-100 text-indigo-800',
    diuretico: 'bg-green-100 text-green-800',
    surfactante: 'bg-yellow-100 text-yellow-800',
    respiratorio: 'bg-cyan-100 text-cyan-800',
    emergencia: 'bg-red-200 text-red-900',
    vitaminas_electrolitos: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white dark:bg-slate-900 w-full max-h-[90vh] rounded-t-lg overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{drug.name}</h2>
            {drug.genericName && <p className="text-sm text-slate-500 dark:text-slate-400">{drug.genericName}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {drug.category.map((cat) => (
                <span key={cat} className={`text-xs font-semibold px-2 py-1 rounded ${categoryBadgeColor[cat] || 'bg-slate-100'}`}>
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-2xl text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Indications */}
          {drug.indications.length > 0 && (
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Indicaciones</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {drug.indications.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
              {drug.references.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span className="font-medium">Fuente:</span> {drug.references.join(' • ')}
                </p>
              )}
            </section>
          )}

          {/* Contraindications */}
          {drug.contraindications && drug.contraindications.length > 0 && (
            <section className="bg-red-50 border border-red-200 rounded p-3">
              <h3 className="font-semibold text-red-900 mb-2">⚠️ Contraindicaciones</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                {drug.contraindications.map((contra, i) => (
                  <li key={i}>{contra}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Calculador inotrópico */}
          {drug.inotropicConfig && (
            <section className="bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Calculador de infusión</h3>
              <InotropicCalculator config={drug.inotropicConfig} drugName={drug.name} />
            </section>
          )}

          {/* Dosing Rules */}
          {!drug.inotropicConfig && availableRules.length > 0 && (
            <section className="bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 rounded p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Dosificación</h3>

              {!hasValidPreparation && (
                <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Información de preparación incompleta. Consultar con farmacéutico.
                  </p>
                </div>
              )}

              {availableRules.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Régimen</label>
                  <select
                    value={selectedRuleIndex}
                    onChange={(e) => setSelectedRuleIndex(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:bg-slate-800 dark:text-slate-200"
                  >
                    {availableRules.map((rule, idx) => (
                      <option key={idx} value={idx}>
                        {rule.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {calculation && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-slate-800 rounded p-3 border-l-4 border-brand-800 dark:border-brand-400">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Dosis/kg</p>
                      <p className="text-lg font-bold text-brand-900 dark:text-brand-200">{selectedRule.dosePerKg} mg/kg</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded p-3 border-l-4 border-brand-800 dark:border-brand-400">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Intervalo</p>
                      <p className="text-lg font-bold text-brand-900 dark:text-brand-200">{selectedRule.frequency}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded p-3 border-l-4 border-brand-800 dark:border-brand-400">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Dosis calculada</p>
                    <p className="text-3xl font-bold text-brand-900 dark:text-brand-200">{calculation.doseTotal} mg</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{calculation.volumeMl} mL</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Instrucción de enfermería</p>
                    <div className="bg-white dark:bg-slate-800 rounded p-3 border-l-4 border-brand-800 dark:border-brand-400">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{calculation.nursingInstruction}</p>
                    </div>
                  </div>

                  {selectedRule.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                      <p className="text-xs text-yellow-800">
                        <strong>Nota:</strong> {selectedRule.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!calculation && (
                <div className="text-sm text-slate-600 dark:text-slate-400 p-3 bg-white dark:bg-slate-800 rounded">
                  Datos de dosis disponibles pero sin información de preparación.
                </div>
              )}
            </section>
          )}

          {/* Preparation */}
          {drug.preparation && (
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Preparación</h3>
              <div className="space-y-2 text-sm">
                {drug.preparation.stockForm && (
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Presentación:</span> <span className="text-slate-700 dark:text-slate-300">{drug.preparation.stockForm}</span>
                  </p>
                )}
                {drug.preparation.concentrationMgMl && (
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Concentración:</span> <span className="text-slate-700 dark:text-slate-300">{drug.preparation.concentrationMgMl} mg/mL</span>
                  </p>
                )}
                {drug.preparation.reconstitution && (
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Reconstitución:</span> <span className="text-slate-700 dark:text-slate-300">{drug.preparation.reconstitution}</span>
                  </p>
                )}
                {drug.preparation.dilutionInstructions && drug.preparation.dilutionInstructions.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Diluciones:</span>
                    <ul className="list-disc list-inside mt-1 text-slate-700 dark:text-slate-300">
                      {drug.preparation.dilutionInstructions.map((instr, i) => (
                        <li key={i}>{instr}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {drug.preparation.stability && (
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Estabilidad:</span> <span className="text-slate-700 dark:text-slate-300">{drug.preparation.stability}</span>
                  </p>
                )}
                {drug.preparation.lightSensitive && (
                  <p className="text-amber-700 dark:text-amber-300 font-semibold">🛡️ Sensible a la luz — proteger de exposición directa</p>
                )}
              </div>
            </section>
          )}

          {/* Incompatibilities */}
          {drug.administration && (drug.administration.compatibleWith || drug.administration.incompatibleWith) && (
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Compatibilidad IV</h3>
              <div className="space-y-2 text-sm">
                {drug.administration.compatibleWith && (
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Compatible con:</p>
                    <p className="text-slate-700 dark:text-slate-300">{drug.administration.compatibleWith.join(', ')}</p>
                  </div>
                )}
                {drug.administration.incompatibleWith && (
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Incompatible con:</p>
                    <p className="text-slate-700 dark:text-slate-300">{drug.administration.incompatibleWith.join(', ')}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Monitoring */}
          {drug.monitoring?.length && drug.monitoring.length > 0 && (
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Monitorización</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {drug.monitoring.map((mon, i) => (
                  <li key={i}>{mon}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Adverse Effects */}
          {drug.adverseEffects?.length && drug.adverseEffects.length > 0 && (
            <section>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Efectos adversos</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {drug.adverseEffects.map((effect, i) => (
                  <li key={i}>{effect}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
