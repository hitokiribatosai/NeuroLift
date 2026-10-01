import { safeStorage } from './storage';
import { getEnglishExerciseName } from './exerciseData';
import { ExerciseHistory, WorkoutSet, CompletedWorkout } from '../types';
export const exerciseHistoryService = {
 async getExerciseHistory(name: string): Promise<ExerciseHistory | null> {
  const history = (await safeStorage.getAllWorkouts()).filter(w => !w.isDemo).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const entries = history.flatMap(w => w.exercises.filter(e => getEnglishExerciseName(e.name) === getEnglishExerciseName(name)).map(e => ({ date:w.date, sets:e.sets.filter(s => s.completed) }))).filter(e => e.sets.length);
  if (!entries.length) return null;
  const sets = entries.flatMap(e => e.sets);
  return { exerciseName: name, lastPerformed: entries[0].date, lastSets: entries[0].sets, personalRecord: {
   maxWeight: Math.max(0, ...sets.map(s => s.weight)), maxReps: Math.max(0, ...sets.map(s => s.reps)), maxVolume: Math.max(0, ...sets.map(s => s.weight * s.reps)),
  }};
 },
 async updateHistory(_workout: CompletedWorkout) { /* Derived from the canonical workout collection. */ },
 async getProgressiveOverloadSuggestion(name: string): Promise<{suggestedSets: WorkoutSet[]; reason:string} | null> {
  const history = await this.getExerciseHistory(name);
  const sets = history?.lastSets.filter(s => s.reps > 0 && !s.durationSeconds);
  if (!sets?.length) return null;
  return { suggestedSets: sets.map((s,i) => ({...s, id: 'set-' + Date.now() + '-' + i, completed:false})), reason:'Repeat your last completed sets. Adjust when your chosen rep target is controlled and recovery is good.' };
 },
};
