# NeuroLift continuity instructions

## Working checkout

The owner designated `/Users/rahalabdelilah/Desktop/NeuroLift` as the active project location on this Mac. Use this checkout for development and builds; older copies under Documents are historical. On another machine, use the newly cloned checkout rather than assuming this absolute path exists.

## Start every session

1. Read `PROJECT_HANDOVER.md` before development.
2. Inspect branch, working tree, recent commits, and relevant source. Verify the handover against code; it is a dated record, not proof that a deployment or test still works.
3. Briefly summarize current status and recommend the next task. Do not automatically change the application on session recovery; wait for the user's instruction.
4. Continue completed work rather than restarting it. Respect existing architecture, conventions, platform distinctions and decisions unless a justified change is requested.

## During work and before ending

### Maintainable code (owner instruction, 2026-10-17)

- Preserve the approved shared UI and platform-specific native behavior. Do not add parallel legacy implementations or select presentation by platform unless the design actually differs.
- Keep screen components focused on composition. Extract cohesive dialogs, selection controls and template workflows; put persistence and session transitions behind typed helpers/hooks. Avoid giant hooks or untyped prop bags that merely relocate complexity.
- Share reset/cleanup rules, but keep finish (save + summary) distinct from discard. Preserve workspace keys and saved-data formats unless a tested migration is explicitly required.
- Reuse centralized translations, theme tokens and explicit component classes. Do not add broad substring-based utility overrides or escalate CSS specificity to patch a component.
- Isolate gesture/animation logic from workout data; preserve keyboard alternatives, vertical scrolling, reduced motion, RTL and input behavior.
- Add regression coverage for changed behavior; run types/lint/unit/build and relevant browser tests before committing. Native compilation and physical-device acceptance are separate evidence.
- Remove dead code only after checking all callers, configurations and native entry points. Prefer small independently tested refactors over speculative abstraction. Refactoring remains normal as requirements evolve.

- Track features, fixes, decisions, incomplete work and remaining risks. Update `PROJECT_HANDOVER.md` after each meaningful development step and before ending a development session.
- Keep it navigable and project-specific. Distinguish implementation, tests, device validation, commits, pushes and deployments. Never invent results or completion.
- Never record passwords, tokens, API keys, database connection strings, certificates or other private credentials. Public service URLs and configuration variable names are sufficient.
- Preserve user changes; avoid unnecessary edits to working code. Do not stage everything blindly: `work/` can contain generated native builds and dependencies.
- Local builds go in the git-ignored `builds/android/` and `builds/ios/` folders. Keep only the latest build per platform: after producing a new build, delete the previous one and update the build paths/hash in `PROJECT_HANDOVER.md`.
- Follow the user's requested scope and the standing publishing instruction below; do not include unrelated changes merely because documentation changed.

## Standing commit, push and checkpoint policy

The owner requested on 2026-10-13: commit and push every completed change while leaving a recovery stamp. After each meaningful, completed and appropriately verified change within the requested work:

1. Update the handover and review the diff; stage appropriate files explicitly. Exclude secrets, generated builds, unrelated edits and personal signing configuration.
2. Commit the change on the intended branch. Create a unique annotated Git tag such as `checkpoint-YYYY-MM-DD-short-description` for that completed state. Never overwrite an existing checkpoint.
3. Push the intended branch and that new tag to the configured remote, then verify both remote references. Do not push all branches/tags: local backup branches may contain obsolete credentials.
4. Report the commit, checkpoint tag and actual push result. If blocked, preserve the local commit/tag and explain the blocker; never claim synchronization without verification or force-push to bypass divergence.

This is standing authorization; no repeated confirmation is needed for in-scope commits and pushes. Later user restrictions override it. Read-only inspections and incomplete edits do not require empty or per-keystroke commits. Git checkpoints preserve committed source, not ignored APKs or secrets.

## When the user says “Prepare handover”

1. Review session work and actual repository changes.
2. Update `PROJECT_HANDOVER.md`: completed/incomplete work, decisions, known issues, actionable next steps and verification results.
3. Run relevant tests when practical; record commands, actual outcomes and anything not tested.
4. Review the working tree and diffs for appropriate source changes, unrelated edits and secrets.
5. Commit the updated handover and appropriate project changes, then push to the configured remote/current intended branch if access permits. Never force-push or overwrite unrelated work. If a branch mismatch or unexpected remote divergence appears, investigate before proceeding.
6. Report commit hash, branch, verified push status, and remaining uncommitted/unpushed work. A failed push is not synchronization; preserve local files and explain the blocker.

## Cross-account recovery

The repository files—not chat history or access to this Codex account—are the continuity mechanism. A new account needs repository access and its own provider/tool authorization. Do not copy credentials into the handover. A fresh clone cannot recover uncommitted files or local APKs; resolve that gap explicitly before migration.
