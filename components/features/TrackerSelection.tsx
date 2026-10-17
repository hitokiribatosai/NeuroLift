import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCopy } from "../../hooks/useCopy";
import { ActiveExercise, WorkoutTemplate } from "../../types";
import {
  getExerciseTranslation,
  getLocalizedMuscleName,
} from "../../utils/exerciseData";
import { TrackerPhase } from "../../utils/sessionDraft";
import { ExerciseGroupSelector } from "../ui/ExerciseGroupSelector";
import { Modal } from "../ui/Modal";
import { SpotlightButton } from "../ui/SpotlightButton";

interface Props {
  t: ReturnType<typeof useLanguage>["t"];
  selectedMuscles: string[];
  language: import("../../types").Language;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setPhase: React.Dispatch<React.SetStateAction<TrackerPhase>>;
  handleShareWorkout: () => Promise<void>;
  selectedExercises: string[];
  shareFeedback: boolean;
  templates: WorkoutTemplate[];
  setShowLoadTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSaveTemplateModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowResetSessionConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  setPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentPickerMuscle: string;
  currentPickerSubgroup: string;
  exercisesByMuscle: import("../../types").ExerciseDatabase;
  setPickerMuscle: React.Dispatch<React.SetStateAction<string>>;
  setPickerSubgroup: React.Dispatch<React.SetStateAction<string>>;
  isLight: boolean;
  toggleExercise: (ex: string) => void;
  setTutorialExercise: React.Dispatch<React.SetStateAction<string>>;
  setReviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  c: ReturnType<typeof useCopy>;
  activeExercises: ActiveExercise[];
  handleStartWorkout: () => void;
  reviewOpen: boolean;
  pickerOpen: boolean;
}

