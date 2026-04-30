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

  return (
    <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Datos del paciente</h2>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Peso (g)</label>
          <input
            type="number"
            value={localWeight}
            onChange={(e) => setLocalWeight(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="2500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">GA (sem)</label>
          <input
            type="number"
            value={localGA}
            onChange={(e) => setLocalGA(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="—"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Días</label>
          <input
            type="number"
            value={localDOL}
            onChange={(e) => setLocalDOL(e.target.value)}
            className="w-full px-2 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="—"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        className="mt-3 w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 rounded transition"
      >
        Registrar datos
      </button>
    </div>
  );
}
