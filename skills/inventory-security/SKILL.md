---
name: inventory-security
description: "Protect multiplayer inventory, crafting, loot and item ownership. Use for item duplication, unauthorized grants, crafting exploits, equipment or concurrent inventory updates."
---

# Inventory Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Enumerate all item creation, removal, transfer, stacking, crafting, equip, loot and persistence paths; define ownership, quantity and item identity invariants.
- Resolve recipes, loot tables, quantity and eligibility from trusted state. Never trust a claimed item, reward or crafted output as authoritative.
- Use atomic mutations and suitable isolation/constraints across consumption and grants; define behavior at capacity and on crash/reconnect.
- Bind request idempotency to actor, operation and payload, persist the result where appropriate, and reject conflicting key reuse; a fresh key must not bypass business rules.
- For storage spanning services, use a documented durable workflow and reconciliation rather than pretending one local transaction covers everything.

## Adversarial and regression tests

- Test negative/overflow quantities, ownership spoof, full inventory, repeated/reordered requests, concurrent craft/consume, reconnect and crash around commit.
- Assert actual persisted state and conservation, not only UI updates.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
