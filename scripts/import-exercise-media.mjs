import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const revision = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const guideRevision = 'aac599224bb9780305239607ef98540b7e0ce389';
const base = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/' + revision;
const guideBase = 'https://raw.githubusercontent.com/bryllim/workout-guide/' + guideRevision;
// Only exact names and explicit aliases. Never use fuzzy matches for demonstrations.
const aliases = {
 'Flat Dumbbell Press': 'Dumbbell Bench Press',
 'Flat Barbell Bench Press': 'Barbell Bench Press - Medium Grip',
 'Incline Barbell Bench Press': 'Barbell Incline Bench Press - Medium Grip',
 'Dumbbell Flat Fly': 'Dumbbell Flyes', 'Dumbbell Incline Fly': 'Incline Dumbbell Flyes',
 'Standard Push-ups': 'Pushups', 'Parallel Bar Dips': 'Dips - Chest Version',
 'Back Squat': 'Barbell Squat', 'Deadlifts': 'Barbell Deadlift',
 'DB RDL': 'Romanian Deadlift With Dumbbells', 'Barbell Curls': 'Barbell Curl',
 'Dumbbell Lateral Raise': 'Side Lateral Raise', 'Barbell Overhead Press': 'Standing Military Press',
 'Barbell Shrugs': 'Barbell Shrug', 'Dumbbell Shrugs': 'Dumbbell Shrug',
 'Pec Deck Machine': 'Butterfly', 'Bodyweight Squats': 'Bodyweight Squat',
 'Incline Hammer Strength Press': 'Leverage Incline Chest Press',
 'Cable Incline Fly': 'Incline Cable Flye',
 'Incline Cable Press': 'Incline Cable Chest Press',
 'Single Arm Low Cable Fly': 'Single-Arm Cable Crossover',
 'Decline Pushups': 'Decline Push-Up',
 'Feet Elevated Pushups': 'Push-Ups With Feet Elevated',
 'Incline Machine Press': 'Leverage Incline Chest Press',
 'Smith Machine Incline Press': 'Smith Machine Incline Bench Press',
 'Cable Crossover (Middle)': 'Cable Crossover',
 'Chest Press Machine': 'Leverage Chest Press',
 'Lever Chest Press': 'Leverage Chest Press',
 'Decline Dumbbell Press': 'Decline Dumbbell Bench Press',
 'Weighted Dips (Chest Focus)': 'Dips - Chest Version',
 'Incline Push-ups': 'Incline Push-Up',
 'Machine Dip Station': 'Dip Machine',
 'Decline Chest Press Machine': 'Leverage Decline Chest Press',
 'Bent Over BB Row': 'Bent Over Barbell Row',
 'Wide Grip Lat Pulldown': 'Wide-Grip Lat Pulldown',
 'V-Bar Lat Pulldown': 'V-Bar Pulldown',
 'Single Arm Lat Pulldown': 'One Arm Lat Pulldown',
 'Straight Arm Pulldown': 'Straight-Arm Pulldown',
 'Barbell Upright Row': 'Upright Barbell Row',
 'Behind the Back Shrugs': 'Barbell Shrug Behind The Back',
 'Rope Face Pull': 'Face Pull',
 'Single Arm Rear Delt Fly': 'Cable Rear Delt Fly',
 'Stiff Leg Deadlift': 'Stiff-Legged Barbell Deadlift',
 'Cable Pull-through': 'Pull Through',
 'Arnold Press': 'Arnold Dumbbell Press',
 'Dumbbell Front Raise': 'Front Dumbbell Raise',
 'Cable Front Raise': 'Front Cable Raise',
 'Cable Upright Row': 'Upright Cable Row',
 'Reverse Cable Crossover': 'Cable Rear Delt Fly',
 'Front Squat': 'Front Barbell Squat',
 'Leg Press Machine': 'Leg Press',
 'Seated Leg Curl Machine': 'Seated Leg Curl',
 'Standing Leg Curl Machine': 'Standing Leg Curl',
 'Cable Glute Kickback': 'One-Legged Cable Kickback',
 'Glute Kickback Machine': 'Glute Kickback',
 'Dumbbell Calf Raise': 'Standing Dumbbell Calf Raise',
 'Standing Calf Raise': 'Standing Barbell Calf Raise',
 'Barbell Calf Raise': 'Standing Barbell Calf Raise',
 'Dumbbell Curls': 'Dumbbell Bicep Curl',
 'Standing Cable Curl': 'Standing Biceps Cable Curl',
 'Bicep Curl Machine': 'Machine Bicep Curl',
 'Close Grip Bench Press': 'Close-Grip Barbell Bench Press',
 'Tricep Pushdown': 'Triceps Pushdown',
 'Rope Pushdown': 'Triceps Pushdown - Rope Attachment',
 'Cable Crunches': 'Cable Crunch',
 'Hanging Leg Raises': 'Hanging Leg Raise',
 'Ab Wheel Rollouts': 'Ab Roller',
 'Stationary Bike': 'Bicycling, Stationary',
 'Rowing Machine': 'Rowing, Stationary',
 'Treadmill': 'Running, Treadmill',
 'Floor Press (Dumbbell)': 'Dumbbell Floor Press',
 'Pull-ups': 'Pullups',
 'Scapular Pull-ups': 'Scapular Pull-Up',
 'Assisted Pull-up Machine': 'Band Assisted Pull-Up',
 'Cable Deadlift': 'Cable Deadlifts',
 'Shoulder Press Machine': 'Machine Shoulder (Military) Press',
 'Smith Machine Press': 'Smith Machine Overhead Shoulder Press',
 'Bodyweight Row (Rings)': 'Inverted Row with Straps',
 'Good Mornings': 'Good Morning',
 'Glute-Ham Raise Machine': 'Glute Ham Raise',
 'Hack Squat Machine': 'Hack Squat',
 'Weighted Step Ups': 'Dumbbell Step Ups',
 'Weighted Lunges': 'Dumbbell Lunges',
 'Leg Extension Machine': 'Leg Extensions',
 'Lying Leg Curl Machine': 'Lying Leg Curls',
 'Seated Calf Machine': 'Seated Calf Raise',
 'Bodyweight Calf Raise': 'Standing Calf Raises',
 'Preacher Curl Machine': 'Machine Preacher Curls',
 'Dips': 'Parallel Bar Dip',
 'Middle Cable Fly': 'Cable Crossover',
 'Decline Cable Fly': 'Cable Crossover',
 'Single Arm High Cable Fly': 'Single-Arm Cable Crossover',
 'Standing Decline Cable Press': 'Standing Cable Chest Press',
 'Front Lat Pulldown': 'Close-Grip Front Lat Pulldown',
 'Cable Lateral Raise': 'Cable Seated Lateral Raise',
 'Cable Face Pull': 'Face Pull',
 'Single Arm Cable Lateral': 'Cable Seated Lateral Raise',
 'Dumbbell Pullover': 'Straight-Arm Dumbbell Pullover',
 'DB Pullover (Lat Focus)': 'Straight-Arm Dumbbell Pullover',
 'Snatch Grip DL': 'Snatch Deadlift',
 'Hyper-extensions': 'Hyperextensions (Back Extensions)',
 'Hyperextension Station': 'Hyperextensions (Back Extensions)',
};
// These names were checked against the Workout Guide movement and equipment.
// A near match is intentionally omitted when grip, angle, or equipment changes.
const guideAliases = {
 'Diamond Push-ups': 'Diamond Push-up',
 'Wide Grip Push-ups': 'Wide Push-up',
 'Meadows Rows': 'Meadows Row',
 'Chin-ups': 'Chin-up',
 'Neutral Grip Pull-ups': 'Neutral-Grip Pull-up',
 'Lat Pulldown Machine': 'Lat Pulldown',
 'Face Pulls': 'Face Pull',
 'Rear Delt Machine': 'Reverse Pec Deck',
 'T-Bar Rows': 'T-Bar Row',
 'Pendlay Rows': 'Pendlay Row',
 'Inverted Rows': 'Inverted Row',
 'Seated Row Machine': 'Machine Row',
 'Chest Supported Row Machine': 'Chest Supported Row',
 'Bird-Dog': 'Bird Dog',
 'Pike Push-ups': 'Pike Push-up',
 'Shoulder Taps': 'Plank Shoulder Tap',
 'Machine Lateral Raise': 'Machine Lateral Raise',
 'Reverse Dumbbell Fly': 'Rear Delt Fly',
 'Rear Delt Pec Deck': 'Reverse Pec Deck',
 'Walking Lunges (DB)': 'Walking Lunge',
 'Bulgarian Split Squat': 'Bulgarian Split Squat',
 'Pistol Squats': 'Pistol Squat',
 'Sissy Squats': 'Sissy Squat',
 'DB RDL': 'Dumbbell Romanian Deadlift',
 'Cable Pull Through': 'Cable Pull-Through',
 'Nordic Curls': 'Nordic Hamstring Curl',
 'Sliding Leg Curls': 'Towel Hamstring Curl',
 'Sumo Squat (DB)': 'Dumbbell Sumo Squat',
 'Cable Abduction': 'Cable Standing Hip Abduction',
 'Glute Bridges': 'Glute Bridge',
 'Donkey Kicks': 'Donkey Kick',
 'Fire Hydrants': 'Fire Hydrant',
 'Single Leg BW Raise': 'Single-Leg Calf Raise',
 'Jumping Jacks': 'Jumping Jack',
 'Skull Crushers': 'Skull Crusher',
 'Barbell Wrist Curls': 'Wrist Curl',
 'Dead Hang': 'Dead Hang',
 'Burpees': 'Burpee',
 'High Knees': 'High Knees',
 'Running (Outdoors)': 'Running',
 'Walking': 'Walking',
 'Stair Climber': 'Stair Climber',
};
async function download(url) {
 const r = await fetch(url);
 if (!r.ok) throw new Error(r.status + ': ' + url);
 return Buffer.from(await r.arrayBuffer());
}
const data = JSON.parse((await download(base + '/dist/exercises.json')).toString());
const guide = JSON.parse((await download(guideBase + '/packages/workout-guide/manifest.json')).toString());
const source = await readFile('utils/exerciseData.ts', 'utf8');
const catalog = source.slice(source.indexOf('const db:'), source.indexOf('export const getExerciseDatabase'));
const rows = [...catalog.matchAll(/\{ en: "([^"]+)"/g)].map(m => m[1]);
const names = [...new Set(rows)];
const previous = JSON.parse(await readFile('utils/exerciseMedia.json', 'utf8'));
const manifest = {};
await mkdir('public/exercises', { recursive: true });
await mkdir('public/exercises/workout-guide', { recursive: true });
await writeFile('public/exercises/LICENSE.txt', await download(base + '/LICENSE.md'));
await writeFile('public/exercises/workout-guide/LICENSE-ASSETS', await download(guideBase + '/LICENSE-ASSETS'));
await writeFile('public/exercises/workout-guide/ATTRIBUTION.md', await download(guideBase + '/ATTRIBUTION.md'));
async function bundledImage(path, url, priorHash) {
 try {
  const bytes = await readFile('public' + path);
  if (priorHash && createHash('sha256').update(bytes).digest('hex') === priorHash) return bytes;
 } catch { /* Missing local asset: fetch the pinned source. */ }
 const bytes = await download(url);
 await writeFile('public' + path, bytes);
 return bytes;
}
for (const name of names) {
 const entry = data.find(e => e.name.toLowerCase() === (aliases[name] || name).toLowerCase());
 if (entry && entry.images.length === 2) {
  const images = [], hashes = [];
  for (let i = 0; i < 2; i++) {
   const path = '/exercises/' + entry.id + '-' + i + '.jpg';
   const priorHash = previous[name]?.revision === revision && previous[name]?.sourceId === entry.id
    ? previous[name]?.hashes?.[i] : undefined;
   const bytes = await bundledImage(path, base + '/exercises/' + entry.images[i], priorHash);
   images.push(path);
   hashes.push(createHash('sha256').update(bytes).digest('hex'));
  }
  manifest[name] = { source: 'free-exercise-db', sourceName: entry.name, sourceId: entry.id, revision, images, hashes };
  continue;
 }
 const illustration = guide.find(e => e.name === guideAliases[name]);
 if (!illustration || illustration.frames.length < 2) continue;
 const images = [], hashes = [];
 for (const frame of illustration.frames.slice(0, 2)) {
  const path = '/exercises/workout-guide/' + illustration.slug + '-' + frame.index + '.svg';
  const priorHash = previous[name]?.revision === guideRevision && previous[name]?.sourceId === illustration.slug
   ? previous[name]?.hashes?.[frame.index - 1] : undefined;
  const bytes = await bundledImage(path, guideBase + '/packages/workout-guide/' + frame.path, priorHash);
  images.push(path);
  hashes.push(createHash('sha256').update(bytes).digest('hex'));
 }
 manifest[name] = { source: 'workout-guide', sourceName: illustration.name, sourceId: illustration.slug, revision: guideRevision, images, hashes };
}
await writeFile('utils/exerciseMedia.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('Bundled ' + Object.keys(manifest).length + '/' + names.length + ' distinct exercises (' + rows.length + ' catalog entries); unmatched exercises show a fallback.');
