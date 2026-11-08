---
name: player-trading-security
description: "Secure player-to-player trades and marketplace transactions. Use for trade duplication, item swapping, cancellation races, escrow or marketplace abuse."
---

# Player Trading Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Define ownership and lifecycle states for offers, locked assets, acceptance, cancellation, expiration, commit and recovery; authorize each transition.
- Bind acceptance to a specific immutable or versioned offer; reset acceptance when either side changes it.
- Recheck both parties, balances, item ownership and capacities at commit using atomicity/concurrency control appropriate to storage.
- Prevent double-spending assets across trade, inventory, crafting and marketplace paths. Specify escrow or compensating workflow for cross-service commits.
- Make completion and cancellation idempotent, record auditable outcomes and define reconnect recovery.

## Adversarial and regression tests

- Test simultaneous acceptance/cancellation, modified offers after acceptance, duplicate accepts, trade between same actor, item used elsewhere, full inventory and disconnect at commit.
- Inspect both sides and persistent ledger for conservation and no duplication.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
