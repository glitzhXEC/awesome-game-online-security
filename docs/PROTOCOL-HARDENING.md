# Protocol hardening, hands-on

How to take a vulnerable wire format and make it authenticated and replay-safe,
with runnable code. The full design rationale lives in
`skills/packet-protocol-integrity/references/protocol-hardening-guide.md`; this
tutorial walks the same design in code and shows how to test it.

## 1. The vulnerable baseline

```python
# op=2 means "grant coins", value is how many.
frame = struct.pack("!Bi", 2, 1000)
```

A player can sniff this format once and resend it with `value=99999`, or replay
an old legit frame, and the server cannot tell.

## 2. The hardened frame

```
[ version u8 ][ msg_type u8 ][ session_id u64 ][ seq u64 ][ payload ... ][ HMAC-SHA256 32B ]
```

The HMAC covers `version || msg_type || session_id || seq || payload`, so you
cannot stretch the payload, swap the sequence, or re-sign it without the
per-session key.

```python
body = struct.pack("!BBQQ", VERSION, msg_type, session_id, seq) + payload
tag  = hmac.new(key, body, hashlib.sha256).digest()
frame = body + tag
```

`scripts/demo_packet_security.py` implements exactly this as `hardened_frame`
and `verify_frame`, plus an `AntiReplayWindow`.

## 3. Anti-replay window

```python
class AntiReplayWindow:
    def __init__(self, size=32):
        self.size, self.max_seen, self.seen = size, -1, set()

    def accepts(self, seq):
        if seq < 0 or seq <= self.max_seen - self.size:
            return False                    # too old / outside window
        if seq in self.seen:
            return False                    # duplicate
        self.seen.add(seq)
        self.max_seen = max(self.max_seen, seq)
        return True
```

This permits small reorder and packet loss while rejecting old replays. When the
window overflows or a duplicate burst appears, force a **full resync**, not a
silent continue.

## 4. Money-like operations also need idempotency

Sequence numbers stop replay but a legit retry after timeout still double-applies
a credit. Record a request id at commit:

```python
if txn.commit_if_new(request_id):     # unique per client action
    balance += value
```

## 5. Tests that matter

Reject must equal **no state change in the store**, not "client got an error":

- tampered payload -> rejected, balance unchanged
- changed `seq` or `msg_type` bytes -> rejected
- replayed seq inside and outside the window -> rejected
- truncated / extended frame -> rejected, cheaply
- legit in-order, mild reorder, loss-recovery -> accepted
- resync path -> works after recovery

The unit tests in `tests/test_demo_packet_security.py` encode this list against
the bundled script.

## 6. Choosing the construction

- **AEAD (AES-GCM / ChaCha20-Poly1305)** when you can use the runtime crypto
  (OpenSSL, Node `crypto`, C# `AesGcm`, Python `cryptography`, Rust `ring`).
- **HMAC-only** when payloads must stay readable (diagnostics); it proves origin
  and freshness, not secrecy.
- **Never** plain XOR, string offsets, or CRC/MD5 "checksums".

Keys come from your existing TLS/DTLS handshake (`exportKeyMaterial` /
`exportKey`) or an engine-vetted authenticated channel. Never invent key
exchange and never bake the key into the client binary.
