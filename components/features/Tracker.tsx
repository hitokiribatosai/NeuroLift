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
    setCompletedWorkout(null);
    setRestRemaining(null);
  };

  const MuscleMap = () => {
    const muscles = [
      { id: 'chest', path: 'M 100 80 Q 150 70 200 80 L 200 120 Q 150 130 100 120 Z', label: 'Chest' },
      { id: 'shoulders', path: 'M 70 80 Q 85 70 100 80 L 100 100 Q 85 110 70 100 Z M 200 80 Q 215 70 230 80 L 230 100 Q 215 110 200 100 Z', label: 'Shoulders' },
      { id: 'quads', path: 'M 110 200 L 145 200 L 145 300 L 110 300 Z M 155 200 L 190 200 L 190 300 L 155 300 Z', label: 'Quads' },
      { id: 'biceps', path: 'M 80 110 L 95 110 L 95 160 L 80 160 Z M 205 110 L 220 110 L 220 160 L 205 160 Z', label: 'Arms' },
    ];

    return (
      <div className="relative w-full max-w-[300px] mx-auto mb-12 group">
        <svg viewBox="0 0 300 400" className="w-full h-auto drop-shadow-[0_0_15px_rgba(20,184,166,0.1)]">
          {/* Simplified Body Outline */}
          <path
            d="M 150 20 C 130 20 120 40 120 60 L 120 70 C 100 75 80 80 70 100 L 60 180 L 80 180 L 90 120 L 110 120 L 110 380 L 145 380 L 145 250 L 155 250 L 155 380 L 190 380 L 190 120 L 210 120 L 220 180 L 240 180 L 230 100 C 220 80 200 75 180 70 L 180 60 C 180 40 170 20 150 20"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="2"
          />

          {/* Interactive Regions */}
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
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-zinc-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
          Interactive Muscle Map
        </div>
      </div>
    );
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-white mb-8">{t('tracker_select_muscle')}</h2>

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
        <div className="sticky top-16 z-40 bg-black/90 backdrop-blur border-b border-zinc-800 py-4 mb-8 flex justify-between items-center px-2">
          <div className="flex flex-col">
            <div className="text-3xl font-mono font-bold text-teal-400">{formatTime(duration)}</div>
            {restRemaining !== null && (
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 animate-pulse">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('tracker_rest_timer')}: {restRemaining}{t('tracker_rest_sec')}
              </div>
            )}
          </div>
          <SpotlightButton variant="secondary" onClick={finishWorkout} className="py-1 px-4 text-xs bg-red-900/20 border-red-900/50 hover:bg-red-900/40 text-red-200">
            {t('tracker_finish')}
          </SpotlightButton>
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