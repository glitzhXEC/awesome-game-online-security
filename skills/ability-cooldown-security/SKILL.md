---
name: ability-cooldown-security
description: "Secure cooldowns, resource costs and skill activation in multiplayer games. Use for no-cooldown hacks, infinite mana, ability spam or forged cast state."
---

# Ability Cooldown Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Keep cooldown deadlines, resource balances, charges and ability ownership in trusted state, based on trusted time or server ticks.
- Check actor, current state, global and ability cooldowns, available charges, resource costs, equipment, match phase, target and permissions on each activation.
- Atomically reserve or consume resources and begin cooldown with the accepted cast; define cancellation, interruption, refund and reconnect rules.
- Validate haste, buffs and cooldown reduction against server-owned modifiers with bounded values. Do not trust client time, reported cooldown or local animation as authority.
- Support predicted effects and latency compensation without allowing duplicate activation or negative costs; pair with combat-security for hit and damage rules.

## Adversarial and regression tests

- Test parallel casts on last resource, same request repeated, negative costs, forged cooldown modifier, cast while stunned/dead, cancellation/refund race and server restart.
- Confirm valid charges, buffs and high-latency use behave correctly.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
