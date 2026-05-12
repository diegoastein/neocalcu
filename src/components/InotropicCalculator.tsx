import { useState, useMemo } from 'react';
import { InotropicConfig } from '../types';
import { usePatient } from '../context/PatientContext';
import { useMembership } from '../context/MembershipContext';

interface Props {
  config: InotropicConfig;
  drugName: string;
}

export default function InotropicCalculator({ config, drugName }: Props) {
  const { patient } = usePatient();
  const { active: isPremium } = useMembership();
  const weightKg = patient.weightGrams / 1000;

  const [dose, setDose] = useState(config.defaultDose);
  const [flow, setFlow] = useState(config.defaultFlow);
  const [volume, setVolume] = useState(config.defaultVolume);
  const [showTable, setShowTable] = useState(false);

  // mg a preparar = dosis × peso × volumen × 60 / (flujo × 1000)
  const mgToPrepare = (dose * weightKg * volume * 60) / (flow * 1000);

  const hasWeight = patient.weightGrams > 0;

  // Filas de la tabla: todos los pasos de dosis del rango
  const doseRows = useMemo(() => {
    const rows: number[] = [];
    const steps = Math.round((config.doseMax - config.doseMin) / config.doseStep);
    for (let i = 0; i <= steps; i++) {
      rows.push(parseFloat((config.doseMin + i * config.doseStep).toFixed(10)));
    }
    return rows;
  }, [config.doseMin, config.doseMax, config.doseStep]);

  // Flujo para un dose y volumen objetivo, manteniendo los mg actuales fijos
  const calcFlow = (targetDose: number, targetVol: number): number => {
    if (mgToPrepare <= 0 || !hasWeight) return 0;
    return (targetDose * weightKg * targetVol * 60) / (mgToPrepare * 1000);
  };

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

      {/* Toggle tabla de velocidades */}
      {hasWeight && (
        isPremium ? (
          <button
            onClick={() => setShowTable((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            <span>Tabla de velocidades</span>
            <svg
              className={`w-4 h-4 transition-transform ${showTable ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-600 select-none">
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tabla de velocidades</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Dosis × volumen × flujo completa</p>
            </div>
            <div className="flex flex-col items-center gap-1 ml-3">
              <div className="bg-brand-700 dark:bg-brand-600 rounded-lg p-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xs font-bold text-brand-700 dark:text-brand-400 whitespace-nowrap">Suscriptores</span>
            </div>
          </div>
        )
      )}

      {/* Tabla de velocidades */}
      {showTable && hasWeight && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-b border-slate-200 dark:border-slate-600">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preparación base: <span className="font-semibold text-slate-700 dark:text-slate-200">{mgToPrepare.toFixed(2)} mg</span> — flujos en mL/h
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                  <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {config.unit}
                  </th>
                  {config.volumes.map((vol) => (
                    <th
                      key={vol}
                      className={`px-3 py-2 text-center font-semibold whitespace-nowrap ${
                        vol === volume
                          ? 'text-brand-700 dark:text-brand-300'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {vol} mL
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doseRows.map((d, idx) => {
                  const isActive = Math.abs(d - dose) < config.doseStep * 0.5;
                  return (
                    <tr
                      key={d}
                      className={`border-t border-slate-100 dark:border-slate-700 ${
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-900/40'
                          : idx % 2 === 0
                          ? 'bg-white dark:bg-slate-800'
                          : 'bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <td className={`px-3 py-2 font-semibold whitespace-nowrap ${
                        isActive ? 'text-brand-800 dark:text-brand-200' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {d % 1 === 0 ? d.toFixed(0) : d}
                      </td>
                      {config.volumes.map((vol) => {
                        const f = calcFlow(d, vol);
                        return (
                          <td
                            key={vol}
                            className={`px-3 py-2 text-center whitespace-nowrap ${
                              isActive && vol === volume
                                ? 'font-bold text-brand-800 dark:text-brand-200'
                                : isActive || vol === volume
                                ? 'font-semibold text-slate-800 dark:text-slate-100'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {f.toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
