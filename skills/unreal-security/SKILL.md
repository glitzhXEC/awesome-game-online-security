---
name: unreal-security
description: "Apply multiplayer security guidance to Unreal Engine projects. Use for actor ownership, server RPC validation, replication, authority or authoritative gameplay security."
---

# Unreal Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect Unreal version, network mode, actor ownership, RPC declarations/implementations, replication and any backend integrations. Check version-matched documentation.
- Determine whether the server is a trusted dedicated service or a player-run listen server; actor authority on a host is not protection from that host.
- At each server-side entry point bind the caller to the controlled actor, then validate state, payload, range, timing and authorization before changing state.
- Compute combat and valuable outcomes using trusted state and restrict replication of hidden data. Do not rely on client-side Blueprint checks alone.
- Preserve the project's existing C++/Blueprint structure and engine version; use domain skills for exact invariants and tests.

## Adversarial and regression tests

- Test wrong-owner RPCs, manipulated RPC arguments, out-of-range interactions, hidden-data replication and late/duplicate actions in a controlled multiplayer session.
- Distinguish code review from tests executed in packaged or dedicated-server builds.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
