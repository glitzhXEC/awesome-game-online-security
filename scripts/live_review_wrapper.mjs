#!/usr/bin/env node
/*!
 * live_review_wrapper.mjs
 *
 * One-command, self-contained, black-box live review of a browser-based game
 * (Colyseus + Phaser in this repo's example). Dependency-free: Node >= 22
 * ships global fetch and WebSocket; only node:core modules are imported.
 *
 * What it does differently from scripts/live_browser_review.mjs:
 *   - No manual "--remote-debugging-port" browser setup. It auto-copies the
 *     real Edge profile (Local State + Default, minus caches) into a
 *     throwaway dir under %TEMP%, launches Edge on the copy, attaches over
 *     CDP, captures, probes state, then kills that Edge tree and deletes the
 *     copy. The real profile is never touched.
 *   - Observe-only by design this round: it captures and analyzes but sends
 *     NO forged/replayed frames through the game socket. The wrapper exposes
 *     no --tamper/--replay/--forged flags; those active proof runs live in
 *     scripts/live_browser_review.mjs and still require fresh per-run consent
 *     from the game owner.
 *   - --attach mode: on Edge 157 the copied-profile path CANNOT produce an
 *     authenticated session (the throwaway loads the page but sends no
 *     `Cookie: lumi_token=` and Edge purges the token row from the copy), so
 *     the only way to observe the authenticated wire traffic is to attach to
 *     an ALREADY-RUNNING logged-in Edge. `--attach` skips the profile copy and
 *     browser launch, connects to the user's own Edge on the debug port,
 *     captures observe-only (no frames sent), and NEVER kills or touches that
 *     Edge or its profile.
 *
 * Safety:
 *   - The real Edge profile is only read from (robocopy source). The throwaway
 *     copy is deleted on exit unless --keep-profile is given.
 *   - Edge must be fully FQE (fully quit) for a reliable copy: Chromium locks
 *     Cookies / Local Storage leveldb while a browser on the same User Data
 *     dir is live. The wrapper warns if msedge.exe is already running.
 *   - Only run against systems you own / are authorized to test.
 *
 * Usage:
 *   node scripts/live_review_wrapper.mjs                          # default: 20s observe-only capture
 *   node scripts/live_review_wrapper.mjs --seconds 30             # longer window (keep playing!)
 *   node scripts/live_review_wrapper.mjs --port 1555              # custom CDP debug port
 *   node scripts/live_review_wrapper.mjs --json                   # machine-readable report to stdout
 *   node scripts/live_review_wrapper.mjs --keep-profile           # keep the throwaway profile copy + Edge logs
 *   node scripts/live_review_wrapper.mjs --game-url "https://play.lumipaws.in.th/"
 *   node scripts/live_review_wrapper.mjs --edge "C:/path/msedge.exe" --source "C:/.../User Data"
 *   node scripts/live_review_wrapper.mjs --attach --port 9222    # attach to YOUR logged-in Edge (observe-only; never killed)
 */
'use strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';

/* ---------------------------------------------------------------- helpers */

const TRUNC = 160;
const JSON_MODE = process.argv.includes('--json');
const cut = (s, n = TRUNC) =>
  s == null ? '' : (s.length > n ? s.slice(0, n) + `…[+${s.length - n} bytes]` : s);
// under --json, keep human status on stderr so stdout stays a valid JSON document
function log(...a) { const line = a.join(' ') + '\n'; return JSON_MODE ? process.stderr.write(line) : console.log(...a); }
function section(t) { log(`\n── ${t} ${'─'.repeat(Math.max(2, 56 - t.length))}`); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------- args */

function parseArgs() {
  const a = process.argv.slice(2);
  const val = (flag, def) => { const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : def; };
  const attach = a.includes('--attach');
  // attach mode talks to the user's ALREADY-RUNNING logged-in Edge, which was
  // launched manually with --remote-debugging-port (standard port 9222 unless
  // they picked another). Non-attach mode launches its own throwaway Edge copy
  // on 1555 so it never collides with a user Edge on 9222.
  const defaultPort = attach ? 9222 : 1555;
  const rawPort = Number(val('--port', String(defaultPort)));
  return {
    attach,
    seconds: Math.max(5, Number(val('--seconds', '20')) || 20),
    port: rawPort || defaultPort,
    json: a.includes('--json'),
    keepProfile: a.includes('--keep-profile'),
    gameUrl: val('--game-url', 'https://play.lumipaws.in.th/'),
    edge: val('--edge', null),
    source: val('--source', null),
  };
}

/* ----------------------------------------------------- Edge / profile find */

function findEdge(override) {
  if (override && fs.existsSync(override)) return override;
  const cands = [
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ].filter(Boolean);
  return cands.find((c) => fs.existsSync(c)) || null;
}
function findProfile(override) {
  if (override && fs.existsSync(override)) return override;
  const c = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'User Data');
  return c && fs.existsSync(c) ? c : null;
}

