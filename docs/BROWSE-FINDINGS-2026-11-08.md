# Finds from live authenticated review: LumiPaws Online (2026-11-08)

ผลการ review เกมเบราว์เซอร์จริงแบบ **client-only / black-box** ผ่าน `browse` (drive
เบราว์เซอร์จริงของเจ้าของเกมที่ login แล้ว) ตาม workflow ใน
`docs/BROWSE-LIVE-REVIEW.md` และ mapping ตาม `docs/ENGINE-COVERAGE.md` §3
(ดูข้อมูล wire ระดับ frame จาก baseline CDP ใน `docs/LIVE-BROWSER-REVIEW.md`)
วิธีเดิมของแชนแนลนี้: **findings + server-side requirements** — ไม่มีข้อไหน
ด้านล่างอ้างว่า "server บังคับอยู่แล้ว" เพราะเรามองเห็นแค่ client

## 1. สิ่งที่เก็บได้จริงรอบนี้ (evidence)

| รายการ | ค่าที่สังเกต |
| --- | --- |
| เกม / entry point | `https://${BC_SECRET_2}/` (browser client "LumiPaws Online") |
| สถาปัตยกรรม | **REST API แยก host** (`${BC_SECRET_1}`) ออกจาก origin เกม (`${BC_SECRET_2}`); Colyseus rooms + Phaser, WSS transport |
| เข้าสู่ระบบที่ใช้ review | บัญชีทดลอง ("เล่นต่อด้วยบัญชีทดลอง") → `userId 2611`, guest:true (ไม่ผ่าน Google OAuth) |
| ในเกม | ช่องทาง Moonberry, ตัวละคร `sadsadsad` Lv.1 Gear Tinker, zone เกาะลอยฟ้านิมบัส, HUD (HP 232/232, MP 166/166), **Ping 11ms** = socket เกมต่อจริง |
| capture | 1000 entries, 25 MB body, failure 0 — เริ่ม 18:00:06Z หยุด 18:04:47Z |
| ใช้ redaction | `${BC_SECRET_1}`=API host, `${BC_SECRET_2}`=game origin, `${BC_SECRET_3}`=guestSecret, `${BC_SECRET_4}`=Bearer token |

### Endpoint map ที่เห็น (REST, Bearer auth)

| Endpoint | หมายเหตุ |
| --- | --- |
| `POST /auth/guest/login` | body `{"guestId":"guest-516e…@guest.lumipaws.invalid","guestSecret":"${BC_SECRET_3}"}` → `{"token":"${BC_SECRET_4}","userId":2611,"guest":true}` |
| `GET /auth/guest/status` | (Bearer `${BC_SECRET_4}`) ตรวจสถานะ guest |
| `GET /auth/characters` | รายชื่อตัวละคร |
| `GET /auth/settings` | settings ฝั่งบัญชี |
| `GET /worlds` | `{worlds, current}` |
| `GET /channels` | `{channels, totals, zoneChannels, roomMaxClients, channelNames, worldId}` — ที่เห็นในหน้า: แชนแนล 1-5 พร้อมจำนวนคน ("เห็นตัวกันเฉพาะคนที่อยู่แชนแนลเดียวกัน") |
| `GET /version` | `{"protocol":14,"build":"dev-mw5n3blc","minDesktopVersion":"2.2.0","desktopDownloadUrl":"https://lumipaws.in.th/download"}` |

### ข้อเท็จจริงจาก forensics

- **ไม่มี `Set-Cookie` ใน 997 entries ที่ status 200** — auth ทั้งหมดผ่าน
  `authorization: Bearer` + JWT (`lp_session`) ใน sessionStorage
- **ไม่มี security headers** (CSP / X-Frame-Options / HSTS / X-Content-Type-Options)
  ใน capture เลย; origin HTML คืนแค่ `cache-control: no-cache`
- **browse capture บันทึกเฉพาะ HTTP(S) — WS frames ไม่ถูกเก็บรอบนี้** (ไม่พบ
  `wss://`); ข้อมูล frame ยังยึด baseline CDP (`Da` SEND msgpack + `D4P` RECV
  binary ใน `docs/LIVE-BROWSER-REVIEW.md`)
