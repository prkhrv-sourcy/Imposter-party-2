import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as THREE from "three";
import { createScene } from "./scene";
import {
  STEP,
  TYPES,
  nearestCopyProp,
  JAIL,
  distance,
  movePlayer,
  WEAPONS,
  MAX_PLAYERS,
  HIDE_SECONDS,
  hunterCount,
  shotgunUnlocked,
  jailPoint,
  traceShot,
} from "./world";
import { sound, prepareAudio } from "./audio";
import { tauntName } from "./taunts";
import Minimap from "./Minimap.jsx";
import { minimapPlayers } from "./minimap.js";
import "./prop-hunt.css";

function sessionToken() {
  let t = sessionStorage.getItem("prop-party-token");
  if (!t) {
    t = crypto.randomUUID();
    sessionStorage.setItem("prop-party-token", t);
  }
  return t;
}
function World({
  stateRef,
  token,
  socketRef,
  apiRef,
  onHud,
  onError,
  mutedRef,
  low,
}) {
  const mount = useRef(null);
  useEffect(() => {
    let world;
    try {
      world = createScene(mount.current, { low });
    } catch (e) {
      onError(
        "This device could not start 3D graphics. Try a browser with WebGL enabled.",
      );
      return;
    }
    const { camera, renderer, scene } = world,
      canvas = renderer.domElement;
    let disposed = false,
      frame,
      last = performance.now(),
      acc = 0,
      seq = 0,
      pending = [],
      local = null,
      epoch = "",
      active = false,
      activation = 0,
      yaw = 0,
      pitch = 0.1,
      drag = null,
      jumpQueued = false,
      joy = { x: 0, z: 0 },
      audio = null,
      hudAt = 0,
      nextShotAt = 0,
      hitUntil = 0,
      hitCaught = false;
    const feedback = [];
    const queueFeedback = (e) => {
      if (feedback.length >= 128) feedback.shift();
      feedback.push({ event: e, received: performance.now() });
    };
    const keys = new Set(),
      renderPos = new THREE.Vector3(),
      look = new THREE.Vector3(),
      desired = new THREE.Vector3();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    function action(type) {
      if (!active || !socketRef.current?.connected) return;
      if (type === "jump") {
        if (
          local &&
          !local.caught &&
          !(local.role === "hunter" && stateRef.current?.phase === "hide")
        )
          jumpQueued = true;
        return;
      }
      let request = type;
      if (type === "blind") request = { type, yaw, pitch };
      if (type === "shoot") {
        if (!mutedRef.current && audio?.state !== "running") {
          unlock();
          return;
        }
        const s = stateRef.current,
          weapon = local?.weapon || "glock",
          config = WEAPONS[weapon];
        if (
          s?.phase !== "hunt" ||
          local?.role !== "hunter" ||
          s.serverTime < local.reloadAt ||
          performance.now() < nextShotAt
        )
          return;
        if (!local.ammo?.[weapon]) {
          onError("Magazine empty. Press R to reload.");
          return;
        }
        if (!mutedRef.current && !sound(audio, "shot", 0, weapon)) {
          unlock();
          return;
        }
        nextShotAt = performance.now() + config.cooldown;
        request = { type, yaw, pitch, shotTime: s.serverTime - 70 };
        local.ammo = { ...local.ammo, [weapon]: local.ammo[weapon] - 1 };
        const targets = s.players.map((p) => {
          const visible = world.players.get(p.id)?.group.position;
          return visible
            ? { ...p, x: visible.x, y: visible.y, z: visible.z }
            : p;
        });
        const { origin, rays } = traceShot(
          targets,
          { ...local, x: renderPos.x, y: renderPos.y, z: renderPos.z },
          weapon,
          yaw,
          pitch,
        );
        queueFeedback({
          kind: "shot",
          predicted: true,
          owner: token,
          weapon,
          origin,
          rays,
          impacts: [],
        });
      } else if (type === "glock" || type === "shotgun") {
        nextShotAt = Math.max(nextShotAt, performance.now() + 250);
        request = { type: "equip", weapon: type };
      }
      socketRef.current.emit("action", request, (res) => {
        if (res?.error) onError(res.error);
      });
    }
    function unlock() {
      activation++;
      active = false;
      keys.clear();
      feedback.length = 0;
      jumpQueued = false;
      joy = { x: 0, z: 0 };
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    }
    async function activate() {
      const attempt = ++activation;
      try {
        audio ||= new (window.AudioContext || window.webkitAudioContext)({
          latencyHint: "interactive",
        });
        const ready = audio.resume();
        prepareAudio(audio);
        audio.onstatechange = () => {
          if (!disposed && active && audio.state !== "running") unlock();
        };
        if (!window.matchMedia("(pointer: coarse)").matches)
          canvas.requestPointerLock?.()?.catch(() => {});
        await ready;
        if (!disposed && attempt === activation && audio.state === "running")
          active = true;
      } catch {
        if (!disposed)
          onError("Audio could not start. Tap to enter the game again.");
      }
    }
    apiRef.current = {
      activate,
      pause: unlock,
      action,
      move: (x, z) => {
        joy = { x, z };
      },
      look: (dx, dy) => {
        yaw -= dx * 0.004;
        pitch = Math.max(-1, Math.min(1.1, pitch + dy * 0.003));
      },
      snapshot(s) {
        const p = s.players.find((p) => p.id === token);
        if (!p) return;
        const nextEpoch = `${s.code}-${s.round}`;
        if (nextEpoch !== epoch) {
          epoch = nextEpoch;
          local = { ...p };
          seq = p.ack || 0;
          pending = [];
          yaw = p.role === "hunter" ? p.yaw || 0 : Math.atan2(p.x, p.z);
          pitch = 0.1;
          renderPos.set(p.x, p.y || 0, p.z);
        } else {
          const teleported = local?.caught !== p.caught;
          pending = pending.filter((i) => i.seq > p.ack);
          local = { ...p };
          for (const input of pending)
            if (!p.caught && !(s.phase === "hide" && p.role === "hunter"))
              movePlayer(local, input, STEP, s.serverTime < p.slowUntil);
          if (teleported) {
            pending = [];
            const jail = jailPoint(s.players.indexOf(p));
            renderPos.set(p.caught ? jail.x : p.x, 0, p.caught ? jail.z : p.z);
          }
        }
        if (!["hide", "hunt"].includes(s.phase)) unlock();
      },
      effect: queueFeedback,
    };
    function presentEffect(e) {
      const own = e.owner === token;
      const confirmation = e.kind === "shot" && own && !e.predicted;
      if (e.kind === "shot" && e.predicted)
        world.effect({ kind: "fire", weapon: e.weapon });
      world.effect(confirmation ? { ...e, rays: [] } : e);
      if (confirmation && e.impacts.length) {
        hitUntil = performance.now() + 260;
        hitCaught = e.impacts.some((h) => h.caught);
        if (!mutedRef.current) sound(audio, hitCaught ? "catch" : "hit");
      }
      if (!mutedRef.current && !confirmation && !e.predicted) {
        let pan = 0,
          volume = 1;
        if (local && Number.isFinite(e.x)) {
          const d = distance(local, e);
          pan = Math.max(
            -1,
            Math.min(
              1,
              ((e.x - local.x) * Math.cos(yaw) -
                (e.z - local.z) * Math.sin(yaw)) /
                10,
            ),
          );
          volume = 1 / (1 + (d / 12) ** 2);
        }
        sound(audio, e.kind, pan, e.weapon, volume, e.tauntId);
      }
      if (e.kind === "scan")
        onError(
          e.hot
            ? "Scanner: a prop is within 7 metres."
            : "Scanner: this area is clear.",
        );
    }
    const down = (e) => {
      if (e.target.closest("input,textarea,select")) return;
      if (e.code === "Escape") {
        unlock();
        return;
      }
      if (!active) return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Space",
        ].includes(e.code)
      )
        e.preventDefault();
      keys.add(e.code);
      if (e.repeat) return;
      const p = local;
      if (e.code === "KeyF" && p?.role === "prop") action("decoy");
      if (e.code === "KeyG" && p?.role === "prop") action("blind");
      if (e.code === "Space") action("jump");
      if (e.code === "KeyE") action(p?.role === "hunter" ? "shoot" : "change");
      if (e.code === "KeyQ") action(p?.role === "hunter" ? "scan" : "taunt");
      if (e.code === "KeyR") action(p?.role === "hunter" ? "reload" : "rescue");
      if (p?.role === "hunter" && e.code === "Digit1") action("glock");
      if (p?.role === "hunter" && e.code === "Digit2") action("shotgun");
    };
    const up = (e) => keys.delete(e.code);
    const lock = () => {
      if (
        !document.pointerLockElement &&
        !window.matchMedia("(pointer:coarse)").matches
      ) {
        active = false;
        keys.clear();
      }
    };
    const pointerDown = (e) => {
      if (!active) return;
      if (
        e.button === 0 &&
        e.pointerType !== "touch" &&
        local?.role === "hunter"
      )
        action("shoot");
      if (document.pointerLockElement !== canvas) {
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
        canvas.setPointerCapture(e.pointerId);
      }
    };
    const pointerMove = (e) => {
      if (!active) return;
      let dx = 0,
        dy = 0;
      if (document.pointerLockElement === canvas) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (drag?.id === e.pointerId) {
        dx = e.clientX - drag.x;
        dy = e.clientY - drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
        drag.x = e.clientX;
        drag.y = e.clientY;
      }
      yaw -= dx * 0.0025;
      pitch = Math.max(-1, Math.min(1.1, pitch + dy * 0.0025));
    };
    const pointerUp = () => {
      drag = null;
    };
    const hidden = () => {
      if (document.hidden) unlock();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", unlock);
    document.addEventListener("visibilitychange", hidden);
    document.addEventListener("pointerlockchange", lock);
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    const lost = (e) => {
      e.preventDefault();
      unlock();
      onError("Graphics were interrupted. Reload to restore the scene.");
    };
    canvas.addEventListener("webglcontextlost", lost);
    function tick(now) {
      if (disposed) return;
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      acc += dt;
      const s = stateRef.current,
        p = s?.players.find((p) => p.id === token),
        playing = s && ["hide", "hunt"].includes(s.phase);
      if (p && !local) apiRef.current.snapshot(s);
      while (acc >= STEP) {
        acc -= STEP;
        if (
          socketRef.current?.connected &&
          local &&
          playing &&
          !local.caught &&
          !(local.role === "hunter" && s.phase === "hide")
        ) {
          let side = active
            ? Number(keys.has("KeyD") || keys.has("ArrowRight")) -
              Number(keys.has("KeyA") || keys.has("ArrowLeft")) +
              joy.x
            : 0;
          let forward = active
            ? Number(keys.has("KeyW") || keys.has("ArrowUp")) -
              Number(keys.has("KeyS") || keys.has("ArrowDown")) -
              joy.z
            : 0;
          const input = {
            x: side * Math.cos(yaw) - forward * Math.sin(yaw),
            z: -side * Math.sin(yaw) - forward * Math.cos(yaw),
            yaw: local.role === "hunter" ? yaw : local.yaw,
            seq: ++seq,
            jump: jumpQueued,
          };
          jumpQueued = false;
          if (socketRef.current?.connected) {
            socketRef.current.emit("input", input);
            pending.push(input);
            if (pending.length > 90) pending.shift();
            movePlayer(local, input, STEP, s.serverTime < local.slowUntil);
          }
        }
      }
      if (playing && local) {
        const jail = jailPoint(s.players.findIndex((p) => p.id === token));
        const targetX = local.caught ? jail.x : local.x,
          targetZ = local.caught ? jail.z : local.z;
        renderPos.lerp(
          new THREE.Vector3(targetX, local.caught ? 0 : local.y || 0, targetZ),
          1 - Math.exp(-24 * dt),
        );
        if (local.role === "hunter" && !local.caught) {
          const moving = Math.hypot(local.vx || 0, local.vz || 0) > 1;
          camera.position.set(
            renderPos.x,
            renderPos.y +
              1.65 +
              (moving && !reduced ? Math.sin(now * 0.013) * 0.025 : 0),
            renderPos.z,
          );
          camera.rotation.order = "YXZ";
          camera.rotation.set(-pitch, yaw, 0);
        } else {
          look.set(renderPos.x, renderPos.y + 0.65, renderPos.z);
          const angle = 0.28 + pitch * 0.5,
            range = 3.6;
          desired.set(
            look.x + Math.sin(yaw) * Math.cos(angle) * range,
            look.y + Math.sin(angle) * range + 1,
            look.z + Math.cos(yaw) * Math.cos(angle) * range,
          );
          camera.position.copy(world.cameraPosition(look, desired));
          camera.lookAt(look.x, look.y + 0.15, look.z);
        }
      } else {
        const t = reduced ? 0.35 : now * 0.000025;
        camera.position.set(Math.sin(t) * 43, 34, Math.cos(t) * 43);
        camera.lookAt(0, 0.5, -2);
      }
      const ids = new Set();
      for (const other of s?.players || []) {
        if (!playing) continue;
        ids.add(other.id);
        const entry = world.playerMesh(other),
          g = entry.group;
        g.visible =
          other.connected && !(other.id === token && other.role === "hunter");
        const mine = other.id === token;
        const x = other.caught
          ? jailPoint(s.players.indexOf(other)).x
          : mine
            ? renderPos.x
            : other.x;
        const z = other.caught
          ? jailPoint(s.players.indexOf(other)).z
          : mine
            ? renderPos.z
            : other.z;
        g.position.x +=
          (x - g.position.x) * (mine ? 1 : 1 - Math.exp(-14 * dt));
        g.position.z +=
          (z - g.position.z) * (mine ? 1 : 1 - Math.exp(-14 * dt));
        const y = other.caught ? 0 : mine ? renderPos.y : other.y || 0;
        g.position.y +=
          (y - g.position.y) * (mine ? 1 : 1 - Math.exp(-18 * dt));
        g.rotation.y = other.yaw || 0;
      }
      for (const [id, entry] of world.players)
        if (!ids.has(id)) {
          scene.remove(entry.group);
          world.players.delete(id);
        }
      world.gadget.visible = !!(
        playing &&
        local?.role === "hunter" &&
        s.phase === "hunt"
      );
      world.setWeapon(
        local?.weapon || "glock",
        !!(local?.reloadAt > s?.serverTime),
      );
      world.updateEffects(dt);
      if (feedback.length) {
        for (const item of feedback.splice(0)) {
          if (!document.hidden && now - item.received < 300)
            presentEffect(item.event);
        }
        world.updateEffects(0);
      }
      renderer.render(scene, camera);
      if (now - hudAt > 100) {
        hudAt = now;
        const nearest = local ? nearestCopyProp(local) : null;
        onHud({
          active,
          mapPlayers: playing ? minimapPlayers(s.players, token, renderPos, yaw) : [],
          nearest: nearest ? TYPES[nearest.type].name : null,
          nearJail: local && distance(local, JAIL) < 2.3,
          hit: now < hitUntil,
          hitCaught,
          fps: Math.round(1 / Math.max(0.001, dt)),
        });
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      unlock();
      audio?.close();
      world.dispose();
      apiRef.current = null;
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", unlock);
      document.removeEventListener("visibilitychange", hidden);
      document.removeEventListener("pointerlockchange", lock);
    };
  }, [low, token]);
  return (
    <div
      className="ph-world"
      ref={mount}
      aria-label="3D courtyard game world"
    />
  );
}

