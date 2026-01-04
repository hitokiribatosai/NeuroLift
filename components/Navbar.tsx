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
          <div className="w-8 shrink-0 sm:hidden" />
        </div>

        {/* Language Switcher Dropdown */}
        <div className="relative group shrink-0 hidden sm:block">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-white hover:border-zinc-700 transition-all">
            {language}
            <svg className="w-3 h-3 text-zinc-600 group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </button>

          <div className="absolute top-full right-0 mt-2 w-20 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 shadow-2xl z-50">
            {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`w-full px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-black transition-colors ${language === lang ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-500'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Language Switcher (Tap to Expand) */}
        <div className="sm:hidden shrink-0 relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="appearance-none bg-zinc-900 border border-zinc-800 text-[10px] font-black text-teal-400 uppercase tracking-widest px-3 py-1.5 rounded-lg pr-8 focus:outline-none focus:border-teal-500/50"
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-600">
            <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>
      </div>
    </nav>
  );
};
