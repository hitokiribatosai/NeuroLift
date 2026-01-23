import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';
import { CompletedWorkout, JournalEntry, WorkoutTemplate } from '../types';

// Data validation utilities
const validateWorkout = (workout: CompletedWorkout): boolean => {
  if (!workout.id || typeof workout.id !== 'string') return false;
  if (!workout.date || typeof workout.date !== 'string') return false;
  if (typeof workout.durationSeconds !== 'number' || workout.durationSeconds < 0) return false;
  if (!Array.isArray(workout.exercises)) return false;
  if (typeof workout.totalVolume !== 'number' || workout.totalVolume < 0) return false;

  // Validate exercises
  for (const exercise of workout.exercises) {
    if (!exercise.name || typeof exercise.name !== 'string') return false;
    if (!Array.isArray(exercise.sets)) return false;
    for (const set of exercise.sets) {
      if (typeof set.weight !== 'number' || set.weight < 0) return false;
      if (typeof set.reps !== 'number' || set.reps < 0) return false;
      if (typeof set.completed !== 'boolean') return false;
    }
  }

  return true;
};

const validateJournalEntry = (entry: JournalEntry): boolean => {
  if (!entry.id || typeof entry.id !== 'string') return false;
  if (!entry.date || typeof entry.date !== 'string') return false;
  return true;
};

const validateTemplate = (template: WorkoutTemplate): boolean => {
  if (!template.id || typeof template.id !== 'string') return false;
  if (!template.name || typeof template.name !== 'string') return false;
  if (!Array.isArray(template.exercises)) return false;
  if (!template.createdAt || typeof template.createdAt !== 'string') return false;

  for (const exercise of template.exercises) {
    if (!exercise.name || typeof exercise.name !== 'string') return false;
    if (typeof exercise.targetSets !== 'number' || exercise.targetSets < 1) return false;
    if (!exercise.targetReps || typeof exercise.targetReps !== 'string') return false;
  }

  return true;
};

// Sanitization utilities
const sanitizeData = (data: any): any => {
  // Remove any potentially dangerous fields
  const sanitized = { ...data };

  // Remove any fields that start with __ or contain suspicious content
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('__') || key.startsWith('$')) {
      delete sanitized[key];
    }
  });

  return sanitized;
};

export class FirestoreService {
  private static instance: FirestoreService;
  private rateLimitMap: Map<string, number> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 100; // Max requests per minute

  private constructor() {}

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // Rate limiting check
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.rateLimitMap.get(userId) || 0;

    if (userRequests >= this.MAX_REQUESTS_PER_WINDOW) {
      // Reset if window has passed
      const lastReset = this.rateLimitMap.get(`${userId}_reset`) || 0;
      if (now - lastReset > this.RATE_LIMIT_WINDOW) {
        this.rateLimitMap.set(userId, 1);
        this.rateLimitMap.set(`${userId}_reset`, now);
        return true;
      }
      return false;
    }

