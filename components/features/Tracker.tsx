import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { CompletedWorkout, ActiveExercise, WorkoutSet } from '../../types';
import { getExerciseDatabase, getLocalizedMuscleName } from '../../utils/exerciseData';

export const Tracker: React.FC = () => {
  const { t, language } = useLanguage();
  const [phase, setPhase] = useState<'setup' | 'selection' | 'active' | 'summary'>('setup');
  // Changed to array
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  // Active Session State
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>([]);
  const [duration, setDuration] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [completedWorkout, setCompletedWorkout] = useState<CompletedWorkout | null>(null);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  // Dynamic DB
  const exercisesByMuscle = getExerciseDatabase(language);
  const selectableMuscles = Object.keys(exercisesByMuscle);

  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

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
    } else {
      setSelectedMuscles([...selectedMuscles, m]);
    }
  };

  const handleStartWorkout = () => {
    setPhase('active');
    setTimerActive(true);
    // Initialize data structure
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
    const fieldName = field as keyof WorkoutSet;
    const value = parseFloat(val) || 0;

    if (fieldName === 'weight' || fieldName === 'reps') {
      (newExs[exIdx].sets[setIdx] as any)[fieldName] = value;
    }
    setActiveExercises(newExs);
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const newExs = [...activeExercises];
    const isNowCompleted = !newExs[exIdx].sets[setIdx].completed;
    newExs[exIdx].sets[setIdx].completed = isNowCompleted;
    setActiveExercises(newExs);

    if (isNowCompleted) {
      setRestRemaining(90); // Default rest duration
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

    // Save to history
    const history = JSON.parse(localStorage.getItem('neuroLift_history') || '[]');
    localStorage.setItem('neuroLift_history', JSON.stringify([record, ...history]));

    setCompletedWorkout(record);
    setPhase('summary');
  };

  const reset = () => {
    setPhase('setup');
    setSelectedMuscles([]);
    setSelectedExercises([]);
    setDuration(0);
    setLaps([]);
    setCompletedWorkout(null);
    setRestRemaining(null);
    setTimerActive(false);
  };

  const addLap = () => {
    setLaps([duration, ...laps]);
  };

  const resetCurrentTimer = () => {
    if (window.confirm(t('timer_reset') + '?')) {
      setDuration(0);
      setLaps([]);
    }
  };


  const [mapView, setMapView] = useState<'front' | 'rear'>('front');

  const MuscleMap = () => {
    const frontMuscles = [
      { id: 'chest', path: 'M 100 80 Q 150 70 200 80 L 200 120 Q 150 130 100 120 Z' },
      { id: 'shoulders', path: 'M 70 80 Q 85 70 100 80 L 100 100 Q 85 110 70 100 Z M 200 80 Q 215 70 230 80 L 230 100 Q 215 110 200 100 Z' },
      { id: 'quads', path: 'M 110 200 L 145 200 L 145 300 L 110 300 Z M 155 200 L 190 200 L 190 300 L 155 300 Z' },
      { id: 'biceps', path: 'M 80 110 L 95 110 L 95 160 L 80 160 Z M 205 110 L 220 110 L 220 160 L 205 160 Z' },
    ];

    const rearMuscles = [
      { id: 'back', path: 'M 100 80 L 200 80 L 180 160 L 150 170 L 120 160 Z' },
      { id: 'glutes', path: 'M 115 175 L 145 175 L 145 210 L 115 210 Z M 155 175 L 185 175 L 185 210 L 155 210 Z' },
      { id: 'hamstrings', path: 'M 110 215 L 145 215 L 145 290 L 110 290 Z M 155 215 L 190 215 L 190 290 L 155 290 Z' },
      { id: 'calves', path: 'M 115 300 L 140 300 L 140 370 L 115 370 Z M 160 300 L 185 300 L 185 370 L 160 370 Z' },
    ];

    const activeMuscles = mapView === 'front' ? frontMuscles : rearMuscles;

    return (
      <div className="relative w-full max-w-[320px] mx-auto mb-12">
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setMapView('front')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mapView === 'front' ? 'bg-teal-500 text-black' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}
          >
            {t('tracker_front')}
          </button>
          <button
            onClick={() => setMapView('rear')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${mapView === 'rear' ? 'bg-teal-500 text-black' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}`}
          >
            {t('tracker_back')}
          </button>
        </div>

        <svg viewBox="0 0 300 400" className="w-full h-auto drop-shadow-[0_0_15px_rgba(20,184,166,0.1)]">
          {/* Simplified Body Outline */}
          <path
            d="M 150 20 C 130 20 120 40 120 60 L 120 70 C 100 75 80 80 70 100 L 60 180 L 80 180 L 90 120 L 110 120 L 110 380 L 145 380 L 145 250 L 155 250 L 155 380 L 190 380 L 190 120 L 210 120 L 220 180 L 240 180 L 230 100 C 220 80 200 75 180 70 L 180 60 C 180 40 170 20 150 20"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="2"
          />

          {/* Interactive Regions */}
          {activeMuscles.map(m => (
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
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{t('tracker_select_muscle')}</h2>
        <p className="text-zinc-500 text-sm mb-12 uppercase tracking-widest">Interactive Selection</p>

        <MuscleMap />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {selectableMuscles.map(m => (
            <button
              key={m}
              onClick={() => toggleMuscle(m)}
              className={`p-8 rounded-2xl border transition-all text-xl font-semibold 
                ${selectedMuscles.includes(m)
                  ? 'bg-teal-900/20 border-teal-500 text-white'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
            >
              {getLocalizedMuscleName(m, language)}
              {selectedMuscles.includes(m) && <span className="block text-xs text-teal-400 mt-2">✓ Selected</span>}
            </button>
          ))}
        </div>

        {selectedMuscles.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <SpotlightButton onClick={() => setPhase('selection')} className="px-12">
              Continue with {selectedMuscles.length} Groups
            </SpotlightButton>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'selection') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24">
        <h2 className="text-3xl font-bold text-white mb-6">
          {t('tracker_select_exercises')}
        </h2>

        <div className="space-y-8 mb-8">
          {selectedMuscles.map(muscle => (
            <div key={muscle} className="animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xl font-semibold text-teal-400 mb-4 border-b border-zinc-800 pb-2">{getLocalizedMuscleName(muscle, language)}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercisesByMuscle[muscle]?.map(ex => (
                  <label key={ex} className="flex items-center gap-4 p-4 border border-zinc-800 rounded-xl bg-zinc-900/30 cursor-pointer hover:bg-zinc-800 hover:border-teal-500/50 transition-all">
                    <input
                      type="checkbox"
                      checked={selectedExercises.includes(ex)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedExercises([...selectedExercises, ex]);
                        else setSelectedExercises(selectedExercises.filter(i => i !== ex));
                      }}
                      className="w-5 h-5 accent-teal-500 rounded border-zinc-700 bg-zinc-900"
                    />
                    <span className="text-sm font-medium text-zinc-200">{ex}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 sticky bottom-8 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-zinc-800">
          <SpotlightButton onClick={handleStartWorkout} disabled={selectedExercises.length === 0}>
            {t('tracker_start')} ({selectedExercises.length})
          </SpotlightButton>
          <button onClick={() => setPhase('setup')} className="px-6 py-3 text-zinc-400 hover:text-white">
            {t('tracker_back')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 pb-32">
        {/* Timer Sticky Header */}
        <div className="sticky top-16 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 py-4 mb-8 px-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <div className="text-4xl font-mono font-bold text-teal-400 leading-none">{formatTime(duration)}</div>
              {restRemaining !== null && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 animate-pulse mt-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('tracker_rest_timer')}: {restRemaining}{t('tracker_rest_sec')}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`p-2 rounded-lg border transition-all ${timerActive
                  ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                  }`}
                title={timerActive ? t('timer_stop') : t('timer_resume')}
              >
                {timerActive ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>

              <button
                onClick={addLap}
                disabled={!timerActive}
                className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-all"
                title={t('timer_lap')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              <button
                onClick={resetCurrentTimer}
                className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title={t('timer_reset')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>

              <SpotlightButton variant="secondary" onClick={finishWorkout} className="py-2 px-4 text-xs bg-red-900/20 border-red-900/50 hover:bg-red-400 text-red-200 hover:text-white transition-all ml-2">
                {t('tracker_finish')}
              </SpotlightButton>
            </div>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
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
            <Card key={exIdx} className="p-4">
              <h3 className="text-xl font-bold text-white mb-4">{ex.name}</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-zinc-500 mb-1 px-2">
                  <div className="col-span-2">{t('tracker_header_set')}</div>
                  <div className="col-span-4">{t('tracker_header_kg')}</div>
                  <div className="col-span-4">{t('tracker_header_reps')}</div>
                  <div className="col-span-2 text-center">✓</div>
                </div>
                {ex.sets.map((set, setIdx) => (
                  <div key={set.id} className={`grid grid-cols-12 gap-2 items-center p-2 rounded ${set.completed ? 'bg-teal-900/20' : 'bg-zinc-950'}`}>
                    <div className="col-span-2 text-zinc-400 font-mono text-center">{setIdx + 1}</div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-center"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="0"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white text-center"
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${set.completed ? 'bg-teal-500 border-teal-500 text-black' : 'border-zinc-600 hover:border-zinc-400'}`}
                      >
                        {set.completed && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addSet(exIdx)}
                  className="w-full py-2 mt-2 text-xs text-zinc-500 hover:text-teal-400 hover:bg-zinc-900 rounded border border-dashed border-zinc-800 transition-colors"
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
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/20 mb-6">
          <svg className="h-10 w-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">{t('tracker_summary')}</h2>
        <p className="text-zinc-400 italic mb-8">"{t('tracker_quote')}"</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="text-zinc-500 text-sm mb-1">{t('tracker_duration')}</div>
            <div className="text-2xl font-mono text-white">{formatTime(completedWorkout.durationSeconds)}</div>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <div className="text-zinc-500 text-sm mb-1">{t('tracker_volume')}</div>
            <div className="text-2xl font-mono text-white">{completedWorkout.totalVolume} kg</div>
          </div>
        </div>

        <SpotlightButton onClick={reset} className="px-12">
          {t('tracker_start_new')}
        </SpotlightButton>
      </div>
    );
  }

  return null;
};