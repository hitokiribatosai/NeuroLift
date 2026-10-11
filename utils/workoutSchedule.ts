import { CompletedWorkout, WorkoutTemplate } from '../types';

export type WeeklyWorkoutSchedule = Record<string, string>;

export interface NextScheduledWorkout {
  template: WorkoutTemplate;
  date: Date;
  daysUntil: number;
}

export function findNextScheduledWorkout(
  templates: WorkoutTemplate[],
  schedule: WeeklyWorkoutSchedule,
  from = new Date(),
  completedWorkouts: CompletedWorkout[] = []
): NextScheduledWorkout | null {
  for (let daysUntil = 0; daysUntil < 7; daysUntil += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + daysUntil);
    const templateId = schedule[String(date.getDay())];
    const template = templates.find(item => item.id === templateId);
    const alreadyCompletedToday = daysUntil === 0 && completedWorkouts.some(workout => {
      if (workout.templateId !== templateId) return false;
      const completedAt = new Date(workout.date);
      return completedAt.getFullYear() === date.getFullYear()
        && completedAt.getMonth() === date.getMonth()
        && completedAt.getDate() === date.getDate();
    });
    if (template && !alreadyCompletedToday) return { template, date, daysUntil };
  }
  return null;
}
