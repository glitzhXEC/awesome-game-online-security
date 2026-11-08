---
name: game-security-testing
description: "Plan and implement authorized adversarial regression tests for multiplayer game security. Use for abuse cases, security test plans, concurrency tests or verification of a fix."
---

# Game Security Testing

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Define the invariant, authorized actor, trust boundary, observable rejection and expected persistent state for each test.
- Prefer isolated fixtures and deterministic clocks/RNG where supported; use integration tests for network boundaries and actual database concurrency.
- Cover valid requests, boundary cases, malformed inputs, spoofed identity, repeated/reordered requests, concurrent operations, disconnect and recovery.
- Model realistic jitter and prediction for latency-sensitive systems; measure false positives. Keep load, fuzz and destructive tests inside expressly authorized environments.
- Run existing relevant checks if feasible; record commands and observed outputs. Never report a test as passed if it was not run.

## Adversarial and regression tests

- Assert no unauthorized state change after rejection, not just an error response. Verify idempotency and invariants after concurrent operations and retries.
- Track limitations such as mocked storage, absent network simulation and test environment differences.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.

## Reference

For a detailed adversarial test menu and NPC pseudocode, read `references/threat-checklists.md`.
