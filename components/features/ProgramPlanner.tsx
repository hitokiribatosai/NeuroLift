import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';
import { SpotlightButton } from '../ui/SpotlightButton';
import { getExerciseDatabase, getLocalizedMuscleName } from '../../utils/exerciseData';

export const ProgramPlanner: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const exerciseDB = getExerciseDatabase(language);
  const muscleList = Object.keys(exerciseDB);

  const filteredExercises = searchQuery
    ? Object.entries(exerciseDB).flatMap(([muscle, categories]) => {
      const allExs: { name: string, muscle: string, category: string }[] = [];
      (['weightlifting', 'cables', 'bodyweight'] as const).forEach(cat => {
        categories[cat].forEach(ex => {
          if (ex.toLowerCase().includes(searchQuery.toLowerCase())) {
            allExs.push({ name: ex, muscle, category: cat });
          }
        });
      });
      return allExs;
    })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-24 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">{t('planner_title')}</h2>
          <p className="text-zinc-500 text-sm italic">{t('planner_desc')}</p>
        </div>
        <div className="relative w-full md:w-80">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-600 dark:text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('planner_search_placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSelectedMuscle(null);
            }}
            className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500 shadow-sm transition-all font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Muscle Selection Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          {muscleList.map(muscleKey => (
            <button
              key={muscleKey}
              onClick={() => {
                setSelectedMuscle(muscleKey);
                setSearchQuery('');
              }}
              className={`text-left px-6 py-4 rounded-2xl border transition-all duration-300 font-black uppercase tracking-widest text-[10px] sm:text-xs ${selectedMuscle === muscleKey
                ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20'
                : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 shadow-sm'
                }`}
            >
              {getLocalizedMuscleName(muscleKey, language)}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="lg:col-span-9">
          {searchQuery ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-xl font-black text-zinc-900 dark:text-teal-400 mb-8 flex items-center gap-4">
                <span className="w-2.5 h-8 bg-teal-500 rounded-full"></span>
                {filteredExercises.length} results for "{searchQuery}"
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map((feat, i) => (
                  <Card
                    key={i}
                    className="p-6 flex flex-col gap-5 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group transition-all duration-300 border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-black font-mono text-xs border border-zinc-100 dark:border-zinc-700 group-hover:border-teal-500/50 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-zinc-900 dark:text-zinc-200 font-black text-xs uppercase tracking-tight">{feat.name}</span>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-500 font-black uppercase tracking-[0.2em]">{getLocalizedMuscleName(feat.muscle, language)}</span>
                          <span className="text-[9px] text-teal-600 dark:text-teal-500/60 font-black uppercase tracking-[0.2em]">• {feat.category}</span>
                        </div>
                      </div>
                    </div>

                    <SpotlightButton
                      variant="secondary"
                      className="w-full text-[10px] py-3 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all font-black uppercase tracking-widest shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExercise(feat.name);
                      }}
                    >
                      {t('btn_learn')}
                    </SpotlightButton>
                  </Card>
                ))}
              </div>
            </div>
          ) : selectedMuscle ? (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-12">
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                <span className="w-3 h-10 bg-teal-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                {getLocalizedMuscleName(selectedMuscle, language)}
              </h3>

              <div className="space-y-12">
                {(['weightlifting', 'cables', 'bodyweight'] as const).map(category => {
                  const exercises = exerciseDB[selectedMuscle]?.[category] || [];
                  if (exercises.length === 0) return null;

                  return (
                    <div key={category}>
                      <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-4 ml-1">
                        {category}
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-900"></div>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {exercises.map((ex, i) => (
                          <Card
                            key={i}
                            className="p-6 flex flex-col gap-5 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group transition-all duration-300 border-zinc-200 dark:border-zinc-800 shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-black font-mono text-xs border border-zinc-100 dark:border-zinc-700 group-hover:border-teal-500/50 group-hover:text-teal-600 transition-all">
                                {i + 1}
                              </div>
                              <span className="text-zinc-900 dark:text-zinc-200 font-black text-xs uppercase tracking-tight">{ex}</span>
                            </div>

                            <SpotlightButton
                              variant="secondary"
                              className="w-full text-[10px] py-3 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all font-black uppercase tracking-widest shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedExercise(ex);
                              }}
                            >
                              {t('btn_learn')}
                            </SpotlightButton>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-zinc-400 dark:text-zinc-600 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] bg-white dark:bg-zinc-900/10 backdrop-blur-sm shadow-inner">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-6 text-zinc-200 dark:text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="uppercase tracking-[0.3em] font-black text-[10px]">{t('planner_desc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video/Image Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/20 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl rounded-[3rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 shadow-3xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
            <button
              onClick={() => setSelectedExercise(null)}
              className="absolute right-8 top-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title={t('modal_close')}
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex items-center gap-4 mb-8 pr-12">
              <div className="w-3 h-10 bg-teal-500 rounded-full"></div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight">{selectedExercise}</h3>
            </div>

            <div className="aspect-video w-full rounded-2xl bg-zinc-50 dark:bg-black/60 mb-10 overflow-hidden relative group border border-zinc-100 dark:border-zinc-800 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-teal-500/10 dark:bg-teal-500/20 border-2 border-teal-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 backdrop-blur-sm shadow-xl">
                  <svg className="h-10 w-10 text-teal-600 dark:text-teal-400 ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em]">{t('modal_watch_video')}</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <a
                href={`https://www.youtube.com/results?search_query=${selectedExercise}+technique`}
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <SpotlightButton className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20">
                  {t('modal_watch_video')}
                </SpotlightButton>
              </a>
              <button
                onClick={() => setSelectedExercise(null)}
                className="w-full py-4 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-black uppercase tracking-[0.3em] transition-all"
              >
                {t('modal_close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};