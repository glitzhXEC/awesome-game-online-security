---
name: godot-security
description: "Apply multiplayer game security guidance to Godot projects. Use for Godot RPC authority, multiplayer peer configuration, server-side validation or player-hosted security."
---

# Godot Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect project.godot, engine version, multiplayer peer setup, RPC annotations, authority assignments and code paths. Verify semantics using docs matching the project version.
- Trace which peers may invoke each RPC and whether the recipient executes on a trusted dedicated server or on a player-controlled host. Node authority alone does not prove a machine is trustworthy.
- Resolve sender identity from the networking context; validate actor ownership, payload and authoritative world state before mutation.
- Model signal/scene lifecycles, reconnects and duplicate actions; preserve the project's current networking stack and version.
- Pair engine-specific findings with the relevant combat, NPC, economy or movement skill.

## Adversarial and regression tests

- In an authorized local multi-peer test, send requests from wrong peers and out-of-range positions, replay them and check server-side state.
- Verify the configured RPC modes and actual authority changes rather than assuming defaults.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
