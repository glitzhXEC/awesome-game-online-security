---
name: phaser-security
description: "Apply multiplayer game security guidance to Phaser projects in TypeScript or JavaScript. Use for Phaser client-server architecture over WebSocket, server authority, client prediction, secure scene and global state, or anti-cheat in a Phaser online game."
---

# Phaser Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and versions, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect the Phaser version, the transport in use (WebSocket, WebTransport, or a socket library), and where authoritative state runs: a dedicated server or a player host. Browser clients are fully readable and modifiable, so treat all client JavaScript as attacker-controlled.
- Trace how server messages update Phaser scenes and physics, and how player inputs are sent. Confirm scores, HP, positions and inventory are recomputed or accepted only on the trusted side, not written into state straight from the wire.
- Check that the browser uses secure WebSocket/WSS and proper origin and token handling, and that state-changing requests carry authentication and idempotency; add application-level replay protection on top of the transport if any.
- Review client-side throttling, packet coalescing and bounds so a flooded or malformed message stream cannot stall or crash the scene; validate message schema strictly on the server.
- Keep existing framework and dependency versions unless an upgrade is requested; pair with the relevant domain skills.

## Adversarial and regression tests

- In an authorized local test, drive a fake client or browser console override that sends forged inputs, edited scores, impossible positions and replayed messages; verify server-visible state does not change.
- Test legitimate client, browser-background, reconnect and high-latency cases and record results; state if no running server is available.
- Confirm the audit covers the deployed origin and transport, not only the local websocket endpoint.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
