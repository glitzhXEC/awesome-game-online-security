---
name: security-router
description: "Route multiplayer game security, anti-cheat, server authority, exploit prevention and audit requests to the smallest relevant game security skills. Use for game security design, review, implementation, or testing across engines and network architectures."
---

# Multiplayer Security Router

Use this dispatcher to select security guidance before acting. It does not enforce policy or itself execute tests. Activation and ability to open other installed skills depend on the agent; explicitly request this skill when auto-selection is unreliable.

## Route

1. Inspect the user request, repository manifests and project structure. Determine engine, network stack, version, deployment and who controls each host. Do not infer authority merely from the word server.
2. Select only the matching topic skills from the catalog below. For a broad audit select `security-audit-workflow`, then incrementally load pertinent domain skills; add `server-authority` when trust topology matters, and `game-security-testing` for test work.
3. If an identified engine has a guide (Bevy, Godot, LÖVE, Phaser, pygame, Roblox, Unity, Unreal, or a browser/web client), also load the corresponding engine skill; for another or unknown engine use cross-engine skills (`mitm-sniffing-defense`, `packet-protocol-integrity`, `client-tamper-protection`) and project evidence. Ask a focused question if the engine or topology is necessary and cannot be established.
4. Invoke selected skills through the agent's skill mechanism or locate their installed directories by skill name. Do not assume this source repository's relative paths survive installation. If unavailable, say so and work from available evidence; do not invent skills.
5. Re-route if the request changes. Preserve the project version and existing architecture; explicitly document player-host/P2P limitations.
6. Follow the selected playbooks, use authorized test environments and report evidence, actual test results and residual risk.
7. Client-only / black-box review (only the client source or build is available, no server code): treat the player as a black-box attacker, review the client's surface from that standpoint, and route to the client/wire skills plus the matching transport engine guide. Report findings as server-side requirements; explicitly state that server-side enforcement could not be verified and must be checked when the server becomes available.

## Examples

- Remote NPC store / no range check → `npc-interaction-security` + `economy-security`; add the identified engine skill.
- Forged damage / hits → `combat-security` + `rpc-input-validation` (+ engine skill).
- Item duplication in trade → `player-trading-security` + `inventory-security` + `game-security-testing`.
- Host modifies match results → `server-authority` + `matchmaking-security`.
- Full project security audit → `security-audit-workflow` first; load topic skills after inspecting the project, not the entire catalog.
- Client-only / black-box review (only the client handed over, no server source) → `client-tamper-protection` + `server-authority` plus `mitm-sniffing-defense` + `packet-protocol-integrity` for the wire half, and the matching transport engine skill (`web-browser-security`, `phaser-security`, `unity-security`, etc.); report findings plus the server-side requirements they imply, and do not claim server-side enforcement was verified.

- Skipped quest steps / fake checkpoint completion → `quest-progression-security` + `world-object-security`.
- Repeated daily reward / battle pass claim → `reward-claim-security` + `economy-security`.
- Gacha / loot reroll → `loot-rng-security` + `inventory-security`.
- Infinite skills or mana → `ability-cooldown-security` + `combat-security`.
- Auto-farming / coordinated reward abuse → `bot-farming-security` + `reward-claim-security`.
- Suspected aimbot → `aim-assist-abuse` + `anti-cheat-detection` + `combat-security`.
- Lag switch / reconnect exploit → `latency-disconnect-abuse` + `game-security-testing`.
- Forged receipts / purchase grants → `purchase-entitlement-security` + `economy-security`.
- Guild bank theft or duplication → `guild-storage-security` + `inventory-security`.
- Unsafe chat, usernames or uploads → `player-content-security`.
- Abuse of GM commands → `admin-control-security` + `auth-session-security`.
- Unkillable or repeated spawn/death rewards → `respawn-lifecycle-security` + `combat-security`.

- Attacker intercepts or alters traffic in transit (MITM) → `mitm-sniffing-defense` + `network-transport-security` (+ `packet-protocol-integrity` if frames have no authenticity).
- Wire format trusts client values / replayable requests → `packet-protocol-integrity` + `server-authority`.
- Player edits the client binary or memory to send impossible values → `client-tamper-protection` + `anti-cheat-detection` + `server-authority`.
- Bevy ECS game → `bevy-security` plus the relevant domain skill.
- Browser/Phaser client → `phaser-security` or `web-browser-security` plus the relevant domain skill.
- LÖVE or pygame client-server project → `love2d-security` or `pygame-security` plus the relevant domain skill.

