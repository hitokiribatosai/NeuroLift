import { useWorkoutTemplates } from "../../hooks/useWorkoutTemplates";
import { useWorkspaceEditing } from '../../hooks/useWorkspaceEditing';
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useClock } from "../../contexts/ClockContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useCopy } from "../../hooks/useCopy";
import { useSessionDraft } from "../../hooks/useSessionDraft";
import { useTooltip } from "../../hooks/useTooltip";
import {
  ActiveExercise,
  CompletedWorkout,
  ExerciseHistory,
  WorkoutTemplate,
} from "../../types";
import { offerWorkoutNotification } from "../../utils/androidWorkoutNotification";
import {
  getExerciseDatabase,
  getExerciseTranslation,
  getLocalizedMuscleName,
  getMuscleForExercise,
  getSubMuscleForExercise,
} from "../../utils/exerciseData";
import { exerciseHistoryService } from "../../utils/exerciseHistory";
import { hapticFeedback } from "../../utils/haptics";
import { generateId } from "../../utils/id";
import { offerIOSRestNotifications } from "../../utils/iosRestNotification";
import { copyPreviousSets } from "../../utils/repeatWorkout";
import { clearSessionDraft } from "../../utils/sessionDraft";
import { safeStorage } from "../../utils/storage";
import {
  commitCompletedWorkout,
  ensureSessionIdentity,
} from "../../utils/workoutCompletion";
import { flushWorkspace, scope } from "../../utils/workspace";
import { usePersistenceAction } from "../../hooks/usePersistenceAction";
import {
  findNextScheduledWorkout,
  WeeklyWorkoutSchedule,
} from "../../utils/workoutSchedule";
import { createFreshTemplateExercises } from "../../utils/workoutTemplates";
import { hasSetEffort } from "../../utils/workoutValidation";
import { ConfirmModal } from "../ui/ConfirmModal";
import { ExerciseDemo } from "../ui/ExerciseDemo";
import { Modal } from "../ui/Modal";
import { SpotlightButton } from "../ui/SpotlightButton";
import { Tooltip } from "../ui/Tooltip";
import { WorkoutGuide } from "../web/GuidedTour";
import { WebSession } from "../web/WebSession";
import { WorkoutBreakdown } from "../web/WorkoutBreakdown";
import { TrackerReorderDialog } from "./TrackerReorderDialog";
import { TrackerSelection } from "./TrackerSelection";
import { TrackerSetup } from "./TrackerSetup";
import { TrackerTemplateEditor } from "./TrackerTemplateEditor";
import { TrackerTemplatePicker } from "./TrackerTemplatePicker";

