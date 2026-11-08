# Architecture, tradeoffs and sources

## Trust models

- **Operator-controlled dedicated server:** can own simulation and sensitive state if deployed and operated securely. Clients remain untrusted. Server authority does not fix server bugs, insider compromise, information leaks or all automation.
- **Listen server/player host:** host controls the machine running the authoritative simulation. Server-side checks can limit ordinary remote clients but cannot reliably prevent a malicious host from changing its own rules or outcomes. Protect valuable persistence with an independent backend; results computed by an untrusted host may still be dishonest.
- **P2P:** no peer is inherently trustworthy. Peer validation, signed messages, consensus, replays or dispute resolution can deter or detect some abuse but do not create a fully trusted authority or guarantee fairness. Assess collusion, network partitions and cost. Consider an operator-controlled arbiter for valuable results.
- **Hybrid:** specify authority per operation: simulation, matchmaking, inventory, payments and leaderboard can have different trust boundaries. A backend must validate the evidence it receives; merely storing a host's claimed result is not verification.

Client prediction, interpolation and reconciliation improve responsiveness, but authoritative outcomes must be established according to the stated trust model. Choose latency and privacy tradeoffs deliberately; do not ship a single generic threshold as a universal anti-cheat.

## Primary references

Read current, version-matched documentation before giving engine-specific API guidance:

- OWASP Game Security Framework: https://owasp.org/www-project-gamesec-framework/OGSF.md
- Epic Online Services anti-cheat interfaces and architecture: https://dev.epicgames.com/docs/epic-online-services/trust-and-safety/anti-cheat-interfaces/anti-cheat-interfaces
- Unity server authority: https://docs.unity.com/en-us/cloud-code/server-authority
- Godot high-level multiplayer and secure multiplayer design: https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html
- Unreal Engine remote procedure calls: https://dev.epicgames.com/documentation/en-us/unreal-engine/remote-procedure-calls-in-unreal-engine

These sources inform design; they do not certify this skill or a particular project. Verify versions and applicability, and check the actual framework's supported features.
