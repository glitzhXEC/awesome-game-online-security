---
name: aim-assist-abuse
description: "Assess suspected aimbot, triggerbot and unfair aiming automation in multiplayer shooters. Use for aim cheating, automated shooting or aim-related anti-cheat detection."
---

# Aim Assist Abuse

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- First secure authoritative hit validation, weapon cadence, target eligibility and limited replication of hidden state; these do not by themselves detect all automated aim.
- Document legitimate input methods, platform aim assist, accessibility features, camera sensitivity, gamepad, bots and latency; preserve parity and privacy.
- Evaluate server-observed signals such as aiming transitions and shooting patterns in context and over a sufficient window. Define measurement uncertainty, sample bias and known blind spots.
- Treat behavior-based scores as probabilistic signals. Validate on labeled or controlled data, review false positives and avoid automatic punishment from a single metric.
- Define restricted access, retention, review and appeal for evidence. Avoid requesting invasive client monitoring without explicit product, legal and privacy review.

## Adversarial and regression tests

- Compare controlled normal and automated test traces with realistic latency, aim assist and accessibility configurations; report data limitations.
- Confirm a user cannot deal a hit the authoritative rules reject even if an aim-detection system is unavailable.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
