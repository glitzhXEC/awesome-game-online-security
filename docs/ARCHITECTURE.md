# Architecture and design

The router is an ordinary Agent Skill, not deterministic middleware. An agent must first select or be asked to run it, and its ability to invoke other skills depends on the client. A user can also invoke a specialized skill directly.

Each topic skill is independently useful and contains its own essential controls and tests. Avoid cross-directory file references: installation can flatten or relocate skill folders. The router identifies related skills by name; the client must have them installed.

The catalog has cross-engine topic skills (including three MITM/packet-edit/client-tamper skills with bundled references) and nine engine-oriented guides. Engine guides inspect the actual project and version before choosing APIs; they do not claim universal coverage of each engine or network stack. Cross-engine skills cover the wire and client-tamper layers regardless of engine.

## References

- [OWASP Game Security Framework](https://owasp.org/www-project-gamesec-framework/OGSF.md)
- [Roblox defensive design](https://create.roblox.com/docs/en-us/scripting/security/defensive-design)
- [Roblox server-side detection](https://create.roblox.com/docs/scripting/security/server-side-detection)
- [Roblox client-server boundary](https://create.roblox.com/docs/scripting/security/client-server-boundary)
- [Epic anti-cheat architecture](https://dev.epicgames.com/docs/epic-online-services/trust-and-safety/anti-cheat-interfaces/anti-cheat-interfaces)
- [Unreal RPCs](https://dev.epicgames.com/documentation/en-us/unreal-engine/remote-procedure-calls-in-unreal-engine)
- [Godot multiplayer](https://docs.godotengine.org/en/stable/tutorials/networking/high_level_multiplayer.html)
- [Unity server authority](https://docs.unity.com/en-us/cloud-code/server-authority)
- [Agent Skills specification](https://agentskills.io/specification)
- [Claude plugin marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)

Review version-specific official docs when using or updating a skill. These sources are guidance, not an endorsement of this project.
