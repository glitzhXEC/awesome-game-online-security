# Protocol hardening guide

How to move a game protocol from "sniffable and editable plaintext" to "authenticated with
anti-replay". Pseudocode and small examples are language-agnostic; adapt field widths, framing and
key handling to the actual stack. Read `scripts/demo_packet_security.py` for a runnable, minimal
version of exactly this design.

## The vulnerable baseline

A naive frame is just fields:

```text
[ op: u8 ][ value: i32 ]            # e.g. op=2 "give_coins", value=1000
```

A player (or a MITM, or anyone who has sniffed the protocol) can resend the frame with
`value=99999`, or replay an old frame, and the server has no way to tell the difference.

## The hardened frame

```text
[ version: u8 ][ msg_type: u8 ][ session_id: u64 ][ seq: u64 ][ payload: bytes ][ auth_tag: 16 bytes ]
```

- `version` pins the format so a stale client cannot be exploited by an old parser.
- `session_id` and `seq` are part of the authenticated bytes so they cannot be changed without
  breaking the tag.
- `auth_tag` is the AEAD tag (or HMAC-SHA256 truncated) computed over `version || msg_type ||
  session_id || seq || payload` with the per-session key.
- The server also holds `last_seq` / a sliding window per `session_id` and rejects anything below
  the window or already seen.

## Which construction

- **AEAD (recommended)**: encrypts and authenticates at once. AES-GCM and ChaCha20-Poly1305 are
  your defaults; both are available in the crypto libraries of every mainstream engine runtime
  (OpenSSL, BoringSSL, Go crypto, Node `crypto`, C# `AesGcm`, Python `cryptography`, Rust `ring`).
  Use a unique nonce per message under the same key (monotonic counter or tag-derived).
- **HMAC-only**: if you must keep payloads readable (diagnostics), HMAC the whole byte string
  starting from a version field so a prefix attack cannot work. HMAC proves origin, not secrecy.
- **Never**: plain XOR, "obfuscated" string offsets, or CRC/MD5 "checksums". These are speed bumps,
  not authentication.

Keys come from the existing TLS/DTLS handshake as `exportKeyingMaterial`/`exportKey`, or from an
engine's secure channel. Two options and nothing else: real transport security, or an engine-vetted
authenticated framework. Never implement a handshake from scratch.

## Anti-replay window

```text
window_start = max_seen - 31            # slide forward, e.g. 32-message window
reject if seq < window_start or seq in seen_set
seen_set.add(seq); max_seen = max(max_seen, seq)
on overflow or duplicate burst: require full resync (complete handshake request/response)
```

Permits limited reordering/loss while rejecting old replays. Money-like operations additionally use
an idempotency key stored with the committed transaction.

## End-to-end sketch

```text
client_send(op, payload):
  frame = pack(ver, op, session_id, seq=next_seq, payload)
  tag   = aead_encrypt_and_sign(key, nonce=counter++, frame_without_tag)
  socket.send(frame + tag)

server_recv(frame):
  if not verify(ver, op, session_id, seq, payload, tag, key): drop; log; return
  if not within_window(session_id, seq): drop-as-replay; return
  result = authoritative_apply(op, payload)     # recompute, never trust payload numbers
  commit_with_idempotency(request_id)
```

## Per-runtime idioms (verify against your version's docs)

- **Node/WebSocket (Phaser, PixiJS, three.js)**: `crypto.createHmac` or
  `NodeRSA`/`subtle.crypto` AEAD; keep keys server-side only, never in the browser bundle.
- **C# (Unity)**: `System.Security.Cryptography.AesGcm`/`HMACSHA256` over the serialized frame;
  share keys through the existing transport negotiation.
- **Rust (Bevy)**: `ring`/`aes-gcm` crate types; integrate at the transport layer feeding
  `bevy_replicon`/`receive_message` inputs, not inside gameplay systems.
- **Python (pygame)**: `cryptography` AEAD over the socket stream with a per-session key.
- **Lua (LÖVE)**: use a binding of a vetted library (e.g. `luasec` for TLS); HMAC where library
  support exists. Do not hand-roll.

## Testing that matters

Reject must equal *no state change*. Assert the database/key-value store is untouched after a
tampered, replayed or reordered frame, not merely that the client got an error screen. Then verify
legit in-order, small reorder, loss-recovery and resync paths still pass so the window does not
become a denial of service for honest players.
