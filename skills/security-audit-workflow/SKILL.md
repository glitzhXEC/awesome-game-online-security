---
name: security-audit-workflow
description: "Perform a structured multiplayer game security audit and report. Use for threat modeling, a security review, risk prioritization or a pre-release security assessment."
---

# Security Audit Workflow

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Establish scope, authorization, architecture and exclusions; work read-only unless the user requested changes. Do not run destructive or load tests against live services without authorization.
- Map assets, attacker capabilities, trust boundaries and state-changing paths; select related skills based on observed risks.
- Trace actual code and configuration before classifying findings. Label assumptions and hypotheses; cite file/symbol/line evidence when available.
- Rank confirmed issues by realistic impact and likelihood; propose smallest fixes and concrete tests, accounting for performance and latency.
- Report scope, threat model, findings, remediation priority, tests run/not run and residual risk. Do not invent findings, CVEs or successful test results.

## Adversarial and regression tests

- Cross-check each conclusion against source or observed execution; distinguish a potential design concern from an evidenced exploit.
- Use scoped fixtures and disposable accounts; ask before changes or disruptive operations not requested.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
