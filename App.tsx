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
import { Capacitor } from '@capacitor/core';
import { WebFrame, WebHome, WebWelcome, WebGoals } from './components/web/WebExperience';

function AppInner() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isWebsite = !Capacitor.isNativePlatform();


  const [currentView, setCurrentView] = React.useState(() => {
    const hash = window.location.hash.replace('#', '').split('?')[0].split('/')[0];
    return ['home', 'tracker', 'planner', 'nutrition', 'journal', 'clock', 'account', 'privacy'].includes(hash) ? hash : 'home';
  });

  const [direction, setDirection] = useState(0);
  const viewOrder = ['home', 'planner', 'tracker', 'journal', 'clock', 'nutrition'];

  React.useEffect(() => {
    const handlePopState = () => {
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
      window.history.pushState(null, '', `/#${view}`);
      setCurrentView(route);
      window.scrollTo(0, 0);
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
    return <WebFrame currentView={currentView} setCurrentView={handleSetView}><AnimatePresence mode="wait">{renderView()}</AnimatePresence></WebFrame>;
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
              <OfflineIndicator />
              <SyncIndicator />
              <PwaStatus />
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
