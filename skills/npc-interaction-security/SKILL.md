---
name: npc-interaction-security
description: "Prevent remote NPC, quest and shop interaction exploits. Use when players open NPC menus or trigger trades, quests or dialogue outside allowed range or state."
---

# Npc Interaction Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Resolve player identity from the session and NPC from server world state; require same instance/zone, NPC availability and allowed player state.
- Measure interaction range from server-simulated or verified positions, not client-supplied coordinates. Validate line of sight or facing only where required by game rules.
- Validate every state-changing follow-up at execution: proximity, quest prerequisites, item availability, server-owned price and funds. A visible menu is not authorization.
- A short-lived server-issued context may bind actor/NPC/instance, but recheck relevant current state and never treat a token as a substitute for transactional purchase validation.
- Perform coupled deductions and grants atomically; handle retries and concurrency.

## Adversarial and regression tests

- Test just inside/outside range, wrong zone, missing/despawned NPC, spoofed coordinates, opening then moving away, and stale interaction context.
- Test altered price, insufficient currency, duplicate and concurrent purchases, disconnect during commit and legitimate lag.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.

## Reference

For an NPC/shop pseudocode example and additional cross-domain test cases, read `references/threat-checklists.md`.
