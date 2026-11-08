---
name: quest-progression-security
description: "Secure quests, achievements, checkpoints and progression against forged completion and repeated claims. Use for skipped quest steps, fake kills, checkpoint teleporting or repeated turn-ins."
---

# Quest Progression Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Model each quest as a server-owned state machine: eligibility, activation, required objective events, completion and reward-claimed state. State the intended order and reset rules.
- Accept objective progress from validated server events, not client declarations of kills, collection or completion. Bind progress to the account, character, quest version and match/instance where applicable.
- Validate NPC proximity and prerequisites on turn-in when game rules require them; confirm prior steps even if the client opens a completion UI.
- Commit completion and reward together or use a durable idempotent workflow; define repeatable quest periods using trusted server time.
- Handle party credit, reconnect, quest reset and migrations without allowing events from an earlier run to count in a later run.

## Adversarial and regression tests

- Test skipped checkpoints, fabricated kill events, wrong actor/instance, duplicate objective event, turn-in before completion or out of range, repeat claim, reset boundary and concurrent claims.
- Assert reward and quest state remain consistent after disconnect/retry; check legitimate party and reconnect credit.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