    this.rateLimitMap.set(userId, userRequests + 1);
    return true;
  }

  // Get current user ID
  private getCurrentUserId(): string | null {
    const user = authService.getCurrentUser();
    return user?.uid || null;
  }

  // Workouts Collection
  async syncWorkout(workout: CompletedWorkout): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Validate workout data
    if (!validateWorkout(workout)) {
      throw new Error('Invalid workout data');
    }

    // Sanitize data
    const sanitizedWorkout = sanitizeData(workout);

    try {
      const workoutRef = doc(db, 'users', userId, 'workouts', workout.id);
      await setDoc(workoutRef, {
        ...sanitizedWorkout,
        syncedAt: Timestamp.now(),
        userId: userId // Explicitly set user ID for security rules
      });

      // Log successful sync for audit
      console.log(`Workout ${workout.id} synced successfully for user ${userId}`);
    } catch (error: any) {
      console.error('Error syncing workout:', error);

      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your authentication.');
      } else if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Data will sync when connection is restored.');
      } else if (error.code === 'resource-exhausted') {
        throw new Error('Too many requests. Please wait and try again.');
      } else {
        throw new Error('Failed to sync workout data. Please try again.');
      }
    }
  }

  async getWorkouts(limitCount: number = 50): Promise<CompletedWorkout[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    // Check rate limit
    if (!this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    try {
      const workoutsRef = collection(db, 'users', userId, 'workouts');
      const q = query(
        workoutsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      const workouts = snapshot.docs.map(doc => {
        const data = doc.data();
        // Validate data integrity
        if (!validateWorkout(data as CompletedWorkout)) {
          console.warn(`Invalid workout data for document ${doc.id}`);
          return null;
        }
        return {
          id: doc.id,
          ...data
        } as CompletedWorkout;
      }).filter(workout => workout !== null) as CompletedWorkout[];

      console.log(`Retrieved ${workouts.length} workouts for user ${userId}`);
      return workouts;
    } catch (error: any) {
      console.error('Error getting workouts:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Access denied. Please check your authentication.');
      } else if (error.code === 'unavailable') {
        console.warn('Firestore temporarily unavailable, returning empty results');
        return [];
      } else {
        throw new Error('Failed to retrieve workouts. Please try again.');
      }
    }
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);
      await deleteDoc(workoutRef);
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  }

  // Journal Entries Collection
  async syncJournalEntry(entry: JournalEntry): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Validate journal entry data
    if (!validateJournalEntry(entry)) {
      throw new Error('Invalid journal entry data');
    }

    // Sanitize data
    const sanitizedEntry = sanitizeData(entry);

    try {
      const entryRef = doc(db, 'users', userId, 'journal', entry.id);
      await setDoc(entryRef, {
        ...sanitizedEntry,
        syncedAt: Timestamp.now(),
        userId: userId
      });

      console.log(`Journal entry ${entry.id} synced successfully for user ${userId}`);
    } catch (error: any) {
      console.error('Error syncing journal entry:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your authentication.');
      } else if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Data will sync when connection is restored.');
      } else {
        throw new Error('Failed to sync journal entry. Please try again.');
      }
    }
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const journalRef = collection(db, 'users', userId, 'journal');
      const q = query(journalRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as JournalEntry));
    } catch (error) {
      console.error('Error getting journal entries:', error);
      return [];
    }
  }

  async deleteJournalEntry(entryId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const entryRef = doc(db, 'users', userId, 'journal', entryId);
      await deleteDoc(entryRef);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  }

  // Workout Templates Collection
  async syncTemplate(template: WorkoutTemplate): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Validate template data
    if (!validateTemplate(template)) {
      throw new Error('Invalid template data');
    }

    // Sanitize data
    const sanitizedTemplate = sanitizeData(template);

    try {
      const templateRef = doc(db, 'users', userId, 'templates', template.id);
      await setDoc(templateRef, {
        ...sanitizedTemplate,
        syncedAt: Timestamp.now(),
        userId: userId
      });

      console.log(`Template ${template.id} synced successfully for user ${userId}`);
    } catch (error: any) {
      console.error('Error syncing template:', error);

      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your authentication.');
      } else if (error.code === 'unavailable') {
        throw new Error('Service temporarily unavailable. Data will sync when connection is restored.');
      } else {
        throw new Error('Failed to sync template. Please try again.');
      }
    }
  }

  async getTemplates(): Promise<WorkoutTemplate[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const templatesRef = collection(db, 'users', userId, 'templates');
      const q = query(templatesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WorkoutTemplate));
    } catch (error) {
      console.error('Error getting templates:', error);
      return [];
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const templateRef = doc(db, 'users', userId, 'templates', templateId);
      await deleteDoc(templateRef);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  }

  // Sync all local data to Firestore
  async syncAllData(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      // Get all local data
      const localWorkouts = JSON.parse(localStorage.getItem('neuroLift_history') || '[]');
      const localJournal = JSON.parse(localStorage.getItem('neuroLift_journal') || '[]');
      const localTemplates = JSON.parse(localStorage.getItem('neuroLift_templates') || '[]');

      // Sync workouts
      for (const workout of localWorkouts) {
        await this.syncWorkout(workout);
      }

      // Sync journal entries
      for (const entry of localJournal) {
        await this.syncJournalEntry(entry);
      }

      // Sync templates
      for (const template of localTemplates) {
        await this.syncTemplate(template);
      }

      console.log('All data synced to Firestore');
    } catch (error) {
      console.error('Error syncing all data:', error);
    }
  }

  // Merge cloud data with local data (enhanced with conflict resolution)
  async mergeCloudData(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      console.log('Starting data merge for user:', userId);

      const [cloudWorkouts, cloudJournal, cloudTemplates] = await Promise.all([
        this.getWorkouts(),
        this.getJournalEntries(),
        this.getTemplates()
      ]);

      // Enhanced merge with conflict resolution
      const localWorkouts = this.getLocalData('neuroLift_history', []);
      const mergedWorkouts = this.mergeWithConflictResolution(localWorkouts, cloudWorkouts, 'syncedAt');
      localStorage.setItem('neuroLift_history', JSON.stringify(mergedWorkouts));

      const localJournal = this.getLocalData('neuroLift_journal', []);
      const mergedJournal = this.mergeWithConflictResolution(localJournal, cloudJournal, 'syncedAt');
      localStorage.setItem('neuroLift_journal', JSON.stringify(mergedJournal));

      const localTemplates = this.getLocalData('neuroLift_templates', []);
      const mergedTemplates = this.mergeWithConflictResolution(localTemplates, cloudTemplates, 'syncedAt');
      localStorage.setItem('neuroLift_templates', JSON.stringify(mergedTemplates));

      console.log(`Data merge completed: ${mergedWorkouts.length} workouts, ${mergedJournal.length} journal entries, ${mergedTemplates.length} templates`);

      // Trigger sync for any local changes
      await this.syncPendingChanges();

    } catch (error) {
      console.error('Error merging cloud data:', error);
      throw new Error('Failed to synchronize data. Please check your connection and try again.');
    }
  }

  // Enhanced merge with timestamp-based conflict resolution
  private mergeWithConflictResolution<T extends { id: string }>(
    local: T[],
    cloud: T[],
    timestampField: keyof T
  ): T[] {
    const merged = new Map<string, T>();

    // Add all local items
    local.forEach(item => merged.set(item.id, item));

    // Add or update with cloud items (cloud wins conflicts)
    cloud.forEach(cloudItem => {
      const localItem = merged.get(cloudItem.id);

      if (!localItem) {
        // New item from cloud
        merged.set(cloudItem.id, cloudItem);
      } else {
        // Conflict resolution: compare timestamps
        const localTime = (localItem as any)[timestampField];
        const cloudTime = (cloudItem as any)[timestampField];

        if (!localTime || (cloudTime && cloudTime > localTime)) {
          // Cloud version is newer or local has no timestamp
          merged.set(cloudItem.id, cloudItem);
        }
        // If local is newer or equal, keep local version
      }
    });

    return Array.from(merged.values());
  }

  // Safe localStorage access
  private getLocalData<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (error) {
      console.error(`Error reading localStorage key ${key}:`, error);
      return fallback;
    }
  }

  // Sync any pending local changes to cloud
  private async syncPendingChanges(): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      // Check for unsynced local data and sync
      const localWorkouts = this.getLocalData('neuroLift_history', []);
      const unsyncedWorkouts = localWorkouts.filter((w: any) => !w.syncedAt);

      for (const workout of unsyncedWorkouts) {
        try {
          await this.syncWorkout(workout);
        } catch (error) {
          console.warn('Failed to sync workout:', workout.id, error);
        }
      }

      console.log(`Synced ${unsyncedWorkouts.length} pending workouts`);
    } catch (error) {
      console.error('Error syncing pending changes:', error);
    }
  }

  // Helper method to merge arrays by ID, keeping the most recent version
  private mergeArraysById<T extends { id: string }>(local: T[], cloud: T[]): T[] {
    const merged = new Map<string, T>();

    // Add all local items
    local.forEach(item => merged.set(item.id, item));

    // Add or update with cloud items (cloud takes precedence for conflicts)
    cloud.forEach(item => merged.set(item.id, item));

    return Array.from(merged.values());
  }
}

// Export singleton instance
export const firestoreService = FirestoreService.getInstance();