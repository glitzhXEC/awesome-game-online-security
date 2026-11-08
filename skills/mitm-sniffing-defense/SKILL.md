---
name: mitm-sniffing-defense
description: "Defend online game traffic against network sniffing and man-in-the-middle (MITM) attacks. Use for certificate validation and pinning, TLS/DTLS/WebSocket transport review, proxy and VPN detection, ARP or DNS spoofing, or reviewing whether captured or re-injected traffic can be trusted."
---

# MITM and Sniffing Defense

## Shared safety and workflow

Work only on systems the user owns or is authorized to assess. Inspect architecture, engine and version, existing code, trust boundaries and tests before editing. Treat client inputs, player-hosted machines and every hop on the network path as untrusted; use version-matched APIs. Preserve existing versions. Ask for missing details only when they block the task. Separate evidence from hypotheses and never claim tests passed without running them. Avoid disruptive tests against live systems without permission.

## Workflow and controls

- Inventory where each connection is authenticated and encrypted, which endpoint holds the private key, and who controls the machines and network on both ends. Identify dedicated servers, player-hosted/listen servers, P2P and relay/VPN paths separately.
- Use mature TLS/DTLS/WSS or an engine-vetted equivalent for confidentiality and authentication. Verify certificate validation is actually enabled, the trust store is correct per platform, and hostname/SNI validation is on. Never ship custom cryptography or self-signed trust roots as the only protection.
- Review pinning if used: pin instance-specific short-lived certificates, allow rotation and configured backup pins, and scope pinning to the endpoints that need it so legitimate corporate proxies and antivirus interception are not treated as false attacks by the client.
- Decide which MITM indicators are worth collecting and how the product reacts. Cert mismatches, unexpected certificate authorities, environment proxy variables, unexpected VPN or emulator fingerprints and DNS/ARP anomalies are signals to inspect, not proof of attack; hard-failing on them can break legitimate users behind filters.
- Treat transport security as solving confidentiality and integrity of transit only. After decryption the server must still validate every application message; an encrypted channel does not make a player-controlled host honest, and it does not stop a client from editing its own protocol before sending.

## Adversarial and regression tests

- In an authorized lab (for example the bundled `scripts/demo_packet_security.py` or `mitmproxy`, Charles, Fiddler, or Wireshark against a test client) confirm whether a real proxy can view or modify the traffic and whether the client rejects the altered certificate.
- Test invalid and re-issued certificates, expired and wrong-host certificates, a missing trust anchor, captured and re-injected sessions, and legitimate filtered-network cases to measure false positives.
- Verify that a technically valid MITM (installed root CA, or a player-controlled host) still cannot forge server-authoritative state, because validation lives on the trusted side, not in the channel.

## Handoff

Report evidence and affected paths, assumptions, fix or design tradeoffs, test commands and actual results, tests not run, and residual risks. For design-only work provide clear invariants and pseudocode rather than inventing project APIs. Never claim a connection is un-interceptable; state what the controls prevent and what an attacker with the private key or a rooted client can still do.

## Reference

For the attack playbook, realistic proxy/VPN scenarios, per-platform certificate handling and example tool commands, read `references/mitm-playbook.md`.
