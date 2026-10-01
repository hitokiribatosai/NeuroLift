import { SYNC_KEYS } from './workspace';
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
export function validateBackup(backup: unknown): Record<string, string> {
 if (!object(backup) || backup.version !== 1 || !object(backup.data)) throw new Error('Unsupported backup format.');
 if (JSON.stringify(backup).length > 1_500_000) throw new Error('Backup exceeds the preview size limit.');
 const result: Record<string, string> = {};
 for (const [key,value] of Object.entries(backup.data)) {
  if (!(SYNC_KEYS as readonly string[]).includes(key)) throw new Error('Unsupported backup category: ' + key);
  if (['neuroLift_history','neuroLift_journal','neuroLift_templates','neuroLift_cal_history'].includes(key)) {
   if (!Array.isArray(value) || value.length > 5000) throw new Error('Invalid collection: ' + key);
   const ids = new Set();
   for (const item of value) {
    if (!object(item)) throw new Error('Invalid record.');
    if (key !== 'neuroLift_cal_history') {
     if (typeof item.id !== 'string' || !item.id || ids.has(item.id)) throw new Error('Records require unique IDs.');
     ids.add(item.id);
    }
    if (key === 'neuroLift_history') {
     if (typeof item.date !== 'string' || !number(item.durationSeconds) || !number(item.totalVolume) || !Array.isArray(item.exercises)) throw new Error('Invalid workout.');
     for (const e of item.exercises) {
      if (!object(e) || typeof e.name !== 'string' || !Array.isArray(e.sets)) throw new Error('Invalid exercise.');
      for (const s of e.sets) if (!object(s) || !number(s.weight) || !number(s.reps) || typeof s.completed !== 'boolean') throw new Error('Invalid workout set.');
     }
    }
    if (key === 'neuroLift_templates') {
     if (typeof item.name !== 'string' || !Array.isArray(item.exercises)) throw new Error('Invalid template.');
     for (const e of item.exercises) if (!object(e) || typeof e.name !== 'string' || !number(e.targetSets) || typeof e.targetReps !== 'string') throw new Error('Invalid template exercise.');
    }
    if (key === 'neuroLift_journal' && typeof item.date !== 'string') throw new Error('Invalid journal date.');
    if (key === 'neuroLift_cal_history' && (typeof item.date !== 'string' || !number(item.calories))) throw new Error('Invalid calorie history.');
   }
  } else if (key === 'neuroLift_user_profile') {
   if (!object(value)) throw new Error('Invalid profile.');
  } else if (!['string', 'number', 'boolean'].includes(typeof value)) throw new Error('Invalid setting.');
  if (key === 'neuroLift_daily_cal' && (!Number.isFinite(Number(value)) || Number(value) < 0)) throw new Error('Invalid daily calories.');
  result[key] = typeof value === 'string' ? value : JSON.stringify(value);
 }
 if (!Object.keys(result).length) throw new Error('Backup contains no data.');
 return result;
}
