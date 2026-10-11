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
  BICEPS = 'Biceps',
  TRICEPS = 'Triceps',
  GLUTES = 'Glutes',
  ARMS = 'Arms',
  FOREARMS = 'Forearms',
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
  isDemo?: boolean;
}

export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  durationSeconds?: number;
  distanceKm?: number;
}

export interface ActiveExercise {
  name: string;
  sets: WorkoutSet[];
  /** A plan cue only; set entries remain blank until the user logs them. */
  targetReps?: string;
}

export interface CompletedWorkout {
  id: string;
  date: string;
  name?: string;
  durationSeconds: number;
  exercises: ActiveExercise[];
  totalVolume: number;
  templateId?: string;
  isDemo?: boolean;
}

export interface CategorizedExercises {
  dumbbells: string[];
  barbells: string[];
  cables: string[];
  bodyweight: string[];
  machines: string[];
}

// Hierarchical Structure: Major Category -> Muscle Sub-group -> Equipment Category
export type ExerciseDatabase = Record<string, Record<string, CategorizedExercises>>;

export interface ExerciseHistory {
  exerciseName: string;
  lastPerformed: string; // ISO date
  lastSets: WorkoutSet[];
  personalRecord: {
    maxWeight: number;
    maxReps: number;
    maxVolume: number; // weight × reps
  };
}

// Onboarding & User Profile
export interface UserProfile {
  name: string;
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height: number | null; // in cm
  weight: number | null; // in kg
  goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_health';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  unitSystem: 'metric' | 'imperial';
}

export interface OnboardingState extends UserProfile {
  step: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: {
    name: string;
    targetSets: number;
    targetReps: string;
    notes?: string;
  }[];
  lastUsed?: string;
  createdAt: string;
  isDemo?: boolean;
}
