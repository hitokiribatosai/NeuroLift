import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language } from '../types';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: t('nav_home') },
    { id: 'planner', label: t('nav_planner') },
    { id: 'tracker', label: t('nav_workout') },
    { id: 'nutrition', label: t('nav_nutrition') },
    { id: 'journal', label: t('nav_journal') },
    { id: 'clock', label: t('nav_clock') },
  ];

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-zinc-800' : 'bg-transparent'}`} dir={dir}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <img src="/logo.png" alt="NeuroLift" className="h-10 w-auto rounded-xl" />
        </div>

        {/* Navigation Items - Scrollable on mobile */}
        <div className="flex flex-1 items-center gap-4 sm:gap-6 text-sm font-medium text-zinc-400 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`transition-colors hover:text-white shrink-0 ${currentView === item.id ? 'text-teal-400 font-semibold' : ''}`}
            >
              {item.label}
            </button>
          ))}

          {/* Language Switcher - Vertical Divider & High Contrast Buttons */}
          <div className="flex shrink-0 items-center gap-1 border-l border-zinc-800 pl-4 ml-2 mr-4">
            {(['en', 'fr', 'ar'] as Language[]).map((lang, idx) => (
              <React.Fragment key={lang}>
                <button
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all rounded ${language === lang ? 'bg-teal-500 text-black shadow-[0_0_10px_rgba(20,184,166,0.3)]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {lang}
                </button>
                {idx < 2 && <span className="text-zinc-800 text-[10px]">|</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Mobile Spacer to ensure last items aren't cut off */}
          <div className="w-8 shrink-0 sm:hidden" />
        </div>
      </div>
    </nav>
  );
};
