import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import React,{ useState } from 'react';
import { Tracker } from './components/features/Tracker';
import { TourProvider } from './components/web/GuidedTour';
import { WebFrame,WebGoals,WebHome,WebWelcome } from './components/web/WebExperience';
import { ClockProvider } from './contexts/ClockContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { GymModeProvider } from './contexts/GymModeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider,useTheme } from './contexts/ThemeContext';
import { useAndroidWorkoutNotification } from './hooks/useAndroidWorkoutNotification';
import { useIOSRestNotification } from './hooks/useIOSRestNotification';
import { dismissTopOverlay } from './utils/overlays';
import { safeStorage } from './utils/storage';
import { startSync } from './utils/sync';
import { usePersistenceAction } from './hooks/usePersistenceAction';
import { PersistenceNotice } from './components/ui/PersistenceNotice';
import { databaseEnabled } from './utils/workspace';
// Secondary destinations are split into their own chunks to keep the startup
// bundle smaller. The service worker precaches every built file, and native
// builds bundle them locally, so these remain available offline.
const ProgramPlanner = React.lazy(() => import('./components/features/ProgramPlanner').then(m => ({ default: m.ProgramPlanner })));
const Nutrition = React.lazy(() => import('./components/features/Nutrition').then(m => ({ default: m.Nutrition })));
const Journal = React.lazy(() => import('./components/features/Journal').then(m => ({ default: m.Journal })));
const Clock = React.lazy(() => import('./components/features/Clock').then(m => ({ default: m.Clock })));
const Privacy = React.lazy(() => import('./components/features/Privacy').then(m => ({ default: m.Privacy })));
const Account = React.lazy(() => import('./components/features/Account').then(m => ({ default: m.Account })));

function AppInner() {
  const persist = usePersistenceAction();
  useAndroidWorkoutNotification();
  useIOSRestNotification();
  const { theme } = useTheme();
  const isLight = theme === 'light';


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

    window.history.replaceState({ ...window.history.state, neuroLiftDepth: 0 }, '', window.location.href);
    const save = () => { scrollPositions.current[viewRef.current] = window.scrollY; };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);
  React.useLayoutEffect(() => {

    const frame = requestAnimationFrame(() => {
      const content = document.getElementById('web-content');
      // A user may start typing before this delayed navigation callback runs.
      // Do not steal focus or scroll away from an already engaged control.
      if (document.activeElement !== content && content?.contains(document.activeElement)
        && document.activeElement?.matches('input, textarea, select, button, a, [contenteditable="true"]')) return;
      content?.focus({ preventScroll: true });
      window.scrollTo(0, scrollPositions.current[currentView] || 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [currentView]);
  React.useEffect(() => {
    if (Capacitor.getPlatform() !== 'android' || !Capacitor.isPluginAvailable('App')) return;
    const listener = CapApp.addListener('backButton', () => {
      if (dismissTopOverlay()) return;
      // Give the current screen its own back step before leaving the destination.
      if (!window.dispatchEvent(new Event('neurolift-screen-back', { cancelable: true }))) return;
      if (navigationDepth.current > 0) window.history.back();
      else if (viewRef.current !== 'home') {
        window.history.replaceState({ neuroLiftDepth: 0 }, '', '#home');
        setCurrentView('home');
      } else void CapApp.minimizeApp();
    });
    return () => { void listener.then(handle => handle.remove()); };
  }, []);
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

    }
  };

  const renderView = () => {
    const viewContent = (() => {
      switch (currentView) {
        case 'home': return <WebHome setCurrentView={handleSetView} />;
        case 'tracker': return <Tracker />;
        case 'planner': return <ProgramPlanner initialMuscle={new URLSearchParams(window.location.hash.split('?')[1]).get('muscle') || undefined} />;
        case 'nutrition': return <Nutrition />;
        case 'journal': return <Journal />;
        case 'clock': return <Clock />;
        case 'account': return <Account />;
        case 'privacy': return <Privacy />;
        default: return <WebHome setCurrentView={handleSetView} />;
      }
    })();
    const content = (
      <React.Suspense fallback={<div className="min-h-[50vh]" aria-busy="true" />}>
        {viewContent}
      </React.Suspense>
    );

    return <div key={currentView} className="web-view">{content}</div>;
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

  const handleOnboardingComplete = () => persist(async () => {
    await safeStorage.setItem('neuroLift_hasCompletedOnboarding', 'true');

    setShowOnboarding(false);
    setShowGoalSetting(true);
  });

  const handleGoalSettingComplete = (goal: string | null) => {
    setShowGoalSetting(false);
  };

  {
    if (showOnboarding && !['account', 'privacy'].includes(currentView)) return <WebWelcome onComplete={handleOnboardingComplete} />;
    if (showGoalSetting && !['account', 'privacy'].includes(currentView)) return <WebGoals onComplete={handleGoalSettingComplete} />;
    return <TourProvider><WebFrame currentView={currentView} setCurrentView={handleSetView}>{renderView()}</WebFrame></TourProvider>;
  }
}

function WorkspaceApp() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FontSizeProvider>
          <ClockProvider>
            <GymModeProvider>

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
    const storageError = () => { if (!databaseEnabled()) window.alert('Unable to save locally. Export a backup and free device storage.'); };
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
  return <><WorkspaceApp key={version} /><PersistenceNotice /></>;
}
export default App;
