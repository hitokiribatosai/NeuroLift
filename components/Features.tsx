import React from 'react';
import { Card } from './ui/Card';
import { useLanguage } from '../contexts/LanguageContext';

export const Features: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      title: t('feat_1_title'),
      description: t('feat_1_desc'),
      icon: (
        <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      title: t('feat_2_title'),
      description: t('feat_2_desc'),
      icon: (
        <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: t('feat_3_title'),
      description: t('feat_3_desc'),
      icon: (
        <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ];

  return (
    <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">{t('feat_title')}</h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">{t('feat_subtitle')}</p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature, i) => (
          <Card key={i} className="flex flex-col items-start bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-3 ring-1 ring-zinc-200 dark:ring-white/10 transition-colors group-hover:bg-teal-500/10 group-hover:ring-teal-500/30">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{feature.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};