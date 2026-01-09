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
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const [currentView, setCurrentView] = React.useState(() => {
    const hash = window.location.hash.replace('#', '').split('?')[0].split('/')[0];
    return ['home', 'tracker', 'planner', 'nutrition', 'journal', 'clock'].includes(hash) ? hash : 'home';
  });

  React.useEffect(() => {
    const handlePopState = () => {
      // Split by ? to ignore query params, and / to ignore sub-paths if any
      const hash = window.location.hash.replace('#', '').split('?')[0].split('/')[0];
      const validViews = ['home', 'tracker', 'planner', 'nutrition', 'journal', 'clock'];
      if (validViews.includes(hash)) {
        setCurrentView(hash);
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSetView = (view: string) => {
    if (view !== currentView) {
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
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full h-full"
      >
        {viewContent}
      </motion.div>
    );
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <FontSizeProvider>
          <ClockProvider>
            <div className="min-h-screen bg-[#0a0a0a] text-white transition-colors duration-300 selection:bg-teal-500/30 selection:text-teal-200 overflow-x-hidden">
              <Navbar currentView={currentView} setCurrentView={handleSetView} />

              <main className="pt-16 pb-32 min-h-screen relative overflow-x-hidden">
                <AnimatePresence mode="wait">
                  {renderView()}
                </AnimatePresence>
              </main>
            </div>
          </ClockProvider>
        </FontSizeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