/* ------------------------------------------------------------- process mgmt */

function edgeRunningCount() {
  return new Promise((resolve) => {
    execFile('tasklist', ['/FI', 'IMAGENAME eq msedge.exe', '/FO', 'CSV', '/NH'], { windowsHide: true }, (err, out) => {
      if (err) return resolve(0);
      resolve(out.split('\n').filter((l) => /msedge\.exe/i.test(l)).length);
    });
  });
}
function killTree(pid) {
  return new Promise((resolve) => {
    execFile('taskkill', ['/F', '/T', '/PID', String(pid)], { windowsHide: true }, () => resolve());
  });
}
function runRobocopy(src, dst) {
  return new Promise((resolve) => {
    // execFile spawns with NO shell, so args are passed verbatim: do NOT wrap
    // paths in quotes here or robocopy receives literal `"` chars -> exit 16.
    const args = [
      src, dst, '/E', '/R:2', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP',
      '/XD', 'Cache', 'Code Cache', 'GPUCache', 'ShaderCache', 'GrShaderCache',
      'GraphiteDawnCache', 'DawnGraphiteCache', 'DawnWebGPUCache', 'CachedData',
    ];
    execFile('robocopy', args, { windowsHide: true }, (err, stdout, stderr) => {
      // robocopy exit code 0-7 = success bitmask (>=8 = error; 1 = files copied)
      const code = err ? (err.code == null ? 16 : err.code) : 0;
      const ok = code >= 0 && code < 8;
      resolve({ ok, code, stderr: (stdout || '') + (stderr || '') });
    });
  });
}

/* -------------------------------------------------------------------- CDP */

class CDP {
  constructor(url, onEvent) {
    this.url = url; this.onEvent = onEvent || (() => {}); this.id = 0;
    this.pending = new Map(); this.ws = null;
  }
  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      ws.addEventListener('open', () => { this.ws = ws; resolve(); });
      ws.addEventListener('message', (ev) => this._onMessage(ev.data));
      ws.addEventListener('error', () => reject(new Error('CDP websocket error: ' + this.url)));
    });
  }
  _onMessage(data) {
    let m; try { m = JSON.parse(data); } catch { return; }
    if (m.id != null) {
      const p = this.pending.get(m.id); if (!p) return;
      this.pending.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result || {});
    } else if (m.method) this.onEvent(m.method, m.params || {});
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJS(expression) {
    try {
      const r = await this.send('Runtime.evaluate', { expression, returnByValue: true });
      if (r.exceptionDetails) return { ok: false, error: r.exceptionDetails.text };
      return { ok: true, value: r.result?.value };
    } catch (e) { return { ok: false, error: String(e) }; }
  }
  close() { try { this.ws && this.ws.close(); } catch {} }
}

/* ------------------------------------------------------- capture collector */

