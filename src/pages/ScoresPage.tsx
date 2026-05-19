import { useState } from 'react';
import { scores } from '../data/scores';
import { useFavorites } from '../context/FavoritesContext';
import BilirubinCalculator from '../components/BilirubinCalculator';
import ROPCalculator from '../components/ROPCalculator';

interface ScoreState {
  [itemId: string]: number;
}

interface ScoresPageProps {
  initialScore?: string | null;
}

export default function ScoresPage({ initialScore = null }: ScoresPageProps) {
  const [selectedScore, setSelectedScore] = useState<string>(initialScore || scores[0]?.id || '');
  const [scoreState, setScoreState] = useState<ScoreState>({});
  const { toggleFavorite, isFavorite } = useFavorites();

  const currentScore = scores.find((s) => s.id === selectedScore);

  const currentScoreItems = currentScore?.items || [];
  const totalScore = Object.values(scoreState).reduce((a, b) => a + b, 0);
  const allItemsAnswered = currentScoreItems.length > 0 && currentScoreItems.every((item) => scoreState[item.id] !== undefined);

  const getInterpretation = () => {
    if (!currentScore) return null;
    return currentScore.interpretation.find((i) => totalScore >= i.min && totalScore <= i.max);
  };

  const interpretation = allItemsAnswered ? getInterpretation() : null;

  const colorMap: { [key: string]: string } = {
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200',
    yellow: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200',
    orange: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200',
    red: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200',
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 pb-20">
      {/* Score selector */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Selecciona escala</label>
        <select
          value={selectedScore}
          onChange={(e) => {
            setSelectedScore(e.target.value);
            setScoreState({});
          }}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-slate-200"
        >
          {scores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {currentScore && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Header */}
            <section>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentScore.name}</h1>
                </div>
                <button
                  onClick={() => toggleFavorite(currentScore.id)}
                  className="transition flex-shrink-0"
                  title={isFavorite(currentScore.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  <svg className={`w-5 h-5 transition-colors ${isFavorite(currentScore.id) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{currentScore.subtitle}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{currentScore.description}</p>
            </section>

            {/* Calculadores especiales */}
            {currentScore.bilirubinCalculator && (
              <BilirubinCalculator references={currentScore.references} />
            )}
            {currentScore.ropCalculator && (
              <ROPCalculator references={currentScore.references} />
            )}

            {/* Items */}
            <section className="space-y-4">
              {!currentScore.bilirubinCalculator && currentScore.items.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">{item.name}</h3>
                  <div className="space-y-2">
                    {item.values.map((value) => (
                      <label key={value.score} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={item.id}
                          value={value.score}
                          checked={scoreState[item.id] === value.score}
                          onChange={() => setScoreState({ ...scoreState, [item.id]: value.score })}
                          className="w-4 h-4 text-brand-800 dark:text-brand-400 focus:ring-brand-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value.label}</p>
                          {value.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{value.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-brand-800 dark:text-brand-400 bg-brand-50 dark:bg-slate-800 px-2 py-1 rounded">
                          {value.score}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Score summary */}
            {!currentScore.bilirubinCalculator && allItemsAnswered && (
              <section className="space-y-4">
                {/* Total score */}
                <div className="bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-brand-800 rounded p-4">
                  <p className="text-xs text-brand-600 dark:text-brand-400 mb-1">Puntuación total</p>
                  <p className="text-4xl font-bold text-brand-900 dark:text-brand-200">{totalScore}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                    Rango: {currentScore.minScore}–{currentScore.maxScore}
                  </p>
                </div>

                {/* Interpretation */}
                {interpretation && (
                  <div className={`rounded p-4 border ${colorMap[interpretation.color]}`}>
                    <h4 className="font-semibold mb-2">
                      {interpretation.color === 'green' && '✓ '}
                      {interpretation.color === 'yellow' && '⚠️ '}
                      {interpretation.color === 'orange' && '⚠️ '}
                      {interpretation.color === 'red' && '🚨 '}
                      {interpretation.label}
                    </h4>
                    <p className="text-sm">{interpretation.action}</p>
                  </div>
                )}

                {/* References */}
                {currentScore.references.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">Referencias:</span> {currentScore.references.join(' • ')}
                  </p>
                )}
              </section>
            )}

            {/* Reset button */}
            {!currentScore.bilirubinCalculator && Object.keys(scoreState).length > 0 && (
              <button
                onClick={() => setScoreState({})}
                className="w-full mt-4 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-sm"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
