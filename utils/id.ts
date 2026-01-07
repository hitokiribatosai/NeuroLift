export const generateId = (): string => {
    // Use crypto.randomUUID if available and secure, otherwise fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (e) {
            // Fallback if it fails
        }
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
