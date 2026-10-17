import { useCopy } from '../../hooks/useCopy';
import React, { useEffect, useRef, useState } from 'react';
import { hasSetEffort } from '../../utils/workoutValidation';
import { ActiveExercise, ExerciseHistory } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { getExerciseTranslation } from '../../utils/exerciseData';
import { useInterfaceState } from '../../hooks/useInterfaceState';

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
  quickLoad: (index: number, name: string, setIndex?: number) => void;
  plates: (exercise: number, set: number) => void;
  edit: () => void;
  reorder: () => void;
  finish: () => void;
  reset: () => void;
}

export function WebSession(p: Props) {
  const { t, language } = useLanguage();
  const c = useCopy();
  const [selected, setSelected] = useInterfaceState<string | null>('session_exercise', null);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const index = Math.max(0, p.exercises.findIndex(e => e.name === selected));
  const exercise = p.exercises[index];
  const completed = p.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
  const total = p.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const previous = exercise && p.history.get(exercise.name);
  const sessionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number; axis: 'pending' | 'horizontal' | 'vertical' } | null>(null);
  const sliding = useRef(false);
  const suppressClickUntil = useRef(0);
  const slideAnimation = useRef<Animation | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; slideAnimation.current?.cancel(); };
  }, []);
  const animateCard = async (from: number, to: number, duration: number) => {
    const card = cardRef.current;
    if (!card) return;
    slideAnimation.current?.cancel();
    card.style.transform = `translateX(${to}px)`;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = card.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration, easing: 'cubic-bezier(.22,.61,.36,1)' });
    slideAnimation.current = animation;
    await animation.finished.catch(() => undefined);
  };
  const returnCard = async () => {
    const card = cardRef.current;
    if (!card || sliding.current) return;
    const offset = new DOMMatrixReadOnly(getComputedStyle(card).transform).m41;
    if (Math.abs(offset) < 0.5) return;
    sliding.current = true;
    await animateCard(offset, 0, 160);
    sliding.current = false;
  };
  const closeMenus = () => sessionRef.current?.querySelectorAll('.web-set-menu[open]').forEach(menu => menu.removeAttribute('open'));
  useEffect(() => {
    const outside = (event: PointerEvent) => sessionRef.current?.querySelectorAll('.web-set-menu[open]').forEach(menu => {
      if (!menu.contains(event.target as Node)) menu.removeAttribute('open');
    });
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeMenus(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  const switchExercise = async (next: number) => {
    if (sliding.current) return;
    if (next < 0 || next >= p.exercises.length || next === index) { void returnCard(); return; }
    sliding.current = true;
    closeMenus();
    // Keep the editor's footprint so shorter exercises cannot clamp the page's scroll.
    // Never scrollIntoView here: switching should leave the user's viewport in place.
    const card = cardRef.current;
    if (card) {
      card.style.minHeight = `${card.getBoundingClientRect().height}px`;
      const direction = (next > index ? 1 : -1) * (language === 'ar' ? -1 : 1);
      const width = card.offsetWidth + 24;
      const offset = new DOMMatrixReadOnly(getComputedStyle(card).transform).m41;
      await animateCard(offset, -direction * width, 160);
      if (!mounted.current) return;
      setSelected(p.exercises[next].name);
      await animateCard(direction * width, 0, 200);
    } else {
      setSelected(p.exercises[next].name);
    }
    sliding.current = false;
  };
  const exerciseNavigation = <div className="web-exercise-paging" role="group" aria-label={c('switch_exercise')}>
    <button className="web-secondary" disabled={index === 0} onClick={() => switchExercise(index - 1)}>{c('previous')}</button>
    <span aria-live="polite">{index + 1} / {p.exercises.length}</span>
    <button className="web-secondary" disabled={index === p.exercises.length - 1} onClick={() => switchExercise(index + 1)}>{c('next')}</button>
  </div>;
  return <section className="web-session" ref={sessionRef}>
    <header className="web-session-header"><div><p className="web-eyebrow">{c('session_in_progress')}</p><h1>{t('nav_workout')}</h1><p role="status">{completed} / {total} {c('sets_completed')}</p></div><div className="web-session-clock"><strong>{p.duration}</strong><button className="web-secondary" onClick={p.pause}>{p.running ? c('pause_timer') : c('resume_timer')}</button></div></header>
    <progress max={Math.max(total, 1)} value={completed} aria-label={c('session_progress')} />
    <div className="web-session-layout">
      <nav className="web-session-exercises" aria-label={c('session_exercises')}>
        {p.exercises.map((e, i) => <button key={e.name} aria-current={index === i ? 'step' : undefined} onClick={() => switchExercise(i)}><span>{String(i + 1).padStart(2, '0')}</span><span><strong>{getExerciseTranslation(e.name, language)}</strong><small>{e.sets.filter(s => s.completed).length} / {e.sets.length} {t('tracker_sets_count')}</small></span></button>)}
        <button className="web-secondary" onClick={p.edit}>+ {t('tracker_add_exercises')}</button>
        <button className="web-text-button" onClick={p.reorder}>{t('tracker_reorder_mode')}</button>
      </nav>
      <div>
        <aside className="web-rest-bar" aria-label={t('tracker_resting')}>
          <span>{p.rest !== null && p.rest > 0 ? <><strong>{p.rest}s</strong> {t('tracker_resting')}</> : c('ready_for_your_next_set')}</span>
          {p.rest !== null && p.rest > 0 && <div><button onClick={p.addRest}>+30s</button><button onClick={p.skipRest}>{t('tracker_skip_rest')}</button></div>}
        </aside>
        <div className="web-exercise-swipe-viewport">
        {exercise ? <article className="web-panel web-set-editor" ref={cardRef}
          onClickCapture={event => {
            // A horizontal gesture over a control must not also activate it on release.
            if (event.detail !== 0 && Date.now() < suppressClickUntil.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressClickUntil.current = 0;
            }
          }}
          onTouchStart={event => {
            touchStart.current = null;
            suppressClickUntil.current = 0;
            if (sliding.current) return;
            if (event.touches.length !== 1) { void returnCard(); return; }
            // Track intent across the entire card, including set fields and controls.
            // Ordinary taps still reach the input/button; only horizontal drags are swipes.
            touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY, axis: 'pending' };
          }}
          onTouchMove={event => {
            const start = touchStart.current;
            if (!start || sliding.current) return;
            if (event.touches.length !== 1) { touchStart.current = null; void returnCard(); return; }
            const dx = event.touches[0].clientX - start.x;
            const dy = event.touches[0].clientY - start.y;
            if (start.axis === 'pending' && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
              start.axis = Math.abs(dx) > Math.abs(dy) * 1.5 ? 'horizontal' : 'vertical';
            }
            if (start.axis !== 'horizontal') return;
            suppressClickUntil.current = Date.now() + 700;
            closeMenus();
            const next = index + (dx < 0 ? 1 : -1) * (language === 'ar' ? -1 : 1);
            const offset = next < 0 || next >= p.exercises.length ? dx * 0.2 : dx;
            if (cardRef.current) cardRef.current.style.transform = `translateX(${offset}px)`;
          }}
          onTouchCancel={() => { touchStart.current = null; void returnCard(); }}
          onTouchEnd={event => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start || !event.changedTouches.length) return;
            const dx = event.changedTouches[0].clientX - start.x;
            const dy = event.changedTouches[0].clientY - start.y;
            if (start.axis === 'horizontal') suppressClickUntil.current = Date.now() + 700;
            if (start.axis === 'vertical' || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) { void returnCard(); return; }
            void switchExercise(index + (dx < 0 ? 1 : -1) * (language === 'ar' ? -1 : 1));
          }}>
          {exerciseNavigation}
          <div className="web-section-heading"><div><h2>{getExerciseTranslation(exercise.name, language)}</h2>{exercise.targetReps && <p className="mt-1 text-sm text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">{t('tracker_target_reps')}: {exercise.targetReps}</p>}</div><button className="web-secondary" onClick={() => p.demo(exercise.name)}>{t('library_view_details')}</button></div>
          <details className="web-previous-disclosure" key={exercise.name}>
            <summary>{c('previous_session')}</summary>
            <div className="web-previous-content">
              {previous ? <>
                <time dateTime={previous.lastPerformed}>{new Date(previous.lastPerformed).toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                <ol>{previous.lastSets.map((set, i) => <li key={i}>{t('tracker_header_set')} {i + 1}: {set.durationSeconds ? `${set.durationSeconds}s` : `${set.weight} kg × ${set.reps}`}</li>)}</ol>
                {previous.lastSets.some(s => s.reps > 0 && !s.durationSeconds) && exercise.sets.every(s => !s.weight && !s.reps && !s.completed) && <button className="web-secondary" onClick={() => p.quickLoad(index, exercise.name)}>{c('use_previous_values')}</button>}
              </> : <p>{c('no_previous_completed_sets_for_this_exercise')}</p>}
            </div>
          </details>
          <p className="web-small">{c('enter_reps_then_mark_the_set_done_weight_is_optional_for_bodyweight_ex')}</p>
          <div className="web-set-labels" aria-hidden="true"><span>{t('tracker_header_set')}</span><span>{t('tracker_header_kg')}</span><span>{t('tracker_header_reps')}</span><span>{t('tracker_header_check')}</span><span /></div>
          {exercise.sets.map((set, i) => <div className="web-set-row" data-completed={set.completed} key={set.id}>
            <span className="web-set-number">{i + 1}</span>
            <label><span className="sr-only">{t('tracker_header_kg')} — {t('tracker_header_set')} {i + 1}</span><input type="number" inputMode="decimal" min="0" step="0.5" value={set.weight || ''} placeholder="0" onChange={e => p.update(index, i, 'weight', e.target.value)} /></label>
            <label><span className="sr-only">{t('tracker_header_reps')} — {t('tracker_header_set')} {i + 1}</span><input type="number" inputMode="numeric" min="0" step="1" value={set.reps || ''} placeholder="0" onChange={e => p.update(index, i, 'reps', e.target.value)} /></label>
            <button disabled={!set.completed && !hasSetEffort(set)} aria-pressed={set.completed} aria-label={`${t('tracker_header_check')} — ${t('tracker_header_set')} ${i + 1}`} onClick={() => p.complete(index, i)}>{set.completed ? '✓' : '○'}</button>
            <details className="web-set-menu"><summary onClick={event => {
              sessionRef.current?.querySelectorAll('.web-set-menu[open]').forEach(menu => { if (menu !== event.currentTarget.parentElement) menu.removeAttribute('open'); });
            }} aria-label={c('set_value_options', i + 1)}>⋯</summary><div onClick={closeMenus}><button onClick={() => p.plates(index, i)}>{t('tracker_plate_calc_title')}</button><button onClick={() => p.remove(index, i)}>{c('remove_set')}</button></div></details>
            {previous && <div className="web-set-reference">
              <span>{c('previous')}: {previous.lastSets[i] ? (previous.lastSets[i].durationSeconds ? `${previous.lastSets[i].durationSeconds}s` : `${previous.lastSets[i].weight} kg × ${previous.lastSets[i].reps}`) : c('no_matching_set')}</span>
              {previous.lastSets[i]?.reps > 0 && !previous.lastSets[i]?.durationSeconds && !set.completed && !set.weight && !set.reps && <button type="button" className="web-text-button" aria-label={c('use_previous_values_for_set_value', i + 1)} onClick={() => p.quickLoad(index, exercise.name, i)}>{c('use_previous')}</button>}
            </div>}
          </div>)}
          <button className="web-text-button" onClick={() => p.add(index)}>+ {t('tracker_add_set')}</button>
          <button className="web-remove-exercise" onClick={() => p.deleteExercise(index)}>{t('tracker_delete_exercise')}</button>
          {exerciseNavigation}
        </article> : <div className="web-panel"><p>{c('add_an_exercise_to_begin')}</p><button className="web-primary" onClick={p.edit}>{t('tracker_add_exercises')}</button></div>}
        </div>
      </div>
    </div>
    <footer className="web-session-actions"><button className="web-secondary" onClick={p.reset}>{c('reset_session')}</button>{confirmFinish ? <div role="group" aria-label={t('tracker_finish')}><p>{c('finish_now_only_completed_sets_count_toward_training_volume')}</p><button className="web-secondary" onClick={() => setConfirmFinish(false)}>{t('tracker_cancel')}</button><button className="web-primary" onClick={p.finish}>{t('tracker_finish')}</button></div> : <button className="web-primary" disabled={!completed} onClick={() => setConfirmFinish(true)}>{t('tracker_finish')} ↗</button>}</footer>
  </section>;
}
