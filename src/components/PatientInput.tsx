import { useState, useEffect } from 'react';
import { usePatient, MAX_PATIENTS } from '../context/PatientContext';
import { useMembership } from '../context/MembershipContext';

export default function PatientInput() {
  const { patient, setPatient, savedPatients, activeId, switchPatient, addPatient, removePatient, renamePatient } =
    usePatient();
  const { active: isPremium } = useMembership();

  const [localWeight, setLocalWeight] = useState('');
  const [localGA, setLocalGA] = useState('');
  const [localDOL, setLocalDOL] = useState('');
  const [localLabel, setLocalLabel] = useState('');

  // Sincronizar campos solo cuando cambia el paciente activo (no al guardar)
  useEffect(() => {
    const active = savedPatients.find((p) => p.id === activeId);
    if (!active) return;
    setLocalLabel(active.label);
    setLocalWeight(active.patient.weightGrams > 0 ? active.patient.weightGrams.toString() : '');
    setLocalGA(active.patient.gestAgeWeeks?.toString() ?? '');
    setLocalDOL(active.patient.dayOfLife?.toString() ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleLabelBlur = () => {
    const trimmed = localLabel.trim();
    if (trimmed) renamePatient(activeId, trimmed);
  };

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
    setLocalWeight('');
    setLocalGA('');
    setLocalDOL('');
    setPatient({ weightGrams: 0 });
  };

  const handleAdd = () => {
    if (!isPremium) return;
    addPatient();
  };

  const handleRemove = (id: string) => {
    if (savedPatients.length <= 1) return;
    removePatient(id);
  };

  const canAdd = savedPatients.length < MAX_PATIENTS;
  const showMultiPatient = isPremium;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">

      {/* Barra de pacientes — solo visible para suscriptores o si ya hay varios */}
      {showMultiPatient && (
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1 overflow-x-auto scrollbar-hide">
          {savedPatients.map((sp) => {
            const isActive = sp.id === activeId;
            const weightLabel = sp.patient.weightGrams > 0 ? ` · ${sp.patient.weightGrams}g` : '';
            return (
              <div key={sp.id} className="flex items-center shrink-0">
                <button
                  onClick={() => switchPatient(sp.id)}
                  className={`flex items-center gap-1 pl-3 pr-2 py-1.5 rounded-l-full text-xs font-semibold transition ${
                    isActive
                      ? 'bg-brand-800 dark:bg-brand-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <span className="max-w-[72px] truncate">{sp.label}</span>
                  <span className={`text-[10px] ${isActive ? 'text-brand-200' : 'text-slate-400'}`}>
                    {weightLabel}
                  </span>
                </button>
                {savedPatients.length > 1 && (
                  <button
                    onClick={() => handleRemove(sp.id)}
                    className={`pr-2 py-1.5 rounded-r-full text-xs transition ${
                      isActive
                        ? 'bg-brand-800 dark:bg-brand-700 text-brand-300 hover:text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                    title="Eliminar paciente"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Botón + */}
          {isPremium ? (
            <button
              onClick={handleAdd}
              disabled={!canAdd}
              className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition ${
                canAdd
                  ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
              }`}
              title={canAdd ? 'Agregar paciente' : `Máximo ${MAX_PATIENTS} pacientes`}
            >
              +
            </button>
          ) : (
            <div
              className="shrink-0 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 text-xs text-slate-400 dark:text-slate-500 select-none"
              title="Múltiples pacientes disponible para suscriptores"
            >
              <div className="bg-brand-700 dark:bg-brand-600 rounded p-0.5">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="font-semibold text-brand-600 dark:text-brand-400">+paciente</span>
            </div>
          )}
        </div>
      )}

      {/* Sin suscripción: teaser de la función */}
      {!isPremium && (
        <div className="mx-3 mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-600">
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Múltiples pacientes</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Hasta 4 pacientes simultáneos</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 ml-3">
            <div className="bg-brand-700 dark:bg-brand-600 rounded-lg p-1.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-brand-700 dark:text-brand-400 whitespace-nowrap">Suscriptores</span>
          </div>
        </div>
      )}

      {/* Inputs del paciente activo */}
      <div className="p-4">
        {/* Campo de nombre — solo para suscriptores con múltiples pacientes */}
        {isPremium && savedPatients.length > 1 && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre / cama</label>
            <input
              type="text"
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={handleLabelBlur}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
              placeholder="Ej: Cama 3, García"
              maxLength={20}
            />
          </div>
        )}

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
    </div>
  );
}
