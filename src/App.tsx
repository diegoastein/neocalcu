import { useState } from 'react';
import { ActivePage } from './types';
import { PatientProvider } from './context/PatientContext';
import { FavoritesProvider } from './context/FavoritesContext';
import MedicationsPage from './pages/MedicationsPage';
import ProceduresPage from './pages/ProceduresPage';
import ScoresPage from './pages/ScoresPage';
import FavoritesPage from './pages/FavoritesPage';
import FormulasPage from './pages/FormulasPage';
import SideNav from './components/SideNav';

function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('medicamentos');

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
    <div className="h-screen flex flex-row bg-white dark:bg-slate-950">
      <SideNav activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 overflow-y-auto ml-64">
        {renderPage()}
      </main>
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
