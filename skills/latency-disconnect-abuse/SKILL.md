---
name: latency-disconnect-abuse
description: "Secure multiplayer actions against latency abuse, stale inputs, disconnect/reconnect exploits and timing manipulation. Use for lag switching, rollback abuse or reconnect duplication."
---

# Latency Disconnect Abuse

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Define server tick/time as authority, input ordering, expiration, bounded lag compensation, reconnect windows and state ownership across session changes.
- Reject or safely ignore stale and impossible transitions, and prevent an old connection from mutating state after a replacement session is active.
- Make match outcomes and persistent actions durable and idempotent; define what happens when clients disconnect before acknowledgement or during commit.
- Simulate lost, delayed, reordered and duplicated traffic; design rollback/rewind with bounded history and server-controlled snapshots.
- Distinguish adverse networks from cheating: latency alone is not proof. Reconcile fairly and do not automatically ban on disconnection patterns.

## Adversarial and regression tests

- Test packet loss, jitter, replayed inputs, stale session, repeated reconnects, simultaneous old/new connections, delayed final actions and restart at the commit boundary.
- Assert no duplicated rewards or unauthorized rewinds; include a legitimate high-latency case.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
