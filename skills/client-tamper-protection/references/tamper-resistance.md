# Client tamper resistance: techniques, costs, and what the server must still do

A practical menu. Every technique below is a signal or a speed bump; the security lives in
server-side validation of rule-relevant state. Match techniques to runtime and threat, not to "use
them all".

## Threat-to-control map

| Attacker action | Client control | Server cross-check |
| --- | --- | --- |
| Edit stored values (save file, memory) | Hash/sign critical data, detect memory writes | Reject impossible values & deltas; re-derive from transactions |
| Patch code/scripts/assemblies | Integrity hash + signature check at load | Behavior drift (wrong cadence, symmetric patterns) |
| Attach debugger / devtools | Debug detection APIs; devtools/sourcemap detection | Impossible low-latency or fixed-delay inputs |
| Automate input (macro) | N/A reliably | Input cadence + variance analysis (see `bot-farming-security`) |
| Emulate/relay a modified client | Attestation hints (root/emulator fingerprint) | Any client can lie; do not rely on attestation alone |
| Read + replay frames | Frame authentication (see `packet-protocol-integrity`) | Server-side idempotency and ordering |

## Runtime-specific palette

- **Native desktop (Unity/Unreal/C++/Rust)**: OS code signing checks, loader/integrity hashes of
  critical binaries, debugger/protection libraries as signals, hardware-backed attestation only
  where the platform offers it.
- **Managed runtimes (C#/Mono, Java)**: assemblies are trivially editable; hash/sign loaded
  assemblies, but expect them to be patchable anyway. IL obfuscators raise effort only.
- **Script-heavy (GDScript, Lua/LÖVE, Python/pygame)**: the source is the client. Ship what you
  must and validate everything server-side; "protection" of editable source files is cosmetic.
  For Lua, `luasec`/`lua-protobuf`-style serialization with auth is about protocol, not source.
- **Web/Browser (Phaser, PixiJS, three.js, WASM)**: the user can rewrite the client in DevTools,
  patch memory, replay scripted calls, and install root CAs. Treat the browser as an untrusted
  caller of a server API; integrity checks there are only noise reduction. See
  `web-browser-security` and `mitm-sniffing-defense`.
- **Consoles/mobile**: platform code-signing gives you a real baseline; still do not trust
  client-reported state, because the client itself is player-controlled on mobile (root) and on
  console the attacker has build- or memory-level tools.

## Obfuscation tradeoffs

- Genius movement is the wrong metaphor. Treat obfuscation as cost: effort to raise, not a lock.
- Prefer targeted obfuscation of the least-readable, highest-payout logic (economy, combat
  validation glue) over whole-app obfuscation that hurts loading time, stack traces and support.
- Never obfuscate security-critical secrets into the client in the first place; a compiled constant
  is not a secret (see `purchase-entitlement-security` on receipts).

## Worked server cross-check (the part that matters)

```text
on_action(session, typed_action):
  player = authed(session)
  # 1. impossible state -> reject outright
  reject if player.coins < typed_action.cost
  reject if not within_time(player.action_history, now)     # fire-rate/latency sanity
  # 2. idempotency -> cannot double-apply
  reject if seen(typed_action.request_id)
  # 3. authority -> server recomputes outcome, never trusts client numbers
  outcome = authoritative_apply(player, typed_action.op, typed_action.params)
  # 4. bounded telemetry as a signal, never as the decision
  signal_if(input_cadence_anomalous(player))                 # review, don't ban on this
```

The interesting property: steps 1-3 work even if the client sends no telemetry at all and reports
perfect "honest" frames, which is exactly what a determined re-implementation of the client does.

## Law and privacy guardrails

- Keep telemetry scoped: what you need to see, for how long, who can read it.
- Prefer server-side behavioral signals over disk/memory scanning; invasive scanning needs explicit
  legal and product review.
- Provide a path for appeals and human review for anything that can lead to enforcement.
- Measure false positives against real accessibility and network diversity before tuning any
  enforcement threshold.
