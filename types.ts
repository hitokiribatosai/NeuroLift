export interface WorkoutPlan {
  title: string;
  description: string;
  exercises: Exercise[];
  estimatedDuration: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes: string;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
  avatar: string;
}

export enum MuscleGroup {
  CHEST = 'Chest',
  BACK = 'Back',
  QUADS = 'Quads',
  HAMSTRINGS = 'Hamstrings',
  CALVES = 'Calves',
  SHOULDERS = 'Shoulders',
  ARMS = 'Arms',
  CORE = 'Core',
  FULL_BODY = 'Full Body'
}

export type Language = 'en' | 'fr' | 'ar';

export interface CustomMeasurement {
  id: string;
  name: string;
  value: number;
  unit: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  // Standard Bodybuilding Measurements
  weight?: number;
  neck?: number;
  shoulders?: number;
  chest?: number;
  biceps_left?: number;
  biceps_right?: number;
  forearms?: number;
  waist?: number;
  hips?: number;
  thigh_left?: number;
  thigh_right?: number;
  calves?: number;

  // Dynamic
  customMeasurements?: CustomMeasurement[];
  notes?: string;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ActiveExercise {
  name: string;
  sets: WorkoutSet[];
}

export interface CompletedWorkout {
  id: string;
  date: string;
  durationSeconds: number;
  exercises: ActiveExercise[];
  totalVolume: number;
}

export interface CategorizedExercises {
  weightlifting: string[];
  cables: string[];
  bodyweight: string[];
}

export type ExerciseDatabase = Record<string, CategorizedExercises>;