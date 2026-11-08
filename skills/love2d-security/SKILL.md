---
name: love2d-security
description: "Apply multiplayer game security guidance to LÖVE (Love2D) projects in Lua. Use for LÖVE socket networking, server authority, Lua client tampering, reliable and unreliable channels, or secure game state in a Love2D online game."
---

# LÖVE Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and versions, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; a LÖVE client is distributed Lua that players can edit and re-run freely. Use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect the LÖVE version, the networking approach (LuaSocket, love.filesystem-based sync, a websocket or custom UDP/TCP wrapper) and where the server runs: a dedicated host or a player-hosted love program.
- Trace which code deserializes incoming bytes and which writes to game state. In Lua almost any parser is reachable and modifiable, so confirm rule-relevant writes happen only on the trusted side and that serialized data is schema-checked and length-bounded before use.
- Check that state-changing actions carry authentication tied to the session, plus idempotency and anti-replay where money or progression is involved; the transport's own checks never make a Lua client honest.
- Review memory and CPU bounds: cap list sizes, message lengths and per-second rates so malformed or flooded frames are rejected cheaply, and avoid patterns that can corrupt the process in one player's hands.
- Keep current library versions unless a migration is requested; pair with the relevant domain skills.

## Adversarial and regression tests

- In an authorized local test, run a modified client script that sends forged inputs, edited scores, impossible positions and replayed messages; verify server-visible state does not change.
- Test legitimate client, host-latency, reconnect and resource-constrained cases and record results; state if no server is available to run.
- Confirm editing the distributed `.love` file itself does not bypass server validation of any rule-relevant value.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
