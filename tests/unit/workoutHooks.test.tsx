import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, expect, test } from "vitest";
import { useSessionDraft } from "../../hooks/useSessionDraft";
import { useWorkoutTemplates } from "../../hooks/useWorkoutTemplates";
import { safeStorage } from "../../utils/storage";
import { changeScope } from "../../utils/workspace";
import { usePersistentExercises } from '../../hooks/usePersistentExercises';
import { ActiveExercise } from '../../types';

beforeEach(() => {
  localStorage.clear();
  changeScope("guest");
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

async function mountHook<T>(hook: () => T) {
  let current: T;
  function Probe() {
    current = hook();
    return null;
  }
  const root = createRoot(document.createElement("div"));
  await act(async () => root.render(<Probe />));
  return {
    get value() {
      return current;
    },
    close: () => act(() => root.unmount()),
  };
}

test("draft hook restores and persists a session without touching saved history", async () => {
  safeStorage.setItem("neuroLift_tracker_phase", "active");
  safeStorage.setItem("neuroLift_tracker_muscles", '["Back"]');
  safeStorage.setItem("neuroLift_history", "[]");
  const hook = await mountHook(useSessionDraft);
  try {
    expect(hook.value.phase).toBe("active");
    expect(hook.value.selectedMuscles).toEqual(["Back"]);
    await act(async () => hook.value.setSelectedMuscles(["Chest"]));
    expect(safeStorage.getParsed("neuroLift_tracker_muscles", [])).toEqual([
      "Chest",
    ]);
    expect(safeStorage.getItem("neuroLift_history")).toBe("[]");
  } finally {
    hook.close();
  }
});

test('exercise edits persist before React effects and preserve IDs through reorder', async () => {
  const hook = await mountHook(usePersistentExercises);
  try {
    act(() => {
      hook.value[1]([{ name: 'Press', sets: [] }, { name: 'Row', sets: [] }]);
      // Read in the same event, before React commits or runs an effect.
      expect(safeStorage.getParsed<ActiveExercise[]>('neuroLift_tracker_active_exercises', [])).toHaveLength(2);
    });
    const ids = hook.value[0].map(exercise => exercise.id);
    expect(new Set(ids).size).toBe(2);
    act(() => hook.value[1](previous => [...previous].reverse()));
    expect(hook.value[0].map(exercise => exercise.id)).toEqual([...ids].reverse());
    expect(safeStorage.getParsed<ActiveExercise[]>('neuroLift_tracker_active_exercises', []).map(exercise => exercise.id)).toEqual([...ids].reverse());
    await changeScope('1');
    act(() => hook.value[1]([{ name: 'Must not cross accounts', sets: [] }]));
    expect(safeStorage.getItem('neuroLift_tracker_active_exercises')).toBeNull();
  } finally { hook.close(); }
});

test('draft selections persist in the event and stale handlers cannot write into a new account', async () => {
  const hook = await mountHook(useSessionDraft);
  try {
    act(() => {
      hook.value.setSelectedMuscles(['Chest']);
      hook.value.setSelectedExercises(['Bench Press']);
      hook.value.setActiveTemplateName('Sunday');
      hook.value.setPhase('selection');
      expect(safeStorage.getItem('neuroLift_tracker_muscles')).toBe('["Chest"]');
      expect(safeStorage.getItem('neuroLift_tracker_selected_exercises')).toBe('["Bench Press"]');
      expect(safeStorage.getItem('neuroLift_tracker_active_template_name')).toBe('Sunday');
      expect(safeStorage.getItem('neuroLift_tracker_phase')).toBe('selection');
    });
    await changeScope('1');
    act(() => hook.value.setSelectedMuscles(['Back']));
    expect(safeStorage.getItem('neuroLift_tracker_muscles')).toBeNull();
  } finally { hook.close(); }
});

test("completed legacy drafts recover before other draft initializers run", async () => {
  safeStorage.setItem("neuroLift_tracker_phase", "summary");
  safeStorage.setItem("neuroLift_tracker_muscles", '["Back"]');
  safeStorage.setItem("ui_picker_search", '"Pull"');
  const hook = await mountHook(useSessionDraft);
  try {
    expect(hook.value.phase).toBe("setup");
    expect(hook.value.selectedMuscles).toEqual([]);
    expect(hook.value.searchQuery).toBe("");
  } finally {
    hook.close();
  }
});

test("template hook inserts, updates without duplicates and removes saved routines", async () => {
  const hook = await mountHook(useWorkoutTemplates);
  const routine = {
    id: "routine",
    name: "Sunday",
    exercises: [],
    createdAt: "2026-10-17",
  };
  try {
    await act(async () => hook.value.saveTemplate(routine));
    await act(async () =>
      hook.value.saveTemplate({ ...routine, name: "Monday" }),
    );
    expect(hook.value.templates).toHaveLength(1);
    expect((await safeStorage.getTemplates())[0].name).toBe("Monday");
    await act(async () => hook.value.removeTemplate(routine.id));
    expect(hook.value.templates).toEqual([]);
    expect(await safeStorage.getTemplates()).toEqual([]);
  } finally {
    hook.close();
  }
});
