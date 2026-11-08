# Engine coverage, hands-on

Which skills apply where, why most engine-specific work is the *same* guidance
wrapped in engine APIs, and how to add another engine guide without breaking
validation. Cross-engine skills run in `skills/*-security` are the pattern; the
engine guides add real, version-checked APIs on top.

## 1. The two layers of coverage

Every skill falls into one stack:

- **Cross-engine topic skills** (`skills/mitm-sniffing-defense`,
  `skills/packet-protocol-integrity`, `skills/client-tamper-protection`, and the
  existing `*-security` topics) describe *what* to secure, engine-agnostically.
- **Engine guides** (`skills/{bevy,godot,love2d,phaser,pygame,roblox,unity,
  unreal,web-browser}-security`) describe *how* to apply it with that engine's
  real APIs, after inspecting the actual version and networking stack.

Engine guides are honest about scope: they inspect the project first, are
version-matched, and never claim universal coverage of an engine.

## 2. The coverage matrix

| Engine / runtime | Guide skill | Networking focus in the guide |
| --- | --- | --- |
| Bevy (Rust, ECS) | `skills/bevy-security` | Replicon/Meshnet, Matchbox, Bevy Quinnet, raw socket; server-authorized ECS systems |
| Godot 4 | `skills/godot-security` | `ENetMultiplayerPeer`, RPCs, `MultiplayerSynchronizer`, server authority |
| LÖVE / Lua | `skills/love2d-security` | socket-based client-server, message validation in the love loop |
| Phaser / JS | `skills/phaser-security` | Socket.IO / WebSocket scenes, client-rendered state vs server truth |
| pygame / Python | `skills/pygame-security` | custom client-server protocol over sockets, struct parsing bounds |
| Roblox / Luau | `skills/roblox-security` | RemoteEvent/RemoteFunction validation, server authority, server-side detection |
| Unity (C#) | `skills/unity-security` | server authority, `[ServerRpc]`, transport hardening, ScriptableObject data seams |
| Unreal (C++/BP) | `skills/unreal-security` | `AGameMode` authority, RPC roles (`Server`/`Multicast`), replicated state vs client input validation |
| Browser (Web) | `skills/web-browser-security` | WebSockets/WSS from a JS client, origin/endpoint pinning, code-reachable integrity |

The three cross-engine security skills pair with *every* row: the MITM playbook,
the protocol hardening guide, and the tamper resistance reference spell out the
defense, and each engine guide shows where its API lets you apply it.

## 3. Client-only / black-box review mode

Sometimes the reviewer only gets the client — a browser bundle, a game build, or
the client source — and never the server. That is enough to do useful review,
because the attacker is a black-box player too: they only control their client
and the traffic it sends. A black-box reviewer stands in for that player, lists
every way they could bend the game, and reports the *server-side requirements*
each finding implies. This is a "findings + requirements" deliverable, not a
proof: the server half can be specified but never verified from the client alone.

### Workflow

1. **Inspect the client only** — engine/runtime, network stack, endpoints it
   talks to, what values it stores or trusts locally, what it sends and when.
2. **Bucket findings by what the attacker controls** — traffic in transit,
   replayed messages, edited client state, forged local results, the client
   trusting servers it has never heard from.
3. **Route each finding to skills** — use the table below and the router
   (`skills/security-router/SKILL.md`) to pick the smallest relevant set.
4. **Deliver findings plus server-side requirements** — and state explicitly
   what could not be verified (server enforcement, replay storage, rate limits,
   any secret only the server should hold). Follow the router's client-only
   route and the honest-limitations note in each output.

### Client-only findings and where they route

| Client-only finding | Surface the attacker controls | Route to | Server-side requirement it implies |
| --- | --- | --- | --- |
| Client stores values the server later trusts (HP, money, cooldowns) | Edited client state | `client-tamper-protection`, `server-authority`, `rpc-input-validation` | Server re-validates or ignores client-provided values; authority lives on the server |
| Traffic is readable or editable in transit | Packets on the wire | `mitm-sniffing-defense`, `network-transport-security`, `packet-protocol-integrity` | TLS transport plus authenticated, integrity-protected frames |
| Old valid messages still work (replay) | Replayed messages | `packet-protocol-integrity`, `server-authority` | Server-side anti-replay state (sequence/window tracking) |
| Client asserts results the server never authorized | Trust of the wire / of the client | `server-authority`, `replication-privacy`, `matchmaking-security` | Server only applies what it authorized and only sends what it intends |

The wire findings above are the same ones the bundled demo models:
`scripts/demo_packet_security.py` shows plaintext frames being sniffed, edited
and replayed, and hardened frames (HMAC + anti-replay window) being rejected with
no state change. A black-box reviewer can run it to demonstrate what the server
must be able to reject even when the client code itself is never modified.

### Template handoff prompt

> "Review this client for multiplayer-cheat surface. You have only the client
> source/build; the server is out of scope. Treat the player as a black-box
> attacker: what could they do by editing the client or its traffic? Map each
> finding to the relevant skills and list the server-side requirements that
> close each gap. Do not claim any server-side check is already in place."

### Honest limitations

- A client-only pass cannot prove the server enforces anything; it only proves
  what the client is willing to do.
- It cannot confirm secret keys or policy live only on the server, that replay
  state is stored, or that rate limits exist.
- Deliver as "requirements to verify server-side", not as verified hardening.
  Pair it with `security-audit-workflow` and `docs/MITM-PACKET-ATTACKS.md` when
  the server side becomes available.

## 4. Verify coverage matches validation

Two validator rules keep the catalog honest:

- **Router coverage**: every non-router skill in `skills/` must be backtick-cited
  somewhere in `skills/security-router/SKILL.md`. If you add a guide, cite it.
- **Marketplace coverage**: the `game-security` plugin in
  `.claude-plugin/marketplace.json` must list exactly the skill names that exist
  in `skills/` (a plugin named `security-engines` groups the engine guides, and
  `security-core` groups the cross-engine ones; the `game-security` all-skills
  plugin still lists every skill of every flavor).

```bash
python scripts/validate.py   # checks both, exits non-zero on any miss
python -m unittest discover -s tests -v
```

## 5. How to add an engine guide (Xxx-security)

1. **Clone a guide** — `skills/godot-security/SKILL.md` is the reference shape:
   one-line `description` in the frontmatter (`name` == folder name), then the
   shared `## Shared safety and workflow`, `## Workflow and controls`,
   `## Adversarial and regression tests`, `## Handoff` sections.
2. **Reword for the engine** — inspect-the-project-first text, version-matched
   API names, and engine-specific validation, tests and handoff in place of the
   generic wording. Do not claim APIs you have not verified against docs.
3. **Cite it in the router** — add the folder name to the Catalog table and a
   route example mentioning it in backticks in
   `skills/security-router/SKILL.md`.
4. **Register the plugin** — add the name to the `security-engines` plugin (and
   it is already a member of `game-security` by the exact-name rule) in
   `.claude-plugin/marketplace.json`.
5. **Document and validate** — update this matrix, `README.md`'s guide count,
   run `python scripts/validate.py` and the unit tests, then update
   `docs/VALIDATION.md` status.

## Next steps

- `docs/CLIENT-ANTI-CHEAT.md` — the client-tamper half for any engine.
- `docs/PROTOCOL-HARDENING.md` — the wire half, with runnable code.
- `skills/security-router/SKILL.md` — route from any theme to the engine guide
  the project is using.
