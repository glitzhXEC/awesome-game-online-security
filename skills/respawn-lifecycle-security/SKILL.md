---
name: respawn-lifecycle-security
description: "Secure death, respawn, invulnerability and player lifecycle state. Use for god mode, repeated respawn, spawn farming or actions while dead."
---

# Respawn Lifecycle Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Define server-owned life-cycle states and transitions, death attribution, respawn eligibility, location, protection duration and timer source.
- Ensure combat, interaction, rewards and movement handlers check the same authoritative state; client health or respawn animation is not proof.
- Prevent duplicate death rewards and respawn requests using unique server events and current transition state. Commit related reward/state changes consistently.
- Validate spawn selection, protection expiry and teleport permissions; prevent spawn protection from persisting after disallowed actions according to game rules.
- Assess reward loops such as repeated kills of freshly spawned cooperating accounts; prefer game-design changes where appropriate, with fair exceptions.

## Adversarial and regression tests

- Test acting while dead, client-set health, repeated death/respawn, duplicate kill credit, forged spawn point, interrupted reconnect and expired or improperly retained protection.
- Check legitimate revives, spectators and high latency; verify persistence and rewards are not duplicated.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
