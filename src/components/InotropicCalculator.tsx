import { useState } from 'react';
import { InotropicConfig } from '../types';
import { usePatient } from '../context/PatientContext';

interface Props {
  config: InotropicConfig;
  drugName: string;
}

export default function InotropicCalculator({ config, drugName }: Props) {
  const { patient } = usePatient();
  const weightKg = patient.weightGrams / 1000;

  const [dose, setDose] = useState(config.defaultDose);
  const [flow, setFlow] = useState(config.defaultFlow);
  const [volume, setVolume] = useState(config.defaultVolume);

  // mg a preparar = dosis × peso × volumen × 60 / (flujo × 1000)
  const mgToPrepare = (dose * weightKg * volume * 60) / (flow * 1000);

  // mcg/kg/min que entrega 1 mL/h con esta preparación
  const doseAt1mLh = (mgToPrepare * 1000) / (volume * weightKg * 60);

  const clampDose = (val: number) =>
    Math.min(config.doseMax, Math.max(config.doseMin, parseFloat(val.toFixed(2))));

  const clampFlow = (val: number) =>
    Math.max(0.1, parseFloat(val.toFixed(1)));

  const hasWeight = patient.weightGrams > 0;

  return (
    <div className="space-y-4">
      {/* Resultado principal */}
      <div className="bg-brand-800 dark:bg-brand-900 text-white rounded-xl p-4">
        {hasWeight ? (
          <>
            <p className="text-brand-200 text-sm mb-1">
              Preparación para {weightKg.toFixed(2)} kg
            </p>
            <p className="text-4xl font-bold tracking-tight">
              {mgToPrepare.toFixed(2)} mg
            </p>
            <p className="text-brand-100 text-sm mt-1">
              añadir a {volume} mL de {config.diluent}
            </p>
            <div className="mt-3 pt-3 border-t border-brand-600 space-y-1 text-sm text-brand-100">
              <p>
                → 1 mL/h entregará{' '}
                <span className="text-white font-bold">
                  {doseAt1mLh.toFixed(3)} {config.unit}
                </span>
              </p>
              <p>
                → A {flow} mL/h entregará{' '}
                <span className="text-white font-bold">
                  {dose.toFixed(2)} {config.unit}
                </span>
              </p>
            </div>
          </>
        ) : (
          <p className="text-brand-200 text-sm">
            Ingresá el peso del paciente para calcular la preparación
          </p>
        )}
      </div>

      {/* Selector de dosis */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Dosis ({config.unit})
        </label>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setDose(clampDose(dose - config.doseStep))}
            className="w-10 h-10 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            −
          </button>
          <input
            type="number"
            value={dose}
            step={config.doseStep}
            min={config.doseMin}
            max={config.doseMax}
            onChange={(e) => setDose(clampDose(parseFloat(e.target.value) || config.doseMin))}
            className="flex-1 text-center text-2xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={() => setDose(clampDose(dose + config.doseStep))}
            className="w-10 h-10 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={config.doseMin}
          max={config.doseMax}
          step={config.doseStep}
          value={dose}
          onChange={(e) => setDose(parseFloat(e.target.value))}
          className="w-full accent-brand-700"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{config.doseMin} {config.unit}</span>
          <span>{config.doseMax} {config.unit}</span>
        </div>
      </div>

      {/* Selector de flujo */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Flujo de infusión (mL/h)
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFlow(clampFlow(flow - 0.1))}
            className="w-10 h-10 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            −
          </button>
          <input
            type="number"
            value={flow}
            step={0.1}
            min={0.1}
            onChange={(e) => setFlow(clampFlow(parseFloat(e.target.value) || 0.1))}
            className="flex-1 text-center text-2xl font-bold border border-slate-300 dark:border-slate-600 rounded-lg p-2 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={() => setFlow(clampFlow(flow + 0.1))}
            className="w-10 h-10 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            +
          </button>
        </div>
      </div>

      {/* Selector de volumen */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Volumen de dilución (mL)
        </label>
        <div className="flex gap-2">
          {config.volumes.map((vol) => (
            <button
              key={vol}
              onClick={() => setVolume(vol)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
                volume === vol
                  ? 'bg-brand-800 dark:bg-brand-700 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {vol} mL
            </button>
          ))}
        </div>
      </div>

      {/* Instrucción de enfermería */}
      {hasWeight && (
        <div className="bg-brand-50 dark:bg-brand-950 border-l-4 border-brand-700 dark:border-brand-500 rounded p-3">
          <p className="text-xs font-semibold text-brand-800 dark:text-brand-300 uppercase mb-1">
            Indicación
          </p>
          <p className="text-sm text-brand-900 dark:text-brand-100 font-medium">
            {drugName}: {mgToPrepare.toFixed(2)} mg en {volume} mL de {config.diluent}.
            Infundir a {flow} mL/h = {dose.toFixed(2)} {config.unit}.
          </p>
        </div>
      )}
    </div>
  );
}
