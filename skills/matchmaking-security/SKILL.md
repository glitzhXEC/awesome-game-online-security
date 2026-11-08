---
name: matchmaking-security
description: "Secure multiplayer lobbies, matchmaking and match result submission. Use for unauthorized lobby joins, matchmaking abuse, leaderboard or match-result manipulation."
---

# Matchmaking Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Bind lobby membership, invites, ready state and results to authenticated participants and a server-owned match lifecycle.
- Validate entitlement, region/mode constraints and capacity; limit lobby creation, invitations and queue abuse appropriately.
- Accept results only from a trusted authoritative source or explicitly mark player-hosted results as untrusted. Backend storage alone does not make a claimed result truthful.
- Make result recording idempotent and transactional with rating/reward changes; defend against stale match IDs and post-match mutations.
- Limit disclosure of lobby identifiers or private participant information and manage reconnect/expiry explicitly.

## Adversarial and regression tests

- Test unauthorized join, forged participant/match IDs, duplicate or delayed result, altered score, result from player host, simultaneous completion and disconnect/reconnect.
- Verify leaderboard and rewards cannot apply twice.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
