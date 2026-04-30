import { useState } from 'react';
import PatientInput from '../components/PatientInput';
import DrugDetail from '../components/DrugDetail';
import { drugs, searchDrugs } from '../data/medications';
import { useFavorites } from '../context/FavoritesContext';
import { Drug } from '../types';

export default function MedicationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

  const results = searchQuery.trim() ? searchDrugs(searchQuery) : drugs;

  const categoryBadgeColor: { [key: string]: string } = {
    antibiotico: 'bg-blue-100 text-blue-800',
    antiviral: 'bg-purple-100 text-purple-800',
    antifungico: 'bg-orange-100 text-orange-800',
    cardiovascular: 'bg-red-100 text-red-800',
    analgesico_sedante: 'bg-indigo-100 text-indigo-800',
    diuretico: 'bg-green-100 text-green-800',
    surfactante: 'bg-yellow-100 text-yellow-800',
    respiratorio: 'bg-cyan-100 text-cyan-800',
    emergencia: 'bg-red-200 text-red-900',
    vitaminas_electrolitos: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <PatientInput />

      {/* Search bar */}
      <div className="bg-white border-b border-slate-200 p-4">
        <input
          type="text"
          placeholder="Buscar medicamento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500 mt-2">
          {results.length} resultado{results.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto pb-20">
        {results.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500">No se encontraron medicamentos</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {results.map((drug) => (
              <div key={drug.id} className="bg-white hover:bg-blue-50 transition border-b border-slate-200 flex items-start">
                <button
                  onClick={() => setSelectedDrug(drug)}
                  className="flex-1 text-left p-4 border-0"
                >
                  <h3 className="font-semibold text-slate-900">{drug.name}</h3>
                  {drug.genericName && <p className="text-xs text-slate-500">{drug.genericName}</p>}
                  <p className="text-sm text-slate-600 mt-1">{drug.indications.join(' • ')}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {drug.category.slice(0, 2).map((cat) => (
                      <span key={cat} className={`text-xs px-2 py-1 rounded ${categoryBadgeColor[cat] || 'bg-slate-100'}`}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(drug.id);
                  }}
                  className="p-4 text-2xl hover:scale-110 transition flex-shrink-0"
                  title={isFavorite(drug.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite(drug.id) ? '⭐' : '☆'}
                </button>
                <div className="p-4 text-slate-300 text-2xl flex-shrink-0">›</div>
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
