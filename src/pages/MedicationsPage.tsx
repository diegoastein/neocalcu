import { useState, useEffect, useRef } from 'react';
import { trackEvent } from '../utils/analytics';
import PatientInput from '../components/PatientInput';
import DrugDetail from '../components/DrugDetail';
import { drugs, searchDrugs } from '../data/medications';
import { useFavorites } from '../context/FavoritesContext';
import { Drug } from '../types';

interface MedicationsPageProps {
  onGoToKit?: () => void;
}

export default function MedicationsPage({ onGoToKit }: MedicationsPageProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

  const results = searchQuery.trim() ? searchDrugs(searchQuery) : drugs;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) return;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      trackEvent('search_drug', { query: q, results_count: results.length });
    }, 800);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, results.length]);

  // Agrupar medicamentos por categoría
  const groupByCategory = (drugList: Drug[]) => {
    const grouped: Record<string, Drug[]> = {};
    drugList.forEach((drug) => {
      const category = drug.category[0] || 'otros';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(drug);
    });
    // Ordenar medicamentos dentro de cada categoría
    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    );
    return grouped;
  };

  const groupedDrugs = groupByCategory(results);
  const categoryLabels: Record<string, string> = {
    antibiotico: 'Antibióticos',
    antiviral: 'Antivirales',
    antifungico: 'Antifúngicos',
    cardiovascular: 'Cardiovascular',
    analgesico_sedante: 'Analgésicos y Sedantes',
    diuretico: 'Diuréticos',
    surfactante: 'Surfactantes',
    respiratorio: 'Respiratorio',
    emergencia: 'Emergencia',
    vitaminas_electrolitos: 'Vitaminas y Electrolitos',
    otros: 'Otros',
  };

  const categoryBadgeColor: { [key: string]: string } = {
    antibiotico: 'bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-100',
    antiviral: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
    antifungico: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
    cardiovascular: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',
    analgesico_sedante: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-100',
    diuretico: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
    surfactante: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
    respiratorio: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-100',
    emergencia: 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100',
    vitaminas_electrolitos: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100',
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      <PatientInput />

      {/* Kit del Paciente Crítico — acceso directo */}
      <div className="px-3 pt-3 pb-0 bg-white dark:bg-slate-950">
        <button
          onClick={() => { trackEvent('open_kit_shortcut', { source: 'medicamentos' }); onGoToKit?.(); }}
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

      {/* Search bar */}
      <div data-onboarding="drug-search" className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4">
        <input
          type="text"
          placeholder="Buscar medicamento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {results.length} resultado{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {results.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">No se encontraron medicamentos</p>
          </div>
        ) : (
          <div>
            {Object.entries(groupedDrugs).sort(([a], [b]) => {
              if (a === 'antibiotico') return -1;
              if (b === 'antibiotico') return 1;
              return (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b, 'es');
            }).map(([category, drugsInCategory], catIndex) => (
              <div key={category}>
                <div {...(catIndex === 0 ? { 'data-onboarding': 'drug-list' } : {})} className="bg-slate-100 dark:bg-slate-800 px-4 py-2">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {categoryLabels[category] || category}
                  </h2>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {drugsInCategory.map((drug) => (
                    <div key={drug.id} className="bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 transition border-b border-slate-200 dark:border-slate-700 flex items-start">
                      <button
                        onClick={() => { trackEvent('open_drug', { drug_id: drug.id, drug_name: drug.name }); setSelectedDrug(drug); }}
                        className="flex-1 text-left p-4 border-0"
                      >
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{drug.name}</h3>
                        {drug.genericName && <p className="text-xs text-slate-500 dark:text-slate-400">{drug.genericName}</p>}
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{drug.indications.join(' • ')}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {drug.category.slice(0, 2).map((cat) => (
                            <span key={cat} className={`text-xs px-2 py-1 rounded ${categoryBadgeColor[cat] || 'bg-slate-100'}`}>
                              {categoryLabels[cat] || cat}
                            </span>
                          ))}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(drug.id);
                        }}
                        className="p-4 transition flex-shrink-0"
                        title={isFavorite(drug.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                      >
                        <svg className={`w-5 h-5 transition-colors ${isFavorite(drug.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      </button>
                      <div className="p-4 text-slate-300 dark:text-slate-600 text-2xl flex-shrink-0">›</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDrug && <DrugDetail drug={selectedDrug} onClose={() => setSelectedDrug(null)} />}
    </div>
  );
}
