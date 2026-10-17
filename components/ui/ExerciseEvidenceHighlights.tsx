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
 return <section className="rounded-3xl surface-rounded border border-teal-200 dark:border-teal-900/70 bg-teal-50/60 surface-accent dark:bg-teal-950/20 surface-accent p-5 sm:p-6" aria-labelledby={headingId}>
  <div className="mb-4">
   <h4 id={headingId} className="text-sm font-black uppercase tracking-wide text-teal-900 surface-green dark:text-teal-200 surface-green">{t('research_picks_title')}</h4>
   <p className="mt-1 text-xs text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{t('research_picks_note')}</p>
  </div>
  {entries.length === 0 ? <p className="rounded-2xl surface-rounded bg-white/70 dark:bg-zinc-900/60 surface-paper p-4 text-sm text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{t('research_empty')}</p> :
   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {entries.map(item => <article key={item.name} className="rounded-2xl surface-rounded border border-zinc-200 surface-border dark:border-zinc-800 surface-border bg-white dark:bg-zinc-900/80 surface-paper p-4">
     <div className="flex flex-wrap items-start justify-between gap-2">
      <h5 className="font-bold text-sm text-zinc-900 surface-ink dark:text-zinc-100 surface-ink">{getExerciseTranslation(item.name, language)}</h5>
      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.level === 'direct' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200'}`}>
       {t(item.level === 'direct' ? 'research_direct_badge' : 'research_related_badge')}
      </span>
     </div>
     <p className="mt-2 text-xs font-semibold text-teal-800 surface-green dark:text-teal-300 surface-green">{t(item.targetKey as Parameters<typeof t>[0])}</p>
     <p className="mt-2 text-sm leading-relaxed text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{t(item.summaryKey as Parameters<typeof t>[0])}</p>
     <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
      <a className="break-words text-teal-800 surface-green dark:text-teal-300 surface-green underline underline-offset-2" href={item.source} target="_blank" rel="noreferrer">{t('research_read_study')}: {item.sourceTitle}</a>
      <button type="button" className="text-zinc-700 surface-ink dark:text-zinc-200 surface-ink underline underline-offset-2" onClick={() => onViewDemo(item.name)}>{t('research_view_demo')}</button>
     </div>
    </article>)}
   </div>}
 </section>;
}
