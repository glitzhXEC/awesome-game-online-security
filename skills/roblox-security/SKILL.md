---
name: roblox-security
description: "Apply multiplayer security guidance to Roblox projects. Use for Roblox RemoteEvents, RemoteFunctions, client-server trust, interactions or DataStore-backed game state."
---

# Roblox Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect the actual place/project layout, server/client scripts, remotes, ownership, DataStore usage and current Roblox documentation before suggesting APIs.
- Treat LocalScripts, remote arguments, client-owned physics and client-triggered interaction events as untrusted. Obtain the invoking player from the server callback rather than an argument.
- Validate type, structure, bounds, context, permissions, distance using server-validated state, and rate for each consequential remote; validate nested tables rather than trusting their shape.
- Keep prices, awards and mutations in server-controlled code. Protect persistent state against retries and concurrent updates using the platform's actual semantics.
- Server access to a position is not automatically proof it is legitimate if clients can influence network-owned physics; validate movement as appropriate.

## Adversarial and regression tests

- Test remote invocation outside the intended UI, another player's ID, invalid nested arguments, unreasonable range and duplicate operations in a controlled Studio test.
- Check appropriate client/server contexts and confirm current API semantics; do not infer production protection from a single Studio run.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
