import { useCopy } from '../../hooks/useCopy';
import { useWorkspaceEditing } from '../../hooks/useWorkspaceEditing';
import React,{ useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInterfaceState } from '../../hooks/useInterfaceState';
import { getEnglishExerciseName,getExerciseDatabase,getExerciseTranslation,getLocalizedMuscleName } from '../../utils/exerciseData';
import { EXERCISE_EVIDENCE } from '../../utils/exerciseEvidence';
import media from '../../utils/exerciseMedia.json';
import { ExerciseDemo } from '../ui/ExerciseDemo';
import { ExerciseEvidenceHighlights } from '../ui/ExerciseEvidenceHighlights';
import { ExerciseGroupSelector } from '../ui/ExerciseGroupSelector';
import { Modal } from '../ui/Modal';
import { TrainingGuidance } from '../ui/TrainingGuidance';
import { WebResearchNote } from '../web/WebResearchNote';

type MediaEntry = { source: string; images: string[] };
const demos = media as Record<string, MediaEntry>;
const categories = ['machines', 'dumbbells', 'barbells', 'cables', 'bodyweight'] as const;

function LibraryCard({ name, detail, onOpen }: { name: string; detail?: string; onOpen: () => void }) {
  const { language, t } = useLanguage();
  const demo = demos[getEnglishExerciseName(name)];
  const evidence = EXERCISE_EVIDENCE.find(entry => entry.name === getEnglishExerciseName(name));
  const c = useCopy();
  return <button type="button" onClick={onOpen}
    className="group flex min-h-28 w-full items-center gap-4 rounded-2xl surface-rounded border border-zinc-200 surface-border bg-white p-3 text-start transition hover:-translate-y-0.5 hover:border-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 dark:border-zinc-800 surface-border dark:bg-zinc-900/70 surface-paper">
    <span className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 surface-border dark:border-zinc-700 surface-border ${demo?.source === 'workout-guide' ? 'bg-zinc-900 surface-paper' : 'bg-white'}`}>
      {demo ? <img src={demo.images[0]} alt="" loading="lazy" className="h-full w-full object-contain" />
        : <svg className="h-8 w-8 text-zinc-400 surface-muted surface-ink" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16v12H4zM8 10h.01M4 16l5-4 3 3 2-2 6 4" /></svg>}
    </span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-snug text-zinc-950 surface-ink dark:text-white">{getExerciseTranslation(name, language)}</span>
      {<span className="web-library-badges"><span>{demo ? c('demo_available') : c('images_not_yet_available')}</span>{evidence && <span>{t(evidence.level === 'direct' ? 'research_direct_badge' : 'research_related_badge')}</span>}</span>}
      {detail && <span className="mt-1 block text-xs text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{detail}</span>}
      <span className="mt-2 block text-xs font-bold text-teal-700 surface-green dark:text-teal-300 surface-green">{demo ? t('research_view_demo') : t('library_view_details')} <span aria-hidden="true">→</span></span>
    </span>
  </button>;
}

export const ProgramPlanner: React.FC<{ initialMuscle?: string }> = ({ initialMuscle }) => {
  useWorkspaceEditing();
  const c = useCopy();
  const { t, language } = useLanguage();
  const [selectedMuscle, setSelectedMuscle] = useInterfaceState<string | null>('library_muscle', initialMuscle && Object.hasOwn(getExerciseDatabase(language), initialMuscle) ? initialMuscle : 'Chest');
  const [selectedSubCategory, setSelectedSubCategory] = useInterfaceState<string | null>('library_subgroup', 'Upper Chest');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useInterfaceState('library_search', '');
  const [researchOnly, setResearchOnly] = useInterfaceState('library_research', false);
  const [equipmentFilter, setEquipmentFilter] = useInterfaceState<'all' | typeof categories[number]>('library_equipment', 'all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  React.useEffect(() => {
    if (initialMuscle && Object.hasOwn(getExerciseDatabase(language), initialMuscle)) {
      setSelectedMuscle(initialMuscle); setSearchQuery(''); setResearchOnly(false);
    }
  }, [initialMuscle, language, setSelectedMuscle, setSearchQuery, setResearchOnly]);

  const exerciseDB = getExerciseDatabase(language);
  const muscleList = Object.keys(exerciseDB);
  const researchNames = new Set(EXERCISE_EVIDENCE.map(entry => entry.name));
  const researchGroups = [...new Set(EXERCISE_EVIDENCE.map(entry => entry.group))];
  const query = searchQuery.trim().toLocaleLowerCase();
  const filteredExercises = query ? Object.entries(exerciseDB).flatMap(([muscle, subCats]) =>
    Object.entries(subCats).flatMap(([subgroup, groups]) => categories.flatMap(category =>
      groups[category].filter(name => name.toLocaleLowerCase().includes(query)
        && (equipmentFilter === 'all' || equipmentFilter === category)
        && (!researchOnly || researchNames.has(getEnglishExerciseName(name))))
        .map(name => ({ name, muscle, subgroup, category })))))
    : [];
  const uniqueResults = filteredExercises.filter((entry, index, all) => all.findIndex(other => other.name === entry.name) === index);
  const currentSubgroup = selectedMuscle && exerciseDB[selectedMuscle]?.[selectedSubCategory || '']
    ? selectedSubCategory : selectedMuscle ? Object.keys(exerciseDB[selectedMuscle])[0] : null;
  const currentExercises = selectedMuscle && currentSubgroup
    ? [...new Set(categories.filter(category => equipmentFilter === 'all' || equipmentFilter === category)
      .flatMap(category => exerciseDB[selectedMuscle][currentSubgroup][category]))]
      .filter(name => !researchOnly || researchNames.has(getEnglishExerciseName(name)))
    : [];

  return <div className="mx-auto min-h-screen max-w-7xl px-5 pb-32 pt-5 sm:px-8 lg:pt-10">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700 surface-green dark:text-teal-300 surface-green">NeuroLift / {t('nav_planner')}</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight text-zinc-950 surface-ink dark:text-white sm:text-4xl">{t('planner_title')}</h2>
        <p className="mt-2 text-sm text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{t('planner_desc')}</p></div>
      <p className="rounded-full border border-zinc-200 surface-border bg-zinc-50 surface-paper px-3 py-1.5 text-xs font-bold text-zinc-700 surface-ink dark:border-zinc-800 surface-border dark:bg-zinc-900 surface-paper dark:text-zinc-300 surface-ink">{Object.keys(demos).length} {t('library_demonstrations')}</p>
    </div>

    <div className={`${'web-library-toolbar '}mb-6 flex flex-col gap-3 rounded-2xl surface-rounded border border-zinc-200 surface-border bg-zinc-50 surface-paper p-3 sm:flex-row sm:items-center dark:border-zinc-800 surface-border dark:bg-zinc-900/50 surface-paper`}>
      {<button className="web-secondary web-mobile-filters" onClick={() => setFiltersOpen(true)}>{t('picker_muscle_group')} · {selectedMuscle ? getLocalizedMuscleName(selectedMuscle, language) : t('picker_all_filter')}</button>}
      <div className="relative min-w-0 flex-1">
        <svg className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 surface-muted surface-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="search" aria-label={t('planner_search_placeholder')} placeholder={t('planner_search_placeholder')}
          value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
          className="w-full rounded-xl border border-zinc-300 surface-border bg-white py-3 pe-4 ps-11 text-sm text-zinc-950 surface-ink placeholder:text-zinc-500 surface-ink focus:border-teal-500 focus:outline-none dark:border-zinc-700 surface-border dark:bg-zinc-950 surface-paper dark:text-white" />
      </div>
      <div className="flex gap-2" role="group" aria-label={t('planner_title')}>
        <button type="button" aria-pressed={!researchOnly} onClick={() => { setResearchOnly(false); if (!selectedMuscle && !query) { setSelectedMuscle('Chest'); setSelectedSubCategory('Upper Chest'); } }}
          className={`min-h-11 rounded-xl border px-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${!researchOnly ? 'border-teal-600 bg-teal-600 surface-accent text-white surface-ink dark:border-teal-400 dark:bg-teal-400 surface-accent dark:text-zinc-950 surface-ink' : 'border-zinc-300 surface-border bg-white text-zinc-700 surface-ink dark:border-zinc-700 surface-border dark:bg-zinc-950 surface-paper dark:text-zinc-200 surface-ink'}`}>{t('picker_all_filter')}</button>
        <button type="button" aria-pressed={researchOnly} onClick={() => { setResearchOnly(true); if (!query) setSelectedMuscle(null); }}
          className={`min-h-11 rounded-xl border px-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${researchOnly ? 'border-teal-600 bg-teal-600 surface-accent text-white surface-ink dark:border-teal-400 dark:bg-teal-400 surface-accent dark:text-zinc-950 surface-ink' : 'border-zinc-300 surface-border bg-white text-zinc-700 surface-ink dark:border-zinc-700 surface-border dark:bg-zinc-950 surface-paper dark:text-zinc-200 surface-ink'}`}>{(c('research_supported'))}</button>
      </div>
    </div>

    <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('library_equipment_filter')}>
      {(['all', ...categories] as const).map(equipment => {
        const label = equipment === 'all' ? t('library_all_equipment') : t(`cat_${equipment}` as Parameters<typeof t>[0]);
        const active = equipmentFilter === equipment;
        return <button key={equipment} type="button" aria-pressed={active} onClick={() => setEquipmentFilter(equipment)}
          className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${active ? 'border-teal-600 bg-teal-600 surface-accent text-white surface-ink dark:border-teal-400 dark:bg-teal-400 surface-accent dark:text-zinc-950 surface-ink' : 'border-zinc-200 surface-border bg-white text-zinc-700 surface-ink hover:border-teal-500 dark:border-zinc-800 surface-border dark:bg-zinc-900 surface-paper dark:text-zinc-200 surface-ink'}`}>
          {label}
        </button>;
      })}
    </div>

    {<p className="web-library-context" role="status">{query ? `${uniqueResults.length} ${t('library_results')}` : selectedMuscle && currentSubgroup ? `${getLocalizedMuscleName(selectedMuscle, language)} / ${getLocalizedMuscleName(currentSubgroup, language)}` : t('research_picks_title')}{query && <button onClick={() => setSearchQuery('')}>{c('clear_search')}</button>}</p>}
    {researchOnly && <WebResearchNote />}
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className={`${'web-library-muscles '}flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:h-fit lg:flex-col lg:overflow-visible`} aria-label={t('picker_muscle_group')}>
        {muscleList.map(muscle => <button type="button" key={muscle} aria-pressed={selectedMuscle === muscle && !query}
          onClick={() => { setSelectedMuscle(muscle); setSelectedSubCategory(Object.keys(exerciseDB[muscle])[0]); setSearchQuery(''); }}
          className={`min-h-11 shrink-0 rounded-xl border px-4 py-2 text-start text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${selectedMuscle === muscle && !query ? 'border-teal-600 bg-teal-600 surface-accent text-white surface-ink dark:border-teal-400 dark:bg-teal-400 surface-accent dark:text-zinc-950 surface-ink' : 'border-zinc-200 surface-border bg-white text-zinc-700 surface-ink hover:border-teal-500 dark:border-zinc-800 surface-border dark:bg-zinc-900/50 surface-paper dark:text-zinc-200 surface-ink'}`}>{getLocalizedMuscleName(muscle, language)}</button>)}
      </nav>

      <div className="min-w-0 space-y-6">
        {query ? <section>
          <h3 className="mb-4 text-xl font-black text-zinc-950 surface-ink dark:text-white">{uniqueResults.length} {t('library_results')}</h3>
          {uniqueResults.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{uniqueResults.map(result => <LibraryCard key={result.name} name={result.name}
            detail={`${getLocalizedMuscleName(result.muscle, language)} · ${getLocalizedMuscleName(result.subgroup, language)}`} onOpen={() => setSelectedExercise(result.name)} />)}</div>
            : <p className="rounded-2xl surface-rounded border border-zinc-200 surface-border bg-white p-6 text-sm text-zinc-600 surface-muted surface-ink dark:border-zinc-800 surface-border dark:bg-zinc-900 surface-paper dark:text-zinc-300 surface-ink">{t('library_no_results')}</p>}
        </section> : researchOnly && !selectedMuscle ? <section className="space-y-6">
          <div><h3 className="text-2xl font-black text-zinc-950 surface-ink dark:text-white">{t('research_picks_title')}</h3><p className="mt-1 text-sm text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{t('research_picks_note')}</p></div>
          {researchGroups.map(group => <div key={group}><h4 className="mb-3 text-lg font-bold text-zinc-900 surface-ink dark:text-white">{getLocalizedMuscleName(group, language)}</h4><ExerciseEvidenceHighlights group={group} onViewDemo={setSelectedExercise} /></div>)}
        </section> : selectedMuscle && currentSubgroup ? <section className="space-y-5">
          <div><h3 className="text-2xl font-black text-zinc-950 surface-ink dark:text-white">{getLocalizedMuscleName(selectedMuscle, language)}</h3>
            <p className="mt-1 text-sm text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{t('picker_muscle_area')}</p></div>
          <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('picker_muscle_area')}>
            {Object.keys(exerciseDB[selectedMuscle]).map(subgroup => <button type="button" key={subgroup} aria-pressed={currentSubgroup === subgroup} onClick={() => setSelectedSubCategory(subgroup)}
              className={`min-h-10 shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${currentSubgroup === subgroup ? 'border-teal-500 bg-teal-500/15 surface-accent text-teal-800 surface-green dark:text-teal-200 surface-green' : 'border-zinc-200 surface-border bg-white text-zinc-700 surface-ink dark:border-zinc-800 surface-border dark:bg-zinc-900 surface-paper dark:text-zinc-200 surface-ink'}`}>{getLocalizedMuscleName(subgroup, language)}</button>)}
          </div>
          <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-black uppercase tracking-widest text-zinc-700 surface-ink dark:text-zinc-300 surface-ink">{t('full_library_title')}</h4><span className="text-xs font-semibold text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{currentExercises.length} {t('library_results')}</span></div>
          {currentExercises.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{currentExercises.map(name => <LibraryCard key={name} name={name} onOpen={() => setSelectedExercise(name)} />)}</div>
            : <p className="rounded-2xl surface-rounded border border-zinc-200 surface-border bg-white p-6 text-sm text-zinc-600 surface-muted surface-ink dark:border-zinc-800 surface-border dark:bg-zinc-900 surface-paper dark:text-zinc-300 surface-ink">{t('picker_no_research')}</p>}
          <ExerciseEvidenceHighlights group={selectedMuscle} onViewDemo={setSelectedExercise} />
        </section> : null}
      </div>
    </div>

    <details className="mt-10 rounded-2xl surface-rounded border border-zinc-200 surface-border bg-zinc-50 surface-paper dark:border-zinc-800 surface-border dark:bg-zinc-900/40 surface-paper">
      <summary className="cursor-pointer p-5 text-sm font-bold text-zinc-900 surface-ink marker:text-teal-600 surface-green dark:text-white">{t('library_guidance')}</summary>
      <TrainingGuidance />
    </details>

    <Modal isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} label={t('picker_muscle_group')} sheet>
      <div className="web-more-panel"><h2>{t('picker_muscle_group')}</h2><ExerciseGroupSelector database={exerciseDB} stacked muscle={selectedMuscle || 'Chest'} subgroup={currentSubgroup || ''} onMuscleChange={value => { setSelectedMuscle(value); setSearchQuery(''); }} onSubgroupChange={setSelectedSubCategory} /><button className="web-primary" onClick={() => setFiltersOpen(false)}>{c('show_exercises')}</button></div>
    </Modal>
    <Modal isOpen={!!selectedExercise} onClose={() => setSelectedExercise(null)}>
      {selectedExercise && <div className="relative mx-auto w-full max-w-2xl rounded-3xl surface-rounded border border-zinc-200 surface-border bg-white p-6 shadow-2xl surface-flat dark:border-zinc-800 surface-border dark:bg-zinc-950 surface-paper sm:p-8">
        <button type="button" onClick={() => setSelectedExercise(null)} aria-label={t('modal_close')}
          className="absolute end-5 top-5 rounded-lg p-2 text-zinc-600 surface-muted surface-ink hover:bg-zinc-100 surface-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 dark:text-zinc-300 surface-ink dark:hover:bg-zinc-800 surface-paper">✕</button>
        <h3 className="pe-10 text-2xl font-black text-zinc-950 surface-ink dark:text-white">{getExerciseTranslation(selectedExercise, language)}</h3>
        <ExerciseDemo name={selectedExercise} />
        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedExercise + ' exercise tutorial short')}`} target="_blank" rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-xl border border-zinc-300 surface-border px-4 py-2 text-sm font-bold text-zinc-900 surface-ink hover:border-teal-500 dark:border-zinc-700 surface-border dark:text-white">{t('modal_watch_video')} ↗</a>
      </div>}
    </Modal>
  </div>;
};
