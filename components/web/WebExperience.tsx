import React from 'react';
import { Navbar } from '../Navbar';
import { useLanguage } from '../../contexts/LanguageContext';
import { safeStorage } from '../../utils/storage';
import { CompletedWorkout } from '../../types';
import { TRAINING_SOURCES } from '../../utils/trainingEvidence';
import './website.css';

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
function useCopy() {
  const { language } = useLanguage();
  return (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
}
export function WebFrame({ currentView, setCurrentView, children }: Navigation & { children: React.ReactNode }) {
  const { t, dir } = useLanguage();
  const c = useCopy();
  const items = [
    ['home', t('nav_home')], ['tracker', t('nav_workout')], ['planner', t('nav_planner')],
    ['journal', t('nav_journal')], ['clock', t('nav_clock')],
    ['nutrition', c('Nutrition', 'Nutrition', 'التغذية')], ['account', c('Account', 'Compte', 'الحساب')],
  ];
  const title = items.find(([id]) => id === currentView)?.[1] || t('privacy_policy');
  return <div className="website-redesign" dir={dir} data-view={currentView}>
    <a className="web-skip" href="#web-content">{c('Skip to content', 'Aller au contenu', 'انتقل إلى المحتوى')}</a>
    <aside className="web-sidebar">
      <button className="web-brand" onClick={() => setCurrentView('home')} aria-label="NeuroLift home"><span className="web-monogram" aria-hidden="true">N<span>↗</span></span>NeuroLift</button>
      <p className="web-eyebrow">{c('Your training space', 'Votre espace sportif', 'مساحتك للتدريب')}</p>
      <nav aria-label={c('Main navigation', 'Navigation principale', 'التنقل الرئيسي')} className="web-navigation">
        {items.map(([id, label]) => <button key={id} aria-current={currentView === id ? 'page' : undefined} onClick={() => setCurrentView(id)}><Icon name={id} /><span>{label}</span><span className="web-nav-arrow" aria-hidden="true">↗</span></button>)}
      </nav>
      <div className="web-sidebar-note"><span className="web-status-dot" /><strong>{c('Your pace. Your progress.', 'Votre rythme. Vos progrès.', 'وتيرتك. تقدمك.')}</strong><p>{c('One session at a time.', 'Une séance à la fois.', 'حصة واحدة في كل مرة.')}</p></div>
      <button className="web-privacy" onClick={() => setCurrentView('privacy')}>{t('privacy_policy')} ↗</button>
    </aside>
    <div className="web-workspace">
      <header className="web-topbar"><div><span className="web-eyebrow">NEUROLIFT / {c('WORKSPACE', 'ESPACE', 'مساحة العمل')}</span><p>{title}</p></div><div className="web-topbar-actions"><span className="web-date">{new Date().toLocaleDateString(dir === 'rtl' ? 'ar' : document.documentElement.lang || 'en', { month: 'short', day: 'numeric', weekday: 'short' })}</span><Navbar settingsOnly currentView={currentView} setCurrentView={setCurrentView} /></div></header>
      <main id="web-content" tabIndex={-1} className="web-surface">{children}</main>
      <footer className="web-footer"><span>NEUROLIFT</span><span>{c('Built for the long run.', 'Pensé pour durer.', 'مصمم للاستمرار.')}</span></footer>
    </div>
  </div>;
}

export function WebHome({ setCurrentView }: Pick<Navigation, 'setCurrentView'>) {
  const { t, language } = useLanguage();
  const c = useCopy();
  const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []).filter(w => !w.isDemo);
  const phase = safeStorage.getItem('neuroLift_tracker_phase');
  const active = phase === 'selection' || phase === 'active';
  const recent = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  const minutes = Math.round(history.reduce((sum, w) => sum + (w.durationSeconds || 0), 0) / 60);
  return <div className="web-dashboard">
    <section className="web-hero">
      <div className="web-hero-copy"><p className="web-eyebrow"><span className="web-status-dot" />{c('SHOW UP. BUILD UP.', 'PRÉSENT. PLUS FORT.', 'ابدأ. ثم تقدّم.')}</p><h1>{c('A little stronger.', 'Un peu plus fort.', 'أقوى قليلاً.')}<br /><em>{c('Every session.', 'À chaque séance.', 'في كل حصة.')}</em></h1><p className="web-lead">{t('home_hero_subtitle')}</p><div className="web-hero-actions"><button className="web-primary" onClick={() => setCurrentView('tracker')}>{active ? t('tracker_resume') : t('home_start_tracking')} <span aria-hidden="true">↗</span></button><button className="web-secondary" onClick={() => setCurrentView('planner')}>{t('home_browse_library')}</button></div><p className="web-small">{t('home_no_account')}</p></div>
      <div className="web-hero-art" aria-hidden="true"><span className="web-art-number">01—∞</span><div className="web-barbell"><i /><i /><b /><i /><i /></div><div className="web-art-caption"><span>THE WORK<br />ADDS UP.</span><span>↗</span></div></div>
    </section>
    <section className="web-stats" aria-label={c('Training summary', 'Bilan sportif', 'ملخص التدريب')}>
      {[[String(history.length).padStart(2, '0'), c('Sessions logged', 'Séances enregistrées', 'حصص مسجلة')], [String(minutes), c('Minutes of training', 'Minutes de sport', 'دقائق التدريب')], [active ? c('In progress', 'En cours', 'قيد التنفيذ') : c('Ready when you are', 'À votre rythme', 'ابدأ حين تكون جاهزاً'), c('Your next session', 'Votre prochaine séance', 'حصتك القادمة')]].map(([value, label]) => <div key={label}><p className="web-eyebrow">{label}</p><strong>{value}</strong></div>)}
    </section>
    <div className="web-dashboard-grid">
      <section className="web-panel web-library-promo"><div className="web-section-heading"><div><p className="web-eyebrow">{c('MOVEMENT LIBRARY', 'BIBLIOTHÈQUE', 'مكتبة التمارين')}</p><h2>{c('Find your next move.', 'Trouvez votre mouvement.', 'اكتشف تمرينك القادم.')}</h2></div><button className="web-icon-button" aria-label={c('Explore the library', 'Explorer la bibliothèque', 'استكشف المكتبة')} onClick={() => setCurrentView('planner')}>↗</button></div><div className="web-exercise-preview">{['Incline_Dumbbell_Press', 'Pullups', 'Barbell_Squat'].map((name, index) => <button key={name} onClick={() => setCurrentView(`planner?muscle=${['Chest', 'Back', 'Legs'][index]}`)}><img src={`/exercises/${name}-0.jpg`} alt="" loading="lazy" /><span>{[c('Push', 'Pousser', 'دفع'), c('Pull', 'Tirer', 'سحب'), c('Legs', 'Jambes', 'أرجل')][index]} <span aria-hidden="true">↗</span></span></button>)}</div><p className="web-small">{c('Explore by muscle. See the movement. Read the evidence.', 'Explorez par muscle. Visualisez le mouvement. Consultez les études.', 'تصفح حسب العضلة. شاهد الحركة. اقرأ الدراسات.')}</p></section>
      <section className="web-panel"><div className="web-section-heading"><div><p className="web-eyebrow">{c('YOUR JOURNAL', 'VOTRE JOURNAL', 'سجلّك')}</p><h2>{c('The work you put in.', 'Le travail accompli.', 'الجهد الذي بذلته.')}</h2></div><Icon name="journal" /></div>{recent.length ? <div className="web-recent">{recent.map(workout => <button key={workout.id} onClick={() => setCurrentView('journal')}><span><strong>{workout.name || t('nav_workout')}</strong><small>{new Date(workout.date).toLocaleDateString(language)} · {Math.round(workout.durationSeconds / 60)} min</small></span><span aria-hidden="true">↗</span></button>)}</div> : <div className="web-empty"><span aria-hidden="true">↗</span><h3>{c('Your story starts here.', 'Votre histoire commence ici.', 'قصتك تبدأ هنا.')}</h3><p>{c('Complete a workout to see your sessions here. No rush. Just progress.', 'Terminez une séance pour la retrouver ici. Chaque effort compte.', 'أكمل تمريناً لتظهر حصصك هنا. كل خطوة مهمة.')}</p></div>}<button className="web-text-button" onClick={() => setCurrentView('journal')}>{t('nav_journal')} <span aria-hidden="true">→</span></button></section>
    </div>
    <section className="web-tools">{[['clock', c('Make every minute count.', 'Chaque minute compte.', 'استفد من كل دقيقة.'), c('Timer & stopwatch', 'Minuteur et chronomètre', 'المؤقت وساعة الإيقاف')], ['nutrition', c('Fuel the effort.', 'Nourrissez vos efforts.', 'غذِّ مجهودك.'), c('Daily calorie log', 'Journal calorique', 'سجل السعرات اليومية')]].map(([view, title, caption]) => <button key={view} onClick={() => setCurrentView(view)}><Icon name={view} /><span><strong>{title}</strong><small>{caption}</small></span><span aria-hidden="true">↗</span></button>)}</section>
    <section className="web-sources"><div><p className="web-eyebrow">{c('INFORMED BY RESEARCH', 'ÉCLAIRÉ PAR LA RECHERCHE', 'مسترشد بالأبحاث')}</p><h2>{t('home_sources_title')}</h2><p>{t('home_sources_subtitle')}</p></div><div>{TRAINING_SOURCES.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name}<span aria-hidden="true">↗</span></a>)}</div></section>
  </div>;
}

