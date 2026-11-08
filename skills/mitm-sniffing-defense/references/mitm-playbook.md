# MITM playbook for online game transport

This is background and a practical menu for reviewing and testing a game's resistance to
man-in-the-middle (MITM) and sniffing attacks. Run every test only against systems you own or
are authorized to assess, ideally on a disposable network. None of these tools are required for a
text review; they add evidence.

## What a MITM attacker controls

A MITM sits between the client and server and can observe, modify, drop or forge traffic. Common
ways it appears in the real world, outside of academic labs:

- **ARP spoofing / rogue access point** on a shared or public Wi-Fi network: the attacker advertises
  themselves as the next hop and transparently forwards the victim's traffic.
- **Malicious or attacker-operated VPN / game acceleration / relay**: the "middle hop" is simply run by
  the attacker or a compromised provider.
- **DNS/host override + installed root CA** (for example on a rooted phone, a tampered client or an app
  forced to trust an attacker CA): the attacker rides the existing TLS path.
- **Developer-mode proxies** (mitmproxy, Charles, Fiddler, Burp, Proxifier, proxy Droid) installed for
  cheat tooling or game-companion "mod" tools: this is the most common real scenario for online games.
- **Sniffing-only** (Wireshark, tcpdump, PCAP collection) does not require interception of a TLS
  channel; it captures plaintext protocol frames. If a game ships no encryption, sniffing alone
  discloses the whole protocol and makes packet injection trivial.

For a player-hosted server, no network defense matters: the host owns the machine and the server
process. Keep host scenarios out of "transport" claims.

## What the attacker can actually do to an unprotected game

| Attack | Result if unencrypted / unauthenticated | Example impact |
| --- | --- | --- |
| Sniff | Full protocol read | Reveal commands, coordinates, currency events; automate or reverse the protocol |
| Tamper in transit | Modify frames mid-flight | Change a teleport target, an amount, a target id |
| Replay | Re-send captured frames | Duplicate a purchase/claim, redo a movement command |
| Drop / reorder | Deny or reorder frames | Lag the enemy, break anti-cheat assumptions about order |
| Forge session | Rebind identity | Impersonate a player id or an acknowledged sequence |

The decisive defense is that the *server* recomputes authoritative state and `packet-protocol-integrity`
is applied so tampered, replayed or reordered frames are rejected. MITM resistance alone (this skill)
protects the channel; `packet-protocol-integrity` protects the content, and `server-authority` protects
the heartbeat of the game rules.

## Review checklist (per transport)

- Is TLS/DTLS/WSS enabled end to end, or is some hop plaintext (health endoints, telemetry beacons,
  web-first engines, P2P signaling)? List every plaintext path.
- Is certificate validation really enabled on each platform build, or was it disabled for
  development/debug and accidentally shipped (common for web-first, mobile and two-way SSL setups)?
- Is the trust store correct per platform (desktop store, Android network security config, iOS ATS,
  Windows/macOS keychain, JA3/JA4 for TLS fingerprinting)?
- If pinning is used: are pins for the CA/intermediate or leaf, with rotation and multiple backups,
  and does a forced rotation break the client?
- What is done with the data only after TLS is stripped (before encryption, in memory, in logs)?
- For P2P/WebRTC: is the signaling/STUN/TURN channel authenticated, and is DTLS/ICE credential
  generation sound? An unprotected signaling channel can let a peer learn or redirect routes.

## Per-platform certificate notes

- **Android**: use `network_security_config.xml`; never disable `TrustManager` globally. Overriding
  the user root CA store is what allows a sniffing user to see traffic; decide deliberately whether
  user-added CAs are allowed (many cheat setups install one to "mod" the game).
- **iOS / macOS**: ATS and the system trust store; look for intentional `NSExceptionAllowsInsecureHTTPLoads`
  or weak ATS exceptions leaking into release builds.
- **Windows / Linux**: standard OS trust stores; check for bundled CA bundles or self-signed roots
  added at install time, which turn the machine itself into a MITM-friendly environment.
- **Browsers (web games / WASM)**: the browser manages TLS and you cannot pin; assume the user can
  rewrite the client in DevTools and can install any root CA. Transport adds little here; treat the
  browser client as an untrusted caller of a server API.

## Example evidence commands (run only in your own lab)

```text
# Capture plaintext game frames to prove a leaky protocol (replace IFACE/app filter):
tcpdump -i eth0 -A -s0 'tcp port 8080' -w sniff.pcap
wireshark sniff.pcap                        # inspect frames; look for readable game fields

# Passive MITM + tamper test using mitmproxy against a test client:
mitmproxy --listen-port 8080 --mode transparent
# or for TCP, MITM scripted mode: mitmproxy --mode mitm

# Confirm what an installed, attacker-controlled root CA reveals (authorized lab only):
# 1. export the mitmproxy CA, 2. install it on the test machine, 3. capture TLS payloads.
```

A scripted intercept is exactly the demo in `scripts/demo_packet_security.py`, which shows a
plaintext frame being sniffed and edited, then shows the hardened frame being rejected.

## Interpreting results

- **Transit protected**: valid TLS with correct validation, no plaintext leak, pinning (where
  appropriate) prevents trivial proxy insertion. Attacker must break a platform, the endpoint, or
  install a CA on the player's own device to see/modify transit.
- **Transit protected but content forgeable**: the client is player-controlled; a player can read
  their own memory, edit their client, and send valid-looking application messages. This is the
  `client-tamper-protection` and `packet-protocol-integrity` boundary, not a transport failure.
- **Plaintext or unvalidated**: the protocol is fully readable and editable by anyone on the path;
  treat every message as attacker-provided on the server side.

Report honestly which layer each finding is on. A game can have perfect TLS and still be completely
cheatable if the server trusts client assertions.
