import { useState } from 'react';
import PatientInput from '../components/PatientInput';
import { formulas } from '../data/formulas';
import { usePatient } from '../context/PatientContext';
import { useFavorites } from '../context/FavoritesContext';

export default function FormulasPage() {
  const [selectedFormula, setSelectedFormula] = useState<string>(formulas[0]?.id || '');
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const { patient } = usePatient();
  const { toggleFavorite, isFavorite } = useFavorites();

  const currentFormula = formulas.find((f) => f.id === selectedFormula);

  const calculateFormula = (): number | null => {
    if (!currentFormula || !('formula' in currentFormula)) return null;

    const variables: Record<string, number> = { ...inputs };

    // Agregar peso automáticamente si la fórmula lo requiere
    if (currentFormula.formula.includes('peso') && !variables['peso']) {
      variables['peso'] = patient.weightGrams / 1000; // convertir a kg
    }

    try {
      const result = eval(currentFormula.formula.replace(/\b([a-z_]+)\b/g, (match) => {
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
    if (!currentFormula || !('calculations' in currentFormula)) return {};

    const variables: Record<string, number> = { ...inputs };

    // Agregar peso automáticamente
    if (!variables['peso']) {
      variables['peso'] = patient.weightGrams / 1000;
    }

    const results: Record<string, number> = {};

    const calculations = currentFormula.calculations as Record<string, string>;
    for (const [key, formula] of Object.entries(calculations)) {
      try {
        const result = eval(formula.replace(/\b([a-z_]+)\b/g, (match) => {
          if (variables[match] !== undefined) {
            return variables[match].toString();
          }
          return match;
        }));
        if (typeof result === 'number') {
          results[key] = result;
        }
      } catch {
        // silently skip calculation errors
      }
    }

    return results;
  };

  const result = calculateFormula();

  // Verificar si todos los inputs requeridos están presentes
  const allRequiredInputsFilled = currentFormula
    ? currentFormula.inputs.filter((inp) => inp.required).every((inp) => inputs[inp.id] !== undefined && inputs[inp.id] > 0)
    : false;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <PatientInput />

      {/* Formula selector */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-16 z-10">
        <label className="block text-xs font-semibold text-slate-700 mb-2">Selecciona fórmula</label>
        <select
          value={selectedFormula}
          onChange={(e) => {
            setSelectedFormula(e.target.value);
            setInputs({});
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <h1 className="text-2xl font-bold text-slate-900">{currentFormula.name}</h1>
                </div>
                <button
                  onClick={() => toggleFavorite(currentFormula.id)}
                  className="text-2xl hover:scale-110 transition flex-shrink-0"
                  title={isFavorite(currentFormula.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite(currentFormula.id) ? '⭐' : '☆'}
                </button>
              </div>
              <p className="text-sm text-slate-600">{currentFormula.description}</p>
            </section>

            {/* Formula display */}
            <section className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-xs text-blue-600 mb-2 font-medium">Fórmula</p>
              <code className="text-sm text-blue-900 font-mono break-words">{currentFormula.formula}</code>
            </section>

            {/* Inputs */}
            <section className="space-y-3">
              <h3 className="font-semibold text-slate-900">Datos de entrada</h3>
              {currentFormula.inputs.map((input) => (
                <div key={input.id}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              {/* Auto-filled info */}
              {currentFormula.formula.includes('peso') && (
                <div className="bg-slate-100 rounded p-2 text-xs text-slate-600">
                  <p className="font-medium mb-1">Peso registrado:</p>
                  <p>{(patient.weightGrams / 1000).toFixed(2)} kg ({patient.weightGrams} g)</p>
                </div>
              )}
            </section>

            {/* Result - Single formula */}
            {'formula' in currentFormula && allRequiredInputsFilled && result !== null && (
              <section className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-xs text-green-600 mb-2 font-medium">Resultado</p>
                <p className="text-4xl font-bold text-green-900">{result.toFixed(2)}</p>
                <p className="text-sm text-green-700 mt-2">{currentFormula.resultLabel}: {currentFormula.resultUnit}</p>
              </section>
            )}

            {/* Result - Multiple formulas (Balance Hidroelectrolítico) */}
            {'calculations' in currentFormula && inputs.peso && inputs.diuresis && (
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-900">Resultados detallados</h3>
                {(() => {
                  const results = calculateMultipleFormulas();
                  const labels: Record<string, string> = {
                    ingreso_total: 'Ingreso Total',
                    egreso_total: 'Egreso Total',
                    ingreso_kg: 'Ingreso / kg',
                    egreso_kg: 'Egreso / kg',
                    relacion_ei: 'Relación E/I',
                    balance: 'Balance 24 hs',
                    ritmo_diuretico: 'Ritmo Diurético',
                  };

                  return Object.entries(results).map(([key, value]) => (
                    <div key={key} className="bg-blue-50 border border-blue-200 rounded p-3">
                      <p className="text-xs text-blue-600 font-medium mb-1">{labels[key] || key}</p>
                      <p className="text-2xl font-bold text-blue-900">{value.toFixed(2)}</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {key === 'relacion_ei' ? 'adimensional' :
                         key === 'ritmo_diuretico' ? 'mL/kg/h' : 'mL/kg/24h'}
                      </p>
                    </div>
                  ));
                })()}
              </section>
            )}

            {/* Notes */}
            {currentFormula.notes && (
              <section className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-xs text-amber-900">
                  <span className="font-medium">Nota:</span> {currentFormula.notes}
                </p>
              </section>
            )}

            {/* Reference */}
            <section>
              <p className="text-xs text-slate-500">
                <span className="font-medium">Referencia:</span> {currentFormula.reference}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
