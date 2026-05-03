import { useState, useEffect } from 'react';
import { ActivePage } from './types';
import { PatientProvider } from './context/PatientContext';
import { FavoritesProvider } from './context/FavoritesContext';
import MedicationsPage from './pages/MedicationsPage';
import ProceduresPage from './pages/ProceduresPage';
import CalculadorasPage from './pages/CalculadorasPage';
import LaboratoryPage from './pages/LaboratoryPage';
import FavoritesPage from './pages/FavoritesPage';
import BottomNav from './components/BottomNav';

function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('medicamentos');
  const [isDark, setIsDark] = useState(false);
  const [focusedProcedureId, setFocusedProcedureId] = useState<string | null>(null);
  const [focusedCalculadoraId, setFocusedCalculadoraId] = useState<string | null>(null);

  const navigateToItem = (page: ActivePage, itemId?: string) => {
    if (page === 'procedimientos') setFocusedProcedureId(itemId || null);
    if (page === 'calculadoras') setFocusedCalculadoraId(itemId || null);
    setActivePage(page);
  };

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDark]);

  const renderPage = () => {
    switch (activePage) {
      case 'medicamentos':
        return <MedicationsPage />;
      case 'procedimientos':
        return <ProceduresPage initialExpanded={focusedProcedureId} />;
      case 'calculadoras':
        return <CalculadorasPage initialId={focusedCalculadoraId} />;
      case 'laboratorio':
        return <LaboratoryPage />;
      case 'favoritos':
        return <FavoritesPage onNavigate={navigateToItem} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Theme toggle header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex justify-end">
        <button
          onClick={() => setIsDark(!isDark)}
          className="text-lg hover:scale-110 transition"
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
      <main className="flex-1 overflow-y-auto pb-20">
        {renderPage()}
      </main>
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <PatientProvider>
      <FavoritesProvider>
        <AppContent />
      </FavoritesProvider>
    </PatientProvider>
  );
}
