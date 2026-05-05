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
import SettingsPanel from './components/SettingsPanel';

type ThemeMode = 'system' | 'light' | 'dark';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('medicamentos');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'system';
  });
  const [focusedProcedureId, setFocusedProcedureId] = useState<string | null>(null);
  const [focusedCalculadoraId, setFocusedCalculadoraId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const navigateToItem = (page: ActivePage, itemId?: string) => {
    if (page === 'procedimientos') setFocusedProcedureId(itemId || null);
    if (page === 'calculadoras') setFocusedCalculadoraId(itemId || null);
    setActivePage(page);
  };

  // Capture PWA install prompt (puede haber disparado antes de que React monte)
  useEffect(() => {
    const early = (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt;
    if (early) setInstallPrompt(early);

    const handler = (e: Event) => {
      e.preventDefault();
      const prompt = e as BeforeInstallPromptEvent;
      (window as Window & { __pwaInstallPrompt?: BeforeInstallPromptEvent }).__pwaInstallPrompt = prompt;
      setInstallPrompt(prompt);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Apply theme
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    const html = document.documentElement;

    if (themeMode === 'dark') {
      html.classList.add('dark');
      return;
    }
    if (themeMode === 'light') {
      html.classList.remove('dark');
      return;
    }
    // system
    const applySystem = () => {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };
    applySystem();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applySystem);
    return () => mq.removeEventListener('change', applySystem);
  }, [themeMode]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

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
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Configuración"
          aria-label="Abrir configuración"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <a href='https://cafecito.app/neomonitor' rel='noopener' target='_blank'>
          <img
            srcSet='https://cdn.cafecito.app/imgs/buttons/button_6.png 1x, https://cdn.cafecito.app/imgs/buttons/button_6_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_6_3.75x.png 3.75x'
            src='https://cdn.cafecito.app/imgs/buttons/button_6.png'
            alt='Invitame un café en cafecito.app'
            className="h-7"
          />
        </a>
      </div>

      <main className="flex-1 overflow-y-auto pb-20">
        {renderPage()}
      </main>

      <BottomNav activePage={activePage} setActivePage={setActivePage} />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        canInstall={!!installPrompt}
        onInstall={handleInstall}
      />
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
