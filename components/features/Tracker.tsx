import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { CompletedWorkout, ActiveExercise, WorkoutSet, WorkoutTemplate } from '../../types';
import { getExerciseDatabase, getLocalizedMuscleName, getMuscleForExercise, getExerciseTranslation, getExerciseLinks } from '../../utils/exerciseData';
import { useClock } from '../../contexts/ClockContext';
import { playNotificationSound } from '../../utils/audio';
import { ConfirmModal } from '../ui/ConfirmModal';
import { Tooltip } from '../ui/Tooltip';
import { generateId } from '../../utils/id';
import { safeStorage } from '../../utils/storage';
import { useTooltip } from '../../hooks/useTooltip';
import { firestoreService } from '../../utils/firestoreService';
import { authService } from '../../utils/authService';
import { App as CapApp } from '@capacitor/app';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { hapticFeedback } from '../../utils/haptics';
import { exerciseHistoryService } from '../../utils/exerciseHistory';

export const Tracker: React.FC = () => {
  const { t, language } = useLanguage();
  const [phase, setPhase] = useState<'setup' | 'selection' | 'active' | 'summary'>(() => {
    const saved = safeStorage.getItem('neuroLift_tracker_phase');
    const validPhases = ['setup', 'selection', 'active', 'summary'];
    return (saved && validPhases.includes(saved)) ? (saved as any) : 'setup';
  });

  // Tooltip hooks
  const muscleSelectorTooltip = useTooltip('tracker_muscle_selector');
  const muscleSelectorRef = useRef<HTMLDivElement>(null);
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
  const [exerciseHistory, setExerciseHistory] = useState<Map<string, any>>(new Map());
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateDeleteConfirm, setTemplateDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<{ name: string, index: number } | null>(null);

  // Independent rest timer (separate from global clock)
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimerRemaining, setRestTimerRemaining] = useState<number | null>(null);

  const confirmDeleteExercise = () => {
    if (exerciseToDelete) {
      const newExs = activeExercises.filter((_, i) => i !== exerciseToDelete.index);
      setActiveExercises(newExs);

      const newSelected = selectedExercises.filter(name => name !== exerciseToDelete.name);
      setSelectedExercises(newSelected);

      hapticFeedback.medium();
      setExerciseToDelete(null);
    }
  };


  // Load history when selected exercises change
  useEffect(() => {
    const loadHistory = async () => {
      const historyMap = new Map();
      for (const exercise of selectedExercises) {
        const history = await exerciseHistoryService.getExerciseHistory(exercise);
        if (history) {
          historyMap.set(exercise, history);
        }
      }
      setExerciseHistory(historyMap);
    };

    if (selectedExercises.length > 0) {
      loadHistory();
    }
  }, [selectedExercises]);


  // Active Session State
  const [completedWorkout, setCompletedWorkout] = useState<CompletedWorkout | null>(null);
  const [direction, setDirection] = useState(0);

  const phaseOrder = ['setup', 'selection', 'active', 'summary'];

  // Use Global Clock for Workouts
  const {
    mode, setMode,
    timerActive, setTimerActive,
    duration, setDuration,
    countdownRemaining,
    countdownMinutes, setCountdownMinutes,
    countdownSeconds, setCountdownSeconds,
    laps, addLap,
    resetClock,
    startTimer,
    restRemaining,
    setRestRemaining
  } = useClock();

  // Active Exercises as separate effect to avoid context lag if needed, or just keep in useClock
  // but for now let's use the one from Tracker to keep logic separate
  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>(() => {
    return safeStorage.getParsed<ActiveExercise[]>('neuroLift_tracker_active_exercises', []);
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic DB
  const exercisesByMuscle = getExerciseDatabase(language);
  const selectableMuscles = Object.keys(exercisesByMuscle);

  // Notification logic is now partially in ClockContext
  // but we still trigger the rest start here

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

  // Handle Quick Start from Dashboard
  useEffect(() => {
    const quickStartMuscles = sessionStorage.getItem('quickStartMuscles');
    if (quickStartMuscles) {
      try {
        const muscles = JSON.parse(quickStartMuscles);
        setSelectedMuscles(muscles);
        setPhase('selection');
        // Clear the session storage
        sessionStorage.removeItem('quickStartMuscles');
      } catch (e) {
        console.error("Failed to parse quick start muscles", e);
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

  // Load Templates
  useEffect(() => {
    const fetchTemplates = async () => {
      const savedTemplates = await safeStorage.getTemplates();
      setTemplates(savedTemplates);
    };
    fetchTemplates();
  }, []);


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
        const oldIdx = phaseOrder.indexOf(phase);
        const newIdx = phaseOrder.indexOf(urlPhase);
        setDirection(newIdx < oldIdx ? -1 : 1);
        setPhase(urlPhase as any);
      } else if (!urlPhase && phase !== 'setup') {
        setDirection(-1);
        setPhase('setup');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 2. Handle Android Hardware Back Button
    const backListenerPromise = CapApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
      if (phase === 'active') {
        setPhase('selection');
        window.history.replaceState(null, '', '#tracker?phase=selection');
      } else if (phase === 'selection') {
        setPhase('setup');
        window.history.replaceState(null, '', '#tracker?phase=setup');
      } else if (phase === 'summary') {
        setPhase('setup');
        window.history.replaceState(null, '', '#tracker?phase=setup');
      } else {
        if (window.location.hash.includes('tracker')) {
          window.history.back();
        } else if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      }
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      backListenerPromise.then(l => l.remove());
    };
  }, [phase]);

  // Update URL when phase changes (Forward Navigation)
  useEffect(() => {
    const currentHash = window.location.hash;
    const targetHash = `#tracker?phase=${phase}`;

    if (!currentHash.includes(`phase=${phase}`)) {
      const oldIdx = phaseOrder.indexOf(phase);
      window.history.pushState({ phase }, '', targetHash);
    }
  }, [phase]);

  const handleSetPhase = (newPhase: 'setup' | 'selection' | 'active' | 'summary') => {
    const oldIdx = phaseOrder.indexOf(phase);
    const newIdx = phaseOrder.indexOf(newPhase);
    setDirection(newIdx < oldIdx ? -1 : 1);
    setPhase(newPhase);
  };

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

  const toggleExercise = (ex: string) => {
    if (selectedExercises.includes(ex)) {
      setSelectedExercises(selectedExercises.filter(i => i !== ex));
    } else {
      setSelectedExercises([...selectedExercises, ex]);
    }
  };

  const handleStartWorkout = () => {
    handleSetPhase('active');

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
      setTimerActive(true);
    }
  };

  const handleQuickLoad = async (exerciseIndex: number, exerciseName: string) => {
    const suggestion = await exerciseHistoryService.getProgressiveOverloadSuggestion(exerciseName);

    if (suggestion) {
      const newActiveExercises = [...activeExercises];
      // Ensure sets have unique IDs
      const uniqueSets = suggestion.suggestedSets.map((s: any, i: number) => ({
        ...s,
        id: generateId(),
        completed: false
      }));

      newActiveExercises[exerciseIndex].sets = uniqueSets;
      setActiveExercises(newActiveExercises);

      hapticFeedback.success(); // Feedback
    }
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeExercises[exerciseIndex]) return;
    const newExs = [...activeExercises];
    newExs[exerciseIndex].sets.splice(setIndex, 1);
    setActiveExercises(newExs);
  };

  const addSet = (exerciseIndex: number) => {
    if (!activeExercises[exerciseIndex]) return;
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
    if (!activeExercises[exIdx]?.sets[setIdx]) return;
    const newExs = [...activeExercises];
    const value = parseFloat(val) || 0;
    (newExs[exIdx].sets[setIdx] as any)[field] = value;
    setActiveExercises(newExs);
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    if (!activeExercises[exIdx]?.sets[setIdx]) return;
    const newExs = [...activeExercises];
    const isNowCompleted = !newExs[exIdx].sets[setIdx].completed;
    newExs[exIdx].sets[setIdx].completed = isNowCompleted;
    setActiveExercises(newExs);

    if (isNowCompleted) {
      hapticFeedback.light();
      startRestTimer(90);
    } else {
      stopRestTimer();
    }
  };

  const finishWorkout = async () => {
    hapticFeedback.success();
    setTimerActive(false);
    stopRestTimer();
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

    // Save to IndexedDB
    safeStorage.saveWorkout(record.id, record);

    // Update Exercise History
    exerciseHistoryService.updateHistory(record);

    // Legacy backup (for now)
    const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []);
    safeStorage.setItem('neuroLift_history', JSON.stringify([record, ...history]));

    // Sync to Firestore if user is authenticated
    if (authService.getCurrentUser()) {
      firestoreService.syncWorkout(record);
    }

    setCompletedWorkout(record);
    handleSetPhase('summary');
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
    stopRestTimer();
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

  const handleShareWorkout = async () => {
    try {
      const encoded = btoa(JSON.stringify(selectedExercises));
      const shareUrl = `https://neurolift.vercel.app?share=${encoded}${window.location.hash}`;

      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'NeuroLift Workout Plan',
          text: 'Check out my workout plan on NeuroLift!',
          url: shareUrl,
          dialogTitle: 'Share Workout Plan'
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      }
    } catch (e) {
      console.error("Failed to generate share link", e);
    }
  };

  const saveCurrentAsTemplate = async () => {
    if (!templateName.trim()) return;
    const newTemplate: WorkoutTemplate = {
      id: generateId(),
      name: templateName,
      exercises: selectedExercises.map(ex => ({
        name: ex,
        targetSets: 3, // Default values
        targetReps: '8-12'
      })),
      createdAt: new Date().toISOString()
    };

    await safeStorage.saveTemplate(newTemplate.id, newTemplate);
    setTemplates(prev => [newTemplate, ...prev]);

    // Sync to Firestore if user is authenticated
    if (authService.getCurrentUser()) {
      firestoreService.syncTemplate(newTemplate);
    }

    setShowSaveTemplateModal(false);
    setTemplateName('');
    hapticFeedback.success();
  };

  const loadTemplate = async (template: WorkoutTemplate) => {
    const exerciseNames = template.exercises.map(e => e.name);
    setSelectedExercises(exerciseNames);

    // Update lastUsed
    const updatedTemplate = { ...template, lastUsed: new Date().toISOString() };
    await safeStorage.saveTemplate(updatedTemplate.id, updatedTemplate);
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));

    // Infer muscles from exercises
    const musclesToSelect = new Set<string>();
    Object.entries(exercisesByMuscle).forEach(([muscle, subCats]) => {
      Object.values(subCats).forEach(categories => {
        Object.values(categories).forEach(exercises => {
          exercises.forEach(ex => {
            if (exerciseNames.includes(ex)) musclesToSelect.add(muscle);
          });
        });
      });
    });
    setSelectedMuscles(Array.from(musclesToSelect));
    setShowLoadTemplateModal(false);
    hapticFeedback.light();
  };

  const deleteTemplate = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setTemplateDeleteConfirm({ id, name: template.name });
    }
  };

  const confirmDeleteTemplate = async () => {
    if (templateDeleteConfirm) {
      await safeStorage.deleteTemplate(templateDeleteConfirm.id);
      setTemplates(prev => prev.filter(t => t.id !== templateDeleteConfirm.id));
      setTemplateDeleteConfirm(null);
      hapticFeedback.medium();
    }
  };

  const editTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setShowEditTemplateModal(true);
  };

  const saveEditedTemplate = async () => {
    if (editingTemplate) {
      await safeStorage.saveTemplate(editingTemplate.id, editingTemplate);
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));

      // Sync to Firestore if user is authenticated
      if (authService.getCurrentUser()) {
        firestoreService.syncTemplate(editingTemplate);
      }

      setEditingTemplate(null);
      setShowEditTemplateModal(false);
      hapticFeedback.success();
    }
  };

  const addExerciseToTemplate = (exerciseName: string) => {
    if (editingTemplate) {
      const newExercise = {
        name: exerciseName,
        targetSets: 3,
        targetReps: '10-12',
        notes: ''
      };
      setEditingTemplate({
        ...editingTemplate,
        exercises: [...editingTemplate.exercises, newExercise]
      });
    }
  };

  const removeExerciseFromTemplate = (index: number) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        exercises: editingTemplate.exercises.filter((_, i) => i !== index)
      });
    }
  };

  const updateTemplateExercise = (index: number, field: 'targetSets' | 'targetReps' | 'notes', value: string | number) => {
    if (editingTemplate) {
      const updatedExercises = editingTemplate.exercises.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex
      );
      setEditingTemplate({
        ...editingTemplate,
        exercises: updatedExercises
      });
    }
  };

  // Independent rest timer logic
  useEffect(() => {
    let interval: any;
    if (restTimerActive && restTimerRemaining !== null && restTimerRemaining > 0) {
      interval = setInterval(() => {
        setRestTimerRemaining(prev => {
          if (prev !== null && prev > 1) {
            return prev - 1;
          } else {
            setRestTimerActive(false);
            playNotificationSound();
            return null;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimerActive, restTimerRemaining]);

  const startRestTimer = (seconds: number) => {
    setRestTimerRemaining(seconds);
    setRestTimerActive(true);
  };

  const stopRestTimer = () => {
    setRestTimerActive(false);
    setRestTimerRemaining(null);
  };


  const MuscleChecklist = () => {
    return (
      <>
        <div ref={muscleSelectorRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4 mb-16">
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

        <Tooltip
          id="tracker_muscle_selector"
          isOpen={muscleSelectorTooltip.isOpen}
          onDismiss={muscleSelectorTooltip.dismiss}
          position="bottom"
          targetRef={muscleSelectorRef}
        >
          <p className="text-sm font-bold mb-1">{t('tooltip_muscle_selector_title')}</p>
          <p className="text-xs opacity-90">{t('tooltip_muscle_selector_desc')}</p>
        </Tooltip>
      </>
    );
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden">
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={phase}
          custom={direction}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          {phase === 'setup' && (
            <div className="mx-auto max-w-5xl px-6 pt-4 pb-32 text-center">
              <div className="mb-12">
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
                  <motion.button
                    key={muscle}
                    whileTap={{ scale: 0.95 }}
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
                  </motion.button>
                ))}
              </div>

              {selectedMuscles.length > 0 && (
                <div className="mt-4 animate-in slide-in-from-bottom-6 duration-500">
                  <SpotlightButton onClick={() => handleSetPhase('selection')} className="px-20 py-5 text-lg font-black uppercase tracking-widest shadow-xl">
                    {t('tracker_select_exercises')} ({selectedMuscles.length})
                  </SpotlightButton>
                </div>
              )}
            </div>
          )}

          {phase === 'selection' && (
            <div className="mx-auto max-w-4xl px-6 pt-4 pb-32">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-zinc-200 dark:border-zinc-800 pb-8">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                    {t('tracker_add_to_workout')}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {selectedMuscles.map(m => (
                      <span key={m} className="text-[0.625rem] text-teal-300 dark:text-teal-300 font-bold uppercase tracking-widest px-2 py-0.5 bg-teal-500/10 rounded shadow-sm">
                        {getLocalizedMuscleName(m, language)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Search Input */}
                <div className="flex-1 w-full md:max-w-md mx-4 md:mx-0 order-last md:order-none mt-4 md:mt-0">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-zinc-500 group-focus-within:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('planner_search_placeholder') || "Search exercises..."}
                      className="block w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                    />
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
                    {shareFeedback ? t('save') : t('tracker_share_plan')}
                  </button>

                  {templates.length > 0 && (
                    <button
                      onClick={() => setShowLoadTemplateModal(true)}
                      className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest font-black flex items-center gap-2 transition-colors px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-teal-500/50"
                    >
                      <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {t('tracker_load_template')}
                    </button>
                  )}

                  {selectedExercises.length > 0 && (
                    <button
                      onClick={() => setShowSaveTemplateModal(true)}
                      className="text-xs text-teal-400 hover:text-teal-300 uppercase tracking-widest font-black flex items-center gap-2 transition-colors px-3 py-1.5 rounded-xl border border-teal-500/20 hover:border-teal-500/50 bg-teal-500/5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {t('tracker_save_template')}
                    </button>
                  )}
                </div>

              </div>

              <div className="space-y-20 mb-20">
                {searchQuery ? (
                  /* Search Results View */
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {(() => {
                      const allMatches: { name: string; muscle: string }[] = [];
                      // Global search across all muscles
                      Object.keys(exercisesByMuscle).forEach(muscle => {
                        Object.keys(exercisesByMuscle[muscle]).forEach(subGroup => {
                          (['machines', 'weightlifting', 'cables', 'bodyweight'] as const).forEach(category => {
                            const exercises = exercisesByMuscle[muscle][subGroup][category] || [];
                            const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
                            exercises.filter(ex => normalize(ex).includes(normalize(searchQuery))).forEach(ex => {
                              // De-duplicate if needed, or just push
                              if (!allMatches.some(m => m.name === ex)) {
                                allMatches.push({ name: ex, muscle });
                              }
                            });
                          });
                        });
                      });

                      if (allMatches.length === 0) {
                        return (
                          <div className="text-center py-20">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full mx-auto flex items-center justify-center mb-6">
                              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <h3 className="text-zinc-400 font-bold">No exercises found</h3>
                            <p className="text-zinc-600 text-sm mt-2">Try searching for a different name</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allMatches.map(({ name, muscle }) => (
                            <div key={name} className="relative group">
                              <label className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${selectedExercises.includes(name)
                                ? 'bg-teal-500/5 border-teal-500 shadow-md text-teal-600 dark:text-teal-400'
                                : 'bg-white dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}`}>
                                <input
                                  type="checkbox"
                                  checked={selectedExercises.includes(name)}
                                  onChange={() => {
                                    toggleExercise(name);
                                    // Optional: clear search after selection? No, better to keep searching.
                                  }}
                                  className="hidden"
                                />
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedExercises.includes(name) ? 'bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20' : 'border-zinc-700'}`}>
                                  {selectedExercises.includes(name) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <div className="flex-1">
                                  <span className="block text-sm font-black tracking-wide uppercase pr-10 rtl:pr-0 rtl:pl-10">{getExerciseTranslation(name, language)}</span>
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{getLocalizedMuscleName(muscle, language)}</span>
                                </div>
                              </label>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTutorialExercise(name);
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
                      );
                    })()}
                  </div>
                ) : (
                  selectedMuscles.map(majorMuscle => (
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
                                          <span className="text-sm font-black tracking-wide flex-1 uppercase pr-10 rtl:pr-0 rtl:pl-10">{getExerciseTranslation(ex, language)}</span>
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
                  ))
                )}
              </div>

              <div className="sticky bottom-0 md:bottom-6 p-6 md:p-8 flex items-center justify-between z-40 pb-[calc(2rem+env(safe-area-inset-bottom))] md:pb-8">
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
                  <SpotlightButton
                    onClick={handleStartWorkout}
                    disabled={selectedExercises.length === 0}
                    className="flex-1 md:flex-none px-6 md:px-16 py-5 text-sm md:text-lg font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 flex items-center justify-center !rounded-2xl"
                  >
                    {activeExercises.length > 0 ? t('tracker_resume') : t('tracker_start')}
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
          )}

          {activeSetInfo && (
            <Modal isOpen={true} onClose={() => setActiveSetInfo(null)}>
              <div className="relative w-full rounded-[3rem] border border-zinc-800 bg-zinc-950 p-8 shadow-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
                  {t('tracker_plate_calc_title')}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 px-1">{t('tracker_plate_one_side')}</label>
                    <input
                      type="number"
                      value={plateCalcWeight || ''}
                      onChange={(e) => setPlateCalcWeight(parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 20"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 px-1">{t('tracker_bar_weight')}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 10, 15, 20].map(w => (
                        <button
                          key={w}
                          onClick={() => setBarWeight(w)}
                          className={`py-3 rounded-xl border font-bold transition-all ${barWeight === w
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                        >
                          {w}kg
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-6 text-center">
                    <div className="text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-1">{t('tracker_total_weight')}</div>
                    <div className="text-4xl font-black text-white">
                      {((plateCalcWeight || 0) * 2) + barWeight} <span className="text-sm text-zinc-500">kg</span>
                    </div>
                  </div>

                  <SpotlightButton
                    onClick={() => {
                      const total = ((plateCalcWeight || 0) * 2) + barWeight;
                      updateSet(activeSetInfo.exIdx, activeSetInfo.setIdx, 'weight', total.toString());
                      setActiveSetInfo(null);
                      setPlateCalcWeight(null);
                    }}
                    className="w-full py-4 text-xs font-black uppercase tracking-widest"
                  >
                    {t('tracker_set_weight_btn')}
                  </SpotlightButton>

                  <button
                    onClick={() => setActiveSetInfo(null)}
                    className="w-full py-2 text-[10px] text-zinc-600 hover:text-rose-500 font-black uppercase tracking-widest transition-all"
                  >
                    {t('tracker_cancel')}
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {phase === 'active' && (
            <div className="mx-auto max-w-4xl px-4 md:px-6 py-6">
              <div className="text-center mb-12">
                <div className="inline-flex flex-col items-center relative">
                  {/* Gym Mode Badge */}
                  {/* Rest Timer Overlay */}
                  <AnimatePresence>
                    {restTimerRemaining !== null && restTimerRemaining > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
                      >
                        <h3 className="text-zinc-500 text-sm font-black uppercase tracking-[0.5em] mb-8">{t('tracker_resting')}</h3>
                        <div className="text-[12rem] font-black text-orange-500 font-mono leading-none tracking-tighter tabular-nums mb-12">
                          {restTimerRemaining}
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setRestTimerRemaining((prev) => (prev || 0) + 30)}
                            className="px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 font-bold hover:text-white hover:border-zinc-700 transition-all uppercase tracking-widest text-xs"
                          >
                            +30s
                          </button>
                          <button
                            onClick={stopRestTimer}
                            className="px-8 py-4 bg-teal-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
                          >
                            {t('tracker_skip_rest')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-4">
                    {mode === 'stopwatch' ? t('tracker_total_time') : t('tracker_time_remaining')}
                  </span>

                  <div className="flex items-center gap-6">
                    <div className="text-7xl md:text-8xl font-black text-teal-400 font-mono tracking-tighter drop-shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                      {mode === 'stopwatch' ? formatTime(duration) : formatTime(countdownRemaining || 0)}
                    </div>
                  </div>
                </div>


                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      if (!timerActive) {
                        // If starting and we're in timer mode but it's done/empty, switch back to stopwatch
                        if (mode === 'timer' && (!countdownRemaining || countdownRemaining === 0)) {
                          setMode('stopwatch');
                        }
                        setTimerActive(true);
                      } else {
                        setTimerActive(false);
                      }
                    }}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all shadow-2xl ${timerActive ? 'bg-amber-500 shadow-amber-500/30' : 'bg-teal-500 shadow-teal-500/30'}`}
                  >
                    {timerActive ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                  </button>

                  <button
                    onClick={() => {/* Open Laps/History if needed */ }}
                    className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>

                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </button>

                  {/* Small timer removed in favor of overlay */}
                </div>

              </div>

              {/* 2. Exercise List */}
              <div className="space-y-12 mb-12">
                {activeExercises.map((ex, exIdx) => (
                  <Card key={exIdx} className="p-8 bg-zinc-900/40 border-zinc-800 rounded-[3rem] shadow-sm overflow-hidden">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tight">
                      <span className="w-2.5 h-8 bg-teal-500 rounded-full shadow-lg shadow-teal-500/20"></span>
                      {getExerciseTranslation(ex.name, language)}
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => setTutorialExercise(ex.name)}
                          className="p-2 text-zinc-600 hover:text-teal-400 transition-colors"
                          title={t('modal_watch_video')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setExerciseToDelete({ name: ex.name, index: exIdx })}
                          className="p-2 text-zinc-600 hover:text-rose-500 transition-colors"
                          title={t('tracker_delete_exercise')}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </h3>

                    {/* History & Quick Load */}
                    {exerciseHistory.get(ex.name) && (
                      <div className="mb-6 px-4">
                        <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                          <div>
                            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{t('tracker_last_session')}</div>
                            <div className="text-xs text-zinc-300 font-mono">
                              {exerciseHistory.get(ex.name).lastSets.length} {t('tracker_sets_count')} × {exerciseHistory.get(ex.name).lastSets[0]?.reps} {t('tracker_reps_count')} @ {exerciseHistory.get(ex.name).lastSets[0]?.weight}kg
                            </div>
                          </div>

                          {/* Only show Quick Load if current sets are empty/default */}
                          {ex.sets.every(s => s.weight === 0 && s.reps === 0) && (
                            <button
                              onClick={() => handleQuickLoad(exIdx, ex.name)}
                              className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-teal-500/30 transition-all flex items-center gap-2"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              {t('tracker_quick_load')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-1 md:gap-3 text-[10px] text-zinc-100 mb-2 px-4 font-black uppercase tracking-[0.3em]">
                        <div className="col-span-2 text-center">{t('tracker_header_set')}</div>
                        <div className="col-span-2 text-center">{t('tracker_header_kg')}</div>
                        <div className="col-span-1 text-center"></div>
                        <div className="col-span-2 text-center">{t('tracker_header_reps')}</div>
                        <div className="col-span-3 text-center">{t('tracker_header_check')}</div>
                        <div className="col-span-2 text-center"></div>
                      </div>

                      <div className="space-y-3">
                        {ex.sets.map((set, setIdx) => (
                          <div key={set.id} className={`grid grid-cols-12 gap-0.5 md:gap-3 items-center rounded-2xl p-1.5 md:p-3 bg-black/20 border border-zinc-800/50 transition-all ${set.completed ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="col-span-2 flex justify-center">
                              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-200">
                                {setIdx + 1}
                              </div>
                            </div>

                            <div className="col-span-2 relative group/kg">
                              <input
                                type="tel"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={set.weight || ''}
                                onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                                placeholder="0"
                                className="w-full bg-transparent text-center text-lg font-bold text-white placeholder-zinc-700 outline-none border-b border-transparent focus:border-teal-500 transition-all"
                              />
                            </div>

                            <div className="col-span-1 flex justify-center">
                              <button
                                onClick={() => setActiveSetInfo({ exIdx, setIdx })}
                                className="p-1.5 rounded-full bg-zinc-800/50 text-zinc-500 hover:text-teal-400 hover:bg-zinc-800 transition-all"
                                title={t('tracker_plate_calc_title')}
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>
                            </div>

                            <div className="col-span-2">
                              <input
                                type="tel"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={set.reps || ''}
                                onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                                placeholder="0"
                                className="w-full bg-transparent text-center text-lg font-bold text-white placeholder-zinc-700 outline-none border-b border-transparent focus:border-teal-500 transition-all"
                              />
                            </div>

                            <div className="col-span-3 flex justify-center">
                              <button
                                onClick={() => toggleSetComplete(exIdx, setIdx)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${set.completed
                                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                                  : 'bg-zinc-800 text-zinc-600 hover:bg-zinc-700'
                                  }`}
                              >
                                {set.completed ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <span className="w-2.5 h-2.5 rounded-full border-2 border-zinc-600"></span>
                                )}
                              </button>
                            </div>

                            <div className="col-span-2 flex justify-center">
                              <button
                                onClick={() => removeSet(exIdx, setIdx)}
                                className="w-8 h-8 rounded-lg bg-zinc-900/50 flex items-center justify-center text-zinc-500 hover:text-rose-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => addSet(exIdx)}
                        className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-2xl border border-zinc-800 border-dashed hover:border-zinc-600 transition-all mt-4 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        {t('tracker_add_set')}
                      </button>
                    </div>

                  </Card>
                ))}
              </div>

              {/* Bottom Actions: Add Exercise & Finish */}
              <div className="flex flex-col items-center gap-6 pb-8">
                <button
                  onClick={() => setPhase('selection')}
                  className="px-6 py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-zinc-700/50 hover:border-zinc-600 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  {t('tracker_add_exercises')}
                </button>

                <div className="flex justify-center items-center w-full">
                  <SpotlightButton
                    onClick={finishWorkout}
                    variant="secondary"
                    spotlightColor="rgba(244, 63, 94, 0.4)"
                    className="w-auto px-20 py-5 bg-rose-500/10 border-rose-500/20 text-rose-500 hover:text-rose-400 font-black uppercase tracking-[0.2em] text-sm shadow-none hover:shadow-lg hover:shadow-rose-500/10"
                  >
                    {t('tracker_finish')}
                  </SpotlightButton>
                </div>
              </div>
            </div>
          )}

          {
            phase === 'summary' && completedWorkout && (
              <div className="mx-auto max-w-4xl px-6 pt-10 pb-32 text-center">
                <div className="w-24 h-24 bg-teal-500 rounded-full mx-auto flex items-center justify-center mb-8 shadow-2xl shadow-teal-500/30 animate-in zoom-in duration-500">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">
                  {t('tracker_summary')}
                </h2>
                <p className="text-zinc-400 text-lg mb-12 max-w-lg mx-auto">
                  {t('tracker_quote')}
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
                  <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
                    <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-2">{t('tracker_duration')}</div>
                    <div className="text-3xl font-black text-white text-mono">{formatTime(completedWorkout.durationSeconds)}</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-3xl p-6 border border-zinc-800">
                    <div className="text-xs text-zinc-500 font-black uppercase tracking-widest mb-2">{t('tracker_volume')}</div>
                    <div className="text-3xl font-black text-white text-mono">{completedWorkout.totalVolume.toLocaleString()} <span className="text-sm text-zinc-500">{t('unit_kg')}</span></div>
                  </div>
                </div>
                <SpotlightButton
                  onClick={reset}
                  className="px-12 py-5 text-lg font-black uppercase tracking-widest shadow-xl mx-auto"
                >
                  {t('tracker_start_new')}
                </SpotlightButton>
              </div>
            )
          }

        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!exerciseToDelete}
        title={t('tracker_delete_exercise')}
        message={t('tracker_confirm_delete_exercise')}
        confirmLabel={t('tracker_delete_exercise')}
        cancelLabel={t('tracker_cancel')}
        onConfirm={confirmDeleteExercise}
        onCancel={() => setExerciseToDelete(null)}
        isDestructive={true}
      />

      {/* Existing Modals */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title={t('tracker_reset_timer_title')}
        message={t('tracker_reset_timer_desc')}
        confirmLabel={t('timer_reset')}
        cancelLabel={t('tracker_cancel')}
        onConfirm={() => {
          resetClock();
          setShowResetConfirm(false);
          hapticFeedback.medium();
        }}
        onCancel={() => setShowResetConfirm(false)}
        isDestructive={true}
      />

      <Modal
        isOpen={!!tutorialExercise}
        onClose={() => setTutorialExercise(null)}
        title={t('modal_watch_video')}
      >
        {/* ... tutorial modal content ... */}
        <iframe
          src={`https://www.youtube.com/embed/${getExerciseLinks(tutorialExercise || '', language).video}?autoplay=1&rel=0`}
          title="Exercise Tutorial"
          className="w-full h-full rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Modal>

      {/* Save Template Modal */}
      <Modal isOpen={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)}>
        <div className="relative w-full rounded-[3rem] border border-zinc-800 bg-zinc-950 p-8 shadow-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
            <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
            {t('tracker_save_template')}
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 px-1">{t('tracker_template_name')}</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Push Day A"
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-teal-500 transition-all"
              />
            </div>
            <SpotlightButton
              onClick={saveCurrentAsTemplate}
              disabled={!templateName.trim()}
              className="w-full py-4 text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              {t('tracker_save')}
            </SpotlightButton>
            <button
              onClick={() => setShowSaveTemplateModal(false)}
              className="w-full py-2 text-[10px] text-zinc-600 hover:text-rose-500 font-black uppercase tracking-widest transition-all"
            >
              {t('tracker_cancel')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Load Template Modal */}
      <Modal isOpen={showLoadTemplateModal} onClose={() => setShowLoadTemplateModal(false)}>
        <div className="relative w-full rounded-[3rem] border border-zinc-800 bg-zinc-950 p-8 shadow-3xl overflow-hidden max-h-[80vh] flex flex-col">
          <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 flex-shrink-0">
            <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
            {t('tracker_templates_title')}
          </h3>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {templates.map(template => (
              <div key={template.id} className="group flex items-center gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-teal-500/50 transition-all">
                <button
                  onClick={() => loadTemplate(template)}
                  className="flex-1 text-left"
                >
                  <div className="text-sm font-black text-white uppercase tracking-tight mb-1">{template.name}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                    {template.exercises.length} {t('tracker_exercises')} • {t('tracker_created')} {new Date(template.createdAt).toLocaleDateString()}
                  </div>
                </button>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                   <button
                     onClick={() => editTemplate(template)}
                     className="p-2 text-zinc-700 hover:text-teal-500 transition-colors"
                     title="Edit template"
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                     </svg>
                   </button>
                   <button
                     onClick={() => deleteTemplate(template.id)}
                     className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"
                     title="Delete template"
                   >
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </button>
                 </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowLoadTemplateModal(false)}
            className="w-full py-4 mt-6 text-[10px] text-zinc-600 hover:text-white font-black uppercase tracking-widest transition-all border-t border-zinc-900 flex-shrink-0"
          >
            {t('modal_close')}
          </button>
        </div>
       </Modal>

       {/* Edit Template Modal */}
       <Modal isOpen={showEditTemplateModal} onClose={() => setShowEditTemplateModal(false)}>
         <div className="relative w-full max-w-4xl rounded-[3rem] border border-zinc-800 bg-zinc-950 p-8 shadow-3xl overflow-hidden max-h-[90vh] flex flex-col">
           <div className="absolute top-0 left-0 w-full h-2 bg-teal-500"></div>
           <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 flex-shrink-0">
             <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
             {t('tracker_save_template')} - {editingTemplate?.name}
           </h3>

           <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
             {/* Template Exercises */}
             <div className="space-y-4">
               <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Exercises</h4>
               {editingTemplate?.exercises.map((exercise, index) => (
                 <Card key={index} className="p-4 bg-zinc-900/50 border-zinc-800">
                   <div className="flex items-center justify-between mb-3">
                     <h5 className="text-sm font-bold text-white">{exercise.name}</h5>
                     <button
                       onClick={() => removeExerciseFromTemplate(index)}
                       className="p-1 text-zinc-500 hover:text-rose-500 transition-colors"
                     >
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                     <div>
                       <label className="block text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Sets</label>
                       <input
                         type="number"
                         value={exercise.targetSets}
                         onChange={(e) => updateTemplateExercise(index, 'targetSets', parseInt(e.target.value) || 1)}
                         className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                         min="1"
                         max="10"
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Reps</label>
                       <input
                         type="text"
                         value={exercise.targetReps}
                         onChange={(e) => updateTemplateExercise(index, 'targetReps', e.target.value)}
                         className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                         placeholder="10-12"
                       />
                     </div>
                     <div>
                       <label className="block text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Notes</label>
                       <input
                         type="text"
                         value={exercise.notes || ''}
                         onChange={(e) => updateTemplateExercise(index, 'notes', e.target.value)}
                         className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                         placeholder="Optional notes"
                       />
                     </div>
                   </div>
                 </Card>
               ))}
             </div>

             {/* Add Exercise from Library */}
             <div className="space-y-4">
               <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Add Exercise from Library</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                 {Object.entries(exercisesByMuscle).map(([muscle, subCats]) =>
                   Object.entries(subCats).map(([subCat, categories]) =>
                     Object.entries(categories).map(([category, exercises]) =>
                       exercises
                         .filter(ex => !editingTemplate?.exercises.some(te => te.name === ex))
                         .map(exercise => (
                           <button
                             key={exercise}
                             onClick={() => addExerciseToTemplate(exercise)}
                             className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg text-left hover:border-teal-500/50 hover:bg-teal-500/10 transition-all"
                           >
                             <div className="text-sm font-bold text-white">{exercise}</div>
                             <div className="text-xs text-zinc-500 uppercase tracking-widest">{muscle}</div>
                           </button>
                         ))
                     )
                   )
                 ).flat(2)}
               </div>
             </div>
           </div>

           <div className="flex gap-3 mt-6 pt-6 border-t border-zinc-900 flex-shrink-0">
             <button
               onClick={() => setShowEditTemplateModal(false)}
               className="flex-1 py-3 text-zinc-600 hover:text-white font-black uppercase tracking-widest transition-all"
             >
               {t('tracker_cancel')}
             </button>
             <button
               onClick={saveEditedTemplate}
               className="flex-1 py-3 bg-teal-500 hover:bg-teal-400 text-white font-black uppercase tracking-widest rounded-lg transition-all"
             >
               {t('tracker_save')}
             </button>
           </div>
         </div>
       </Modal>

       {/* Template Delete Confirmation Modal */}
       <Modal isOpen={templateDeleteConfirm !== null} onClose={() => setTemplateDeleteConfirm(null)}>
         <div className="p-8 bg-zinc-950 border border-zinc-900 rounded-[3rem] text-center space-y-6 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
           <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-4">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </div>
           <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">
             {t('confirm_delete_workout')}
           </h3>
           <p className="text-zinc-400 font-bold text-sm leading-relaxed">
             Are you sure you want to delete "{templateDeleteConfirm?.name}"? This action cannot be undone.
           </p>
           <div className="flex gap-3">
             <button
               onClick={() => setTemplateDeleteConfirm(null)}
               className="flex-1 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white font-black uppercase tracking-widest transition-colors"
             >
               {t('confirm_cancel')}
             </button>
             <button
               onClick={confirmDeleteTemplate}
               className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl transition-colors"
             >
               {t('confirm_yes')}
             </button>
           </div>
         </div>
       </Modal>

       {/* ... other modals ... */}
    </div>
  );
};


