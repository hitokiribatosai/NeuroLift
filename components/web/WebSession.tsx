import { useExerciseCardSwipe } from "../../hooks/useExerciseCardSwipe";
import { useCopy } from "../../hooks/useCopy";
import React, { useEffect, useRef, useState } from "react";
import { hasSetEffort } from "../../utils/workoutValidation";
import { ActiveExercise, ExerciseHistory } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";
import { getExerciseTranslation } from "../../utils/exerciseData";
import { useInterfaceState } from "../../hooks/useInterfaceState";

interface Props {
  exercises: ActiveExercise[];
  history: Map<string, ExerciseHistory>;
  duration: string;
  running: boolean;
  rest: number | null;
  pause: () => void;
  skipRest: () => void;
  addRest: () => void;
  update: (
    exercise: number,
    set: number,
    field: "weight" | "reps",
    value: string,
  ) => void;
  complete: (exercise: number, set: number) => void;
  add: (exercise: number) => void;
  remove: (exercise: number, set: number) => void;
  demo: (name: string) => void;
  deleteExercise: (index: number) => void;
  quickLoad: (index: number, name: string, setIndex?: number) => void;
  plates: (exercise: number, set: number) => void;
  edit: () => void;
  reorder: () => void;
  finish: () => void;
  reset: () => void;
}

