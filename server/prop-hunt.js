import { randomBytes, createHash, randomInt } from "node:crypto";
import {
  STEP,
  BLIND,
  blindThrow,
  inBlindRadius,
  MAX_PLAYERS,
  HIDE_SECONDS,
  HUNT_SECONDS,
  hunterCount,
  WEAPONS,
  shotgunUnlocked,
  traceShot,
  rescuePoint,
  TYPES,
  PROPS,
  JAIL,
  distance,
  canStand,
  nearestCopyProp,
  movePlayer,
  spawnPoint,
} from "../client/src/screens/prop-hunt/world.js";

import { TAUNTS } from "../client/src/screens/prop-hunt/taunts.js";

export function startRound(room, now = Date.now()) {
  const players = room.players.filter((p) => p.connected || p.bot);
  room.round++;
  room.phase = "hide";
  room.endsAt = now + HIDE_SECONDS * 1000;
  room.huntStartedAt = 0;
  room.positionHistory = [];
  room.blindGrenades = [];
  room.winner = null;
  room.shuffled = false;
  room.shuffleWarned = false;
  const count = room.practice ? 1 : hunterCount(players.length);
  const hunters = new Set(
    Array.from(
      { length: count },
      (_, i) => players[((room.round - 1) * count + i) % players.length].id,
    ),
  );
  const tauntOrder = TAUNTS.map((t) => t.id);
  for (let i = tauntOrder.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [tauntOrder[i], tauntOrder[j]] = [tauntOrder[j], tauntOrder[i]];
  }
  let tauntIndex = 0;
  let propIndex = 4,
    hunterIndex = 0;
  players.forEach((p, i) =>
    Object.assign(
      p,
      spawnPoint(hunters.has(p.id) ? hunterIndex++ : propIndex++),
      {
        role: hunters.has(p.id) ? "hunter" : "prop",
        tauntId: hunters.has(p.id)
          ? null
          : tauntOrder[tauntIndex++ % tauntOrder.length],
        health: 100,
        captures: 0,
        weapon: "glock",
        ammo: { glock: 12, shotgun: 5 },
        reloadAt: 0,
        type: Object.keys(TYPES)[i % 6],
        caught: false,
        vx: 0,
        vz: 0,
        y: 0,
        vy: 0,
        jumpHeld: false,
        yaw: 0,
        queue: [],
        input: { x: 0, z: 0 },
        ack: 0,
        shotAt: 0,
        scanAt: 0,
        changeAt: 0,
        tauntAt: now + 20000,
        decoyAt: 0,
        blinds: hunters.has(p.id) ? 0 : 1,
        blindUntil: 0,
        slowUntil: 0,
      },
    ),
  );
  room.message = `Find your spot. ${count} hunter${count === 1 ? "" : "s"} arrive in ${HIDE_SECONDS} seconds.`;
}
export function finishRound(room, winner, now = Date.now()) {
  room.phase = "results";
  room.dirty = true;
  room.winner = winner;
  room.endsAt = now;
  for (const p of room.players)
    if (p.role === winner && !p.caught) p.score += 100;
  room.message =
    winner === "hunter"
      ? "Nothing stays hidden forever."
      : "The furniture wins this one.";
}
export function act(room, p, request, now = Date.now()) {
  const action = typeof request === "string" ? request : request?.type;
  if (typeof action !== "string") return { error: "Invalid action." };
  if (!["hide", "hunt"].includes(room.phase) || !p.connected)
    return { error: "Round is not active." };
  if (p.caught) {
    if (action === "taunt" && now >= p.tauntAt) {
      p.tauntAt = now + 5000;
      return {
        event: {
          kind: "help",
          x: JAIL.x,
          z: JAIL.z,
          name: p.name,
          tauntId: p.tauntId,
        },
      };
    }
    return { error: "Call for a rescue while you are captured." };
  }
  if (p.role === "hunter") {
    if (room.phase !== "hunt") return { error: "Give the props a head start." };
    if (p.reloadAt && now >= p.reloadAt) {
      p.ammo[p.weapon] = WEAPONS[p.weapon].magazine;
      p.reloadAt = 0;
    }
    if (action === "equip") {
      const weapon = request.weapon;
      if (typeof weapon !== "string" || !Object.hasOwn(WEAPONS, weapon))
        return { error: "Unknown weapon." };
      if (weapon === "shotgun" && !shotgunUnlocked(room, p, now))
        return {
          error: "Shotgun unlocks after 2 captures or 45 seconds of hunting.",
        };
      if (p.reloadAt > now) return { error: "Finish reloading first." };
      p.weapon = weapon;
      p.shotAt = Math.max(p.shotAt, now + 250);
      return {};
    }
    if (action === "reload") {
      if (p.reloadAt > now || p.ammo[p.weapon] >= WEAPONS[p.weapon].magazine)
        return {};
      p.reloadAt = now + WEAPONS[p.weapon].reload;
      return {
        event: {
          kind: "reload",
          owner: p.id,
          weapon: p.weapon,
          x: p.x,
          y: p.y || 0,
          z: p.z,
        },
      };
    }
    if (action === "shoot") {
      if (
        !Number.isFinite(request.yaw) ||
        !Number.isFinite(request.pitch) ||
        Math.abs(request.pitch) > 1.3
      )
        return { error: "Invalid aim." };
      if (now < p.shotAt || p.reloadAt > now) return {};
      const config = WEAPONS[p.weapon];
      if (p.ammo[p.weapon] <= 0)
        return { error: "Magazine empty. Press R to reload." };
      p.ammo[p.weapon]--;
      p.shotAt = now + config.cooldown;
      // Rewind remote targets by at most 200 ms to match the shooter's interpolated view.
      const shotTime = Number.isFinite(request.shotTime)
        ? Math.max(now - 200, Math.min(now, request.shotTime))
        : now;
      const history = (room.positionHistory || [])
        .filter((frame) => frame.at >= now - 200)
        .sort(
          (a, b) => Math.abs(a.at - shotTime) - Math.abs(b.at - shotTime),
        )[0];
      const targets = room.players.map((target) => {
        const past = history?.positions.get(target.id);
        return past && target.id !== p.id && distance(target, past) < 2.5
          ? { ...target, ...past }
          : target;
      });
      const { origin, rays, hits } = traceShot(
        targets,
        p,
        p.weapon,
        request.yaw,
        request.pitch,
      );
      const impacts = [];
      for (const [id, damage] of hits) {
        const target = room.players.find((t) => t.id === id);
        target.health = Math.max(0, target.health - damage);
        if (target.health === 0) {
          target.caught = true;
          target.vx = target.vz = target.vy = target.y = 0;
          target.tauntAt = now;
          p.score += 25;
          p.captures++;
          room.message = `${p.name} caught ${target.name}!`;
        }
        impacts.push({
          id,
          x: target.x,
          y: target.y || 0,
          z: target.z,
          caught: target.caught,
        });
      }
      if (
        room.players
          .filter((t) => t.role === "prop" && (t.connected || t.bot))
          .every((t) => t.caught)
      )
        finishRound(room, "hunter", now);
      return {
        event: {
          kind: "shot",
          owner: p.id,
          weapon: p.weapon,
          x: p.x,
          y: p.y || 0,
          z: p.z,
          origin,
          rays,
          impacts,
        },
      };
    }
    if (action === "scan" && now >= p.scanAt) {
      p.scanAt = now + 12000;
      const targets = room.players.filter(
        (t) =>
          t.role === "prop" &&
          !t.caught &&
          (t.connected || t.bot) &&
          distance(p, t) < 7,
      );
      return {
        private: true,
        event: {
          kind: "scan",
          x: p.x,
          y: p.y || 0,
          z: p.z,
          hot: targets.length > 0,
          owner: p.id,
        },
      };
    }
  } else {
    if (action === "blind") {
      if (room.phase !== "hunt") return { error: "Blind grenades unlock when the hunt starts." };
      if (p.blinds !== 1) return { error: "You already used your blind this round." };
      if (!Number.isFinite(request.yaw) || !Number.isFinite(request.pitch) || Math.abs(request.pitch) > 1.3)
        return { error: "Invalid aim." };
      const path = blindThrow(p, request.yaw, request.pitch);
      const end = path[path.length - 1];
      p.blinds = 0;
      room.blindGrenades.push({ ...end, at: now + end.t * 1000 });
      return { event: { kind: "blindThrow", path, owner: p.id } };
    }
    if (action === "change" && now >= p.changeAt) {
      const prop = nearestCopyProp(p);
      if (!prop) return { error: "Get closer to an object to copy it." };
      if (
        !canStand(
          p.x,
          p.z,
          TYPES[prop.type].radius,
          p.y || 0,
          TYPES[prop.type].height,
        )
      )
        return { error: "Move into a little more space first." };
      p.type = prop.type;
      p.yaw = prop.yaw;
      p.changeAt = now + 2500;
      return { event: { kind: "poof", x: p.x, y: p.y || 0, z: p.z } };
    }
    if (action === "decoy") {
      if (room.phase !== "hunt")
        return { error: "Decoys unlock when the hunt starts." };
      if (now < p.decoyAt) return { error: "Your decoy is recharging." };
      const spots = PROPS.filter(
        (t) => distance(p, t) >= 5 && distance(p, t) <= 12,
      );
      if (!spots.length)
        return { error: "Move closer to some furniture to throw a decoy." };
      const spot = spots[randomInt(spots.length)];
      p.decoyAt = now + 25000;
      // Identical to a real taunt: no owner or decoy marker leaks to hunters.
      return {
        event: {
          kind: "taunt",
          x: spot.x,
          y: spot.y || 0,
          z: spot.z,
          name: "Somewhere nearby…",
          tauntId: p.tauntId,
        },
      };
    }
    if (action === "taunt" && now >= p.tauntAt - 16000) {
      p.tauntAt = now + 20000;
      p.score += 2;
      return {
        event: {
          kind: "taunt",
          x: p.x,
          y: p.y || 0,
          z: p.z,
          name: "Somewhere nearby…",
          tauntId: p.tauntId,
        },
      };
    }
    if (
      action === "rescue" &&
      room.phase === "hunt" &&
      distance(p, JAIL) < 2.3
    ) {
      const trapped = room.players.filter((t) => t.caught && t.connected);
      if (!trapped.length) return { error: "Nobody needs rescuing." };
      trapped.forEach((t, i) =>
        Object.assign(t, {
          caught: false,
          ...rescuePoint(i),
          health: 100,
          vx: 0,
          vz: 0,
          y: 0,
          vy: 0,
          jumpHeld: false,
          tauntAt: now + 20000,
        }),
      );
      p.score += 25;
      room.message = `${p.name} freed the captured props!`;
      return { event: { kind: "rescue", ...JAIL } };
    }
  }
  return {};
}

