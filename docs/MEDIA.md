# Exercise media

Source: https://github.com/yuhonas/free-exercise-db
Revision: f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5
Upstream publishes under the Unlicense, copied to public/exercises/LICENSE.txt.
Photographs are unmodified. The manifest records source names, revision,
local paths and SHA-256 checksums. Do not substitute a similar-looking exercise.

Run `node scripts/import-exercise-media.mjs` to reproduce the asset import.
Only exact names and explicit aliases are used. Unmatched exercises show a
text fallback. Review demonstrations visually before release and when updating
the source revision. Two stills cannot show every part of a movement.
Playback is opt-in and can be paused; both positions are visible initially.

The catalog currently contains 240 exercises; 121 have bundled reference demos
(108 unique source movements and 216 still images). Some demos use an explicitly
reviewed equivalent movement from the dataset; the UI names that source movement when it differs
from the catalog title. Research highlights are a separate, manually curated
subset of those demos and distinguish direct exercise trials from related
movement evidence. A study link is not a claim that an exercise is universally
best or guaranteed to produce a particular result.
