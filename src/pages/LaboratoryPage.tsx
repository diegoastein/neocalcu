import { useState } from 'react';
import { labCategories } from '../data/laboratory';
import { LabParameter, BacteriologySyndrome, BacteriologyGerm } from '../types';
import { useMembership } from '../context/MembershipContext';

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

function SyndromeCard({ syndrome }: { syndrome: BacteriologySyndrome }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-1">{syndrome.name}</p>
          <svg
            viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor"
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        {!expanded && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{syndrome.germs}</p>
        )}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Gérmenes frecuentes</p>
            <p className="text-sm text-slate-800 dark:text-slate-200">{syndrome.germs}</p>
          </div>
          <div className="bg-brand-50 dark:bg-slate-800 border-l-4 border-brand-500 rounded-r-lg p-3">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide mb-1">Tratamiento empírico</p>
            <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">{syndrome.treatment}</p>
          </div>
          {syndrome.notes && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
              {syndrome.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GermCard({ germ }: { germ: BacteriologyGerm }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <button
        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{germ.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{germ.gram}</p>
          </div>
          <svg
            viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor"
            className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="bg-brand-50 dark:bg-slate-800 border-l-4 border-brand-500 rounded-r-lg p-3">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 uppercase tracking-wide mb-1">Primera línea</p>
            <p className="text-sm font-semibold text-brand-900 dark:text-brand-200">{germ.firstLine}</p>
          </div>
          {germ.alternative && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Alternativa</p>
              <p className="text-sm text-slate-800 dark:text-slate-200">{germ.alternative}</p>
            </div>
          )}
          {germ.resistance && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">Resistencia</p>
              <p className="text-xs text-red-800 dark:text-red-300">{germ.resistance}</p>
            </div>
          )}
          {germ.notes && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
              {germ.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LaboratoryPageProps {
  onGoToKit?: () => void;
}

export default function LaboratoryPage({ onGoToKit }: LaboratoryPageProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [bacterioView, setBacterioView] = useState<'syndrome' | 'germ'>('syndrome');
  const { active: isPremium } = useMembership();

  const q = searchQuery.toLowerCase().trim();

  const filteredCategories = q
    ? labCategories
        .map((cat) => ({
          ...cat,
          parameters: cat.parameters.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.abbreviation?.toLowerCase().includes(q) ?? false)
          ),
        }))
        .filter((cat) => cat.parameters.length > 0 || !!cat.isPremium)
    : labCategories;

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setExpandedCategories(new Set(labCategories.filter(c => !c.isPremium).map((c) => c.id)));
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 pb-20">
      {/* Header con buscador */}
      <div data-onboarding="lab-search" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Valores de referencia neonatal</h1>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar determinación..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Contenido */}
      {/* Kit del Paciente Crítico — acceso directo */}
      <div className="px-3 pt-3 pb-0 bg-white dark:bg-slate-950">
        <button
          onClick={onGoToKit}
          className="w-full flex items-center gap-3 px-4 py-3 bg-brand-700 text-white rounded-xl text-left"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Kit del Paciente Crítico</p>
            <p className="text-xs text-white/70 truncate">TET · inotrópicos · ATB · accesos vasculares</p>
          </div>
          <svg className="w-4 h-4 flex-shrink-0 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredCategories.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">Sin resultados para "{searchQuery}"</p>
          </div>
        )}

        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategories.has(cat.id);
          const itemCount = cat.bacteriologyType === 'combined'
            ? (cat.syndromes?.length ?? 0) + (cat.germs?.length ?? 0)
            : cat.parameters.length;

          return (
            <div key={cat.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
              {/* Cabecera de categoría */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
                onClick={() => toggleCategory(cat.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {cat.isPremium && (
                    <svg className="w-4 h-4 text-brand-700 dark:text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{cat.name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {itemCount}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {/* Contenido expandido */}
              {isExpanded && (
                <>
                  {/* Gate premium para no suscriptores */}
                  {cat.isPremium && !isPremium ? (
                    <div className="mx-4 mb-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-brand-700 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">Función para suscriptores</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Bacteriología neonatal con gérmenes frecuentes, tratamiento empírico y perfiles de resistencia.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Contenido de bacteriología combinada */}
                      {cat.bacteriologyType === 'combined' && (
                        <>
                          {/* Toggle Por síndrome / Por germen */}
                          <div className="mx-4 mb-3 flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <button
                              className={`flex-1 py-2.5 text-sm font-semibold transition ${bacterioView === 'syndrome' ? 'bg-brand-700 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                              onClick={() => setBacterioView('syndrome')}
                            >
                              Por síndrome
                            </button>
                            <button
                              className={`flex-1 py-2.5 text-sm font-semibold transition border-l border-slate-200 dark:border-slate-700 ${bacterioView === 'germ' ? 'bg-brand-700 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                              onClick={() => setBacterioView('germ')}
                            >
                              Por germen
                            </button>
                          </div>
                          <div className="mx-4 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            {bacterioView === 'syndrome' && cat.syndromes?.map((s) => (
                              <SyndromeCard key={s.id} syndrome={s} />
                            ))}
                            {bacterioView === 'germ' && cat.germs?.map((g) => (
                              <GermCard key={g.id} germ={g} />
                            ))}
                          </div>
                          {cat.disclaimer && (
                            <div className="mx-4 mb-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                              <p className="text-xs text-slate-500 dark:text-slate-400">{cat.disclaimer}</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Parámetros estándar */}
                      {!cat.isPremium && (
                        <div className="mx-4 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          {cat.parameters.map((param) => (
                            <ReferenceRow key={param.id} param={param} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Notas clínicas especiales por categoría */}
                  {!cat.isPremium && cat.id === 'infeccion' && (
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

                  {!cat.isPremium && cat.id === 'lcr' && (
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

                  {!cat.isPremium && cat.id === 'coagulacion' && (
                    <div className="mx-4 mb-4 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 rounded-xl p-4">
                      <p className="text-xs font-semibold text-brand-800 dark:text-brand-300 mb-1">Nota sobre coagulación neonatal</p>
                      <p className="text-xs text-brand-700 dark:text-brand-400">
                        Los neonatos tienen valores fisiológicamente prolongados de TP y KPTT respecto al adulto, por inmadurez
                        en factores vitamina K-dependientes. Esto no implica coagulopatía. Fuente: COBICO Argentina.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
