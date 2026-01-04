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

function App() {
  const [currentView, setCurrentView] = useState('home');

  const renderView = () => {
    switch (currentView) {
      case 'home': return <Home setCurrentView={setCurrentView} />;
      case 'tracker': return <Tracker />;
      case 'planner': return <ProgramPlanner />;
      case 'nutrition': return <Nutrition />;
      case 'journal': return <Journal />;
      case 'clock': return <Clock />;
      default: return <Home />;
    }
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ClockProvider>
          <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-white transition-colors duration-300 selection:bg-teal-500/30 selection:text-teal-950 dark:selection:text-teal-200">
            <Navbar currentView={currentView} setCurrentView={setCurrentView} />

            <main className="pt-16">
              {renderView()}
            </main>
          </div>
        </ClockProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
