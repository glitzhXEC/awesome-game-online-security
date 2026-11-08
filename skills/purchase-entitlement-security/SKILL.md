---
name: purchase-entitlement-security
description: "Secure in-app purchases, receipts, subscriptions and entitlements. Use for forged purchase receipts, duplicated grants, refund handling or payment callback abuse."
---

# Purchase Entitlement Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Map purchase initiation, provider verification, callback authentication, account binding, entitlement grant, refund/revocation and support flows.
- Validate receipts or transaction records using the actual platform/provider server-side API and bind purchase, product, environment and account appropriately; do not trust a client success message.
- Use a unique provider transaction identity and durable idempotent processing; handle duplicate, delayed and out-of-order callbacks as normal protocol conditions.
- Atomically record entitlement/grant where feasible or use durable reconciliation across services; manage pending payment, cancellation, refunds and revocation.
- Protect provider credentials and avoid logging full receipts, tokens or sensitive payment data. Follow current platform rules and applicable legal requirements.

## Adversarial and regression tests

- Test invalid or wrong-environment receipt, duplicate transaction, cross-account replay, callback duplication/reordering, refund and restart before acknowledgement.
- Confirm legitimate purchases are restored correctly without a second grant; use provider sandbox and dummy payment data.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
