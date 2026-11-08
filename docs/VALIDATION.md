# Release validation

The automated checks validate structural consistency only. Before calling this production-ready:

1. Run the local validator and unit tests.
2. Publish a test repository or use a local checkout, then run `npx skills add <source> --list` and install into a clean temporary project. Confirm all intended skills, including the router, are discovered; record installer version and actual output.
3. In a clean Claude Code environment, add the marketplace and install `game-security@game-security-skills`. Confirm the plugin and skills load. Record version and results.
4. Run real agent evaluations: an NPC interaction out of range, client-provided damage, concurrent inventory spending, and a malicious player host. Verify routing, evidence, test execution and uncertainty handling. Include safe legitimate and high-latency cases.
5. Review security accuracy with a qualified reviewer and verify engine APIs against version-specific docs. Record known gaps and false positives. Do not make unverified compatibility or security claims.

## Status

Checks on the earlier 20-skill revision on 2026-11-08 (re-run for the expanded catalog):

- `python scripts/validate.py`: passed.
- `python -m unittest discover -s tests -v`: 5 tests passed.
- `npx skills` 1.7.6: `add <local-repo> --list` discovered 20 skills.
- In an isolated temporary project, `npx skills add <local-repo> -a codex -s "*" -y --copy` exited 0 and placed 20 skill files including the router in `.agents/skills/`.

Expanded 36-skill revision, checked 2026-11-08:

- `python scripts/validate.py`: passed; all marketplace paths and router entries present.
- `python -m unittest discover -s tests -v`: 5 tests passed.
- `npx skills` 1.7.6 local `--list`: 36 skills found.
- Clean temporary Codex project: local installation with `-a codex -s "*" -y --copy` exited 0 and installed 36 skills, including the router; a bundled reference was present.

Claude Code marketplace validation and installation were not run (Claude CLI unavailable). Neither remote GitHub installation nor agent behavior against a real game has been evaluated. Update this status after running the remaining checks.

Expanded 44-skill revision, checked 2026-11-08:

- `python scripts/validate.py`: passed; all marketplace paths, router entries and script references present.
- `python -m unittest discover -s tests -v`: passed, including demo and validator unit tests.
- `python scripts/demo_packet_security.py`: ran clean; plaintext frames were sniffed/edited/replayed, hardened frames rejected with no state change.
- 9 engine guides (Bevy, Godot, LÖVE, Phaser, pygame, Roblox, Unity, Unreal, browser) plus 3 cross-engine skills with bundled references.
- The bundled demo is stdlib-only and tutorial docs (`docs/MITM-PACKET-ATTACKS.md`, `docs/PROTOCOL-HARDENING.md`, `docs/CLIENT-ANTI-CHEAT.md`, `docs/ENGINE-COVERAGE.md`) were not executed by an agent against a live system.

Remote marketplace/CLI and Claude Code installation for this revision were not re-run (tooling unavailable); re-verify after publishing.

Client-only / black-box review support, 2026-11-08:

- Added a client-only review workflow, client-only finding→skill table, template handoff prompt and honest-limitations note to `docs/ENGINE-COVERAGE.md`.
- Added a client-only route step and example to `skills/security-router/SKILL.md`, and a matching example request in `README.md`.
- Re-ran `python scripts/validate.py` and `python -m unittest discover -s tests -v` after the edits; both pass.
