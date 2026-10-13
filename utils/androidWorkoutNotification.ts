import { Capacitor, registerPlugin, PluginListenerHandle } from '@capacitor/core';
import { ActiveExercise } from '../types';
import { getExerciseTranslation, getLocalizedMuscleName, getMuscleForExercise } from './exerciseData';
import { Language } from '../types';

export interface NotificationStatus { granted: boolean; exact: boolean }
export interface WorkoutNotice { title: string; body: string; restTitle: string; readyTitle: string; restEnd: number }
export const AndroidWorkout = registerPlugin<{
  status(): Promise<NotificationStatus>;
  enable(): Promise<NotificationStatus>;
  update(notice: WorkoutNotice): Promise<void>;
  clear(): Promise<void>;
  settings(options: { exact: boolean }): Promise<void>;
  addListener(name: 'openWorkout' | 'resume', callback: () => void): Promise<PluginListenerHandle>;
}>('WorkoutNotification');
export const hasAndroidWorkoutNotification = () => Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('WorkoutNotification');
const preference = 'neurolift.android-workout-notifications';
export const notificationsEnabled = () => localStorage.getItem(preference) === 'true';
export function setNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(preference, String(enabled));
  window.dispatchEvent(new Event('workout-notification-preference'));
}
export async function offerWorkoutNotification() {
  if (!hasAndroidWorkoutNotification() || localStorage.getItem(preference) !== null) return;
  try { const status = await AndroidWorkout.enable(); setNotificationsEnabled(status.granted); }
  catch { setNotificationsEnabled(false); }
}

// Derived from the saved draft so this remains available when Tracker is unmounted.
export function workoutNotice(data: Record<string, string>, language: Language, now = Date.now()): WorkoutNotice | null {
  if (!['active', 'selection'].includes(data.neuroLift_tracker_phase)) return null;
  let exercises: ActiveExercise[], selected: string | null;
  try {
    exercises = JSON.parse(data.neuroLift_tracker_active_exercises || '[]');
    selected = JSON.parse(data.ui_session_exercise || 'null');
  } catch { return null; }
  if (!Array.isArray(exercises) || !exercises.length) return null;
  const exercise = exercises.find(ex => ex.name === selected) || exercises[0];
  const c = (en: string, fr: string, ar: string) => language === 'fr' ? fr : language === 'ar' ? ar : en;
  const next = exercise.sets.findIndex(set => !set.completed);
  const progress = next < 0 ? c('All sets logged', 'Séries enregistrées', 'تم تسجيل كل المجموعات')
    : c(`Set ${next + 1} of ${exercise.sets.length}`, `Série ${next + 1} sur ${exercise.sets.length}`, `المجموعة ${next + 1} من ${exercise.sets.length}`);
  const end = Number(data.neuroLift_rest_end_time || 0);
  return {
    title: getExerciseTranslation(exercise.name, language),
    body: `${getLocalizedMuscleName(getMuscleForExercise(exercise.name), language)} · ${progress}`,
    restTitle: `${c('Rest', 'Repos', 'راحة')} · ${getExerciseTranslation(exercise.name, language)}`,
    readyTitle: c('Rest finished', 'Repos terminé', 'انتهت الراحة'),
    restEnd: Number.isFinite(end) && end > now ? end : 0,
  };
}
