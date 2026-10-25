import { useCopy } from '../../hooks/useCopy';
import { usePersistenceAction } from '../../hooks/usePersistenceAction';
import React from 'react';
import { Navbar } from '../Navbar';
import { useLanguage } from '../../contexts/LanguageContext';
import { safeStorage } from '../../utils/storage';
import { CompletedWorkout, WorkoutTemplate } from '../../types';
import { findNextScheduledWorkout, WeeklyWorkoutSchedule } from '../../utils/workoutSchedule';
import { TRAINING_SOURCES } from '../../utils/trainingEvidence';
import './website.css';
import { WebStatus } from './WebStatus';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { Modal } from '../ui/Modal';
import { TourOverview } from './GuidedTour';

type Navigation = { currentView: string; setCurrentView: (view: string) => void };
const paths: Record<string, string> = {
  home: 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
  tracker: 'M3 8v8m4-11v14m10-14v14m4-11v8M7 12h10',
  planner: 'M4 4h7v7H4zM14 4h7v7h-7zM4 14h7v7H4zM14 14h7v7h-7z',
  journal: 'M4 20V4m0 16h17M8 15l4-5 4 2 5-7',
  clock: 'M9 2h6M12 6v7l4 2M20 14a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  nutrition: 'M12 21C2 18 1 9 5 6c2-2 5-1 7 0 2-1 5-2 7 0 4 3 3 12-7 15ZM12 6V2m0 3 4-3',
  account: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-3a8 8 0 0 1 16 0v3',
};
function Icon({ name }: { name: string }) {
  return <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.home} /></svg>;
}

