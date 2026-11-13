import test from "node:test";
import assert from "node:assert/strict";
import { minimapPlayers } from "../client/src/screens/prop-hunt/minimap.js";
import { jailPoint } from "../client/src/screens/prop-hunt/world.js";

test("minimap shows connected teammates only and uses predicted self / jail positions", () => {
  const players = [
    { id: "me", role: "prop", connected: true, x: 1, z: 2 },
    { id: "friend", role: "prop", connected: true, caught: true, x: -20, z: -20 },
    { id: "hunter", role: "hunter", connected: true, x: 3, z: 4 },
    { id: "offline", role: "prop", connected: false },
  ];
  const markers = minimapPlayers(players, "me", { x: 5, z: 6 }, Math.PI / 2);
  assert.deepEqual(markers.map((p) => p.id), ["me", "friend"]);
  assert.equal(markers[0].x, 5);
  assert.equal(markers[0].z, 6);
  assert.equal(markers[0].yaw, Math.PI / 2);
  assert.equal(markers[1].x, jailPoint(1).x);
  assert.equal(markers[1].z, jailPoint(1).z);
  assert.deepEqual(minimapPlayers(players, "hunter").map((p) => p.id), ["hunter"]);
  assert.deepEqual(minimapPlayers(players, "missing"), []);
  players[0].caught = true;
  assert.equal(minimapPlayers(players, "me", { x: 5, z: 6 }, 0)[0].z, jailPoint(0).z);
  players[1].caught = false;
  assert.equal(minimapPlayers(players, "me")[1].x, -20);
});
