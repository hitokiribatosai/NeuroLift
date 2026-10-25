import { CompletedWorkout, JournalEntry, WorkoutTemplate } from '../types';
import { safeStorage } from './storage';
import { generateId } from './id';

// Demo workout data
export const generateDemoWorkouts = (): CompletedWorkout[] => {
  const today = new Date();
  const workouts: CompletedWorkout[] = [];

  // Demo workout 1: Push Day (3 days ago)
  const pushDay = new Date(today);
  pushDay.setDate(today.getDate() - 3);

  workouts.push({
    id: generateId(),
    date: pushDay.toISOString(),
    name: "Push Day",
    durationSeconds: 3420, // 57 minutes
    totalVolume: 12500, // kg
    isDemo: true,
    exercises: [
      {
        name: "Bench Press",
        sets: [
          { id: generateId(), weight: 80, reps: 8, completed: true },
          { id: generateId(), weight: 80, reps: 8, completed: true },
          { id: generateId(), weight: 75, reps: 10, completed: true },
          { id: generateId(), weight: 75, reps: 10, completed: true }
        ]
      },
      {
        name: "Overhead Press",
        sets: [
          { id: generateId(), weight: 60, reps: 8, completed: true },
          { id: generateId(), weight: 60, reps: 8, completed: true },
          { id: generateId(), weight: 55, reps: 10, completed: true }
        ]
      },
      {
        name: "Tricep Dips",
        sets: [
          { id: generateId(), weight: 0, reps: 12, completed: true },
          { id: generateId(), weight: 0, reps: 12, completed: true },
          { id: generateId(), weight: 0, reps: 15, completed: true }
        ]
      }
    ]
  });

  // Demo workout 2: Pull Day (5 days ago)
  const pullDay = new Date(today);
  pullDay.setDate(today.getDate() - 5);

  workouts.push({
    id: generateId(),
    date: pullDay.toISOString(),
    name: "Pull Day",
    durationSeconds: 2880, // 48 minutes
    totalVolume: 9800,
    isDemo: true,
    exercises: [
      {
        name: "Deadlift",
        sets: [
          { id: generateId(), weight: 120, reps: 5, completed: true },
          { id: generateId(), weight: 120, reps: 5, completed: true },
          { id: generateId(), weight: 110, reps: 6, completed: true }
        ]
      },
      {
        name: "Pull-ups",
        sets: [
          { id: generateId(), weight: 0, reps: 8, completed: true },
          { id: generateId(), weight: 0, reps: 8, completed: true },
          { id: generateId(), weight: 0, reps: 6, completed: true }
        ]
      },
      {
        name: "Barbell Curls",
        sets: [
          { id: generateId(), weight: 35, reps: 10, completed: true },
          { id: generateId(), weight: 35, reps: 10, completed: true },
          { id: generateId(), weight: 30, reps: 12, completed: true }
        ]
      }
    ]
  });

  // Demo workout 3: Leg Day (7 days ago)
  const legDay = new Date(today);
  legDay.setDate(today.getDate() - 7);

  workouts.push({
    id: generateId(),
    date: legDay.toISOString(),
    name: "Leg Day",
    durationSeconds: 3960, // 66 minutes
    totalVolume: 15600,
    isDemo: true,
    exercises: [
      {
        name: "Squats",
        sets: [
          { id: generateId(), weight: 100, reps: 8, completed: true },
          { id: generateId(), weight: 100, reps: 8, completed: true },
          { id: generateId(), weight: 95, reps: 10, completed: true }
        ]
      },
      {
        name: "Romanian Deadlift",
        sets: [
          { id: generateId(), weight: 80, reps: 10, completed: true },
          { id: generateId(), weight: 80, reps: 10, completed: true },
          { id: generateId(), weight: 75, reps: 12, completed: true }
        ]
      },
      {
        name: "Leg Press",
        sets: [
          { id: generateId(), weight: 150, reps: 12, completed: true },
          { id: generateId(), weight: 150, reps: 12, completed: true },
          { id: generateId(), weight: 160, reps: 10, completed: true }
        ]
      }
    ]
  });

  return workouts;
};

// Demo journal entry
export const generateDemoJournalEntry = (): JournalEntry => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    id: generateId(),
    date: yesterday.toISOString().split('T')[0], // YYYY-MM-DD format
    weight: 75.5,
    chest: 105,
    biceps_left: 15.2,
    biceps_right: 15.0,
    waist: 82,
    thigh_left: 58,
    thigh_right: 57,
    notes: "Feeling strong after yesterday's leg day. Recovery seems good.",
    isDemo: true
  };
};

