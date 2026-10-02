# Exercise media

Sources:
- https://github.com/yuhonas/free-exercise-db at f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5 (Unlicense)
- https://github.com/bryllim/workout-guide at aac599224bb9780305239607ef98540b7e0ce389 (CC BY-SA 4.0 visual assets)

The Free Exercise DB license is copied to public/exercises/LICENSE.txt. Workout
Guide's asset license and attribution are copied to public/exercises/workout-guide/.
Workout Guide illustrations are credited to Bryl Lim and, where noted upstream,
Everkinetic. The app credits each demonstration beside its images. The manifest
records source names, pinned revisions, local paths and SHA-256 checksums.
Do not substitute a similar-looking exercise with a materially different grip,
equipment or movement path.

Run `node scripts/import-exercise-media.mjs` to reproduce the asset import.
Only exact names and explicit aliases are used. Unmatched exercises show a
text fallback. Review demonstrations visually before release and when updating
the source revision. Two stills cannot show every part of a movement.
Playback is opt-in and can be paused; both positions are visible initially.

The catalog currently contains 240 entries (231 distinct exercise names); 168
distinct exercises have bundled reference demos. Each demo has two still frames.
Some demos use an explicitly reviewed equivalent movement from a source dataset;
the UI names that source movement when it differs from the catalog title.
Research highlights are a separate, manually curated
subset of those demos and distinguish direct exercise trials from related
movement evidence. A study link is not a claim that an exercise is universally
best or guaranteed to produce a particular result.
