# NeuroLift continuity instructions

## Start every session

1. Read `PROJECT_HANDOVER.md` before development.
2. Inspect branch, working tree, recent commits, and relevant source. Verify the handover against code; it is a dated record, not proof that a deployment or test still works.
3. Briefly summarize current status and recommend the next task. Do not automatically change the application on session recovery; wait for the user's instruction.
4. Continue completed work rather than restarting it. Respect existing architecture, conventions, platform distinctions and decisions unless a justified change is requested.

## During work and before ending

- Track features, fixes, decisions, incomplete work and remaining risks. Update `PROJECT_HANDOVER.md` after each meaningful development step and before ending a development session.
- Keep it navigable and project-specific. Distinguish implementation, tests, device validation, commits, pushes and deployments. Never invent results or completion.
- Never record passwords, tokens, API keys, database connection strings, certificates or other private credentials. Public service URLs and configuration variable names are sufficient.
- Preserve user changes; avoid unnecessary edits to working code. Do not stage everything blindly: `work/` can contain generated native builds and dependencies.
- Documentation updates do not by themselves authorize publishing application changes. Follow the user's requested scope.

## When the user says “Prepare handover”

1. Review session work and actual repository changes.
2. Update `PROJECT_HANDOVER.md`: completed/incomplete work, decisions, known issues, actionable next steps and verification results.
3. Run relevant tests when practical; record commands, actual outcomes and anything not tested.
4. Review the working tree and diffs for appropriate source changes, unrelated edits and secrets.
5. Commit the updated handover and appropriate project changes, then push to the configured remote/current intended branch if access permits. Never force-push or overwrite unrelated work. If a branch mismatch or unexpected remote divergence appears, investigate before proceeding.
6. Report commit hash, branch, verified push status, and remaining uncommitted/unpushed work. A failed push is not synchronization; preserve local files and explain the blocker.

## Cross-account recovery

The repository files—not chat history or access to this Codex account—are the continuity mechanism. A new account needs repository access and its own provider/tool authorization. Do not copy credentials into the handover. A fresh clone cannot recover uncommitted files or local APKs; resolve that gap explicitly before migration.
