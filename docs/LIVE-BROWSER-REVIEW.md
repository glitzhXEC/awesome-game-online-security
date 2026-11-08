# Live browser review: a browser-game wire audit (hands-on example)

An end-to-end example of the ENGINE-COVERAGE browser client-only review workflow, run
against a real live multiplayer browser game (Colyseus + Phaser, WSS to an
authorized own server). It shows the *client* side of the wire: what the player
can see and edit, and the server-side requirements each finding implies. This is
a **client-only** pass — it proves nothing about what the server enforces, and
no finding here claims a server-side check is already in place.

Tooling in this repo:

- `scripts/live_browser_review.mjs` — dependency-free (Node >= 22 globals) CDP
  (Chrome DevTools Protocol) script: discovers a `--remote-debugging-port`
  browser, attaches, captures WebSocket frames on a live page, probes page
  state, and dumps JSON findings.
- `scripts/decode_d4pla.mjs` — dependency-free decoder for the schema-style
  binary RECV frames observed on this target (prints the readable strings
  embedded in each frame).

## 1. Workflow used

1. Relaunch the browser (Edge) with `--remote-debugging-port=9222` and a
   dedicated `--user-data-dir` so the real profile is untouched (a profile copy
   carried the game login over).
2. Discover + attach over CDP, navigate/confirm the target page, then capture
   ~15 s of WebSocket traffic plus a state probe and a console tail.
3. Decode the two distinct wire formats observed and map each finding to the
   cross-engine skills, mirroring `docs/ENGINE-COVERAGE.md` §3.
4. Deliver the result as findings + server-side requirements, never as verified
   hardening.

## 2. Target facts observed

| Fact | Observed value |
| --- | --- |
| Game | "LumiPaws Online" (authorized own server) |
| Entry point | `https://play.lumipaws.in.th/` (browser client) |
| Stack | Colyseus rooms + Phaser v4.2.1, WSS transport |
| Capture | 561 WS frames in ~15 s (mostly RECV) |
| Plaintext JSON frames | none; Colyseus msgpack (`Da` prefix) + a schema-style binary (`D4P` prefix) |
| Client-visible state | `lp_session` JWT (HS256, `userId 2045`, `ep:1`, session id in header), `__game` global exposed, per-entity local store `lp_autopot_*` |

## 3. Two wire formats

### (a) SEND — `Da`-prefixed Colyseus msgpack (player → server)

Messages observed on the upload path: `useSkill` (skill id + implicit target),
`move` (two float64 coordinates), `ping`. No HMAC, message sequence, nonce or
monotonic id is visible in any decoded SEND frame. Value layout is fully
readable/forgeable at wire level by a client that terminates its own WSS.

### (b) RECV — `D4P`-prefixed schema-style binary (server → player)

A custom binary layout, *not* msgpack. Printable ASCII is embedded throughout:
skill ids (`SK_DUS_RIFT`, `SK_ROG_BASIC`, `SK_SIG_GATHERING_MANDALA`,
`SK_NB_SHADOW_NET`, …), an actor/session id reused across combat text, status
effects with remaining-ms (e.g. `freeze:1961`, `slow:1349`,
`vulnerable:13978`), facing/animation states (`idle/move/attack/chase`, facing
dirs), and entity/field ids (`fld_10904`…). This is the game-state feed the
client trusts without any visible integrity tag.

### (c) RECV msgpack named frames (also decoded)

`combatText` (amount + kind `crit|dmg|heal|miss|exp`, `sourceSessionId`,
`skillId`, `targetId`), `statusFx`/`statusBroke`, `coolDownSync` (`cds`,
`remainingMs`, `correction`), `buffSync` (item/skill/pet/spirit ids + icon,
rank, mag, expiry), `inventoryDelta` (revision, gold as float64, `upsert` /
`remove` with item id/qty/enhance/grade/broken/equipped), `inventoryNotices`,
`quests`, `loot`, `petAttack`/`petCast`/`spiritBless`, `castCanceled`,
`castError`, `pong`.

