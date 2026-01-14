import { ExerciseDatabase, CategorizedExercises, MuscleGroup } from '../types';
import { getExerciseDatabase } from './exerciseData';

// Common substitutions map (Muscle -> Type -> Alternatives)
// This is a simplified logic. In a real app, this would be more comprehensive.
// We'll rely on matching muscle groups from the main database.

export interface SubstitutionOption {
    name: string;
    equipment: string;
    matchScore: number; // 0-100, how good a match it is
}

export const getSubstitutions = (
    originalExerciseName: string,
    language: 'en' | 'fr' | 'ar' = 'en'
): SubstitutionOption[] => {
    const db = getExerciseDatabase(language);
    let targetMuscle: string | null = null;
    let targetSubMuscle: string | null = null;
    let targetCategory: string | null = null;

    // 1. Find the exercise in the DB to know its muscle/category
    // This is O(N) scan, but DB is small enough for client-side
    for (const [muscle, subGroups] of Object.entries(db)) {
        for (const [subMuscle, categories] of Object.entries(subGroups)) {
            for (const [cat, exercises] of Object.entries(categories as CategorizedExercises)) {
                if (exercises.includes(originalExerciseName)) {
                    targetMuscle = muscle;
                    targetSubMuscle = subMuscle;
                    targetCategory = cat;
                    break;
                }
            }
            if (targetMuscle) break;
        }
        if (targetMuscle) break;
    }

    if (!targetMuscle || !targetSubMuscle) return [];

    const options: SubstitutionOption[] = [];
    const subGroups = db[targetMuscle];
    const categories = subGroups[targetSubMuscle];

    // 2. Find siblings in same sub-muscle group
    if (categories) {
        Object.entries(categories).forEach(([cat, exercises]) => {
            (exercises as string[]).forEach(exName => {
                if (exName !== originalExerciseName) {
                    options.push({
                        name: exName,
                        equipment: cat,
                        matchScore: cat === targetCategory ? 90 : 70 // Higher score if same equipment type
                    });
                }
            });
        });
    }

    return options.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
};
