---
name: guild-storage-security
description: "Protect shared guild banks, clan inventories and shared resources. Use for unauthorized withdrawals, role changes, shared storage duplication or concurrent access."
---

# Guild Storage Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Bind each request to authenticated membership and current server-owned role, resource scope, limits and organization state. Validate permissions at commit, not only when the UI opens.
- Define item and currency ownership, deposit/withdrawal rules, approval and daily limits using trusted time and current policy.
- Use transactions or appropriate concurrency control across personal inventory and shared storage; prevent use of the same asset in trades or crafting at the same time.
- Version permission and balance changes, handle concurrent role revocation and log material actions with privacy-aware retention.
- Specify recovery for disconnect, guild disbandment, ownership transfer and cross-service failures.

## Adversarial and regression tests

- Test nonmember and former member access, permission revocation during withdrawal, simultaneous withdrawals, exceeding limits, duplicate requests and disconnect during transfer.
- Check both storage and personal inventory for conservation and an accurate audit record.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
