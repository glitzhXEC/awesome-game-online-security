---
name: service-abuse-resilience
description: "Reduce denial-of-service and resource exhaustion risks in game services. Use for connection floods, expensive RPCs, oversized messages or backend overload."
---

# Service Abuse Resilience

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Map public entry points, per-request compute and storage costs, connection lifecycle, queues and costly shared dependencies.
- Bound request size, parse depth, fanout, memory, execution time, concurrency and queue capacity. Apply backpressure and graceful failure with fair per-scope quotas.
- Rate-limit before expensive work where practical, then apply per-account/session/action limits after authentication. Account for shared IPs and distributed abuse.
- Configure infrastructure protections, monitoring and incident procedures appropriate to actual deployment. Avoid promising application rate limiting alone prevents distributed denial-of-service.
- Design reconnect and retry behavior with jitter/backoff and idempotency to avoid amplifying an outage.

## Adversarial and regression tests

- With explicit authorization, run bounded load tests in a staging environment: oversized messages, repeated expensive actions, connection churn, queue saturation and recovery.
- Measure latency, rejection, fairness and resource usage; never run uncontrolled load against a production service.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
