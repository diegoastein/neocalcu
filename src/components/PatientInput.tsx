import { useState, useEffect, useRef } from 'react';
import { usePatient, MAX_PATIENTS } from '../context/PatientContext';
import { useMembership } from '../context/MembershipContext';
import { useAnyModalOpen } from '../context/UIContext';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export default function PatientInput() {
  const { patient, setPatient, setPatientDebounced, savedPatients, activeId, switchPatient, addPatient, removePatient, renamePatient } =
    usePatient();
  const { active: isPremium } = useMembership();
  const anyModalOpen = useAnyModalOpen();
  const isMobile = useIsMobile();

  // Gate: non-premium users limited to 4, premium users up to 10
  const effectiveMaxPatients = isPremium ? MAX_PATIENTS : 4;

  const [localWeight, setLocalWeight] = useState('');
  const [localGA, setLocalGA] = useState('');
  const [localDOL, setLocalDOL] = useState('');
  const [localWeightDelta, setLocalWeightDelta] = useState('');
  const [localLabel, setLocalLabel] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const weightInputRef = useRef<HTMLInputElement>(null);
  const saveIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar campos solo cuando cambia el paciente activo (no al guardar)
  useEffect(() => {
    const active = savedPatients.find((p) => p.id === activeId);
    if (!active) return;
    setLocalLabel(active.label);
    setLocalWeight(active.patient.weightGrams > 0 ? active.patient.weightGrams.toString() : '');
    setLocalGA(active.patient.gestAgeWeeks?.toString() ?? '');
    setLocalDOL(active.patient.dayOfLife?.toString() ?? '');
    setLocalWeightDelta(active.patient.previousDayWeightDelta?.toString() ?? '');
    // Al cambiar de paciente: expandir si no tiene peso, colapsar si ya tiene
    setIsExpanded(active.patient.weightGrams <= 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (isExpanded && patient.weightGrams <= 0 && !anyModalOpen) {
      const timer = setTimeout(() => weightInputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, patient.weightGrams, anyModalOpen]);

  const handleLabelBlur = () => {
    const trimmed = localLabel.trim();
    if (trimmed) renamePatient(activeId, trimmed);
  };

  const trySaveAndCollapse = (weight: string, ga: string, dol: string) => {
    const w = parseInt(weight, 10);
    const g = parseInt(ga, 10);
    const d = parseInt(dol, 10);
    if (w > 0 && g > 0 && dol !== '' && d >= 0) {
      setPatient({ weightGrams: w, gestAgeWeeks: g, dayOfLife: d });
      setIsExpanded(false);
    }
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
      previousDayWeightDelta: isPremium && localWeightDelta ? parseInt(localWeightDelta, 10) : undefined,
    });
    setIsExpanded(false);
  };

  const handleReset = () => {
    setLocalWeight('');
    setLocalGA('');
    setLocalDOL('');
    setLocalWeightDelta('');
    setPatient({ weightGrams: 0 });
  };

  const showSaveIndicatorBriefly = () => {
    setShowSaveIndicator(true);
    if (saveIndicatorTimeoutRef.current) {
      clearTimeout(saveIndicatorTimeoutRef.current);
    }
    saveIndicatorTimeoutRef.current = setTimeout(() => {
      setShowSaveIndicator(false);
    }, 1500);
  };

  const handleAutoSave = (weight: string, ga: string, dol: string, weightDelta: string) => {
    const w = parseInt(weight, 10);
    if (w > 0) {
      setPatientDebounced({
        weightGrams: w,
        gestAgeWeeks: ga ? parseInt(ga, 10) : undefined,
        dayOfLife: dol ? parseInt(dol, 10) : undefined,
        previousDayWeightDelta: weightDelta ? parseInt(weightDelta, 10) : undefined,
      });
      showSaveIndicatorBriefly();
    }
  };

  const handleAdd = () => {
    if (!isPremium) return;
    addPatient();
  };

  const handleRemove = (id: string) => {
    if (savedPatients.length <= 1) return;
    removePatient(id);
  };

  const canAdd = savedPatients.length < effectiveMaxPatients;
  const showMultiPatient = isPremium;

  const savedWeight = patient.weightGrams > 0 ? patient.weightGrams.toString() : '';
  const savedGA = patient.gestAgeWeeks?.toString() ?? '';
  const savedDOL = patient.dayOfLife?.toString() ?? '';
  const savedWeightDelta = patient.previousDayWeightDelta?.toString() ?? '';
  const isDirty = localWeight !== savedWeight || localGA !== savedGA || localDOL !== savedDOL || (isPremium && localWeightDelta !== savedWeightDelta);

  return (
    <div data-onboarding="patient-input" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">

      {/* Barra de pacientes — solo visible para suscriptores o si ya hay varios */}
      {showMultiPatient && (
        <>
          {/* MÓVIL: Select dropdown */}
          {isMobile && (
            <div className="px-3 pt-2.5 pb-1">
              <select
                value={activeId}
                onChange={(e) => switchPatient(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                {savedPatients.map((sp) => {
                  const weightLabel = sp.patient.weightGrams > 0 ? ` (${sp.patient.weightGrams}g)` : '';
                  return (
                    <option key={sp.id} value={sp.id}>
                      {sp.label}{weightLabel}
                    </option>
                  );
                })}
              </select>
              <div className="flex gap-2 mt-2">
                {isPremium && (
                  <button
                    onClick={handleAdd}
                    disabled={!canAdd}
                    className={`flex-1 py-2 rounded text-sm font-semibold transition ${
                      canAdd
                        ? 'bg-brand-500 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    title={canAdd ? 'Agregar paciente' : `Máximo ${effectiveMaxPatients} pacientes`}
                  >
                    + Paciente
                  </button>
                )}
                {savedPatients.length > 1 && (
                  <button
                    onClick={() => handleRemove(activeId)}
                    className="px-4 py-2 rounded text-sm font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition"
                    title="Eliminar paciente actual"
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DESKTOP: Tabs horizontales */}
          {!isMobile && (
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
              {isPremium && (
                <button
                  onClick={handleAdd}
                  disabled={!canAdd}
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-base font-bold transition ${
                    canAdd
                      ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-800'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  }`}
                  title={canAdd ? 'Agregar paciente' : `Máximo ${effectiveMaxPatients} pacientes`}
                >
                  +
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Sin suscripción: teaser de la función */}
      {!isPremium && (
        <div data-onboarding="multi-patient" className="mx-3 mt-2 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-2 border-dashed border-slate-300 dark:border-slate-600">
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

      {/* Barra colapsada */}
      {!isExpanded && patient.weightGrams > 0 && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-3 px-4 py-2.5 bg-brand-50 dark:bg-slate-800 hover:bg-brand-100 dark:hover:bg-slate-700 transition text-left"
        >
          <div className="flex-1 flex items-center gap-3 min-w-0 overflow-hidden">
            <span className="flex items-baseline gap-1 shrink-0">
              <span className="text-sm text-brand-700 dark:text-brand-400 font-medium">Peso</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{patient.weightGrams} g</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600 select-none">·</span>
            <span className="flex items-baseline gap-1 shrink-0">
              <span className="text-sm text-brand-700 dark:text-brand-400 font-medium">EG</span>
              {patient.gestAgeWeeks
                ? <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{patient.gestAgeWeeks} sem</span>
                : <span className="text-sm font-bold text-amber-500">—</span>
              }
            </span>
            <span className="text-slate-300 dark:text-slate-600 select-none">·</span>
            <span className="flex items-baseline gap-1 shrink-0">
              <span className="text-sm text-brand-700 dark:text-brand-400 font-medium">Días</span>
              {patient.dayOfLife !== undefined
                ? <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{patient.dayOfLife}</span>
                : <span className="text-sm font-bold text-amber-500">—</span>
              }
            </span>
          </div>
          <svg className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

      {/* Inputs del paciente activo */}
      {isExpanded && (
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

          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            {patient.weightGrams <= 0 ? 'Ingresá el peso para calcular dosis' : 'Datos del paciente'}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Peso (g)</label>
              <input
                ref={weightInputRef}
                type="number"
                value={localWeight}
                onChange={(e) => {
                  setLocalWeight(e.target.value);
                  if (isPremium) handleAutoSave(e.target.value, localGA, localDOL, localWeightDelta);
                }}
                onBlur={(e) => !isPremium && trySaveAndCollapse(e.target.value, localGA, localDOL)}
                className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E.G. (sem)</label>
              <input
                type="number"
                value={localGA}
                onChange={(e) => {
                  setLocalGA(e.target.value);
                  if (isPremium) handleAutoSave(localWeight, e.target.value, localDOL, localWeightDelta);
                }}
                onBlur={(e) => !isPremium && trySaveAndCollapse(localWeight, e.target.value, localDOL)}
                className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Días</label>
              <input
                type="number"
                value={localDOL}
                onChange={(e) => {
                  setLocalDOL(e.target.value);
                  if (isPremium) handleAutoSave(localWeight, localGA, e.target.value, localWeightDelta);
                }}
                onBlur={(e) => !isPremium && trySaveAndCollapse(localWeight, localGA, e.target.value)}
                className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                placeholder="—"
              />
            </div>
          </div>

          {/* Variación de peso — solo para suscriptores */}
          {isPremium && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Variación de peso del día anterior (g)
              </label>
              <input
                type="number"
                value={localWeightDelta}
                onChange={(e) => {
                  setLocalWeightDelta(e.target.value);
                  if (isPremium) handleAutoSave(localWeight, localGA, localDOL, e.target.value);
                }}
                className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                placeholder="Ej: +50 o -30 (opcional)"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Positivo para aumento, negativo para pérdida. Campo opcional.
              </p>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            {!isPremium ? (
              <>
                <button
                  onClick={handleSave}
                  className={`flex-1 text-white font-semibold py-2 rounded transition ${
                    isDirty
                      ? 'bg-brand-500 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 animate-pulse'
                      : 'bg-brand-800 hover:bg-brand-900 dark:bg-brand-700 dark:hover:bg-brand-600 opacity-50'
                  }`}
                >
                  {isDirty ? '⬤ Registrar datos' : 'Registrar datos'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-2 rounded transition"
                  title="Resetear datos del paciente"
                >
                  ↻
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 px-4 py-2 bg-brand-50 dark:bg-slate-800/50 rounded flex items-center justify-center text-xs font-medium text-brand-700 dark:text-brand-400">
                  {showSaveIndicator ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Guardado
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">Auto guardado</span>
                  )}
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-2 rounded transition"
                  title="Resetear datos del paciente"
                >
                  ↻
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
