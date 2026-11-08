---
name: server-authority
description: "Establish trusted authority and threat boundaries for multiplayer game state. Use for server authoritative design, client trust, P2P, listen server, or host cheating."
---

# Server Authority

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Identify assets, actors, entry points, authoritative state, who controls each machine, and every path that mutates valuable state.
- Map each operation to actor, request, trusted owner, invariants, state transition, and observable result. Clients send intent; a trusted service decides consequential outcomes.
- For a player-hosted listen server, treat the host as potentially malicious. A backend that merely accepts a claimed match result does not verify it.
- For P2P, document collusion, availability and fairness tradeoffs; an operator-controlled arbiter can secure selected outcomes but is not free or automatic.
- Preserve client prediction and reconciliation where appropriate, but reject unauthorized authoritative transitions.

## Adversarial and regression tests

- Attempt identical privileged actions as owner, another player, unauthenticated actor and host. Verify the state-change boundary and rejected writes.
- Trace who can tamper with score, position and rewards in each deployment architecture; label unverified assumptions.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.

## Reference

For trust models, residual risks, and official reference links, read `references/architecture-and-sources.md`.
