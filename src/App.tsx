import { useState, useEffect } from 'react';
import { ActivePage } from './types';
import { PatientProvider } from './context/PatientContext';
import { FavoritesProvider } from './context/FavoritesContext';
import MedicationsPage from './pages/MedicationsPage';
import ProceduresPage from './pages/ProceduresPage';
import ScoresPage from './pages/ScoresPage';
import FavoritesPage from './pages/FavoritesPage';
import FormulasPage from './pages/FormulasPage';
import BottomNav from './components/BottomNav';

function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('medicamentos');
  const [isDark, setIsDark] = useState(false);

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
        return <ProceduresPage />;
      case 'indices':
        return <ScoresPage />;
      case 'favoritos':
        return <FavoritesPage />;
      case 'formulas':
        return <FormulasPage />;
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
