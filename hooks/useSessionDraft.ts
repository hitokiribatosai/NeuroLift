import { useEffect, useState } from "react";
import { ActiveExercise, WorkoutTemplate } from "../types";
import {
  clearSessionDraft,
  isTrackerPhase,
  TrackerPhase,
} from "../utils/sessionDraft";
import { safeStorage } from "../utils/storage";
import { useInterfaceState } from "./useInterfaceState";

/** Device-local draft state. Saved workouts and the global clock have separate owners. */
export function useSessionDraft() {
  const [phase, setPhase] = useState<TrackerPhase>(() => {
    const saved = safeStorage.getItem("neuroLift_tracker_phase");
    // Recover drafts left behind by older builds after a completed workout.
    if (saved === "summary") {
      clearSessionDraft();
      return "setup";
    }
    return isTrackerPhase(saved) ? saved : "setup";
  });

  const [selectedMuscles, setSelectedMuscles] = useState<string[]>(() => {
    return safeStorage.getParsed<string[]>("neuroLift_tracker_muscles", []);
  });

  const [selectedExercises, setSelectedExercises] = useState<string[]>(() => {
    return safeStorage.getParsed<string[]>(
      "neuroLift_tracker_selected_exercises",
      [],
    );
  });

  const [pickerMuscle, setPickerMuscle] = useInterfaceState(
    "picker_muscle",
    selectedMuscles[0] || "Chest",
  );

  const [pickerSubgroup, setPickerSubgroup] = useInterfaceState(
    "picker_subgroup",
    "",
  );

  const [selectedTemplate, setSelectedTemplate] =
    useState<WorkoutTemplate | null>(() =>
      safeStorage.getParsed<WorkoutTemplate | null>(
        "neuroLift_tracker_selected_template",
        null,
      ),
    );

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(() =>
    safeStorage.getItem("neuroLift_tracker_active_template"),
  );

  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(
    () => safeStorage.getItem("neuroLift_tracker_active_template_name"),
  );

  const [activeExercises, setActiveExercises] = useState<ActiveExercise[]>(
    () => {
      return safeStorage.getParsed<ActiveExercise[]>(
        "neuroLift_tracker_active_exercises",
        [],
      );
    },
  );

  const [searchQuery, setSearchQuery] = useInterfaceState("picker_search", "");

  useEffect(() => {
    if (phase === "summary") return;
    safeStorage.setItem("neuroLift_tracker_phase", phase);
    safeStorage.setItem(
      "neuroLift_tracker_muscles",
      JSON.stringify(selectedMuscles),
    );
    safeStorage.setItem(
      "neuroLift_tracker_selected_exercises",
      JSON.stringify(selectedExercises),
    );
    safeStorage.setItem(
      "neuroLift_tracker_active_exercises",
      JSON.stringify(activeExercises),
    );
  }, [phase, selectedMuscles, selectedExercises, activeExercises]);

  useEffect(() => {
    if (selectedTemplate) {
      safeStorage.setItem(
        "neuroLift_tracker_selected_template",
        JSON.stringify(selectedTemplate),
      );
    } else {
      safeStorage.removeItem("neuroLift_tracker_selected_template");
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (activeTemplateId)
      safeStorage.setItem(
        "neuroLift_tracker_active_template",
        activeTemplateId,
      );
    else safeStorage.removeItem("neuroLift_tracker_active_template");
  }, [activeTemplateId]);

  useEffect(() => {
    if (activeTemplateName)
      safeStorage.setItem(
        "neuroLift_tracker_active_template_name",
        activeTemplateName,
      );
    else safeStorage.removeItem("neuroLift_tracker_active_template_name");
  }, [activeTemplateName]);
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
