import { useState, useEffect } from 'react';
import { ActivePage } from '../types';

interface SideNavProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export default function SideNav({ activePage, setActivePage }: SideNavProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const navItems: { id: ActivePage; label: string; icon: string }[] = [
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊' },
    { id: 'procedimientos', label: 'Procedimientos', icon: '📋' },
    { id: 'calculadoras', label: 'Calculadoras', icon: '📊' },
    { id: 'laboratorio', label: 'Laboratorio', icon: '🧪' },
    { id: 'favoritos', label: 'Favoritos', icon: '⭐' },
  ];

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-brand-800 dark:text-brand-400">NeoCalcu</h1>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
              activePage === item.id
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300 border-l-4 border-brand-800 dark:border-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Theme toggle */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4">
        <button
          onClick={() => setIsDark(!isDark)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          {isDark ? '☀️' : '🌙'}
          <span>{isDark ? 'Claro' : 'Oscuro'}</span>
        </button>
      </div>
    </nav>
  );
}
