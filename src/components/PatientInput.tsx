import { useState } from 'react';
import { usePatient } from '../context/PatientContext';

export default function PatientInput() {
  const { patient, setPatient } = usePatient();
  const [localWeight, setLocalWeight] = useState(patient.weightGrams.toString());
  const [localGA, setLocalGA] = useState(patient.gestAgeWeeks?.toString() ?? '');
  const [localDOL, setLocalDOL] = useState(patient.dayOfLife?.toString() ?? '');

  const handleSave = () => {
    const weight = parseInt(localWeight, 10);
    if (!weight || weight <= 0) {
      alert('El peso debe ser mayor a 0');
      return;
    }

    setPatient({
      weightGrams: weight,
      gestAgeWeeks: localGA ? parseInt(localGA, 10) : undefined,
      dayOfLife: localDOL ? parseInt(localDOL, 10) : undefined,
    });
  };

  const handleReset = () => {
    setLocalWeight('2500');
    setLocalGA('');
    setLocalDOL('');
    setPatient({ weightGrams: 2500 });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Datos del paciente</h2>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Peso (g)</label>
          <input
            type="number"
            value={localWeight}
            onChange={(e) => setLocalWeight(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
            placeholder="2500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E.G. (sem)</label>
          <input
            type="number"
            value={localGA}
            onChange={(e) => setLocalGA(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
            placeholder="—"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Días</label>
          <input
            type="number"
            value={localDOL}
            onChange={(e) => setLocalDOL(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
            placeholder="—"
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-brand-800 hover:bg-brand-900 dark:bg-brand-700 dark:hover:bg-brand-600 text-white font-semibold py-2 rounded transition"
        >
          Registrar datos
        </button>
        <button
          onClick={handleReset}
          className="px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-2 rounded transition"
          title="Resetear datos del paciente"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
