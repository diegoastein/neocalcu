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
import DonationToast from './components/DonationToast';
import { useDonationReminder } from './hooks/useDonationReminder';

function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('medicamentos');
  const [isDark, setIsDark] = useState(false);
  const [focusedProcedureId, setFocusedProcedureId] = useState<string | null>(null);
  const [focusedScoreId, setFocusedScoreId] = useState<string | null>(null);
  const [focusedFormulaId, setFocusedFormulaId] = useState<string | null>(null);
  const { showToast, dismissToast, handleDonate, handleVerify, loading } = useDonationReminder();

  const navigateToItem = (page: ActivePage, itemId?: string) => {
    if (page === 'procedimientos') setFocusedProcedureId(itemId || null);
    if (page === 'indices') setFocusedScoreId(itemId || null);
    if (page === 'formulas') setFocusedFormulaId(itemId || null);
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

  // Verificar donación cuando MercadoPago redirige de vuelta con ?paid=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
      handleVerify();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [handleVerify]);

  const renderPage = () => {
    switch (activePage) {
      case 'medicamentos':
        return <MedicationsPage />;
      case 'procedimientos':
        return <ProceduresPage initialExpanded={focusedProcedureId} />;
      case 'indices':
        return <ScoresPage initialScore={focusedScoreId} />;
      case 'favoritos':
        return <FavoritesPage onNavigate={navigateToItem} />;
      case 'formulas':
        return <FormulasPage initialFormula={focusedFormulaId} />;
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
      {showToast && (
        <DonationToast
          onDonate={handleDonate}
          onDismiss={dismissToast}
          loading={loading}
        />
      )}
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
