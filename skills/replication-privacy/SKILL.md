---
name: replication-privacy
description: "Limit multiplayer information disclosure and hidden-state leaks. Use for wallhack exposure, fog of war, secret positions, spectators or excessive replication."
---

# Replication Privacy

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inventory data sent to each client, spectators, replays, debug channels and logs; classify visibility and retention by role and game phase.
- Enforce visibility on trusted infrastructure before replication. UI hiding and client-side filters cannot conceal data already delivered.
- Consider visibility transitions, interest management, team changes, spectators and replay delays. Document bandwidth, latency and fairness tradeoffs.
- Avoid sending secret RNG seeds, private inventories or exact hidden positions unless genuinely required; review indirect leakage and payload metadata.
- Minimize personal data, control log access and retention, and separate anti-cheat telemetry from unnecessary sensitive data collection.

## Adversarial and regression tests

- Inspect captured test-client payloads for hidden enemy state, unauthorized inventory, spectator leaks and state after switching teams or visibility.
- Confirm authorized views continue working; do not claim to eliminate visual inference from legitimately visible data.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
