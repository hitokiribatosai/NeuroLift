import { Capacitor } from '@capacitor/core';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useFontSize, FontSize } from '../contexts/FontSizeContext';
import { DataManager } from '../utils/dataManager';
import { Language } from '../types';
interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}
export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();
  const { fontSize, setFontSize } = useFontSize();
  const isNative = Capacitor.isNativePlatform();

  const [isExporting, setIsExporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importDataContent, setImportDataContent] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    await DataManager.exportData();
    setIsExporting(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportDataContent(content);
        setShowImportConfirm(true);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const confirmImport = async () => {
    if (!importDataContent) return;

    const result = await DataManager.importData(importDataContent);
    setShowImportConfirm(false);
    setImportDataContent(null);

    if (result.success) {
      alert(t('import_success'));
      window.location.reload();
    } else {
      alert(`${t('import_error')} ${result.message}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.settings-container')) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSettingsOpen]);

  const navItems = [
    {
      id: 'home',
      label: t('nav_home'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'planner',
      label: t('nav_planner'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'tracker',
      label: t('nav_workout'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'journal',
      label: t('nav_journal'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'clock',
      label: t('nav_clock'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  const fontSizes: { id: FontSize; label: string }[] = [
    { id: 'small', label: t('font_size_small') },
    { id: 'medium', label: t('font_size_medium') },
    { id: 'large', label: t('font_size_large') },
    { id: 'xlarge', label: t('font_size_xlarge') },
  ];

  const SettingsDropdown = () => (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`absolute top-full mt-2 w-64 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-3xl p-4 shadow-2xl z-[100] ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
        >
          <div className="mb-6">
            <h3 className="text-[0.625rem] font-black text-zinc-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t('language')}
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${language === lang.code ? 'bg-teal-500/10 text-teal-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
                >
                  <span className="text-xs font-bold">{lang.label}</span>
                  {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]" />}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[0.625rem] font-black text-zinc-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              {t('font_size')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {fontSizes.map((size) => (
                <motion.button
                  key={size.id}
                  onClick={() => setFontSize(size.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${fontSize === size.id ? 'bg-teal-500/10 border-teal-500/50 text-teal-400 shadow-sm' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
                >
                  <span className="text-[0.625rem] font-bold mb-1">{size.label}</span>
                  <span className="font-black" style={{ fontSize: size.id === 'small' ? '0.75rem' : size.id === 'medium' ? '0.875rem' : size.id === 'large' ? '1rem' : '1.125rem' }}>Aa</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-[0.625rem] font-black text-zinc-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {t('data_management')}
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-teal-500/30 text-zinc-400 hover:text-white transition-all text-xs font-bold"
              >
                <div className="p-1.5 bg-zinc-800 rounded-lg text-teal-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <span>{isExporting ? t('loading') : t('export_data')}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-teal-500/30 text-zinc-400 hover:text-white transition-all text-xs font-bold"
              >
                <div className="p-1.5 bg-zinc-800 rounded-lg text-teal-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <span>{t('import_data')}</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
              </button>

              <a
                href="#privacy"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-teal-500/30 text-zinc-400 hover:text-white transition-all text-xs font-bold mt-2"
              >
                <div className="p-1.5 bg-zinc-800 rounded-lg text-zinc-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <span>{t('privacy_policy')}</span>
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Top Navbar: Always visible, houses Logo and Settings Gear */}
      <nav
        className={`fixed top-0 z-[60] w-full transition-all duration-500 ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-zinc-800/50 shadow-xl' : 'bg-gradient-to-b from-[#0a0a0a]/80 to-transparent'}`}
        dir={dir}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          ...(scrolled ? { WebkitBackdropFilter: 'blur(12px)' } : {})
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          {/* Logo */}
          <motion.div
            className="flex shrink-0 items-center gap-2 cursor-pointer"
            onClick={() => setCurrentView('home')}
            whileTap={{ scale: 0.95 }}
          >
            <img src="/logo.png" alt="NeuroLift" className="h-12 w-auto rounded-xl shadow-lg" />
            <span className="text-white font-black tracking-tighter text-lg">NeuroLift</span>
          </motion.div>

          {/* Desktop Navigation Items - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-400 mx-8">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                whileTap={{ y: 2 }}
                className={`relative py-1 transition-colors hover:text-white shrink-0 uppercase tracking-widest text-[0.625rem] ${currentView === item.id ? 'text-teal-400' : 'text-zinc-300'}`}
              >
                <span className="relative z-10">{item.label}</span>
                {currentView === item.id && (
                  <motion.div
                    layoutId="navbar-indicator-desktop"
                    className="absolute bottom-[-4px] left-0 right-0 h-0.5 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)]"
                    transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </motion.button>
            ))}
          </div>


          {/* Settings Section */}
          <div className="relative settings-container">
            <motion.button
              onClick={(e) => { e.stopPropagation(); setIsSettingsOpen(!isSettingsOpen); }}
              whileTap={{ scale: 0.9 }}
              className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all shadow-sm ${isSettingsOpen ? 'bg-zinc-800 border-zinc-700 text-teal-400' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
            >
              <motion.svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ rotate: isSettingsOpen ? 90 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </motion.svg>
            </motion.button>
            <SettingsDropdown />
          </div>
        </div>
      </nav>

      {/* Bottom Tab Bar: Visible only on smaller screens */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] pointer-events-none">
        <div className="w-full bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-zinc-800 shadow-2xl flex items-center justify-around p-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pointer-events-auto relative overflow-hidden">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              whileTap={{ scale: 0.9, y: 4 }}
              className={`relative flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-2xl transition-all duration-300 min-w-[64px] ${currentView === item.id ? 'text-teal-400 scale-105' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <div className={`transition-all duration-300 ${currentView === item.id ? 'translate-y-[-2px]' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[0.5rem] font-bold uppercase tracking-widest transition-opacity duration-300 ${currentView === item.id ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>

              {currentView === item.id && (
                <motion.div
                  layoutId="navbar-indicator-mobile"
                  className="absolute inset-0 bg-teal-500/10 rounded-2xl -z-10"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Import Confirmation Modal */}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500"></div>

            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-6 text-rose-500 mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>

            <h3 className="text-xl font-black text-white text-center mb-2 uppercase tracking-tight">
              {t('import_warning_title')}
            </h3>

            <p className="text-zinc-400 text-center text-sm font-medium leading-relaxed mb-8">
              {t('import_warning_desc')}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmImport}
                className="w-full py-4 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] transition-all rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/25"
              >
                {t('confirm_yes')}
              </button>
              <button
                onClick={() => { setShowImportConfirm(false); setImportDataContent(null); }}
                className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] transition-all rounded-2xl text-zinc-400 font-black uppercase tracking-widest text-xs"
              >
                {t('confirm_cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