export const Tracker: React.FC = () => {
  useWorkspaceEditing();
  const persist = usePersistenceAction();
  const {
    phase,
    setPhase,
    selectedMuscles,
    setSelectedMuscles,
    selectedExercises,
    setSelectedExercises,
    pickerMuscle,
    setPickerMuscle,
    pickerSubgroup,
    setPickerSubgroup,
    selectedTemplate,
    setSelectedTemplate,
    activeTemplateId,
    setActiveTemplateId,
    activeTemplateName,
    setActiveTemplateName,
    activeExercises,
    setActiveExercises,
    searchQuery,
    setSearchQuery,
  } = useSessionDraft();
  const { t, language } = useLanguage();
  const c = useCopy();

  const { theme } = useTheme();
  const isLight = theme === "light";

  // Tooltip hooks
  const muscleSelectorTooltip = useTooltip("tracker_muscle_selector");
  const muscleSelectorRef = useRef<HTMLDivElement>(null);

  const [templatePickerMuscle, setTemplatePickerMuscle] = useState("Chest");
  const [templatePickerSubgroup, setTemplatePickerSubgroup] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [tutorialExercise, setTutorialExercise] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [barWeight, setBarWeight] = useState<number>(20);
  const [activeSetInfo, setActiveSetInfo] = useState<{
    exIdx: number;
    setIdx: number;
  } | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const finishing = useRef(false);
  const [finishError, setFinishError] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<
    Map<string, ExerciseHistory>
  >(new Map());
  const { templates, saveTemplate, removeTemplate } = useWorkoutTemplates();
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyWorkoutSchedule>(
    () =>
      safeStorage.getParsed<WeeklyWorkoutSchedule>(
        "neuroLift_weekly_schedule",
        {},
      ),
  );

  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [editingTemplate, setEditingTemplate] =
    useState<WorkoutTemplate | null>(null);
  const [templateDeleteConfirm, setTemplateDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<{
    name: string;
    index: number;
  } | null>(null);
  const [showSaveCompletedModal, setShowSaveCompletedModal] = useState(false);
  const [completedTemplateName, setCompletedTemplateName] = useState("");
  const [showResetSessionConfirm, setShowResetSessionConfirm] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [tempReorderList, setTempReorderList] = useState<ActiveExercise[]>([]);
  const [reorderFeedback, setReorderFeedback] = useState<{
    name: string;
    position: number;
    sequence: number;
  } | null>(null);
  useEffect(() => {
    if (!showReorderModal) {
      setReorderFeedback(null);
      return;
    }
  }, [showReorderModal, reorderFeedback]);
  const moveReorderExercise = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= tempReorderList.length) return;
    const exercise = tempReorderList[index];
    const next = [...tempReorderList];
    [next[index], next[target]] = [next[target], next[index]];
    setTempReorderList(next);
    setReorderFeedback((previous) => ({
      name: exercise.name,
      position: target + 1,
      sequence: (previous?.sequence ?? 0) + 1,
    }));
  };

  const confirmDeleteExercise = () => {
    if (exerciseToDelete) {
      const newExs = activeExercises.filter(
        (_, i) => i !== exerciseToDelete.index,
      );
      setActiveExercises(newExs);

      const newSelected = selectedExercises.filter(
        (name) => name !== exerciseToDelete.name,
      );
      setSelectedExercises(newSelected);

      hapticFeedback.medium();
      setExerciseToDelete(null);
    }
  };

  // Load history when selected exercises change
  useEffect(() => {
    const loadHistory = async () => {
      const historyMap = new Map<string, ExerciseHistory>();
      for (const exercise of selectedExercises) {
        const history =
          await exerciseHistoryService.getExerciseHistory(exercise);
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
  const [completedWorkout, setCompletedWorkout] =
    useState<CompletedWorkout | null>(null);
  const [summaryPrevious, setSummaryPrevious] = useState<
    Map<string, ExerciseHistory>
  >(new Map());
  const [direction, setDirection] = useState(0);

  const phaseOrder = ["setup", "selection", "active", "summary"];

  // Use Global Clock for Workouts (Decoupled from Utility Clock)
  const {
    workoutDuration,
    setWorkoutDuration,
    isWorkoutActive,
    setIsWorkoutActive,
    resetWorkout,

    // Utility clock access if needed (but NOT for workout logic)
    // We remove duration/timerActive from here to prevent Accidental usage for workout

    // Rest Timer
    startRestTimer,
    stopRestTimer,
    addRestTime,
    restRemaining,
  } = useClock();

  // Alias for legacy code compatibility (will replace usages next)
  const duration = workoutDuration;
  const timerActive = isWorkoutActive;
  const setTimerActive = setIsWorkoutActive;
  const resetClock = resetWorkout;
  const setDuration = setWorkoutDuration;

  const restTimerRemaining = restRemaining;
  const restTimerActive = restRemaining !== null;

  // Active Exercises as separate effect to avoid context lag if needed, or just keep in useClock
  // but for now let's use the one from Tracker to keep logic separate

  // Dynamic DB
  const exercisesByMuscle = getExerciseDatabase(language);
  const selectableMuscles = Object.keys(exercisesByMuscle);
  const currentPickerMuscle = exercisesByMuscle[pickerMuscle]
    ? pickerMuscle
    : selectableMuscles[0];
  const currentPickerSubgroup = exercisesByMuscle[currentPickerMuscle]?.[
    pickerSubgroup
  ]
    ? pickerSubgroup
    : Object.keys(exercisesByMuscle[currentPickerMuscle] || {})[0];
  const currentTemplateMuscle = exercisesByMuscle[templatePickerMuscle]
    ? templatePickerMuscle
    : selectableMuscles[0];
  const currentTemplateSubgroup = exercisesByMuscle[currentTemplateMuscle]?.[
    templatePickerSubgroup
  ]
    ? templatePickerSubgroup
    : Object.keys(exercisesByMuscle[currentTemplateMuscle] || {})[0];
  const templateAvailableCount = Object.values(
    exercisesByMuscle[currentTemplateMuscle]?.[currentTemplateSubgroup] || {},
  )
    .flat()
    .filter(
      (ex) =>
        !editingTemplate?.exercises.some((te) => te.name === ex) &&
        getExerciseTranslation(ex, language)
          .toLocaleLowerCase()
          .includes(templateSearch.trim().toLocaleLowerCase()),
    ).length;

  // Notification logic is now partially in ClockContext
  // but we still trigger the rest start here

  // Handle Shared Workouts from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get("share");
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        if (Array.isArray(decoded)) {
          setSelectedExercises(decoded);
          // Infer muscles from exercises
          const musclesToSelect = new Set<string>();
          Object.entries(exercisesByMuscle).forEach(([muscle, subCats]) => {
            Object.values(subCats).forEach((categories) => {
              Object.values(categories).forEach((exercises) => {
                exercises.forEach((ex) => {
                  if (decoded.includes(ex)) musclesToSelect.add(muscle);
                });
              });
            });
          });
          setSelectedMuscles(Array.from(musclesToSelect));
          setPhase("selection");

          // Clear URL parameter without refreshing
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, "", newUrl);
        }
      } catch (e) {
        console.error("Failed to decode shared workout", e);
      }
    }
  }, []);

  // Handle Quick Start from Dashboard
  useEffect(() => {
    const quickStartMuscles = sessionStorage.getItem("quickStartMuscles");
    if (quickStartMuscles) {
      try {
        const muscles = JSON.parse(quickStartMuscles);
        setSelectedMuscles(muscles);
        setPhase("selection");
        // Clear the session storage
        sessionStorage.removeItem("quickStartMuscles");
      } catch (e) {
        console.error("Failed to parse quick start muscles", e);
      }
    }
  }, []);

  // Safety Check: If in active phase but no active exercises, reset to selection
  useEffect(() => {
    if (phase === "active" && activeExercises.length === 0) {
      setPhase("selection");
    }
  }, [phase, activeExercises]);

  // Safety Check: If in summary phase but no workout data, reset to setup
  useEffect(() => {
    if (phase === "summary" && !completedWorkout) {
      setPhase("setup");
    }
  }, [phase, completedWorkout]);

  const nextScheduledWorkout = findNextScheduledWorkout(
    templates,
    weeklySchedule,
    new Date(),
    safeStorage.getParsed<CompletedWorkout[]>("neuroLift_history", []),
  );
  const weekdayLabels = Array.from({ length: 7 }, (_, day) => {
    const date = new Date(2024, 0, 7 + day); // 7 Jan 2024 was a Sunday.
    const locale =
      language === "fr" ? "fr-FR" : language === "ar" ? "ar" : "en";
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
  });

  const assignTemplateDay = (day: number, templateId: string) => persist(async () => {
    const next = { ...weeklySchedule };
    if (next[String(day)] === templateId) delete next[String(day)];
    else next[String(day)] = templateId;
    await safeStorage.setItem("neuroLift_weekly_schedule", JSON.stringify(next));
    setWeeklySchedule(next);
  });

  // Load Templates

  // Modern Android has one native Back owner in App. Consume a screen-level
  // step here without resetting the draft, timers, selected exercises or sets.
  useEffect(() => {
    const back = (event: Event) => {
      if (window.location.hash.split("?")[0] !== "#tracker") return;
      if (phase !== "active" && phase !== "selection") return;
      event.preventDefault();
      setDirection(-1);
      setPhase(phase === "active" ? "selection" : "setup");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("neurolift-screen-back", back);
    return () => window.removeEventListener("neurolift-screen-back", back);
  }, [phase]);

  const handleSetPhase = (
    newPhase: "setup" | "selection" | "active" | "summary",
  ) => {
    if (newPhase === "selection" && phase === "setup") {
      setSearchQuery("");
      setPickerMuscle(selectedMuscles[0] || "Chest");
      setPickerSubgroup("");
    }
    const oldIdx = phaseOrder.indexOf(phase);
    const newIdx = phaseOrder.indexOf(newPhase);
    setDirection(newIdx < oldIdx ? -1 : 1);
    setPhase(newPhase);
    // Scroll to top on phase change
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleMuscle = (m: string) => {
    if (selectedMuscles.includes(m)) {
      setSelectedMuscles(selectedMuscles.filter((x) => x !== m));
    } else {
      setSelectedMuscles([...selectedMuscles, m]);
    }
  };

  const toggleExercise = (ex: string) => {
    if (selectedExercises.includes(ex)) {
      setSelectedExercises(selectedExercises.filter((i) => i !== ex));
    } else {
      setSelectedExercises([...selectedExercises, ex]);
      const muscle = getMuscleForExercise(ex);
      if (exercisesByMuscle[muscle])
        setSelectedMuscles((previous) =>
          previous.includes(muscle) ? previous : [...previous, muscle],
        );
    }
  };

  const handleStartWorkout = () => {
    ensureSessionIdentity();
    setFinishError(false);
    void offerWorkoutNotification();
    void offerIOSRestNotifications();
    handleSetPhase("active");

    // Templates create a clean session: retain the plan, never logged weights or reps.
    const templateExercises = selectedTemplate
      ? new Map(
          createFreshTemplateExercises(selectedTemplate, generateId).map(
            (exercise) => [exercise.name, exercise],
          ),
        )
      : null;
    const newActiveExercises: ActiveExercise[] = selectedExercises.map(
      (name) => {
        const fromTemplate = templateExercises?.get(name);
        if (fromTemplate) return fromTemplate;
        if (!templateExercises) {
          const existing = activeExercises.find((a) => a.name === name);
          if (existing) return existing;
        }
        return {
          name,
          sets: [{ id: generateId(), weight: 0, reps: 0, completed: false }],
        };
      },
    );

    setActiveExercises(newActiveExercises);
    setActiveTemplateId(selectedTemplate?.id || activeTemplateId);
    setActiveTemplateName(selectedTemplate?.name || activeTemplateName);
    setSelectedTemplate(null);

    // Only reset/start timer if this is a fresh start (duration is 0)
    if (duration === 0 && !timerActive) {
      setTimerActive(true);
      // setMode('stopwatch'); // Removed: Workout timer is independent
      setDuration(0);
    } else if (!timerActive) {
      setTimerActive(true);
    }
  };

  const handleQuickLoad = (
    exerciseIndex: number,
    exerciseName: string,
    setIndex?: number,
  ) => {
    const previous = exerciseHistory.get(exerciseName);
    if (!previous) return;
    setActiveExercises((current) =>
      current.map((exercise, index) =>
        index === exerciseIndex && exercise.name === exerciseName
          ? {
              ...exercise,
              sets: copyPreviousSets(
                exercise.sets,
                previous.lastSets,
                setIndex,
              ),
            }
          : exercise,
      ),
    );
    hapticFeedback.success();
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeExercises[exerciseIndex]) return;
    const newExs = structuredClone(activeExercises);
    newExs[exerciseIndex].sets.splice(setIndex, 1);
    setActiveExercises(newExs);
  };

  const addSet = (exerciseIndex: number) => {
    if (!activeExercises[exerciseIndex]) return;
    const newExs = structuredClone(activeExercises);
    newExs[exerciseIndex].sets.push({
      id: generateId(),
      weight: 0,
      reps: 0,
      completed: false,
    });
    setActiveExercises(newExs);
  };

  const updateSet = (
    exIdx: number,
    setIdx: number,
    field: "weight" | "reps",
    val: string,
  ) => {
    if (!activeExercises[exIdx]?.sets[setIdx]) return;
    const newExs = structuredClone(activeExercises);
    const parsed = parseFloat(val);
    const value = Number.isFinite(parsed)
      ? Math.max(0, field === "reps" ? Math.floor(parsed) : parsed)
      : 0;
    newExs[exIdx].sets[setIdx][field] = value;
    if (!hasSetEffort(newExs[exIdx].sets[setIdx]))
      newExs[exIdx].sets[setIdx].completed = false;
    setActiveExercises(newExs);
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    if (!activeExercises[exIdx]?.sets[setIdx]) return;
    const newExs = structuredClone(activeExercises);
    const isNowCompleted = !newExs[exIdx].sets[setIdx].completed;
    if (isNowCompleted && !hasSetEffort(newExs[exIdx].sets[setIdx])) return;
    newExs[exIdx].sets[setIdx].completed = isNowCompleted;
    setActiveExercises(newExs);

    if (isNowCompleted) {
      hapticFeedback.light();
      startRestTimer(
        Number(safeStorage.getItem("neuroLift_rest_seconds") || 120),
      );
    } else {
      stopRestTimer();
    }
  };

  const finishWorkout = async () => {
    if (finishing.current) return;
    if (
      !activeExercises.some((ex) =>
        ex.sets.some((set) => set.completed && hasSetEffort(set)),
      )
    )
      return;
    finishing.current = true;
    setFinishError(false);
    const owner = scope();
    try {
      await flushWorkspace();
      const muscleNames = selectedMuscles.map((m) =>
        getLocalizedMuscleName(m, language),
      );
      const sessionName =
        activeTemplateName ||
        templates.find((template) => template.id === activeTemplateId)?.name ||
        (muscleNames.length > 0 ? muscleNames.join(" & ") : t("tracker_summary"));

      const record: CompletedWorkout = {
        id: ensureSessionIdentity(),
        date: new Date().toISOString(),
        name: sessionName,
        durationSeconds: duration,
        exercises: activeExercises.map(exercise => ({
          ...exercise, sets: exercise.sets.map(set => ({ ...set })),
        })),
        totalVolume: 0, // The completion service calculates the authoritative total.
        ...(activeTemplateId ? { templateId: activeTemplateId } : {}),
      };

      // Capture references before saving, so the workout never compares with itself.
      const references = new Map<string, ExerciseHistory>();
      for (const exercise of record.exercises) {
        const history = await exerciseHistoryService.getExerciseHistory(exercise.name);
        if (history) references.set(exercise.name, history);
      }
      const saved = await commitCompletedWorkout(record, owner);
      setSummaryPrevious(references);
      setCompletedWorkout(saved);
      clearCurrentSession();
      handleSetPhase("summary");
      hapticFeedback.success();
    } catch {
      // Persistence errors leave the session/timers intact; never report success.
      if (owner === scope()) setFinishError(true);
    } finally {
      finishing.current = false;
    }
  };

  // Keep UI cleanup and phase transition in the same render after durable commit.
  const clearCurrentSession = () => {
    setSearchQuery("");
    setPickerMuscle("Chest");
    setPickerSubgroup("");
    setSelectedMuscles([]);
    setSelectedExercises([]);
    setActiveExercises([]);
    setSelectedTemplate(null);
    setActiveTemplateId(null);
    setActiveTemplateName(null);
    stopRestTimer();
    setTimerActive(false);
    resetClock();
  };

  const resetSession = () => persist(async () => {
    await clearSessionDraft();
    clearCurrentSession();
    setPhase("setup");
    setCompletedWorkout(null);
    setShowResetSessionConfirm(false);
    hapticFeedback.medium();
  });

  // Keep old reset for summary screen
  const reset = () => {
    resetSession();
  };

  const resetCurrentTimer = () => {
    setShowResetConfirm(true);
  };

  const handleShareWorkout = async () => {
    try {
      const encoded = btoa(JSON.stringify(selectedExercises));
      const shareUrl = `https://neurolift.netlify.app?share=${encoded}${window.location.hash}`;

      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: "NeuroLift Workout Plan",
          text: "Check out my workout plan on NeuroLift!",
          url: shareUrl,
          dialogTitle: "Share Workout Plan",
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
      exercises: selectedExercises.map((ex) => ({
        name: ex,
        targetSets: 3, // Default values
        targetReps: "8-12",
      })),
      createdAt: new Date().toISOString(),
    };

    await saveTemplate(newTemplate);

    setShowSaveTemplateModal(false);
    setTemplateName("");
    hapticFeedback.success();
  };

  const loadTemplate = async (template: WorkoutTemplate) => {
    const exerciseNames = template.exercises.map((e) => e.name);
    setSelectedExercises(exerciseNames);

    // Update lastUsed
    const updatedTemplate = { ...template, lastUsed: new Date().toISOString() };
    await saveTemplate(updatedTemplate);
    setSelectedTemplate(updatedTemplate);

    // Loading a template replaces any old draft so the next start is always fresh.
    setActiveExercises([]);
    setTimerActive(false);
    stopRestTimer();
    resetClock();

    // Infer muscles from exercises
    const musclesToSelect = new Set<string>();
    Object.entries(exercisesByMuscle).forEach(([muscle, subCats]) => {
      Object.values(subCats).forEach((categories) => {
        Object.values(categories).forEach((exercises) => {
          exercises.forEach((ex) => {
            if (exerciseNames.includes(ex)) musclesToSelect.add(muscle);
          });
        });
      });
    });
    setSelectedMuscles(Array.from(musclesToSelect));
    setShowLoadTemplateModal(false);
    handleSetPhase("selection");
    setSearchQuery("");
    setPickerMuscle(Array.from(musclesToSelect)[0] || "Chest");
    setPickerSubgroup("");
    hapticFeedback.light();
  };

  const deleteTemplate = async (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setTemplateDeleteConfirm({ id, name: template.name });
    }
  };

  const confirmDeleteTemplate = () => persist(async () => {
    if (templateDeleteConfirm) {
      await removeTemplate(templateDeleteConfirm.id);
      const nextSchedule = safeStorage.getParsed<WeeklyWorkoutSchedule>("neuroLift_weekly_schedule", {});
      setWeeklySchedule(nextSchedule);
      setTemplateDeleteConfirm(null);
      hapticFeedback.medium();
    }
  });

  const editTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    const first = template.exercises[0]?.name;
    const muscle = first ? getMuscleForExercise(first) : "Chest";
    setTemplatePickerMuscle(exercisesByMuscle[muscle] ? muscle : "Chest");
    setTemplatePickerSubgroup(first ? getSubMuscleForExercise(first) : "");
    setTemplateSearch("");
    setShowEditTemplateModal(true);
  };

  const saveEditedTemplate = async () => {
    if (editingTemplate) {
      await saveTemplate(editingTemplate);

      setEditingTemplate(null);
      setShowEditTemplateModal(false);
      hapticFeedback.success();
    }
  };

  const saveCompletedAsTemplate = async () => {
    if (!completedTemplateName.trim() || !completedWorkout) return;

    const newTemplate: WorkoutTemplate = {
      id: generateId(),
      name: completedTemplateName,
      exercises: completedWorkout.exercises.map((ex) => ({
        name: ex.name,
        targetSets: ex.sets.length,
        targetReps:
          ex.targetReps ||
          ex.sets
            .find((set) => set.completed && set.reps > 0)
            ?.reps.toString() ||
          "10",
        notes: "",
      })),
      createdAt: new Date().toISOString(),
    };

    await saveTemplate(newTemplate);

    setShowSaveCompletedModal(false);
    setCompletedTemplateName("");
    hapticFeedback.success();
  };

  const addExerciseToTemplate = (exerciseName: string) => {
    if (editingTemplate) {
      const newExercise = {
        name: exerciseName,
        targetSets: 3,
        targetReps: "10-12",
        notes: "",
      };
      setEditingTemplate({
        ...editingTemplate,
        exercises: [...editingTemplate.exercises, newExercise],
      });
    }
  };

  const removeExerciseFromTemplate = (index: number) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        exercises: editingTemplate.exercises.filter((_, i) => i !== index),
      });
    }
  };

  const updateTemplateExercise = (
    index: number,
    field: "targetSets" | "targetReps" | "notes",
    value: string | number,
  ) => {
    if (editingTemplate) {
      const updatedExercises = editingTemplate.exercises.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex,
      );
      setEditingTemplate({
        ...editingTemplate,
        exercises: updatedExercises,
      });
    }
  };

  // Global rest timer from logic
  // Removed local logic - handled in ClockContext now

  const MuscleChecklist = () => {
    return (
      <>
        <div
          ref={muscleSelectorRef}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto px-4 mb-16"
        >
          {selectableMuscles.map((muscle) => (
            <button
              key={muscle}
              onClick={() => toggleMuscle(muscle)}
              className="group relative flex items-center justify-center p-6 rounded-3xl surface-rounded border transition-all duration-300"
              style={{
                backgroundColor: selectedMuscles.includes(muscle)
                  ? "rgb(var(--accent-500))"
                  : isLight
                    ? "#ffffff"
                    : "rgba(24,24,27,0.4)",
                borderColor: selectedMuscles.includes(muscle)
                  ? "rgb(var(--accent-500))"
                  : isLight
                    ? "#e4e4e7"
                    : "#3f3f46",
                boxShadow: selectedMuscles.includes(muscle)
                  ? "0 0 25px rgb(var(--accent-500) / 0.2)"
                  : "0 1px 3px rgba(0,0,0,0.08)",
                color: selectedMuscles.includes(muscle)
                  ? "#ffffff"
                  : isLight
                    ? "#18181b"
                    : "#ffffff",
                WebkitTextFillColor: selectedMuscles.includes(muscle)
                  ? "#ffffff"
                  : isLight
                    ? "#18181b"
                    : "#ffffff",
              }}
            >
              <span className="text-xl font-black text-center transition-colors">
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
          <p className="text-sm font-bold mb-1">
            {t("tooltip_muscle_selector_title")}
          </p>
          <p className="text-xs opacity-90">
            {t("tooltip_muscle_selector_desc")}
          </p>
        </Tooltip>
      </>
    );
  };

  return (
    <div className={`relative w-full min-h-screen `}>
      {finishError && (
        <p role="alert" className="surface-paper surface-ink surface-border rounded-xl border p-4 mb-4">
          {c("workout_save_failed")}
        </p>
      )}
      <WorkoutGuide
        phase={phase}
        selected={selectedExercises.length}
        completed={activeExercises.reduce(
          (sum, exercise) =>
            sum + exercise.sets.filter((set) => set.completed).length,
          0,
        )}
      />
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={phase}
          custom={direction}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          {phase === "setup" && (
            <TrackerSetup
              t={t}
              nextScheduledWorkout={nextScheduledWorkout}
              language={language}
              loadTemplate={loadTemplate}
              setShowLoadTemplateModal={setShowLoadTemplateModal}
              selectableMuscles={selectableMuscles}
              selectedMuscles={selectedMuscles}
              toggleMuscle={toggleMuscle}
              isLight={isLight}
              setShowResetSessionConfirm={setShowResetSessionConfirm}
              handleSetPhase={handleSetPhase}
            />
          )}

          {phase === "selection" && (
            <TrackerSelection
              t={t}
              selectedMuscles={selectedMuscles}
              language={language}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setPhase={setPhase}
              handleShareWorkout={handleShareWorkout}
              selectedExercises={selectedExercises}
              shareFeedback={shareFeedback}
              templates={templates}
              setShowLoadTemplateModal={setShowLoadTemplateModal}
              setShowSaveTemplateModal={setShowSaveTemplateModal}
              setShowResetSessionConfirm={setShowResetSessionConfirm}
              setPickerOpen={setPickerOpen}
              currentPickerMuscle={currentPickerMuscle}
              currentPickerSubgroup={currentPickerSubgroup}
              exercisesByMuscle={exercisesByMuscle}
              setPickerMuscle={setPickerMuscle}
              setPickerSubgroup={setPickerSubgroup}
              isLight={isLight}
              toggleExercise={toggleExercise}
              setTutorialExercise={setTutorialExercise}
              setReviewOpen={setReviewOpen}
              c={c}
              activeExercises={activeExercises}
              handleStartWorkout={handleStartWorkout}
              reviewOpen={reviewOpen}
              pickerOpen={pickerOpen}
            />
          )}

          {/* Shared by selection and the active workout. */}
          <Modal
            isOpen={!!tutorialExercise}
            onClose={() => setTutorialExercise(null)}
          >
            {tutorialExercise && (
              <div className="relative w-full rounded-[3rem] surface-rounded border border-zinc-800 surface-border bg-zinc-950 surface-paper p-6 md:p-10 shadow-3xl surface-flat overflow-hidden">
                <button
                  onClick={() => setTutorialExercise(null)}
                  className="absolute right-6 top-6 md:right-8 md:top-8 text-zinc-400 surface-muted surface-ink hover:text-white transition-colors z-10"
                  title={t("modal_close")}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="flex items-center gap-4 mb-8 md:mb-10 pr-10">
                  <div className="w-2 md:w-3 h-8 md:h-10 bg-teal-500 surface-accent rounded-full flex-shrink-0"></div>
                  <h3 className="text-xl md:text-2xl font-black text-white surface-ink uppercase tracking-tighter leading-tight">
                    {getExerciseTranslation(tutorialExercise, language)}
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  <ExerciseDemo name={tutorialExercise} />
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(tutorialExercise + " exercise tutorial short")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 py-5 bg-red-600 hover:bg-red-500 text-white surface-ink font-black text-sm uppercase tracking-widest rounded-2xl surface-rounded transition-all shadow-lg surface-flat shadow-red-600/30 surface-flat"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                    </svg>
                    {t("modal_watch_video")}
                  </a>

                  <button
                    onClick={() => setTutorialExercise(null)}
                    className="w-full py-4 text-xs text-zinc-500 surface-muted surface-ink hover:text-white bg-zinc-900 surface-paper hover:bg-zinc-800 surface-paper border border-zinc-800 surface-border rounded-2xl surface-rounded font-black uppercase tracking-[0.3em] transition-all"
                  >
                    {t("modal_close")}
                  </button>
                </div>
              </div>
            )}
          </Modal>
          {activeSetInfo && (
            <Modal isOpen={true} onClose={() => setActiveSetInfo(null)}>
              <div className="relative w-full rounded-[3rem] surface-rounded border border-zinc-800 surface-border bg-zinc-950 surface-paper p-8 shadow-3xl surface-flat overflow-hidden">
                <h3 className="text-xl font-black text-white surface-ink uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <span className="w-2 h-6 bg-teal-500 surface-accent rounded-full"></span>
                  {t("tracker_plate_calc_title")}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 surface-muted surface-ink uppercase tracking-widest block mb-2 px-1">
                      {t("tracker_plate_one_side")}
                    </label>
                    <input
                      type="number"
                      value={plateCalcWeight || ""}
                      onChange={(e) =>
                        setPlateCalcWeight(parseFloat(e.target.value) || 0)
                      }
                      placeholder="e.g., 20"
                      className="w-full bg-zinc-900 surface-paper border border-zinc-800 surface-border rounded-2xl surface-rounded px-6 py-4 text-white surface-ink font-bold outline-none focus:border-teal-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-500 surface-muted surface-ink uppercase tracking-widest block mb-2 px-1">
                      {t("tracker_bar_weight")}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 10, 15, 20].map((w) => (
                        <button
                          key={w}
                          onClick={() => setBarWeight(w)}
                          className={`py-3 rounded-xl border font-bold transition-all ${
                            barWeight === w
                              ? "bg-teal-500 surface-accent border-teal-500 text-white surface-ink"
                              : "bg-zinc-900 surface-paper border-zinc-800 surface-border text-zinc-400 surface-muted surface-ink hover:border-zinc-700 surface-border"
                          }`}
                        >
                          {w}kg
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-teal-500/5 surface-accent border border-teal-500/20 rounded-2xl surface-rounded p-6 text-center">
                    <div className="text-[10px] font-black text-teal-500 surface-green uppercase tracking-[0.2em] mb-1">
                      {t("tracker_total_weight")}
                    </div>
                    <div className="text-4xl font-black text-white surface-ink">
                      {(plateCalcWeight || 0) * 2 + barWeight}{" "}
                      <span className="text-sm text-zinc-500 surface-muted surface-ink">kg</span>
                    </div>
                  </div>

                  <SpotlightButton
                    onClick={() => {
                      const total = (plateCalcWeight || 0) * 2 + barWeight;
                      updateSet(
                        activeSetInfo.exIdx,
                        activeSetInfo.setIdx,
                        "weight",
                        total.toString(),
                      );
                      setActiveSetInfo(null);
                      setPlateCalcWeight(null);
                    }}
                    className="w-full py-4 text-xs font-black uppercase tracking-widest"
                  >
                    {t("tracker_set_weight_btn")}
                  </SpotlightButton>

                  <button
                    onClick={() => setActiveSetInfo(null)}
                    className="w-full py-2 text-[10px] text-zinc-600 surface-muted surface-ink hover:text-rose-500 font-black uppercase tracking-widest transition-all"
                  >
                    {t("tracker_cancel")}
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {phase === "active" && (
            <WebSession
              exercises={activeExercises}
              history={exerciseHistory}
              duration={formatTime(duration)}
              running={timerActive}
              rest={restTimerRemaining}
              pause={() => setTimerActive(!timerActive)}
              skipRest={stopRestTimer}
              addRest={() => addRestTime(30)}
              update={updateSet}
              complete={toggleSetComplete}
              add={addSet}
              remove={removeSet}
              demo={setTutorialExercise}
              deleteExercise={(index) =>
                setExerciseToDelete({
                  name: activeExercises[index].name,
                  index,
                })
              }
              quickLoad={handleQuickLoad}
              plates={(exIdx, setIdx) => setActiveSetInfo({ exIdx, setIdx })}
              edit={() => setPhase("selection")}
              reorder={() => {
                setTempReorderList([...activeExercises]);
                setShowReorderModal(true);
              }}
              finish={finishWorkout}
              reset={() => setShowResetSessionConfirm(true)}
            />
          )}

          {phase === "summary" && completedWorkout && (
            <div className="mx-auto max-w-4xl px-6 pt-10 pb-32 text-center">
              <div className="w-24 h-24 bg-teal-500 surface-accent rounded-full mx-auto flex items-center justify-center mb-8 shadow-2xl surface-flat shadow-teal-500/30 surface-flat animate-in zoom-in duration-500">
                <svg
                  className="w-12 h-12 text-white surface-ink"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white surface-ink mb-4 uppercase tracking-tighter">
                {t("tracker_summary")}
              </h2>
              <p className="text-zinc-400 surface-muted surface-ink text-lg mb-12 max-w-lg mx-auto">
                {t("tracker_quote")}
              </p>

              <WorkoutBreakdown
                workout={completedWorkout}
                previous={summaryPrevious}
              />
              <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
                <div className="bg-zinc-900/50 surface-paper rounded-3xl surface-rounded p-6 border border-zinc-800 surface-border">
                  <div className="text-xs text-zinc-500 surface-muted surface-ink font-black uppercase tracking-widest mb-2">
                    {t("tracker_duration")}
                  </div>
                  <div className="text-3xl font-black text-white surface-ink text-mono">
                    {formatTime(completedWorkout.durationSeconds)}
                  </div>
                </div>
                <div className="bg-zinc-900/50 surface-paper rounded-3xl surface-rounded p-6 border border-zinc-800 surface-border">
                  <div className="text-xs text-zinc-500 surface-muted surface-ink font-black uppercase tracking-widest mb-2">
                    {t("tracker_volume")}
                  </div>
                  <div className="text-3xl font-black text-white surface-ink text-mono">
                    {completedWorkout.totalVolume.toLocaleString()}{" "}
                    <span className="text-sm text-zinc-500 surface-muted surface-ink">
                      {t("unit_kg")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 items-center">
                <button
                  onClick={() => setShowSaveCompletedModal(true)}
                  className="px-8 py-3 bg-zinc-900/50 surface-paper hover:bg-zinc-800 surface-paper border border-zinc-800 surface-border hover:border-teal-500/50 text-zinc-400 surface-muted surface-ink hover:text-white rounded-2xl surface-rounded font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  {t("tracker_save_template")}
                </button>

                <SpotlightButton
                  onClick={reset}
                  className="px-12 py-5 text-lg font-black uppercase tracking-widest shadow-xl surface-flat mx-auto"
                >
                  {t("tracker_start_new")}
                </SpotlightButton>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!exerciseToDelete}
        title={t("tracker_delete_exercise")}
        message={t("tracker_confirm_delete_exercise")}
        confirmLabel={t("tracker_delete_exercise")}
        cancelLabel={t("tracker_cancel")}
        onConfirm={confirmDeleteExercise}
        onCancel={() => setExerciseToDelete(null)}
        isDestructive={true}
      />

      {/* Existing Modals */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title={t("tracker_reset_timer_title")}
        message={t("tracker_reset_timer_desc")}
        confirmLabel={t("timer_reset")}
        cancelLabel={t("tracker_cancel")}
        onConfirm={() => {
          resetClock();
          setShowResetConfirm(false);
          hapticFeedback.medium();
        }}
        onCancel={() => setShowResetConfirm(false)}
        isDestructive={true}
      />

      {/* Save Template Modal */}
      <Modal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
      >
        <div className="relative w-full rounded-[3rem] surface-rounded border border-zinc-800 surface-border bg-zinc-950 surface-paper p-8 shadow-3xl surface-flat overflow-hidden">
          <h3 className="text-xl font-black text-white surface-ink uppercase tracking-tighter mb-8 flex items-center gap-3">
            {t("tracker_save_template")}
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-zinc-500 surface-muted surface-ink uppercase tracking-widest block mb-2 px-1">
                {t("tracker_template_name")}
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Push Day A"
                autoFocus
                className="w-full bg-zinc-900 surface-paper border border-zinc-800 surface-border rounded-2xl surface-rounded px-6 py-4 text-white surface-ink font-bold outline-none focus:border-teal-500 transition-all"
              />
            </div>
            <SpotlightButton
              onClick={saveCurrentAsTemplate}
              disabled={!templateName.trim()}
              className="w-full py-4 text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              {t("tracker_save")}
            </SpotlightButton>
            <button
              onClick={() => setShowSaveTemplateModal(false)}
              className="w-full py-2 text-[10px] text-zinc-600 surface-muted surface-ink hover:text-rose-500 font-black uppercase tracking-widest transition-all"
            >
              {t("tracker_cancel")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Save Completed Workout as Template Modal */}
      <Modal
        isOpen={showSaveCompletedModal}
        onClose={() => setShowSaveCompletedModal(false)}
      >
        <div className="relative w-full rounded-[3rem] surface-rounded border border-zinc-800 surface-border bg-zinc-950 surface-paper p-8 shadow-3xl surface-flat overflow-hidden">
          <h3 className="text-xl font-black text-white surface-ink uppercase tracking-tighter mb-8 flex items-center gap-3">
            {t("tracker_save_template")}
          </h3>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-zinc-500 surface-muted surface-ink uppercase tracking-widest block mb-2 px-1">
                {t("tracker_template_name")}
              </label>
              <input
                type="text"
                value={completedTemplateName}
                onChange={(e) => setCompletedTemplateName(e.target.value)}
                placeholder="e.g., Push Day A"
                autoFocus
                className="w-full bg-zinc-900 surface-paper border border-zinc-800 surface-border rounded-2xl surface-rounded px-6 py-4 text-white surface-ink font-bold outline-none focus:border-teal-500 transition-all"
              />
            </div>
            <SpotlightButton
              onClick={saveCompletedAsTemplate}
              disabled={!completedTemplateName.trim()}
              className="w-full py-4 text-xs font-black uppercase tracking-widest disabled:opacity-50"
            >
              {t("tracker_save")}
            </SpotlightButton>
            <button
              onClick={() => setShowSaveCompletedModal(false)}
              className="w-full py-2 text-[10px] text-zinc-600 surface-muted surface-ink hover:text-rose-500 font-black uppercase tracking-widest transition-all"
            >
              {t("tracker_cancel")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Load Template Modal */}
      <TrackerTemplatePicker
        showLoadTemplateModal={showLoadTemplateModal}
        setShowLoadTemplateModal={setShowLoadTemplateModal}
        t={t}
        templates={templates}
        loadTemplate={loadTemplate}
        editTemplate={editTemplate}
        deleteTemplate={deleteTemplate}
        weekdayLabels={weekdayLabels}
        weeklySchedule={weeklySchedule}
        assignTemplateDay={assignTemplateDay}
      />

      {/* Edit Template Modal */}
      <TrackerTemplateEditor
        showEditTemplateModal={showEditTemplateModal}
        setShowEditTemplateModal={setShowEditTemplateModal}
        t={t}
        editingTemplate={editingTemplate}
        removeExerciseFromTemplate={removeExerciseFromTemplate}
        updateTemplateExercise={updateTemplateExercise}
        exercisesByMuscle={exercisesByMuscle}
        currentTemplateMuscle={currentTemplateMuscle}
        currentTemplateSubgroup={currentTemplateSubgroup}
        setTemplatePickerMuscle={setTemplatePickerMuscle}
        setTemplatePickerSubgroup={setTemplatePickerSubgroup}
        templateSearch={templateSearch}
        setTemplateSearch={setTemplateSearch}
        templateAvailableCount={templateAvailableCount}
        language={language}
        addExerciseToTemplate={addExerciseToTemplate}
        saveEditedTemplate={saveEditedTemplate}
      />

      {/* Template Delete Confirmation Modal */}
      <Modal
        isOpen={templateDeleteConfirm !== null}
        onClose={() => setTemplateDeleteConfirm(null)}
      >
        <div className="p-8 bg-zinc-950 surface-paper border border-zinc-900 surface-border rounded-[3rem] surface-rounded text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white surface-ink uppercase italic tracking-tight">
            {t("confirm_delete_workout")}
          </h3>
          <p className="text-zinc-400 surface-muted surface-ink font-bold text-sm leading-relaxed">
            Are you sure you want to delete "{templateDeleteConfirm?.name}"?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setTemplateDeleteConfirm(null)}
              className="flex-1 py-4 bg-zinc-900 surface-paper border border-zinc-800 surface-border rounded-2xl surface-rounded text-zinc-400 surface-muted surface-ink hover:text-white font-black uppercase tracking-widest transition-colors"
            >
              {t("confirm_cancel")}
            </button>
            <button
              onClick={confirmDeleteTemplate}
              className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white surface-ink font-black uppercase tracking-widest rounded-2xl surface-rounded transition-colors"
            >
              {t("confirm_yes")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Session Confirmation Modal */}
      <Modal
        isOpen={showResetSessionConfirm}
        onClose={() => setShowResetSessionConfirm(false)}
      >
        <div className="p-8 bg-zinc-950 surface-paper border border-zinc-900 surface-border rounded-[3rem] surface-rounded text-center space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-white surface-ink uppercase italic tracking-tight">
            {t("tracker_reset_session_title")}
          </h3>
          <p className="text-zinc-400 surface-muted surface-ink font-bold text-sm leading-relaxed">
            {t("tracker_reset_session_desc")}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowResetSessionConfirm(false)}
              className="flex-1 py-4 bg-zinc-900 surface-paper border border-zinc-800 surface-border rounded-2xl surface-rounded text-zinc-400 surface-muted surface-ink hover:text-white font-black uppercase tracking-widest transition-colors"
            >
              {t("confirm_cancel")}
            </button>
            <button
              onClick={resetSession}
              className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white surface-ink font-black uppercase tracking-widest rounded-2xl surface-rounded transition-colors"
            >
              {t("confirm_yes")}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reorder Modal */}
      <TrackerReorderDialog
        showReorderModal={showReorderModal}
        setShowReorderModal={setShowReorderModal}
        t={t}
        tempReorderList={tempReorderList}
        setTempReorderList={setTempReorderList}
        reorderFeedback={reorderFeedback}
        setReorderFeedback={setReorderFeedback}
        c={c}
        language={language}
        moveReorderExercise={moveReorderExercise}
        setActiveExercises={setActiveExercises}
      />

      {/* ... other modals ... */}
    </div>
  );
};
