import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { WorkoutTemplate } from "../../types";
import { WeeklyWorkoutSchedule } from "../../utils/workoutSchedule";
import { Modal } from "../ui/Modal";

interface Props {
  showLoadTemplateModal: boolean;
  setShowLoadTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  t: ReturnType<typeof useLanguage>["t"];
  templates: WorkoutTemplate[];
  loadTemplate: (template: WorkoutTemplate) => Promise<void>;
  editTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => Promise<void>;
  weekdayLabels: string[];
  weeklySchedule: WeeklyWorkoutSchedule;
  assignTemplateDay: (day: number, templateId: string) => void;
}

export function TrackerTemplatePicker({
  showLoadTemplateModal,
  setShowLoadTemplateModal,
  t,
  templates,
  loadTemplate,
  editTemplate,
  deleteTemplate,
  weekdayLabels,
  weeklySchedule,
  assignTemplateDay,
}: Props) {
  return (
    <Modal
      isOpen={showLoadTemplateModal}
      onClose={() => setShowLoadTemplateModal(false)}
    >
      <div className="relative w-full rounded-[3rem] border border-zinc-800 bg-zinc-950 p-8 shadow-3xl overflow-hidden max-h-[80vh] flex flex-col">
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3 flex-shrink-0">
          {t("tracker_templates_title")}
        </h3>

        <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-teal-500/50"
            >
              <button
                onClick={() => loadTemplate(template)}
                className="flex-1 text-left"
              >
                <div className="text-sm font-black text-white uppercase tracking-tight mb-1">
                  {template.name}
                </div>
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  {template.exercises.length} {t("tracker_exercises")} •{" "}
                  {t("tracker_created")}{" "}
                  {new Date(template.createdAt).toLocaleDateString()}
                </div>
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => editTemplate(template)}
                  className="p-2 text-zinc-500 hover:text-teal-500 transition-colors"
                  title="Edit template"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="p-2 text-zinc-500 hover:text-rose-500 transition-colors"
                  title="Delete template"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {t("tracker_schedule_days")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {weekdayLabels.map((dayLabel, day) => {
                    const assigned =
                      weeklySchedule[String(day)] === template.id;
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={assigned}
                        aria-label={`${dayLabel} · ${template.name}`}
                        onClick={() => assignTemplateDay(day, template.id)}
                        className={`min-h-9 min-w-10 rounded-lg border px-2 text-xs font-bold transition ${assigned ? "border-teal-500 bg-teal-500 text-zinc-950" : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-teal-500/60"}`}
                      >
                        {dayLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowLoadTemplateModal(false)}
          className="w-full py-4 mt-6 text-[10px] text-zinc-600 hover:text-white font-black uppercase tracking-widest transition-all border-t border-zinc-900 flex-shrink-0"
        >
          {t("modal_close")}
        </button>
      </div>
    </Modal>
  );
}
