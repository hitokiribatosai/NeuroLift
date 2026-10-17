import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { WorkoutTemplate } from "../../types";
import { getExerciseTranslation } from "../../utils/exerciseData";
import { Card } from "../ui/Card";
import { ExerciseGroupSelector } from "../ui/ExerciseGroupSelector";
import { Modal } from "../ui/Modal";

interface Props {
  showEditTemplateModal: boolean;
  setShowEditTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  t: ReturnType<typeof useLanguage>["t"];
  editingTemplate: WorkoutTemplate;
  removeExerciseFromTemplate: (index: number) => void;
  updateTemplateExercise: (
    index: number,
    field: "targetSets" | "targetReps" | "notes",
    value: string | number,
  ) => void;
  exercisesByMuscle: import("../../types").ExerciseDatabase;
  currentTemplateMuscle: string;
  currentTemplateSubgroup: string;
  setTemplatePickerMuscle: React.Dispatch<React.SetStateAction<string>>;
  setTemplatePickerSubgroup: React.Dispatch<React.SetStateAction<string>>;
  templateSearch: string;
  setTemplateSearch: React.Dispatch<React.SetStateAction<string>>;
  templateAvailableCount: number;
  language: import("../../types").Language;
  addExerciseToTemplate: (exerciseName: string) => void;
  saveEditedTemplate: () => Promise<void>;
}

export function TrackerTemplateEditor({
  showEditTemplateModal,
  setShowEditTemplateModal,
  t,
  editingTemplate,
  removeExerciseFromTemplate,
  updateTemplateExercise,
  exercisesByMuscle,
  currentTemplateMuscle,
  currentTemplateSubgroup,
  setTemplatePickerMuscle,
  setTemplatePickerSubgroup,
  templateSearch,
  setTemplateSearch,
  templateAvailableCount,
  language,
  addExerciseToTemplate,
  saveEditedTemplate,
}: Props) {
  return (
    <Modal
      isOpen={showEditTemplateModal}
      onClose={() => setShowEditTemplateModal(false)}
    >
      <div className="relative w-full max-w-4xl rounded-[3rem] surface-rounded border border-zinc-800 surface-border bg-zinc-950 surface-paper p-8 shadow-3xl surface-flat overflow-hidden max-h-[90vh] flex flex-col">
        <h3 className="text-xl font-black text-white surface-ink uppercase tracking-tighter mb-8 flex items-center gap-3 flex-shrink-0">
          {t("tracker_save_template")} - {editingTemplate?.name}
        </h3>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {/* Template Exercises */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-zinc-400 surface-muted surface-ink uppercase tracking-widest">
              Exercises
            </h4>
            {editingTemplate?.exercises.map((exercise, index) => (
              <Card key={index} className="p-4 bg-zinc-900/50 surface-paper border-zinc-800 surface-border">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold text-white surface-ink">
                    {exercise.name}
                  </h5>
                  <button
                    onClick={() => removeExerciseFromTemplate(index)}
                    className="p-1 text-zinc-500 surface-muted surface-ink hover:text-rose-500 transition-colors"
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
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 surface-muted surface-ink font-bold uppercase tracking-widest mb-1">
                      Sets
                    </label>
                    <input
                      type="number"
                      value={exercise.targetSets}
                      onChange={(e) =>
                        updateTemplateExercise(
                          index,
                          "targetSets",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className="w-full px-3 py-2 bg-zinc-800 surface-paper border border-zinc-700 surface-border rounded-lg text-white surface-ink text-sm"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 surface-muted surface-ink font-bold uppercase tracking-widest mb-1">
                      Reps
                    </label>
                    <input
                      type="text"
                      value={exercise.targetReps}
                      onChange={(e) =>
                        updateTemplateExercise(
                          index,
                          "targetReps",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 bg-zinc-800 surface-paper border border-zinc-700 surface-border rounded-lg text-white surface-ink text-sm"
                      placeholder="10-12"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 surface-muted surface-ink font-bold uppercase tracking-widest mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={exercise.notes || ""}
                      onChange={(e) =>
                        updateTemplateExercise(index, "notes", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-zinc-800 surface-paper border border-zinc-700 surface-border rounded-lg text-white surface-ink text-sm"
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Add Exercise from Library */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-zinc-400 surface-muted surface-ink uppercase tracking-widest">
              {t("picker_add_from_library")}
            </h4>
            <ExerciseGroupSelector
              database={exercisesByMuscle}
              muscle={currentTemplateMuscle}
              subgroup={currentTemplateSubgroup}
              onMuscleChange={(muscle) => {
                setTemplatePickerMuscle(muscle);
                setTemplatePickerSubgroup(
                  Object.keys(exercisesByMuscle[muscle])[0],
                );
              }}
              onSubgroupChange={setTemplatePickerSubgroup}
            />
            <input
              type="search"
              value={templateSearch}
              onChange={(event) => setTemplateSearch(event.target.value)}
              aria-label={t("planner_search_placeholder")}
              placeholder={t("planner_search_placeholder")}
              className="w-full rounded-xl border border-zinc-700 surface-border bg-zinc-900 surface-paper px-4 py-3 text-sm text-white surface-ink focus:border-teal-400 focus:outline-none"
            />
            <p className="text-xs font-semibold text-teal-300 surface-green">
              {t("picker_selected_count")}:{" "}
              {editingTemplate?.exercises.length || 0}
            </p>
            <div className="max-h-96 space-y-5 overflow-y-auto custom-scrollbar">
              {templateAvailableCount === 0 && (
                <p className="rounded-xl border border-zinc-800 surface-border p-4 text-sm text-zinc-400 surface-muted surface-ink">
                  {t("picker_no_matches")}
                </p>
              )}
              {Object.entries(
                exercisesByMuscle[currentTemplateMuscle]?.[
                  currentTemplateSubgroup
                ] || {},
              ).map(([category, exercises]) => {
                const available = exercises.filter(
                  (ex) =>
                    !editingTemplate?.exercises.some((te) => te.name === ex) &&
                    getExerciseTranslation(ex, language)
                      .toLocaleLowerCase()
                      .includes(templateSearch.trim().toLocaleLowerCase()),
                );
                if (!available.length) return null;
                const categoryKey = `cat_${category}` as Parameters<
                  typeof t
                >[0];
                return (
                  <div key={category}>
                    <h5 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400 surface-muted surface-ink">
                      {t(categoryKey)}
                    </h5>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {available.map((exercise) => (
                        <button
                          key={`${category}-${exercise}`}
                          type="button"
                          onClick={() => addExerciseToTemplate(exercise)}
                          className="rounded-lg border border-zinc-800 surface-border bg-zinc-900/30 surface-paper p-3 text-left text-sm font-bold text-white surface-ink hover:border-teal-500/50 hover:bg-teal-500/10 surface-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
                        >
                          {getExerciseTranslation(exercise, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-zinc-900 surface-border flex-shrink-0">
          <button
            onClick={() => setShowEditTemplateModal(false)}
            className="flex-1 py-3 text-zinc-600 surface-muted surface-ink hover:text-white font-black uppercase tracking-widest transition-all"
          >
            {t("tracker_cancel")}
          </button>
          <button
            onClick={saveEditedTemplate}
            className="flex-1 py-3 bg-teal-500 surface-accent hover:bg-teal-400 surface-accent text-white surface-ink font-black uppercase tracking-widest rounded-lg transition-all"
          >
            {t("tracker_save")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
