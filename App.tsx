import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Tracker } from './components/features/Tracker';
import { ProgramPlanner } from './components/features/ProgramPlanner';
import { Nutrition } from './components/features/Nutrition';
import { Journal } from './components/features/Journal';
import { Clock } from './components/features/Clock';
import { LanguageProvider } from './contexts/LanguageContext';
import { ClockProvider } from './contexts/ClockContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import { GymModeProvider } from './contexts/GymModeContext';
import { AnimatePresence, motion } from 'framer-motion';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import Onboarding from './components/features/Onboarding';
import { GoalSetting } from './components/features/GoalSetting';
import { Auth } from './components/features/Auth';
import { Profile } from './components/features/Profile';
import { migrateToIndexedDB, safeStorage } from './utils/storage';
import { insertDemoData } from './utils/demoData';
import { authService, AuthUser } from './utils/authService';
import { firestoreService } from './utils/firestoreService';

function App() {
  React.useEffect(() => {
    const migrated = localStorage.getItem('db-migration-complete');
    if (!migrated) {
      migrateToIndexedDB();
    }
  }, []);

  const [currentView, setCurrentView] = React.useState(() => {
    const hash = window.location.hash.replace('#', '').split('?')[0].split('/')[0];
    return ['home', 'tracker', 'planner', 'nutrition', 'journal', 'clock'].includes(hash) ? hash : 'home';
  });

  const [direction, setDirection] = useState(0);
  const viewOrder = ['home', 'planner', 'tracker', 'journal', 'clock', 'nutrition'];

  React.useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '').split('?')[0].split('/')[0];
      const validViews = ['home', 'tracker', 'planner', 'nutrition', 'journal', 'clock'];
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
    if (view !== currentView) {
      const oldIndex = viewOrder.indexOf(currentView);
      const newIndex = viewOrder.indexOf(view);
      setDirection(newIndex < oldIndex ? -1 : 1);
      window.history.pushState(null, '', `/#${view}`);
      setCurrentView(view);
      window.scrollTo(0, 0);
    }
  };

  const renderView = () => {
    const viewContent = (() => {
      switch (currentView) {
        case 'home': return <Home setCurrentView={handleSetView} />;
        case 'tracker': return <Tracker />;
        case 'planner': return <ProgramPlanner />;
        case 'nutrition': return <Nutrition />;
        case 'journal': return <Journal />;
        case 'clock': return <Clock />;
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

  /* Authentication, Onboarding & Goal Setting Logic */
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [showAuth, setShowAuth] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [showGoalSetting, setShowGoalSetting] = React.useState(false);

  // Authentication state management
  React.useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
        setShowAuth(false);

        // Check if user has completed onboarding
        const hasCompletedOnboarding = localStorage.getItem('neuroLift_hasCompletedOnboarding');
        const hasSetGoal = localStorage.getItem('neuroLift_userGoal');

        if (!hasCompletedOnboarding) {
          setShowOnboarding(true);
        } else if (!hasSetGoal) {
          setShowGoalSetting(true);
        }
      } else {
        setUser(null);
        setShowAuth(true);
        setShowProfile(false);
        setShowOnboarding(false);
        setShowGoalSetting(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleAuthSuccess = async (authUser: AuthUser) => {
    setUser(authUser);

    // Merge cloud data with local data
    try {
      await firestoreService.mergeCloudData();
    } catch (error) {
      console.error('Error merging cloud data:', error);
    }

    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('neuroLift_hasCompletedOnboarding');
    const hasSetGoal = localStorage.getItem('neuroLift_userGoal');

    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    } else if (!hasSetGoal) {
      setShowGoalSetting(true);
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setShowAuth(true);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('neuroLift_hasCompletedOnboarding', 'true');

    // Insert demo data if no workouts exist
    const existingHistory = safeStorage.getParsed('neuroLift_history', []);
    if (existingHistory.length === 0) {
      insertDemoData();
    }

    setShowOnboarding(false);
    setShowGoalSetting(true);
  };

  const handleGoalSettingComplete = (goal: string | null) => {
    setShowGoalSetting(false);
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <FontSizeProvider>
          <ClockProvider>
            <GymModeProvider>
              <OfflineIndicator />
              <div className="min-h-screen bg-[#0a0a0a] text-white transition-colors duration-300 selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden flex flex-col">

                {showAuth ? (
                  <Auth onAuthSuccess={handleAuthSuccess} />
                ) : showProfile ? (
                  user && <Profile user={user} onSignOut={handleSignOut} />
                ) : showOnboarding ? (
                  <Onboarding onComplete={handleOnboardingComplete} />
                ) : showGoalSetting ? (
                  <GoalSetting onComplete={handleGoalSettingComplete} />
                ) : (
                  <>
                    <Navbar
                      currentView={currentView}
                      setCurrentView={handleSetView}
                      user={user}
                      onShowProfile={() => setShowProfile(true)}
                    />

                    <main className="flex-1 pt-16 pb-[calc(8rem+env(safe-area-inset-bottom))] min-h-screen relative overflow-x-hidden">
                      <AnimatePresence mode="wait">
                        {renderView()}
                      </AnimatePresence>
                    </main>
                  </>
                )}

              </div>
            </GymModeProvider>
          </ClockProvider>
        </FontSizeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
