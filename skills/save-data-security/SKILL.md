---
name: save-data-security
description: "Protect multiplayer save data, cloud saves and progression persistence from tampering or rollback. Use for modified local saves, stale saves, restoration abuse or data loss."
---

# Save Data Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Identify authoritative persistence owner and every save/load path. Treat local saves and player-supplied state as untrusted; local signing with a client-held key cannot establish trustworthy state against its holder.
- Validate ownership and progression invariants on load. Keep valuable multiplayer balances and entitlements on trusted services when feasible.
- Use versioning, conflict resolution, concurrency control and server-side constraints. Specify behavior for simultaneous sessions, stale versions, partial writes and migrations.
- Define backup and restore permissions, audit logs, rollback/reconciliation and cross-service dependencies; restoration should not independently duplicate items or payments.
- For offline or peer-hosted modes, document that secure enforcement against the device owner is limited and separate offline outcomes from ranked/persistent rewards where necessary.

## Adversarial and regression tests

- Test modified or stale local save, cross-account load, parallel writes, rollback to earlier state, crash during persistence, migration failure and reconnect.
- Confirm legitimate offline/sync conflict handling and recovery without exposing secrets or granting duplicate value.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
