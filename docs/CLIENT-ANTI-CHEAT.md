# Client tamper and anti-cheat, hands-on

A worked tutorial about the other half of the story: the attacker does not touch
the wire at all, they edit the **client** — the binary, its memory, or the
traffic it emits — so it sends "legal" requests with illegal values. Transport
and protocol hardening (the other two tutorials) cannot stop this, because the
attacker is now a legitimate client with the right key. The full technique
palette lives in `skills/client-tamper-protection/references/tamper-resistance.md`;
this tutorial shows the reasoning and a runnable cross-check.

## 1. The trust model, in one sentence

> The player's machine is enemy territory. Anything that only the client can
> see or check is evidence **about** the client, never proof **from** the client.

So client-side anti-cheat and server-side validation play different roles:

| Layer | Example | What it buys you |
| --- | --- | --- |
| OS/platform signing | Code signing, .ipa/.apk verify | Raises cost of replacing the binary |
| Integrity checks | Hash critical code/asset files at startup | Detects scripts/payload tamper |
| Anti-debug/instrumentation | Debug ports, DevTools, emulator fingerprints | Detects headed cheat tools |
| Obfuscation/minification | Rename, string hiding, control flattening | Slows reverse engineering |
| **Server cross-checks** | Recompute outcomes from inputs | **Stops damage regardless** |

The last row is the only one that can actually prevent abuse on its own.

## 2. Why the client half can lose on its own

A forged client can lie about everything its own code reads:

- it knows the **integrity-check code**, so it can patch the check to pass,
- it knows the **file hashes**, so it can feed you the clean list,
- it knows the **memory addresses**, so it can claim a tampered value is clean.

What it cannot lie about is what **the server itself observes and recomputes**.

## 3. Lab: server cross-checks against a tampered client

A tampered client still has to send the same *verbs* a normal client sends. The
`FrameServer` in `scripts/demo_packet_security.py` shows the pattern at the wire
level (bad frames change no state); the same rule applies one level up: validate
**input plausibility, rate, and ordering** against server-side models.

```python
# server-side model, code-independent of the client
MAX_GAIN = 100_000    # a legitimate action cannot grant this much in one frame
MAX_RATE = 50         # coins/second the rules allow

if value > MAX_GAIN or (value > 0 and rate(value, window) > MAX_RATE):
    reject(request)          # logically impossible -> reject, no state change
    record_evidence(request) # bounded telemetry for review
```

Run the demo to see the equivalent at frame level:

```bash
python scripts/demo_packet_security.py
```

Every "reject" moment in section 2 of the output is a server-side decision that
no amount of client tampering can flip, because the key facts (is this frame
fresh? is it authentic? does the value make sense?) are all computed on the
server.

## 4. What a real header does at runtime (sketch, not a plan)

Integrity checks are *observable client measures* — useful, but cheap to defeat
in isolation. A realistic envelope:

1. At startup, hash shipped game assemblies/scripts and high-value resources,
   verify platform signatures where available, and record a **bounded** signal
   to the server (never secrets).
2. Watch for debugger/DevTools/emulator/root markers appropriate to the runtime.
3. Ship obscurity deliberately: minify/logic-hide only where the payout is high
   and correctness/support are not harmed.
4. Treat every hit as a **low-confidence signal** routed to review, not an
   automatic ban.
5. Back it all with the server checking that the actions *make sense* given the
   engine's rules — that is the enforcement that matters.

## 5. The checklist that matters

- [ ] Every rule-relevant number is recomputed on the server from its inputs.
- [ ] The server rejects *logically impossible* state outright (no rollback
      dance, no trust-the-client fallback).
- [ ] Integrity checks cover the files cheats actually edit, at bounded cost.
- [ ] Detection signals are low-confidence, bounded, review-driven — never
      insta-bans on a single hash mismatch.
- [ ] Tamper telemetry collects no passwords, tokens or unnecessary personal data.
- [ ] Obfuscation is a conscious tradeoff, not a claim of unhackability.

## Next steps

- `docs/PROTOCOL-HARDENING.md` — the wire half: authenticate and make fresh
  every message (needed *before* client tamper even matters).
- `docs/ENGINE-COVERAGE.md` — the same guidance per engine: Bevy, Godot, LÖVE,
  Phaser, pygame, Roblox, Unity, Unreal, and the browser.
