---
name: pygame-security
description: "Apply multiplayer game security guidance to pygame (pygame-ce) projects in Python. Use for pygame networking, socketserver or asyncio clients, server authority, authoritative validation, or anti-cheat in a pygame online game."
---

# Pygame Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and versions, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; a pygame client is shipped Python source the player can read and replace. Use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inspect the pygame/pygame-ce version, the networking approach (raw sockets, socketserver, asyncio, or a wrapper) and where the server runs: dedicated or player-hosted.
- Trace the receive loop and the code that applies messages to game state. Confirm rule-relevant values (health, currency, position, score, inventory) are recomputed or validated on the trusted side, never taken from the client.
- Check deserialization safety: schema and length caps, strict field validation, per-message and per-second rate limits so malformed or flooded frames are cheap to reject; Python pickling or eval of remote data is a high-risk red flag to replace.
- Add authentication tied to the session, idempotency and anti-replay for state-changing and money-like operations; verify the transport (encrypted or not) alone is never treated as proof of sender intent.
- Keep current library versions unless an upgrade is requested; pair with the relevant domain skills.

## Adversarial and regression tests

- In an authorized local test, run a second client that sends forged inputs, edited scores, impossible positions, giant frames and replayed messages; verify server-visible state does not change.
- Test legitimate client, reconnect and high-latency cases and record results; state if no server is available to run.
- Confirm a player editing the distributed Python (or a byte-packed copy) cannot bypass server validation of any rule-relevant value.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
