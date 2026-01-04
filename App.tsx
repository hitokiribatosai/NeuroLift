import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Tracker } from './components/features/Tracker';
import { ProgramPlanner } from './components/features/ProgramPlanner';
import { Nutrition } from './components/features/Nutrition';
import { Journal } from './components/features/Journal';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  const [currentView, setCurrentView] = useState('home');

  const renderView = () => {
    switch (currentView) {
      case 'home': return <Home setCurrentView={setCurrentView} />;
      case 'tracker': return <Tracker />;
      case 'planner': return <ProgramPlanner />;
      case 'nutrition': return <Nutrition />;
      case 'journal': return <Journal />;
      default: return <Home />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-black text-white selection:bg-teal-500/30 selection:text-teal-200">
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />

        <main className="pt-16">
          {renderView()}
        </main>
      </div>
    </LanguageProvider>
  );
}

export default App;
