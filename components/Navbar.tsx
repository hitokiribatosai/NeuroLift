import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useFontSize, FontSize } from '../contexts/FontSizeContext';
import { Language, MuscleGroup } from '../types';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();
  const { fontSize, setFontSize } = useFontSize();

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
      if (!target.closest('.font-size-dropdown-container')) {
        setIsFontSizeOpen(false);
      }
    };
    if (isLangOpen || isFontSizeOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isLangOpen, isFontSizeOpen]);

  const navItems = [
    { id: 'home', label: t('nav_home') },
    { id: 'planner', label: t('nav_planner') },
    { id: 'tracker', label: t('nav_workout') },
    { id: 'journal', label: t('nav_journal') },
    { id: 'clock', label: t('nav_clock') },
  ];

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800 shadow-sm' : 'bg-transparent'}`}
      dir={dir}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        ...(scrolled ? { WebkitBackdropFilter: 'blur(12px)' } : {})
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
          <img src="/logo.png" alt="NeuroLift" className="h-10 w-auto rounded-xl shadow-lg" />
        </div>

        {/* Font Size Selector */}
        <div className="relative font-size-dropdown-container">
          <button
            onClick={(e) => { e.stopPropagation(); setIsFontSizeOpen(!isFontSizeOpen); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all shadow-sm ${isFontSizeOpen ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
            title="Font Size"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5v14m0 0l-2-2m2 2l2-2m8-12v14m0 0l-2-2m2 2l2-2M3 17h6m6-14h6M9 3h12" />
            </svg>
            <svg className={`w-3 h-3 text-zinc-600 transition-transform duration-300 ${isFontSizeOpen ? 'rotate-180 text-teal-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </button>

          <div className={`absolute top-full mt-2 right-0 w-40 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-200 shadow-2xl z-[100] ${dir === 'rtl' ? 'left-0 right-auto' : 'right-0 left-auto'} ${isFontSizeOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            {(['small', 'medium', 'large', 'xlarge'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => { setFontSize(size); setIsFontSizeOpen(false); }}
                className={`w-full px-5 py-3 text-start transition-colors flex items-center justify-between ${fontSize === size ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : size === 'large' ? 'Large' : 'X-Large'}
                </span>
                <span className="font-bold" style={{ fontSize: size === 'small' ? '0.875rem' : size === 'medium' ? '1rem' : size === 'large' ? '1.125rem' : '1.25rem' }}>Aa</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Switcher - Premium Dropdown for All Screens */}
        <div className="relative lang-dropdown-container">
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

        {/* Navigation Items - Scrollable Middle */}
        <div className="relative flex flex-1 items-center ms-4 overflow-hidden mask-linear-fade">
          <div className="flex items-center gap-6 text-sm font-bold text-zinc-400 overflow-x-auto whitespace-nowrap scrollbar-hide py-3 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`relative py-1 transition-colors hover:text-white shrink-0 uppercase tracking-widest text-[10px] ${currentView === item.id ? 'text-teal-400' : ''}`}
              >
                <span className="relative z-10">{item.label}</span>
                {currentView === item.id && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </button>
            ))}
            <div className="w-4 shrink-0 sm:hidden"></div>
          </div>
          {/* Scroll Indicator Arrow */}
          <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-teal-500/50 animate-pulse sm:hidden ${dir === 'rtl' ? 'left-0 rotate-180' : 'right-0'}`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
};
