---
name: auth-session-security
description: "Review game login, sessions, authorization and account security. Use for account impersonation, session hijacking, privilege checks or authentication flows."
---

# Auth Session Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Identify identity provider, transport, token issuance, verification, refresh, expiration, revocation and mapping to game account.
- Authenticate at trusted boundaries and authorize each action against session identity, role, ownership and game state; never trust a client-selected account ID or role.
- Verify tokens with the appropriate issuer, audience, signature and lifetime for the actual protocol; keep service secrets off clients and out of logs.
- Protect endpoints using transport security, sensible rate limits and account recovery controls; avoid inventing cryptographic schemes.
- Review permission changes, session reuse and disconnect/ban handling without assuming an authentication token authorizes all game operations.

## Adversarial and regression tests

- Test absent, expired, revoked, wrong-audience and invalid tokens; cross-account references, privilege changes, reconnect and concurrent sessions.
- Verify secrets are absent from client assets and logs; distinguish access control from authentication.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
