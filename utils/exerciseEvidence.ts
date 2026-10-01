import media from './exerciseMedia.json';

export type ExerciseEvidence = {
  name: string;
  group: 'Chest' | 'Shoulders' | 'Legs' | 'Arms';
  targetKey: string;
  level: 'direct' | 'related';
  summaryKey: string;
  source: string;
  sourceTitle: string;
};

// Curated only for exercises with bundled demonstrations. "Direct" means the
// named movement was trained and muscle size measured; "related" means a
// nearby movement/family was tested, not this exact variation.
export const EXERCISE_EVIDENCE: ExerciseEvidence[] = [
  {
    name: 'Standard Push-ups', group: 'Chest', targetKey: 'research_target_chest_triceps',
    level: 'direct', summaryKey: 'research_pushup_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/29541130/',
    sourceTitle: 'Low-load bench press and push-up induce similar muscle hypertrophy and strength gain',
  },
  {
    name: 'Dumbbell Lateral Raise', group: 'Shoulders', targetKey: 'research_target_lateral_deltoid',
    level: 'direct', summaryKey: 'research_lateral_raise_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/40692697/',
    sourceTitle: 'Dumbbell versus cable lateral raises for lateral deltoid hypertrophy',
  },
  {
    name: 'Back Squat', group: 'Legs', targetKey: 'research_target_quads_glutes',
    level: 'direct', summaryKey: 'research_squat_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/37877099/',
    sourceTitle: 'Hip thrust and back squat training elicit similar gluteus muscle hypertrophy',
  },
  {
    name: 'Barbell Hip Thrust', group: 'Legs', targetKey: 'research_target_glutes',
    level: 'direct', summaryKey: 'research_hip_thrust_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/37877099/',
    sourceTitle: 'Hip thrust and back squat training elicit similar gluteus muscle hypertrophy',
  },
  {
    name: 'Seated Calf Raise', group: 'Legs', targetKey: 'research_target_soleus',
    level: 'direct', summaryKey: 'research_calf_raise_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/38156065/',
    sourceTitle: 'Triceps surae muscle hypertrophy is greater after standing versus seated calf-raise training',
  },
  {
    name: 'Bodyweight Squats', group: 'Legs', targetKey: 'research_target_quads_glutes',
    level: 'related', summaryKey: 'research_bodyweight_squat_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/31230110/',
    sourceTitle: 'Effects of squat training with different depths on lower limb muscle volumes',
  },
  {
    name: 'Goblet Squat', group: 'Legs', targetKey: 'research_target_quads_glutes',
    level: 'related', summaryKey: 'research_goblet_squat_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/31230110/',
    sourceTitle: 'Effects of squat training with different depths on lower limb muscle volumes',
  },
  {
    name: 'Barbell Curls', group: 'Arms', targetKey: 'research_target_elbow_flexors',
    level: 'related', summaryKey: 'research_curl_summary',
    source: 'https://pubmed.ncbi.nlm.nih.gov/31268995/',
    sourceTitle: 'Single-joint exercise results in higher hypertrophy of elbow flexors than multijoint exercise',
  },
];

const demonstratedNames = new Set(Object.keys(media));
export function getResearchExercisesForGroup(group: string): ExerciseEvidence[] {
  return EXERCISE_EVIDENCE.filter(item => item.group === group && demonstratedNames.has(item.name));
}
