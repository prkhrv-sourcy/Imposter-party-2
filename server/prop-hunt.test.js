import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as client } from "../client/node_modules/socket.io-client/build/esm/index.js";
import { randomUUID, createHash } from "node:crypto";
import { startRound, act, setupPropHunt } from "./prop-hunt.js";
import {
  movePlayer,
  PROPS,
  nearestCopyProp,
  canStand,
  lineOfSight,
  spawnPoint,
  STEP,
  TYPES,
  MAX_PLAYERS,
  HUNT_SECONDS,
  WEAPONS,
  traceShot,
  hunterCount,
  rescuePoint,
} from "../client/src/screens/prop-hunt/world.js";
const person = (id, extra = {}) => ({
  id,
  name: id,
  connected: true,
  score: 0,
  ...extra,
});
function room() {
  const r = { players: [person("a"), person("b"), person("c")], round: 0 };
  startRound(r, 1000);
  return r;
}

test("fixed-step movement normalizes input, stays finite, and slides along solids", () => {
  const p = { x: 0, z: 7, role: "hunter" };
  for (let i = 0; i < 30; i++) movePlayer(p, { x: 1000, z: 1000 }, STEP);
  assert.ok(Math.hypot(p.x, p.z - 7) <= 5.11);
  movePlayer(p, { x: NaN, z: Infinity, yaw: NaN }, STEP);
  assert.ok(Number.isFinite(p.x));
  const wall = { x: -6, z: -5, role: "hunter" };
  for (let i = 0; i < 120; i++) movePlayer(wall, { x: -1, z: 0.2 }, STEP);
  assert.ok(wall.x > -6.45);
  assert.ok(wall.z > -5);
  assert.ok(canStand(wall.x, wall.z, 0.34));
});
test("all spawn positions fit every disguise and tall walls block tags", () => {
  for (let i = 0; i < 34; i++)
    for (const t of Object.values(TYPES)) {
      const p = spawnPoint(i);
      assert.ok(canStand(p.x, p.z, t.radius), `spawn ${i}`);
    }
  assert.equal(lineOfSight({ x: -8, z: -5 }, { x: -6, z: -5 }), false);
});
test("hunter rotates, aim and ammo are authoritative, captures end a round", () => {
  const r = room(),
    h = r.players[0],
    shot = { type: "shoot", yaw: 0, pitch: 0.3 };
  assert.equal(h.role, "hunter");
  assert.ok(act(r, h, shot, 2000).error);
  r.phase = "hunt";
  Object.assign(h, { x: 0, z: 7 });
  Object.assign(r.players[1], { x: 0, z: 4 });
  Object.assign(r.players[2], { x: 0, z: 3.5 });
  assert.ok(act(r, h, { ...shot, pitch: NaN }, 2000).error);
  assert.equal(h.ammo.glock, 12);
  assert.equal(act(r, h, shot, 2000).event.kind, "shot");
  assert.equal(r.players[1].health, 50);
  assert.equal(act(r, h, shot, 2100).event, undefined);
  assert.equal(h.ammo.glock, 11);
  act(r, h, shot, 2300);
  assert.ok(r.players[1].caught);
  act(r, h, shot, 2600);
  act(r, h, shot, 2900);
  assert.equal(r.phase, "results");
  assert.equal(r.winner, "hunter");
  assert.equal(h.score, 150);
  startRound(r, 5000);
  assert.equal(r.players[1].role, "hunter");
  assert.ok(r.players.every((p) => !p.caught && p.health === 100));
});
test("shotgun unlock, switching, ammo and reload cooldowns cannot be bypassed", () => {
  const r = room(),
    h = r.players[0];
  r.phase = "hunt";
  r.huntStartedAt = 1000;
  assert.ok(act(r, h, { type: "equip", weapon: "shotgun" }, 2000).error);
  assert.ok(act(r, h, { type: "equip", weapon: { toString: 3 } }, 2000).error);
  act(r, h, { type: "equip", weapon: "shotgun" }, 46000);
  assert.equal(h.weapon, "shotgun");
  h.ammo.shotgun = 0;
  assert.ok(act(r, h, { type: "shoot", yaw: 0, pitch: 0 }, 47000).error);
  act(r, h, "reload", 47000);
  assert.equal(h.reloadAt, 49200);
  assert.ok(act(r, h, { type: "equip", weapon: "glock" }, 48000).error);
  assert.equal(
    act(r, h, { type: "shoot", yaw: 0, pitch: 0 }, 48000).event,
    undefined,
  );
  act(r, h, { type: "shoot", yaw: 0, pitch: 0 }, 49200);
  assert.equal(h.ammo.shotgun, 4);
  const r2 = room();
  r2.phase = "hunt";
  r2.players[0].captures = 2;
  act(r2, r2.players[0], { type: "equip", weapon: "shotgun" }, 2000);
  assert.equal(r2.players[0].weapon, "shotgun");
});
test("3D shots respect cover and range; shotgun spread can hit off-center props", () => {
  const h = person("h", { x: -6, z: -5, role: "hunter" }),
    t = person("t", { x: -8, z: -5, role: "prop", type: "plant" });
  assert.equal(traceShot([h, t], h, "glock", Math.PI / 2, 0.3).hits.size, 0);
  Object.assign(h, { x: 0, z: 7 });
  Object.assign(t, { x: 0.65, z: 1 });
  assert.equal(traceShot([h, t], h, "glock", 0, 0.15).hits.size, 0);
  assert.ok(traceShot([h, t], h, "shotgun", 0, 0.15).hits.size > 0);
  Object.assign(t, { x: 0, z: -25 });
  assert.equal(traceShot([h, t], h, "shotgun", 0, 0).hits.size, 0);
  const a = traceShot([h, t], h, "shotgun", 0, 0.1);
  assert.equal(a.rays.length, 9);
  assert.ok(
    a.rays.every(
      (end) => Math.hypot(end.x - h.x, end.y - 1.65, end.z - h.z) <= 15.001,
    ),
  );
});
test("30 players get unique valid spawns and balanced rotating hunter teams", () => {
  const r = {
    players: Array.from({ length: 30 }, (_, i) => person(String(i))),
    round: 0,
  };
  startRound(r, 1000);
  assert.equal(r.players.filter((p) => p.role === "hunter").length, 4);
  assert.equal(hunterCount(8), 1);
  assert.equal(hunterCount(9), 2);
  assert.equal(new Set(r.players.map((p) => `${p.x},${p.z}`)).size, 30);
  assert.ok(r.players.every((p) => canStand(p.x, p.z, 0.46)));
  const first = r.players.filter((p) => p.role === "hunter").map((p) => p.id);
  startRound(r, 2000);
  assert.ok(
    r.players
      .filter((p) => p.role === "hunter")
      .every((p) => !first.includes(p.id)),
  );
  assert.equal(
    new Set(
      Array.from({ length: 30 }, (_, i) => JSON.stringify(rescuePoint(i))),
    ).size,
    30,
  );
});
test("disguise requires proximity, taunts have cooldowns, and rescues free captives", () => {
  const r = room(),
    p = r.players[1];
  r.phase = "hunt";
  Object.assign(p, { x: 0, z: 7 });
  assert.ok(act(r, p, "change", 3000).error);
  Object.assign(p, { x: -5.2, z: -5.7 });
  act(r, p, "change", 4000);
  assert.equal(p.type, "chair");
  assert.equal(act(r, p, "taunt", 6000).event.kind, "taunt");
  assert.equal(act(r, p, "taunt", 6100).event, undefined);
  r.players[2].caught = true;
  Object.assign(p, { x: 0, z: 10 });
  act(r, p, "rescue", 7000);
  assert.equal(r.players[2].caught, false);
  p.caught = true;
  assert.ok(act(r, p, "change", 9000).error);
});

