import React, { useState } from 'react';
import { ActiveExercise, ExerciseHistory } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getExerciseTranslation } from '../../utils/exerciseData';

interface Props {
  exercises: ActiveExercise[];
  history: Map<string, ExerciseHistory>;
  duration: string;
  running: boolean;
  rest: number | null;
  pause: () => void;
  skipRest: () => void;
  addRest: () => void;
  update: (exercise: number, set: number, field: 'weight' | 'reps', value: string) => void;
  complete: (exercise: number, set: number) => void;
  add: (exercise: number) => void;
  remove: (exercise: number, set: number) => void;
  demo: (name: string) => void;
  deleteExercise: (index: number) => void;
  quickLoad: (index: number, name: string) => void;
  plates: (exercise: number, set: number) => void;
  edit: () => void;
  reorder: () => void;
  finish: () => void;
  reset: () => void;
}

export function WebSession(p: Props) {
  const { t, language } = useLanguage();
  const c = (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const index = Math.max(0, p.exercises.findIndex(e => e.name === selected));
  const exercise = p.exercises[index];
  const completed = p.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
  const total = p.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const previous = exercise && p.history.get(exercise.name);
  return <section className="web-session">
    <header className="web-session-header"><div><p className="web-eyebrow">{c('SESSION IN PROGRESS', 'SÉANCE EN COURS', 'الحصة جارية')}</p><h1>{t('nav_workout')}</h1><p role="status">{completed} / {total} {c('sets completed', 'séries terminées', 'مجموعات مكتملة')}</p></div><div className="web-session-clock"><strong>{p.duration}</strong><button className="web-secondary" onClick={p.pause}>{p.running ? c('Pause timer', 'Pause chrono', 'أوقف المؤقت مؤقتاً') : c('Resume timer', 'Reprendre le chrono', 'استأنف المؤقت')}</button></div></header>
    <progress max={Math.max(total, 1)} value={completed} aria-label={c('Session progress', 'Progression de la séance', 'تقدم الحصة')} />
    <div className="web-session-layout">
      <nav className="web-session-exercises" aria-label={c('Session exercises', 'Exercices de la séance', 'تمارين الحصة')}>
        {p.exercises.map((e, i) => <button key={e.name} aria-current={index === i ? 'step' : undefined} onClick={() => setSelected(e.name)}><span>{String(i + 1).padStart(2, '0')}</span><span><strong>{getExerciseTranslation(e.name, language)}</strong><small>{e.sets.filter(s => s.completed).length} / {e.sets.length} {t('tracker_sets_count')}</small></span></button>)}
        <button className="web-secondary" onClick={p.edit}>+ {t('tracker_add_exercises')}</button>
        <button className="web-text-button" onClick={p.reorder}>{t('tracker_reorder_mode')}</button>
      </nav>
      <div>
        <aside className="web-rest-bar" aria-label={t('tracker_resting')}>
          <span>{p.rest !== null && p.rest > 0 ? <><strong>{p.rest}s</strong> {t('tracker_resting')}</> : c('Ready for your next set', 'Prêt pour la prochaine série', 'جاهز للمجموعة التالية')}</span>
          {p.rest !== null && p.rest > 0 && <div><button onClick={p.addRest}>+30s</button><button onClick={p.skipRest}>{t('tracker_skip_rest')}</button></div>}
        </aside>
        {exercise ? <article className="web-panel web-set-editor" key={exercise.name}>
          <div className="web-section-heading"><h2>{getExerciseTranslation(exercise.name, language)}</h2><button className="web-secondary" onClick={() => p.demo(exercise.name)}>{t('library_view_details')}</button></div>
          <div className="web-previous"><div><strong>{t('tracker_last_session')}</strong><p>{previous ? previous.lastSets.map(s => `${s.weight} kg × ${s.reps}`).join(' · ') : c('No previous completed sets for this exercise.', 'Aucune série terminée pour cet exercice.', 'لا توجد مجموعات مكتملة سابقة لهذا التمرين.')}</p></div>{previous && exercise.sets.every(s => !s.weight && !s.reps && !s.completed) && <button className="web-secondary" onClick={() => p.quickLoad(index, exercise.name)}>{t('tracker_quick_load')}</button>}</div>
          <div className="web-set-labels" aria-hidden="true"><span>{t('tracker_header_set')}</span><span>{t('tracker_header_kg')}</span><span>{t('tracker_header_reps')}</span><span>{t('tracker_header_check')}</span><span /></div>
          {exercise.sets.map((set, i) => <div className="web-set-row" data-completed={set.completed} key={set.id}>
            <span className="web-set-number">{i + 1}</span>
            <label><span className="sr-only">{t('tracker_header_kg')} — {t('tracker_header_set')} {i + 1}</span><input type="number" inputMode="decimal" min="0" step="0.5" value={set.weight || ''} placeholder="0" onChange={e => p.update(index, i, 'weight', e.target.value)} /></label>
            <label><span className="sr-only">{t('tracker_header_reps')} — {t('tracker_header_set')} {i + 1}</span><input type="number" inputMode="numeric" min="0" step="1" value={set.reps || ''} placeholder="0" onChange={e => p.update(index, i, 'reps', e.target.value)} /></label>
            <button aria-pressed={set.completed} aria-label={`${t('tracker_header_check')} — ${t('tracker_header_set')} ${i + 1}`} onClick={() => p.complete(index, i)}>{set.completed ? '✓' : '○'}</button>
            <details className="web-set-menu"><summary aria-label={c(`Set ${i + 1} options`, `Options série ${i + 1}`, `خيارات المجموعة ${i + 1}`)}>⋯</summary><div><button onClick={() => p.plates(index, i)}>{t('tracker_plate_calc_title')}</button><button onClick={() => p.remove(index, i)}>{c('Remove set', 'Supprimer la série', 'احذف المجموعة')}</button></div></details>
          </div>)}
          <button className="web-text-button" onClick={() => p.add(index)}>+ {t('tracker_add_set')}</button>
          <button className="web-remove-exercise" onClick={() => p.deleteExercise(index)}>{t('tracker_delete_exercise')}</button>
        </article> : <div className="web-panel"><p>{c('Add an exercise to begin.', 'Ajoutez un exercice pour commencer.', 'أضف تمريناً للبدء.')}</p><button className="web-primary" onClick={p.edit}>{t('tracker_add_exercises')}</button></div>}
      </div>
    </div>
    <footer className="web-session-actions"><button className="web-secondary" onClick={p.reset}>{c('Reset session', 'Réinitialiser la séance', 'إعادة ضبط الحصة')}</button>{confirmFinish ? <div role="group" aria-label={t('tracker_finish')}><p>{c('Finish now? Only completed sets count toward training volume.', 'Terminer ? Seules les séries terminées comptent dans le volume.', 'إنهاء الآن؟ تُحتسب المجموعات المكتملة فقط ضمن حجم التدريب.')}</p><button className="web-secondary" onClick={() => setConfirmFinish(false)}>{t('tracker_cancel')}</button><button className="web-primary" onClick={p.finish}>{t('tracker_finish')}</button></div> : <button className="web-primary" disabled={!completed} onClick={() => setConfirmFinish(true)}>{t('tracker_finish')} ↗</button>}</footer>
  </section>;
}
