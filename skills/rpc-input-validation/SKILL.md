---
name: rpc-input-validation
description: "Harden multiplayer RPCs, remotes, packet handlers and game APIs against malformed, unauthorized and abusive requests. Use for RemoteEvents, RPC validation, forged payloads or rate limits."
---

# Rpc Input Validation

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Enumerate network entry points and resolve identity from authenticated transport/session context, not a claimed account or player ID in the payload.
- Validate schema, bounded sizes and nesting, allowed enum values, finite numeric ranges, instance identifiers, state and authorization before expensive work or mutation.
- Rate-limit at sensible operation and identity scopes; include bounded queues, timeouts and resource budgets without treating shared IPs as individual identities.
- Design protocol-specific sequence/replay handling: encryption prevents eavesdropping in transit but does not make a malicious client honest or stop all application-level replay.
- Reject safely without exposing secrets; distinguish malformed requests from normal network retries.

## Adversarial and regression tests

- Test unauthenticated requests, cross-account IDs, NaN/infinity, large payloads, invalid types, stale and out-of-order messages, spam and bounded concurrency.
- Check legitimate bursts, reconnects and packet loss to measure false positives.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
