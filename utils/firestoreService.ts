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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { authService } from './authService';
import { CompletedWorkout, JournalEntry, WorkoutTemplate } from '../types';

export class FirestoreService {
  private static instance: FirestoreService;

  private constructor() {}

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  // Get current user ID
  private getCurrentUserId(): string | null {
    const user = authService.getCurrentUser();
    return user?.uid || null;
  }

  // Workouts Collection
  async syncWorkout(workout: CompletedWorkout): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) return;

    try {
      const workoutRef = doc(db, 'users', userId, 'workouts', workout.id);
      await setDoc(workoutRef, {
        ...workout,
        syncedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error syncing workout:', error);
    }
  }

  async getWorkouts(): Promise<CompletedWorkout[]> {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    try {
      const workoutsRef = collection(db, 'users', userId, 'workouts');
      const q = query(workoutsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CompletedWorkout));
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
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
    if (!userId) return;

    try {
      const entryRef = doc(db, 'users', userId, 'journal', entry.id);
      await setDoc(entryRef, {
        ...entry,
        syncedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error syncing journal entry:', error);
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
    if (!userId) return;

    try {
      const templateRef = doc(db, 'users', userId, 'templates', template.id);
      await setDoc(templateRef, {
        ...template,
        syncedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error syncing template:', error);
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

  // Merge cloud data with local data
  async mergeCloudData(): Promise<void> {
    try {
      const [cloudWorkouts, cloudJournal, cloudTemplates] = await Promise.all([
        this.getWorkouts(),
        this.getJournalEntries(),
        this.getTemplates()
      ]);

      // Merge workouts
      const localWorkouts = JSON.parse(localStorage.getItem('neuroLift_history') || '[]');
      const mergedWorkouts = this.mergeArraysById(localWorkouts, cloudWorkouts);
      localStorage.setItem('neuroLift_history', JSON.stringify(mergedWorkouts));

      // Merge journal entries
      const localJournal = JSON.parse(localStorage.getItem('neuroLift_journal') || '[]');
      const mergedJournal = this.mergeArraysById(localJournal, cloudJournal);
      localStorage.setItem('neuroLift_journal', JSON.stringify(mergedJournal));

      // Merge templates
      const localTemplates = JSON.parse(localStorage.getItem('neuroLift_templates') || '[]');
      const mergedTemplates = this.mergeArraysById(localTemplates, cloudTemplates);
      localStorage.setItem('neuroLift_templates', JSON.stringify(mergedTemplates));

      console.log('Cloud data merged with local data');
    } catch (error) {
      console.error('Error merging cloud data:', error);
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