function makeCollector(cdp) {
  const wsSockets = new Map();      // requestId -> url
  const wsFrames = [];              // {dir,url,opcode,data,size}
  const http = [];                  // {method,url,postData}
  const responses = [];             // {url,status,type,body}
  const consoles = [];
  const cookies = [];

  cdp.onEvent = (method, params) => {
    switch (method) {
      case 'Network.webSocketCreated': wsSockets.set(params.requestId, params.url); break;
      case 'Network.webSocketFrameSent':
      case 'Network.webSocketFrameReceived': {
        const f = params.response || {};
        const dir = method.endsWith('Sent') ? 'SEND' : 'RECV';
        wsFrames.push({
          dir, url: wsSockets.get(params.requestId) || '?',
          opcode: f.opcode, data: f.payloadData || '', size: (f.payloadData || '').length,
        });
        break;
      }
      case 'Network.webSocketClosed': wsSockets.delete(params.requestId); break;
      case 'Network.requestWillBeSent': {
        const req = params.request || {};
        if (/^(fetch|xhr)(:|$)/i.test(req.type || '') || req.type === 'Fetch') {
          http.push({ method: req.method, url: req.url, postData: req.postData || null });
        }
        break;
      }
      case 'Network.responseReceived': {
        const rs = params.response || {};
        if (rs.type === 'XHR' || rs.type === 'Fetch') {
          responses.push({ requestId: params.requestId, url: rs.url, status: rs.status, type: rs.type, body: null });
        }
        break;
      }
      case 'Runtime.consoleAPICalled': {
        const t = (params.args || []).map((x) => x.value ?? x.description ?? x.type).join(' ');
        if (consoles.length < 400) consoles.push({ type: params.type, text: cut(t, 120) });
        break;
      }
    }
  };

  async function fillResponseBodies() {
    for (const r of responses) {
      try { const g = await cdp.send('Network.getResponseBody', { requestId: r.requestId }); r.body = cut(g.body || ''); }
      catch { r.body = '(unavailable)'; }
    }
  }
  async function pullCookies() {
    try {
      const r = await cdp.send('Network.getAllCookies');
      const all = (r && r.cookies) || [];
      for (const ck of all) {
        if (/lumipaws\.in\.th/i.test(ck.domain || '') || /lumi/i.test(ck.name || '')) {
          cookies.push({
            name: ck.name, domain: ck.domain, path: ck.path,
            httpOnly: !!ck.httpOnly, secure: !!ck.secure,
            valueLen: (ck.value || '').length, value: cut(ck.value || '', 24),
          });
        }
      }
    } catch { /* cookies unavailable — non-fatal */ }
  }
  return { wsFrames, http, responses, consoles, cookies, fillResponseBodies, pullCookies };
}

/* --------------------------------------------------- read-only state probe */

const STATE_PROBE = String.raw`(() => {
  const out = { href: location.href, title: document.title, ready: document.readyState,
                ua: navigator.userAgent, storage: {}, ws: [], globals: [] };
  try { for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i), v = localStorage.getItem(k);
    out.storage['local:' + k] = v ? (v.length > 200 ? v.slice(0, 200) + '...[+'+v.length+']' : v) : v;
  } } catch (e) { out.storage['local-error'] = String(e); }
  try { for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i), v = sessionStorage.getItem(k);
    out.storage['session:' + k] = v ? (v.length > 200 ? v.slice(0, 200) + '...[+'+v.length+']' : v) : v;
  } } catch (e) { out.storage['session-error'] = String(e); }
  try { out.ws = performance.getEntriesByType('resource').filter(e => e.name.indexOf('ws') === 0).map(e => e.name); } catch {}
  try {
    const re = /(game|player|health|hp|gold|coin|money|balance|level|score|ammo|mana|xp|state|user|auth|token|session|sessionId|cd|cooldown)/i;
    out.globals = Object.keys(window).filter(k => re.test(k)).slice(0, 120);
  } catch (e) { out.globalsError = String(e); }
  out.hasGameGlobal = typeof window.__game !== 'undefined';
  return out;
})()`;

/* ------------------------------------------------- passive frame classifier */