- `sessionStorage`: `lp.alive.v1` (181 chars, JSON: `t,since,map,fps,p95,hitches,
  heapMb,domNodes,r`) + `lp_session` (148, JWT)
- bundle `assets/index-OILLcrDu.js` (18.6 MB): Colyseus client มีจริง; ดู
  `ws://` ได้แค่ `localhost` / `127.0.0.1:2567` (ค่า default ของ Colyseus — URL จริง
  ถูกฉีดตอน runtime); **ไม่มี API secret ฝัง** (ค่าที่ match เป็นเนื้อหาเกม เช่น
  "Secretarybird"); ไม่มี global เกมรั่วบน `window` (bundle scope ดี)

## 2. Findings → skills → server-side requirements

| # | Client-only finding | Surface ที่ผู้เล่นควบคุมได้ | Route ไปที่ | Server-side requirement ที่ปิดช่อง |
| --- | --- | --- | --- | --- |
| 1 | **credential ผ่าน payload ที่ client อ่าน/แก้ได้**: guest login ส่ง `guestSecret` ที่เก็บใน localStorage ไปใน body (`${BC_SECRET_3}`) | ขโมย/แก้ credential ฝั่ง client, replay token | `auth-session-security`, `client-tamper-protection`, `rpc-input-validation` | Server ต้องถือ/validate credential ฝั่งตัวเอง (ไม่ trust ค่าที่ client ส่ง), rate-limit + anti-replay ที่ login, token มี expiry + rotation |
| 2 | **JWT `lp_session` ใน sessionStorage อ่านได้** (รุ่นก่อนเจอ HS256, `userId 2045`; รอบนี้ `userId 2611`); sensitive claims อยู่ใน client-readable token | ขโมย token จาก origin เดียวกัน (XSS/storage read), ถอด/ปลอม claims ถ้า secret อ่อน | `auth-session-security`, `client-tamper-protection`, `server-authority` | Server ต้อง verify signature/claims เอง, ไม่ trust claims ที่ client ส่งมา, นำ sensitive claims ออกจาก token ที่ client อ่านได้, เลิก HS256 ฝั่งสาธารณะถ้ายังใช้ |
| 3 | **ไม่มี security headers** (CSP/XFO/HSTS) ใน response ใดๆ เลย | clickjacking, inline/XSS hijack ได้ง่ายขึ้น, หน้าเป็นกรอบได้ | `web-browser-security`, `mitm-sniffing-defense` | ส่ง CSP + X-Frame-Options + HSTS + X-Content-Type-Options ที่ทุก route (require server-side) |
| 4 | **SEND frames ไม่มี MAC/lำดับให้เห็น** (`move` f64สองตัว, `useSkill`, `ping` — จาก baseline CDP) | แก้/ปลอม/เล่นซ้ำ upload frame ได้ที่ระดับ wire | `packet-protocol-integrity`, `mitm-sniffing-defense`, `rpc-input-validation` | Server validate ทุก inbound action (range, cooldown, position delta, rate) + authenticated/integrity-protected framing |
| 5 | **RECV frames push ค่า "ผลลัพธ์" ที่ client เชื่อ** (gold f64, combatText, `coolDownSync`/`remainingMs`, `inventoryDelta` revision) — client อิสระที่จะเห็นต่าง/เขียนทับตอน SEND | client "เห็นต่าง" หรือ assert ผลที่ server ไม่เคย authorize | `client-tamper-protection`, `server-authority`, `replication-privacy` | Server นำค่า/authority ฝั่งตัวเอง; สิ่งที่ client ส่งกลับให้ re-validate หรือ ignore; ส่งเฉพาะสิ่งที่ตั้งใจจะส่ง |
| 6 | **`lp.alive.v1` = telemetry/liveness ที่ client self-report** (fps, p95, hitches, heapMb, domNodes, map, `r`) | ผู้เล่นปลอม "client ปกติ/คุณภาพดี" หรือป้อนข้อมูลเท็จไปยังระบบ anti-cheat / ระบบเปลี่ยน map | `client-tamper-protection`, `server-authority` | สิ่งที่ report ต้องเทียบกับสัญญาณฝั่ง server (map/fps/การ comet) — อย่าใช้ client-reported เป็นความจริง; ถ้าใช้คัดกรองต้องยอมรับว่า forge ได้ |
| 7 | **no `ws://` จริงใน bundle** — URL ถูกฉีด runtime; origin pinning ต้องทำฝั่ง server | ปกติไม่มี (ดี 📌 — ลดการหลอก client ให้ต่อโฮสต์ปลอม) | `network-transport-security`, `web-browser-security` | ฝั่ง server ตรวจ `Origin` header ของ WS request จริง เทียบกับ host ที่อนุมัติ |
| 8 | **หน้าแชนแนลโชว์จำนวนผู้เล่นต่อแชนแนล** ("15 คน", "28 ออนไลน์") และมันคือ policy การมองเห็น (เห็นตัวเฉพาะแชนแนลเดียวกัน) | สอดแนมจำนวนผู้เล่น/โหลดของโซน | `replication-privacy`, `matchmaking-security`, `service-abuse-resilience` | ให้จำนวน/สถานะที่ server ตั้งใจให้เห็น; rate-limit endpoint ที่ enumerate สถานะ |
| 9 | **bodies ของ characters/settings ถูก truncate** (993/1000) — เห็นแค่โครงสร้าง ไม่เห็นค่าทั้งหมด | — (limit การวัด ไม่ใช่ช่องโหว่) | — | — |

