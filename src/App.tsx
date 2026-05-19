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
import PromoResidenciasOverlay, { PromoHeaderBadge } from './components/PromoResidenciasOverlay';
import { useDonationReminder } from './hooks/useDonationReminder';
import { MembershipProvider } from './context/MembershipContext';
import { UIProvider } from './context/UIContext';

type ThemeMode = 'system' | 'light' | 'dark';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const TAB_STEPS: Partial<Record<ActivePage, { target: string; title: string; text: string }[]>> = {
  medicamentos: [
    {
      target: 'patient-input',
      title: 'Ingresá el peso',
      text: 'Todos los cálculos se ajustan automáticamente al peso que ingresás acá arriba.',
    },
    {
      target: 'multi-patient',
      title: 'Múltiples pacientes',
      text: 'Podés manejar hasta 4 pacientes simultáneos. Cambiá entre ellos sin perder los datos de cada uno.',
    },
    {
      target: 'drug-search',
      title: 'Buscá un medicamento',
      text: 'Escribí el nombre y filtramos entre más de 200 drogas de la UCIN al instante.',
    },
    {
      target: 'drug-list',
      title: 'Dosis al toque',
      text: 'Tocá cualquier medicamento y obtenés la dosis exacta para el peso que ingresaste.',
    },
  ],
  procedimientos: [
    {
      target: 'procedures-list',
      title: '24 procedimientos bedside',
      text: 'Vías, surfactante, RCP, nutrición, bilirrubina y más. Tocá cualquiera para ver pasos, fórmulas y materiales.',
    },
  ],
  calculadoras: [
    {
      target: 'calculadora-select',
      title: 'Índices y fórmulas',
      text: 'Elegí entre índices clínicos (Silverman, Apgar, Bilirrubina) o fórmulas médicas. El peso del paciente se carga automáticamente.',
    },
  ],
  laboratorio: [
    {
      target: 'lab-search',
      title: 'Valores de referencia neonatal',
      text: 'Buscá entre 85 parámetros en 12 categorías. Sin búsqueda activa, explorá los acordeones por categoría.',
    },
  ],
  favoritos: [
    {
      target: 'favorites-header',
      title: 'Tus accesos rápidos',
      text: 'Marcá el ⭐ en medicamentos, procedimientos, calculadoras y fórmulas. Al tocarlos acá vas directo a su detalle.',
    },
  ],
};

function AppContent() {
  const [activePage, setActivePage] = useState<ActivePage>('medicamentos');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'system';
  });
  const [focusedProcedureId, setFocusedProcedureId] = useState<string | null>(null);
  const [focusedCalculadoraId, setFocusedCalculadoraId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => !!localStorage.getItem('disclaimerAccepted'));
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);
  const [onboardingShowing, setOnboardingShowing] = useState(() =>
    !localStorage.getItem('neo_onboarding_medicamentos') && !localStorage.getItem('neo_onboarding_done')
  );
  const [showPromoOverlay, setShowPromoOverlay] = useState(false);
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

  // Mostrar banner de instalación tras el primer cálculo de dosis
  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem('neo_install_prompted')) return;
      setTimeout(() => setShowInstallBanner(true), 2000);
    };
    window.addEventListener('neo:first_dose', handler);
    return () => window.removeEventListener('neo:first_dose', handler);
  }, []);

  const dismissInstallBanner = () => {
    localStorage.setItem('neo_install_prompted', '1');
    setShowInstallBanner(false);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    trackEvent('pwa_install_prompt', { outcome });
    localStorage.setItem('neo_install_prompted', '1');
    setShowInstallBanner(false);
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

  const anyModalOpen = !disclaimerAccepted || showPremiumSheet || showToast || showEmailCapture || onboardingShowing;

  return (
    <MembershipProvider membership={membership}>
    <UIProvider value={anyModalOpen}>
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
        <PromoHeaderBadge onClick={() => setShowPromoOverlay(true)} />

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

      {showInstallBanner && !!installPrompt && !showToast && (
        <div className="fixed bottom-16 inset-x-0 z-30 px-3 pb-2">
          <div className="flex items-center gap-3 bg-brand-800 dark:bg-brand-900 rounded-2xl px-4 py-3 shadow-xl">
            <div className="shrink-0 bg-white/10 rounded-xl p-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">Instalá NeoCalcu</p>
              <p className="text-white/70 text-xs">Acceso directo, funciona offline</p>
            </div>
            <button
              onClick={handleInstall}
              className="shrink-0 bg-white text-brand-800 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={dismissInstallBanner}
              className="shrink-0 text-white/50 hover:text-white text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

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

      {disclaimerAccepted && !showPremiumSheet && TAB_STEPS[activePage] && (
        <OnboardingTooltip
          key={activePage}
          steps={TAB_STEPS[activePage]!}
          storageKey={`neo_onboarding_${activePage}`}
          legacyKey={activePage === 'medicamentos' ? 'neo_onboarding_done' : undefined}
          onDone={() => setOnboardingShowing(false)}
        />
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

      {showPromoOverlay && (
        <PromoResidenciasOverlay
          onClose={() => setShowPromoOverlay(false)}
          onDonate={(plan) => {
            setShowPromoOverlay(false);
            trackEvent('click_apoyar', { source: 'promo_residencias', plan });
            handleDonate(plan);
          }}
          loadingPlan={loadingPlan}
        />
      )}
    </div>
    </UIProvider>
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
