import React from 'react';
import { ExerciseDatabase } from '../../types';
import { getLocalizedMuscleName } from '../../utils/exerciseData';
import { useLanguage } from '../../contexts/LanguageContext';

export function ExerciseGroupSelector({
  database, muscle, subgroup, onMuscleChange, onSubgroupChange, stacked = false,
}: {
  database: ExerciseDatabase;
  muscle: string;
  subgroup: string;
  onMuscleChange: (muscle: string) => void;
  onSubgroupChange: (subgroup: string) => void;
  stacked?: boolean;
}) {
  const { language, t } = useLanguage();
  const groups = Object.keys(database);
  const currentMuscle = database[muscle] ? muscle : groups[0];
  const subgroups = Object.keys(database[currentMuscle] || {});
  const currentSubgroup = database[currentMuscle]?.[subgroup] ? subgroup : subgroups[0];

  return <nav className="exercise-group-selector space-y-4" aria-label={t('picker_browse_label')}>
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400 surface-muted surface-ink">{t('picker_muscle_group')}</p>
      <div className={`flex gap-2 overflow-x-auto pb-2 custom-scrollbar ${stacked ? 'lg:grid lg:grid-cols-2 lg:overflow-visible' : ''}`} role="group" aria-label={t('picker_muscle_group')}>
        {groups.map(group => <button key={group} type="button" aria-pressed={currentMuscle === group}
          onClick={() => onMuscleChange(group)}
          className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${currentMuscle === group ? 'border-teal-500 bg-teal-500/15 surface-accent text-teal-800 surface-green dark:text-teal-200 surface-green' : 'border-zinc-200 surface-border bg-zinc-50 surface-paper text-zinc-700 surface-ink hover:border-zinc-400 surface-border dark:border-zinc-700 surface-border dark:bg-zinc-900 surface-paper dark:text-zinc-300 surface-ink dark:hover:border-zinc-500 surface-border'}`}>
          {getLocalizedMuscleName(group, language)}
        </button>)}
      </div>
    </div>
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400 surface-muted surface-ink">{t('picker_muscle_area')}</p>
      <div className={`flex gap-2 overflow-x-auto pb-2 custom-scrollbar ${stacked ? 'lg:grid lg:grid-cols-2 lg:overflow-visible' : ''}`} role="group" aria-label={t('picker_muscle_area')}>
        {subgroups.map(area => <button key={area} type="button" aria-pressed={currentSubgroup === area}
          onClick={() => onSubgroupChange(area)}
          className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${currentSubgroup === area ? 'border-teal-500 bg-teal-500/15 surface-accent text-teal-800 surface-green dark:text-teal-200 surface-green' : 'border-zinc-200 surface-border bg-zinc-50 surface-paper text-zinc-700 surface-ink hover:border-zinc-400 surface-border dark:border-zinc-700 surface-border dark:bg-zinc-900 surface-paper dark:text-zinc-300 surface-ink dark:hover:border-zinc-500 surface-border'}`}>
          {getLocalizedMuscleName(area, language)}
        </button>)}
      </div>
    </div>
  </nav>;
}
