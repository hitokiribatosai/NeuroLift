import React from 'react';
import { SpotlightButton } from './ui/SpotlightButton';
import { HERO_FEATURES } from '../constants/bentoGrid';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { TRAINING_SOURCES } from '../utils/trainingEvidence';

interface HomeProps {
  setCurrentView: (view: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setCurrentView }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-20 md:pt-20 md:pb-32 text-center overflow-hidden">
        {/* Background Glow — dark mode only */}
        {!isLight && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/20 rounded-full blur-[100px] -z-10 opacity-30 animate-pulse"></div>
        )}

        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/50 rounded-full border border-zinc-800 mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">{t('home_beta_live')}</span>
          </div>

          <h1 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter leading-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            {t('home_hero_title_1')} <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isLight ? 'from-teal-600 to-teal-400' : 'from-teal-400 to-teal-200'}`}>{t('home_hero_title_2')}</span>
          </h1>

          <p className={`text-lg max-w-lg mx-auto leading-relaxed ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            {t('home_hero_subtitle')}
          </p>

          <div className="pt-8 flex flex-col items-center gap-4">
            <SpotlightButton
              onClick={() => setCurrentView('tracker')}
              className="px-12 py-5 text-lg font-black uppercase tracking-widest shadow-2xl shadow-teal-500/20"
            >
              {t('home_start_tracking')}
            </SpotlightButton>
            <p className={`text-xs font-mono ${isLight ? 'text-zinc-500' : 'text-zinc-600'}`}>{t('home_no_account')}</p>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(220px,auto)] gap-4">
          {HERO_FEATURES.map((feature) => (
            <button
              key={feature.id}
              onClick={() => feature.link !== '#' && setCurrentView(feature.link)}
              className={`relative group p-6 rounded-3xl border text-start transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between overflow-hidden ${feature.id === 'tracker' ? 'md:col-span-2' : ''} ${isLight
                ? 'bg-white border-zinc-200 shadow-sm hover:shadow-md'
                : feature.className
                }`}
            >
              <div className="absolute top-0 right-0 p-32 bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full -z-0"></div>

              <div className="relative z-10">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className={`text-xl font-black uppercase tracking-tight mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>{t(feature.title as any)}</h3>
                <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{t(feature.description as any)}</p>
              </div>

              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-4">
                <svg className={`w-6 h-6 ${isLight ? 'text-zinc-400' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Research Sources */}
      <section className={`px-6 pb-24 ${isLight ? 'border-t border-zinc-200' : 'border-t border-zinc-800'}`}>
        <div className="max-w-5xl mx-auto pt-16">
          <div className="text-center mb-12">
            <h2 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter mb-3 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              🧬 {t('home_sources_title')}
            </h2>
            <p className={`text-sm max-w-md mx-auto ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {t('home_sources_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRAINING_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className={`group p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${isLight
                  ? 'bg-white border-zinc-200 hover:border-teal-300 hover:shadow-md'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isLight ? 'bg-teal-500/10 text-teal-600' : 'bg-teal-500/10 text-teal-400'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-black uppercase tracking-tight mb-1 ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      {source.name}
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                      {source.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