// Demo workout templates
export const generateDemoTemplates = (): WorkoutTemplate[] => {
  return [
    {
      id: generateId(),
      name: "Push Day (Chest/Shoulders/Triceps)",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      isDemo: true,
      exercises: [
        { name: "Bench Press", targetSets: 4, targetReps: "8-10" },
        { name: "Incline Dumbbell Press", targetSets: 3, targetReps: "10-12" },
        { name: "Overhead Press", targetSets: 3, targetReps: "8-10" },
        { name: "Lateral Raises", targetSets: 3, targetReps: "12-15" },
        { name: "Tricep Dips", targetSets: 3, targetReps: "10-12" },
        { name: "Tricep Pushdowns", targetSets: 3, targetReps: "12-15" }
      ]
    },
    {
      id: generateId(),
      name: "Pull Day (Back/Biceps/Forearms)",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      isDemo: true,
      exercises: [
        { name: "Deadlift", targetSets: 4, targetReps: "5-6" },
        { name: "Pull-ups", targetSets: 3, targetReps: "8-10" },
        { name: "Bent-over Rows", targetSets: 3, targetReps: "8-10" },
        { name: "Face Pulls", targetSets: 3, targetReps: "12-15" },
        { name: "Barbell Curls", targetSets: 3, targetReps: "10-12" },
        { name: "Hammer Curls", targetSets: 3, targetReps: "10-12" }
      ]
    },
    {
      id: generateId(),
      name: "Leg Day (Quads/Hamstrings/Calves)",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      isDemo: true,
      exercises: [
        { name: "Squats", targetSets: 4, targetReps: "8-10" },
        { name: "Leg Press", targetSets: 3, targetReps: "10-12" },
        { name: "Romanian Deadlift", targetSets: 3, targetReps: "8-10" },
        { name: "Leg Curls", targetSets: 3, targetReps: "10-12" },
        { name: "Calf Raises", targetSets: 3, targetReps: "15-20" },
        { name: "Walking Lunges", targetSets: 3, targetReps: "10/side" }
      ]
    }
  ];
};

// Insert demo data into storage
export const insertDemoData = () => {
  // Check if demo data already exists
  const existingHistory = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []);
  const existingJournal = safeStorage.getParsed<JournalEntry[]>('neuroLift_journal', []);
  const existingTemplates = safeStorage.getParsed<WorkoutTemplate[]>('neuroLift_templates', []);

  const hasDemoWorkouts = existingHistory.some(w => w.isDemo);
  const hasDemoJournal = existingJournal.some(e => e.isDemo);
  const hasDemoTemplates = existingTemplates.some(t => t.isDemo);

  if (hasDemoWorkouts && hasDemoJournal && hasDemoTemplates) {
    return; // Demo data already exists
  }

  // Insert demo workouts
  if (!hasDemoWorkouts) {
    const demoWorkouts = generateDemoWorkouts();
    const updatedHistory = [...demoWorkouts, ...existingHistory];
    safeStorage.setItem('neuroLift_history', JSON.stringify(updatedHistory));
  }

  // Insert demo journal entry
  if (!hasDemoJournal) {
    const demoJournalEntry = generateDemoJournalEntry();
    const updatedJournal = [demoJournalEntry, ...existingJournal];
    safeStorage.setItem('neuroLift_journal', JSON.stringify(updatedJournal));
  }

  // Insert demo templates
  if (!hasDemoTemplates) {
    const demoTemplates = generateDemoTemplates();
    const updatedTemplates = [...demoTemplates, ...existingTemplates];
    safeStorage.setItem('neuroLift_templates', JSON.stringify(updatedTemplates));
  }
};

// Clear all demo data
export const clearDemoData = () => {
  const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []);
  const journal = safeStorage.getParsed<JournalEntry[]>('neuroLift_journal', []);
  const templates = safeStorage.getParsed<WorkoutTemplate[]>('neuroLift_templates', []);

  // Filter out demo data
  const realHistory = history.filter(w => !w.isDemo);
  const realJournal = journal.filter(e => !e.isDemo);
  const realTemplates = templates.filter(t => !t.isDemo);

  // Update storage
  const ids = new Set(realTemplates.map(template => template.id));
  const schedule = safeStorage.getParsed<Record<string, string>>('neuroLift_weekly_schedule', {});
  return safeStorage.setItems({
    neuroLift_history: JSON.stringify(realHistory),
    neuroLift_journal: JSON.stringify(realJournal),
    neuroLift_templates: JSON.stringify(realTemplates),
    neuroLift_weekly_schedule: JSON.stringify(Object.fromEntries(Object.entries(schedule).filter(([, id]) => ids.has(id)))),
  });
};

// Check if demo data exists
export const hasDemoData = (): boolean => {
  const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []);
  const journal = safeStorage.getParsed<JournalEntry[]>('neuroLift_journal', []);
  const templates = safeStorage.getParsed<WorkoutTemplate[]>('neuroLift_templates', []);

  return history.some(w => w.isDemo) || journal.some(e => e.isDemo) || templates.some(t => t.isDemo);
};

// Check if user has real workouts (non-demo)
export const hasRealWorkouts = (): boolean => {
  const history = safeStorage.getParsed<CompletedWorkout[]>('neuroLift_history', []);
  return history.some(w => !w.isDemo);
};
