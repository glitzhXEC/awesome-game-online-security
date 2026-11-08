---
name: anti-cheat-detection
description: "Design privacy-conscious game anti-cheat detection and response. Use for suspicious behavior, bots, anti-tamper telemetry, false positives or enforcement workflows."
---

# Anti Cheat Detection

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Start with prevention at trusted state boundaries; treat client anti-tamper, reports and behavioral telemetry as signals, not proof or a substitute for validation.
- Define measurable hypotheses, signal provenance, collection necessity, data retention, access controls and confidence; account for accessibility, network and regional variation.
- Evaluate detection with labeled data or controlled tests; measure false positives and drift. Avoid claiming detection of every cheat or relying on a single weak threshold.
- Design proportionate response: observe, investigate, rate-limit or review; define appeals and human oversight for consequential enforcement.
- Never include passwords, tokens or unnecessary personal data in telemetry. Avoid invasive scanning without explicit legal and product review.

## Adversarial and regression tests

- Test legitimate high-latency and accessibility cases, noisy reports, forged client telemetry, detection outages and evidence retention/appeal flows.
- Separate confirmed impossible server state from probabilistic suspicion.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
