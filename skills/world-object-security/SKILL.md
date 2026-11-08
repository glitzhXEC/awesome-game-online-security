---
name: world-object-security
description: "Secure world pickups, chests, doors, gathering nodes and interactable objects. Use for remote pickups, repeated collection, forged object IDs or interaction races."
---

# World Object Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Resolve the actor and target object from authenticated and server-controlled state. Validate same instance, existence, active state, ownership/eligibility and appropriate server-verified distance.
- Apply line-of-sight, tools, animation timing or prerequisites only when required by the actual game design; client UI and collision events are requests, not proof.
- Transition shared object state and rewards atomically; define who wins simultaneous attempts and whether a node is shared, per-player or reusable.
- Check inventory capacity and cost at commit; use idempotency or an object state constraint to prevent duplicate grants after retries.
- Revalidate after moving, despawn, instance transfer, respawn or server restart; do not rely on guessed client positions.

## Adversarial and regression tests

- Test distant pickup, wrong instance, forged/despawned object, moved-away player, duplicate interact, simultaneous harvest and disconnect after object consumed but before grant.
- Verify legitimate per-player nodes and shared loot behaviors remain correct.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
