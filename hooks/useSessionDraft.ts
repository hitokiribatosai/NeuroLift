import { useStoredDraftValue } from './useStoredDraftValue';
import { WorkoutTemplate } from "../types";
import { usePersistentExercises } from './usePersistentExercises';
import {
  clearSessionDraft,
  isTrackerPhase,
  TrackerPhase,
} from "../utils/sessionDraft";
import { safeStorage } from "../utils/storage";
import { useInterfaceState } from "./useInterfaceState";
import { ensureSessionIdentity } from "../utils/workoutCompletion";

/** Device-local draft state. Saved workouts and the global clock have separate owners. */
export function useSessionDraft() {
  const [phase, setPhase] = useStoredDraftValue<TrackerPhase>('neuroLift_tracker_phase', () => {
    const saved = safeStorage.getItem("neuroLift_tracker_phase");
    // Recover drafts left behind by older builds after a completed workout.
    if (saved === "summary") {
      clearSessionDraft();
      return "setup";
    }
    if (saved === 'active') ensureSessionIdentity();
    return isTrackerPhase(saved) ? saved : "setup";
  }, phase => {
    if (phase === 'active') ensureSessionIdentity();
    return phase === 'summary' || phase === 'setup' ? null : phase;
  });

  const [selectedMuscles, setSelectedMuscles] = useStoredDraftValue<string[]>('neuroLift_tracker_muscles', () => {
    return safeStorage.getParsed<string[]>("neuroLift_tracker_muscles", []);
  }, values => values.length ? JSON.stringify(values) : null);

  const [selectedExercises, setSelectedExercises] = useStoredDraftValue<string[]>('neuroLift_tracker_selected_exercises', () => {
    return safeStorage.getParsed<string[]>(
      "neuroLift_tracker_selected_exercises",
      [],
    );
  }, values => values.length ? JSON.stringify(values) : null);

  const [pickerMuscle, setPickerMuscle] = useInterfaceState(
    "picker_muscle",
    selectedMuscles[0] || "Chest",
  );

  const [pickerSubgroup, setPickerSubgroup] = useInterfaceState(
    "picker_subgroup",
    "",
  );

  const [selectedTemplate, setSelectedTemplate] =
    useStoredDraftValue<WorkoutTemplate | null>('neuroLift_tracker_selected_template', () =>
      safeStorage.getParsed<WorkoutTemplate | null>(
        "neuroLift_tracker_selected_template",
        null,
      ),
    value => value ? JSON.stringify(value) : null);

  const [activeTemplateId, setActiveTemplateId] = useStoredDraftValue<string | null>('neuroLift_tracker_active_template', () =>
    safeStorage.getItem("neuroLift_tracker_active_template"),
  value => value);

  const [activeTemplateName, setActiveTemplateName] = useStoredDraftValue<string | null>('neuroLift_tracker_active_template_name',
    () => safeStorage.getItem("neuroLift_tracker_active_template_name"),
  value => value);

  const [activeExercises, setActiveExercises] = usePersistentExercises();

  const [searchQuery, setSearchQuery] = useInterfaceState("picker_search", "");

  return {
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
  };
}
