import React from 'react';
import { SpotlightButton } from './ui/SpotlightButton';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  setCurrentView: (view: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ setCurrentView }) => {
  const { t } = useLanguage();

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden pt-20 text-center">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 grid-bg opacity-30"></div>
      <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-teal-500/20 blur-[120px] filter animate-pulse-slow"></div>

      <div className="relative z-10 max-w-4xl px-6">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl sm:bg-gradient-to-b sm:from-white sm:via-zinc-200 sm:to-zinc-500 sm:bg-clip-text sm:text-transparent">
          {t('hero_title_1')} <br />
          <span className="text-teal-500">{t('hero_title_2')}</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          {t('hero_subtitle')}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <SpotlightButton onClick={() => setCurrentView('tracker')}>
            {t('nav_workout')}
            <svg className="h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </SpotlightButton>
          <SpotlightButton variant="secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
            {t('btn_learn')}
          </SpotlightButton>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/10 blur-3xl animate-float"></div>
    </section>
  );
};