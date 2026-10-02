import React from 'react';
import { getExerciseTranslation } from '../../utils/exerciseData';
import { getResearchExercisesForGroup } from '../../utils/exerciseEvidence';
import { useLanguage } from '../../contexts/LanguageContext';

export function ExerciseEvidenceHighlights({
 group, onViewDemo,
}: { group: string; onViewDemo: (name: string) => void }) {
 const { language, t } = useLanguage();
 const headingId = React.useId();
 const entries = getResearchExercisesForGroup(group);
 return <section className="rounded-3xl border border-teal-200 dark:border-teal-900/70 bg-teal-50/60 dark:bg-teal-950/20 p-5 sm:p-6" aria-labelledby={headingId}>
  <div className="mb-4">
   <h4 id={headingId} className="text-sm font-black uppercase tracking-wide text-teal-900 dark:text-teal-200">{t('research_picks_title')}</h4>
   <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{t('research_picks_note')}</p>
  </div>
  {entries.length === 0 ? <p className="rounded-2xl bg-white/70 dark:bg-zinc-900/60 p-4 text-sm text-zinc-600 dark:text-zinc-400">{t('research_empty')}</p> :
   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {entries.map(item => <article key={item.name} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{getExerciseTranslation(item.name, language)}</h5>
      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.level === 'direct' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200'}`}>
       {t(item.level === 'direct' ? 'research_direct_badge' : 'research_related_badge')}
      </span>
     </div>
     <p className="mt-2 text-xs font-semibold text-teal-800 dark:text-teal-300">{t(item.targetKey as Parameters<typeof t>[0])}</p>
     <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{t(item.summaryKey as Parameters<typeof t>[0])}</p>
     <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
      <a className="break-words text-teal-800 dark:text-teal-300 underline underline-offset-2" href={item.source} target="_blank" rel="noreferrer">{t('research_read_study')}: {item.sourceTitle}</a>
      <button type="button" className="text-zinc-700 dark:text-zinc-200 underline underline-offset-2" onClick={() => onViewDemo(item.name)}>{t('research_view_demo')}</button>
     </div>
    </article>)}
   </div>}
 </section>;
}
