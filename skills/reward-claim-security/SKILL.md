---
name: reward-claim-security
description: "Protect daily rewards, login gifts, battle pass claims and event rewards. Use for repeated claims, time manipulation, reward duplication or forged eligibility."
---

# Reward Claim Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Define eligibility, reward version, claim window, reset timezone, account or character ownership, and one-time or repeatable claim identity from trusted state.
- Use server time and server-configured reward data, never client clock or reward amount. Verify the event is active and the entitlement is earned.
- Atomically record the claim and grant the reward or use a durable workflow with a unique claim constraint and recoverable idempotency.
- Bind retry keys to actor, reward and payload; reject conflicting reuse and prevent fresh keys from bypassing a once-per-period rule.
- Define late claims, timezone changes, scheduled jobs, rollback and outages so a restart does not silently reopen claims.

## Adversarial and regression tests

- Test early/late claim, altered client clock, unearned tier, repeated and parallel claims, different retry keys, boundary around reset, and disconnect during grant.
- Check persisted claim history and inventory/ledger after recovery; include eligible players and daylight-saving boundaries if applicable.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
