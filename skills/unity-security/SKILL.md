---
name: unity-security
description: "Apply multiplayer security guidance to Unity projects. Use for Unity networking ownership, server RPC validation, authoritative game logic or Cloud Code security."
---

# Unity Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect Unity version, installed networking packages, topology and trusted service boundaries; Unity supports multiple stacks with different ownership and RPC semantics.
- Find request handlers and source of sender identity; verify server-side ownership and authorization according to the installed package's documentation.
- Compute important outcomes and validate inputs on trusted infrastructure; a listen server on a player's machine remains host-controlled.
- Examine replicated state, economic persistence and service access; do not assume Cloud Code usage alone makes every client-facing service inaccessible.
- Keep existing package versions and configurations unless migration is requested; pair with domain skills.

## Adversarial and regression tests

- Exercise remote request ownership, NPC distance and forged combat/economy inputs using the actual test framework and package.
- Check legitimate host/client, reconnect and latency cases. State if no running server is available.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
