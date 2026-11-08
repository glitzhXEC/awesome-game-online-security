---
name: movement-security
description: "Review and harden multiplayer movement, teleport and speed validation. Use for speed hacks, impossible position updates, movement prediction or collision bypass."
---

# Movement Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Prefer server simulation of player inputs or server verification against prior authoritative state; identify who owns position in the actual project.
- Check legal movement mode, elapsed server time, max speed and acceleration, collisions, map/instance bounds and authorized abilities or teleports.
- Model dashes, knockbacks, moving platforms, vehicles, respawns and server corrections explicitly rather than applying one global speed limit.
- Account for latency, jitter, loss, tick rate and client prediction; use tolerances with telemetry, not a single unexplained automatic ban threshold.
- Server-side distance checks should use server-controlled positions; a malicious player-host can still change its own simulation.

## Adversarial and regression tests

- Simulate impossible speed, acceleration, collision bypass, forged teleport, stale/reordered input, NaN positions, and legal dashes/knockbacks.
- Reproduce with high latency and packet loss; measure false positives and state reconciliation.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