export function WebFrame({ currentView, setCurrentView, children }: Navigation & { children: React.ReactNode }) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [nativeVersion, setNativeVersion] = React.useState('');
  React.useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    let mounted = true;
    NativeApp.getInfo().then(info => {
      if (mounted) setNativeVersion(`${info.version} (${info.build})`);
    }).catch(() => { /* Version info is optional; navigation must still work. */ });
    return () => { mounted = false; };
  }, []);
  const { t, dir } = useLanguage();
  const c = useCopy();
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  const navigation = React.useRef<HTMLElement>(null);
  const header = React.useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(60);
  React.useEffect(() => {
    const measure = () => setHeaderHeight(header.current?.getBoundingClientRect().height || 60);
    const observer = new ResizeObserver(measure);
    if (header.current) observer.observe(header.current);
    measure();
    return () => observer.disconnect();
  }, []);
  React.useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (!preference.matches) animations.push(entry.target.animate(
          [{ opacity: .65, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 240, easing: 'ease-out' },
        ));
      }
    }, { threshold: .08 });
    document.querySelectorAll('.web-dashboard .web-panel, .web-tools > button, .web-stats > div').forEach(el => observer.observe(el));
    const stop = () => { if (preference.matches) animations.forEach(animation => animation.cancel()); };
    preference.addEventListener('change', stop);
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); preference.removeEventListener('change', stop); };
  }, [currentView]);
  const [navigationHeight, setNavigationHeight] = React.useState<number>();
  React.useEffect(() => {
    const measure = () => setNavigationHeight(window.innerWidth <= 800 ? navigation.current?.getBoundingClientRect().height : 0);
    const observer = new ResizeObserver(measure);
    if (navigation.current) observer.observe(navigation.current);
    window.addEventListener('resize', measure);
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  React.useEffect(() => {
    const viewport = window.visualViewport;
    let largestHeight = window.innerHeight;
    const update = () => {
      // WKWebView pans its visual viewport to reveal focused inputs. Sticky
      // elements otherwise remain attached to the obscured layout viewport.
      document.documentElement.style.setProperty('--web-viewport-top', `${Math.max(0, viewport?.offsetTop || 0)}px`);
      largestHeight = Math.max(largestHeight, window.innerHeight);
      const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
      setKeyboardOpen(Boolean(editing && largestHeight - (viewport?.height || window.innerHeight) > 150));
    };
    const orientation = () => { largestHeight = window.innerHeight; update(); };
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', orientation);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--web-viewport-top');
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', orientation);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);
  const items = [
    ['home', t('nav_home')], ['tracker', t('nav_workout')], ['planner', t('nav_planner')],
    ['journal', c('progress')], ['clock', t('nav_clock')],
    ['nutrition', c('nutrition')], ['account', c('account')],
  ];
  const title = items.find(([id]) => id === currentView)?.[1] || t('privacy_policy');
  const activeSession = safeStorage.getItem('neuroLift_tracker_phase') === 'active';
  return <div className="website-redesign" dir={dir} data-view={currentView} data-platform={Capacitor.getPlatform()} data-keyboard={keyboardOpen} style={{ '--web-header-height': `${headerHeight}px`, ...(navigationHeight === undefined ? {} : { '--web-bottom-nav': `${keyboardOpen ? 0 : navigationHeight}px` }) } as React.CSSProperties}>
    <a className="web-skip" href="#web-content">{c('skip_to_content')}</a>
    <aside className="web-sidebar" ref={navigation}>
      <button className="web-brand" onClick={() => setCurrentView('home')} aria-label="NeuroLift home"><img className="web-brand-icon" src="/brand/training-icon-192.png" alt="" />NeuroLift</button>
      <p className="web-eyebrow">{c('your_training_space')}</p>
      <nav aria-label={c('main_navigation')} className="web-navigation">
        {items.map(([id, label], index) => <button className={index > 3 ? 'web-secondary-nav' : undefined} key={id} aria-current={currentView === id ? 'page' : undefined} onClick={() => { setCurrentView(id); setMoreOpen(false); }}><Icon name={id} /><span>{label}</span><span className="web-nav-arrow" aria-hidden="true">↗</span></button>)}
        <button className="web-more-nav" aria-current={items.slice(4).some(([id]) => id === currentView) || currentView === 'privacy' ? 'page' : undefined} aria-haspopup="dialog" aria-expanded={moreOpen} onClick={() => setMoreOpen(true)}><span aria-hidden="true">•••</span><span>{c('more')}</span></button>
      </nav>
      <div className="web-sidebar-note"><span className="web-status-dot" /><strong>{c('your_pace_your_progress')}</strong><p>{c('one_session_at_a_time')}</p></div>
      <button className="web-privacy" onClick={() => setCurrentView('privacy')}>{t('privacy_policy')} ↗</button>
    </aside>
    <div className="web-workspace">
      <header className="web-topbar" ref={header}><div><span className="web-eyebrow">NEUROLIFT / {c('workspace')}</span><p>{title}</p></div><div className="web-topbar-actions"><span className="web-date">{new Date().toLocaleDateString(dir === 'rtl' ? 'ar' : document.documentElement.lang || 'en', { month: 'short', day: 'numeric', weekday: 'short' })}</span><Navbar settingsOnly currentView={currentView} setCurrentView={setCurrentView} /></div></header>
      <WebStatus openAccount={() => setCurrentView('account')} />
      {activeSession && currentView !== 'tracker' && <button className="web-resume-strip" onClick={() => setCurrentView('tracker')}>{c('workout_in_progress_resume_workout')} →</button>}
      <main id="web-content" tabIndex={-1} className="web-surface"><TourOverview view={currentView} navigate={setCurrentView} />{children}</main>
      <footer className="web-footer"><span>NEUROLIFT</span><span>{c('built_for_the_long_run')}</span></footer>
    </div>
    <Modal isOpen={moreOpen} onClose={() => setMoreOpen(false)} label={c('more')} sheet>
      <div className="web-more-panel"><div className="web-section-heading"><h2>{c('more')}</h2><button className="web-secondary" onClick={() => setMoreOpen(false)}>{c('close')}</button></div>
        {nativeVersion && <p className="web-small" data-testid="android-build">NeuroLift · Android {nativeVersion}</p>}
        {[...items.slice(4), ['privacy', t('privacy_policy')]].map(([id, label]) => <button className="web-more-link" key={id} onClick={() => { setMoreOpen(false); setCurrentView(id); }}><Icon name={id} />{label}</button>)}
        <button className="web-more-link" onClick={() => { setMoreOpen(false); window.scrollTo(0, 0); window.dispatchEvent(new Event('neurolift-open-settings')); }}>{c('settings')}</button>
      </div>
    </Modal>
  </div>;
}

export function WebHome({ setCurrentView }: Pick<Navigation, 'setCurrentView'>) {
  const { t, language } = useLanguage();
  const c = useCopy();
  const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []).filter(w => !w.isDemo);
  const nextWorkout = findNextScheduledWorkout(
    safeStorage.getParsed<WorkoutTemplate[]>('neuroLift_templates', []),
    safeStorage.getParsed<WeeklyWorkoutSchedule>('neuroLift_weekly_schedule', {}),
    new Date(), history
  );
  const phase = safeStorage.getItem('neuroLift_tracker_phase');
  const active = phase === 'selection' || phase === 'active';
  const recent = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  const minutes = Math.round(history.reduce((sum, w) => sum + (w.durationSeconds || 0), 0) / 60);
  return <div className="web-dashboard">
    <section className="web-hero">
      <div className="web-hero-copy"><p className="web-eyebrow"><span className="web-status-dot" />{c('show_up_build_up')}</p><h1>{c('a_little_stronger')}<br /><em>{c('every_session')}</em></h1><p className="web-lead">{t('home_hero_subtitle')}</p><div className="web-hero-actions"><button className="web-primary" onClick={() => setCurrentView('tracker')}>{active ? t('tracker_resume') : t('home_start_tracking')} <span aria-hidden="true">↗</span></button><button className="web-secondary" onClick={() => setCurrentView('planner')}>{t('home_browse_library')}</button></div><p className="web-small">{t('home_no_account')}</p></div>
      <div className="web-hero-art" aria-hidden="true"><span className="web-art-number">01—∞</span><div className="web-barbell"><i /><i /><b /><i /><i /></div><div className="web-art-caption"><span>THE WORK<br />ADDS UP.</span><span>↗</span></div></div>
    </section>
    <section className="web-stats" aria-label={c('training_summary')}>
      {[[String(history.length).padStart(2, '0'), c('sessions_logged')], [String(minutes), c('minutes_of_training')], [active ? c('in_progress') : c('ready_when_you_are'), c('your_next_session')]].map(([value, label]) => <div key={label}><p className="web-eyebrow">{label}</p><strong>{value}</strong></div>)}
    </section>
    {nextWorkout && <section className="web-panel" aria-label={t('tracker_next_planned')}>
      <p className="web-eyebrow">{t('tracker_next_planned')}</p>
      <h2>{nextWorkout.template.name}</h2>
      <p>{nextWorkout.date.toLocaleDateString(language, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
      <button className="web-secondary" onClick={() => setCurrentView('tracker')}>{active ? t('tracker_resume') : c('view_workout_plan')} ↗</button>
    </section>}
    <div className="web-dashboard-grid">
      <section className="web-panel web-library-promo"><div className="web-section-heading"><div><p className="web-eyebrow">{c('movement_library')}</p><h2>{c('find_your_next_move')}</h2></div><button className="web-icon-button" aria-label={c('explore_the_library')} onClick={() => setCurrentView('planner')}>↗</button></div><div className="web-exercise-preview">{['Incline_Dumbbell_Press', 'Pullups', 'Barbell_Squat'].map((name, index) => <button key={name} onClick={() => setCurrentView(`planner?muscle=${['Chest', 'Back', 'Legs'][index]}`)}><img src={`/exercises/${name}-0.jpg`} alt="" loading="lazy" /><span>{[c('push'), c('pull'), c('legs')][index]} <span aria-hidden="true">↗</span></span></button>)}</div><p className="web-small">{c('explore_by_muscle_see_the_movement_read_the_evidence')}</p></section>
      <section className="web-panel"><div className="web-section-heading"><div><p className="web-eyebrow">{c('your_journal')}</p><h2>{c('the_work_you_put_in')}</h2></div><Icon name="journal" /></div>{recent.length ? <div className="web-recent">{recent.map(workout => <button key={workout.id} onClick={() => setCurrentView('journal')}><span><strong>{workout.name || t('nav_workout')}</strong><small>{new Date(workout.date).toLocaleDateString(language)} · {Math.round(workout.durationSeconds / 60)} min</small></span><span aria-hidden="true">↗</span></button>)}</div> : <div className="web-empty"><span aria-hidden="true">↗</span><h3>{c('your_story_starts_here')}</h3><p>{c('complete_a_workout_to_see_your_sessions_here_no_rush_just_progress')}</p></div>}<button className="web-text-button" onClick={() => setCurrentView('journal')}>{t('nav_journal')} <span aria-hidden="true">→</span></button></section>
    </div>
    <section className="web-tools">{[['clock', c('make_every_minute_count'), c('timer_stopwatch')], ['nutrition', c('fuel_the_effort'), c('daily_calorie_log')]].map(([view, title, caption]) => <button key={view} onClick={() => setCurrentView(view)}><Icon name={view} /><span><strong>{title}</strong><small>{caption}</small></span><span aria-hidden="true">↗</span></button>)}</section>
    <section className="web-sources"><div><p className="web-eyebrow">{c('informed_by_research')}</p><h2>{c('research_supported_training')}</h2><p>{t('home_sources_subtitle')}</p></div><div>{TRAINING_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}<span aria-hidden="true">↗</span></a>)}</div></section>
  </div>;
}

export function WebWelcome({ onComplete }: { onComplete: () => void }) {
  const c = useCopy();
  const { setLanguage, language } = useLanguage();
  return <div className="website-redesign web-welcome"><header><strong className="web-brand">NeuroLift ↗</strong><div className="web-language">{(['en', 'fr', 'ar'] as const).map(lang => <button aria-pressed={language === lang} key={lang} onClick={() => setLanguage(lang)}>{lang.toUpperCase()}</button>)}</div></header><main><p className="web-eyebrow">{c('your_next_chapter')}</p><h1>{c('built_by_you')}<br /><em>{c('one_rep_at_a_time')}</em></h1><p className="web-lead">{c('a_focused_space_to_plan_your_training_log_your_effort_and_watch_your_p')}</p><button className="web-primary" onClick={onComplete}>{c('let_s_get_started')} ↗</button><div className="web-welcome-steps">{[c('01_plan_your_session'), c('02_put_in_the_work'), c('03_see_your_progress')].map(label => <span key={label}>{label}</span>)}</div></main></div>;
}

export function WebGoals({ onComplete }: { onComplete: (goal: string | null) => void }) {
  const persist = usePersistenceAction();
  const { t } = useLanguage();
  const c = useCopy();
  const [goal, setGoal] = React.useState<string | null>(null);
  const finish = () => persist(async () => {
    if (!goal) return;
    await safeStorage.setItem('neuroLift_userGoal', goal);
    onComplete(goal);
  });
  return <div className="website-redesign web-welcome"><header><strong className="web-brand">NeuroLift ↗</strong><span className="web-eyebrow">02 / 02</span></header><main><p className="web-eyebrow">{c('make_it_yours_2')}</p><h1>{t('goal_setting_title')}</h1><p className="web-lead">{t('goal_setting_subtitle')}</p><div className="web-goal-options">{(['strength', 'hypertrophy', 'endurance'] as const).map((id, index) => <button key={id} aria-pressed={goal === id} onClick={() => setGoal(id)}><span className="web-eyebrow">0{index + 1}</span><strong>{t(`goal_${id}_title`)}</strong><p>{t(`goal_${id}_desc`)}</p></button>)}</div><button className="web-primary" disabled={!goal} onClick={finish}>{c('enter_your_workspace')} ↗</button></main></div>;
}
