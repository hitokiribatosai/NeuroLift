import { motion } from "framer-motion";
import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { WorkoutTemplate } from "../../types";
import { getLocalizedMuscleName } from "../../utils/exerciseData";
import { RestDurationPicker } from "../web/RestDurationPicker";

interface Props {
  t: ReturnType<typeof useLanguage>["t"];
  nextScheduledWorkout: import("../../utils/workoutSchedule").NextScheduledWorkout;
  language: import("../../types").Language;
  loadTemplate: (template: WorkoutTemplate) => Promise<void>;
  setShowLoadTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  selectableMuscles: string[];
  selectedMuscles: string[];
  toggleMuscle: (m: string) => void;
  isLight: boolean;
  setShowResetSessionConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  handleSetPhase: (
    newPhase: "setup" | "selection" | "active" | "summary",
  ) => void;
}

export function TrackerSetup({
  t,
  nextScheduledWorkout,
  language,
  loadTemplate,
  setShowLoadTemplateModal,
  selectableMuscles,
  selectedMuscles,
  toggleMuscle,
  isLight,
  setShowResetSessionConfirm,
  handleSetPhase,
}: Props) {
  return (
    <div
      className={`web-workout-picker mx-auto max-w-6xl px-5 pb-32 pt-5 sm:px-8 lg:pt-10`}
    >
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
            {t("tracker_setup_step")}
          </p>
          <h2 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            {t("tracker_select_muscle")}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            {t("tracker_setup_hint")}
          </p>
        </div>
        <RestDurationPicker />
      </div>

      {nextScheduledWorkout && (
        <section
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-teal-700/30 bg-teal-500/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          aria-label={t("tracker_next_planned")}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
              {t("tracker_next_planned")}
            </p>
            <h3 className="mt-1 text-lg font-black text-zinc-950 dark:text-white">
              {nextScheduledWorkout.template.name}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {new Intl.DateTimeFormat(
                language === "fr" ? "fr-FR" : language === "ar" ? "ar" : "en",
                { weekday: "long", month: "short", day: "numeric" },
              ).format(nextScheduledWorkout.date)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadTemplate(nextScheduledWorkout.template)}
              className="web-primary min-h-11 rounded-xl px-4 py-2 text-sm font-bold"
            >
              {t("tracker_load_template")}
            </button>
            <button
              type="button"
              onClick={() => setShowLoadTemplateModal(true)}
              className="web-secondary min-h-11 rounded-xl px-4 py-2 text-sm font-bold"
            >
              {t("tracker_manage_templates")}
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {selectableMuscles.map((muscle) => (
          <motion.button
            key={muscle}
            type="button"
            aria-pressed={selectedMuscles.includes(muscle)}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleMuscle(muscle)}
            className="group relative flex min-h-24 items-center justify-center rounded-2xl border p-4 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400"
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
            <span className="text-lg font-black text-center transition-colors">
              {getLocalizedMuscleName(muscle, language)}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {selectedMuscles.length}{" "}
          {t(
            selectedMuscles.length === 1
              ? "tracker_group_selected"
              : "tracker_groups_selected",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {selectedMuscles.length > 0 && (
            <button
              type="button"
              onClick={() => setShowResetSessionConfirm(true)}
              className="text-xs font-bold text-zinc-600 hover:text-rose-500 dark:text-zinc-400"
            >
              {t("tracker_reset_session")}
            </button>
          )}
          <button
            type="button"
            disabled={selectedMuscles.length === 0}
            onClick={() => handleSetPhase("selection")}
            className="min-h-11 rounded-xl bg-teal-600 px-5 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-teal-400 dark:text-zinc-950 dark:hover:bg-teal-300"
          >
            {t("tracker_select_exercises")} <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
