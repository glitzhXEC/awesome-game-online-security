# Threat checklists and test cases

Use these as a menu, not a claim that every project needs every control. Validate within an authorized isolated environment, with disposable accounts and data.

## NPC interaction: example invariant

An authorized player may request interaction with an NPC only when both are in the same server-controlled instance, are in an allowed state, and the server-computed distance is within the configured interaction radius. Add line-of-sight or facing requirements only if the game rules require them. An opened UI does not grant permanent authorization.

Pseudocode, adapting names and control flow to the actual project:

```text
on_interact(session, npc_id):
  player = authenticated_player(session)
  npc = server_world.find_npc(npc_id)
  require player and npc and player.instance == npc.instance
  require player.can_interact and npc.is_available
  require distance(player.server_position, npc.server_position) <= npc.interaction_radius
  if rules.require_line_of_sight: require server_world.has_line_of_sight(player, npc)
  return allowed_menu_data(npc, player)

on_buy(session, npc_id, item_id, request_id):
  player = authenticated_player(session)
  require valid_current_interaction(player, npc_id)  # recheck relevant world state
  atomically and idempotently:
    require authorized_item_and_server_price(npc_id, item_id, player)
    require sufficient_funds_and_capacity(player, item_id)
    deduct_funds_and_grant_item(player, item_id)
  return authoritative_result
```

The pseudocode omits storage-specific transaction and failure handling; implement them using actual project guarantees. If a transaction spans services, use a defined distributed consistency/reconciliation strategy instead of assuming one database transaction covers everything.

Tests: nearby valid interaction; just inside/outside radius; wrong instance; nonexistent/despawned NPC; spoofed position; moved away after opening; invalid item or altered price; duplicate and concurrent purchase; disconnect during commit; lag or teleport; line-of-sight if required. Confirm no sensitive state changes on rejection.

## Combat and actions

Invariants: authenticated actor owns the action; ability is available; server-defined cost, rate and state are satisfied; target is eligible; server calculates hit and damage. If the server accepts a client's target or aim, treat them as proposals.

Tests: spoof target/actor/damage; out-of-range hit; through-wall hit if forbidden; attack while dead/stunned; impossible fire rate; duplicate request; missing resource; damage under simultaneous attacks; lag-compensation window boundaries and out-of-window timestamps. Verify server-defined random outcomes and reconciliation.

## Movement

Invariants: position used for gameplay is server-simulated or server-verified; legal transitions depend on actual game mechanics and server time. Explicitly model authorized dashes, knockbacks, vehicles, map changes and teleports.

Tests: impossible speed/acceleration, packet burst or reordered inputs, repeated stale inputs, collision bypass, coordinate NaN/infinity, forged teleport and valid ability movement. Simulate reasonable jitter, disconnects and packet loss; measure false positives. A player-controlled host can alter its own simulation.

## Inventory, trading and economy

Invariants: every item grant and currency change has a server-authorized cause; no spending twice; a completed exchange respects the intended conservation rules; retries cannot repeat the same logical operation.

Tests: modified price and quantity, overflow/negative quantity, invalid ownership, concurrent spending, duplicate request with same key, same key with different payload, fresh keys for repeated unauthorized actions, disconnect before/after commit, service retry and recovery, simultaneous trades, inventory-full and external payment callback verification. Check database constraints and logs, not just the visible UI.

## Network and session

Tests: unauthenticated and expired sessions, cross-account object IDs, malformed and oversized payloads, unexpected enum values, out-of-order and replayed messages, excessive request rate, connection churn, denial of service from expensive inputs, permission change mid-session, server restart and reconnect. Define protocol-specific replay protection and avoid assuming transport encryption prevents valid-looking repeated application requests.

## Hidden state and confidentiality

Tests: inspect what a test client actually receives rather than what the UI displays; check spectator/replay/log output and changes in visibility across teams. Minimize replication of secret state and document any deliberate tradeoffs.

## Verification guidance

- Write a minimal regression test per confirmed issue plus positive tests. Check both rejection and the absence of unauthorized state mutation.
- Use fixtures and deterministic server clocks/RNG where applicable; add concurrent integration tests where atomicity matters.
- Label observations, inferred risks and design recommendations separately. Prioritize actual impact, exposed trust boundary, attacker access and likelihood.
