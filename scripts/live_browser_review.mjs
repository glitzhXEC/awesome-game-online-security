#!/usr/bin/env node
/*!
 * live_browser_review.mjs
 *
 * Black-box, client-only live review of a browser-based game via the Chrome
 * DevTools Protocol (CDP) debugging port. Dependency-free: Node >= 22 ships
 * global fetch and WebSocket clients.
 *
 * Setup (run once, from a terminal):
 *   # Fully quit Edge/Chrome, then relaunch the SAME profile with the flag:
 *   msedge --remote-debugging-port=9222
 *
 * Usage:
 *   node scripts/live_browser_review.mjs                                # read-only: capture traffic + dump client state
 *   node scripts/live_browser_review.mjs --seconds 15                   # longer capture window
 *   node scripts/live_browser_review.mjs --target "fps"                 # pick the page by title/url substring
 *   node scripts/live_browser_review.mjs --tamper                       # ALSO probe prototype patchability + replayability (no send)
 *   node scripts/live_browser_review.mjs --tamper --replay              # ALSO re-send the last captured frame (active test!)
 *   node scripts/live_browser_review.mjs --tamper --forged payload.txt  # send an arbitrary payload through the live socket (active test!)
 *   node scripts/live_browser_review.mjs --json                         # same review, machine-readable output
 *
 * Safety: this is the client half of a review. The script never fabricates
 * traffic unless you explicitly pass --replay/--forged. Replaying or forging
 * frames can change real server state - only run those against a game you own
 * or are explicitly authorized to test.
 */
'use strict';
import fs from 'node:fs';

/* ---------------------------------------------------------------- helpers */

const TRUNC = 160;
const cut = (s, n = TRUNC) =>
  s == null ? '' : (s.length > n ? s.slice(0, n) + `…[+${s.length - n} bytes]` : s);

function log(...a) { console.log(...a); }
function section(t) { console.log(`\n── ${t} ${'─'.repeat(Math.max(2, 56 - t.length))}`); }

/* ------------------------------------------------------------------- args */

function parseArgs() {
  const a = process.argv.slice(2);
  const val = (flag, def) => { const i = a.indexOf(flag); return i >= 0 ? a[i + 1] : def; };
  return {
    host: val('--host', '127.0.0.1:9222'),
    target: val('--target', null),
    seconds: Number(val('--seconds', '12')) || 12,
    tamperSeconds: Number(val('--tamper-seconds', '4')) || 4,
    tamper: a.includes('--tamper'),
    replay: a.includes('--replay'),
    forged: val('--forged', null),
    json: a.includes('--json'),
  };
}

/* -------------------------------------------------------------------- CDP */

class CDP {
  constructor(url, onEvent) {
    this.url = url;
    this.onEvent = onEvent || (() => {});
    this.id = 0;
    this.pending = new Map();
    this.frames = [];
    this.ws = null;
  }
  connect() {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      ws.addEventListener('open', () => { this.ws = ws; resolve(); });
      ws.addEventListener('message', (ev) => this._onMessage(ev.data));
      ws.addEventListener('error', () => reject(new Error('CDP websocket error for ' + this.url)));
      ws.addEventListener('close', () => { /* session over */ });
    });
  }
  _onMessage(data) {
    let m; try { m = JSON.parse(data); } catch { return; }
    if (m.id != null) {
      const p = this.pending.get(m.id);
      if (!p) return;
      this.pending.delete(m.id);
      if (m.error) p.reject(new Error(m.error.message));
      else p.resolve(m.result || {});
    } else if (m.method) {
      this.onEvent(m.method, m.params || {});
    }
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJS(expression, awaitPromise = false) {
    try {
      const r = await this.send('Runtime.evaluate', {
        expression, returnByValue: true, awaitPromise,
      });
      if (r.exceptionDetails) {
        return { ok: false, error: r.exceptionDetails.text
          + (r.exceptionDetails.exception?.description || '') };
      }
      return { ok: true, value: r.result?.value };
    } catch (e) { return { ok: false, error: String(e) }; }
  }
  close() { try { this.ws && this.ws.close(); } catch {} }
}

/* ---------------------------------------------------------- page discovery */

