import { useState, useEffect } from 'react';
import { ActivePage } from '../types';

interface BottomNavProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export default function BottomNav({ activePage, setActivePage }: BottomNavProps) {
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
    { id: 'indices', label: 'Índices', icon: '📊' },
    { id: 'formulas', label: 'Fórmulas', icon: '📐' },
    { id: 'favoritos', label: 'Favoritos', icon: '⭐' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex-1 py-3 px-2 text-center transition-colors ${
              activePage === item.id
                ? 'border-t-4 border-brand-800 dark:border-brand-400 text-brand-800 dark:text-brand-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-xl">{item.icon}</div>
            <div className="text-xs font-medium mt-1">{item.label}</div>
          </button>
        ))}
        <button
          onClick={() => setIsDark(!isDark)}
          className="py-3 px-2 text-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          <div className="text-xl">{isDark ? '☀️' : '🌙'}</div>
          <div className="text-xs font-medium mt-1">Tema</div>
        </button>
      </div>
    </nav>
  );
}
