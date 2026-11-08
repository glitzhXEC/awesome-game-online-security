---
name: player-content-security
description: "Secure player-generated names, chat, URLs, uploads and custom content. Use for injection, unsafe rendering, malicious maps or file upload abuse in games."
---

# Player Content Security

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs and player-hosted machines as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Identify all client-controlled content, rendering contexts, upload/processing services, integrations and administrative dashboards. Treat even saved content as untrusted.
- Use context-appropriate output encoding and safe rendering for web/admin interfaces; parameterize database queries and avoid executing user input as code or shell commands.
- Bound upload size, type and processing resources; store uploads outside executable paths and validate actual file contents. Restrict risky server-side URL fetching, redirects and internal-network access.
- If modding or user scripts are supported, define permissions, isolated execution and distribution boundaries; do not promise a sandbox is secure without evaluating it.
- Apply moderation, privacy and retention controls appropriate to the product. Avoid exposing sensitive user content in logs.

## Adversarial and regression tests

- Test harmless canary payloads in an isolated environment across chat, profile, admin and replay displays; validate output remains data rather than executable markup.
- Test oversized files, invalid MIME/content, unauthorized object access, dangerous URLs and processing failures without accessing real internal resources.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs.
