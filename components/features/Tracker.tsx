import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { CompletedWorkout, ActiveExercise } from '../../types';
import { getExerciseDatabase, getLocalizedMuscleName } from '../../utils/exerciseData';
import { useClock } from '../../contexts/ClockContext';

export const Tracker: React.FC = () => {
  const { t, language } = useLanguage();
  const [phase, setPhase] = useState<'setup' | 'active' | 'summary'>('setup');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [tutorialExercise, setTutorialExercise] = useState<string | null>(null);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null); // This will now represent "Per Side" input
  const [barWeight, setBarWeight] = useState<number>(20);
  const [activeSetInfo, setActiveSetInfo] = useState<{ exIdx: number, setIdx: number } | null>(null);

  // Active Session State
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [completedWorkout, setCompletedWorkout] = useState<CompletedWorkout | null>(null);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  // Use Global Clock for Workout Session
  const {
    mode, setMode,
    timerActive, setTimerActive,
    duration, setDuration,
    countdownRemaining,
    countdownInput, setCountdownInput,
    laps, addLap,
    resetClock,
    startTimer
  } = useClock();

  // Dynamic DB
  const exercisesByMuscle = getExerciseDatabase(language);
  const selectableMuscles = Object.keys(exercisesByMuscle);

  useEffect(() => {
    let interval: any;
    if (restRemaining !== null && restRemaining > 0) {
      interval = setInterval(() => setRestRemaining(r => (r !== null ? r - 1 : null)), 1000);
    } else if (restRemaining === 0) {
      setRestRemaining(null);
    }
    return () => clearInterval(interval);
  }, [restRemaining]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMuscle = (m: string) => {
    if (selectedMuscles.includes(m)) {
      setSelectedMuscles(selectedMuscles.filter(x => x !== m));
      // Optionally remove exercises if muscle deselected
    } else {
      setSelectedMuscles([...selectedMuscles, m]);
    }
  };

  const toggleExercise = (ex: string) => {
    if (selectedExercises.includes(ex)) {
      setSelectedExercises(selectedExercises.filter(i => i !== ex));
    } else {
      setSelectedExercises([...selectedExercises, ex]);
    }
  };

  const handleStartWorkout = () => {
    setPhase('active');
    setTimerActive(true);
    setMode('stopwatch');
    setDuration(0);
    setActiveExercises(selectedExercises.map(name => ({
      name,
      sets: [{ id: crypto.randomUUID(), weight: 0, reps: 0, completed: false }]
    })));
  };

  const addSet = (exerciseIndex: number) => {
    const newExs = [...activeExercises];
    newExs[exerciseIndex].sets.push({
      id: crypto.randomUUID(),
      weight: 0,
      reps: 0,
      completed: false
    });
    setActiveExercises(newExs);
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', val: string) => {
    const newExs = [...activeExercises];
    const value = parseFloat(val) || 0;
    (newExs[exIdx].sets[setIdx] as any)[field] = value;
    setActiveExercises(newExs);
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const newExs = [...activeExercises];
    const isNowCompleted = !newExs[exIdx].sets[setIdx].completed;
    newExs[exIdx].sets[setIdx].completed = isNowCompleted;
    setActiveExercises(newExs);

    if (isNowCompleted) {
      setRestRemaining(90);
    } else {
      setRestRemaining(null);
    }
  };

  const finishWorkout = () => {
    setTimerActive(false);
    setRestRemaining(null);
    const volume = activeExercises.reduce((acc, ex) => {
      return acc + ex.sets.reduce((sAcc, s) => s.completed ? sAcc + (s.weight * s.reps) : sAcc, 0);
    }, 0);

    const record: CompletedWorkout = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      durationSeconds: duration,
      exercises: activeExercises,
      totalVolume: volume
    };

    const history = JSON.parse(localStorage.getItem('neuroLift_history') || '[]');
    localStorage.setItem('neuroLift_history', JSON.stringify([record, ...history]));

    setCompletedWorkout(record);
    setPhase('summary');
  };

  const reset = () => {
    setPhase('setup');
    setSelectedMuscles([]);
    setSelectedExercises([]);
    setCompletedWorkout(null);
    setRestRemaining(null);
    setTimerActive(false);
  };

  const resetCurrentTimer = () => {
    if (window.confirm(t('timer_reset') + '?')) {
      resetClock();
    }
  };

  const startTimerMode = () => {
    const secs = parseInt(countdownInput);
    if (!isNaN(secs) && secs > 0) {
      startTimer(secs);
    }
  };

  const MuscleChecklist = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4 mb-16">
        {selectableMuscles.map((muscle) => (
          <button
            key={muscle}
            onClick={() => toggleMuscle(muscle)}
            className={`group relative flex flex-col p-6 rounded-3xl border transition-all duration-300 ${selectedMuscles.includes(muscle)
              ? 'bg-teal-500 border-teal-500 shadow-[0_0_25px_rgba(20,184,166,0.2)]'
              : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 shadow-sm hover:shadow-md'
              }`}
          >
            <div className="flex items-center justify-end mb-2">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedMuscles.includes(muscle) ? 'bg-white border-white' : 'border-zinc-700 group-hover:border-zinc-600'}`}>
                {selectedMuscles.includes(muscle) && <svg className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
            <span className={`text-xl font-black text-left transition-colors ${selectedMuscles.includes(muscle) ? 'text-white' : 'text-white'}`}>
              {getLocalizedMuscleName(muscle, language)}
            </span>
          </button>
        ))}
      </div>
    );
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">{t('tracker_select_muscle')}</h2>
          <div className="h-1.5 w-24 bg-teal-500 mx-auto rounded-full mb-8"></div>

          {selectedMuscles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4 animate-in fade-in zoom-in duration-300">
              {selectedMuscles.map(m => (
                <span key={m} className="px-5 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-sm">
                  {getLocalizedMuscleName(m, language)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4 mb-16">
          {selectableMuscles.map((muscle) => (
            <button
              key={muscle}
              onClick={() => toggleMuscle(muscle)}
              className={`group relative flex flex-col p-6 rounded-3xl border transition-all duration-300 ${selectedMuscles.includes(muscle)
                ? 'bg-teal-500 border-teal-500 shadow-[0_0_25px_rgba(20,184,166,0.2)]'
                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 shadow-sm hover:shadow-md'
                }`}
            >
              <div className="flex items-center justify-end mb-2">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedMuscles.includes(muscle) ? 'bg-white border-white' : 'border-zinc-700 group-hover:border-zinc-600'}`}>
                  {selectedMuscles.includes(muscle) && <svg className="w-3 h-3 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
              <span className={`text-xl font-black text-left transition-colors ${selectedMuscles.includes(muscle) ? 'text-white' : 'text-zinc-400'}`}>
                {getLocalizedMuscleName(muscle, language)}
              </span>
            </button>
          ))}
        </div>

        {selectedMuscles.length > 0 && (
          <div className="mt-4 animate-in slide-in-from-bottom-6 duration-500">
            <SpotlightButton onClick={() => setPhase('selection')} className="px-20 py-5 text-lg font-black uppercase tracking-widest shadow-xl">
              {t('tracker_select_exercises')} ({selectedMuscles.length})
            </SpotlightButton>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'selection') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">
              {t('tracker_select_specific')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedMuscles.map(m => (
                <span key={m} className="text-[10px] text-teal-600 dark:text-teal-500 font-bold uppercase tracking-widest px-2 py-0.5 bg-teal-500/10 rounded shadow-sm">
                  {getLocalizedMuscleName(m, language)}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setPhase('setup')} className="text-xs text-zinc-500 hover:text-teal-600 dark:hover:text-white uppercase tracking-widest font-black flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t('tracker_back')}
          </button>
        </div>

        <div className="space-y-20 mb-32">
          {selectedMuscles.map(majorMuscle => (
            <div key={majorMuscle} className="space-y-12">
              {/* Show Major Group Header */}
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                <span className="w-4 h-12 bg-teal-500 rounded-full"></span>
                {getLocalizedMuscleName(majorMuscle, language)}
              </h3>

              {/* Render functional sub-groups */}
              {Object.keys(exercisesByMuscle[majorMuscle] || {}).map(subGroup => (
                <div key={subGroup} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="text-xl font-black text-zinc-800 dark:text-zinc-200 mb-8 uppercase tracking-widest flex items-center gap-4 ml-4">
                    <span className="w-1.5 h-6 bg-teal-500/50 rounded-full"></span>
                    {getLocalizedMuscleName(subGroup, language)}
                  </h4>

                  <div className="space-y-12 ml-4">
                    {(['weightlifting', 'cables', 'bodyweight'] as const).map(category => {
                      const exercises = exercisesByMuscle[majorMuscle]?.[subGroup]?.[category] || [];
                      if (exercises.length === 0) return null;

                      return (
                        <div key={category}>
                          <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-6 ml-1 flex items-center gap-4">
                            {category}
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800"></div>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {exercises.map(ex => (
                              <div key={ex} className="relative group">
                                <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${selectedExercises.includes(ex)
                                  ? 'bg-teal-500/5 border-teal-500 shadow-md text-teal-600 dark:text-teal-400'
                                  : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                                  <input
                                    type="checkbox"
                                    checked={selectedExercises.includes(ex)}
                                    onChange={() => toggleExercise(ex)}
                                    className="hidden"
                                  />
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedExercises.includes(ex) ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' : 'border-zinc-200 dark:border-zinc-700'}`}>
                                    {selectedExercises.includes(ex) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <span className="text-sm font-black tracking-wide flex-1 uppercase">{ex}</span>
                                </label>

                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTutorialExercise(ex);
                                  }}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-zinc-400 dark:text-zinc-600 hover:text-teal-600 dark:hover:text-teal-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10"
                                  title={t('modal_watch_video')}
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="sticky bottom-6 bg-white/80 dark:bg-black/80 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-between z-40">
          <div className="hidden md:block">
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em] mb-1">{selectedExercises.length} Exercises Picked</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 font-bold max-w-[400px] truncate">{selectedExercises.join(', ')}</div>
          </div>
          <SpotlightButton onClick={handleStartWorkout} disabled={selectedExercises.length === 0} className="w-full md:w-auto px-16 py-5 text-lg font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">
            {t('tracker_start')}
          </SpotlightButton>
        </div>

        {/* Tutorial Modal */}
        {tutorialExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/20 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-xl rounded-[3rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 shadow-3xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
              <button
                onClick={() => setTutorialExercise(null)}
                className="absolute right-8 top-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title={t('modal_close')}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-3 h-10 bg-teal-500 rounded-full"></div>
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight pr-10">
                  {tutorialExercise}
                </h3>
              </div>

              <div className="aspect-video w-full rounded-2xl bg-zinc-50 dark:bg-black/60 mb-10 overflow-hidden relative group border border-zinc-100 dark:border-zinc-800 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-teal-500/10 dark:bg-teal-500/20 border-2 border-teal-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 backdrop-blur-sm shadow-xl">
                    <svg className="h-10 w-10 text-teal-600 dark:text-teal-400 ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.3em]">{t('modal_watch_video')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <a
                  href={`https://www.youtube.com/results?search_query=${tutorialExercise}+exercise+technique`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full"
                >
                  <SpotlightButton className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20">
                    {t('modal_watch_video')}
                  </SpotlightButton>
                </a>
                <button
                  onClick={() => setTutorialExercise(null)}
                  className="w-full py-4 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-black uppercase tracking-[0.3em] transition-all"
                >
                  {t('modal_close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 pb-40">
        <div className="sticky top-20 z-40 bg-white/80 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 py-6 mb-12 px-8 rounded-[2.5rem] shadow-xl">
          <div className="flex flex-wrap justify-between items-center gap-6">
            <div className="flex flex-col">
              <div className="text-5xl font-mono font-black text-teal-600 dark:text-teal-400 leading-none tracking-tighter">
                {mode === 'stopwatch' ? formatTime(duration) : formatTime(countdownRemaining || 0)}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => { setMode('stopwatch'); setTimerActive(false); }}
                  className={`px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'stopwatch' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  {t('clock_stopwatch')}
                </button>
                <button
                  onClick={() => { setMode('timer'); setTimerActive(false); }}
                  className={`px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${mode === 'timer' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  {t('clock_timer')}
                </button>
                {restRemaining !== null && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-orange-600 dark:text-orange-400 animate-pulse bg-orange-500/10 px-3 py-1 rounded-full shadow-sm">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {t('tracker_rest_timer')}: {restRemaining}s
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {mode === 'timer' && countdownRemaining === null && (
                <div className="flex items-center gap-2 mr-2">
                  <input
                    type="number"
                    value={countdownInput}
                    onChange={e => setCountdownInput(e.target.value)}
                    className="w-20 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:border-teal-500/50 outline-none shadow-inner"
                    placeholder="Sec"
                  />
                  <button onClick={startTimerMode} className="px-4 py-3 bg-teal-600 rounded-xl text-[10px] text-white font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">{t('timer_set')}</button>
                </div>
              )}

              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 shadow-lg ${timerActive
                  ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
                  : 'bg-teal-500 text-white border-teal-400 shadow-teal-500/20'
                  }`}
              >
                {timerActive ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
              </button>

              <button
                onClick={mode === 'stopwatch' ? addLap : undefined}
                disabled={!timerActive || mode !== 'stopwatch'}
                className="p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-white disabled:opacity-30 bg-white dark:bg-transparent shadow-md"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              <button onClick={resetCurrentTimer} className="p-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 transition-colors bg-white dark:bg-transparent shadow-md">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>

              <SpotlightButton variant="secondary" onClick={finishWorkout} className="h-[60px] px-8 text-xs font-black uppercase tracking-[0.2em] bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 ml-2 shadow-lg shadow-rose-500/10">
                {t('tracker_finish')}
              </SpotlightButton>
            </div>
          </div>

          {mode === 'stopwatch' && laps.length > 0 && (
            <div className="flex gap-3 overflow-x-auto mt-6 pb-2 scrollbar-hide border-t border-zinc-100 dark:border-zinc-800/50 pt-5">
              {laps.map((time, i) => (
                <div key={i} className="flex-shrink-0 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-full text-[11px] text-zinc-500 dark:text-zinc-400 font-mono shadow-sm">
                  <span className="text-teal-600 dark:text-teal-400 font-black mr-2">LAP {laps.length - i}</span> {formatTime(time)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-12">
          {activeExercises.map((ex, exIdx) => (
            <Card key={exIdx} className="p-8 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-sm overflow-hidden">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
                <span className="w-2.5 h-8 bg-teal-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                {ex.name}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-3 text-[10px] text-zinc-400 dark:text-zinc-500 mb-2 px-4 font-black uppercase tracking-[0.3em]">
                  <div className="col-span-2 text-center">{t('tracker_header_set')}</div>
                  <div className="col-span-4 text-center">{t('tracker_header_kg')}</div>
                  <div className="col-span-4 text-center">{t('tracker_header_reps')}</div>
                  <div className="col-span-2 text-center">✓</div>
                </div>
                {ex.sets.map((set, setIdx) => (
                  <div key={set.id} className={`grid grid-cols-12 gap-3 items-center p-4 rounded-3xl transition-all duration-300 border-2 ${set.completed
                    ? 'bg-teal-500/5 border-teal-500 shadow-md transform scale-[1.01]'
                    : 'bg-white dark:bg-black/40 border-zinc-100 dark:border-zinc-800 shadow-sm'}`}>
                    <div className="col-span-2 text-zinc-400 dark:text-zinc-600 font-black font-mono text-lg text-center">{setIdx + 1}</div>
                    <div className="col-span-4 relative group/plate">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        className={`w-full bg-transparent text-center outline-none text-xl font-black font-mono ${set.completed ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-900 dark:text-white'}`}
                      />
                      <button
                        onClick={() => {
                          setPlateCalcWeight(0);
                          setActiveSetInfo({ exIdx, setIdx });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-zinc-300 dark:text-zinc-700 hover:text-teal-500 transition-colors"
                        title={t('plate_calc_title')}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" /></svg>
                      </button>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        className={`w-full bg-transparent text-center outline-none text-xl font-black font-mono ${set.completed ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-900 dark:text-white'}`}
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${set.completed ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30 rotate-0' : 'border-zinc-200 dark:border-zinc-700 hover:border-teal-500/50'}`}
                      >
                        {set.completed && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addSet(exIdx)}
                  className="w-full py-5 mt-4 text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-500/5 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-all font-black uppercase tracking-[0.3em]"
                >
                  + {t('tracker_add_set')}
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Plate Calculator Modal */}
        {activeSetInfo !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/20 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-md rounded-[3.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 shadow-3xl">
              <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
              <button
                onClick={() => setActiveSetInfo(null)}
                className="absolute right-8 top-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                title={t('modal_close')}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="mb-10 text-center md:text-left">
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-2 flex items-center justify-center md:justify-start gap-4">
                  <div className="w-3 h-10 bg-teal-500 rounded-full"></div>
                  {t('plate_calc_title')}
                </h3>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-2">{t('plate_calc_barbell')} (KG)</label>
                    <input
                      type="number"
                      value={barWeight}
                      step="0.5"
                      onChange={(e) => setBarWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl px-6 py-4 text-zinc-900 dark:text-white font-black font-mono focus:border-teal-500 shadow-inner outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-2">{t('plate_calc_per_side')} (KG)</label>
                    <input
                      type="number"
                      value={plateCalcWeight || 0}
                      step="0.5"
                      onChange={(e) => setPlateCalcWeight(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl px-6 py-4 text-zinc-900 dark:text-white font-black font-mono focus:border-teal-500 shadow-inner outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-10 rounded-[2.5rem] bg-teal-500/5 border-2 border-teal-500/10 text-center relative overflow-hidden group shadow-inner">
                  <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-[10px] font-black text-teal-600/50 dark:text-teal-500/50 uppercase tracking-[0.4em] mb-4">{t('plate_calc_total')}</div>
                  <div className="text-7xl font-black text-zinc-900 dark:text-white font-mono tracking-tighter">
                    {(plateCalcWeight || 0) * 2 + barWeight} <span className="text-2xl text-teal-600 dark:text-teal-500 underline decoration-4 decoration-teal-500/20 underline-offset-8">KG</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <SpotlightButton
                    onClick={() => {
                      const total = (plateCalcWeight || 0) * 2 + barWeight;
                      updateSet(activeSetInfo.exIdx, activeSetInfo.setIdx, 'weight', total.toString());
                      setActiveSetInfo(null);
                    }}
                    className="w-full py-5 text-sm font-black uppercase tracking-widest shadow-xl shadow-teal-500/20"
                  >
                    {t('save')}
                  </SpotlightButton>
                  <button
                    onClick={() => setActiveSetInfo(null)}
                    className="w-full py-4 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-black uppercase tracking-[0.3em] transition-all"
                  >
                    {t('modal_close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'summary' && completedWorkout) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center animate-in zoom-in duration-500">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-[2rem] bg-teal-500/10 dark:bg-teal-500/20 mb-8 shadow-2xl shadow-teal-500/20 rotate-12">
          <svg className="h-12 w-12 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-6xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tighter leading-none">{t('tracker_summary')}</h2>
        <p className="text-zinc-500 italic mb-16 text-xl font-medium tracking-tight opacity-80">"{t('tracker_quote')}"</p>

        <div className="grid grid-cols-2 gap-6 mb-16">
          <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900/80 border-2 border-zinc-100 dark:border-zinc-800 shadow-xl backdrop-blur-xl">
            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{t('tracker_duration')}</div>
            <div className="text-4xl font-black font-mono text-teal-600 dark:text-teal-400 tracking-tighter">{formatTime(completedWorkout.durationSeconds)}</div>
          </div>
          <div className="p-10 rounded-[2.5rem] bg-white dark:bg-zinc-900/80 border-2 border-zinc-100 dark:border-zinc-800 shadow-xl backdrop-blur-xl">
            <div className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{t('tracker_volume')}</div>
            <div className="text-4xl font-black font-mono text-teal-600 dark:text-teal-400 tracking-tighter">{completedWorkout.totalVolume} <span className="text-lg">KG</span></div>
          </div>
        </div>

        <SpotlightButton onClick={reset} className="px-20 py-6 text-xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-teal-500/30">
          {t('tracker_start_new')}
        </SpotlightButton>
      </div>
    );
  }

  return null;
};