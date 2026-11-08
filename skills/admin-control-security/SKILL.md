---
name: admin-control-security
description: "Protect game admin panels, GM commands, moderation tools and privileged APIs. Use for admin abuse, forged roles, insecure debug commands or production access."
---

# Admin Control Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inventory admin commands, back-office endpoints, debug flags, service accounts, test shortcuts and all privileged mutations, including indirect API paths.
- Authenticate operators independently of the game client; authorize every operation server-side with least privilege and appropriate role/scope. Never trust a client-provided admin flag.
- Restrict administrative exposure and protect credentials and sessions; consider MFA and stronger approval for highly consequential actions according to the threat model.
- Record tamper-resistant, privacy-aware audit events for who performed what, on which target and when; protect and monitor log access.
- Disable or tightly gate debug/admin features in production and define emergency access, revocation and review procedures.

## Adversarial and regression tests

- Test unprivileged player/role, expired operator session, changed role, cross-tenant access, forged admin flag and direct privileged endpoint calls.
- Verify denied attempts do not mutate state, audit events are recorded and no secrets appear in client files or logs.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
