---
name: economy-security
description: "Secure currency, shops, rewards, crafting costs and game economy transactions. Use for currency manipulation, forged prices, double spending or reward exploits."
---

# Economy Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Map currency sources/sinks, actor identity, entitlements, server-owned prices, stock, limits and balances, including administrative and event paths.
- Compute price and rewards from trusted configuration; validate eligibility and bounds, including integer overflow and currency type.
- Perform balance deductions and item grants atomically where feasible using database constraints and concurrency control; specify rollback and cross-service reconciliation.
- Make retries idempotent using actor/operation/payload-bound keys and recorded results. Enforce anti-abuse even when an attacker supplies fresh keys.
- For payments or entitlements, verify callbacks with the provider and reconcile externally; do not trust local purchase success as proof.

## Adversarial and regression tests

- Try forged price/reward, negative quantity, double spend with parallel requests, duplicate and conflicting retries, disconnect before/after commit and provider callback replay.
- Inspect ledger and persisted balances after success and failure.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
