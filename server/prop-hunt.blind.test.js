import test from "node:test";
import assert from "node:assert/strict";
import { startRound, act, detonateBlinds } from "./prop-hunt.js";
import { BLIND, blindThrow, inBlindRadius } from "../client/src/screens/prop-hunt/world.js";

function fixture() {
  const room = { round: 0, players: Array.from({ length: 9 }, (_, i) => ({
    id: String(i), name: String(i), connected: true, score: 0,
  })) };
  startRound(room, 1000);
  return room;
}

test("one blind per prop per round; invalid, captured and hiding throws do not consume it", () => {
  const room = fixture(), prop = room.players[2], hunter = room.players[0];
  const request = { type: "blind", yaw: 0, pitch: 0 };
  assert.equal(prop.blinds, 1);
  assert.equal(hunter.blinds, 0);
  assert.ok(act(room, prop, request, 2000).error);
  room.phase = "hunt";
  for (const aim of [{ yaw: NaN }, { pitch: Infinity }, { pitch: 2 }, { yaw: "0" }])
    assert.ok(act(room, prop, { ...request, ...aim }, 2000).error);
  prop.caught = true;
  assert.ok(act(room, prop, request, 2000).error);
  prop.caught = false;
  prop.connected = false;
  assert.ok(act(room, prop, request, 2000).error);
  prop.connected = true;
  assert.equal(prop.blinds, 1);
  act(room, hunter, request, 2000);
  assert.equal(room.blindGrenades.length, 0);
  const result = act(room, prop, request, 2000);
  assert.equal(result.event.kind, "blindThrow");
  assert.equal(prop.blinds, 0);
  assert.equal(room.blindGrenades.length, 1);
  assert.ok(act(room, prop, request, 2100).error);
  prop.connected = false;
  prop.connected = true;
  assert.ok(act(room, prop, request, 2200).error);
  prop.caught = true;
  Object.assign(room.players[3], { x: 0, z: 10.6 });
  act(room, room.players[3], "rescue", 2300);
  assert.equal(prop.caught, false);
  assert.equal(prop.blinds, 0);
  startRound(room, 3000);
  assert.equal(room.blindGrenades.length, 0);
  for (const p of room.players) {
    assert.equal(p.blinds, p.role === "prop" ? 1 : 0);
    assert.equal(p.blindUntil, 0);
  }
});

test("blast checks all hunters at detonation, lasts five seconds and excludes distant/offline players", () => {
  const room = fixture();
  room.phase = "hunt";
  const blast = { x: 0, y: 1.65, z: 5, at: 3000 };
  room.blindGrenades = [blast];
  Object.assign(room.players[0], { x: 0, z: 5 });
  Object.assign(room.players[1], { x: 2.9, z: 5 });
  assert.equal(detonateBlinds(room, 2999).length, 0);
  assert.equal(room.players[0].blindUntil, 0);
  assert.equal(detonateBlinds(room, 3000).length, 1);
  assert.equal(room.players[0].blindUntil, 8000);
  assert.equal(room.players[1].blindUntil, 8000);
  assert.equal(room.players[2].blindUntil, 0);
  assert.equal(detonateBlinds(room, 3001).length, 0);
  room.blindGrenades = [{ ...blast, at: 4000 }];
  room.players[0].connected = false;
  room.players[1].x = 3.01;
  detonateBlinds(room, 4000);
  assert.equal(room.players[0].blindUntil, 8000);
  assert.equal(room.players[1].blindUntil, 8000);
  room.players[0].connected = true;
  room.players[1].x = 2;
  room.blindGrenades = [{ ...blast, at: 4500 }];
  detonateBlinds(room, 4500);
  assert.equal(room.players[0].blindUntil, 9500);
  assert.equal(room.players[1].blindUntil, 9500);
  room.blindGrenades = [{ ...blast, at: 9000 }];
  room.phase = "results";
  assert.equal(detonateBlinds(room, 9000).length, 0);
  assert.equal(room.blindGrenades.length, 0);
});

test("small blast radius respects walls and elevation; throw path stops at cover and ground", () => {
  assert.equal(BLIND.radius, 3);
  assert.equal(BLIND.duration, 5000);
  assert.equal(inBlindRadius({ x: -8, y: 1, z: -5 }, { x: -6, z: -5 }), false);
  assert.equal(inBlindRadius({ x: 0, y: 1.65, z: 5 }, { x: 3, z: 5 }), true);
  assert.equal(inBlindRadius({ x: 0, y: 1.65, z: 5 }, { x: 3.01, z: 5 }), false);
  assert.equal(inBlindRadius({ x: 0, y: 0, z: 5 }, { x: 0, y: 3, z: 5 }), false);
  const wall = blindThrow({ x: -6, z: -5 }, Math.PI / 2, 0);
  assert.ok(wall.at(-1).x > -7);
  assert.ok(wall.at(-1).t < BLIND.flight);
  const floor = blindThrow({ x: 0, z: 5 }, 0, 1.1);
  assert.ok(Math.abs(floor.at(-1).y - 0.1) < 0.001);
  assert.ok(floor.at(-1).t < BLIND.flight);
  for (const point of [...wall, ...floor])
    assert.ok([point.x, point.y, point.z, point.t].every(Number.isFinite));
});
