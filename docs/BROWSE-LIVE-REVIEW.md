# Authenticated live review with browse (drives the user's real browser)

A companion method to `docs/LIVE-BROWSER-REVIEW.md`. The CDP script there
(`scripts/live_review_wrapper.mjs` with `--attach`) works when the reviewer can open a
debug port on their own(ed) browser and capture at the wire level. The `browse`
method covers the cases a headless/attached loop cannot:

- **Real logins already present.** `browse` installs a small MCP-driven agent
  into the user's actual Chrome-family browser, so cookies, sessions, MFA
  state and open tabs are already there and the user can watch or take over at
  any time. No profile copying, no `--user-data-dir` clone, no token purging.
- **Interactive authenticated walks.** With a logged-in session the reviewer can
  perform normal gameplay, capture the network the game produced, and read page
  JS/console state — all passive.
- **Session-scoped capture with redaction.** `browse` network capture records
  normalized Playwright exchanges, can export a credential-redacted HAR, and
  can stash captured credential values in a secret profile that never appears
  in a transcript.

This is still a **client-only / black-box** pass (see
`docs/ENGINE-COVERAGE.md` §3): findings plus server-side requirements, never a
claim that the server enforces anything.

## 1. What `browse` is and how it connects

- `browse` is an MCP server (`browse.exe`) plus a browser extension. The
  extension connects the agent to the real default browser (Chrome-family:
  Chrome/Edge/…). Instances act in new tabs inside that browser, with the
  person's existing sign-ins and the user able to watch or take over.
- Agent-side calls go through the `execute` tool as Playwright JavaScript
  against a named session's page. Code runs in a restricted realm on the
  relay: no process/`require`/`import()`/fs/http; helpers include `snapshot`,
  `ref`, `handoff`, `screenshot`, `pageConsole`, network capture, and
  `secrets.type()` for stored credentials typed without being seen.

## 2. Setup (one-time)

```powershell
irm https://opencode.ai/browse/install.ps1 | iex
```

The installer:

- downloads `browse` and registers the MCP server with OpenCode
  (`~\.config\opencode\opencode.jsonc`), then opens the browser so the
  extension can pair (confirm the "Connected" status page).
- prints equivalent `"mcpServers": {...}` JSON (`"command":
  "C:\\Users\\glitz\\.local\\bin\\browse.exe", "args": ["mcp"]`) to add the
  same server manually for another agent (Claude Code / Codex / Desktop).

Verify with the status tool: `connected: true`, `pairingState: connected`,
one connected browser (`Edge on <host>`, `default: true`). Reset / re-pair
with `browse` CLI: `browse doctor`, `browse status`, `browse install`.

## 3. Toolset (session-scoped)

| Tool | Purpose |
| --- | --- |
| `session_new` | create a session; optional `readOnly` (relay rejects input-dispatch, inspect-only) and `allowedOrigins` domain allowlist |
| `session_allowlist` | host/origin allowlist before typing secrets or touching untrusted content |
| `execute` | Playwright JS against the session page: `snapshot()`/`ref()` for a11y-first inspection+click, `page.goto`, `fillInput`, `screenshot`, `pageConsole`, `handoff(...)` |
| `network` | start/status/stop/cancel session-scoped capture; optional redacted HAR export + credential secret profile |
| `recording` / `flight_recorder` | capture tab video / rolling in-memory buffer (for replay evidence) |
| `session_status`/`list`/`reset`/`delete` | lifecycle; always finish with `reset` or `delete`; `tabs_cleanup` sweeps idle agent tabs |
| `secrets_*` | stored credentials typed without being shown (by user-created secret profiles only) |

## 4. Authenticated live-review workflow (observe-only)

1. **Scope the session.** `session_new` with `allowedOrigins` for the game
   origin (e.g. `play.example.com`, `*.example.com`). Optionally
   `readOnly: true` for a pure inspect pass.
2. **Navigate.** `page.goto('https://play.example.com/')` and confirm the
   session is authenticated (page shows the logged-in view; the auth cookie is
   carried automatically because it is the user's real profile).
3. **Capture.** `network` action `start` (optionally `urlFilter` / resource
   types). Play it normally for the review window, then `status` to
   enumerate endpoints, then `stop` (write a redacted HAR; capture credential
   values into a secret profile if needed).
4. **Probe the client.** In `execute`: read `document.cookie` flags and
   `localStorage` keys the client later trusts, list `window` globals (`__game`
   style), subscribe `pageConsole`, decode each captured WS frame format, and
   note any values that are sent back on events the client controls.
5. **Decode & route.** Map each observed wire format and client-held value to
   the ENGINE-COVERAGE §3 buckets, route to the smallest skill set, and
   deliver **findings + server-side requirements**.
6. **Clean up.** `session_reset` (or `delete`) your session. Never leave agent
   tabs running against the user's browser; `tabs_cleanup` sweeps strays.

### Why this supersedes the copied-profile path

The earlier `--attach` investigation proved on Edge 157 that a throwaway
profile copy of a real login does not authenticate: the copy sends no
`Cookie: lumi_token=`, and Edge purges the token row from the copied cookie DB
(see `docs/LIVE-BROWSER-REVIEW.md` limitations). `browse` avoids the whole
class of problem because it drives the real profile — the session that actually
holds the token — and never clones it.

## 5. Safety and consent (same rules as the CDP scripts)

- **Observe-only by default.** Capture + passive heuristics only. No forged
  or replayed frames are sent unless the game owner gives fresh, explicit,
  per-run consent. Proof runs (`--tamper`/`--replay`/`--forged`) live in
  `scripts/live_browser_review.mjs`, never in the browse session.
- **A client-only pass cannot prove server-side enforcement.** It proves what
  the client is *willing* to do. Do not claim server-side checks, replay
  storage, rate limits or server-only secrets are in place.
- **Type nothing you are not told to type.** Credentials go through
  `secrets.type()` only into an allowlisted session, never into `execute`
  source.
- **Read-only sessions** refuse input dispatch, which is the right default for
  a black-box audit until a specific interaction is explicitly authorized.
- All captures are discarded or redacted; `session_delete` at the end removes
  the audit tab and its cookies/storage from the shared browser context.

## 6. Reproducing

```powershell
# one-time
irm https://opencode.ai/browse/install.ps1 | iex

# per review (agent-side, through the browse MCP tools):
#  session_new { allowedOrigins: ["play.example.com", "*.example.com"] }
#  network { action: "start" }
#  execute { ... page.goto("https://play.example.com/"); snapshot(); ... }
#  network { action: "stop", outputPath: "./browse-live.har" }
#  session_delete { id: "<session>" }
```

Only run against systems you are authorized to test. Pair with
`docs/MITM-PACKET-ATTACKS.md`, `docs/PROTOCOL-HARDENING.md` and
`scripts/decode_d4pla.mjs` once the server side is in scope.
