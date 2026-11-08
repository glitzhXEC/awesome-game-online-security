---
name: bevy-security
description: "Apply multiplayer game security guidance to Bevy projects in Rust. Use for Bevy ECS client-server architecture, Replicon/Meshnet or raw socket transports, server authority and authoritative validation, or secure message handling in a Bevy game."
---

# Bevy Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and crate versions, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect the Bevy version, the networking crates in use (for example Replicon/Meshnet, Matchbox, Bevy Quinnet, or a raw `std::net`/tokio socket layer), and where the connection is served from: a dedicated headless server, a listen server, or peer-to-peer.
- Trace which systems create, deserialize and apply incoming messages, and where sender identity comes from. In a pure ECS game the client and server share code, so confirm which side performs each write and that rule-relevant writes happen only in server-authorized systems.
- Validate every deserialized value before it mutates world state; reject unknown or impossible entities, out-of-range positions and forged inputs at the boundary rather than relying on client-events.
- Check bandwidth and parser bounds: length caps, per-message and per-second limits, and confirmation that untrusted input never allocates unbounded buffers or panics the system.
- Keep existing crate versions and architecture unless migration is requested; pair with the relevant domain skills.

## Adversarial and regression tests

- In an authorized local test, run an additional peer or modified client that sends forged positions, impossible entity writes, malformed frames and replayed messages; verify the server-relevant state does not change.
- Test legitimate client, reconnect, and high-latency cases and record results; state if no server build is available to run.
- Confirm application-level integrity and anti-replay (per protocol design) rather than assuming the transport alone protects game state.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
