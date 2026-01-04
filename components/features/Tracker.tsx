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

  const MuscleMap = () => {
    const frontMuscles = [
      { id: 'Chest', path: 'M 100 80 Q 150 70 200 80 L 200 120 Q 150 130 100 120 Z' },
      { id: 'Shoulders', path: 'M 70 80 Q 85 70 100 80 L 100 100 Q 85 110 70 100 Z M 200 80 Q 215 70 230 80 L 230 100 Q 215 110 200 100 Z' },
      { id: 'Quads', path: 'M 110 200 L 145 200 L 145 300 L 110 300 Z M 155 200 L 190 200 L 190 300 L 155 300 Z' },
      { id: 'Biceps', path: 'M 82 110 L 98 110 L 98 160 L 82 160 Z M 202 110 L 218 110 L 218 160 L 202 160 Z' },
    ];

    const rearMuscles = [
      { id: 'Back', path: 'M 100 80 L 200 80 L 180 160 L 150 170 L 120 160 Z' },
      { id: 'Glutes', path: 'M 115 175 L 145 175 L 145 210 L 115 210 Z M 155 175 L 185 175 L 185 210 L 155 210 Z' },
      { id: 'Hamstrings', path: 'M 110 215 L 145 215 L 145 290 L 110 290 Z M 155 215 L 190 215 L 190 290 L 155 290 Z' },
      { id: 'Calves', path: 'M 115 300 L 140 300 L 140 370 L 115 370 Z M 160 300 L 185 300 L 185 370 L 160 370 Z' },
      { id: 'Triceps', path: 'M 75 105 L 90 105 L 90 155 L 75 155 Z M 210 105 L 225 105 L 225 155 L 210 155 Z' },
    ];

    const Skeleton = ({ muscles, label }: { muscles: any[], label: string }) => (
      <div className="flex-1 flex flex-col items-center">
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-4 font-bold">{label}</span>
        <svg viewBox="0 0 300 400" className="w-full h-auto drop-shadow-[0_0_15px_rgba(20,184,166,0.1)]">
          <path
            d="M 150 20 C 130 20 120 40 120 60 L 120 70 C 100 75 80 80 70 100 L 60 180 L 80 180 L 90 120 L 110 120 L 110 380 L 145 380 L 145 250 L 155 250 L 155 380 L 190 380 L 190 120 L 210 120 L 220 180 L 240 180 L 230 100 C 220 80 200 75 180 70 L 180 60 C 180 40 170 20 150 20"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="2"
          />
          {muscles.map(m => (
            <path
              key={m.id}
              d={m.path}
              onClick={() => toggleMuscle(m.id)}
              className={`cursor-pointer transition-all duration-300 ${selectedMuscles.includes(m.id)
                ? 'fill-teal-500 stroke-teal-400'
                : 'fill-zinc-800/50 stroke-zinc-700 hover:fill-teal-500/30'
                }`}
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    );

    return (
      <div className="w-full max-w-3xl mx-auto mb-16 px-4">
        <div className="flex flex-col sm:flex-row gap-12 sm:gap-8 md:gap-16">
          <Skeleton muscles={frontMuscles} label={t('tracker_front')} />
          <Skeleton muscles={rearMuscles} label={t('tracker_back')} />
        </div>
      </div>
    );
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">{t('tracker_select_muscle')}</h2>
          <div className="h-1 w-20 bg-teal-500 mx-auto rounded-full mb-8"></div>

          {selectedMuscles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4 animate-in fade-in zoom-in duration-300">
              {selectedMuscles.map(m => (
                <span key={m} className="px-4 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-full uppercase tracking-widest">
                  {getLocalizedMuscleName(m, language)}
                </span>
              ))}
            </div>
          )}
        </div>

        <MuscleMap />

        {selectedMuscles.length > 0 && (
          <div className="mt-12 animate-in slide-in-from-bottom-6 duration-500">
            <SpotlightButton onClick={() => setPhase('selection')} className="px-16 py-4 text-lg">
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
        <div className="flex justify-between items-end mb-12 border-b border-zinc-800 pb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
              {t('tracker_select_specific')}
            </h2>
            <div className="flex gap-2">
              {selectedMuscles.map(m => (
                <span key={m} className="text-[10px] text-teal-500 font-bold uppercase tracking-widest px-2 py-0.5 bg-teal-500/10 rounded">
                  {getLocalizedMuscleName(m, language)}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setPhase('setup')} className="text-xs text-zinc-500 hover:text-white uppercase tracking-widest font-bold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t('tracker_back')}
          </button>
        </div>

        <div className="space-y-12 mb-16">
          {selectedMuscles.map(muscle => (
            <div key={muscle} className="animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
                {getLocalizedMuscleName(muscle, language)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercisesByMuscle[muscle]?.map(ex => (
                  <label key={ex} className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all ${selectedExercises.includes(ex) ? 'bg-teal-500/10 border-teal-500/50 text-white shadow-[0_0_20px_rgba(20,184,166,0.05)]' : 'bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50'}`}>
                    <input
                      type="checkbox"
                      checked={selectedExercises.includes(ex)}
                      onChange={() => toggleExercise(ex)}
                      className="hidden"
                    />
                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedExercises.includes(ex) ? 'bg-teal-500 border-teal-500 text-black' : 'border-zinc-700'}`}>
                      {selectedExercises.includes(ex) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className="text-sm font-bold tracking-wide">{ex}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-8 bg-black/90 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 shadow-2xl flex items-center justify-between">
          <div className="hidden md:block">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{selectedExercises.length} Exercises Picked</div>
            <div className="text-xs text-zinc-400 max-w-[300px] truncate">{selectedExercises.join(', ')}</div>
          </div>
          <SpotlightButton onClick={handleStartWorkout} disabled={selectedExercises.length === 0} className="px-12 py-4">
            {t('tracker_start')}
          </SpotlightButton>
        </div>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 pb-32">
        <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 py-4 mb-8 px-4 rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <div className="text-4xl font-mono font-bold text-teal-400 leading-none">
                {mode === 'stopwatch' ? formatTime(duration) : formatTime(countdownRemaining || 0)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => { setMode('stopwatch'); setTimerActive(false); }}
                  className={`p-1.5 rounded transition-colors ${mode === 'stopwatch' ? 'bg-teal-500/10 text-teal-500' : 'text-zinc-500'}`}
                  title={t('clock_stopwatch')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button
                  onClick={() => { setMode('timer'); setTimerActive(false); }}
                  className={`p-1.5 rounded transition-colors ${mode === 'timer' ? 'bg-teal-500/10 text-teal-500' : 'text-zinc-500'}`}
                  title={t('clock_timer')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                {restRemaining !== null && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-orange-400 animate-pulse bg-orange-400/10 px-2 py-0.5 rounded ml-2">
                    {t('tracker_rest_timer')}: {restRemaining}s
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {mode === 'timer' && countdownRemaining === null && (
                <div className="flex items-center gap-2 mr-2">
                  <input
                    type="number"
                    value={countdownInput}
                    onChange={e => setCountdownInput(e.target.value)}
                    className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                    placeholder="Sec"
                  />
                  <button onClick={startTimerMode} className="p-1 px-3 bg-teal-600 rounded text-[10px] text-white font-bold">{t('timer_set')}</button>
                </div>
              )}

              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`p-2 rounded-lg border transition-all ${timerActive
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                  }`}
              >
                {timerActive ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
              </button>

              <button
                onClick={mode === 'stopwatch' ? addLap : undefined}
                disabled={!timerActive || mode !== 'stopwatch'}
                className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              <button onClick={resetCurrentTimer} className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>

              <SpotlightButton variant="secondary" onClick={finishWorkout} className="py-2 px-4 text-xs bg-red-900/20 text-red-200 ml-2">
                {t('tracker_finish')}
              </SpotlightButton>
            </div>
          </div>

          {mode === 'stopwatch' && laps.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {laps.map((time, i) => (
                <div key={i} className="flex-shrink-0 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-400 font-mono">
                  <span className="text-teal-500 mr-2">L{laps.length - i}</span> {formatTime(time)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8">
          {activeExercises.map((ex, exIdx) => (
            <Card key={exIdx} className="p-4 bg-zinc-900/40 border-zinc-800">
              <h3 className="text-xl font-extrabold text-white mb-4 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-teal-500 rounded-full"></span>
                {ex.name}
              </h3>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-zinc-500 mb-1 px-1 sm:px-2 font-black uppercase tracking-widest">
                  <div className="col-span-2">{t('tracker_header_set')}</div>
                  <div className="col-span-4">{t('tracker_header_kg')}</div>
                  <div className="col-span-4">{t('tracker_header_reps')}</div>
                  <div className="col-span-2 text-center">✓</div>
                </div>
                {ex.sets.map((set, setIdx) => (
                  <div key={set.id} className={`grid grid-cols-12 gap-1 sm:gap-2 items-center p-1.5 sm:p-2 rounded-lg transition-all ${set.completed ? 'bg-teal-500/10 border border-teal-500/20' : 'bg-black/40 border border-zinc-800/50'}`}>
                    <div className="col-span-2 text-zinc-500 font-mono text-center text-xs">{setIdx + 1}</div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        className="w-full bg-transparent text-white text-center outline-none"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        className="w-full bg-transparent text-white text-center outline-none"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${set.completed ? 'bg-teal-500 border-teal-500 text-black shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'border-zinc-700 hover:border-teal-500/50'}`}
                      >
                        {set.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addSet(exIdx)}
                  className="w-full py-2.5 mt-2 text-[10px] text-zinc-500 hover:text-teal-400 hover:bg-teal-500/5 rounded-xl border border-dashed border-zinc-800 transition-all font-black uppercase tracking-widest"
                >
                  + {t('tracker_add_set')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'summary' && completedWorkout) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center animate-in zoom-in duration-300">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20 mb-6 drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
          <svg className="h-10 w-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">{t('tracker_summary')}</h2>
        <p className="text-zinc-500 italic mb-12 text-lg">"{t('tracker_quote')}"</p>

        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
            <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">{t('tracker_duration')}</div>
            <div className="text-3xl font-mono text-teal-400">{formatTime(completedWorkout.durationSeconds)}</div>
          </div>
          <div className="p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 backdrop-blur">
            <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">{t('tracker_volume')}</div>
            <div className="text-3xl font-mono text-teal-400">{completedWorkout.totalVolume} kg</div>
          </div>
        </div>

        <SpotlightButton onClick={reset} className="px-16 py-4 text-lg">
          {t('tracker_start_new')}
        </SpotlightButton>
      </div>
    );
  }

  return null;
};