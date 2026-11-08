---
name: network-transport-security
description: "Review game transport security, replay protection and service exposure. Use for multiplayer networking threats, message tampering, transport encryption or service hardening."
---

# Network Transport Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inventory protocols and routes, trust boundaries, public ports, identity/session binding and deployment configuration. Use mature protocol and transport implementations appropriate to the stack.
- Verify endpoint authentication, certificate validation where applicable, secrets handling, key lifecycle, timeouts and supported protocol versions.
- Document message sequencing, replay windows and application-level idempotency as separate concerns; encrypted transport does not validate game actions.
- Bound payload size, parsing cost, connections and per-operation resource consumption; plan layered rate limiting and recovery.
- Do not implement custom cryptography or claim that transport security prevents cheating by the endpoint.

## Adversarial and regression tests

- Test invalid/expired certificates in an authorized test environment, invalid sessions, replayed requests, reordered messages, large payloads and interrupted connections.
- Verify retries remain safe and service remains usable under legitimate bursts.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
