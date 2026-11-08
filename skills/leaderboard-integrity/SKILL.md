---
name: leaderboard-integrity
description: "Protect leaderboards, ranks and competitive results from forged scores, repeated submissions, win trading and reward manipulation."
---

# Leaderboard Integrity

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Trace score production from trusted gameplay events through result recording, rating updates, rewards and leaderboard publishing. Bind each result to a server-owned match and eligible participants.
- Reject client-reported score as authority unless independently verified by the trusted system; player-hosted results have inherent integrity limitations.
- Make rating and reward application idempotent, enforce match lifecycle and protect against duplicate, stale or cross-match results.
- Analyze win-trading and coordinated matches with context-aware signals and policy; avoid assuming high performance or repeated pairings prove cheating.
- Control visibility and auditability, define appeals and rollback, and reconcile rankings following confirmed incidents.

## Adversarial and regression tests

- Test forged score, unauthorized participant, repeated result, late/stale result, host-reported result, concurrent rating update and crash/retry.
- Test legitimate rematches and unusual but plausible performance; report what cannot be reliably verified.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