Several of these carry *result* values the client is free to disagree with or
rewrite on SEND if the server accepts them — the classic "client asserts results
the server never authorized" surface.

## 4. Findings → skills → server-side requirements

| # | Client-only finding | Surface an attacker controls | Route to skills | Server-side requirement it implies |
| --- | --- | --- | --- | --- |
| 1 | SEND frames (`move`, `useSkill`) carry no visible MAC/sequence — forgeable at wire level | Editing/replaying/forging upload frames | `packet-protocol-integrity`, `mitm-sniffing-defense`, `rpc-input-validation` | Server validates every inbound action: range, cooldown, position delta, rate; authenticated + integrity-protected framing |
| 2 | RECV frames push result values the client trusts (gold f64, combat amounts, cooldown/`remainingMs`, inventory revisions) | Tampered client state / altered client opinion of server output | `client-tamper-protection`, `server-authority` | Server re-validates or ignores client-supplied values; authority lives on the server |
| 3 | Session token readable in client storage + `__game` global exposed on `window` | Token theft / forged session references | `client-tamper-protection`, `auth-session-security`, `server-authority` | Server-verified sessions; keep sensitive claims out of client-readable tokens; do not trust client-held identity |
| 4 | Full traffic capture recorded; frame structure has no visible per-message ordering tag | Replay of old "valid" frames | `packet-protocol-integrity`, `server-authority`, `network-transport-security` | Server-side anti-replay state (sequence/window tracking) — to be verified, not assumed |
| 5 | Client persists state it later treats as truth (`skillbar_c*`, `lp_autopot_*`, `lp.alive.v1`, JWT in store) | Edited local storage / spoofed client-start state | `client-tamper-protection`, `server-authority` | Server never trusts client-stored or client-reported start state |
| 6 | Console nits only: `onMessage() not registered` for `petEvolution`/`autoFarmPresence`, missing `fx_projectile_bolt` animation, re-face-on-stop warning | — (client quality, not wire) | — (`phaser-security` / client team) | None (not a wire finding) |

## 5. Honest limitations (per `docs/ENGINE-COVERAGE.md` §3)

- `replayableFrame=false` and `forgedSent=false` in the automated report mean
  **consent-gated proof runs were not performed**, not that the wire is
  replay-proof. Those flags are the script's proof-run status, deliberately
  off by default because they *send* frames. The wire surface above is the
  reason to verify server-side anti-replay regardless.
- A client-only pass cannot prove the server enforces anything; it only proves
  what the client is willing to do. It cannot confirm secret keys or policy
  live only on the server, that replay state is stored, or that rate limits
  exist.
- Deliver as "requirements to verify server-side", not as verified hardening.
  Pair with `security-audit-workflow` and `docs/MITM-PACKET-ATTACKS.md` once
  the server side is in scope.
- The copied-profile live wire pass does not itself reach an authenticated
  session: on the Edge 157 profile copy, the throwaway profile sends no
  `Cookie: lumi_token=`, and Edge purges the token row from the copied cookie
  DB. The authenticated view of the same wire is reviewed with the `browse`
  method that drives the real logged-in browser, see
  `docs/BROWSE-LIVE-REVIEW.md`.

## 6. Reproducing and taking it further

```bash
# 1. launch the target in a debug browser with a throwaway profile
#    (dedicated --user-data-dir; never attach to a live production profile)
# 2. attach, capture, probe:
node scripts/live_browser_review.mjs            # prints JSON findings + frames
# 3. decode the schema-style RECV frames:
node scripts/decode_d4pla.mjs
```

Only run with the game owner's consent and only against systems you are
authorized to test. The script's `--tamper` / `--replay` / `--forged` flags
deliberately *send* frames; confirm with the game owner before every such run.
