import { useState } from 'react';
import { ActivePage } from './types';
import { PatientProvider } from './context/PatientContext';
import MedicationsPage from './pages/MedicationsPage';
import ProceduresPage from './pages/ProceduresPage';
import ScoresPage from './pages/ScoresPage';
import BottomNav from './components/BottomNav';

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
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
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
      <AppContent />
    </PatientProvider>
  );
}
