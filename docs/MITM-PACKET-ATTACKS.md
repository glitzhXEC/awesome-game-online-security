# MITM and packet-edit attacks, hands-on

A worked tutorial about the two halves of "hackers edit my packets": traffic is
captured or altered while in transit (man-in-the-middle), and the game client
itself is edited so it sends different bytes. The defense differs too: transport
security protects the wire, protocol integrity protects the message, and the
server is what actually stays honest. Companion playbook:
`skills/mitm-sniffing-defense/references/mitm-playbook.md` and
`skills/packet-protocol-integrity/references/protocol-hardening-guide.md`.

## 1. What the attacks look like

| Attack | What changes | What the victim sees |
| --- | --- | --- |
| Passive sniffing | Nothing | Nothing; traffic is copied |
| ARP/DNS spoofing | Where packets are routed | Usually nothing |
| Fake certificate / pinned CA | Where the client thinks it is connected | Maybe a warning |
| Packet edit / forge | The bytes the server receives | A "valid" but wrong request |
| Replay | A second copy of an old valid request | Duplicate effect |

A proxy that terminates your transport (for example a TLS MITM with an installed
root CA) sees **exactly** what your client sees: every value, every ID, every
message your protocol trusts.

## 2. Why "encrypt it" is not the whole answer

Encryption (TLS/DTLS/WSS) fixes **confidentiality and integrity in transit**. It
does not fix:

- a client that is edited to make legal requests with illegal values, and
- a replayed copy of a fully valid request.

So the rule of thumb is:

```
transport security  -> the wire is protected
protocol integrity  -> each message is authenticated and fresh
server validation   -> the trusted side recomputes the outcome
```

## 3. Lab: run the bundled demo

The repository ships a stdout-only, stdlib-only demo that shows the difference:

```bash
python scripts/demo_packet_security.py
```

Watch for these four moments in the output:

1. A plaintext frame `(op=2, value=100)` is sniffed and applied.
2. An edited copy `(op=2, value=99999)` is applied silently.
3. The original frame is replayed and applied **again**.
4. With HMAC + session + anti-replay window the same sequence of edits and
   replays is rejected with **no state change**, while a later valid frame is
   still accepted.

## 4. Exercising it yourself with a real proxy

If you have `mitmproxy`, `Charles`, `Fiddler` or `Wireshark`, point a **test
client** at it and:

1. Confirm you can read the plaintext frames (they have no MAC).
2. Set the proxy as the system CA and observe whether the real client complains
   about the certificate.
3. Try repeating step 2 against the hardened frame (`FrameServer` in
   `scripts/demo_packet_security.py`) and confirm a changed byte now breaks the
   HMAC.

Do this only on a system you own or are authorized to test.

## 5. The checklist that matters

- [ ] Every rule-relevant value (health, currency, position, result) is
      recomputed on a trusted server, not taken from the frame.
- [ ] Frames carry a version, per-session key, sequence number and MAC/tag.
- [ ] Replayed, reordered and out-of-window frames change no state.
- [ ] Certificates are validated (and pinned only where needed) on the client;
      a MITM still cannot forge server-authoritative state.
- [ ] idempotency keys guard money-like operations.
- [ ] Rejection means *no state change*, verified by test against the store.

## Next steps

Continue with `docs/PROTOCOL-HARDENING.md` for the wire-format details, and
`docs/CLIENT-ANTI-CHEAT.md` for the client-tamper half of the story.
