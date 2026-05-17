import { useState, useEffect } from 'react';
import { ActivePage } from './types';
import { trackEvent } from './utils/analytics';
import { PatientProvider } from './context/PatientContext';
import { FavoritesProvider } from './context/FavoritesContext';
import MedicationsPage from './pages/MedicationsPage';
import ProceduresPage from './pages/ProceduresPage';
import CalculadorasPage from './pages/CalculadorasPage';
import LaboratoryPage from './pages/LaboratoryPage';
import FavoritesPage from './pages/FavoritesPage';
import BottomNav from './components/BottomNav';
import SettingsPanel from './components/SettingsPanel';
import FirstAccessDisclaimer from './components/FirstAccessDisclaimer';
import DonationToast from './components/DonationToast';
import EmailCaptureModal from './components/EmailCaptureModal';
import PremiumFeaturesSheet from './components/PremiumFeaturesSheet';
import OnboardingTooltip from './components/OnboardingTooltip';
import { useDonationReminder } from './hooks/useDonationReminder';
import { MembershipProvider } from './context/MembershipContext';

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
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => !!localStorage.getItem('disclaimerAccepted'));
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);
  const {
    showToast, dismissToast,
    showEmailCapture, dismissEmailCapture,
    handleDonate, handleVerify, handleRedeem, handleRecover, handleRegisterEmail,
    loadingPlan, membership,
  } = useDonationReminder();

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

    const installedHandler = () => trackEvent('pwa_installed');
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
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
    const { outcome } = await installPrompt.userChoice;
    trackEvent('pwa_install_prompt', { outcome });
    setInstallPrompt(null);
  };

  // Mostrar sheet de funciones premium al abrir si no hay membresía activa
  useEffect(() => {
    if (!membership.active) {
      const t = setTimeout(() => setShowPremiumSheet(true), 600);
      return () => clearTimeout(t);
    }
  }, [membership.active]);

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
      case 'calculadoras':
        return <CalculadorasPage initialId={focusedCalculadoraId} />;
      case 'laboratorio':
        return <LaboratoryPage />;
      case 'favoritos':
        return <FavoritesPage onNavigate={navigateToItem} />;
    }
  };

  return (
    <MembershipProvider membership={membership}>
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
        {membership.active ? (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold select-none"
            title="Membresía activa — ¡gracias por apoyar NeoCalcu!"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>¡Gracias!</span>
          </div>
        ) : (
          <button
            onClick={() => { trackEvent('click_apoyar', { source: 'header' }); handleDonate('mensual'); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-700 hover:bg-brand-800 dark:bg-brand-800 dark:hover:bg-brand-900 text-white text-xs font-semibold transition-colors"
            aria-label="Apoyá este proyecto"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
            </svg>
            <span>Apoyar</span>
          </button>
        )}
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
        onDonate={handleDonate}
        onRedeem={handleRedeem}
        onRecover={handleRecover}
        membership={membership}
      />

      <FirstAccessDisclaimer onAccept={() => setDisclaimerAccepted(true)} />

      {disclaimerAccepted && activePage === 'medicamentos' && !showPremiumSheet && (
        <OnboardingTooltip />
      )}

      {showToast && (
        <DonationToast
          onDonate={(plan) => { trackEvent('click_apoyar', { source: 'toast', plan }); return handleDonate(plan); }}
          onDismiss={dismissToast}
          onRecover={handleRecover}
          loadingPlan={loadingPlan}
        />
      )}

      {showEmailCapture && (
        <EmailCaptureModal
          onRegister={handleRegisterEmail}
          onDismiss={dismissEmailCapture}
        />
      )}

      {showPremiumSheet && (
        <PremiumFeaturesSheet
          onSubscribe={(plan) => { setShowPremiumSheet(false); trackEvent('click_apoyar', { source: 'premium_sheet', plan }); handleDonate(plan); }}
          onDismiss={() => setShowPremiumSheet(false)}
        />
      )}
    </div>
    </MembershipProvider>
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