export function TrackerSelection({
  t,
  selectedMuscles,
  language,
  searchQuery,
  setSearchQuery,
  setPhase,
  handleShareWorkout,
  selectedExercises,
  shareFeedback,
  templates,
  setShowLoadTemplateModal,
  setShowSaveTemplateModal,
  setShowResetSessionConfirm,
  setPickerOpen,
  currentPickerMuscle,
  currentPickerSubgroup,
  exercisesByMuscle,
  setPickerMuscle,
  setPickerSubgroup,
  isLight,
  toggleExercise,
  setTutorialExercise,
  setReviewOpen,
  c,
  activeExercises,
  handleStartWorkout,
  reviewOpen,
  pickerOpen,
}: Props) {
  return (
    <div
      className={`web-workout-picker mx-auto max-w-6xl px-5 pb-32 pt-5 sm:px-8 lg:pt-10`}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
            {t("tracker_exercises_step")}
          </p>
          <h2 className="mb-2 text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            {t("tracker_add_to_workout")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {selectedMuscles.map((m) => (
              <span
                key={m}
                className="rounded-lg bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-800 dark:text-teal-200"
              >
                {getLocalizedMuscleName(m, language)}
              </span>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="order-2 w-full lg:order-none lg:max-w-sm">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-zinc-500 group-focus-within:text-teal-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                t("planner_search_placeholder") || "Search exercises..."
              }
              className="block w-full rounded-xl border border-zinc-300 bg-white py-3 pl-11 pr-4 text-sm text-zinc-950 placeholder-zinc-500 transition-all focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="order-3 flex w-full flex-wrap gap-2">
          <button
            onClick={() => setPhase("setup")}
            className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest font-black flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-4 h-4 text-teal-700 dark:text-teal-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("tracker_back")}
          </button>

          <button
            onClick={handleShareWorkout}
            disabled={selectedExercises.length === 0}
            className={`text-xs uppercase tracking-widest font-black flex items-center gap-2 transition-all px-3 py-1.5 rounded-xl border ${
              shareFeedback
                ? "bg-teal-500/20 border-teal-500 text-teal-400"
                : "text-zinc-500 hover:text-white border-zinc-800 hover:border-teal-500/50"
            }`}
          >
            <svg
              className={`w-4 h-4 ${shareFeedback ? "text-teal-500" : "text-zinc-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {shareFeedback ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              )}
            </svg>
            {shareFeedback ? t("save") : t("tracker_share_plan")}
          </button>

          {templates.length > 0 && (
            <button
              onClick={() => setShowLoadTemplateModal(true)}
              className="text-xs text-zinc-400 hover:text-white uppercase tracking-widest font-black flex items-center gap-2 transition-colors px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-teal-500/50"
            >
              <svg
                className="w-4 h-4 text-teal-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              {t("tracker_load_template")}
            </button>
          )}

          {selectedExercises.length > 0 && (
            <button
              onClick={() => setShowSaveTemplateModal(true)}
              className="text-xs text-teal-400 hover:text-teal-300 uppercase tracking-widest font-black flex items-center gap-2 transition-colors px-3 py-1.5 rounded-xl border border-teal-500/20 hover:border-teal-500/50 bg-teal-500/5"
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
          )}

          <button
            onClick={() => setShowResetSessionConfirm(true)}
            className="text-xs text-zinc-400 hover:text-rose-500 uppercase tracking-widest font-black flex items-center gap-2 transition-colors px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-rose-500/50"
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
            {t("tracker_reset_session")}
          </button>
        </div>
      </div>

      {
        <button
          className="web-secondary web-mobile-filters"
          onClick={() => setPickerOpen(true)}
        >
          {getLocalizedMuscleName(currentPickerMuscle, language)} ·{" "}
          {getLocalizedMuscleName(currentPickerSubgroup, language)} ▾
        </button>
      }
      <div className="web-picker-grid mb-10 grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="web-picker-groups h-fit rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/80 sm:p-5 lg:sticky lg:top-24">
          <ExerciseGroupSelector
            database={exercisesByMuscle}
            stacked
            muscle={currentPickerMuscle}
            subgroup={currentPickerSubgroup}
            onMuscleChange={(muscle) => {
              setPickerMuscle(muscle);
              setPickerSubgroup(Object.keys(exercisesByMuscle[muscle])[0]);
              setSearchQuery("");
            }}
            onSubgroupChange={(subgroup) => {
              setPickerSubgroup(subgroup);
              setSearchQuery("");
            }}
          />
        </div>
        {searchQuery ? (
          /* Search Results View */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {(() => {
              const categoryMeta: Record<
                string,
                { icon: string; key: Parameters<typeof t>[0] }
              > = {
                dumbbells: { icon: "🏋️", key: "cat_dumbbells" },
                barbells: { icon: "🔩", key: "cat_barbells" },
                cables: { icon: "🔗", key: "cat_cables" },
                bodyweight: { icon: "🤸", key: "cat_bodyweight" },
                machines: { icon: "⚙️", key: "cat_machines" },
              };
              const allMatches: {
                name: string;
                muscle: string;
                category: string;
              }[] = [];
              // Workout search stays within the muscle currently being browsed.
              [currentPickerMuscle].forEach((muscle) => {
                Object.keys(exercisesByMuscle[muscle]).forEach((subGroup) => {
                  (
                    [
                      "dumbbells",
                      "barbells",
                      "cables",
                      "bodyweight",
                      "machines",
                    ] as const
                  ).forEach((category) => {
                    const exercises =
                      exercisesByMuscle[muscle][subGroup][category] || [];
                    const normalize = (str: string) =>
                      str.toLowerCase().replace(/[^a-z0-9]/g, "");
                    exercises
                      .filter((ex) =>
                        normalize(ex).includes(normalize(searchQuery)),
                      )
                      .forEach((ex) => {
                        // De-duplicate if needed, or just push
                        if (!allMatches.some((m) => m.name === ex)) {
                          allMatches.push({ name: ex, muscle, category });
                        }
                      });
                  });
                });
              });

              if (allMatches.length === 0) {
                return (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full mx-auto flex items-center justify-center mb-6">
                      <svg
                        className="w-8 h-8 text-zinc-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-zinc-400 font-bold">
                      No exercises found
                    </h3>
                    <p className="text-zinc-600 text-sm mt-2">
                      Try searching for a different name
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allMatches.map(({ name, muscle, category }) => (
                    <div key={name} className="relative group">
                      <label
                        style={{
                          backgroundColor: selectedExercises.includes(name)
                            ? "rgb(var(--accent-500) / 0.08)"
                            : isLight
                              ? "#ffffff"
                              : "rgba(24,24,27,0.6)",
                          color: isLight ? "#18181b" : "#ffffff",
                        }}
                        className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 focus-within:outline focus-within:outline-2 focus-within:outline-teal-400 ${
                          selectedExercises.includes(name)
                            ? "border-teal-500 shadow-md"
                            : isLight
                              ? "border-zinc-200 hover:border-zinc-300"
                              : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExercises.includes(name)}
                          onChange={() => {
                            toggleExercise(name);
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedExercises.includes(name)
                              ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20"
                              : isLight
                                ? "border-zinc-300"
                                : "border-zinc-700"
                          }`}
                        >
                          {selectedExercises.includes(name) && (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={4}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="block text-sm font-black tracking-wide uppercase pr-10 rtl:pr-0 rtl:pl-10">
                            {getExerciseTranslation(name, language)}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {getLocalizedMuscleName(muscle, language)} ·{" "}
                            {categoryMeta[category]?.icon}{" "}
                            {categoryMeta[category]
                              ? t(categoryMeta[category].key)
                              : ""}
                          </span>
                        </div>
                      </label>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTutorialExercise(name);
                        }}
                        className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-teal-400 opacity-100 transition-all z-10"
                        title={t("modal_watch_video")}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          [currentPickerMuscle].map((majorMuscle) => (
            <div key={majorMuscle} className="space-y-6">
              {/* Show Major Group Header */}
              <h3 className="flex items-center gap-3 text-2xl font-black text-zinc-950 dark:text-white">
                <span className="h-8 w-1 rounded-full bg-teal-500"></span>
                {getLocalizedMuscleName(majorMuscle, language)}
              </h3>

              {/* Render functional sub-groups */}
              {Object.keys(exercisesByMuscle[majorMuscle] || {})
                .filter((subGroup) => subGroup === currentPickerSubgroup)
                .map((subGroup) => {
                  const categoryMeta: Record<
                    string,
                    { icon: string; key: Parameters<typeof t>[0] }
                  > = {
                    dumbbells: { icon: "🏋️", key: "cat_dumbbells" },
                    barbells: { icon: "🔩", key: "cat_barbells" },
                    cables: { icon: "🔗", key: "cat_cables" },
                    bodyweight: { icon: "🤸", key: "cat_bodyweight" },
                    machines: { icon: "⚙️", key: "cat_machines" },
                  };
                  const categories = [
                    "dumbbells",
                    "barbells",
                    "cables",
                    "bodyweight",
                    "machines",
                  ] as const;

                  const renderExerciseCard = (ex: string) => (
                    <div key={ex} className="relative group">
                      <label
                        style={{
                          backgroundColor: selectedExercises.includes(ex)
                            ? "rgb(var(--accent-500) / 0.08)"
                            : isLight
                              ? "#ffffff"
                              : "rgba(24,24,27,0.6)",
                          color: isLight ? "#18181b" : "#ffffff",
                        }}
                        className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all duration-300 focus-within:outline focus-within:outline-2 focus-within:outline-teal-400 ${
                          selectedExercises.includes(ex)
                            ? "border-teal-500 shadow-md"
                            : isLight
                              ? "border-zinc-200 hover:border-zinc-300"
                              : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExercises.includes(ex)}
                          onChange={() => toggleExercise(ex)}
                          className="sr-only"
                        />
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedExercises.includes(ex)
                              ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/20"
                              : isLight
                                ? "border-zinc-300"
                                : "border-zinc-700"
                          }`}
                        >
                          {selectedExercises.includes(ex) && (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={4}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-10 rtl:pr-0 rtl:pl-10">
                          <span className="block text-sm font-black tracking-wide uppercase">
                            {getExerciseTranslation(ex, language)}
                          </span>
                        </div>
                      </label>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTutorialExercise(ex);
                        }}
                        className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-teal-400 opacity-100 transition-all z-10"
                        title={t("modal_watch_video")}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  );

                  return (
                    <div
                      key={subGroup}
                      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                      <h4 className="mb-5 flex items-center gap-3 text-lg font-black text-zinc-950 dark:text-zinc-200">
                        <span className="w-1.5 h-6 bg-teal-500/50 rounded-full"></span>
                        {getLocalizedMuscleName(subGroup, language)}
                      </h4>

                      <div className="space-y-6">
                        {categories.map((cat) => {
                          const exercises =
                            exercisesByMuscle[majorMuscle]?.[subGroup]?.[cat] ||
                            [];
                          if (exercises.length === 0) return null;
                          const meta = categoryMeta[cat];

                          return (
                            <div key={cat}>
                              <h5
                                className="text-[0.625rem] font-black uppercase tracking-[0.4em] mb-6 ml-1 flex items-center gap-3"
                                style={{
                                  color: isLight ? "#71717a" : "#a1a1aa",
                                }}
                              >
                                <span className="text-base">{meta.icon}</span>
                                {t(meta.key)}
                                <div
                                  className="h-px flex-1"
                                  style={{
                                    backgroundColor: isLight
                                      ? "rgba(0,0,0,0.1)"
                                      : "rgba(255,255,255,0.1)",
                                  }}
                                ></div>
                                <span className="text-zinc-600 font-medium">
                                  {exercises.length}
                                </span>
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {exercises.map((ex) => renderExerciseCard(ex))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))
        )}

        {
          <aside className="web-selection-panel">
            <h3>
              {t("picker_selected_count")}: {selectedExercises.length}
            </h3>
            <ul>
              {selectedExercises.map((name) => (
                <li key={name}>
                  <span>{getExerciseTranslation(name, language)}</span>
                  <button
                    aria-label={`${t("tracker_delete_exercise")}: ${name}`}
                    onClick={() => toggleExercise(name)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <button
              className="web-primary"
              disabled={!selectedExercises.length}
              onClick={() => setReviewOpen(true)}
            >
              {c("review")}
            </button>
          </aside>
        }
      </div>

      <div className="web-selection-actions sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/95 md:bottom-6 md:p-4">
        <div className="min-w-0">
          <div className="text-xs font-black text-zinc-900 dark:text-white">
            {t("picker_selected_count")}: {selectedExercises.length}
          </div>
          {
            <button
              className="web-text-button"
              onClick={() => setReviewOpen(true)}
            >
              {c("review")}
            </button>
          }
          <div className="hidden max-w-[400px] truncate text-xs text-zinc-600 dark:text-zinc-400 md:block">
            {selectedExercises.join(", ")}
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          {activeExercises.length > 0 && (
            <button
              onClick={() => setPhase("active")}
              className="flex-1 md:flex-none px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-colors border border-zinc-800 rounded-2xl"
            >
              {t("tracker_back")}
            </button>
          )}
          <SpotlightButton
            onClick={handleStartWorkout}
            disabled={selectedExercises.length === 0}
            className="flex-1 md:flex-none px-6 md:px-16 py-5 text-sm md:text-lg font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 flex items-center justify-center !rounded-2xl"
          >
            {activeExercises.length > 0
              ? t("tracker_resume")
              : t("tracker_start")}
          </SpotlightButton>
        </div>
      </div>

      <Modal
        isOpen={reviewOpen}
        onClose={() => setReviewOpen(false)}
        label={t("picker_selected_count")}
        sheet
      >
        <div className="web-more-panel">
          <div className="web-section-heading">
            <h2>
              {t("picker_selected_count")}: {selectedExercises.length}
            </h2>
            <button
              className="web-secondary"
              onClick={() => setReviewOpen(false)}
            >
              {t("modal_close")}
            </button>
          </div>
          <ul className="web-selection-list">
            {selectedExercises.map((name) => (
              <li key={name}>
                <span>{getExerciseTranslation(name, language)}</span>
                <button
                  aria-label={`${t("tracker_delete_exercise")}: ${name}`}
                  onClick={() => toggleExercise(name)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            className="web-primary"
            disabled={!selectedExercises.length}
            onClick={() => {
              setReviewOpen(false);
              handleStartWorkout();
            }}
          >
            {activeExercises.length ? t("tracker_resume") : t("tracker_start")}
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        label={t("picker_muscle_group")}
        sheet
      >
        <div className="web-more-panel">
          <h2>{t("picker_muscle_group")}</h2>
          <ExerciseGroupSelector
            database={exercisesByMuscle}
            stacked
            muscle={currentPickerMuscle}
            subgroup={currentPickerSubgroup}
            onMuscleChange={(value) => {
              setPickerMuscle(value);
              setPickerSubgroup(Object.keys(exercisesByMuscle[value])[0]);
              setSearchQuery("");
            }}
            onSubgroupChange={(value) => {
              setPickerSubgroup(value);
              setSearchQuery("");
            }}
          />
          <button className="web-primary" onClick={() => setPickerOpen(false)}>
            {t("modal_close")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
