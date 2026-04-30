import { useState } from 'react';
import { Drug, DosingRule } from '../types';
import { usePatient } from '../context/PatientContext';
import { matchDosingRule, calcDose } from '../utils/calculations';

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
  const calculation = selectedRule ? calcDose(selectedRule, drug.preparation, patient.weightGrams) : null;
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
      <div className="bg-white w-full max-h-[90vh] rounded-t-lg overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{drug.name}</h2>
            {drug.genericName && <p className="text-sm text-slate-500">{drug.genericName}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {drug.category.map((cat) => (
                <span key={cat} className={`text-xs font-semibold px-2 py-1 rounded ${categoryBadgeColor[cat] || 'bg-slate-100'}`}>
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Indications */}
          {drug.indications.length > 0 && (
            <section>
              <h3 className="font-semibold text-slate-900 mb-2">Indicaciones</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                {drug.indications.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
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

          {/* Dosing Rules */}
          {availableRules.length > 0 && (
            <section className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Dosificación</h3>

              {availableRules.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Régimen</label>
                  <select
                    value={selectedRuleIndex}
                    onChange={(e) => setSelectedRuleIndex(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                  <div className="bg-white rounded p-3 border-l-4 border-blue-800">
                    <p className="text-xs text-slate-600 mb-1">Dosis calculada</p>
                    <p className="text-3xl font-bold text-blue-900">{calculation.doseTotal} mg</p>
                    <p className="text-sm text-slate-600 mt-1">{calculation.volumeMl} mL</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 mb-1">Instrucción de enfermería</p>
                    <div className="bg-white rounded p-3 border-l-4 border-blue-800">
                      <p className="font-semibold text-slate-900">{calculation.nursingInstruction}</p>
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
            </section>
          )}

          {/* Preparation */}
          <section>
            <h3 className="font-semibold text-slate-900 mb-2">Preparación</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium text-slate-700">Presentación:</span> {drug.preparation.stockForm}
              </p>
              <p>
                <span className="font-medium text-slate-700">Concentración:</span> {drug.preparation.concentrationMgMl} mg/mL
              </p>
              {drug.preparation.reconstitution && (
                <p>
                  <span className="font-medium text-slate-700">Reconstitución:</span> {drug.preparation.reconstitution}
                </p>
              )}
              <div>
                <span className="font-medium text-slate-700">Diluciones:</span>
                <ul className="list-disc list-inside mt-1 text-slate-700">
                  {drug.preparation.dilutionInstructions.map((instr, i) => (
                    <li key={i}>{instr}</li>
                  ))}
                </ul>
              </div>
              {drug.preparation.stability && (
                <p>
                  <span className="font-medium text-slate-700">Estabilidad:</span> {drug.preparation.stability}
                </p>
              )}
              {drug.preparation.lightSensitive && (
                <p className="text-amber-700 font-semibold">🛡️ Sensible a la luz — proteger de exposición directa</p>
              )}
            </div>
          </section>

          {/* Incompatibilities */}
          {(drug.administration.compatibleWith || drug.administration.incompatibleWith) && (
            <section>
              <h3 className="font-semibold text-slate-900 mb-2">Compatibilidad IV</h3>
              <div className="space-y-2 text-sm">
                {drug.administration.compatibleWith && (
                  <div>
                    <p className="font-medium text-green-700">Compatible con:</p>
                    <p className="text-slate-700">{drug.administration.compatibleWith.join(', ')}</p>
                  </div>
                )}
                {drug.administration.incompatibleWith && (
                  <div>
                    <p className="font-medium text-red-700">Incompatible con:</p>
                    <p className="text-slate-700">{drug.administration.incompatibleWith.join(', ')}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Monitoring */}
          {drug.monitoring && drug.monitoring.length > 0 && (
            <section>
              <h3 className="font-semibold text-slate-900 mb-2">Monitorización</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                {drug.monitoring.map((mon, i) => (
                  <li key={i}>{mon}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Adverse Effects */}
          {drug.adverseEffects && drug.adverseEffects.length > 0 && (
            <section>
              <h3 className="font-semibold text-slate-900 mb-2">Efectos adversos</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
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
