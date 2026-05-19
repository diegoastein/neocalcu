import { useState, useEffect } from 'react';
import PatientInput from '../components/PatientInput';
import { formulas } from '../data/formulas';
import { usePatient } from '../context/PatientContext';
import { useFavorites } from '../context/FavoritesContext';

interface FormulasPageProps {
  initialFormula?: string | null;
}

export default function FormulasPage({ initialFormula = null }: FormulasPageProps) {
  const [selectedFormula, setSelectedFormula] = useState<string>(initialFormula || formulas[0]?.id || '');
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const { patient } = usePatient();
  const { toggleFavorite, isFavorite } = useFavorites();

  const currentFormula = formulas.find((f) => f.id === selectedFormula);

  // Auto-fill weight for formulas that require it
  useEffect(() => {
    if (currentFormula && currentFormula.inputs.some((inp) => inp.id === 'peso')) {
      setInputs((prev) => ({
        ...prev,
        peso: patient.weightGrams / 1000,
      }));
    }
  }, [currentFormula, patient.weightGrams]);

  const calculateFormula = (): number | null => {
    if (!currentFormula || !currentFormula.formula) return null;

    const variables: Record<string, number> = { ...inputs };

    // Agregar peso automáticamente si la fórmula lo requiere
    if (currentFormula.formula.includes('peso') && !variables['peso']) {
      variables['peso'] = patient.weightGrams / 1000; // convertir a kg
    }

    try {
      const result = eval(currentFormula.formula.replace(/\b([a-z_][a-z0-9_]*)\b/g, (match) => {
        if (variables[match] !== undefined) {
          return variables[match].toString();
        }
        return match;
      }));
      return typeof result === 'number' ? result : null;
    } catch {
      return null;
    }
  };

  const calculateMultipleFormulas = (): Record<string, number> => {
    if (!currentFormula?.calculations) return {};

    const variables: Record<string, number> = { ...inputs };
    if (!variables['peso']) variables['peso'] = patient.weightGrams / 1000;
    currentFormula.inputs.forEach((inp) => {
      if (!(inp.id in variables)) variables[inp.id] = 0;
    });

    const calculations = currentFormula.calculations as Record<string, string>;
    const hidden = new Set(currentFormula.calculationsHidden ?? []);
    const results: Record<string, number> = {};

    for (const key of Object.keys(calculations)) {
      try {
        const processed = calculations[key].replace(/\b([a-z_][a-z0-9_]*)\b/g, (m) =>
          variables[m] !== undefined ? variables[m].toString() : m
        );
        const val = eval(processed);
        if (typeof val === 'number' && !isNaN(val)) {
          variables[key] = val;
          if (!hidden.has(key)) results[key] = val;
        }
      } catch { /* skip */ }
    }

    return results;
  };

  const result = calculateFormula();

  // Verificar si todos los inputs requeridos están presentes
  const allRequiredInputsFilled = currentFormula
    ? currentFormula.inputs.filter((inp) => inp.required).every((inp) => inputs[inp.id] !== undefined && inputs[inp.id] > 0)
    : false;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      <PatientInput />

      {/* Formula selector */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-16 z-10">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Selecciona fórmula</label>
        <select
          value={selectedFormula}
          onChange={(e) => {
            setSelectedFormula(e.target.value);
            setInputs({});
          }}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
        >
          {formulas.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {currentFormula && (
          <div className="p-4 space-y-4">
            {/* Header */}
            <section>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentFormula.name}</h1>
                </div>
                <button
                  onClick={() => toggleFavorite(currentFormula.id)}
                  className="transition flex-shrink-0"
                  title={isFavorite(currentFormula.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  <svg className={`w-5 h-5 transition-colors ${isFavorite(currentFormula.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">{currentFormula.description}</p>
            </section>

            {/* Formula display */}
            {currentFormula.formula && (
              <section className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-3">
                <p className="text-xs text-brand-600 dark:text-brand-400 mb-2 font-medium">Fórmula</p>
                <code className="text-sm text-brand-900 dark:text-brand-200 font-mono break-words">{currentFormula.formula}</code>
              </section>
            )}

            {/* Inputs */}
            <section className="space-y-3">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Datos de entrada</h3>
              {currentFormula.inputs
                .filter((input) => {
                  if (input.id !== 'peso') return true;
                  const hasFormula = currentFormula.formula?.includes('peso');
                  const hasCalculations = Object.values(currentFormula.calculations || {}).some((calc: any) =>
                    calc.toString().includes('peso')
                  );
                  return !(hasFormula || hasCalculations);
                })
                .map((input) => (
                <div key={input.id}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {input.label} ({input.unit})
                    {input.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type="number"
                    value={inputs[input.id] || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setInputs({
                          ...inputs,
                          [input.id]: value,
                        });
                      }
                    }}
                    placeholder={`Ingresa ${input.label.toLowerCase()}`}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}

              {/* Auto-filled info */}
              {currentFormula.formula && currentFormula.formula.includes('peso') && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-medium mb-1">Peso registrado:</p>
                  <p>{(patient.weightGrams / 1000).toFixed(2)} kg ({patient.weightGrams} g)</p>
                </div>
              )}
            </section>

            {/* Result - Single formula */}
            {!currentFormula.calculations && allRequiredInputsFilled && result !== null && (
              <section className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-4">
                <p className="text-xs text-brand-600 dark:text-brand-400 mb-2 font-medium">Resultado</p>
                <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{result.toFixed(2)}</p>
                <p className="text-sm text-brand-700 dark:text-brand-300 mt-2">{currentFormula.resultLabel}: {currentFormula.resultUnit}</p>
              </section>
            )}

            {/* Result - Multiple calculations */}
            {currentFormula.calculations && allRequiredInputsFilled && (
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Resultados</h3>
                {(() => {
                  const results = calculateMultipleFormulas();
                  const labels = currentFormula.calculationsLabels ?? {};
                  const units = currentFormula.calculationsUnits ?? {};
                  return Object.entries(results).map(([key, value]) => (
                    <div key={key} className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-3">
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">{labels[key] ?? key}</p>
                      <p className="text-2xl font-bold text-brand-900 dark:text-brand-200">{value.toFixed(2)}</p>
                      {units[key] && <p className="text-xs text-brand-700 dark:text-brand-300 mt-1">{units[key]}</p>}
                    </div>
                  ));
                })()}
              </section>
            )}

            {/* Notes */}
            {currentFormula.notes && (
              <section className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3">
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-medium">Nota:</span> {currentFormula.notes}
                </p>
              </section>
            )}

            {/* Reference */}
            <section>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium">Referencia:</span> {currentFormula.reference}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
