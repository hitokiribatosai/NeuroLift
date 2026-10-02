import React from 'react';
import { CompletedWorkout } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { safeStorage } from '../utils/storage';
import { TRAINING_SOURCES } from '../utils/trainingEvidence';

interface HomeProps {
  setCurrentView: (view: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setCurrentView }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const completedCount = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []).length;
  const savedPhase = safeStorage.getItem('neuroLift_tracker_phase');
  const hasSession = savedPhase === 'selection' || savedPhase === 'active';
  const journeys = [
    { number: '01', title: t('planner_title'), description: t('planner_desc'), view: 'planner' },
    { number: '02', title: t('nav_workout'), description: t('home_smart_tracker_desc'), view: 'tracker' },
    { number: '03', title: t('nav_journal'), description: t('home_analytics_desc'), view: 'journal' },
  ];

  return <div className="mx-auto w-full max-w-7xl px-5 pb-28 pt-5 sm:px-8 lg:pt-10">
    <section className={`relative overflow-hidden rounded-[2rem] border p-6 sm:p-10 lg:p-12 ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-800 bg-zinc-900/70'}`}>
      <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-teal-500/15 blur-3xl" />
      <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
            <span className="h-2 w-2 rounded-full bg-teal-500" />{t('home_beta_live')}
          </p>
          <h1 className="max-w-2xl text-[clamp(2.7rem,7vw,5.8rem)] font-black leading-[0.98] tracking-[-0.065em] text-zinc-950 dark:text-white">
            {t('home_hero_title_1')} <span className="text-teal-700 dark:text-teal-300">{t('home_hero_title_2')}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-lg">{t('home_hero_subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setCurrentView('tracker')}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-teal-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-teal-900/15 transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400 dark:bg-teal-400 dark:text-zinc-950 dark:hover:bg-teal-300">
              {hasSession ? t('tracker_resume') : t('home_start_tracking')} <span aria-hidden="true">↗</span>
            </button>
            <button type="button" onClick={() => setCurrentView('planner')}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-bold text-zinc-900 transition hover:border-teal-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-2 focus-visible:outline-teal-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white">
              {t('home_browse_library')}
            </button>
          </div>
          <p className="mt-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('home_no_account')}</p>
        </div>

        <div className={`rounded-3xl border p-5 shadow-xl sm:p-7 ${isLight ? 'border-zinc-200 bg-white shadow-zinc-200/50' : 'border-zinc-700 bg-zinc-950/85 shadow-black/20'}`}>
          <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-600 dark:text-zinc-400">{t('home_training_space')}</p><p className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">{t('home_next_step')}</p></div>
            <span className="rounded-xl bg-teal-500/10 px-3 py-2 text-sm font-black text-teal-700 dark:text-teal-300">{completedCount} {t('home_sessions_logged')}</span>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {journeys.map(journey => <button type="button" key={journey.number} onClick={() => setCurrentView(journey.view)}
              className="group flex w-full items-center gap-4 py-4 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-black text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{journey.number}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-zinc-950 dark:text-white">{journey.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{journey.description}</span></span>
              <span className="text-lg text-teal-700 transition-transform group-hover:translate-x-1 dark:text-teal-300" aria-hidden="true">→</span>
            </button>)}
          </div>
        </div>
      </div>
    </section>

    <section className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-800" aria-labelledby="home-sources-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 id="home-sources-title" className="text-xl font-black text-zinc-950 dark:text-white">{t('home_sources_title')}</h2>
        <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">{t('home_sources_subtitle')}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {TRAINING_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"
          className={`rounded-2xl border p-4 transition hover:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-800 bg-zinc-900/40'}`}>
          <span className="block text-sm font-bold text-zinc-950 dark:text-white">{source.name} <span aria-hidden="true" className="text-teal-700 dark:text-teal-300">↗</span></span>
          <span className="mt-1 block text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{source.description}</span>
        </a>)}
      </div>
    </section>
  </div>;
};
