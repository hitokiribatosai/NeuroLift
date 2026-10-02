import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card } from '../ui/Card';
import { SpotlightButton } from '../ui/SpotlightButton';
import { getExerciseDatabase, getLocalizedMuscleName, getExerciseTranslation, getEnglishExerciseName } from '../../utils/exerciseData';
import { TrainingGuidance } from '../ui/TrainingGuidance';
import { ExerciseDemo } from '../ui/ExerciseDemo';
import { ExerciseEvidenceHighlights } from '../ui/ExerciseEvidenceHighlights';
import { EXERCISE_EVIDENCE } from '../../utils/exerciseEvidence';
import { Modal } from '../ui/Modal';

export const ProgramPlanner: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [researchOnly, setResearchOnly] = useState(false);

  const exerciseDB = getExerciseDatabase(language);
  const muscleList = Object.keys(exerciseDB);
  const researchNames = new Set(EXERCISE_EVIDENCE.map(entry => entry.name));
  const researchGroups = [...new Set(EXERCISE_EVIDENCE.map(entry => entry.group))];

  const filteredExercises = searchQuery
    ? Object.entries(exerciseDB).flatMap(([muscle, subCats]) => {
      const allExs: { name: string, muscle: string, subCategory: string, category: string }[] = [];
      Object.entries(subCats).forEach(([subName, categories]) => {
        (['machines', 'dumbbells', 'barbells', 'cables', 'bodyweight'] as const).forEach(cat => {
          categories[cat].forEach(ex => {
            if (ex.toLowerCase().includes(searchQuery.toLowerCase())
              && (!researchOnly || researchNames.has(getEnglishExerciseName(ex)))) {
              allExs.push({ name: ex, muscle, subCategory: subName, category: cat });
            }
          });
        });
      });
      return allExs;
    })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 pt-4 pb-32 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">{t('planner_title')}</h2>
          <p className="text-zinc-300 text-sm italic">{t('planner_desc')}</p>
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
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-teal-500 shadow-sm transition-all font-medium"
          />
        </div>
        <div className="flex gap-2" role="group" aria-label={t('planner_title')}>
          <button type="button" aria-pressed={!researchOnly} onClick={() => {
            setResearchOnly(false);
            if (!selectedMuscle && !searchQuery) {
              setSelectedMuscle(muscleList[0]);
              setSelectedSubCategory(Object.keys(exerciseDB[muscleList[0]])[0]);
            }
          }}
            className={`rounded-xl border px-3 py-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${!researchOnly ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300' : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'}`}>
            {t('picker_all_filter')}
          </button>
          <button type="button" aria-pressed={researchOnly}
            onClick={() => {
              setResearchOnly(true);
              if (!searchQuery) setSelectedMuscle(null);
            }}
            className={`rounded-xl border px-3 py-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${researchOnly ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300' : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'}`}>
            {t('picker_research_filter')}
          </button>
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
                setSelectedSubCategory(Object.keys(exerciseDB[muscleKey])[0]);
                setSearchQuery('');
              }}
              className={`text-left px-6 py-4 rounded-2xl border transition-all duration-300 font-black uppercase tracking-widest text-[10px] sm:text-xs ${selectedMuscle === muscleKey
                ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20'
                : 'bg-zinc-900/30 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:text-zinc-50 shadow-sm'
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
                    onClick={() => setSelectedExercise(feat.name)}
                    className="p-6 flex flex-col gap-5 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group transition-all duration-300 border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-black font-mono text-xs border border-zinc-100 dark:border-zinc-700 group-hover:border-teal-500/50 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all">
                        {i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-zinc-900 dark:text-zinc-200 font-black text-xs uppercase tracking-tight">{getExerciseTranslation(feat.name, language)}</span>
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
                      {t('modal_watch_video')}
                    </SpotlightButton>
                  </Card>
                ))}
              </div>
            </div>
          ) : researchOnly && !selectedMuscle ? (
            <div className="space-y-8">
              <h3 className="text-2xl font-black uppercase text-zinc-900 dark:text-white">{t('research_picks_title')}</h3>
              {researchGroups.map(group => <div key={group}>
                <h4 className="mb-3 text-lg font-bold text-zinc-800 dark:text-zinc-200">{getLocalizedMuscleName(group, language)}</h4>
                <ExerciseEvidenceHighlights group={group} onViewDemo={setSelectedExercise} />
              </div>)}
            </div>
          ) : selectedMuscle ? (
            <div className="animate-in slide-in-from-right-8 duration-500 space-y-12">
              <div className="flex flex-col gap-6">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                  <span className="w-3 h-10 bg-teal-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                  {getLocalizedMuscleName(selectedMuscle, language)}
                </h3>

                <ExerciseEvidenceHighlights group={selectedMuscle} onViewDemo={setSelectedExercise} />

                {/* Subcategory Navigation */}
                <div className="flex flex-wrap gap-2">
                  {Object.keys(exerciseDB[selectedMuscle]).map(subKey => (
                    <button
                      key={subKey}
                      onClick={() => setSelectedSubCategory(subKey)}
                      className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedSubCategory === subKey
                        ? 'bg-teal-500/10 border-teal-500/50 text-teal-600 dark:text-teal-400'
                        : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-100'
                        }`}
                    >
                      {getLocalizedMuscleName(subKey, language)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-12">
                {selectedSubCategory && (() => {
                  // Collect all exercises from all categories for this sub
                  const allExercises: string[] = [];
                  (['machines', 'dumbbells', 'barbells', 'cables', 'bodyweight'] as const).forEach(cat => {
                    const exs = exerciseDB[selectedMuscle]?.[selectedSubCategory]?.[cat] || [];
                    exs.forEach(ex => {
                      if ((!researchOnly || researchNames.has(getEnglishExerciseName(ex))) && !allExercises.includes(ex)) allExercises.push(ex);
                    });
                  });

                  const renderCard = (ex: string, i: number) => (
                    <Card
                      key={`${ex}-${i}`}
                      onClick={() => setSelectedExercise(ex)}
                      className="p-6 flex flex-col gap-5 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group transition-all duration-300 border-zinc-200 dark:border-zinc-800 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 font-black font-mono text-xs border border-zinc-100 dark:border-zinc-700 group-hover:border-teal-500/50 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0 pr-10 rtl:pr-0 rtl:pl-10">
                          <span className="block text-zinc-900 dark:text-zinc-200 font-black text-xs uppercase tracking-tight">{getExerciseTranslation(ex, language)}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExercise(ex);
                        }}
                        className="absolute right-6 rtl:right-auto rtl:left-6 top-6 p-2 text-zinc-400 hover:text-teal-500 transition-all"
                        title={t('modal_watch_video')}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </Card>
                  );

                  return (
                    <>

                      {/* Full Library */}
                      {allExercises.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-black text-zinc-300 dark:text-zinc-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-4 ml-1">
                            {t('full_library_title')}
                            <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-900"></div>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allExercises.map((ex, i) => renderCard(ex, i))}
                          </div>
                        </div>
                      )}
                      {researchOnly && allExercises.length === 0 && <p className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{t('picker_no_research')}</p>}
                    </>
                  );
                })()}
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

      <TrainingGuidance />
      {/* Video/Image Modal */}
      <Modal isOpen={!!selectedExercise} onClose={() => setSelectedExercise(null)}>
        {selectedExercise && (() => {
          const tutorialUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedExercise + ' exercise tutorial short')}`;
          return (
            <div className="relative w-full max-w-2xl mx-auto rounded-[3rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 shadow-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="absolute right-8 top-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title={t('modal_close')}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="flex items-center gap-4 mb-4 pr-12">
                <div className="w-3 h-10 bg-teal-500 rounded-full"></div>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight">{getExerciseTranslation(selectedExercise, language)}</h3>
              </div>

              <div className="flex flex-col gap-4">
                <ExerciseDemo name={selectedExercise} />
                <a
                  href={tutorialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-3 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-red-600/30"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" /></svg>
                  {t('modal_watch_video')}
                </a>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="w-full py-2 text-[10px] text-zinc-400 hover:text-rose-500 font-black uppercase tracking-[0.3em] transition-all"
                >
                  {t('modal_close')}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};
