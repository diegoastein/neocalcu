import { ActivePage } from '../types';

interface BottomNavProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

const icons: Record<ActivePage, (active: boolean) => JSX.Element> = {
  medicamentos: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2 : 1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75h4.5M12 3.75v16.5M6.75 9h10.5M6 12.75A6.75 6.75 0 0 1 12 6a6.75 6.75 0 0 1 6 6.75V18a2.25 2.25 0 0 1-2.25 2.25H8.25A2.25 2.25 0 0 1 6 18v-5.25Z" />
    </svg>
  ),
  procedimientos: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2 : 1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  calculadoras: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2 : 1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  laboratorio: (active) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={active ? 2 : 1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L4.2 15.3m15.6 0-1.57 4.926A2.25 2.25 0 0 1 16.065 21.75H7.935a2.25 2.25 0 0 1-2.165-1.524L4.2 15.3" />
    </svg>
  ),
  favoritos: (active) => (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} strokeWidth={active ? 0 : 1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
};

const labels: Record<ActivePage, string> = {
  medicamentos: 'Medicamentos',
  procedimientos: 'Procedimientos',
  calculadoras: 'Calculadoras',
  laboratorio: 'Laboratorio',
  favoritos: 'Favoritos',
};

export default function BottomNav({ activePage, setActivePage }: BottomNavProps) {
  const pages: ActivePage[] = ['medicamentos', 'procedimientos', 'calculadoras', 'laboratorio', 'favoritos'];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="flex justify-around">
        {pages.map((page) => {
          const active = activePage === page;
          return (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`flex-1 py-3 px-1 flex flex-col items-center gap-1 transition-colors ${
                active
                  ? 'border-t-2 border-brand-800 dark:border-brand-400 text-brand-800 dark:text-brand-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {icons[page](active)}
              <span className="text-xs font-medium leading-none">{labels[page]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