test("socket lifecycle: validation, rooms, host-only start, reconnect, leave and practice", async (t) => {
  const http = createServer(),
    io = new Server(http),
    game = setupPropHunt(io);
  await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${http.address().port}/prop-hunt`,
    sockets = [];
  t.after(async () => {
    sockets.forEach((s) => s.disconnect());
    game.close();
    await new Promise((resolve) => io.close(resolve));
  });
  async function connect(token = randomUUID()) {
    const s = client(url, {
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
    });
    sockets.push(s);
    await new Promise((resolve, reject) => {
      s.once("connect", resolve);
      s.once("connect_error", reject);
    });
    return s;
  }
  const emit = (s, event, data) =>
    new Promise((resolve, reject) =>
      s
        .timeout(2000)
        .emit(event, data, (err, res) => (err ? reject(err) : resolve(res))),
    );
  const a = await connect(),
    b = await connect();
  assert.ok((await emit(a, "enter", { name: "" })).error);
  assert.ok(
    (await emit(a, "enter", { name: "Host", code: { toString: 3 } })).error,
  );
  await emit(a, "enter", { name: "Host" });
  const r = [...game.rooms.values()][0];
  await emit(b, "enter", { name: "Friend", code: r.code });
  assert.equal(r.players.length, 2);
  assert.notEqual(r.players[0].id, a.auth.token);
  assert.ok((await emit(b, "start", null)).error);
  await emit(a, "start", null);
  assert.equal(r.phase, "hide");
  const secret = b.auth.token,
    pid = createHash("sha256").update(secret).digest("hex");
  b.disconnect();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(r.players.find((p) => p.id === pid).connected, false);
  const b2 = await connect(secret);
  assert.equal(r.players.find((p) => p.id === pid).connected, true);
  r.phase = "hunt";
  const jumper = r.players.find((p) => p.id === pid);
  const motionPacket = new Promise((resolve) => b2.once("motion", resolve));
  b2.emit("input", { seq: 1, x: 0, z: 0, yaw: 0, jump: true, y: 100, vy: 100 });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.ok(jumper.y > 0 && jumper.y < 2, "server computes jump height");
  const packet = await motionPacket;
  assert.equal(packet.players.find((p) => p[0] === pid).length, 10);
  const h = r.players[0];
  const before = h.x;
  for (let i = 1; i < 50; i++)
    a.emit("input", { seq: i, x: 100, z: 0, yaw: 0 });
  a.emit("input", { seq: NaN, x: Infinity, z: 0, yaw: 0 });
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.ok(h.x - before < 1);
  await emit(b2, "leave", null);
  assert.equal(r.phase, "results");
  await emit(a, "leave", null);
  assert.equal(game.rooms.size, 0);
  await emit(a, "enter", { name: "Practice", practice: true });
  await emit(a, "start", null);
  const practice = [...game.rooms.values()][0];
  assert.equal(practice.players.length, 4);
  assert.equal(practice.players[0].role, "hunter");
  assert.ok(
    (await emit(b2, "enter", { name: "Friend", code: practice.code })).error,
  );
  practice.endsAt = Date.now() - 1;
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(practice.phase, "hunt");
  practice.endsAt = Date.now() + HUNT_SECONDS * 500 + 4000;
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(practice.shuffleWarned, true);
  const disguises = practice.players.slice(1).map((p) => p.type);
  practice.endsAt = Date.now() + HUNT_SECONDS * 500 - 1000;
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(practice.shuffled, true);
  assert.ok(practice.players.slice(1).every((p, i) => p.type !== disguises[i]));
  practice.endsAt = Date.now() - 1;
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.equal(practice.winner, "prop");
  assert.equal(practice.phase, "results");
  await emit(a, "start", null);
  assert.equal(practice.phase, "hide");
  assert.equal(practice.round, 2);
});

test("online shots compensate for recent motion but cannot rewind beyond 200 ms", () => {
  const r = room(),
    h = r.players[0],
    target = r.players[1];
  r.phase = "hunt";
  Object.assign(h, { x: 0, z: 7 });
  Object.assign(target, { x: 1, z: 4 });
  r.positionHistory = [
    {
      at: 1900,
      positions: new Map([[target.id, { x: 0, z: 4, type: target.type }]]),
    },
  ];
  act(r, h, { type: "shoot", yaw: 0, pitch: 0.3, shotTime: 1900 }, 2000);
  assert.equal(target.health, 50);
  target.health = 100;
  h.shotAt = 0;
  act(r, h, { type: "shoot", yaw: 0, pitch: 0.3, shotTime: 1900 }, 2400);
  assert.equal(target.health, 100);
});

test("props jump onto tables, remain supported, fall off edges, and cannot double-jump", () => {
  const p = { x: -3.7, z: 4, role: "prop", type: "cone" };
  let peak = 0;
  for (let i = 0; i < 30; i++) {
    movePlayer(p, { x: 0, z: i < 20 ? -1 : 0, jump: i === 0 || i === 8 });
    peak = Math.max(peak, p.y);
  }
  for (let i = 0; i < 30; i++) movePlayer(p, { x: 0, z: 0 });
  assert.ok(peak > 1.4 && peak < 1.9, `single jump peak ${peak}`);
  assert.equal(p.y, 1.09);
  assert.equal(p.vy, 0);
  assert.ok(canStand(p.x, p.z, TYPES.cone.radius, p.y));
  for (let i = 0; i < 60; i++) movePlayer(p, { x: 1, z: 0 });
  assert.equal(p.y, 0);
  assert.equal(p.vy, 0);
  const held = { x: 0, z: 7, role: "prop", type: "cone" };
  for (let i = 0; i < 90; i++) movePlayer(held, { x: 0, z: 0, jump: true });
  assert.equal(held.y, 0, "holding jump cannot bounce repeatedly");
  for (const extra of [{ role: "hunter" }, { role: "prop", caught: true }]) {
    const blocked = { x: 0, z: 7, type: "cone", ...extra };
    movePlayer(blocked, { x: 0, z: 0, jump: true });
    assert.equal(blocked.y, 0);
  }
});

test("jumping respects tall walls and hits use the prop's actual elevation", () => {
  const p = {
    id: "prop",
    x: -6,
    z: -5,
    role: "prop",
    type: "cone",
    connected: true,
  };
  for (let i = 0; i < 30; i++) movePlayer(p, { x: -1, z: 0, jump: i === 0 });
  assert.ok(p.x > -6.5);
  const target = { ...p, x: 0, z: 3, y: 2 };
  const shooter = { id: "hunter", x: 0, z: 7, role: "hunter" };
  assert.equal(traceShot([target], shooter, "glock", 0, 0.25).hits.size, 0);
  assert.equal(
    traceShot([target], shooter, "glock", 0, -0.2).hits.get("prop"),
    50,
  );
  const r = room();
  r.players[1].y = 2;
  r.players[1].vy = 4;
  startRound(r, 5000);
  assert.ok(r.players.every((p) => p.y === 0 && p.vy === 0 && !p.jumpHeld));
});

test("decoys mimic the assigned taunt away from the prop, enforce cooldowns, and preserve real taunts", () => {
  const r = room(),
    p = r.players[1],
    h = r.players[0];
  assert.ok(act(r, p, "decoy", 2000).error);
  r.phase = "hunt";
  const tauntAt = p.tauntAt;
  const result = act(r, p, { type: "decoy", x: 999, z: 999 }, 3000);
  assert.equal(result.event.kind, "taunt");
  assert.equal(result.event.tauntId, p.tauntId);
  const range = Math.hypot(result.event.x - p.x, result.event.z - p.z);
  assert.ok(range >= 5 && range <= 12);
  assert.deepEqual(Object.keys(result.event).sort(), [
    "kind",
    "name",
    "tauntId",
    "x",
    "y",
    "z",
  ]);
  assert.equal(
    p.tauntAt,
    tauntAt,
    "real automatic taunts still expose the prop",
  );
  assert.equal(p.decoyAt, 28000);
  assert.ok(act(r, p, "decoy", 27999).error);
  assert.ok(act(r, p, "decoy", 28000).event);
  assert.equal(act(r, h, "decoy", 30000).event, undefined);
  p.caught = true;
  assert.ok(act(r, p, "decoy", 60000).error);
  p.caught = false;
  p.connected = false;
  assert.ok(act(r, p, "decoy", 60000).error);
  p.connected = true;
  startRound(r, 70000);
  assert.ok(r.players.every((p) => p.decoyAt === 0));
});

test("elevated plants, cups and notebooks copy at their true size and height", () => {
  const r = room(),
    p = r.players[1];
  const spots = [
    { type: "tabletopPlant", x: -3.45, z: 1.7, y: 1.09 },
    { type: "notebook", x: -4, z: 0.3, y: 1.09 },
    { type: "cup", x: -10.4, z: -9.45, y: 1.345 },
  ];
  for (const spot of spots) {
    Object.assign(p, { ...spot, type: "cone", changeAt: 0 });
    const selected = nearestCopyProp(p);
    assert.equal(selected?.type, spot.type);
    assert.ok(selected.y > 1);
    assert.equal(act(r, p, "change", 6000).event?.kind, "poof");
    assert.equal(p.type, spot.type);
    assert.equal(p.y, spot.y);
    assert.ok(
      canStand(p.x, p.z, TYPES[p.type].radius, p.y, TYPES[p.type].height),
    );
  }
  assert.ok(
    PROPS.filter((p) => p.y > 0).every((p) =>
      ["tabletopPlant", "cup", "notebook"].includes(p.type),
    ),
  );
  assert.equal(
    nearestCopyProp({ x: -3.45, z: 1.15, y: 10, type: "cone" }),
    undefined,
  );
  assert.equal(TYPES.table, undefined);
});

test("small elevated disguises are hit at their height, not below the surface", () => {
  const target = {
    id: "small",
    x: 0,
    y: 1.345,
    z: 3,
    type: "cup",
    role: "prop",
    connected: true,
  };
  const hunter = { id: "hunter", x: 0, z: 7, role: "hunter" };
  assert.equal(
    traceShot([target], hunter, "glock", 0, 0.02).hits.get("small"),
    50,
  );
  assert.equal(traceShot([target], hunter, "glock", 0, 0.3).hits.size, 0);
  const p = { x: -3.7, z: 1.6, y: 1.09, role: "prop", type: "notebook" };
  for (let i = 0; i < 30; i++) movePlayer(p, { x: 0, z: 0 });
  assert.equal(p.y, 1.09, "small props stay on the tabletop");
});