## Catalog

| Skill | Scope |
| --- | --- |
| `server-authority` | Establish trusted authority and threat boundaries for multiplayer game state. |
| `rpc-input-validation` | Harden multiplayer RPCs, remotes, packet handlers and game APIs against malformed, unauthorized and abusive requests. |
| `combat-security` | Secure multiplayer combat, damage, weapon fire, hit validation and abilities. |
| `npc-interaction-security` | Prevent remote NPC, quest and shop interaction exploits. |
| `movement-security` | Review and harden multiplayer movement, teleport and speed validation. |
| `inventory-security` | Protect multiplayer inventory, crafting, loot and item ownership. |
| `economy-security` | Secure currency, shops, rewards, crafting costs and game economy transactions. |
| `player-trading-security` | Secure player-to-player trades and marketplace transactions. |
| `auth-session-security` | Review game login, sessions, authorization and account security. |
| `replication-privacy` | Limit multiplayer information disclosure and hidden-state leaks. |
| `anti-cheat-detection` | Design privacy-conscious game anti-cheat detection and response. |
| `matchmaking-security` | Secure multiplayer lobbies, matchmaking and match result submission. |
| `network-transport-security` | Review game transport security, replay protection and service exposure. |
| `mitm-sniffing-defense` | Defend online game traffic against man-in-the-middle interception, sniffing and packet tampering. |
| `packet-protocol-integrity` | Add authentication, integrity and anti-replay protection to game wire protocols. |
| `client-tamper-protection` | Protect game clients against local tampering, debugging and automated manipulation. |
| `security-audit-workflow` | Perform a structured multiplayer game security audit and report. |
| `game-security-testing` | Plan and implement authorized adversarial regression tests for multiplayer game security. |
| `roblox-security` | Apply multiplayer security guidance to Roblox projects. |
| `godot-security` | Apply multiplayer game security guidance to Godot projects. |
| `unity-security` | Apply multiplayer security guidance to Unity projects. |
| `unreal-security` | Apply multiplayer security guidance to Unreal Engine projects. |
| `bevy-security` | Apply multiplayer game security guidance to Bevy projects in Rust. |
| `phaser-security` | Apply multiplayer game security guidance to Phaser projects. |
| `web-browser-security` | Apply multiplayer game security guidance to browser-based web clients. |
| `love2d-security` | Apply multiplayer game security guidance to LÖVE (Lua) projects. |
| `pygame-security` | Apply multiplayer game security guidance to pygame (Python) projects. |
| `quest-progression-security` | Secure quests, achievements, checkpoints and progression against forged completion and repeated claims. |
| `reward-claim-security` | Protect daily rewards, login gifts, battle pass claims and event rewards. |
| `loot-rng-security` | Secure random loot, drops, gacha and weighted rewards. |
| `world-object-security` | Secure world pickups, chests, doors, gathering nodes and interactable objects. |
| `ability-cooldown-security` | Secure cooldowns, resource costs and skill activation in multiplayer games. |
| `bot-farming-security` | Mitigate automated farming, macros, multi-account reward abuse and repetitive bot behavior. |
| `aim-assist-abuse` | Assess suspected aimbot, triggerbot and unfair aiming automation in multiplayer shooters. |
| `latency-disconnect-abuse` | Secure multiplayer actions against latency abuse, stale inputs, disconnect/reconnect exploits and timing manipulation. |
| `save-data-security` | Protect multiplayer save data, cloud saves and progression persistence from tampering or rollback. |
| `admin-control-security` | Protect game admin panels, GM commands, moderation tools and privileged APIs. |
| `guild-storage-security` | Protect shared guild banks, clan inventories and shared resources. |
| `player-content-security` | Secure player-generated names, chat, URLs, uploads and custom content. |
| `purchase-entitlement-security` | Secure in-app purchases, receipts, subscriptions and entitlements. |
| `leaderboard-integrity` | Protect leaderboards, ranks and competitive results from forged scores, repeated submissions, win trading and reward manipulation.. |
| `service-abuse-resilience` | Reduce denial-of-service and resource exhaustion risks in game services. |
| `respawn-lifecycle-security` | Secure death, respawn, invulnerability and player lifecycle state. |
