import { useCopy } from '../../hooks/useCopy';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const KEY = 'neurolift.device-tour.v1';
type Mode = 'invite' | 'overview' | 'workout' | 'paused' | 'done';
type State = { mode: Mode; step: number };
function read(): State {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (value && ['invite', 'overview', 'workout', 'paused', 'done'].includes(value.mode))
      return { mode: value.mode, step: Math.max(0, Math.min(4, Number(value.step) || 0)) };
  } catch { /* The tour remains available without storage. */ }
  return { mode: 'invite', step: 0 };
}
const TourContext = createContext<{ state: State; save: (value: State) => void } | null>(null);
export function TourProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(read);
  const save = (value: State) => {
    setState(value);
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Never block training. */ }
  };
  useEffect(() => {
    const replay = (event: Event) => save({ mode: (event as CustomEvent).detail === 'workout' ? 'workout' : 'overview', step: 0 });
    window.addEventListener('neurolift-tour', replay);
    return () => window.removeEventListener('neurolift-tour', replay);
  }, []);
  return <TourContext.Provider value={{ state, save }}>{children}</TourContext.Provider>;
}


export function TourOverview({ view, navigate }: { view: string; navigate: (view: string) => void }) {
  const tour = useContext(TourContext);
  const c = useCopy();
  if (!tour) return null;
  const { state, save } = tour;
  if (state.mode === 'done' || (state.mode === 'workout' && view === 'tracker')) return null;
  if (state.mode !== 'overview' && view !== 'home') return null;
  const pages = [
    [c('welcome_to_neurolift'), c('build_your_workouts_log_your_sets_and_see_your_progress_one_session_at'), 'home'],
    [c('your_workout_your_choices'), c('choose_several_muscle_groups_add_exercises_then_record_the_sets_you_ac'), 'tracker'],
    [c('explore_movements'), c('filter_exercises_by_muscle_and_area_open_exercise_details_for_availabl'), 'planner'],
    [c('see_your_progress'), c('completed_workouts_appear_in_progress_review_your_sets_training_volume'), 'journal'],
    [c('make_it_yours'), c('more_contains_extra_tools_and_your_account_on_phones_use_the_settings_'), 'home'],
  ];
  const start = () => { save({ mode: 'workout', step: 0 }); navigate('tracker'); };
  if (state.mode !== 'overview') return <aside className="web-tour web-tour-invite" aria-label={c('help_tour')}>
    <div><strong>{c('welcome_find_your_way_around')}</strong><p>{c('a_quick_introduction_then_guidance_through_your_own_workout')}</p></div>
    <button className="web-secondary" onClick={() => { save({ mode: 'overview', step: 0 }); navigate('home'); }}>{c('take_a_quick_tour')}</button>
    {state.mode !== 'invite' && <button className="web-secondary" onClick={start}>{c('resume_workout_guide')}</button>}
    <button className="web-text-button" onClick={() => save({ ...state, mode: 'done' })}>{c('explore_on_my_own')}</button>
  </aside>;
  const [title, description] = pages[state.step];
  const go = (step: number) => { save({ mode: 'overview', step }); navigate(pages[step][2]); };
  return <section className="web-tour" aria-label={c('app_overview')}>
    <p className="web-eyebrow">{state.step + 1} / {pages.length}</p>
    <div aria-live="polite"><h2>{title}</h2><p>{description}</p></div>
    <div className="web-tour-actions">
      <button className="web-secondary" disabled={state.step === 0} onClick={() => go(state.step - 1)}>{c('back')}</button>
      {state.step < 4 ? <button className="web-primary" onClick={() => go(state.step + 1)}>{c('next')}</button> : <button className="web-primary" onClick={start}>{c('build_your_first_workout')}</button>}
      <button className="web-text-button" onClick={() => save({ ...state, mode: 'paused' })}>{c('skip_tour')}</button>
    </div>
  </section>;
}

export function WorkoutGuide({ phase, selected, completed }: { phase: string; selected: number; completed: number }) {
  const tour = useContext(TourContext);
  const c = useCopy();
  const [back, setBack] = useState<number | null>(null);
  useEffect(() => setBack(null), [phase, selected > 0, completed > 0]);
  if (!tour || tour.state.mode !== 'workout') return null;
  const current = phase === 'summary' ? 4 : phase === 'active' ? (completed ? 3 : 2) : phase === 'selection' ? 1 : 0;
  const step = back ?? current;
  const hints = [
    [c('choose_your_muscle_groups'), c('select_one_or_several_groups_below_then_choose_select_exercises_your_c')],
    [c('add_the_movements_you_want'), c('select_an_exercise_then_use_the_muscle_selector_to_switch_areas_or_gro')],
    [c('record_a_real_set'), c('enter_the_weight_in_kg_and_the_reps_you_performed_for_bodyweight_work_')],
    [c('rest_add_sets_finish_when_ready'), c('the_rest_timer_starts_after_a_completed_set_add_another_set_or_switch_')],
    [c('your_effort_is_saved'), c('open_progress_to_review_your_workout_sets_and_volume_you_can_replay_th')],
  ];
  return <aside className="web-tour" aria-label={c('workout_walkthrough')}>
    <p className="web-eyebrow">{step + 1} / 5</p><div aria-live="polite"><h2>{hints[step][0]}</h2><p>{hints[step][1]}</p></div>
    <div className="web-tour-actions"><button className="web-secondary" disabled={step === 0} onClick={() => setBack(step - 1)}>{c('back')}</button>
      {step < current && <button className="web-secondary" onClick={() => setBack(step + 1)}>{c('next')}</button>}
      <button className="web-text-button" onClick={() => tour.save({ mode: current === 4 ? 'done' : 'paused', step: 0 })}>{current === 4 ? c('finish_guide') : c('skip_guidance')}</button>
    </div>
  </aside>;
}