// CDP reports binary WS frames as base64 in payloadData; text frames are raw.
function frameBytes(fr) {
  if (fr.opcode === 1) return Buffer.from(fr.data, 'utf8');
  return Buffer.from(fr.data, 'base64');
}
function printable(buf, max = 240) {
  let s = '';
  for (const x of buf) s += (x > 31 && x < 127) ? String.fromCharCode(x) : '.';
  return s;
}
function classify(fr) {
  const buf = frameBytes(fr);
  if (buf.length === 0) return { kind: 'empty', buf };
  const head = buf.slice(0, 12).toString('latin1');
  if (head.startsWith('Da')) return { kind: 'colyseus-msgpack-send', buf };       // SEND: msgpack with Da prefix
  if (head.startsWith('D4P')) return { kind: 'schema-binary', buf };              // RECV: custom schema binary
  const b0 = buf[0];
  const msgpackish =
    (b0 >= 0x00 && b0 <= 0x7f) || b0 === 0xc0 || (b0 >= 0xc2 && b0 <= 0xcf) ||
    (b0 >= 0x80 && b0 <= 0xbf) || (b0 >= 0x90 && b0 <= 0x9f) || (b0 >= 0xd0 && b0 <= 0xff) ||
    (b0 >= 0xa0 && b0 <= 0xbf);
  if (fr.opcode === 1) return { kind: 'text', buf };
  if (msgpackish) return { kind: 'msgpack', buf };
  return { kind: 'binary-unknown', buf, head };
}
const SIGNING_RE = /\b(sig|mac|hmac|nonce|seq|sequence|checksum|ts|timestamp|token)\b/i;
function analyze(c, args) {
  const sendFrames = c.wsFrames.filter((f) => f.dir === 'SEND');
  const recvFrames = c.wsFrames.filter((f) => f.dir === 'RECV');
  const counts = {};
  for (const fr of c.wsFrames) {
    const k = classify(fr).kind;
    counts[k] = (counts[k] || 0) + 1;
  }
  const signingHits = [];
  for (const fr of sendFrames) {
    const k = classify(fr).kind;
    if (k === 'colyseus-msgpack-send' || k === 'msgpack') {
      const s = printable(frameBytes(fr));
      if (SIGNING_RE.test(s)) { signingHits.push(cut(s, 120)); if (signingHits.length > 3) break; }
    }
  }
  const storageKeys = Object.keys(c.state.storage || {});
  const endpoints = new Set();
  for (const fr of c.wsFrames) endpoints.add(fr.url);
  for (const h of c.http) endpoints.add(h.url);
  const sessionHeld = storageKeys.some((k) => /lp_session/.test(k));
  const guestHeld = storageKeys.some((k) => /guestKey/.test(k));
  return {
    wsCount: c.wsFrames.length,
    sendCount: sendFrames.length,
    recvCount: recvFrames.length,
    kindCounts: counts,
    plaintextJson: c.wsFrames.some((fr) => fr.opcode === 1 && looksJson(fr.data)),
    plaintextAny: c.wsFrames.some((fr) => fr.opcode === 1),
    visibleSigningField: signingHits,
    sessionHeld, guestHeld,
    cookieAuthToken: c.cookies.some((ck) => /(lumi_token|auth-token)/i.test(ck.name)),
    storageHasState: storageKeys.some((k) => /local:/i.test(k)),
    endpoints: [...endpoints],
  };
}
function looksJson(s) { try { const v = JSON.parse(s); return !!(v && typeof v === 'object'); } catch { return false; } }

/* ------------------------------------------------------- reporting helpers */

function dedupePrintables(frames, types, limit = 14) {
  const seen = new Set();
  const out = [];
  for (const fr of frames) {
    const c = classify(fr);
    if (!types.includes(c.kind)) continue;
    const p = printable(frameBytes(fr));
    const key = p.replace(/\s+/g, ' ').slice(0, 40);
    if (!seen.has(key)) { seen.add(key); out.push({ kind: c.kind, size: frameBytes(fr).length, text: p.slice(0, 200) }); }
    if (out.length >= limit) break;
  }
  return out;
}

/* -------------------------------------------------------------------- main */

