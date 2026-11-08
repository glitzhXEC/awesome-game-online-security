# Game Security Agent Skills

A cross-engine collection of 44 portable Agent Skills (43 focused skills and one router) for designing, reviewing and testing online game security. It includes a router and focused playbooks for server authority, combat, NPC interactions, movement, economy and more, plus runnable demos and tutorials for MITM/packet-edit attacks, protocol hardening and client tamper. **This is an initial release candidate, not a security certification.**

## Install from GitHub after publishing

Replace `OWNER/REPO` below with the actual GitHub owner and repository. These are placeholders, not an existing package. `npx skills` is a third-party installer, not a command shipped by this repository. It may download code; review it and the repository before use.

```bash
npx skills add OWNER/REPO --list
npx skills add OWNER/REPO
```

Claude Code plugin marketplace alternative:

```bash
claude plugin marketplace add OWNER/REPO
claude plugin install game-security@game-security-skills
```

These commands require a published accessible repository and the relevant tooling; they are not verified against a published repository yet. Plugin and CLI behavior may vary by version. Do not install both routes into the same scope without checking for duplicate skills.

Manual installation: copy each wanted folder from `skills/` (including `security-router`) into the skills directory your agent documents, e.g. `.agents/skills/` or `.claude/skills/`. Keep any bundled files. Verify the skills appear in your agent and test invocation; automatic routing is model/client behavior, not guaranteed.

## Example requests

- Audit the NPC shop: can a player open or buy from it while far away? Show evidence; do not change code yet.
- Review whether attack damage and hit range are validated by a trusted server; add regression tests for confirmed flaws.
- Check trades for duplicated items and simultaneous spending.
- Threat-model my P2P game and explain what a malicious host can still control.
- Client-only / black-box review: this is my client build, no server source. Find what a cheating player could do with it and list the server-side requirements to stop each cheat (do not claim the server does it yet).

## Skills

- **`server-authority`** — Establish trusted authority and threat boundaries for multiplayer game state.
- **`rpc-input-validation`** — Harden multiplayer RPCs, remotes, packet handlers and game APIs against malformed, unauthorized and abusive requests.
- **`combat-security`** — Secure multiplayer combat, damage, weapon fire, hit validation and abilities.
- **`npc-interaction-security`** — Prevent remote NPC, quest and shop interaction exploits.
- **`movement-security`** — Review and harden multiplayer movement, teleport and speed validation.
- **`inventory-security`** — Protect multiplayer inventory, crafting, loot and item ownership.
- **`economy-security`** — Secure currency, shops, rewards, crafting costs and game economy transactions.
- **`player-trading-security`** — Secure player-to-player trades and marketplace transactions.
- **`auth-session-security`** — Review game login, sessions, authorization and account security.
- **`replication-privacy`** — Limit multiplayer information disclosure and hidden-state leaks.
- **`anti-cheat-detection`** — Design privacy-conscious game anti-cheat detection and response.
- **`matchmaking-security`** — Secure multiplayer lobbies, matchmaking and match result submission.
- **`network-transport-security`** — Review game transport security, replay protection and service exposure.
- **`mitm-sniffing-defense`** — Defend online game traffic against man-in-the-middle interception, sniffing and packet tampering. Bundles `references/mitm-playbook.md`.
- **`packet-protocol-integrity`** — Add authentication, integrity and anti-replay protection to game wire protocols. Bundles `references/protocol-hardening-guide.md`.
- **`client-tamper-protection`** — Protect game clients against local tampering, debugging and automated manipulation. Bundles `references/tamper-resistance.md`.
- **`security-audit-workflow`** — Perform a structured multiplayer game security audit and report.
- **`game-security-testing`** — Plan and implement authorized adversarial regression tests for multiplayer game security.
- **`roblox-security`** — Apply multiplayer security guidance to Roblox projects.
- **`godot-security`** — Apply multiplayer game security guidance to Godot projects.
- **`unity-security`** — Apply multiplayer security guidance to Unity projects.
- **`unreal-security`** — Apply multiplayer security guidance to Unreal Engine projects.
- **`bevy-security`** — Apply multiplayer game security guidance to Bevy projects in Rust.
- **`phaser-security`** — Apply multiplayer game security guidance to Phaser projects.
- **`web-browser-security`** — Apply multiplayer game security guidance to browser-based web clients.
- **`love2d-security`** — Apply multiplayer game security guidance to LÖVE (Lua) projects.
- **`pygame-security`** — Apply multiplayer game security guidance to pygame (Python) projects.

