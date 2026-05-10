import { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { drugs } from '../data/medications';
import { procedures } from '../data/procedures';
import { scores } from '../data/scores';
import { formulas } from '../data/formulas';
import DrugDetail from '../components/DrugDetail';
import { Drug, ActivePage } from '../types';

type FavoriteItem = { type: 'drug' | 'procedure' | 'score' | 'formula'; id: string; name: string };

interface FavoritesPageProps {
  onNavigate: (page: ActivePage, itemId?: string) => void;
}

export default function FavoritesPage({ onNavigate }: FavoritesPageProps) {
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

    const formula = formulas.find((f) => f.id === id);
    if (formula) {
      favoriteItems.push({ type: 'formula', id, name: formula.name });
      return;
    }
  });

  const categoryColors: { [key: string]: string } = {
    drug: 'bg-brand-100 dark:bg-brand-900 text-brand-800 dark:text-brand-300',
    procedure: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300',
    score: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
    formula: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300',
  };

  const iconMap: { [key: string]: JSX.Element } = {
    drug: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75h4.5M12 3.75v16.5M6.75 9h10.5M6 12.75A6.75 6.75 0 0 1 12 6a6.75 6.75 0 0 1 6 6.75V18a2.25 2.25 0 0 1-2.25 2.25H8.25A2.25 2.25 0 0 1 6 18v-5.25Z" />
      </svg>
    ),
    procedure: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
    score: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    formula: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25v-.008Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007v-.008Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008v-.008ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
      </svg>
    ),
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Marca medicamentos, procedimientos, índices o fórmulas como favoritos</p>
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
                  } else if (item.type === 'procedure') {
                    onNavigate('procedimientos', item.id);
                  } else if (item.type === 'score' || item.type === 'formula') {
                    onNavigate('calculadoras', item.id);
                  }
                }}
                className="w-full text-left bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 p-4 transition border-0"
              >
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-shrink-0 text-slate-500 dark:text-slate-400">{iconMap[item.type]}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</h3>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded inline-block mt-1 ${categoryColors[item.type]}`}
                    >
                      {item.type === 'drug' ? 'Medicamento' : item.type === 'procedure' ? 'Procedimiento' : item.type === 'score' ? 'Índice' : 'Fórmula'}
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