async function main() {
  const args = parseArgs();

  // --attach: skip the profile-copy + browser-launch entirely; connect to the
  // user's own already-running, logged-in Edge and ONLY observe it (never kill
  // or touch that Edge or its profile).
  if (args.attach) return runAttach(args);

  log(`LumiPaws live review wrapper — observe-only`);
  log(`  game url : ${args.gameUrl}`);
  log(`  window   : ${args.seconds}s   CDP port : ${args.port}`);

  // 1. locate Edge + source profile
  const edgeBin = findEdge(args.edge);
  const srcUserData = findProfile(args.source);
  if (!edgeBin) { log('FATAL: msedge.exe not found. Pass --edge <path>. '); process.exit(1); }
  if (!srcUserData) { log('FATAL: Edge User Data not found. Pass --source <dir>.'); process.exit(1); }
  const srcDefault = path.join(srcUserData, 'Default');
  if (!fs.existsSync(srcDefault)) { log('FATAL: no Default profile in ' + srcUserData); process.exit(1); }

  // 2. warn if the real Edge is running (its files are locked -> torn copy)
  const running = await edgeRunningCount();
  if (running > 0) {
    log(`\n⚠  ${running} msedge.exe process(es) already running. A live Edge locks `);
    log(`   Cookies / Local Storage, so the auto-copied session may be incomplete.`);
    log(`   For a reliable copy, fully quit Edge, then re-run. Continuing anyway...`);
  }

  // 3. copy profile to throwaway dir
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lp-review-'));
  const tmpUD = path.join(root, 'User Data');
  fs.mkdirSync(tmpUD, { recursive: true });
  section('1 · Auto-copying Edge profile (throwaway, real profile untouched)');
  try { fs.copyFileSync(path.join(srcUserData, 'Local State'), path.join(tmpUD, 'Local State')); log('  copied Local State (os_crypt key source)'); }
  catch { log('  ⚠ could not copy Local State (Edge running?) — cookie decrypt may fail'); }
  log('  robocopy Default/ -> ' + tmpUD + '\\Default\\ (excluding caches)...');
  const rc = await runRobocopy(srcDefault, path.join(tmpUD, 'Default'));
  if (!rc.ok) log('  ⚠ robocopy reported code ' + rc.code + ' (expected 0-7; higher = failure)');
  const checks = [
    ['Local State', fs.existsSync(path.join(tmpUD, 'Local State'))],
    ['Default\\Network\\Cookies', fs.existsSync(path.join(tmpUD, 'Default', 'Network', 'Cookies'))],
    ['Default\\Local Storage', fs.existsSync(path.join(tmpUD, 'Default', 'Local Storage'))],
  ];
  let copyOk = true;
  for (const [name, ok] of checks) { log(`  ${ok ? 'ok  ' : 'MISS'} ${name}`); copyOk = copyOk && ok; }

  // 4. launch Edge on the copy
  section('2 · Launching throwaway Edge on the copy');
  const edgeArgs = [
    `--user-data-dir=${tmpUD}`,
    `--remote-debugging-port=${args.port}`,
    '--remote-allow-origins=*',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=msEdgeSidebarV2,msEdgeFirstRunExperience',
    args.gameUrl,
  ];
  const child = spawn(edgeBin, edgeArgs, { stdio: 'ignore', windowsHide: false });
  log(`  pid ${child.pid}  args: ${edgeArgs.join(' ')}`);
  child.on('error', (e) => { log('FATAL: Edge spawn error: ' + e.message); process.exit(1); });

  // 5. poll the debugger until ready, then find the game tab
  section('3 · Polling CDP + attaching to game tab');
  let version = null, page = null;
  for (let i = 0; i < 60; i++) {
    try { version = await fetch(`http://127.0.0.1:${args.port}/json/version`).then((r) => r.json()); break; }
    catch { await sleep(500); }
  }
  if (!version) { log('FATAL: CDP never came up on :' + args.port + ' — Edge may not start on this profile copy.'); await cleanup(args.port, child.pid, tmpUD, args.keepProfile); process.exit(1); }
  for (let i = 0; i < 40; i++) {
    try {
      const all = await fetch(`http://127.0.0.1:${args.port}/json`).then((r) => r.json());
      const internal = /^(chrome|edge|devtools|about:|brave):/i;
      const pages = (all || []).filter((p) => p.type === 'page' && !internal.test(p.url || ''));
      page = pages.find((p) => (p.url || '').startsWith(new URL(args.gameUrl).origin)) || pages[0] || null;
      if (page) break;
    } catch { /* not up yet */ }
    await sleep(500);
  }
  if (!page) { log('FATAL: no game tab found on the throwaway profile.'); await cleanup(args.port, child.pid, tmpUD, args.keepProfile); process.exit(1); }
  log(`  target : ${page.title || '(no title)'}  ${page.url}`);
  log(`  edge   : ${version.Browser || '?'}`);

  // 6. capture + probe
  const cdp = new CDP(page.webSocketDebuggerUrl);
  const c = makeCollector(cdp);
  await cdp.connect();
  await Promise.all([cdp.send('Runtime.enable'), cdp.send('Network.enable'), cdp.send('Page.enable')]);
  log(`  capturing for ${args.seconds}s — wait for the game to load/connect...`);
  await sleep(args.seconds * 1000);
  c.state = (await cdp.evalJS(STATE_PROBE)).value || {};
  await Promise.all([c.fillResponseBodies(), c.pullCookies()]);
  cdp.close();

  // 7. analyze + report
  const f = analyze(c, args);
  const proof = { replayableFrame: 'not checked (observe-only)', forgedSent: false };
  if (args.json) {
    process.stdout.write(JSON.stringify({
      mode: 'observe-only',
      sessionSupply: 'auto-copied-edge-profile',
      profileCopiedOk: copyOk,
      target: { title: page.title, url: page.url, browser: version.Browser },
      findings: f, proof, wsFrames: c.wsFrames, http: c.http, responses: c.responses,
      state: c.state, cookies: c.cookies, consoles: c.consoles,
    }, null, 2) + '\n');
  } else {
    reportHuman(c, f, args, tmpUD, copyOk);
  }

  // 8. cleanup
  await cleanup(args.port, child.pid, tmpUD, args.keepProfile);
  log('');
  log('DONE.');
}

