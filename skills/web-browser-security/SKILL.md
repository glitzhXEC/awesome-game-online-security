---
name: web-browser-security
description: "Apply multiplayer game security guidance to browser games built with WebGL/Canvas stacks such as PixiJS, three.js or plain JavaScript. Use for WebSocket/WebRTC transports, client-side game logic, asset and data protection, or anti-cheat for a browser game."
---

# Web Browser Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and versions, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; a browser tab is fully readable and modifiable, so all shipped JavaScript, WebAssembly, assets and storage are attacker-controlled. Use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect the rendering stack (PixiJS, three.js, a canvas library, or vanilla WebGL), the network transport (WebSocket, WebRTC DataChannel, HTTP long-poll, or a realtime framework) and where authoritative state runs.
- Trace every server message back to a renderer or game-state update and every client input forward to the server. Confirm scoring, health, currency, positions and drops are validated on the trusted side; never trust client-declared results or storage.
- Check transport hardening for browsers: `wss://` only, origin and token validation, JSON/binary schema limits, and application-level anti-replay and idempotency on top of the WebSocket, which browsers cannot extend with the usual socket APIs.
- Review asset and data protection honestly: minification, bundling and WASM raising effort only; client values remain recoverable. Verify no secrets (API keys, signing keys, admin flags) are shipped in the bundle, and that data channel messages are treated as untrusted frames regardless of encryption.
- Check that storage, service workers and analytics do not accept forged or oversized data, and that rate limits cover both request and connection floods. Keep current framework versions unless an upgrade is requested; pair with the relevant domain skills.

## Adversarial and regression tests

- In an authorized local test, drive a modified client bundle or DevTools console that sends forged inputs, edited scores, impossible positions and replayed messages; verify server-visible state does not change.
- Test legitimate clients, browser-background throttling, reconnects, proxy/VPN connections and high-latency cases; record results and state if no running server is available.
- Confirm the audit covers the deployed origin, the exact transport and a cleared-cache fresh session, not only the current local browser state.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