export function WebSession(p: Props) {
  const { t, language } = useLanguage();
  const c = useCopy();
  const [selected, setSelected] = useInterfaceState<string | null>(
    "session_exercise",
    null,
  );
  const [confirmFinish, setConfirmFinish] = useState(false);
  const index = Math.max(
    0,
    p.exercises.findIndex((e) => e.name === selected),
  );
  const exercise = p.exercises[index];
  const completed = p.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0,
  );
  const total = p.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const previous = exercise && p.history.get(exercise.name);
  const sessionRef = useRef<HTMLElement>(null);
  const closeMenus = () =>
    sessionRef.current
      ?.querySelectorAll(".web-set-menu[open]")
      .forEach((menu) => menu.removeAttribute("open"));
  useEffect(() => {
    const outside = (event: PointerEvent) =>
      sessionRef.current
        ?.querySelectorAll(".web-set-menu[open]")
        .forEach((menu) => {
          if (!menu.contains(event.target as Node))
            menu.removeAttribute("open");
        });
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const { cardRef, switchExercise, swipeHandlers } = useExerciseCardSwipe({
    index,
    count: p.exercises.length,
    rtl: language === "ar",
    onSelect: (next) => setSelected(p.exercises[next].name),
    beforeSwitch: closeMenus,
  });
  const exerciseNavigation = (
    <div
      className="web-exercise-paging"
      role="group"
      aria-label={c("switch_exercise")}
    >
      <button
        className="web-secondary"
        disabled={index === 0}
        onClick={() => switchExercise(index - 1)}
      >
        {c("previous")}
      </button>
      <span aria-live="polite">
        {index + 1} / {p.exercises.length}
      </span>
      <button
        className="web-secondary"
        disabled={index === p.exercises.length - 1}
        onClick={() => switchExercise(index + 1)}
      >
        {c("next")}
      </button>
    </div>
  );
  return (
    <section className="web-session" ref={sessionRef}>
      <header className="web-session-header">
        <div>
          <p className="web-eyebrow">{c("session_in_progress")}</p>
          <h1>{t("nav_workout")}</h1>
          <p role="status">
            {completed} / {total} {c("sets_completed")}
          </p>
        </div>
        <div className="web-session-clock">
          <strong>{p.duration}</strong>
          <button className="web-secondary" onClick={p.pause}>
            {p.running ? c("pause_timer") : c("resume_timer")}
          </button>
        </div>
      </header>
      <progress
        max={Math.max(total, 1)}
        value={completed}
        aria-label={c("session_progress")}
      />
      <div className="web-session-layout">
        <nav
          className="web-session-exercises"
          aria-label={c("session_exercises")}
        >
          {p.exercises.map((e, i) => (
            <button
              key={e.name}
              aria-current={index === i ? "step" : undefined}
              onClick={() => switchExercise(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <span>
                <strong>{getExerciseTranslation(e.name, language)}</strong>
                <small>
                  {e.sets.filter((s) => s.completed).length} / {e.sets.length}{" "}
                  {t("tracker_sets_count")}
                </small>
              </span>
            </button>
          ))}
          <button className="web-secondary" onClick={p.edit}>
            + {t("tracker_add_exercises")}
          </button>
          <button className="web-text-button" onClick={p.reorder}>
            {t("tracker_reorder_mode")}
          </button>
        </nav>
        <div>
          <aside className="web-rest-bar" aria-label={t("tracker_resting")}>
            <span>
              {p.rest !== null && p.rest > 0 ? (
                <>
                  <strong>{p.rest}s</strong> {t("tracker_resting")}
                </>
              ) : (
                c("ready_for_your_next_set")
              )}
            </span>
            {p.rest !== null && p.rest > 0 && (
              <div>
                <button onClick={p.addRest}>+30s</button>
                <button onClick={p.skipRest}>{t("tracker_skip_rest")}</button>
              </div>
            )}
          </aside>
          <div className="web-exercise-swipe-viewport">
            {exercise ? (
              <article
                className="web-panel web-set-editor"
                ref={cardRef}
                {...swipeHandlers}
              >
                {exerciseNavigation}
                <div className="web-section-heading">
                  <div>
                    <h2>{getExerciseTranslation(exercise.name, language)}</h2>
                    {exercise.targetReps && (
                      <p className="mt-1 text-sm text-zinc-600 surface-muted surface-ink dark:text-zinc-400 surface-ink">
                        {t("tracker_target_reps")}: {exercise.targetReps}
                      </p>
                    )}
                  </div>
                  <button
                    className="web-secondary"
                    onClick={() => p.demo(exercise.name)}
                  >
                    {t("library_view_details")}
                  </button>
                </div>
                <details
                  className="web-previous-disclosure"
                  key={exercise.name}
                >
                  <summary>{c("previous_session")}</summary>
                  <div className="web-previous-content">
                    {previous ? (
                      <>
                        <time dateTime={previous.lastPerformed}>
                          {new Date(previous.lastPerformed).toLocaleDateString(
                            language,
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </time>
                        <ol>
                          {previous.lastSets.map((set, i) => (
                            <li key={i}>
                              {t("tracker_header_set")} {i + 1}:{" "}
                              {set.durationSeconds
                                ? `${set.durationSeconds}s`
                                : `${set.weight} kg × ${set.reps}`}
                            </li>
                          ))}
                        </ol>
                        {previous.lastSets.some(
                          (s) => s.reps > 0 && !s.durationSeconds,
                        ) &&
                          exercise.sets.every(
                            (s) => !s.weight && !s.reps && !s.completed,
                          ) && (
                            <button
                              className="web-secondary"
                              onClick={() => p.quickLoad(index, exercise.name)}
                            >
                              {c("use_previous_values")}
                            </button>
                          )}
                      </>
                    ) : (
                      <p>{c("no_previous_completed_sets_for_this_exercise")}</p>
                    )}
                  </div>
                </details>
                <p className="web-small">
                  {c(
                    "enter_reps_then_mark_the_set_done_weight_is_optional_for_bodyweight_ex",
                  )}
                </p>
                <div className="web-set-labels" aria-hidden="true">
                  <span>{t("tracker_header_set")}</span>
                  <span>{t("tracker_header_kg")}</span>
                  <span>{t("tracker_header_reps")}</span>
                  <span>{t("tracker_header_check")}</span>
                  <span />
                </div>
                {exercise.sets.map((set, i) => (
                  <div
                    className="web-set-row"
                    data-completed={set.completed}
                    key={set.id}
                  >
                    <span className="web-set-number">{i + 1}</span>
                    <label>
                      <span className="sr-only">
                        {t("tracker_header_kg")} — {t("tracker_header_set")}{" "}
                        {i + 1}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.5"
                        value={set.weight || ""}
                        placeholder="0"
                        onChange={(e) =>
                          p.update(index, i, "weight", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      <span className="sr-only">
                        {t("tracker_header_reps")} — {t("tracker_header_set")}{" "}
                        {i + 1}
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={set.reps || ""}
                        placeholder="0"
                        onChange={(e) =>
                          p.update(index, i, "reps", e.target.value)
                        }
                      />
                    </label>
                    <button
                      disabled={!set.completed && !hasSetEffort(set)}
                      aria-pressed={set.completed}
                      aria-label={`${t("tracker_header_check")} — ${t("tracker_header_set")} ${i + 1}`}
                      onClick={() => p.complete(index, i)}
                    >
                      {set.completed ? "✓" : "○"}
                    </button>
                    <details className="web-set-menu">
                      <summary
                        onClick={(event) => {
                          sessionRef.current
                            ?.querySelectorAll(".web-set-menu[open]")
                            .forEach((menu) => {
                              if (menu !== event.currentTarget.parentElement)
                                menu.removeAttribute("open");
                            });
                        }}
                        aria-label={c("set_value_options", i + 1)}
                      >
                        ⋯
                      </summary>
                      <div onClick={closeMenus}>
                        <button onClick={() => p.plates(index, i)}>
                          {t("tracker_plate_calc_title")}
                        </button>
                        <button onClick={() => p.remove(index, i)}>
                          {c("remove_set")}
                        </button>
                      </div>
                    </details>
                    {previous && (
                      <div className="web-set-reference">
                        <span>
                          {c("previous")}:{" "}
                          {previous.lastSets[i]
                            ? previous.lastSets[i].durationSeconds
                              ? `${previous.lastSets[i].durationSeconds}s`
                              : `${previous.lastSets[i].weight} kg × ${previous.lastSets[i].reps}`
                            : c("no_matching_set")}
                        </span>
                        {previous.lastSets[i]?.reps > 0 &&
                          !previous.lastSets[i]?.durationSeconds &&
                          !set.completed &&
                          !set.weight &&
                          !set.reps && (
                            <button
                              type="button"
                              className="web-text-button"
                              aria-label={c(
                                "use_previous_values_for_set_value",
                                i + 1,
                              )}
                              onClick={() =>
                                p.quickLoad(index, exercise.name, i)
                              }
                            >
                              {c("use_previous")}
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  className="web-text-button"
                  onClick={() => p.add(index)}
                >
                  + {t("tracker_add_set")}
                </button>
                <button
                  className="web-remove-exercise"
                  onClick={() => p.deleteExercise(index)}
                >
                  {t("tracker_delete_exercise")}
                </button>
                {exerciseNavigation}
              </article>
            ) : (
              <div className="web-panel">
                <p>{c("add_an_exercise_to_begin")}</p>
                <button className="web-primary" onClick={p.edit}>
                  {t("tracker_add_exercises")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="web-session-actions">
        <button className="web-secondary" onClick={p.reset}>
          {c("reset_session")}
        </button>
        {confirmFinish ? (
          <div role="group" aria-label={t("tracker_finish")}>
            <p>
              {c("finish_now_only_completed_sets_count_toward_training_volume")}
            </p>
            <button
              className="web-secondary"
              onClick={() => setConfirmFinish(false)}
            >
              {t("tracker_cancel")}
            </button>
            <button className="web-primary" onClick={p.finish}>
              {t("tracker_finish")}
            </button>
          </div>
        ) : (
          <button
            className="web-primary"
            disabled={!completed}
            onClick={() => setConfirmFinish(true)}
          >
            {t("tracker_finish")} ↗
          </button>
        )}
      </footer>
    </section>
  );
}