/* ----------------------------------------------------------- attach mode  */

// Attach mode connects to an ALREADY-RUNNING logged-in Edge — the only proven
// authenticated path on Edge 157 (the copied throwaway profile sends NO
// `Cookie: lumi_token=` and Edge purges the token row from the copy). It
// captures observe-only then leaves that Edge running: no Browser.close, no
// taskkill, no profile copy, nothing modified. Only the debugger channel is
// closed at the end, and closing that never closes the browser.
async function findPageOnPort(port, gameUrl, timeoutMs = 20000) {
  const origin = new URL(gameUrl).origin;
  const internal = /^(chrome|edge|devtools|about:|brave):/i;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const all = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      const pages = (all || []).filter((p) => p.type === 'page' && !internal.test(p.url || ''));
      const page = pages.find((p) => (p.url || '').startsWith(origin)) || pages[0] || null;
      if (page) return { page, pages };
    } catch { /* debugger not up yet */ }
    await sleep(250);
  }
  return { page: null, pages: [] };
}

async function runAttach(args) {
  log(`LumiPaws live review — ATTACH mode (observe-only)`);
  log(`  game url : ${args.gameUrl}`);
  log(`  window   : ${args.seconds}s   CDP port : ${args.port}  (must match the Edge launch flag)`);
  log(`  Attaching to your running logged-in Edge — it is NOT killed or modified.`);

  section('1 · Locating your running Edge + game tab');
  let version = null;
  try { version = await fetch(`http://127.0.0.1:${args.port}/json/version`).then((r) => r.json()); }
  catch { /* non-fatal: /json alone is enough to find tabs */ }
  const { page } = await findPageOnPort(args.port, args.gameUrl);
  if (!page) {
    log(`FATAL: no page found on :${args.port}. Is your Edge running with`);
    log(`  --remote-debugging-port=${args.port} (and --remote-allow-origins=*) and logged into the game?`);
    log(`  Fully quit Edge, relaunch logged-in with that flag, open ${args.gameUrl}, then re-run.`);
    process.exit(1);
  }
  log(`  target : ${page.title || '(no title)'}  ${page.url}`);
  log(`  edge   : ${(version && version.Browser) || '?'}`);

  section(`2 · Capturing observe-only for ${args.seconds}s — keep playing!`);
  const cdp = new CDP(page.webSocketDebuggerUrl);
  const c = makeCollector(cdp);
  await cdp.connect();
  await Promise.all([cdp.send('Runtime.enable'), cdp.send('Network.enable'), cdp.send('Page.enable')]);
  await sleep(args.seconds * 1000);
  c.state = (await cdp.evalJS(STATE_PROBE)).value || {};
  await Promise.all([c.fillResponseBodies(), c.pullCookies()]);
  cdp.close(); // closing the debugger channel only — the browser itself stays up

  section('3 · Analyze + report');
  const f = analyze(c, args);
  const proof = { replayableFrame: 'not checked (observe-only)', forgedSent: false };
  if (args.json) {
    process.stdout.write(JSON.stringify({
      mode: 'attach-observe-only',
      sessionSupply: 'manual-attached-real-edge (logged-in)',
      profileCopiedOk: null,
      target: { title: page.title, url: page.url, browser: (version && version.Browser) || null },
      findings: f, proof, wsFrames: c.wsFrames, http: c.http, responses: c.responses,
      state: c.state, cookies: c.cookies, consoles: c.consoles,
    }, null, 2) + '\n');
  } else {
    reportHuman(c, f, args, null, true, /* attach */ true);
  }

  log('');
  log('DONE. Your Edge is still running and untouched.');
}

