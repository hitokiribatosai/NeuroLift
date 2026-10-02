import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getExerciseDatabase, getLocalizedMuscleName, getExerciseTranslation, getEnglishExerciseName } from '../../utils/exerciseData';
import { TrainingGuidance } from '../ui/TrainingGuidance';
import { ExerciseDemo } from '../ui/ExerciseDemo';
import { ExerciseEvidenceHighlights } from '../ui/ExerciseEvidenceHighlights';
import { EXERCISE_EVIDENCE } from '../../utils/exerciseEvidence';
import { Modal } from '../ui/Modal';
import media from '../../utils/exerciseMedia.json';

type MediaEntry = { source: string; images: string[] };
const demos = media as Record<string, MediaEntry>;
const categories = ['machines', 'dumbbells', 'barbells', 'cables', 'bodyweight'] as const;

function LibraryCard({ name, detail, onOpen }: { name: string; detail?: string; onOpen: () => void }) {
  const { language, t } = useLanguage();
  const demo = demos[getEnglishExerciseName(name)];
  return <button type="button" onClick={onOpen}
    className="group flex min-h-28 w-full items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-3 text-start transition hover:-translate-y-0.5 hover:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 dark:border-zinc-800 dark:bg-zinc-900/70">
    <span className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 ${demo?.source === 'workout-guide' ? 'bg-zinc-900' : 'bg-white'}`}>
      {demo ? <img src={demo.images[0]} alt="" loading="lazy" className="h-full w-full object-contain" />
        : <svg className="h-8 w-8 text-zinc-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16v12H4zM8 10h.01M4 16l5-4 3 3 2-2 6 4" /></svg>}
    </span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-snug text-zinc-950 dark:text-white">{getExerciseTranslation(name, language)}</span>
      {detail && <span className="mt-1 block text-xs text-zinc-600 dark:text-zinc-400">{detail}</span>}
      <span className="mt-2 block text-xs font-bold text-teal-700 dark:text-teal-300">{demo ? t('research_view_demo') : t('library_view_details')} <span aria-hidden="true">→</span></span>
    </span>
  </button>;
}

export const ProgramPlanner: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>('Chest');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>('Upper Chest');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [researchOnly, setResearchOnly] = useState(false);

  const exerciseDB = getExerciseDatabase(language);
  const muscleList = Object.keys(exerciseDB);
  const researchNames = new Set(EXERCISE_EVIDENCE.map(entry => entry.name));
  const researchGroups = [...new Set(EXERCISE_EVIDENCE.map(entry => entry.group))];
  const query = searchQuery.trim().toLocaleLowerCase();
  const filteredExercises = query ? Object.entries(exerciseDB).flatMap(([muscle, subCats]) =>
    Object.entries(subCats).flatMap(([subgroup, groups]) => categories.flatMap(category =>
      groups[category].filter(name => name.toLocaleLowerCase().includes(query)
        && (!researchOnly || researchNames.has(getEnglishExerciseName(name))))
        .map(name => ({ name, muscle, subgroup, category })))))
    : [];
  const uniqueResults = filteredExercises.filter((entry, index, all) => all.findIndex(other => other.name === entry.name) === index);
  const currentSubgroup = selectedMuscle && exerciseDB[selectedMuscle]?.[selectedSubCategory || '']
    ? selectedSubCategory : selectedMuscle ? Object.keys(exerciseDB[selectedMuscle])[0] : null;
  const currentExercises = selectedMuscle && currentSubgroup
    ? [...new Set(categories.flatMap(category => exerciseDB[selectedMuscle][currentSubgroup][category]))]
      .filter(name => !researchOnly || researchNames.has(getEnglishExerciseName(name)))
    : [];

  return <div className="mx-auto min-h-screen max-w-7xl px-5 pb-32 pt-5 sm:px-8 lg:pt-10">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">NeuroLift / {t('nav_planner')}</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">{t('planner_title')}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t('planner_desc')}</p></div>
      <p className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{Object.keys(demos).length} {t('library_demonstrations')}</p>
    </div>

    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="relative min-w-0 flex-1">
        <svg className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="search" aria-label={t('planner_search_placeholder')} placeholder={t('planner_search_placeholder')}
          value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white py-3 pe-4 ps-11 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" />
      </div>
      <div className="flex gap-2" role="group" aria-label={t('planner_title')}>
        <button type="button" aria-pressed={!researchOnly} onClick={() => { setResearchOnly(false); if (!selectedMuscle && !query) { setSelectedMuscle('Chest'); setSelectedSubCategory('Upper Chest'); } }}
          className={`min-h-11 rounded-xl border px-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${!researchOnly ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-zinc-950' : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'}`}>{t('picker_all_filter')}</button>
        <button type="button" aria-pressed={researchOnly} onClick={() => { setResearchOnly(true); if (!query) setSelectedMuscle(null); }}
          className={`min-h-11 rounded-xl border px-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${researchOnly ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-zinc-950' : 'border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'}`}>{t('picker_research_filter')}</button>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:h-fit lg:flex-col lg:overflow-visible" aria-label={t('picker_muscle_group')}>
        {muscleList.map(muscle => <button type="button" key={muscle} aria-pressed={selectedMuscle === muscle && !query}
          onClick={() => { setSelectedMuscle(muscle); setSelectedSubCategory(Object.keys(exerciseDB[muscle])[0]); setSearchQuery(''); }}
          className={`min-h-11 shrink-0 rounded-xl border px-4 py-2 text-start text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${selectedMuscle === muscle && !query ? 'border-teal-600 bg-teal-600 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-zinc-950' : 'border-zinc-200 bg-white text-zinc-700 hover:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200'}`}>{getLocalizedMuscleName(muscle, language)}</button>)}
      </nav>

      <div className="min-w-0 space-y-6">
        {query ? <section>
          <h3 className="mb-4 text-xl font-black text-zinc-950 dark:text-white">{uniqueResults.length} {t('library_results')}</h3>
          {uniqueResults.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{uniqueResults.map(result => <LibraryCard key={result.name} name={result.name}
            detail={`${getLocalizedMuscleName(result.muscle, language)} · ${getLocalizedMuscleName(result.subgroup, language)}`} onOpen={() => setSelectedExercise(result.name)} />)}</div>
            : <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{t('library_no_results')}</p>}
        </section> : researchOnly && !selectedMuscle ? <section className="space-y-6">
          <div><h3 className="text-2xl font-black text-zinc-950 dark:text-white">{t('research_picks_title')}</h3><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t('research_picks_note')}</p></div>
          {researchGroups.map(group => <div key={group}><h4 className="mb-3 text-lg font-bold text-zinc-900 dark:text-white">{getLocalizedMuscleName(group, language)}</h4><ExerciseEvidenceHighlights group={group} onViewDemo={setSelectedExercise} /></div>)}
        </section> : selectedMuscle && currentSubgroup ? <section className="space-y-5">
          <div><h3 className="text-2xl font-black text-zinc-950 dark:text-white">{getLocalizedMuscleName(selectedMuscle, language)}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t('picker_muscle_area')}</p></div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('picker_muscle_area')}>
            {Object.keys(exerciseDB[selectedMuscle]).map(subgroup => <button type="button" key={subgroup} aria-pressed={currentSubgroup === subgroup} onClick={() => setSelectedSubCategory(subgroup)}
              className={`min-h-10 shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${currentSubgroup === subgroup ? 'border-teal-500 bg-teal-500/15 text-teal-800 dark:text-teal-200' : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'}`}>{getLocalizedMuscleName(subgroup, language)}</button>)}
          </div>
          <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">{t('full_library_title')}</h4><span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{currentExercises.length} {t('library_results')}</span></div>
          {currentExercises.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{currentExercises.map(name => <LibraryCard key={name} name={name} onOpen={() => setSelectedExercise(name)} />)}</div>
            : <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{t('picker_no_research')}</p>}
          <ExerciseEvidenceHighlights group={selectedMuscle} onViewDemo={setSelectedExercise} />
        </section> : null}
      </div>
    </div>

    <details className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
      <summary className="cursor-pointer p-5 text-sm font-bold text-zinc-900 marker:text-teal-600 dark:text-white">{t('library_guidance')}</summary>
      <TrainingGuidance />
    </details>

    <Modal isOpen={!!selectedExercise} onClose={() => setSelectedExercise(null)}>
      {selectedExercise && <div className="relative mx-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        <button type="button" onClick={() => setSelectedExercise(null)} aria-label={t('modal_close')}
          className="absolute end-5 top-5 rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 dark:text-zinc-300 dark:hover:bg-zinc-800">✕</button>
        <h3 className="pe-10 text-2xl font-black text-zinc-950 dark:text-white">{getExerciseTranslation(selectedExercise, language)}</h3>
        <ExerciseDemo name={selectedExercise} />
        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedExercise + ' exercise tutorial short')}`} target="_blank" rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-900 hover:border-teal-500 dark:border-zinc-700 dark:text-white">{t('modal_watch_video')} ↗</a>
      </div>}
    </Modal>
  </div>;
};