export function WebWelcome({ onComplete }: { onComplete: () => void }) {
  const c = useCopy();
  const { setLanguage, language } = useLanguage();
  return <div className="website-redesign web-welcome"><header><strong className="web-brand">NeuroLift ↗</strong><div className="web-language">{(['en', 'fr', 'ar'] as const).map(lang => <button aria-pressed={language === lang} key={lang} onClick={() => setLanguage(lang)}>{lang.toUpperCase()}</button>)}</div></header><main><p className="web-eyebrow">{c('YOUR NEXT CHAPTER', 'VOTRE PROCHAIN CHAPITRE', 'فصلك القادم')}</p><h1>{c('Built by you.', 'Construit par vous.', 'بجهدك.')}<br /><em>{c('One rep at a time.', 'Une répétition à la fois.', 'تكراراً بعد تكرار.')}</em></h1><p className="web-lead">{c('A focused space to plan your training, log your effort, and watch your progress. Start locally. Create an account when you want to sync.', 'Un espace pour planifier, enregistrer vos efforts et suivre vos progrès. Commencez en local. Créez un compte pour synchroniser.', 'مساحة لتخطيط تمارينك وتسجيل جهدك ومتابعة تقدمك. ابدأ محلياً وأنشئ حساباً حين ترغب بالمزامنة.')}</p><button className="web-primary" onClick={onComplete}>{c('Let’s get started', 'Commençons', 'لنبدأ')} ↗</button><div className="web-welcome-steps">{[c('01 / Plan your session', '01 / Planifier', '01 / خطط لحصتك'), c('02 / Put in the work', '02 / S’entraîner', '02 / تمرّن'), c('03 / See your progress', '03 / Progresser', '03 / شاهد تقدمك')].map(label => <span key={label}>{label}</span>)}</div></main></div>;
}

export function WebGoals({ onComplete }: { onComplete: (goal: string | null) => void }) {
  const { t } = useLanguage();
  const c = useCopy();
  const [goal, setGoal] = React.useState<string | null>(null);
  return <div className="website-redesign web-welcome"><header><strong className="web-brand">NeuroLift ↗</strong><span className="web-eyebrow">02 / 02</span></header><main><p className="web-eyebrow">{c('MAKE IT YOURS', 'À VOTRE IMAGE', 'اجعلها مساحتك')}</p><h1>{t('goal_setting_title')}</h1><p className="web-lead">{t('goal_setting_subtitle')}</p><div className="web-goal-options">{(['strength', 'hypertrophy', 'endurance'] as const).map((id, index) => <button key={id} aria-pressed={goal === id} onClick={() => setGoal(id)}><span className="web-eyebrow">0{index + 1}</span><strong>{t(`goal_${id}_title`)}</strong><p>{t(`goal_${id}_desc`)}</p></button>)}</div><button className="web-primary" disabled={!goal} onClick={() => { if (goal) safeStorage.setItem('neuroLift_userGoal', goal); onComplete(goal); }}>{c('Enter your workspace', 'Ouvrir mon espace', 'افتح مساحتك')} ↗</button></main></div>;
}