function reportHuman(c, f, args, tmpUD, copyOk, attach = false) {
  section('A · Wire traffic');
  log(`  ${f.wsCount} ws frames  (SEND ${f.sendCount} / RECV ${f.recvCount}), kind counts:`);
  for (const [k, n] of Object.entries(f.kindCounts)) log(`    ${k}: ${n}`);
  log(`  plaintext JSON frames: ${f.plaintextJson ? 'yes ⚠️' : 'no'}   plaintext text frames: ${f.plaintextAny ? 'yes' : 'no'}`);
  if (!copyOk) log(`  ⚠ profile copy had missing files — session may be incomplete (quit Edge and re-run)`);
  if (!f.sessionHeld) log(`  ⚠ no lp_session found in ${attach ? 'client' : 'copied'} localStorage — capture may be unauthenticated`);

  section('B · SEND frames sampled (readable here = forgeable at wire level)');
  const sends = dedupePrintables(c.wsFrames.filter((fr) => fr.dir === 'SEND'), ['colyseus-msgpack-send', 'msgpack']);
  for (const s of sends) log(`  [${s.size}B ${s.kind}] ${cut(s.text, 120)}`);
  if (!sends.length) log('  (none captured)');

  section('C · RECV frames sampled (schema binary printable strings)');
  const recvs = dedupePrintables(c.wsFrames.filter((fr) => fr.dir === 'RECV'), ['schema-binary']);
  for (const s of recvs) log(`  [${s.size}B] ${cut(s.text, 120)}`);
  if (!recvs.length) log('  (none captured)');

  section('D · HTTP/XHR endpoints');
  for (const h of c.http) log(`  ${h.method} ${h.url}`);
  for (const r of c.responses.slice(0, 8)) log(`  ${r.status} ${r.url}  body: ${r.body}`);

  section('E · Client state (read-only)');
  for (const [k, v] of Object.entries(c.state.storage || {})) log(`  ${k}: ${cut(String(v), 110)}`);
  log(`  __game global: ${c.state.hasGameGlobal ? 'present (window.__game)' : 'absent/undefined'}`);
  log('  ws resources: ' + ((c.state.ws || []).join(', ') || '(none)'));
  log('  cookie(s) of interest: ' + (c.cookies.length ? c.cookies.map((x) => `${x.name}${x.httpOnly ? '(HttpOnly)' : ''}@${x.domain}`).join(', ') : '(none)'));

  section('F · Findings → skills → server-side requirements (observe-only)');
  const rows = [];
  if (f.sendCount) rows.push([
    'SEND frames (msgpack `Da`) are readable/forgeable at wire level; no visible MAC/seq/nonce in sampled decode',
    'editing/replaying/forging upload frames',
    '`packet-protocol-integrity`, `mitm-sniffing-defense`, `rpc-input-validation`',
    'Server validates every inbound action (range/cooldown/position delta/rate); authenticated + integrity-protected framing',
  ]);
  if (f.recvCount && f.kindCounts['schema-binary']) rows.push([
    'RECV schema-binary (`D4P`) feed carries result values the client trusts, with no visible integrity tag',
    'tampered client state / client opinion of server output',
    '`client-tamper-protection`, `server-authority`',
    'Server re-validates or ignores client-supplied values; authority lives on the server',
  ]);
  if (f.sessionHeld || f.guestHeld || f.cookieAuthToken) rows.push([
    `Session material readable from ${attach ? 'the live logged-in Edge' : 'the copied profile'} (lp_session / guestKey / lumi_token)`,
    'token theft / forged session references',
    '`client-tamper-protection`, `auth-session-security`, `server-authority`',
    'Server-verified sessions; keep sensitive claims out of client-readable tokens; never trust client-held identity',
  ]);
  if (f.recvCount && f.visibleSigningField.length) rows.push([
    'Detected possible signing/ordering fields in SEND bytes: ' + f.visibleSigningField.join(' | '),
    'replay / ordering',
    '`packet-protocol-integrity`, `server-authority`, `network-transport-security`',
    'Verify server-side anti-replay state (sequence/window) — not assumed from this signal',
  ]);
  if (f.storageHasState) rows.push([
    'Client persists state it may later treat as truth (localStorage/lp_* keys, JWT)',
    'edited local storage / spoofed client-start state',
    '`client-tamper-protection`, `server-authority`',
    'Server never trusts client-stored or client-reported start state',
  ]);
  if (!rows.length) log('  (no observation-level weaknesses this run — absence ≠ proof; see limits)');
  rows.forEach(([what, surface, skills, req], i) => {
    log(`\n  FINDING ${i + 1}: ${what}`);
    log(`     surface : ${surface}`);
    log(`     route   : ${skills}`);
    log(`     req     : ${req}`);
  });

  section('G · Honest limits (client-only, observe-only)');
  log('  replayableFrame=not checked / forgedSent=false are PROOF-RUN status, not wire guarantees.');
  log('  Cannot prove server enforces anything, keeps secrets, stores replay state, or rate-limits.');
  log('  This is a requirements list to verify server-side, not verified hardening.');
  if (attach) {
    log('  Attach mode: no throwaway profile was created; your real Edge/profile were left untouched.');
  } else {
    log(`  throwaway profile${args.keepProfile ? ' KEPT at ' : ': deleted'} ${tmpUD}`);
  }
}

