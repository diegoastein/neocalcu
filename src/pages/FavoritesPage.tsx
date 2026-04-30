import { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { drugs } from '../data/medications';
import { procedures } from '../data/procedures';
import { scores } from '../data/scores';
import DrugDetail from '../components/DrugDetail';
import { Drug } from '../types';

type FavoriteItem = { type: 'drug' | 'procedure' | 'score'; id: string; name: string };

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  const favoriteItems: FavoriteItem[] = [];

  favorites.forEach((id) => {
    const drug = drugs.find((d) => d.id === id);
    if (drug) {
      favoriteItems.push({ type: 'drug', id, name: drug.name });
      return;
    }

    const procedure = procedures.find((p) => p.id === id);
    if (procedure) {
      favoriteItems.push({ type: 'procedure', id, name: procedure.name });
      return;
    }

    const score = scores.find((s) => s.id === id);
    if (score) {
      favoriteItems.push({ type: 'score', id, name: score.name });
      return;
    }
  });

  const categoryColors: { [key: string]: string } = {
    drug: 'bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-300',
    procedure: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300',
    score: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
  };

  const iconMap: { [key: string]: string } = {
    drug: '💊',
    procedure: '📋',
    score: '📊',
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Favoritos</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {favoriteItems.length} elemento{favoriteItems.length !== 1 ? 's' : ''} guardado{favoriteItems.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {favoriteItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-2xl mb-2">⭐</p>
            <p className="text-slate-600 dark:text-slate-400">No tienes favoritos aún</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Marca medicamentos, procedimientos o índices como favoritos</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {favoriteItems.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (item.type === 'drug') {
                    const drug = drugs.find((d) => d.id === item.id);
                    setSelectedDrug(drug || null);
                  }
                }}
                className="w-full text-left bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 p-4 transition border-0"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="text-xl flex-shrink-0">{iconMap[item.type]}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-1 ${categoryColors[item.type]}`}
                    >
                      {item.type === 'drug' ? 'Medicamento' : item.type === 'procedure' ? 'Procedimiento' : 'Índice'}
                    </span>
                  </div>
                  <span className="text-2xl text-slate-300 dark:text-slate-600">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDrug && <DrugDetail drug={selectedDrug} onClose={() => setSelectedDrug(null)} />}
    </div>
  );
}
