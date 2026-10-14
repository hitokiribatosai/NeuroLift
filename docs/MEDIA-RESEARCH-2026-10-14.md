# Missing exercise media research — 2026-10-14

## Implementation follow-up

Visually approved and bundled the pinned Free Exercise DB pairs for `Tricep Extension Machine` → `Machine Triceps Extension` and `Neutral Grip Cable Row` → `Seated Cable Rows`. The latter uses a V-handle with palms facing each other; both photos and the pinned instructions confirm the neutral grip. Coverage is now **170/231**, leaving **61** without demonstrations. Existing source credits/checksums remain in place.

Rejected the proposed `Reverse Grip Bent-Over Rows` import after fetching both images: `/0.jpg` and `/1.jpg` are byte-identical (SHA-1 `f642d8e885bc70006ffec3d93646d795d27cc6f3`), so they cannot provide a start/finish demonstration. No AI artwork or unclear-license assets were imported. The research below records the earlier candidate stage, not the current coverage count.

Research only: no application mappings, assets or native binaries changed. Counted current catalog against `exerciseMedia.json`: 231 distinct names, 168 demonstrated, 63 missing. Candidate records below are metadata/instruction matches, not completed visual approval or guaranteed final coverage.

## Sources inspected

- [Free Exercise DB](https://github.com/yuhonas/free-exercise-db): current manifest has 876 entries. Already used by NeuroLift. Found overlooked aliases: `Barbell Rows (Underhand)` → `Reverse Grip Bent-Over Rows`, and `Tricep Extension Machine` → `Machine Triceps Extension`, both list two images. Review exact poses and pin source before importing. Its repository declares Unlicense; retain provenance.
- [Everkinetic](https://github.com/everkinetic/data): 289 records in `dist/exercises.json`, not all illustrated. CC BY-SA 4.0. Records 0026 (reverse-grip barbell rows) and 0210 (machine triceps extension) list relaxation/tension SVG and PNG files. Shares provenance with existing Workout Guide, so not an entirely independent image collection. Some metadata is inaccurate (e.g. machine extension prose); do not import instructions unquestioningly.
- [Workout Guide](https://github.com/bryllim/workout-guide): current manifest has 302 records; artwork CC BY-SA 4.0. Includes Single-Arm Cable Row and Glute Bridge candidates, but posture and the meaning of NeuroLift's generic `Bridges` need review. Current source uses three frames and changed slug conventions; do not blindly update the existing pinned importer.
- [RepDB](https://github.com/RepDB/exercise-dataset): 643 records, 512px start/peak WebP illustrations (some static holds have only one image). Candidate records: Wide Grip Pull Ups; One-Arm Seated Cable Row; Reverse Grip Bent Over Row; Machine Triceps Extension; Glute Bridge. These could map to missing Wide Grip Pull-ups, Single Arm Seated Row, Barbell Rows (Underhand), Tricep Extension Machine, and possibly Bridges. These overlap other sources; do not add their counts together.
- [RepDB license](https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md): free commercial in-app use with attribution; prohibits republishing as a dataset/API; premium animation previews are evaluation-only. Explicitly says artwork was generated with AI tooling. Owner previously requested a non-AI product; discuss artwork choice before using it. Clarify how selected assets may be stored in NeuroLift's public repository rather than assuming app-use permission permits dataset redistribution. No generative restyling.
- [GymVisual-backed dataset notice](https://github.com/hasaneyldrm/exercises-dataset/blob/main/NOTICE.md): repository's separate permission to distribute 180px images does not itself grant downstream rights. Review licensor terms/obtain required permission, not merely an MIT code license. Related forks often share this exact dataset or remove image/GIF URLs; not independent new art sources.
- [OpenTraining exercises](https://github.com/chaosbastler/opentraining-exercises): additional XML/image collection, including Everkinetic artwork. Check individual image license/provenance and avoid counting duplicated source art as new coverage.
- [wger](https://github.com/wger-project/wger): promising follow-up exercise wiki/API source. Exercise media permissions are per entry, separate from AGPL application code. No specific missing-exercise asset was approved from wger during this search.

## Mismatches deliberately not approved

- Wide-Grip Rear Pull-Up is not an ordinary front wide-grip pull-up.
- Double/Single Leg Butt Kick is not automatically the jogging warm-up Butt Kicks.
- Seated Cable Rows with overhand instructions is not proof of an underhand or neutral-grip match.
- A generic machine chest press is not proof of the exact Hammer Strength incline/decline model.
- Archer Push Ups does not establish the requested incline variant.
- Names such as Cable Face Away Row, Cable Hamstring Walkout, Cable Glute-Ham Raise, Chest-Supported Press and Face Pull (DB) need clear movement definitions before image selection.

## Suggested implementation order

1. Visually verify the two overlooked photo aliases and add only correct pairs with pinned revisions/checksums and tests.
2. Review remaining Everkinetic/Workout Guide candidates, preserving attribution and share-alike notices for artwork.
3. Discuss RepDB's AI artwork and public-repository distribution before adoption.
4. Keep truthful missing-image fallbacks; do not substitute mismatched equipment/grip just to improve a percentage.
5. Keep two-frame playback explicitly labeled: alternating stills is not a continuous technique video. Real GIFs can be supported separately if properly licensed.

No exhaustive claim that every GitHub repository was searched, no final new coverage count, and no visual approval of candidate images is claimed. Current app coverage remains 168/231.
