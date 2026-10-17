import { Reorder } from "framer-motion";
import React from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useCopy } from "../../hooks/useCopy";
import { ActiveExercise } from "../../types";
import { getExerciseTranslation } from "../../utils/exerciseData";
import { safeStorage } from "../../utils/storage";
import { Modal } from "../ui/Modal";
import { ReorderExercise } from "../web/ReorderExercise";

interface Props {
  showReorderModal: boolean;
  setShowReorderModal: React.Dispatch<React.SetStateAction<boolean>>;
  t: ReturnType<typeof useLanguage>["t"];
  tempReorderList: ActiveExercise[];
  setTempReorderList: React.Dispatch<React.SetStateAction<ActiveExercise[]>>;
  reorderFeedback: { name: string; position: number; sequence: number };
  setReorderFeedback: React.Dispatch<
    React.SetStateAction<{ name: string; position: number; sequence: number }>
  >;
  c: ReturnType<typeof useCopy>;
  language: import("../../types").Language;
  moveReorderExercise: (index: number, offset: -1 | 1) => void;
  setActiveExercises: React.Dispatch<React.SetStateAction<ActiveExercise[]>>;
}

export function TrackerReorderDialog({
  showReorderModal,
  setShowReorderModal,
  t,
  tempReorderList,
  setTempReorderList,
  reorderFeedback,
  setReorderFeedback,
  c,
  language,
  moveReorderExercise,
  setActiveExercises,
}: Props) {
  return (
    <Modal
      isOpen={showReorderModal}
      onClose={() => setShowReorderModal(false)}
      label={t("tracker_reorder_title")}
    >
      <div className="p-8 bg-zinc-950 surface-paper border border-zinc-900 surface-border rounded-[3rem] surface-rounded max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <h3 className="text-2xl font-black text-white surface-ink uppercase tracking-tight mb-6 flex items-center gap-3">
          <svg
            className="w-6 h-6 text-teal-500 surface-green"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="9" cy="5" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="9" cy="19" r="1.5" />
            <circle cx="15" cy="5" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="15" cy="19" r="1.5" />
          </svg>
          {t("tracker_reorder_title")}
        </h3>

        <Reorder.Group
          axis="y"
          values={tempReorderList}
          onReorder={setTempReorderList}
          layoutScroll
          className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-6 p-1"
          data-reorder-list
        >
          {tempReorderList.map((ex, idx) => (
            <ReorderExercise
              key={ex.name}
              exercise={ex}
              selected={reorderFeedback?.name === ex.name}
              select={() =>
                setReorderFeedback((previous) => ({
                  name: ex.name,
                  position: idx + 1,
                  sequence: (previous?.sequence ?? 0) + 1,
                }))
              }
              label={`${c("drag")}: ${getExerciseTranslation(ex.name, language)}`}
            >
              <span className="text-2xl font-black text-teal-500 surface-green w-8">
                {idx + 1}
              </span>
              <span className="flex-1 text-white surface-ink font-bold">
                {getExerciseTranslation(ex.name, language)}
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveReorderExercise(idx, -1)}
                  aria-label={`${c("move_up")}: ${getExerciseTranslation(ex.name, language)}`}
                  disabled={idx === 0}
                  className="p-3 bg-zinc-800 surface-paper hover:bg-teal-500 surface-accent text-zinc-400 surface-muted surface-ink hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 surface-paper disabled:hover:text-zinc-400 surface-ink rounded-lg transition-colors"
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
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => moveReorderExercise(idx, 1)}
                  aria-label={`${c("move_down")}: ${getExerciseTranslation(ex.name, language)}`}
                  disabled={idx === tempReorderList.length - 1}
                  className="p-3 bg-zinc-800 surface-paper hover:bg-teal-500 surface-accent text-zinc-400 surface-muted surface-ink hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 surface-paper disabled:hover:text-zinc-400 surface-ink rounded-lg transition-colors"
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </ReorderExercise>
          ))}
        </Reorder.Group>

        <p
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {reorderFeedback &&
            `${getExerciseTranslation(reorderFeedback.name, language)} — ${c("position")} ${reorderFeedback.position} / ${tempReorderList.length}`}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setShowReorderModal(false)}
            className="flex-1 py-4 bg-zinc-900 surface-paper border border-zinc-800 surface-border rounded-2xl surface-rounded text-zinc-400 surface-muted surface-ink hover:text-white font-black uppercase tracking-widest transition-colors text-xs"
          >
            {t("confirm_cancel")}
          </button>
          <button
            onClick={() => {
              setActiveExercises(tempReorderList);
              safeStorage.setItem(
                "neuroLift_tracker_active_exercises",
                JSON.stringify(tempReorderList),
              );
              setShowReorderModal(false);
            }}
            className="flex-1 py-4 bg-teal-500 surface-accent hover:bg-teal-600 surface-accent text-white surface-ink font-black uppercase tracking-widest rounded-2xl surface-rounded transition-colors text-xs"
          >
            {t("tracker_reorder_apply")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
