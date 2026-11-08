---
name: client-tamper-protection
description: "Protect game clients against local tampering, debugging and automated manipulation. Use for code and asset integrity checks, anti-debug, memory tamper detection, obfuscation tradeoffs, or server-side cross-checks and reconciliation that detect a tampered client."
---

# Client Tamper Protection

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Assume a determined attacker controls their own machine, memory and process completely; client-side measures raise effort and produce detection signals, they cannot make a player host honest. Use version-matched APIs. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Explicitly separate what is provable server-side from what is only observable client-side. Server-side validation of every rule-relevant value is the security; client anti-tamper buys time and evidence, it is never the security.
- Choose integrity checks with bounded cost: hash critical game code/assemblies/scripts and high-value resource files at startup and on change, verify signatures where the platform provides them (OS code signing, engine build tools), and detect unexpected writes to protected ranges.
- Add debugger and instrumentation detection appropriate to the runtime (debug API, ptrace/debug ports, DevTools/source maps attached, emulator/root/sandbox fingerprints). Treat every detection as a low-confidence signal; tie action to evidence and human/rolling review, not instant bans.
- Design obfuscation/minification deliberately: it raises reverse-engineering effort and slows cheat development, but the logic remains recoverable. Buy effort where the payout is highest without harming correctness, accessibility or support.
- Collect minimal, bounded tamper telemetry (hash mismatches, unexpected debug flags, anomalous input cadence) without passwords, tokens or unnecessary personal data; define retention, access and how a confident server-side inconsistency (e.g. impossible state) is handled separately from client suspicion.
- Every telemetry channel can itself be forged by a tampered client. Cross-check server-visible state passively (input rate, event ordering, latency, economy deltas) and prefer rejecting logically impossible states over trusting client attestation.

## Adversarial and regression tests

- In an authorized sandbox, flip bytes in shipped code/assets, attach a debugger/devtools, patch a memory value in a test build, and confirm the expected detection or mitigation fires for the specific control you implemented (not the generic promise).
- Test legitimate users: debuggers present in dev builds, antivirus hooks, corporate instrumentation, accessibility tools, low-end machines — and measure false positives before tuning enforcement.
- Verify the server-side cross-checks catch a client that simply claims false state without any client telemetry, because that is the realistic attacker baseline.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide the invariants the server enforces, the signals the client forwards, and where each is tuned. State plainly that no client can be made unhackable and which costs you are choosing to pay.

## Reference

For per-runtime technique palettes, threat-to-control mapping, obfuscation tradeoffs and a worked server cross-check example, read `references/tamper-resistance.md`.
