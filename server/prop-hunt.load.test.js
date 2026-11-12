import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as connectClient } from "../client/node_modules/socket.io-client/build/esm/index.js";
import { randomUUID } from "node:crypto";
import { setupPropHunt } from "./prop-hunt.js";
import {
  canStand,
  spawnPoint,
  radius,
} from "../client/src/screens/prop-hunt/world.js";

test("all 30 spawns can reach the courtyard through the expanded map", () => {
  const queue = [[0, 7]],
    seen = new Set(["0,7"]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [
      [0.5, 0],
      [-0.5, 0],
      [0, 0.5],
      [0, -0.5],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        key = `${nx},${nz}`;
      if (!seen.has(key) && canStand(nx, nz, 0.46)) {
        seen.add(key);
        queue.push([nx, nz]);
      }
    }
  }
  for (let i = 0; i < 34; i++) {
    const p = spawnPoint(i);
    assert.ok(
      seen.has(`${Math.round(p.x * 2) / 2},${Math.round(p.z * 2) / 2}`),
      `spawn ${i} is connected`,
    );
  }
  for (const [x, z] of [
    [-18, 0],
    [18, 0],
    [0, -20],
    [0, 20],
  ])
    assert.ok(seen.has(`${x},${z}`));
});

test(
  "30 simultaneous online clients: capacity, movement, bandwidth and hunter departures",
  { timeout: 20000 },
  async (t) => {
    const http = createServer(),
      io = new Server(http),
      game = setupPropHunt(io),
      sockets = [];
    await new Promise((resolve) => http.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${http.address().port}/prop-hunt`;
    let inputTimer;
    t.after(async () => {
      clearInterval(inputTimer);
      sockets.forEach((s) => s.disconnect());
      game.close();
      await new Promise((resolve) => io.close(resolve));
    });
    const emit = (s, event, data) =>
      new Promise((resolve, reject) =>
        s
          .timeout(2000)
          .emit(event, data, (err, res) => (err ? reject(err) : resolve(res))),
      );
    for (let i = 0; i < 31; i++) {
      const s = connectClient(url, {
        auth: { token: randomUUID() },
        transports: ["websocket"],
        forceNew: true,
      });
      sockets.push(s);
      await new Promise((resolve, reject) => {
        s.once("connect", resolve);
        s.once("connect_error", reject);
      });
      if (i === 0) await emit(s, "enter", { name: "Player 1" });
      else {
        const response = await emit(s, "enter", {
          name: `Player ${i + 1}`,
          code: [...game.rooms.values()][0].code,
        });
        if (i < 30) assert.equal(response.ok, true);
        else assert.equal(response.error, "This room is full.");
      }
    }
    const r = [...game.rooms.values()][0];
    assert.equal(r.players.length, 30);
    await emit(sockets[0], "start", null);
    r.endsAt = Date.now() - 1;
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(r.phase, "hunt");
    let bytes = 0,
      packets = 0,
      sequence = 0;
    const sent = new Map(),
      latencies = [];
    sockets[0].on("state", (s) => {
      bytes += Buffer.byteLength(JSON.stringify(s));
    });
    sockets[0].on("motion", (s) => {
      bytes += Buffer.byteLength(JSON.stringify(s));
      packets++;
      const ack = s.players[0][6];
      if (sent.has(ack)) {
        latencies.push(performance.now() - sent.get(ack));
        for (const key of sent.keys()) if (key <= ack) sent.delete(key);
      }
    });
    const started = performance.now();
    inputTimer = setInterval(() => {
      sequence++;
      sent.set(sequence, performance.now());
      for (let i = 0; i < 30; i++)
        sockets[i].emit("input", {
          seq: sequence,
          x: Math.sin(sequence / 40 + i),
          z: Math.cos(sequence / 40 + i),
          yaw: 0,
        });
    }, 1000 / 30);
    await new Promise((resolve) => setTimeout(resolve, 8000));
    clearInterval(inputTimer);
    const seconds = (performance.now() - started) / 1000;
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)],
      kbps = bytes / seconds / 1024;
    assert.ok(
      r.players.every((p) => p.ack > 180),
      "every client moves throughout the load test",
    );
    assert.ok(r.players.every((p) => canStand(p.x, p.z, radius(p))));
    assert.ok(
      packets / seconds > 12,
      "movement snapshots sustain at least 12 Hz",
    );
    assert.ok(p95 < 350, `local input acknowledgement p95 ${p95}ms`);
    assert.ok(kbps < 100, `per-client payload ${kbps} KB/s`);
    await emit(sockets[0], "leave", null);
    assert.equal(r.phase, "hunt");
    for (let i = 1; i < 4; i++) await emit(sockets[i], "leave", null);
    assert.equal(r.phase, "results");
    assert.equal(r.winner, "prop");
    t.diagnostic(
      `30 clients, ${sequence * 30} inputs, ${(packets / seconds).toFixed(1)} snapshots/s, ${p95.toFixed(1)}ms p95 acknowledgement, ${kbps.toFixed(1)} KB/s payload per client`,
    );
  },
);
