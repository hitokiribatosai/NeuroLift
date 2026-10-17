import { useEffect, useState } from "react";
import { WorkoutTemplate } from "../types";
import { safeStorage } from "../utils/storage";

/** Saved routines, separate from the active draft and template editor UI. */
export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  useEffect(() => {
    let cancelled = false;
    void safeStorage.getTemplates().then((saved) => {
      if (!cancelled) setTemplates(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveTemplate = async (template: WorkoutTemplate) => {
    await safeStorage.saveTemplate(template.id, template);
    setTemplates((previous) =>
      previous.some((item) => item.id === template.id)
        ? previous.map((item) => (item.id === template.id ? template : item))
        : [template, ...previous],
    );
  };
  const removeTemplate = async (id: string) => {
    await safeStorage.deleteTemplate(id);
    setTemplates((previous) => previous.filter((item) => item.id !== id));
  };
  return { templates, saveTemplate, removeTemplate };
}
