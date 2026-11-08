---
name: loot-rng-security
description: "Secure random loot, drops, gacha and weighted rewards. Use for predictable RNG, forged drop results, unauthorized rerolls or repeated loot claims."
---

# Loot Rng Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Keep loot eligibility, probability tables, outcomes and RNG generation on trusted infrastructure appropriate to the stakes; clients can display but not decide outcomes.
- Use server-controlled entropy and avoid exposing seeds or future outcomes. Choose a vetted cryptographic RNG when prediction has valuable consequences; do not invent a random algorithm.
- Bind each drop or roll to a unique server event and eligible player; enforce consumption, limits, access and versioned configuration. Record an auditable result without leaking secrets.
- Make cost, roll and grant a single durable transaction or recoverable idempotent workflow. A client retry must return the same prior outcome, not silently reroll.
- Review platform and legal requirements for paid random rewards and odds disclosure with qualified advisers; do not claim compliance without review.

## Adversarial and regression tests

- Test forged roll/result, retry after disconnect, duplicate and concurrent opens, eligibility spoof, empty pool and configuration changes while claims are pending.
- Verify the stored outcome and grant match and that no future seed or hidden result is replicated to clients.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
