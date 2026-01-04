import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, MuscleGroup } from '../types';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.lang-dropdown-container')) {
        setIsLangOpen(false);
      }
    };
    if (isLangOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isLangOpen]);

  const navItems = [
    { id: 'home', label: t('nav_home') },
    { id: 'planner', label: t('nav_planner') },
    { id: 'tracker', label: t('nav_workout') },
    { id: 'journal', label: t('nav_journal') },
    { id: 'clock', label: t('nav_clock') },
  ];

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800 shadow-sm' : 'bg-transparent'}`} dir={dir}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <img src="/logo.png" alt="NeuroLift" className="h-10 w-auto rounded-xl shadow-lg" />
        </div>

        {/* Navigation Items - Grouped with Logo */}
        <div className="relative flex items-center ms-6 overflow-hidden mask-linear-fade">
          <div className="flex items-center gap-6 text-sm font-bold text-zinc-400 overflow-x-auto whitespace-nowrap scrollbar-hide py-1 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`transition-colors hover:text-white shrink-0 uppercase tracking-widest text-xs ${currentView === item.id ? 'text-teal-400' : ''}`}
              >
                {item.label}
              </button>
            ))}
            <div className="w-4 shrink-0 sm:hidden"></div> {/* Spacer for arrow */}
          </div>
          {/* Scroll Indicator Arrow (Mobile Only) */}
          <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-teal-500 animate-pulse sm:hidden ${dir === 'rtl' ? 'left-0 rotate-180' : 'right-0'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Controls - Pushed to End */}
        <div className="flex shrink-0 items-center gap-3 ms-4">

          {/* Language Switcher */}
          <div className="relative lang-dropdown-container hidden sm:block">
            <button
              onClick={(e) => { e.stopPropagation(); setIsLangOpen(!isLangOpen); }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all shadow-sm text-[10px] font-black uppercase tracking-widest ${isLangOpen ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
            >
              {language}
              <svg className={`w-3 h-3 text-zinc-600 transition-transform duration-300 ${isLangOpen ? 'rotate-180 text-teal-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>

            <div className={`absolute top-full mt-2 right-0 w-32 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 shadow-2xl z-[100] ${dir === 'rtl' ? 'left-0 right-auto' : 'right-0 left-auto'} ${isLangOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              {(['en', 'fr', 'ar'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setIsLangOpen(false); }}
                  className={`w-full px-5 py-3 text-start text-[10px] font-black uppercase tracking-widest transition-colors ${language === lang ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
                >
                  {lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : 'العربية'}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Select (Tap) */}
          <div className="sm:hidden relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="appearance-none bg-zinc-900 border border-zinc-800 text-[10px] font-black text-teal-400 uppercase tracking-widest px-4 py-2 rounded-xl pr-9 focus:outline-none focus:border-teal-500 shadow-sm"
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
            </select>
            <div className={`pointer-events-none absolute inset-y-0 flex items-center px-2 text-teal-500 ${dir === 'rtl' ? 'left-0' : 'right-0'}`}>
              <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
