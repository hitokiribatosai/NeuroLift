import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, MuscleGroup } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm' : 'bg-transparent'}`} dir={dir}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <img src="/logo.png" alt="NeuroLift" className="h-10 w-auto rounded-xl" />
        </div>

        {/* Navigation Items - Scrollable on mobile */}
        <div className="flex flex-1 items-center gap-4 sm:gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 px-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`transition-colors hover:text-teal-600 dark:hover:text-white shrink-0 ${currentView === item.id ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''}`}
            >
              {item.label}
            </button>
          ))}

          {/* Theme & Language Controls */}
          <div className="flex shrink-0 items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-all shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </button>

            {/* Language Switcher */}
            <div className="relative group hidden sm:block">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest hover:text-teal-600 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
                {language}
                <svg className="w-3 h-3 text-zinc-400 dark:text-zinc-600 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
              </button>

              <div className="absolute bottom-full mb-2 right-0 w-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 shadow-xl z-50">
                {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`w-full px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white dark:hover:text-black transition-colors ${language === lang ? 'text-teal-600 dark:text-teal-400 bg-teal-500/5 dark:bg-teal-500/10' : 'text-zinc-500'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Dropdown (Tap) */}
            <div className="sm:hidden relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest px-3 py-1.5 rounded-lg pr-7 focus:outline-none focus:border-teal-500/50 shadow-sm"
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="ar">AR</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-zinc-400 dark:text-zinc-600">
                <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>
          </div>

          <div className="w-8 shrink-0 sm:hidden" />
        </div>
      </div>
    </nav>
  );
};