async function cleanup(port, pid, tmpUD, keepProfile) {
  // 1. graceful close first: Browser.close over the browser-level CDP socket
  try {
    const v = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json());
    if (v && v.webSocketDebuggerUrl) {
      const ws = new WebSocket(v.webSocketDebuggerUrl);
      const done = new Promise((res) => { ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      }); ws.addEventListener('message', (ev) => { try { const m = JSON.parse(ev.data); if (m.id === 1) res(); } catch {} }); });
      await Promise.race([done, sleep(3000)]);
      try { ws.close(); } catch {}
    }
  } catch { /* browser-level socket unavailable — fall through to taskkill */ }

  // 2. taskkill /F /T as a hard fallback (idempotent if Browser.close already exited)
  try { await killTree(pid); } catch {}

  // 3. wait for the browser tree to actually exit (teardown can hold locks briefly)
  for (let i = 0; i < 12; i++) { try { process.kill(pid, 0); } catch { break; } await sleep(250); }

  // 4. delete the throwaway profile copy (safe: it was ours alone); retry on EBUSY
  const dir = path.dirname(tmpUD);
  if (!keepProfile) {
    let ok = false;
    for (let i = 0; i < 8 && !ok; i++) {
      try { await fs.promises.rm(dir, { recursive: true, force: true }); ok = true; }
      catch { await sleep(500); }
    }
    log(ok ? '  deleted throwaway profile at ' + dir : '  ⚠ cleanup: could not delete throwaway profile (still locked?): ' + dir);
  } else {
    log('  keep-profile: NOT deleting throwaway profile at ' + dir);
  }
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