## 3. Honest limitations (ตาม ENGINE-COVERAGE §3)

- **ยังไม่มีการพิสูจน์แบบส่งจริง**: `replayableFrame` / `forgedSent` = *not checked*
  (ไม่ส่ง `--tamper`/`--replay`/`--forged` SEND โดยไม่ได้รับ consent ใหม่ก่อนแต่ละรอบ)
- **browse capture ไม่เก็บ WS frames**; wire facts (SEND `Da` / RECV `D4P`) ยังมาจาก
  baseline CDP pass (`docs/LIVE-BROWSER-REVIEW.md` + `scripts/decode_d4pla.mjs`)
- การตรวจรอบนี้เป็น client-only: **พิสูจน์ไม่ได้ว่า server บังคับอะไรอยู่** —
  ไม่ยืนยัน anti-replay state, rate limit, secret ฝั่ง server, หรือ CORS policy
  ที่บังคับจริง (API request ผ่าน capture สังเกตได้เฉพาะสิ่งที่ client ส่ง/รับ)
- ตรวจเฉพาะสิ่งที่ client **ยอม**ทำ; deliver เป็น "requirements ให้ตรวจฝั่ง server"
  ไม่ใช่ "hardening ที่ verified แล้ว"

## 4. สรุป (สำหรับเจ้าของเกม — ลำดับความสำคัญ)

1. **เร่งสุด**: เปิด airtight session/auth — token guest ที่ client เก็บ+ส่งกลับ
   (finding #1-#2) + ไม่มี CSP/XFO/HSTS (finding #3) ทำให้ surface ใหญ่เมื่อมี
   จุดแทรกสคริปต์เดียว
2. **วางสถาปัตยกรรม**: authority ของค่า gold/HP/cooldown/inventory/combat อยู่ฝั่ง
   server (finding #4-#6) — รวมถึงไม่ trust `lp.alive.v1` ที่ client report
3. **บังคับฝั่ง server**: validate ทุก inbound action + anti-replay + rate limit +
   ตรวจ Origin ของ WS (finding #4, #7, #8) และตรวจจริงว่า CORS/HSTS ถูกตั้ง
4. ตรวจต่อ: ทำ proof run แบบมี consent (WS replay/forged send) แล้วตามด้วย
   server-side audit (`security-audit-workflow`, `docs/MITM-PACKET-ATTACKS.md`,
   `docs/PROTOCOL-HARDENING.md`) เมื่อ server เข้า scope

---

_บันทึกกระบวนการ:_ ใช้ `browse` session `lumi-audit` (allowlist `play.lumipaws.in.th`
ฯลฯ), เข้าเกมผ่านบัญชีทดลอง = normal gameplay observe-only, capture หยุดก่อนหมดอายุ
(18:04:47Z), redaction ผ่าน secret profile → ข้อความนี้ไม่โชว์ค่าจริง; ตัวอย่างรันซ้ำได้
ตาม `docs/BROWSE-LIVE-REVIEW.md` §6
