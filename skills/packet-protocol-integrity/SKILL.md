---
name: packet-protocol-integrity
description: "Protect the game protocol against packet tampering, forgery, replay and reordering. Use for message authentication codes, sequence numbers and anti-replay windows, idempotency keys, desync detection, or authoring and reviewing a hardened packet format for a game transport."
---

# Packet and Protocol Integrity

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat every packet as attacker-controlled; a player's machine can produce any bytes. Use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Define one documented wire format: message type and version, session id, monotonic sequence number, and freshness data, with explicit framing and bounds. Do not rely on implicit structure that a proxy can mutate into another valid message.
- Authenticate every message with a per-session key using an authenticated construction (AEAD such as AES-GCM or ChaCha20-Poly1305, or an HMAC over the exact serialized fields you claim to protect, including type and sequence). Keys come from the existing TLS/DTLS/WebSocket handshake or an engine-vetted framework; never invent key exchange and never bake keys only into the client binary.
- Add application-level anti-replay independent of transport: a server-side sliding window per session that rejects duplicates, out-of-window sequence numbers and out-of-order messages, plus a defined recovery path (full resync) when the window is exceeded. Encrypted transport alone does not stop a player from replaying a valid-looking request.
- Enforce idempotency for state-changing and money-like operations with a server-generated or client-proposed request id recorded at commit, so retries cannot double-spend or double-claim.
- Recompute authoritative outcomes on the trusted side from validated inputs; treat any client-sent value (health, currency, position, result) as a proposal. Detect desync conditions explicitly (missing sequences, implausible delta, clock drift) rather than silently continuing.
- Keep parsing cost bounded: fixed-size fields, length caps, and per-message and per-operation rate limits so malformed or oversized frames are cheap to reject.

## Adversarial and regression tests

- Test tampered payload, tampered type/sequence bytes, wrong session key, truncated and extended frames, old-frame replay inside and outside the window, reordered messages, duplicate key with different content, and forged request ids.
- Assert that rejected frames cause no state change and that legitimate in-order, out-of-order-within-window and recovery flows still work; measure false positives under realistic loss and jitter.
- In an authorized lab, run the bundled `scripts/demo_packet_security.py` to see a plaintext frame edited and replayed, then see the hardened frame rejected.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide a concrete wire format and pseudocode rather than inventing project APIs. State that protocol integrity protects the message, not the author: a player can still send valid messages with any content their client can produce unless the server validates the content.

## Reference

For a worked example wire format, authenticating-code approach, anti-replay window design and per-language idioms, read `references/protocol-hardening-guide.md`.
