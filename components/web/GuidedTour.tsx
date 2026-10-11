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
function useCopy() {
  const { language } = useLanguage();
  return (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
}

export function TourOverview({ view, navigate }: { view: string; navigate: (view: string) => void }) {
  const tour = useContext(TourContext);
  const c = useCopy();
  if (!tour) return null;
  const { state, save } = tour;
  if (state.mode === 'done' || (state.mode === 'workout' && view === 'tracker')) return null;
  if (state.mode !== 'overview' && view !== 'home') return null;
  const pages = [
    [c('Welcome to NeuroLift', 'Bienvenue sur NeuroLift', 'مرحباً بك في NeuroLift'), c('Build your workouts, log your sets, and see your progress—one session at a time. Train without an account; sign in when you want to sync.', 'Créez vos séances, notez vos séries et suivez vos progrès. Entraînez-vous sans compte ; connectez-vous pour synchroniser.', 'خطط لتمارينك وسجل مجموعاتك وتابع تقدمك، حصة بعد حصة. تمرّن دون حساب وسجّل الدخول للمزامنة.'), 'home'],
    [c('Your workout, your choices', 'Votre séance, vos choix', 'حصتك، اختياراتك'), c('Choose several muscle groups, add exercises, then record the sets you actually complete. Nothing is logged for you by the tour.', 'Choisissez plusieurs groupes musculaires et exercices, puis notez vos séries réalisées. Le guide ne crée aucune séance à votre place.', 'اختر عدة مجموعات عضلية وتمارين ثم سجل المجموعات التي تنجزها. الدليل لا يسجل أي تمرين نيابة عنك.'), 'tracker'],
    [c('Explore movements', 'Explorez les mouvements', 'اكتشف الحركات'), c('Filter Exercises by muscle and area. Open exercise details for available images, demonstrations, YouTube links and research references. Video links open outside the app and need internet.', 'Filtrez les exercices par muscle et zone. Les détails proposent les images, démonstrations, liens YouTube et études disponibles. Les vidéos externes nécessitent internet.', 'صفّح التمارين حسب العضلة والمنطقة. افتح التفاصيل للصور والشروحات وروابط YouTube والدراسات المتاحة. روابط الفيديو خارج التطبيق وتحتاج الإنترنت.'), 'planner'],
    [c('See your progress', 'Suivez vos progrès', 'شاهد تقدمك'), c('Completed workouts appear in Progress. Review your sets, training volume and body measurements here.', 'Les séances terminées apparaissent dans Progrès : séries, volume et mensurations.', 'تظهر الحصص المكتملة في التقدم. راجع مجموعاتك وحجم التدريب وقياسات الجسم هنا.'), 'journal'],
    [c('Make it yours', 'À votre image', 'خصص تجربتك'), c('More contains extra tools and your account on phones. Use the settings gear for language, appearance and Help & tour. Ready to build a real workout?', 'Sur téléphone, Plus contient les outils et le compte. La roue des réglages propose langue, apparence et Aide et visite. Prêt pour une vraie séance ?', 'في الهاتف، «المزيد» يضم الأدوات والحساب. إعدادات الترس تضم اللغة والمظهر والمساعدة والدليل. هل أنت جاهز لحصتك؟'), 'home'],
  ];
  const start = () => { save({ mode: 'workout', step: 0 }); navigate('tracker'); };
  if (state.mode !== 'overview') return <aside className="web-tour web-tour-invite" aria-label={c('Help & tour', 'Aide et visite', 'المساعدة والدليل')}>
    <div><strong>{c('Welcome. Find your way around.', 'Bienvenue. Prenez vos repères.', 'مرحباً. تعرف على التطبيق.')}</strong><p>{c('A quick introduction, then guidance through your own workout.', 'Une courte visite, puis un guide pour votre séance.', 'جولة سريعة ثم إرشادات أثناء حصتك الخاصة.')}</p></div>
    <button className="web-secondary" onClick={() => { save({ mode: 'overview', step: 0 }); navigate('home'); }}>{c('Take a quick tour', 'Faire une visite rapide', 'ابدأ جولة سريعة')}</button>
    {state.mode !== 'invite' && <button className="web-secondary" onClick={start}>{c('Resume workout guide', 'Reprendre le guide', 'استأنف دليل التمرين')}</button>}
    <button className="web-text-button" onClick={() => save({ ...state, mode: 'done' })}>{c('Explore on my own', 'Explorer librement', 'أستكشف بنفسي')}</button>
  </aside>;
  const [title, description] = pages[state.step];
  const go = (step: number) => { save({ mode: 'overview', step }); navigate(pages[step][2]); };
  return <section className="web-tour" aria-label={c('App overview', 'Visite de l’application', 'جولة التطبيق')}>
    <p className="web-eyebrow">{state.step + 1} / {pages.length}</p>
    <div aria-live="polite"><h2>{title}</h2><p>{description}</p></div>
    <div className="web-tour-actions">
      <button className="web-secondary" disabled={state.step === 0} onClick={() => go(state.step - 1)}>{c('Back', 'Retour', 'رجوع')}</button>
      {state.step < 4 ? <button className="web-primary" onClick={() => go(state.step + 1)}>{c('Next', 'Suivant', 'التالي')}</button> : <button className="web-primary" onClick={start}>{c('Build your first workout', 'Créer votre première séance', 'أنشئ حصتك الأولى')}</button>}
      <button className="web-text-button" onClick={() => save({ ...state, mode: 'paused' })}>{c('Skip tour', 'Passer la visite', 'تخطي الجولة')}</button>
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
    [c('Choose your muscle groups', 'Choisissez vos groupes musculaires', 'اختر المجموعات العضلية'), c('Select one or several groups below, then choose Select Exercises. Your choices stay selected as you build the session.', 'Sélectionnez un ou plusieurs groupes, puis choisissez les exercices. Vos choix restent sélectionnés.', 'اختر مجموعة عضلية أو أكثر ثم اختر التمارين. تبقى اختياراتك محفوظة أثناء بناء الحصة.')],
    [c('Add the movements you want', 'Ajoutez vos exercices', 'أضف التمارين التي تريدها'), c('Select an exercise, then use the muscle selector to switch areas or groups and add more. Try one or two to get familiar. Review your selection, then start when ready.', 'Choisissez un exercice, puis changez de zone ou de groupe avec le sélecteur pour en ajouter. Un ou deux suffisent pour découvrir. Vérifiez votre sélection et démarrez quand vous êtes prêt.', 'اختر تمريناً ثم بدّل المنطقة أو المجموعة من محدد العضلات لإضافة المزيد. يمكنك البدء بتمرين أو اثنين للتعرف على التطبيق. راجع اختيارك وابدأ عندما تكون جاهزاً.')],
    [c('Record a real set', 'Notez une série réelle', 'سجل مجموعة فعلية'), c('Enter the weight in kg and the reps you performed. For bodyweight work without added weight, leave kg at zero. Tap Done only after completing the set.', 'Saisissez le poids en kg et les répétitions réalisées. Sans charge ajoutée, laissez zéro kg. Validez uniquement une série terminée.', 'أدخل الوزن بالكيلوغرام والتكرارات التي أنجزتها. لتمارين وزن الجسم دون حمل إضافي اترك الوزن صفراً. اضغط تم فقط بعد إكمال المجموعة.')],
    [c('Rest, add sets, finish when ready', 'Reposez-vous, puis continuez', 'استرح وأضف المجموعات وأكمل عندما تكون جاهزاً'), c('The rest timer starts after a completed set. Add another set or switch exercises as needed. Finish Workout saves the session; only completed sets count toward volume.', 'Le repos démarre après chaque série validée. Ajoutez des séries ou changez d’exercice. Terminer enregistre la séance ; seules les séries validées comptent dans le volume.', 'يبدأ مؤقت الراحة بعد إكمال المجموعة. أضف مجموعة أو بدّل التمرين حسب حاجتك. إنهاء التمرين يحفظ الحصة؛ المجموعات المكتملة فقط تحتسب في الحجم.')],
    [c('Your effort is saved', 'Vos efforts sont enregistrés', 'تم حفظ جهدك'), c('Open Progress to review your workout, sets and volume. You can replay this guide anytime from Settings → Help & tour.', 'Ouvrez Progrès pour revoir votre séance. Retrouvez ce guide dans Réglages → Aide et visite.', 'افتح التقدم لمراجعة الحصة والمجموعات والحجم. يمكنك إعادة الدليل من الإعدادات ← المساعدة والدليل.')],
  ];
  return <aside className="web-tour" aria-label={c('Workout walkthrough', 'Guide de séance', 'دليل الحصة')}>
    <p className="web-eyebrow">{step + 1} / 5</p><div aria-live="polite"><h2>{hints[step][0]}</h2><p>{hints[step][1]}</p></div>
    <div className="web-tour-actions"><button className="web-secondary" disabled={step === 0} onClick={() => setBack(step - 1)}>{c('Back', 'Retour', 'رجوع')}</button>
      {step < current && <button className="web-secondary" onClick={() => setBack(step + 1)}>{c('Next', 'Suivant', 'التالي')}</button>}
      <button className="web-text-button" onClick={() => tour.save({ mode: current === 4 ? 'done' : 'paused', step: 0 })}>{current === 4 ? c('Finish guide', 'Terminer le guide', 'إنهاء الدليل') : c('Skip guidance', 'Passer le guide', 'تخطي الإرشادات')}</button>
    </div>
  </aside>;
}
