import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '../utils/analytics';
import { searchGlobal, GlobalSearchResult, GlobalSearchResultType } from '../utils/search';

interface GlobalSearchModalProps {
  onClose: () => void;
  onSelect: (result: GlobalSearchResult) => void;
}

const SECTION_ORDER: GlobalSearchResultType[] = ['drug', 'procedure', 'calculadora', 'laboratorio'];

const SECTION_LABELS: Record<GlobalSearchResultType, string> = {
  drug: 'Medicamentos',
  procedure: 'Procedimientos',
  calculadora: 'Calculadoras',
  laboratorio: 'Laboratorio',
};

const SECTION_ICONS: Record<GlobalSearchResultType, JSX.Element> = {
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
  calculadora: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  laboratorio: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L4.2 15.3m15.6 0-1.57 4.926A2.25 2.25 0 0 1 16.065 21.75H7.935a2.25 2.25 0 0 1-2.165-1.524L4.2 15.3" />
    </svg>
  ),
};

export default function GlobalSearchModal({ onClose, onSelect }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const results = searchGlobal(query);
  const grouped: Record<GlobalSearchResultType, GlobalSearchResult[]> = {
    drug: [],
    procedure: [],
    calculadora: [],
    laboratorio: [],
  };
  results.forEach((r) => grouped[r.type].push(r));

  useEffect(() => {
    const q = query.trim();
    if (trackTimerRef.current) clearTimeout(trackTimerRef.current);
    if (q.length < 2) return;
    trackTimerRef.current = setTimeout(() => {
      trackEvent('search_global', { query: q, results_count: results.length });
    }, 800);
    return () => { if (trackTimerRef.current) clearTimeout(trackTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const hasQuery = query.trim().length >= 2;
  const hasResults = results.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header con input */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Cerrar búsqueda"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="relative flex-1">
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
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar medicamentos, procedimientos, laboratorio..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Resultados */}
      <div className="flex-1 overflow-y-auto pb-6">
        {!hasQuery && (
          <div className="p-10 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Escribí para buscar en medicamentos, procedimientos, calculadoras y laboratorio.
            </p>
          </div>
        )}

        {hasQuery && !hasResults && (
          <div className="p-10 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-sm">Sin resultados para "{query}"</p>
          </div>
        )}

        {hasQuery && hasResults && SECTION_ORDER.map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          return (
            <div key={type}>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {SECTION_LABELS[type]}
                </h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {items.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => onSelect(item)}
                    className="w-full flex items-start gap-3 p-4 text-left bg-white dark:bg-slate-900 hover:bg-brand-50 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex-shrink-0 text-slate-400 dark:text-slate-500 mt-0.5">
                      {SECTION_ICONS[item.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</h3>
                        {item.isPremium && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-brand-700 text-white flex-shrink-0">Pro</span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                      )}
                    </div>
                    <span className="text-2xl text-slate-300 dark:text-slate-600 flex-shrink-0">›</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
