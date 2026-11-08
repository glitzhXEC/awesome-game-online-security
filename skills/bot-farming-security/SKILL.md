---
name: bot-farming-security
description: "Mitigate automated farming, macros, multi-account reward abuse and repetitive bot behavior. Use for farming bots, scripted actions or collusive reward loops."
---

# Bot Farming Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Map valuable repeatable actions, eligibility, timing and reward loops, including cooperation between multiple accounts. Design out easily farmable rewards where feasible.
- Validate the game action and reward path on trusted infrastructure; use calibrated caps, diminishing returns or eligibility rules only when compatible with game design and fairness.
- Analyze server-observed behavior over appropriate windows, compare to legitimate play and measure false positives; client telemetry or uniform timing alone is not proof.
- Protect accessibility and legitimate repetitive play. Use proportionate investigation, human review and appeals; do not propose invasive or punitive measures as the sole remedy.
- Control telemetry collection, access and retention; assess operational and privacy costs before deploying detection.

## Adversarial and regression tests

- Test repeated coordinated rewards, newly created accounts, unrealistic but protocol-valid action volumes, and benign accessibility/macro behavior where allowed.
- Evaluate detection using labeled or controlled examples and report precision/coverage limitations rather than claiming all bots are caught.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
