import { useState } from 'react';
import { scores } from '../data/scores';
import { useFavorites } from '../context/FavoritesContext';

interface ScoreState {
  [itemId: string]: number;
}

export default function ScoresPage() {
  const [selectedScore, setSelectedScore] = useState<string>(scores[0]?.id || '');
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
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 pb-20">
      {/* Score selector */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
        <label className="block text-xs font-semibold text-slate-700 mb-2">Selecciona escala</label>
        <select
          value={selectedScore}
          onChange={(e) => {
            setSelectedScore(e.target.value);
            setScoreState({});
          }}
          className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <h1 className="text-2xl font-bold text-slate-900">{currentScore.name}</h1>
                </div>
                <button
                  onClick={() => toggleFavorite(currentScore.id)}
                  className="text-2xl hover:scale-110 transition flex-shrink-0"
                  title={isFavorite(currentScore.id) ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                >
                  {isFavorite(currentScore.id) ? '⭐' : '☆'}
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-1">{currentScore.subtitle}</p>
              <p className="text-xs text-slate-500 mt-2">{currentScore.description}</p>
            </section>

            {/* Items */}
            <section className="space-y-4">
              {currentScore.items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">{item.name}</h3>
                  <div className="space-y-2">
                    {item.values.map((value) => (
                      <label key={value.score} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name={item.id}
                          value={value.score}
                          checked={scoreState[item.id] === value.score}
                          onChange={() => setScoreState({ ...scoreState, [item.id]: value.score })}
                          className="w-4 h-4 text-blue-800 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{value.label}</p>
                          {value.description && (
                            <p className="text-xs text-slate-500">{value.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded">
                          {value.score}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Score summary */}
            {allItemsAnswered && (
              <section className="space-y-4">
                {/* Total score */}
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-xs text-blue-600 mb-1">Puntuación total</p>
                  <p className="text-4xl font-bold text-blue-900">{totalScore}</p>
                  <p className="text-xs text-blue-600 mt-1">
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
                  <p className="text-xs text-slate-500">
                    <span className="font-medium">Referencias:</span> {currentScore.references.join(' • ')}
                  </p>
                )}
              </section>
            )}

            {/* Reset button */}
            {Object.keys(scoreState).length > 0 && (
              <button
                onClick={() => setScoreState({})}
                className="w-full mt-4 px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition text-sm"
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