async function discoverPages(cdp, args) {
  const version = await fetch(`http://${args.host}/json/version`).then((r) => r.json());
  const all = await fetch(`http://${args.host}/json`).then((r) => r.json());
  const internal = /^(chrome|edge|devtools|about:|brave):/i;
  const pages = (all || []).filter((p) => p.type === 'page' && !internal.test(p.url || ''));
  if (!pages.length) {
    throw new Error('No debuggable page found. Open the game in Edge/Chrome first, then re-run.');
  }
  let page = null;
  if (args.target) {
    page = pages.find((p) => (p.title || '').includes(args.target) || (p.url || '').includes(args.target)) || null;
  }
  if (!page) page = pages[0];
  return { version, pages, page };
}

/* ------------------------------------------------------- capture listeners */

function makeCollector(cdp) {
  const wsSockets = new Map();   // wsId -> url
  const wsFrames = [];           // {dir,url,opcode,data,size}
  const http = [];               // {method,url,postData}
  const responses = [];          // {url,status,type,body}
  const consoles = [];

  cdp.onEvent = (method, params) => {
    switch (method) {
      case 'Network.webSocketCreated':
        wsSockets.set(params.requestId, params.url);
        break;
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
      case 'Network.webSocketClosed':
        wsSockets.delete(params.requestId);
        break;
      case 'Network.requestWillBeSent': {
        const req = params.request || {};
        if (/^(fetch|xhr)(:|$)/i.test(req.type || '') || req.type === 'Fetch') {
          http.push({ type: req.type || 'xhr/fetch', method: req.method, url: req.url, postData: req.postData || null });
        }
        break;
      }
      case 'Network.responseReceived': {
        const rs = (params.response || {});
        const t = rs.type || '';
        if (t === 'XHR' || t === 'Fetch') {
          responses.push({ requestId: params.requestId, url: rs.url, status: rs.status, type: t, body: null });
        }
        break;
      }
      case 'Runtime.consoleAPICalled': {
        const args = (params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ');
        consoles.push({ type: params.type, text: cut(args) });
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

  return { wsFrames, http, responses, consoles, fillResponseBodies };
}

/* --------------------------------------------------- read-only state probe */

const STATE_PROBE = String.raw`(() => {
  const out = { href: location.href, ua: navigator.userAgent, storage: {}, ws: [], globals: [] };
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i), v = localStorage.getItem(k);
      out.storage['local:' + k] = v ? (v.length > 200 ? v.slice(0, 200) + '...[+'+v.length+']' : v) : v;
    }
  } catch (e) { out.storage['local-error'] = String(e); }
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i), v = sessionStorage.getItem(k);
      out.storage['session:' + k] = v ? (v.length > 200 ? v.slice(0, 200) + '...[+'+v.length+']' : v) : v;
    }
  } catch (e) { out.storage['session-error'] = String(e); }
  try {
    out.ws = performance.getEntriesByType('resource').filter(e => e.name.indexOf('ws') === 0).map(e => e.name);
  } catch (e) { out.wsError = String(e); }
  try {
    const re = /(game|player|health|hp|gold|coin|money|balance|level|score|ammo|mana|xp|state|user|auth|token|session)/i;
    out.globals = Object.keys(window).filter(k => re.test(k)).slice(0, 120);
  } catch (e) { out.globalsError = String(e); }
  return out;
})()`;

/* -------------------------------------------------------------- tamper probe */

const TAMPER_INSTALL = String.raw`(() => {
  if (!WebSocket || !WebSocket.prototype || typeof WebSocket.prototype.send !== 'function') {
    return { error: 'no WebSocket.send to patch' };
  }
  if (window.__reviewInstalled) return { alreadyInstalled: true };
  window.__reviewOrigSend = WebSocket.prototype.send;
  WebSocket.prototype.send = function (data) {
    const s = typeof data === 'string' ? data : (data instanceof ArrayBuffer || ArrayBuffer.isView(data) ? '[binary]' : String(data));
    window.__reviewLast = s;
    window.__reviewLastSocket = this;
    const rec = { t: Date.now(), s: s.slice(0, 400), isString: typeof data === 'string' };
    (window.__reviewFrames = window.__reviewFrames || []).push(rec);
    return window.__reviewOrigSend.call(this, data);
  };
  window.__reviewInstalled = true;
  return { installed: true };
})()`;

const TAMPER_STATE = String.raw`(() => ({
  installed: !!window.__reviewInstalled,
  frames: (window.__reviewFrames || []).map(f => ({ t: new Date(f.t).toISOString(), s: f.s, binary: !f.isString })),
  last: window.__reviewLast || null,
}))()`;

const REPLAY_EXPR = String.raw`(() => {
  if (!window.__reviewInstalled || !window.__reviewLast || !window.__reviewOrigSend || !window.__reviewLastSocket) {
    return { error: 'no captured frame to replay' };
  }
  window.__reviewOrigSend.call(window.__reviewLastSocket, window.__reviewLast);
  return { replayed: true, frame: window.__reviewLast.slice(0, 400) };
})()`;

function FORGED_EXPR(payload) {
  const esc = JSON.stringify(payload);
  return String.raw`(() => {
    if (!window.__reviewInstalled || !window.__reviewOrigSend || !window.__reviewLastSocket) {
      return { error: 'no live ws socket captured' };
    }
    window.__reviewOrigSend.call(window.__reviewLastSocket, ${esc});
    return { sent: true, payload: ${JSON.stringify(cut(payload))} };
  })()`;
}

const TAMPER_CLEANUP = String.raw`(() => {
  if (window.__reviewInstalled && window.__reviewOrigSend) {
    WebSocket.prototype.send = window.__reviewOrigSend;
    window.__reviewInstalled = false;
    return { restored: true };
  }
  return { restored: false, error: 'nothing to restore' };
})()`;

/* ---------------------------------------------------------------- analysis */

function analyze(c, args) {
  const f = {
    wsCount: c.wsFrames.length,
    plaintextJson: c.wsFrames.some((fr) => fr.opcode === 1 && looksJson(fr.data)),
    plaintextAny: c.wsFrames.some((fr) => fr.opcode === 1),
    storageHasState: Object.keys(c.state?.storage || {}).some((k) => /local:/i.test(k)),
    prototypePatchable: c.tamper?.installed === true,
    replayableFrame: !!(args.replay && c.tamper?.replayed),
    forgedSent: !!(args.forged && c.tamper?.sent),
    endpoints: new Set(),
  };
  for (const fr of c.wsFrames) f.endpoints.add(fr.url);
  for (const h of c.http) f.endpoints.add(h.url);
  return f;
}
function looksJson(s) { try { const v = JSON.parse(s); return !!(v && typeof v === 'object'); } catch { return false; } }

/* -------------------------------------------------------------------- main */

async function main() {
  const args = parseArgs();
  if (args.replay || args.forged) args.tamper = true; // replay/forged imply the hook

  let browser, page;
  try {
    const d = await discoverPages(null, args);
    browser = d.version;
    page = d.page;
  } catch (e) {
    log('ERROR: ' + e.message);
    log('Is the browser running with --remote-debugging-port=9222 and is the game open?');
    process.exit(1);
  }
  const cdp = new CDP(page.webSocketDebuggerUrl);
  const c = makeCollector(cdp, page);
  await cdp.connect();
  await Promise.all([
    cdp.send('Runtime.enable'),
    cdp.send('Network.enable'),
    cdp.send('Page.enable'),
  ]);

  log(`Target  : ${page.title} (${page.url})`);
  log(`Browser : ${browser.Browser}`);
  log(`Capturing network for ${args.seconds}s — keep PLAYING the game (move/buy/shoot/open menus)...`);
  await new Promise((r) => setTimeout(r, args.seconds * 1000));

  c.state = (await cdp.evalJS(STATE_PROBE)).value || {};
  await c.fillResponseBodies();

  // tamper phase (optional)
  c.tamper = {};
  if (args.tamper) {
    section('Tamper probe (active hook live)');
    log(`Installing WebSocket.send hook for ${args.tamperSeconds}s — keep playing...`);
    const inst = await cdp.evalJS(TAMPER_INSTALL);
    c.tamper.installed = inst.ok && inst.value?.installed === true;
    await new Promise((r) => setTimeout(r, args.tamperSeconds * 1000));
    const st = await cdp.evalJS(TAMPER_STATE);
    c.tamper.frames = (st.value && st.value.frames) || [];
    c.tamper.last = st.value?.last || null;

    if (args.replay && c.tamper.last) {
      const rp = await cdp.evalJS(REPLAY_EXPR);
      c.tamper.replayed = rp.ok && rp.value?.replayed === true;
      log(`Replay: re-sent '${cut(c.tamper.last)}' — watching server reaction for 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
    if (args.forged) {
      const payload = fs.readFileSync(args.forged, 'utf8');
      const fd = await cdp.evalJS(FORGED_EXPR(payload), true);
      c.tamper.sent = fd.ok && fd.value?.sent === true;
      log(`Forged: sent payload from ${args.forged} — watching server reaction for 3s...`);
      await new Promise((r) => setTimeout(r, 3000));
    }
    const cl = await cdp.evalJS(TAMPER_CLEANUP);
    c.tamper.restored = cl.ok && cl.value?.restored === true;
  }

  const f = analyze(c, args);
  if (args.json) { cdp.close(); process.stdout.write(JSON.stringify({ target: { title: page.title, url: page.url }, findings: f, wsFrames: c.wsFrames, http: c.http, responses: c.responses, state: c.state, tamper: c.tamper, consoles: c.consoles }, null, 2) + '\n'); return; }

  /* ---------- human report ---------- */
  section('1 · Endpoints the client talks to');
  [...f.endpoints].forEach((u) => log('  - ' + u));
  log(`  (${c.wsFrames.length} ws frames, ${c.http.length} xhr/fetch, ${c.responses.length} responses)`);

  section('2 · WebSocket frames (first 12)');
  for (const fr of c.wsFrames.slice(0, 12)) {
    const kind = fr.opcode === 1 ? 'text' : 'binary';
    log(`  ${fr.dir} [${kind}] ${cut(fr.data)}`);
  }
  if (!c.wsFrames.length) log('  (none captured — keep doing actions in the game during capture)');

  section('3 · HTTP responses (XHR/fetch, first 8)');
  for (const r of c.responses.slice(0, 8)) log(`  ${r.status} ${r.url}  body: ${r.body}`);

  section('4 · Client state (storage + globals) — read-only');
  for (const [k, v] of Object.entries(c.state.storage || {})) log(`  ${k}: ${cut(String(v), 120)}`);
  log('  global keys matching game-ish names: ' + ((c.state.globals || []).slice(0, 40).join(', ') || '(none)'));
  log('  ws resources: ' + ((c.state.ws || []).join(', ') || '(none)'));

  section('5 · Tamper probe result');
  if (args.tamper) {
    log('  WebSocket.prototype.send patchable from page JS: ' + (c.tamper.installed ? 'YES ⚠️' : 'no'));
    log('  frames observed through the hook: ' + c.tamper.frames.length);
    const t = c.tamper.frames.map((fr) => `${fr.t} ${cut(fr.s, 80)}`).join('\n       ');
    if (t) log('       ' + t);
    if (c.tamper.replayed) log('  re-sent last frame once more: SENT (observe server reaction)');
    if (c.tamper.sent) log('  forged payload sent: SENT (observe server reaction)');
    log('  hook restored: ' + (c.tamper.restored ? 'yes' : 'no — check the tab console'));
  } else {
    log('  (skipped — pass --tamper to probe client-integrity; --replay/--forged to actively test)');
  }

  section('6 · Findings → skills + server-side requirements');
  const rows = [];
  if (f.plaintextJson) rows.push([
    'Frames are plaintext JSON over ' + (f.wsCount ? 'WebSocket' : 'wire'),
    'readable/editable in transit',
    '`mitm-sniffing-defense`, `network-transport-security`, `packet-protocol-integrity`',
    'TLS/WSS transport; authenticated, integrity-protected frames (HMAC over version+seq+payload)',
  ]);
  if (f.storageHasState) rows.push([
    'Client stores values that look like authoritative state',
    'edited client state',
    '`client-tamper-protection`, `server-authority`, `rpc-input-validation`',
    'Server re-validates/ignores client-provided values; authority on server',
  ]);
  if (c.tamper && c.tamper.installed) rows.push([
    'Networking API is mutable from page JS (WebSocket.send can be wrapped)',
    'client-integrity / forged packets',
    '`client-tamper-protection` + `web-browser-security`',
    'Never trust client-origin packets; server validates every message',
  ]);
  if (c.tamper && (c.tamper.replayed || c.tamper.sent)) rows.push([
    'Client can re-send old frames / inject arbitrary frames',
    'replayed/forged messages',
    '`packet-protocol-integrity`, `server-authority`',
    'Server-side anti-replay (per-session sequence + window) and full validation',
  ]);
  rows.forEach(([what, surface, skills, req], i) => {
    log(`\n  FINDING ${i + 1}: ${what}`);
    log(`     surface : ${surface}`);
    log(`     route   : ${skills}`);
    log(`     req     : ${req}`);
  });
  if (!rows.length) log('  Read-only capture found nothing obviously weak — note: absence of a finding here is NOT proof the server is safe (see limits).');

  section('Honest limits (client-only)');
  log('  Cannot prove server enforces anything, keeps secrets, stores replay state, or rate-limits.');
  log('  This is a requirements list to verify server-side, not verified hardening.');

  cdp.close();
}

main().catch((e) => { console.error('FATAL: ' + (e && e.stack || e)); process.exit(1); });