function Joystick({ apiRef }) {
  const origin = useRef(null),
    [position, setPosition] = useState({ x: 0, y: 0 });
  const end = () => {
    origin.current = null;
    setPosition({ x: 0, y: 0 });
    apiRef.current?.move(0, 0);
  };
  return (
    <div
      className="ph-joystick"
      role="group"
      aria-label="Movement joystick"
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        let x = e.clientX - origin.current.x,
          y = e.clientY - origin.current.y;
        const n = Math.max(1, Math.hypot(x, y) / 38);
        x /= n;
        y /= n;
        setPosition({ x, y });
        apiRef.current?.move(x / 38, y / 38);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <span
        style={{ transform: `translate(${position.x}px,${position.y}px)` }}
      />
    </div>
  );
}

function RoundMessage({ message }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      className={`ph-round-message ${visible ? "" : "ph-dismissed"}`}
      role="status"
    >
      {message}
    </div>
  );
}

export default function PropHunt({ onBack }) {
  const [token] = useState(sessionToken),
    [room, setRoom] = useState(null),
    [playerId, setPlayerId] = useState(null),
    [connected, setConnected] = useState(false),
    [name, setName] = useState(
      () => localStorage.getItem("prop-party-name") || "",
    ),
    [code, setCode] = useState(
      () => new URLSearchParams(location.search).get("room") || "",
    ),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [hud, setHud] = useState({ active: false }),
    [muted, setMuted] = useState(false),
    [low, setLow] = useState(false),
    [copied, setCopied] = useState(false),
    [now, setNow] = useState(Date.now());
  const stateRef = useRef(null),
    socketRef = useRef(null),
    apiRef = useRef(null),
    mutedRef = useRef(false),
    noticeTimer = useRef(),
    offsetRef = useRef(0);
  const notify = (message) => {
    setError(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setError(""), 4000);
  };
  useEffect(() => {
    const s = io("/prop-hunt", { auth: { token }, autoConnect: false });
    socketRef.current = s;
    s.on("identity", (id) => setPlayerId(id));
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => {
      setConnected(false);
      apiRef.current?.pause();
    });
    s.on("connect_error", () => setConnected(false));
    s.on("state", (state) => {
      offsetRef.current = state.serverTime - Date.now();
      stateRef.current = state;
      setRoom(state);
      apiRef.current?.snapshot(state);
      const url = new URL(location.href);
      url.searchParams.set("room", state.code);
      history.replaceState({}, "", url);
    });
    s.on("motion", (packet) => {
      const current = stateRef.current;
      if (
        !current ||
        packet.code !== current.code ||
        packet.round !== current.round
      )
        return;
      const updates = new Map(packet.players.map((p) => [p[0], p]));
      const next = {
        ...current,
        serverTime: packet.serverTime,
        players: current.players.map((p) => {
          const m = updates.get(p.id);
          return m
            ? {
                ...p,
                x: m[1],
                z: m[2],
                vx: m[3],
                vz: m[4],
                yaw: m[5],
                ack: m[6],
                y: m[7] || 0,
                vy: m[8] || 0,
                jumpHeld: !!m[9],
              }
            : p;
        }),
      };
      stateRef.current = next;
      offsetRef.current = packet.serverTime - Date.now();
      apiRef.current?.snapshot(next);
    });
    s.on("effect", (e) => apiRef.current?.effect(e));
    s.connect();
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => {
      s.disconnect();
      clearInterval(timer);
      clearTimeout(noticeTimer.current);
    };
  }, [token]);
  const request = (event, data, done) => {
    if (!socketRef.current?.connected) {
      notify("Waiting for the server connection.");
      return;
    }
    setBusy(true);
    socketRef.current.timeout(5000).emit(event, data, (err, res) => {
      setBusy(false);
      if (err) notify("The server did not respond. Please try again.");
      else if (res?.error) notify(res.error);
      else done?.();
    });
  };
  const enter = (join = false, practice = false) => {
    if (!name.trim()) {
      notify("What should we call you?");
      return;
    }
    localStorage.setItem("prop-party-name", name.trim());
    request(
      "enter",
      { name, code: join ? code.trim() : undefined, practice },
      () => {
        if (practice) request("start", null);
      },
    );
  };
  const leave = () => {
    apiRef.current?.pause();
    request("leave", null, () => {
      stateRef.current = null;
      setRoom(null);
      onBack();
    });
  };
  const me = room?.players.find((p) => p.id === playerId),
    hunter = me?.role === "hunter",
    playing = room && ["hide", "hunt"].includes(room.phase),
    host = room?.hostId === playerId;
  const serverNow = now + offsetRef.current;
  const seconds = Math.max(
    0,
    Math.ceil(((room?.endsAt || 0) - serverNow) / 1000),
  );
  const weapon = WEAPONS[me?.weapon || "glock"];
  const unlocked = me && room && shotgunUnlocked(room, me, serverNow);
  const hunterTotal =
    room?.players.filter((p) => p.role === "hunter" && p.connected).length || 0;
  const remaining =
    room?.players.filter((p) => p.role === "prop" && !p.caught && p.connected)
      .length || 0;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify(`Room code: ${room.code}`);
    }
  };
  return (
    <div className={`ph-app ${playing ? "ph-playing" : ""}`}>
      <World
        stateRef={stateRef}
        token={playerId}
        socketRef={socketRef}
        apiRef={apiRef}
        onHud={setHud}
        onError={notify}
        mutedRef={mutedRef}
        low={low}
      />
      <div className="ph-vignette" />
      <header className="ph-topbar">
        <button
          className="ph-wordmark"
          onClick={room ? leave : onBack}
          aria-label="Leave Prop Party"
        >
          ◈ <span>PROP PARTY</span>
        </button>
        <div className="ph-top-actions">
          <span className={`ph-connection ${connected ? "is-online" : ""}`}>
            <i />
            {connected ? "LIVE" : "CONNECTING"}
          </span>
          <button
            className="ph-icon-button"
            aria-label={muted ? "Enable sound" : "Mute sound"}
            onClick={() => {
              setMuted(!muted);
              mutedRef.current = !muted;
            }}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
          <button
            className="ph-icon-button ph-quality"
            onClick={() => {
              apiRef.current?.pause();
              setLow(!low);
            }}
          >
            {low ? "Graphics: light" : "Graphics: high"}
          </button>
        </div>
      </header>
      {!room && (
        <main className="ph-home">
          <div className="ph-home-copy">
            <div className="ph-eyebrow">
              <span /> A VERY SUSPICIOUS GAME OF HIDE & SEEK
            </div>
            <h1>
              Nice plant.
              <br />
              <em>Is that you?</em>
            </h1>
            <p>
              Become the furniture. Fool your friends.
              <br />
              Try not to laugh when they walk right past you.
            </p>
            <div className="ph-facts">
              <span>2–30 friends</span>
              <span>3 minute hunts</span>
              <span>Four connected districts</span>
            </div>
            <div className="ph-entry">
              <label htmlFor="ph-name">YOUR ALIAS</label>
              <input
                id="ph-name"
                maxLength={20}
                autoComplete="nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="A totally normal chair"
                onKeyDown={(e) => e.key === "Enter" && enter()}
              />
              <button
                className="ph-button ph-primary"
                disabled={busy || !connected}
                onClick={() => enter()}
              >
                Create a party <span>↗</span>
              </button>
              <div className="ph-join">
                <input
                  aria-label="Room code"
                  maxLength={6}
                  placeholder="ROOM CODE"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
                <button
                  disabled={busy || !connected || code.length !== 6}
                  onClick={() => enter(true)}
                >
                  Join →
                </button>
              </div>
              <button
                className="ph-practice"
                disabled={busy || !connected}
                onClick={() => enter(false, true)}
              >
                Just looking? Try solo practice →
              </button>
            </div>
          </div>
          <div className="ph-scene-caption">
            <span>01 / MIMOSA DISTRICT</span>
            <strong>
              Something here
              <br />
              doesn’t belong.
            </strong>
            <small>And it might be your best friend.</small>
          </div>
          <footer className="ph-home-footer">
            <span>WASD to move · Mouse to look · Touch ready</span>
            <span>NO DOWNLOAD. NO ALIBI.</span>
          </footer>
        </main>
      )}
      {room && room.phase === "lobby" && (
        <main className="ph-panel-wrap">
          <section className="ph-panel">
            <div className="ph-eyebrow">THE DISTRICT IS OPEN</div>
            <h1>
              Gather the
              <br />
              <em>usual objects.</em>
            </h1>
            <p>
              Invite up to 30 friends. One hunter per eight players. Everyone
              else becomes something suspicious.
            </p>
            <button className="ph-room-code" onClick={copy}>
              <small>ROOM CODE · CLICK TO COPY INVITE</small>
              <strong>{room.code}</strong>
              <span>{copied ? "Invite copied!" : "Copy invite ↗"}</span>
            </button>
            <div className="ph-room-capacity">
              {room.players.length} / {MAX_PLAYERS} players ·{" "}
              {hunterCount(room.players.length)} hunter
              {hunterCount(room.players.length) > 1 ? "s" : ""}
            </div>
            <div className="ph-roster">
              {room.players.map((p, i) => (
                <div key={p.id}>
                  <span className="ph-avatar">
                    {["❋", "▧", "◒", "△"][i % 4]}
                  </span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.id === room.hostId
                      ? "HOST"
                      : p.connected
                        ? "READY"
                        : "RECONNECTING"}
                  </small>
                </div>
              ))}
            </div>
            <div className="ph-rules">
              <span>
                <b>01</b> Hide for {HIDE_SECONDS} seconds.
              </span>
              <span>
                <b>02</b> Copy props. Keep moving.
              </span>
              <span>
                <b>03</b> Rescue friends. Beat the clock.
              </span>
            </div>
            {host ? (
              <button
                className="ph-button ph-primary"
                disabled={
                  busy || room.players.filter((p) => p.connected).length < 2
                }
                onClick={() => request("start", null)}
              >
                Start the mischief <span>→</span>
              </button>
            ) : (
              <p className="ph-waiting">Waiting for the host to start…</p>
            )}
            <small className="ph-panel-foot">
              {room.players.length < 2
                ? "Waiting for at least one more friend."
                : "Hunters rotate every round."}
            </small>
          </section>
        </main>
      )}
      {playing && (
        <>
          <div className="ph-match-top">
            <div className={`ph-role ${hunter ? "hunter" : ""}`}>
              <small>
                {room.practice ? "SOLO PRACTICE" : `ROUND ${room.round}`}
              </small>
              <strong>
                {me?.caught
                  ? "CAPTURED"
                  : hunter
                    ? "THE HUNTER"
                    : "IN DISGUISE"}
              </strong>
              <span>
                {hunter
                  ? `${hunterTotal} hunter${hunterTotal === 1 ? "" : "s"} · ${weapon.name}`
                  : `${TYPES[me?.type]?.name} · ${me?.health ?? 100} HP`}
              </span>
            </div>
            <div className={`ph-clock ${seconds < 20 ? "urgent" : ""}`}>
              <small>
                {room.phase === "hide" ? "HIDING TIME" : "HUNT ENDS IN"}
              </small>
              <strong>
                {Math.floor(seconds / 60)}:
                {String(seconds % 60).padStart(2, "0")}
              </strong>
              <span>
                {remaining} prop{remaining !== 1 ? "s" : ""} hiding
              </span>
            </div>
          </div>
          <RoundMessage
            key={`${room.code}-${room.round}-${room.message}`}
            message={room.message}
          />
          {hud.active && hunter && room.phase === "hunt" && (
            <div
              className={`ph-crosshair ${me?.weapon === "shotgun" ? "ph-spread" : ""} ${hud.hit ? "ph-hit" : ""} ${hud.hitCaught ? "ph-catch-hit" : ""}`}
            >
              <i />
              <i />
            </div>
          )}
          {hud.active && me?.caught && (
            <div className="ph-captured">
              <strong>You’ve been found.</strong>
              <p>A teammate can free you at Lost & Found.</p>
              <button onClick={() => apiRef.current?.action("taunt")}>
                Call for rescue · Q
              </button>
            </div>
          )}
          {hud.active && hunter && room.phase === "hide" && (
            <div className="ph-countdown">
              <span>NO PEEKING</span>
              <strong>{seconds}</strong>
              <p>Let the furniture get comfortable.</p>
            </div>
          )}
          {!hud.active && (
            <div className="ph-pause">
              <section>
                <div className="ph-eyebrow">
                  {room.phase === "hide" ? "YOUR ROLE" : "BACK TO THE MISCHIEF"}
                </div>
                <h2>
                  {me?.caught
                    ? "Hang tight."
                    : hunter
                      ? "Find the fakes."
                      : "Be the furniture."}
                </h2>
                <p>
                  {hunter
                    ? "Aim at suspicious objects. Left click fires; R reloads. Press 1 / 2 to switch weapons. Shotgun unlocks after 2 captures or 45 seconds."
                    : "Copy a nearby object, find a believable spot, and rescue your friends. Aim your view and press G to throw your one blind grenade: 3m radius, 5 seconds."}
                </p>
                <div className="ph-control-legend">
                  <span>
                    <kbd>W A S D</kbd> Move
                  </span>
                  <span>
                    <kbd>MOUSE</kbd> Look
                  </span>
                  <span>
                    <kbd>E</kbd> {hunter ? "Fire" : "Copy prop"}
                  </span>
                  <span>
                    <kbd>SPACE</kbd> Jump onto furniture
                  </span>
                  {!hunter && (
                    <span><kbd>G</kbd> Blind grenade · 1 per round</span>
                  )}
                  {!hunter && (
                    <span>
                      <kbd>F</kbd> Decoy taunt · 25s cooldown
                    </span>
                  )}
                  <span>
                    <kbd>Q</kbd> {hunter ? "Scan" : "Taunt"}
                  </span>
                  <span>
                    <kbd>R</kbd> {hunter ? "Reload" : "Rescue"}
                  </span>
                </div>
                <button
                  className="ph-button ph-primary"
                  disabled={!connected}
                  onClick={() => apiRef.current?.activate()}
                >
                  {hunter ? "Let me hunt" : "Let me hide"} <span>→</span>
                </button>
                <small>
                  Touch: left stick to move, drag to look. If the mouse cursor
                  stays visible, drag the scene to aim.
                </small>
              </section>
            </div>
          )}
          {hunter && (
            <div className="ph-loadout">
              <div className="ph-ammo">
                <small>
                  {me?.reloadAt > serverNow
                    ? "RELOADING"
                    : weapon.name.toUpperCase()}
                </small>
                <strong>
                  {me?.ammo?.[me?.weapon] ?? 0}
                  <span> / {weapon.magazine}</span>
                </strong>
              </div>
              <div className="ph-weapon-options">
                <button
                  className={me?.weapon === "glock" ? "selected" : ""}
                  disabled={!hud.active || me?.reloadAt > serverNow}
                  onClick={() => apiRef.current?.action("glock")}
                >
                  <kbd>1</kbd> Glock <small>Precision · 36m</small>
                </button>
                <button
                  className={me?.weapon === "shotgun" ? "selected" : ""}
                  disabled={
                    !hud.active || !unlocked || me?.reloadAt > serverNow
                  }
                  onClick={() => apiRef.current?.action("shotgun")}
                >
                  <kbd>2</kbd> Shotgun{" "}
                  <small>
                    {unlocked
                      ? "Wide spread · 15m"
                      : `${Math.min(me?.captures || 0, 2)}/2 captures or ${Math.max(0, 45 - Math.floor((serverNow - (room.huntStartedAt || serverNow)) / 1000))}s`}
                  </small>
                </button>
              </div>
            </div>
          )}
          <div className="ph-bottom-hud ph-prop-hud">
            <div className="ph-status">
              <span className="ph-status-dot" />
              {me?.caught
                ? "Your friends can rescue you"
                : hunter
                  ? "Look for something out of place"
                  : hud.nearest
                    ? `Nearby: ${hud.nearest}`
                    : "Find an object to copy"}
              <small>
                {hunter
                  ? "Left click / E fire · Space jump · R reload · 1 / 2 switch"
                  : "Space to jump onto furniture · Stand still to blend in."}
              </small>
            </div>
            <div className="ph-actions">
              {!hunter && (
                <button
                  disabled={!hud.active || me?.caught || room.phase !== "hunt" || me?.blinds !== 1}
                  onClick={() => apiRef.current?.action("blind")}
                >
                  <kbd>G</kbd>
                  <strong>Blind grenade</strong>
                  <small>{me?.blinds === 0 ? "Used this round" : room.phase !== "hunt" ? "Hunt only" : "1 left · 3m · 5s"}</small>
                </button>
              )}
              {!hunter && (
                <button
                  disabled={
                    !hud.active ||
                    me?.caught ||
                    room.phase !== "hunt" ||
                    serverNow < me?.decoyAt
                  }
                  onClick={() => apiRef.current?.action("decoy")}
                >
                  <kbd>F</kbd>
                  <strong>Decoy</strong>
                  <small>
                    {room.phase !== "hunt"
                      ? "Hunt only"
                      : serverNow < me?.decoyAt
                        ? `${Math.ceil((me.decoyAt - serverNow) / 1000)}s cooldown`
                        : "Lure them away"}
                  </small>
                </button>
              )}
              <button
                disabled={
                  !hud.active || me?.caught || (hunter && room.phase === "hide")
                }
                onPointerDown={(e) => {
                  e.preventDefault();
                  apiRef.current?.action("jump");
                }}
                onClick={(e) => {
                  if (e.detail === 0) apiRef.current?.action("jump");
                }}
              >
                <kbd>SPACE</kbd>
                <strong>Jump</strong>
                <small>Reach higher spots</small>
              </button>
              <button
                disabled={
                  !hud.active ||
                  me?.caught ||
                  (room.phase === "hide" && hunter) ||
                  serverNow < (hunter ? me?.shotAt : me?.changeAt) ||
                  (hunter &&
                    (me?.reloadAt > serverNow || !me?.ammo?.[me?.weapon]))
                }
                onPointerDown={(e) => {
                  if (hunter) {
                    e.preventDefault();
                    apiRef.current?.action("shoot");
                  }
                }}
                onClick={(e) => {
                  if (!hunter || e.detail === 0)
                    apiRef.current?.action(hunter ? "shoot" : "change");
                }}
              >
                <kbd>E</kbd>
                <strong>{hunter ? "Fire" : "Copy prop"}</strong>
                <small>
                  {hunter ? `${weapon.range}m range` : "Nearby object"}
                </small>
              </button>
              <button
                disabled={
                  !hud.active ||
                  serverNow < (hunter ? me?.scanAt : (me?.tauntAt || 0) - 16000)
                }
                onClick={() =>
                  apiRef.current?.action(hunter ? "scan" : "taunt")
                }
              >
                <kbd>Q</kbd>
                <strong>{hunter ? "Scan" : "Taunt"}</strong>
                <small>
                  {hunter
                    ? `${Math.max(0, Math.ceil(((me?.scanAt || 0) - serverNow) / 1000)) || "7m"} ${serverNow < me?.scanAt ? "sec" : "radius"}`
                    : `${tauntName(me?.tauntId)} · ${Math.max(0, Math.ceil(((me?.tauntAt || 0) - serverNow) / 1000))}s`}
                </small>
              </button>
              <button
                disabled={
                  !hud.active ||
                  me?.caught ||
                  (!hunter && !hud.nearJail) ||
                  (hunter && me?.reloadAt > serverNow)
                }
                onClick={() =>
                  apiRef.current?.action(hunter ? "reload" : "rescue")
                }
              >
                <kbd>R</kbd>
                <strong>{hunter ? "Reload" : "Rescue"}</strong>
                <small>
                  {hunter
                    ? `${me?.ammo?.[me?.weapon] ?? 0} / ${weapon.magazine}`
                    : "Lost & Found"}
                </small>
              </button>
            </div>
          </div>
          {hud.active && (
            <div className="ph-touch">
              <Joystick apiRef={apiRef} />
              <button
                className="ph-touch-pause"
                onClick={() => apiRef.current?.pause()}
              >
                Ⅱ
              </button>
            </div>
          )}
          <div className="ph-match-footer">
            <span>
              {room.code} · {room.players.length} PLAYERS
            </span>
            <span>ESC TO RELEASE CURSOR</span>
          </div>
          <Minimap players={hud.mapPlayers} />
          {hunter && me?.blindUntil > serverNow && (
            <div className="ph-blinded" role="status" aria-label="Blinded for five seconds">
              <strong>BLINDED</strong>
              <span>Vision returns in {Math.ceil((me.blindUntil - serverNow) / 1000)}s</span>
            </div>
          )}
        </>
      )}
      {room?.phase === "results" && (
        <main className="ph-panel-wrap">
          <section className="ph-panel ph-results">
            <div className="ph-eyebrow">ROUND {room.round} COMPLETE</div>
            <div className="ph-result-symbol">
              {room.winner === "prop" ? "❋" : "◎"}
            </div>
            <h1>{room.winner === "prop" ? "Well hidden." : "Found you."}</h1>
            <p>{room.message}</p>
            <div className="ph-scoreboard">
              {[...room.players]
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                  <div key={p.id}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <strong>
                      {p.name}
                      {p.id === playerId ? " (you)" : ""}
                    </strong>
                    <small>
                      {p.role === "hunter"
                        ? "HUNTER"
                        : p.caught
                          ? "CAUGHT"
                          : "HIDDEN"}
                    </small>
                    <b>{p.score}</b>
                  </div>
                ))}
            </div>
            {host ? (
              <button
                className="ph-button ph-primary"
                disabled={busy}
                onClick={() => request("start", null)}
              >
                Another round <span>↻</span>
              </button>
            ) : (
              <p>Waiting for the host…</p>
            )}
            <button className="ph-practice" onClick={leave}>
              Back to game night
            </button>
          </section>
        </main>
      )}
      {error && (
        <div className="ph-notice" role="status">
          {error}
          <button aria-label="Dismiss message" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
