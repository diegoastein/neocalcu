import { useState } from 'react';
import { labCategories } from '../data/laboratory';
import { LabParameter } from '../types';

function ReferenceRow({ param }: { param: LabParameter }) {
  const [expanded, setExpanded] = useState(false);
  const mainRef = param.references[0];
  const hasMultiple = param.references.length > 1;

  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        onClick={() => hasMultiple && setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{param.name}</p>
            {param.abbreviation && (
              <p className="text-xs text-slate-400 dark:text-slate-500">{param.abbreviation}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              {mainRef && (
                <p className="text-sm font-bold text-brand-800 dark:text-brand-300">
                  {mainRef.min !== undefined && mainRef.max !== undefined
                    ? `${mainRef.min}–${mainRef.max}`
                    : mainRef.min !== undefined
                    ? `>${mainRef.min}`
                    : mainRef.max !== undefined
                    ? `<${mainRef.max}`
                    : '—'}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400">{param.unit}</p>
            </div>
            {hasMultiple && (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {param.references.map((ref, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <div className="flex justify-between items-start gap-2">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1">{ref.label}</p>
                <p className="text-sm font-bold text-brand-800 dark:text-brand-300 flex-shrink-0">
                  {ref.min !== undefined && ref.max !== undefined
                    ? `${ref.min}–${ref.max}`
                    : ref.min !== undefined
                    ? `>${ref.min}`
                    : ref.max !== undefined
                    ? `<${ref.max}`
                    : '—'}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">{param.unit}</span>
                </p>
              </div>
              {ref.notes && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{ref.notes}</p>
              )}
            </div>
          ))}
          {param.notes && (
            <div className={`rounded-lg p-3 text-xs ${
              param.notes.includes('⚠️') || param.notes.includes('IMPORTANTE')
                ? 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {param.notes}
            </div>
          )}
          {(param.criticalLow !== undefined || param.criticalHigh !== undefined) && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-2 text-xs text-red-800 dark:text-red-300">
              <span className="font-semibold">Crítico: </span>
              {param.criticalLow !== undefined && `↓ <${param.criticalLow} ${param.unit}`}
              {param.criticalLow !== undefined && param.criticalHigh !== undefined && ' · '}
              {param.criticalHigh !== undefined && `↑ >${param.criticalHigh} ${param.unit}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LaboratoryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>(labCategories[0]?.id || '');

  const current = labCategories.find((c) => c.id === selectedCategory);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Valores de referencia neonatal</h1>
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
          {labCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-brand-800 dark:bg-brand-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {current && (
          <div>
            {/* Category header */}
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{current.name}</h2>
              {current.source && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Fuente: {current.source}
                </p>
              )}
            </div>

            {/* Parameters list */}
            <div className="mx-4 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {current.parameters.map((param) => (
                <ReferenceRow key={param.id} param={param} />
              ))}
            </div>

            {/* Nota PCT */}
            {current.id === 'infeccion' && (
              <div className="mx-4 mb-4 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">
                  Pico fisiológico de PCT en neonatos
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  La procalcitonina presenta un pico fisiológico en las primeras 72 horas de vida que puede alcanzar
                  hasta 21 ng/mL. <strong>No debe interpretarse como marcador de sepsis durante este período.</strong>{' '}
                  Usar PCR, hemograma con diferencial y hemocultivo como complemento diagnóstico.
                </p>
              </div>
            )}

            {/* Helper note for LCR */}
            {current.id === 'lcr' && (
              <div className="mx-4 mb-4 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-brand-800 dark:text-brand-300 mb-2">Interpretación del LCR neonatal</p>
                <ul className="space-y-1 text-xs text-brand-700 dark:text-brand-400">
                  <li>• Meningitis bacteriana: GB elevados (PMN predominante), glucosa baja, proteínas altas</li>
                  <li>• Meningitis viral: GB elevados (MN predominante), glucosa normal, proteínas leve–moderadamente elevadas</li>
                  <li>• LCR hemático: descartar hemorragia interventricular antes de interpretar</li>
                  <li>• Siempre comparar glucosa LCR con glucemia simultánea</li>
                </ul>
              </div>
            )}

            {/* Note sobre coagulacion */}
            {current.id === 'coagulacion' && (
              <div className="mx-4 mb-4 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">Nota sobre coagulación neonatal</p>
                <p className="text-xs text-brand-700 dark:text-brand-400">
                  Los neonatos tienen valores fisiológicamente prolongados de TP y KPTT respecto al adulto, por inmadurez
                  en factores vitamina K-dependientes. Esto no implica coagulopatía. Fuente: COBICO Argentina.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
