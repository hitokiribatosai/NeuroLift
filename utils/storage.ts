import { dbStorage } from './db';

export const safeStorage = {
    getItem: (key: string): string | null => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn(`Error reading from localStorage key "${key}":`, e);
            return null;
        }
    },

    setItem: (key: string, value: string): void => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn(`Error writing to localStorage key "${key}":`, e);
        }
    },

    removeItem: (key: string): void => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn(`Error removing from localStorage key "${key}":`, e);
        }
    },

    /**
     * Safely parses a JSON string. Returns the fallback if parsing fails or if the result is null.
     */
    getParsed: <T>(key: string, fallback: T): T => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return fallback;
            const parsed = JSON.parse(item);
            return parsed === null ? fallback : parsed;
        } catch (e) {
            console.warn(`Error parsing localStorage key "${key}":`, e);
            return fallback;
        }
    },

    // New IndexedDB methods
    async getWorkout(id: string) {
        return dbStorage.getItem('workouts', id);
    },

    async saveWorkout(id: string, workout: any) {
        return dbStorage.setItem('workouts', id, workout);
    },

    async getAllWorkouts() {
        return dbStorage.getAll('workouts');
    },

    async getJournalEntry(id: string) {
        return dbStorage.getItem('journal', id);
    },

    async saveJournalEntry(id: string, entry: any) {
        return dbStorage.setItem('journal', id, entry);
    },

    async getAllJournalEntries() {
        return dbStorage.getAll('journal');
    }
};

// Migration helper: Move localStorage data to IndexedDB
export const migrateToIndexedDB = async () => {
    try {
        // Migrate workouts
        const workoutsData = localStorage.getItem('completedWorkouts');
        if (workoutsData) {
            const workouts = JSON.parse(workoutsData);
            for (const workout of workouts) {
                await safeStorage.saveWorkout(workout.id, workout);
            }
            console.log('Migrated workouts to IndexedDB');
        }

        // Migrate journal entries
        const journalData = localStorage.getItem('journalEntries');
        if (journalData) {
            const entries = JSON.parse(journalData);
            for (const entry of entries) {
                await safeStorage.saveJournalEntry(entry.id, entry);
            }
            console.log('Migrated journal entries to IndexedDB');
        }

        // Mark migration as complete
        localStorage.setItem('db-migration-complete', 'true');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};
