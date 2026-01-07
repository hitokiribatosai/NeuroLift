
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
    }
};
