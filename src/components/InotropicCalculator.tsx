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
            <div className="mt-3 pt-3 border-t border-brand-600 text-sm text-brand-100">
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
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Dosis
          </label>
          <span className="text-xl font-bold text-brand-800 dark:text-brand-300">
            {dose.toFixed(2)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{config.unit}</span>
          </span>
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
          <span>{config.doseMin}</span>
          <span>{config.doseMax} {config.unit}</span>
        </div>
      </div>

      {/* Selector de flujo */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Flujo de infusión
          </label>
          <span className="text-xl font-bold text-brand-800 dark:text-brand-300">
            {flow.toFixed(1)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">mL/h</span>
          </span>
        </div>
        <input
          type="range"
          min={config.flowMin}
          max={config.flowMax}
          step={config.flowStep}
          value={flow}
          onChange={(e) => setFlow(parseFloat(e.target.value))}
          className="w-full accent-brand-700"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{config.flowMin}</span>
          <span>{config.flowMax} mL/h</span>
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
        <div className="bg-brand-50 dark:bg-slate-800 border-l-4 border-brand-700 dark:border-brand-500 rounded p-3">
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
