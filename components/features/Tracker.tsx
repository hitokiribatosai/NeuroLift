import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { CompletedWorkout, ActiveExercise, WorkoutSet } from '../../types';
import { getExerciseDatabase, getLocalizedMuscleName, getMuscleForExercise, getExerciseLinks } from '../../utils/exerciseData';
import { useClock } from '../../contexts/ClockContext';
import { playNotificationSound } from '../../utils/audio';
import { ConfirmModal } from '../ui/ConfirmModal';
import { generateId } from '../../utils/id';
import { safeStorage } from '../../utils/storage';
import { App as CapApp } from '@capacitor/app';
import { Modal } from '../ui/Modal';

export const Tracker: React.FC = () => {
  const { t, language } = useLanguage();
  const [phase, setPhase] = useState<'setup' | 'selection' | 'active' | 'summary'>(() => {
    const saved = safeStorage.getItem('neuroLift_tracker_phase');
    const validPhases = ['setup', 'selection', 'active', 'summary'];
    return (saved && validPhases.includes(saved)) ? (saved as any) : 'setup';
  });
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(() => {
    return safeStorage.getParsed<string[]>('neuroLift_tracker_muscles', []);
  });
  const [selectedExercises, setSelectedExercises] = useState<string[]>(() => {
    return safeStorage.getParsed<string[]>('neuroLift_tracker_selected_exercises', []);
  });
  const [tutorialExercise, setTutorialExercise] = useState<string | null>(null);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [barWeight, setBarWeight] = useState<number>(20);
  const [activeSetInfo, setActiveSetInfo] = useState<{ exIdx: number, setIdx: number } | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);


  // Active Session State
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>(() => {
    return safeStorage.getParsed<ActiveExercise[]>('neuroLift_tracker_active_exercises', []);
  });
  const [completedWorkout, setCompletedWorkout] = useState<CompletedWorkout | null>(null);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  // Use Global Clock for Workout Session
  const {
    mode, setMode,
    timerActive, setTimerActive,
    duration, setDuration,
    countdownRemaining,
    countdownMinutes, setCountdownMinutes,
    countdownSeconds, setCountdownSeconds,
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
      playNotificationSound();
    }
    return () => clearInterval(interval);
  }, [restRemaining]);

  // Handle Shared Workouts from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        if (Array.isArray(decoded)) {
          setSelectedExercises(decoded);
          // Infer muscles from exercises
          const musclesToSelect = new Set<string>();
          Object.entries(exercisesByMuscle).forEach(([muscle, subCats]) => {
            Object.values(subCats).forEach(categories => {
              Object.values(categories).forEach(exercises => {
                exercises.forEach(ex => {
                  if (decoded.includes(ex)) musclesToSelect.add(muscle);
                });
              });
            });
          });
          setSelectedMuscles(Array.from(musclesToSelect));
          setPhase('selection');

          // Clear URL parameter without refreshing
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (e) {
        console.error("Failed to decode shared workout", e);
      }
    }
  }, []);

  // Safety Check: If in active phase but no active exercises, reset to selection
  useEffect(() => {
    if (phase === 'active' && activeExercises.length === 0) {
      setPhase('selection');
    }
  }, [phase, activeExercises]);

  // Safety Check: If in summary phase but no workout data, reset to setup
  useEffect(() => {
    if (phase === 'summary' && !completedWorkout) {
      setPhase('setup');
    }
  }, [phase, completedWorkout]);

  useEffect(() => {
    safeStorage.setItem('neuroLift_tracker_phase', phase);
    safeStorage.setItem('neuroLift_tracker_muscles', JSON.stringify(selectedMuscles));
    safeStorage.setItem('neuroLift_tracker_selected_exercises', JSON.stringify(selectedExercises));
    safeStorage.setItem('neuroLift_tracker_active_exercises', JSON.stringify(activeExercises));
  }, [phase, selectedMuscles, selectedExercises, activeExercises]);

  // Sync Phase with URL & Handle Back Navigation
  useEffect(() => {
    // 1. Handle Web Back Button (PopState)
    const handlePopState = () => {
      // Check if we are still in tracker view
      const hash = window.location.hash;
      if (!hash.startsWith('#tracker')) return;

      const params = new URLSearchParams(hash.split('?')[1]);
      const urlPhase = params.get('phase');
      const validPhases = ['setup', 'selection', 'active', 'summary'];

      if (urlPhase && validPhases.includes(urlPhase) && urlPhase !== phase) {
        setPhase(urlPhase as any);
      } else if (!urlPhase && phase !== 'setup') {
        // If no phase param, assume setup (root of tracker)
        setPhase('setup');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 2. Handle Android Hardware Back Button
    let backListener: any;
    const setupBackListener = async () => {
      backListener = await CapApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
        if (phase === 'active') {
          // If active, go back to selection (or maybe warn user? For now just go back)
          // Better UX: Show confirm modal? User asked to "go back to add more devices" (selection)
          setPhase('selection');
          // Update URL to match
          window.history.replaceState(null, '', '#tracker?phase=selection');
        } else if (phase === 'selection') {
          setPhase('setup');
          window.history.replaceState(null, '', '#tracker?phase=setup');
        } else if (phase === 'summary') {
          // Summary -> Home or Setup? Usually Setup to start new.
          setPhase('setup');
          window.history.replaceState(null, '', '#tracker?phase=setup');
        } else {
          // We are in 'setup'. Let default happen (likely go Home via App.tsx routing or exit app)
          // If we want to force go to Home:
          if (window.location.hash.includes('tracker')) {
            window.history.back(); // Let browser handle "back to home"
          } else if (canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        }
      });
    };
    setupBackListener();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (backListener) backListener.remove();
    };
  }, [phase]);

  // Update URL when phase changes (Forward Navigation)
  // We use a ref to track if the phase change was driven by popstate to avoid double pushing
  // But strictly, we can just replaceState if we want to stay on "tracker" view but change params
  // The user wants "Return" to work like back button.
  // So when we transition Setup -> Selection normally, we MUST push state.
  useEffect(() => {
    const currentHash = window.location.hash;
    const targetHash = `#tracker?phase=${phase}`;

    // Check if URL needs update
    if (!currentHash.includes(`phase=${phase}`)) {
      // Using pushState creates a history entry, so "Back" will work
      window.history.pushState({ phase }, '', targetHash);
    }
  }, [phase]);

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

    // Merge logic: Preserve existing active exercises data
    const newActiveExercises: ActiveExercise[] = selectedExercises.map(name => {
      const existing = activeExercises.find(a => a.name === name);
      if (existing) return existing;
      return {
        name,
        sets: [{ id: generateId(), weight: 0, reps: 0, completed: false }]
      };
    });

    setActiveExercises(newActiveExercises);

    // Only reset/start timer if this is a fresh start (duration is 0)
    if (duration === 0 && !timerActive) {
      setTimerActive(true);
      setMode('stopwatch');
      setDuration(0);
    } else if (!timerActive) {
      // Resume timer if it was paused? Or just ensure we satisfy user intent.
      // If user comes back, likely wants to continue.
      setTimerActive(true);
    }
  };

  const addSet = (exerciseIndex: number) => {
    const newExs = [...activeExercises];
    newExs[exerciseIndex].sets.push({
      id: generateId(),
      weight: 0,
      reps: 0,
      completed: false
    });
    setActiveExercises(newExs);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof WorkoutSet, val: string) => {
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

    const muscleNames = selectedMuscles.map(m => getLocalizedMuscleName(m, language));
    const sessionName = muscleNames.length > 0
      ? muscleNames.join(' & ')
      : t('tracker_summary');

    const record: CompletedWorkout = {
      id: generateId(),
      date: new Date().toLocaleDateString(),
      name: sessionName,
      durationSeconds: duration,
      exercises: activeExercises,
      totalVolume: volume
    };

    const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []);
    safeStorage.setItem('neuroLift_history', JSON.stringify([record, ...history]));

    setCompletedWorkout(record);
    setPhase('summary');
    // Clear persistence on completion
    safeStorage.removeItem('neuroLift_tracker_phase');
    safeStorage.removeItem('neuroLift_tracker_muscles');
    safeStorage.removeItem('neuroLift_tracker_selected_exercises');
    safeStorage.removeItem('neuroLift_tracker_active_exercises');
    resetClock();
  };

  const reset = () => {
    setPhase('setup');
    setSelectedMuscles([]);
    setSelectedExercises([]);
    setCompletedWorkout(null);
    setRestRemaining(null);
    setTimerActive(false);
    // Clear persistence on reset
    safeStorage.removeItem('neuroLift_tracker_phase');
    safeStorage.removeItem('neuroLift_tracker_muscles');
    safeStorage.removeItem('neuroLift_tracker_selected_exercises');
    safeStorage.removeItem('neuroLift_tracker_active_exercises');
    resetClock();
  };

  const resetCurrentTimer = () => {
    setShowResetConfirm(true);
  };

  const startTimerMode = () => {
    const mins = parseInt(countdownMinutes) || 0;
    const secs = parseInt(countdownSeconds) || 0;
    if (mins > 0 || secs > 0) {
      startTimer(mins, secs);
    }
  };

  const handleShareWorkout = () => {
    try {
      const encoded = btoa(JSON.stringify(selectedExercises));
      const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}${window.location.hash}`;
      navigator.clipboard.writeText(shareUrl);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 2000);
    } catch (e) {
      console.error("Failed to generate share link", e);
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
          <h2 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-tight">{t('tracker_select_muscle')}</h2>
          <div className="h-1.5 w-24 bg-teal-500 mx-auto rounded-full mb-8"></div>

          {selectedMuscles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-4 animate-in fade-in zoom-in duration-300">
              {selectedMuscles.map(m => (
                <span key={m} className="px-5 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[0.625rem] font-black rounded-full uppercase tracking-[0.2em] shadow-sm">
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
              <span className={`text-xl font-black text-left transition-colors ${selectedMuscles.includes(muscle) ? 'text-white' : 'text-zinc-100'}`}>
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
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
              {t('tracker_summary')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedMuscles.map(m => (
                <span key={m} className="text-[0.625rem] text-teal-300 dark:text-teal-300 font-bold uppercase tracking-widest px-2 py-0.5 bg-teal-500/10 rounded shadow-sm">
                  {getLocalizedMuscleName(m, language)}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPhase('setup')} className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest font-black flex items-center gap-2 transition-colors">
              <svg className="w-4 h-4 text-teal-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {t('tracker_back')}
            </button>

            <button
              onClick={handleShareWorkout}
              disabled={selectedExercises.length === 0}
              className={`text-xs uppercase tracking-widest font-black flex items-center gap-2 transition-all px-3 py-1.5 rounded-xl border ${shareFeedback
                ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                : 'text-zinc-500 hover:text-white border-zinc-800 hover:border-teal-500/50'
                }`}
            >
              <svg className={`w-4 h-4 ${shareFeedback ? 'text-teal-500' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {shareFeedback ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                )}
              </svg>
              {shareFeedback ? t('save') : 'Share Plan'}
            </button>
          </div>

        </div>

        <div className="space-y-20 mb-32">
          {selectedMuscles.map(majorMuscle => (
            <div key={majorMuscle} className="space-y-12">
              {/* Show Major Group Header */}
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                <span className="w-4 h-12 bg-teal-500 rounded-full"></span>
                {getLocalizedMuscleName(majorMuscle, language)}
              </h3>

              {/* Render functional sub-groups */}
              {Object.keys(exercisesByMuscle[majorMuscle] || {}).map(subGroup => (
                <div key={subGroup} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="text-xl font-black text-zinc-200 mb-8 uppercase tracking-widest flex items-center gap-4 ml-4">
                    <span className="w-1.5 h-6 bg-teal-500/50 rounded-full"></span>
                    {getLocalizedMuscleName(subGroup, language)}
                  </h4>

                  <div className="space-y-12 ml-4">
                    {(['machines', 'weightlifting', 'cables', 'bodyweight'] as const).map(category => {
                      const exercises = exercisesByMuscle[majorMuscle]?.[subGroup]?.[category] || [];
                      if (exercises.length === 0) return null;

                      return (
                        <div key={category}>
                          <h5 className="text-[0.625rem] font-black text-zinc-100 uppercase tracking-[0.4em] mb-6 ml-1 flex items-center gap-4">
                            {category}
                            <div className="h-px flex-1 bg-zinc-800"></div>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {exercises.map(ex => (
                              <div key={ex} className="relative group">
                                <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${selectedExercises.includes(ex)
                                  ? 'bg-teal-500/5 border-teal-500 shadow-md text-teal-600 dark:text-teal-400'
                                  : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                                  <input
                                    type="checkbox"
                                    checked={selectedExercises.includes(ex)}
                                    onChange={() => toggleExercise(ex)}
                                    className="hidden"
                                  />
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedExercises.includes(ex) ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' : 'border-zinc-700'}`}>
                                    {selectedExercises.includes(ex) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <span className="text-sm font-black tracking-wide flex-1 uppercase pr-10 rtl:pr-0 rtl:pl-10">{ex}</span>
                                </label>

                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTutorialExercise(ex);
                                  }}
                                  className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-teal-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10"
                                  title={t('modal_watch_video')}
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

        <div className="sticky bottom-6 bg-black/80 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl flex items-center justify-between z-40">
          <div className="hidden md:block">
            <div className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.3em] mb-1">{selectedExercises.length} Exercises Picked</div>
            <div className="text-sm text-zinc-200 font-bold max-w-[400px] truncate">{selectedExercises.join(', ')}</div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            {activeExercises.length > 0 && (
              <button
                onClick={() => setPhase('active')}
                className="flex-1 md:flex-none px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-colors border border-zinc-800 rounded-2xl"
              >
                {t('tracker_back')}
              </button>
            )}
            <SpotlightButton onClick={handleStartWorkout} disabled={selectedExercises.length === 0} className="flex-1 md:flex-none px-16 py-5 text-lg font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">
              {activeExercises.length > 0 ? 'Resume' : t('tracker_start')}
            </SpotlightButton>
          </div>
        </div>

        {/* Tutorial Modal */}
        <Modal isOpen={!!tutorialExercise} onClose={() => setTutorialExercise(null)}>
          {tutorialExercise && (() => {
            const links = getExerciseLinks(tutorialExercise);
            return (
              <div className="relative w-full rounded-[3rem] border border-zinc-800 bg-zinc-950 p-10 shadow-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
                <button
                  onClick={() => setTutorialExercise(null)}
                  className="absolute right-8 top-8 text-zinc-400 hover:text-white transition-colors"
                  title={t('modal_close')}
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-3 h-10 bg-teal-500 rounded-full"></div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight pr-10">
                    {tutorialExercise}
                  </h3>
                </div>

                <a
                  href={links.tutorial}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-video w-full rounded-2xl bg-black/60 mb-10 overflow-hidden relative group border border-zinc-800 shadow-inner"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover:scale-105 duration-500">
                    <div className="w-20 h-20 rounded-full bg-teal-500/10 dark:bg-teal-500/20 border-2 border-teal-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 backdrop-blur-sm shadow-xl">
                      <svg className="h-10 w-10 text-teal-400 ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <p className="text-xs text-teal-500 font-black uppercase tracking-[0.3em]">{t('modal_watch_video')}</p>
                  </div>
                </a>

                <div className="flex flex-col gap-4">
                  <a
                    href={links.science}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                  >
                    <SpotlightButton className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20">
                      🔬 Learn the Science
                    </SpotlightButton>
                  </a>
                  <a
                    href={links.tutorial}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                  >
                    <button className="w-full py-4 text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-[0.3em] transition-all border border-zinc-800 rounded-2xl bg-zinc-900/40">
                      {t('modal_watch_video')}
                    </button>
                  </a>
                  <button
                    onClick={() => setTutorialExercise(null)}
                    className="w-full py-2 text-[10px] text-zinc-600 hover:text-rose-500 font-black uppercase tracking-[0.3em] transition-all"
                  >
                    {t('modal_close')}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-20 pb-40">
        <div className="sticky top-0 z-50 -mx-6 mb-8 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-6 ring-1 ring-white/5" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                {mode === 'timer' && countdownRemaining === null ? (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                    <input
                      type="number"
                      value={countdownMinutes}
                      onChange={(e) => setCountdownMinutes(e.target.value.slice(-2))}
                      placeholder="00"
                      className="w-14 md:w-16 bg-zinc-900 border-b-2 border-teal-500/30 py-1 text-3xl md:text-4xl font-mono font-black text-white text-center outline-none focus:border-teal-500 focus:bg-teal-500/5 transition-all"
                    />
                    <span className="text-2xl font-black text-zinc-700">:</span>
                    <input
                      type="number"
                      value={countdownSeconds}
                      onChange={(e) => setCountdownSeconds(e.target.value.slice(-2))}
                      placeholder="00"
                      className="w-14 md:w-16 bg-zinc-900 border-b-2 border-teal-500/30 py-1 text-3xl md:text-4xl font-mono font-black text-white text-center outline-none focus:border-teal-500 focus:bg-teal-500/5 transition-all"
                    />
                    <button
                      onClick={startTimerMode}
                      className="ml-2 w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 active:scale-90 transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl md:text-5xl font-mono font-black text-teal-400 leading-none tracking-tighter">
                      {mode === 'stopwatch' ? formatTime(duration) : formatTime(countdownRemaining || 0)}
                    </div>
                    {/* Add Exercise Button moved here to keep header clean */}
                    <button
                      onClick={() => setPhase('selection')}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-teal-400 transition-colors shadow-sm"
                      title={t('tracker_select_exercises')}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => { setMode('stopwatch'); setTimerActive(false); }}
                  className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${mode === 'stopwatch' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  {t('clock_stopwatch')}
                </button>
                <button
                  onClick={() => { setMode('timer'); setTimerActive(false); }}
                  className={`px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest transition-all ${mode === 'timer' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                >
                  {t('clock_timer')}
                </button>
                {restRemaining !== null && (
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-orange-400 animate-pulse bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {restRemaining}s
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              {(countdownRemaining !== null || mode === 'stopwatch') && (
                <button
                  onClick={() => setTimerActive(!timerActive)}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 transition-all duration-300 shadow-lg flex items-center justify-center ${timerActive
                    ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20'
                    : 'bg-teal-500 text-white border-teal-400 shadow-teal-500/20'
                    }`}
                >
                  {timerActive ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
                </button>
              )}

              {/* Lap/Reset Row */}
              <div className="flex gap-1.5">
                <button
                  onClick={mode === 'stopwatch' ? addLap : undefined}
                  disabled={!timerActive || mode !== 'stopwatch'}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 bg-zinc-900/50 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>

                <button onClick={resetCurrentTimer} className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-zinc-800 text-zinc-500 hover:text-rose-500 transition-colors bg-zinc-900/50 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>

              <SpotlightButton
                variant="secondary"
                onClick={finishWorkout}
                spotlightColor="rgba(244, 63, 94, 0.2)"
                className="h-[48px] md:h-[56px] px-4 md:px-6 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border-rose-500/20 ml-1 shadow-lg shadow-rose-500/10"
              >
                {t('tracker_finish')}
              </SpotlightButton>
            </div>
          </div>

          {mode === 'stopwatch' && laps.length > 0 && (
            <div className="flex gap-3 overflow-x-auto mt-6 pb-2 scrollbar-hide border-t border-zinc-900 pt-5">
              {laps.map((time, i) => (
                <div key={i} className="flex-shrink-0 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full text-[11px] text-zinc-400 font-mono shadow-sm">
                  <span className="text-teal-400 font-black mr-2">LAP {laps.length - i}</span> {formatTime(time)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-12">
          {activeExercises.map((ex, exIdx) => (
            <Card key={exIdx} className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[3rem] shadow-sm overflow-hidden">
              <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
                <span className="w-2.5 h-8 bg-teal-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                {ex.name}
                <button
                  onClick={() => setTutorialExercise(ex.name)}
                  className="ml-auto p-2 text-zinc-600 hover:text-teal-400 transition-colors"
                  title={t('modal_watch_video')}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-3 text-[10px] text-zinc-300 mb-2 px-4 font-black uppercase tracking-[0.3em]">
                  <div className="col-span-2 text-center">{t('tracker_header_set')}</div>
                  <div className="col-span-4 text-center">{t('tracker_header_kg')}</div>
                  <div className="col-span-4 text-center">{t('tracker_header_reps')}</div>
                  <div className="col-span-2 text-center">✓</div>
                </div>
                {ex.sets.map((set, setIdx) => {
                  const isCardio = getMuscleForExercise(ex.name) === 'Cardio';

                  return (
                    <div key={set.id} className={`grid grid-cols-12 gap-3 items-center p-4 rounded-3xl transition-all duration-300 border-2 ${set.completed
                      ? 'bg-teal-500/5 border-teal-500 shadow-md transform scale-[1.01]'
                      : 'bg-black/40 border-zinc-800 shadow-sm'}`}>
                      <div className="col-span-2 text-zinc-600 font-black font-mono text-lg text-center">{setIdx + 1}</div>

                      {isCardio ? (
                        <>
                          <div className="col-span-4">
                            <input
                              type="number"
                              placeholder="Min"
                              value={set.durationSeconds ? Math.floor(set.durationSeconds / 60) : ''}
                              onChange={(e) => {
                                const mins = parseInt(e.target.value) || 0;
                                const currentSeconds = (set.durationSeconds || 0) % 60;
                                updateSet(exIdx, setIdx, 'durationSeconds', (mins * 60 + currentSeconds).toString());
                              }}
                              className={`w-full bg-transparent text-center outline-none text-xl font-black font-mono ${set.completed ? 'text-teal-400' : 'text-white'}`}
                            />
                            <div className="text-[8px] text-center text-zinc-500 uppercase font-black">Min</div>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              placeholder="KM"
                              step="0.1"
                              value={set.distanceKm || ''}
                              onChange={(e) => updateSet(exIdx, setIdx, 'distanceKm', e.target.value)}
                              className={`w-full bg-transparent text-center outline-none text-xl font-black font-mono ${set.completed ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-900 dark:text-white'}`}
                            />
                            <div className="text-[8px] text-center text-zinc-500 uppercase font-black">KM</div>
                          </div>
                        </>
                      ) : (
                        <>
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
                            <div className="text-[8px] text-center text-zinc-500 uppercase font-black">KG</div>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              placeholder="0"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                              className={`w-full bg-transparent text-center outline-none text-xl font-black font-mono ${set.completed ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-900 dark:text-white'}`}
                            />
                            <div className="text-[8px] text-center text-zinc-500 uppercase font-black">Reps</div>
                          </div>
                        </>
                      )}

                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => toggleSetComplete(exIdx, setIdx)}
                          className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${set.completed ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30 rotate-0' : 'border-zinc-700 hover:border-teal-500/50'}`}
                        >
                          {set.completed && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
        <Modal isOpen={activeSetInfo !== null} onClose={() => setActiveSetInfo(null)}>
          {activeSetInfo !== null && (
            <div className="relative w-full max-w-md mx-auto rounded-[3.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-10 shadow-3xl">
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
          )}
        </Modal>

        {/* Tutorial Modal (Active Phase) */}
        <Modal isOpen={!!tutorialExercise} onClose={() => setTutorialExercise(null)}>
          {tutorialExercise && (() => {
            const links = getExerciseLinks(tutorialExercise);
            return (
              <div className="relative w-full max-w-xl mx-auto rounded-[3rem] border border-zinc-800 bg-zinc-950 p-10 shadow-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
                <button
                  onClick={() => setTutorialExercise(null)}
                  className="absolute right-8 top-8 text-zinc-400 hover:text-white transition-colors"
                  title={t('modal_close')}
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-3 h-10 bg-teal-500 rounded-full"></div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight pr-10">
                    {tutorialExercise}
                  </h3>
                </div>

                <a
                  href={links.tutorial}
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-video w-full rounded-2xl bg-black/60 mb-10 overflow-hidden relative group border border-zinc-800 shadow-inner"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover:scale-105 duration-500">
                    <div className="w-20 h-20 rounded-full bg-teal-500/10 dark:bg-teal-500/20 border-2 border-teal-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 backdrop-blur-sm shadow-xl">
                      <svg className="h-10 w-10 text-teal-400 ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <p className="text-xs text-teal-500 font-black uppercase tracking-[0.3em]">{t('modal_watch_video')}</p>
                  </div>
                </a>

                <div className="flex flex-col gap-4">
                  <a
                    href={links.science}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                  >
                    <SpotlightButton className="w-full py-5 text-sm font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-500/20">
                      🔬 Learn the Science
                    </SpotlightButton>
                  </a>
                  <a
                    href={links.tutorial}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full"
                  >
                    <button className="w-full py-4 text-[10px] text-zinc-500 hover:text-white font-black uppercase tracking-[0.3em] transition-all border border-zinc-800 rounded-2xl bg-zinc-900/40">
                      {t('modal_watch_video')}
                    </button>
                  </a>
                  <button
                    onClick={() => setTutorialExercise(null)}
                    className="w-full py-2 text-[10px] text-zinc-600 hover:text-rose-500 font-black uppercase tracking-[0.3em] transition-all"
                  >
                    {t('modal_close')}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>

        <ConfirmModal
          isOpen={showResetConfirm}
          title={t('confirm_title')}
          message={t('confirm_reset_timer')}
          confirmLabel={t('confirm_yes')}
          cancelLabel={t('confirm_cancel')}
          onConfirm={() => {
            resetClock();
            setShowResetConfirm(false);
          }}
          onCancel={() => setShowResetConfirm(false)}
          isDestructive={true}
        />
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