export function detonateBlinds(room, now = Date.now()) {
  const blasts = [];
  room.blindGrenades = (room.blindGrenades || []).filter((grenade) => {
    if (room.phase !== "hunt") return false;
    if (now < grenade.at) return true;
    for (const hunter of room.players) {
      if (hunter.role === "hunter" && hunter.connected && !hunter.caught && inBlindRadius(grenade, hunter))
        hunter.blindUntil = now + BLIND.duration;
    }
    blasts.push({ kind: "blindBurst", x: grenade.x, y: grenade.y, z: grenade.z });
    room.dirty = true;
    return false;
  });
  return blasts;
}

export function setupPropHunt(io) {
  const ns = io.of("/prop-hunt"),
    rooms = new Map(),
    sessions = new Map(),
    memberships = new Map();
  const snapshot = (room) => ({
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    endsAt: room.endsAt,
    serverTime: Date.now(),
    practice: room.practice,
    huntStartedAt: room.huntStartedAt,
    maxPlayers: MAX_PLAYERS,
    winner: room.winner,
    message: room.message,
    players: room.players.map(({ queue, input, socketId, ...p }) => p),
  });
  const broadcast = (room) => {
    room.dirty = false;
    ns.to(room.code).emit("state", snapshot(room));
  };
  const motion = (room) =>
    ns.to(room.code).volatile.emit("motion", {
      code: room.code,
      round: room.round,
      serverTime: Date.now(),
      players: room.players.map((p) => [
        p.id,
        ...[p.x, p.z, p.vx || 0, p.vz || 0, p.yaw || 0].map(
          (n) => Math.round(n * 1000) / 1000,
        ),
        p.ack || 0,
        Math.round((p.y || 0) * 1000) / 1000,
        Math.round((p.vy || 0) * 1000) / 1000,
        !!p.jumpHeld,
      ]),
    });
  const event = (room, data) =>
    ns.to(room.code).emit("effect", { ...data, at: Date.now() });
  const find = (id) => rooms.get(memberships.get(id));
  function leave(id) {
    const r = find(id);
    if (!r) return;
    const player = r.players.find((p) => p.id === id);
    memberships.delete(id);
    ns.sockets.get(player.socketId)?.leave(r.code);
    r.players = r.players.filter((p) => p.id !== id);
    const humans = r.players.filter((p) => !p.bot);
    if (!humans.length) {
      rooms.delete(r.code);
      return;
    }
    if (r.hostId === id)
      r.hostId = humans.find((p) => p.connected)?.id || humans[0].id;
    if (["hunt", "hide"].includes(r.phase)) {
      if (!r.players.some((p) => p.role === "hunter")) finishRound(r, "prop");
      else if (
        r.players
          .filter((p) => p.role === "prop" && (p.connected || p.bot))
          .every((p) => p.caught)
      )
        finishRound(r, "hunter");
    }
    broadcast(r);
  }
  ns.use((socket, next) => {
    const id = socket.handshake.auth?.token;
    if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id))
      return next(new Error("Invalid session."));
    next();
  });
  ns.on("connection", (socket) => {
    const id = createHash("sha256")
      .update(socket.handshake.auth.token)
      .digest("hex");
    socket.emit("identity", id);
    const old = sessions.get(id);
    if (old) ns.sockets.get(old)?.disconnect(true);
    sessions.set(id, socket.id);
    const resumed = find(id);
    if (resumed) {
      const p = resumed.players.find((p) => p.id === id);
      p.connected = true;
      p.socketId = socket.id;
      p.queue = [];
      p.input = { x: 0, z: 0 };
      socket.join(resumed.code);
      broadcast(resumed);
    }
    const reply = (cb, data) => {
      if (typeof cb === "function") cb(data);
    };
    let requests = [];
    const limited = () => {
      const now = Date.now();
      requests = requests.filter((t) => now - t < 1000);
      requests.push(now);
      return requests.length > 15;
    };
    socket.on("enter", (data, cb) => {
      if (limited()) return reply(cb, { error: "Please wait a moment." });
      const name =
        typeof data?.name === "string" ? data.name.trim().slice(0, 20) : "";
      if (!name) return reply(cb, { error: "Enter your name first." });
      if (data.code != null && typeof data.code !== "string")
        return reply(cb, { error: "Enter a valid room code." });
      let room;
      if (data.code) {
        room = rooms.get(String(data.code).toUpperCase());
        if (!room)
          return reply(cb, { error: "Room not found. Check the code." });
        if (room.players.some((p) => p.id === id)) {
          reply(cb, { ok: true });
          broadcast(room);
          return;
        }
        if (room.practice)
          return reply(cb, {
            error:
              "This is a solo practice room. Create a party to play together.",
          });
        if (room.phase !== "lobby" && room.phase !== "results")
          return reply(cb, {
            error: "This round is in progress. Join after it finishes.",
          });
        if (room.players.length >= MAX_PLAYERS)
          return reply(cb, { error: "This room is full." });
      }
      leave(id);
      if (!room) {
        let code;
        do {
          code = randomBytes(3).toString("hex").toUpperCase();
        } while (rooms.has(code));
        room = {
          code,
          hostId: id,
          phase: "lobby",
          round: 0,
          players: [],
          endsAt: 0,
          practice: data.practice === true,
          message: "",
          createdAt: Date.now(),
        };
        rooms.set(code, room);
      }
      room.players.push({
        id,
        name,
        socketId: socket.id,
        connected: true,
        score: 0,
        ...spawnPoint(),
        type: "plant",
        role: "prop",
        caught: false,
        queue: [],
        input: { x: 0, z: 0 },
        ack: 0,
      });
      memberships.set(id, room.code);
      socket.join(room.code);
      reply(cb, { ok: true });
      broadcast(room);
    });
    socket.on("start", (_, cb) => {
      if (limited()) return reply(cb, { error: "Please wait a moment." });
      const r = find(id);
      if (!r || r.hostId !== id)
        return reply(cb, { error: "Only the host can start." });
      if (!["lobby", "results"].includes(r.phase))
        return reply(cb, { error: "The round has already started." });
      if (r.practice && r.players.length === 1) {
        for (let i = 0; i < 3; i++)
          r.players.push({
            id: `bot-${i}`,
            name: ["Sneaky Fern", "Chair Jordan", "Bin Diesel"][i],
            bot: true,
            connected: true,
            score: 0,
          });
      }
      if (r.players.filter((p) => p.connected).length < 2)
        return reply(cb, {
          error: "Invite one more player, or try solo practice.",
        });
      startRound(r);
      reply(cb, { ok: true });
      broadcast(r);
    });
    socket.on("input", (data) => {
      const r = find(id),
        p = r?.players.find((p) => p.id === id);
      if (!p || !["hide", "hunt"].includes(r.phase) || p.caught) return;
      if (
        !data ||
        !Number.isSafeInteger(data.seq) ||
        data.seq <= p.ack ||
        data.seq > p.ack + 180 ||
        !Number.isFinite(data.x) ||
        !Number.isFinite(data.z) ||
        !Number.isFinite(data.yaw)
      )
        return;
      if (p.queue.length >= 8 || p.queue.some((i) => i.seq === data.seq))
        return;
      p.queue.push({
        seq: data.seq,
        x: Math.max(-1, Math.min(1, data.x)),
        z: Math.max(-1, Math.min(1, data.z)),
        yaw: data.yaw % (Math.PI * 2),
        jump: data.jump === true,
      });
      p.lastInputAt = Date.now();
    });
    socket.on("action", (action, cb) => {
      if (limited()) return reply(cb, {});
      const r = find(id),
        p = r?.players.find((p) => p.id === id);
      if (!p) return reply(cb, { error: "Join a room first." });
      const result = act(r, p, action);
      if (result.event) {
        if (result.private)
          socket.emit("effect", { ...result.event, at: Date.now() });
        else event(r, result.event);
      }
      reply(cb, { error: result.error });
      r.dirty = true;
    });
    socket.on("leave", (_, cb) => {
      leave(id);
      reply(cb, { ok: true });
    });
    socket.on("disconnect", () => {
      if (sessions.get(id) !== socket.id) return;
      sessions.delete(id);
      const r = find(id),
        p = r?.players.find((p) => p.id === id);
      if (!p) return;
      p.connected = false;
      p.disconnectedAt = Date.now();
      p.queue = [];
      p.input = { x: 0, z: 0 };
      broadcast(r);
    });
  });
  let ticks = 0;
  const timer = setInterval(() => {
    const now = Date.now();
    ticks++;
    for (const r of rooms.values()) {
      for (const p of [...r.players])
        if (!p.bot && !p.connected && now - p.disconnectedAt > 15000)
          leave(p.id);
      if (!rooms.has(r.code)) continue;
      if (!r.players.some((p) => p.connected && !p.bot)) {
        if (now - r.createdAt > 300000) rooms.delete(r.code);
        continue;
      }
      if (["hide", "hunt"].includes(r.phase)) {
        if (now >= r.endsAt) {
          if (r.phase === "hide") {
            r.phase = "hunt";
            r.huntStartedAt = now;
            r.endsAt = now + HUNT_SECONDS * 1000;
            r.dirty = true;
            r.message = "The hunt is on. Trust nothing.";
            event(r, { kind: "hunt" });
          } else finishRound(r, "prop", now);
        }
        if (
          r.phase === "hunt" &&
          !r.shuffleWarned &&
          r.endsAt - now < HUNT_SECONDS * 500 + 5000
        ) {
          r.shuffleWarned = true;
          r.dirty = true;
          r.message = "Shuffle in 5 seconds. Get ready to change disguise!";
          event(r, { kind: "warning" });
        }
        if (
          r.phase === "hunt" &&
          !r.shuffled &&
          r.endsAt - now < HUNT_SECONDS * 500
        ) {
          r.shuffled = true;
          r.dirty = true;
          r.message = "Shuffle! Every prop gets a new disguise.";
          for (const p of r.players.filter(
            (p) => p.role === "prop" && !p.caught,
          )) {
            const types = Object.keys(TYPES).filter(
              (t) =>
                t !== p.type &&
                canStand(p.x, p.z, TYPES[t].radius, p.y || 0, TYPES[t].height),
            );
            if (types.length)
              p.type = types[Math.floor(Math.random() * types.length)];
          }
          event(r, { kind: "shuffle" });
        }
        for (const p of r.players) {
          if (!p.connected || p.caught) continue;
          if (p.reloadAt && now >= p.reloadAt) {
            p.ammo[p.weapon] = WEAPONS[p.weapon].magazine;
            p.reloadAt = 0;
            r.dirty = true;
          }
          if (p.role === "hunter" && r.phase === "hide") {
            p.queue = [];
            continue;
          }
          if (p.bot) {
            const hunter = r.players.find((t) => t.role === "hunter");
            const flee = r.phase === "hunt" && distance(p, hunter) < 5;
            const angle = flee
              ? Math.atan2(p.x - hunter.x, p.z - hunter.z)
              : now / 4000 + Number(p.id.slice(-1)) * 2;
            movePlayer(
              p,
              {
                x: flee ? Math.sin(angle) : 0,
                z: flee ? Math.cos(angle) : 0,
                yaw: p.yaw,
              },
              STEP,
            );
          } else {
            const next = p.queue.shift();
            if (next) {
              p.input = next;
              p.ack = next.seq;
            }
            if (now - p.lastInputAt > 150) p.input = { x: 0, z: 0, yaw: p.yaw };
            movePlayer(p, p.input, STEP, now < p.slowUntil);
          }
          if (p.role === "prop" && r.phase === "hunt" && now >= p.tauntAt) {
            p.tauntAt = now + 20000;
            event(r, {
              kind: "taunt",
              x: p.x,
              y: p.y || 0,
              z: p.z,
              tauntId: p.tauntId,
            });
          }
        }
      }
      if (["hide", "hunt"].includes(r.phase)) {
        r.positionHistory.push({
          at: now,
          positions: new Map(
            r.players.map((p) => [
              p.id,
              { x: p.x, y: p.y || 0, z: p.z, type: p.type },
            ]),
          ),
        });
        while (r.positionHistory.length > 8) r.positionHistory.shift();
        if (ticks % 2 === 0) motion(r);
      }
      const blasts = detonateBlinds(r, now);
      for (const blast of blasts) event(r, blast);
      if (blasts.length) broadcast(r);
      if (ticks % 30 === 0 || (r.dirty && ticks % 6 === 0)) broadcast(r);
    }
  }, STEP * 1000);
  timer.unref();
  return { rooms, close: () => clearInterval(timer) };
}