- **`quest-progression-security`** — Secure quests, achievements, checkpoints and progression against forged completion and repeated claims.
- **`reward-claim-security`** — Protect daily rewards, login gifts, battle pass claims and event rewards.
- **`loot-rng-security`** — Secure random loot, drops, gacha and weighted rewards.
- **`world-object-security`** — Secure world pickups, chests, doors, gathering nodes and interactable objects.
- **`ability-cooldown-security`** — Secure cooldowns, resource costs and skill activation in multiplayer games.
- **`bot-farming-security`** — Mitigate automated farming, macros, multi-account reward abuse and repetitive bot behavior.
- **`aim-assist-abuse`** — Assess suspected aimbot, triggerbot and unfair aiming automation in multiplayer shooters.
- **`latency-disconnect-abuse`** — Secure multiplayer actions against latency abuse, stale inputs, disconnect/reconnect exploits and timing manipulation.
- **`save-data-security`** — Protect multiplayer save data, cloud saves and progression persistence from tampering or rollback.
- **`admin-control-security`** — Protect game admin panels, GM commands, moderation tools and privileged APIs.
- **`guild-storage-security`** — Protect shared guild banks, clan inventories and shared resources.
- **`player-content-security`** — Secure player-generated names, chat, URLs, uploads and custom content.
- **`purchase-entitlement-security`** — Secure in-app purchases, receipts, subscriptions and entitlements.
- **`leaderboard-integrity`** — Protect leaderboards, ranks and competitive results from forged scores, repeated submissions, win trading and reward manipulation..
- **`service-abuse-resilience`** — Reduce denial-of-service and resource exhaustion risks in game services.
- **`respawn-lifecycle-security`** — Secure death, respawn, invulnerability and player lifecycle state.

`security-router` selects relevant skills by task and topology; it only routes when the agent loads it. Ask for it explicitly if needed. Nine engine-specific guides cover Bevy, Godot, LÖVE, Phaser, pygame, Roblox, Unity, Unreal and the browser; other engines use the cross-engine skills and their own version-matched documentation. The companion tutorials are in `docs/`: MITM/packet-edit attacks, protocol hardening, client tamper, the engine coverage matrix, a worked live browser (CDP) review of a real multiplayer browser game, an authenticated browse-based live review method (`docs/BROWSE-LIVE-REVIEW.md`) that drives the reviewer's own logged-in browser, and its worked findings on a real live game (`docs/BROWSE-FINDINGS-2026-11-08.md`).

## Safety and limitations

Only assess systems you own or are authorized to test. A player-hosted server is controlled by that player. Client-side checks, encryption and anti-cheat do not replace trusted authority. These skills cannot guarantee security, prevent every cheat, or replace project-specific review. No production security audit is included.

## Development and validation

```bash
python scripts/validate.py
python -m unittest discover -s tests -v
```

The validator uses Python 3.10+ standard library only. It checks the catalog structure, simple YAML frontmatter, names, links and marketplace references; it does not prove skill quality or installer compatibility. See [docs/VALIDATION.md](docs/VALIDATION.md) for the release checklist.

## Licensing

No license has been selected. Choose a suitable license before publishing or accepting contributions. This project is independently authored; it is inspired by the structure of [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills), not affiliated with it.
