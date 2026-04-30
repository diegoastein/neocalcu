import { ActivePage } from '../types';

interface BottomNavProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export default function BottomNav({ activePage, setActivePage }: BottomNavProps) {
  const navItems: { id: ActivePage; label: string; icon: string }[] = [
    { id: 'medicamentos', label: 'Medicamentos', icon: '💊' },
    { id: 'procedimientos', label: 'Procedimientos', icon: '📋' },
    { id: 'indices', label: 'Índices', icon: '📊' },
    { id: 'favoritos', label: 'Favoritos', icon: '⭐' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`flex-1 py-3 px-2 text-center transition-colors ${
              activePage === item.id
                ? 'border-t-4 border-brand-800 text-brand-800'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="text-xl">{item.icon}</div>
            <div className="text-xs font-medium mt-1">{item.label}</div>
          </button>
        ))}
      </div>
    </nav>
  );
}
