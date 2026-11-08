---
name: combat-security
description: "Secure multiplayer combat, damage, weapon fire, hit validation and abilities. Use for forged hits, damage hacks, cooldown bypass or lag compensation."
---

# Combat Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Trace client action through server actor ownership, alive state, match phase, equipped weapon, ammunition/resources and server-controlled cooldown.
- Derive damage and rewards on trusted infrastructure from server-controlled stats and rules. A requested target, aim vector, timestamp or hit report is a claim, not proof.
- Validate target eligibility, spatial range and collision/line of sight where game rules require it; apply results consistently for simultaneous events.
- If using rewind, enforce a documented maximum history window and validate against server-stored history. Model moving cover and fairness; do not let the client choose unlimited rewind.
- Separate visual prediction from authoritative health and reconcile accepted results.

## Adversarial and regression tests

- Test spoofed damage or target, shooting through cover, invalid ownership, attacks while stunned/dead, exhausted ammunition and cooldown boundary.
- Test concurrent lethal hits, duplicate requests, delayed inputs, rewind limits and legitimate high latency.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
