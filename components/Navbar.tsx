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

          {/* Language Switcher Dropdown - Inside scrollable container */}
          <div className="relative group shrink-0 border-l border-zinc-800 pl-4 ml-2 mr-4 py-2">
            <button className="flex items-center gap-1.5 transition-colors hover:text-white uppercase font-bold text-xs tracking-widest cursor-default">
              {language}
              <svg className="w-3 h-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-[60]">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl min-w-[80px]">
                {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`w-full px-4 py-2 text-left text-[10px] font-bold uppercase tracking-widest hover:bg-teal-500 hover:text-black transition-colors ${language === lang ? 'text-teal-400' : 'text-zinc-400'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Spacer */}
          <div className="w-8 shrink-0 sm:hidden" />
        </div>
      </div>
    </nav>
  );
};
