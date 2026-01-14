import { dbStorage } from './db';
import { ExerciseHistory, WorkoutSet, CompletedWorkout } from '../types';

export const exerciseHistoryService = {
    /**
     * Get history for specific exercise
     */
    async getExerciseHistory(exerciseName: string): Promise<ExerciseHistory | null> {
        try {
            // We store history in 'settings' store for now, or we could create a new store.
            // Using 'settings' with specific key prefix is simple.
            const history = await dbStorage.getItem('settings', `history_${exerciseName}`);
            return history || null;
        } catch (error) {
            console.error('Failed to get exercise history:', error);
            return null;
        }
    },

    /**
     * Update history after workout completion
     */
    async updateHistory(workout: CompletedWorkout): Promise<void> {
        for (const exercise of workout.exercises) {
            const existingHistory = await this.getExerciseHistory(exercise.name);

            // Calculate PR
            const maxWeight = Math.max(...exercise.sets.map(s => Number(s.weight) || 0));
            const maxReps = Math.max(...exercise.sets.map(s => Number(s.reps) || 0));
            const maxVolume = Math.max(...exercise.sets.map(s => (Number(s.weight) || 0) * (Number(s.reps) || 0)));

            const newHistory: ExerciseHistory = {
                exerciseName: exercise.name,
                lastPerformed: workout.date,
                lastSets: exercise.sets,
                personalRecord: {
                    maxWeight: Math.max(maxWeight, existingHistory?.personalRecord.maxWeight || 0),
                    maxReps: Math.max(maxReps, existingHistory?.personalRecord.maxReps || 0),
                    maxVolume: Math.max(maxVolume, existingHistory?.personalRecord.maxVolume || 0)
                }
            };

            await dbStorage.setItem('settings', `history_${exercise.name}`, newHistory);
        }
    },

    /**
     * Get suggested next workout (progressive overload)
     */
    async getProgressiveOverloadSuggestion(exerciseName: string): Promise<{
        suggestedSets: WorkoutSet[];
        reason: string;
    } | null> {
        const history = await this.getExerciseHistory(exerciseName);
        if (!history) return null;

        const lastSets = history.lastSets;
        if (lastSets.length === 0) return null;

        const avgWeight = lastSets.reduce((sum, s) => sum + (Number(s.weight) || 0), 0) / lastSets.length;
        const avgReps = lastSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0) / lastSets.length;

        // Progressive overload logic
        let suggestedSets: WorkoutSet[] = [];
        let reason = '';

        if (avgReps >= 12) {
            // If doing high reps, suggest weight increase
            const newWeight = Math.ceil((avgWeight + 2.5) / 2.5) * 2.5; // Round to nearest 2.5kg
            suggestedSets = lastSets.map((set, i) => ({
                ...set,
                id: `set-${Date.now()}-${i}`,
                weight: newWeight,
                reps: 8,
                completed: false
            }));
            reason = `+${(newWeight - avgWeight).toFixed(1)}kg (Stronger!)`;
        } else if (avgReps < 6) {
            // If doing low reps, suggest rep increase
            suggestedSets = lastSets.map((set, i) => ({
                ...set,
                id: `set-${Date.now()}-${i}`,
                reps: (set.reps || 0) + 1,
                completed: false
            }));
            reason = '+1 rep per set';
        } else {
            // Default: small weight increase
            const newWeight = Math.ceil((avgWeight + 2.5) / 2.5) * 2.5;
            suggestedSets = lastSets.map((set, i) => ({
                ...set,
                id: `set-${Date.now()}-${i}`,
                weight: newWeight,
                completed: false
            }));
            reason = `+${(newWeight - avgWeight).toFixed(1)}kg`;
        }

        return { suggestedSets, reason };
    }
};
