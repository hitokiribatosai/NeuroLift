import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Tracker } from './components/features/Tracker';
import { ProgramPlanner } from './components/features/ProgramPlanner';
import { Nutrition } from './components/features/Nutrition';
import { Journal } from './components/features/Journal';
import { Clock } from './components/features/Clock';
import { Privacy } from './components/features/Privacy';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClockProvider } from './contexts/ClockContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { GymModeProvider } from './contexts/GymModeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import Onboarding from './components/features/Onboarding';
import { GoalSetting } from './components/features/GoalSetting';
import { safeStorage } from './utils/storage';
import { Account } from './components/features/Account';
import { startSync } from './utils/sync';
import { SyncIndicator } from './components/ui/SyncIndicator';
import { PwaStatus } from './components/ui/PwaStatus';
import { usesModernInterface } from './utils/interfacePlatform';
import { WebFrame, WebHome, WebWelcome, WebGoals } from './components/web/WebExperience';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { dismissTopOverlay } from './utils/overlays';
import { TourProvider } from './components/web/GuidedTour';

function AppInner() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isWebsite = usesModernInterface();


  const [currentView, setCurrentView] = React.useState(() => {
    const hash = window.location.hash.replace('#', '').split('?')[0].split('/')[0];
    return ['home', 'tracker', 'planner', 'nutrition', 'journal', 'clock', 'account', 'privacy'].includes(hash) ? hash : 'home';
  });

  const [direction, setDirection] = useState(0);
  const scrollPositions = React.useRef<Record<string, number>>({});
  const viewRef = React.useRef(currentView);
  viewRef.current = currentView;
  const navigationDepth = React.useRef(0);
  React.useEffect(() => {
    if (!isWebsite) return;
    window.history.replaceState({ ...window.history.state, neuroLiftDepth: 0 }, '', window.location.href);
    const save = () => { scrollPositions.current[viewRef.current] = window.scrollY; };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [isWebsite]);
  React.useLayoutEffect(() => {
    if (!isWebsite) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById('web-content')?.focus({ preventScroll: true });
      window.scrollTo(0, scrollPositions.current[currentView] || 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentView, isWebsite]);
  React.useEffect(() => {
    if (!isWebsite || Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('App')) return;
    const listener = CapApp.addListener('backButton', () => {
      if (dismissTopOverlay()) return;
      if (navigationDepth.current > 0) window.history.back();
      else if (viewRef.current !== 'home') {
        window.history.replaceState({ neuroLiftDepth: 0 }, '', '#home');
        setCurrentView('home');
      } else void CapApp.minimizeApp();
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, [isWebsite]);
  const viewOrder = ['home', 'planner', 'tracker', 'journal', 'clock', 'nutrition'];

  React.useEffect(() => {
    const handlePopState = () => {
      navigationDepth.current = window.history.state?.neuroLiftDepth || 0;
      const hash = window.location.hash.replace('#', '').split('?')[0].split('/')[0];
      const validViews = ['home', 'tracker', 'planner', 'nutrition', 'journal', 'clock', 'account', 'privacy'];
      const newView = validViews.includes(hash) ? hash : 'home';

      const oldIndex = viewOrder.indexOf(currentView);
      const newIndex = viewOrder.indexOf(newView);
      setDirection(newIndex < oldIndex ? -1 : 1);
      setCurrentView(newView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, viewOrder]);

  const handleSetView = (view: string) => {
    const route = view.split('?')[0];
    if (route !== currentView) {
      const oldIndex = viewOrder.indexOf(currentView);
      const newIndex = viewOrder.indexOf(route);
      setDirection(newIndex < oldIndex ? -1 : 1);
      scrollPositions.current[currentView] = window.scrollY;
      navigationDepth.current += 1;
      window.history.pushState({ neuroLiftDepth: navigationDepth.current }, '', `/#${view}`);
      setCurrentView(route);
      if (!isWebsite) window.scrollTo(0, 0);
    }
  };

  const renderView = () => {
    const viewContent = (() => {
      switch (currentView) {
        case 'home': return isWebsite ? <WebHome setCurrentView={handleSetView} /> : <Home setCurrentView={handleSetView} />;
        case 'tracker': return <Tracker />;
        case 'planner': return <ProgramPlanner initialMuscle={isWebsite ? new URLSearchParams(window.location.hash.split('?')[1]).get('muscle') || undefined : undefined} />;
        case 'nutrition': return <Nutrition />;
        case 'journal': return <Journal />;
        case 'clock': return <Clock />;
        case 'account': return <Account />;
        case 'privacy': return <Privacy />;
        default: return <Home setCurrentView={handleSetView} />;
      }
    })();

    if (isWebsite) return <div key={currentView} className="web-view">{viewContent}</div>;
    return (
      <motion.div
        key={currentView}
        initial={{ opacity: 0, x: direction * 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -50 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full h-full"
      >
        {viewContent}
      </motion.div>
    );
  };

  /* Onboarding & Goal Setting Logic */
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showGoalSetting, setShowGoalSetting] = React.useState(false);

  // Check onboarding and goal setting
  React.useEffect(() => {
    const hasCompletedOnboarding = safeStorage.getItem('neuroLift_hasCompletedOnboarding');
    const hasSetGoal = safeStorage.getItem('neuroLift_userGoal');

    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else if (!hasSetGoal) {
      setShowGoalSetting(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    safeStorage.setItem('neuroLift_hasCompletedOnboarding', 'true');

    setShowOnboarding(false);
    setShowGoalSetting(true);
  };

  const handleGoalSettingComplete = (goal: string | null) => {
    setShowGoalSetting(false);
  };

  if (isWebsite) {
    if (showOnboarding && !['account', 'privacy'].includes(currentView)) return <WebWelcome onComplete={handleOnboardingComplete} />;
    if (showGoalSetting && !['account', 'privacy'].includes(currentView)) return <WebGoals onComplete={handleGoalSettingComplete} />;
    return <TourProvider><WebFrame currentView={currentView} setCurrentView={handleSetView}>{renderView()}</WebFrame></TourProvider>;
  }

  return (
    <div
      className="min-h-screen transition-colors duration-300 overflow-x-hidden flex flex-col"
      style={{
        backgroundColor: isLight ? '#ffffff' : '#0a0a0a',
        color: isLight ? '#18181b' : '#ffffff',
      }}
    >
      {showOnboarding && !['account', 'privacy'].includes(currentView) ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : showGoalSetting && !['account', 'privacy'].includes(currentView) ? (
        <GoalSetting onComplete={handleGoalSettingComplete} />
      ) : (
        <>
          <Navbar
            currentView={currentView}
            setCurrentView={handleSetView}
          />

          <main className="flex-1 pt-[calc(5rem+env(safe-area-inset-top))] pb-[calc(8rem+env(safe-area-inset-bottom))] min-h-screen relative overflow-x-hidden">
            <AnimatePresence mode="wait">
              {renderView()}
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}

function WorkspaceApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FontSizeProvider>
          <ClockProvider>
            <GymModeProvider>
              {!usesModernInterface() && <><OfflineIndicator /><SyncIndicator /><PwaStatus /></>}
              <AppInner />
            </GymModeProvider>
          </ClockProvider>
        </FontSizeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function App() {
  const [version, setVersion] = useState(0);
  React.useEffect(() => {
    const refresh = () => setVersion(v => v + 1);
    const storageError = () => window.alert('Unable to save locally. Export a backup and free device storage.');
    window.addEventListener('workspace-scope', refresh);
    window.addEventListener('workspace-refreshed', refresh);
    window.addEventListener('storage-error', storageError);
    const stop = startSync();
    return () => {
      stop();
      window.removeEventListener('workspace-scope', refresh);
      window.removeEventListener('workspace-refreshed', refresh);
      window.removeEventListener('storage-error', storageError);
    };
  }, []);
  return <WorkspaceApp key={version} />;
}
export default App;
