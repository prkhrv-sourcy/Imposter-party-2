// Shared geometry and fixed-step movement keep the server and client in agreement.
export const STEP = 1 / 30;
export const BOUNDS = 27.5;
export const MAX_PLAYERS = 30;
export const HIDE_SECONDS = 25;
export const HUNT_SECONDS = 180;
export const hunterCount = (count) => Math.max(1, Math.ceil(count / 8));
export const JAIL = { x: 0, z: 10.6 };
export const TYPES = {
  plant: { name: "Potted plant", radius: 0.38, height: 1.4, color: "#ea9366" },
  chair: { name: "Café chair", radius: 0.4, height: 1.2, color: "#65a698" },
  crate: { name: "Orange crate", radius: 0.46, height: 0.9, color: "#c58b56" },
  bin: { name: "Little bin", radius: 0.4, height: 1.15, color: "#70959b" },
  cone: { name: "Traffic cone", radius: 0.36, height: 0.9, color: "#ee8051" },
  stool: { name: "Pink stool", radius: 0.36, height: 0.75, color: "#da8c9c" },
  tabletopPlant: {
    name: "Tiny potted plant",
    radius: 0.15,
    height: 0.44,
    color: "#e9aa7c",
  },
  cup: { name: "Counter cup", radius: 0.18, height: 0.38, color: "#d4a875" },
  notebook: {
    name: "Table notebook",
    radius: 0.18,
    height: 0.025,
    color: "#fff0d7",
  },
};
export const WALLS = [
  { x: 0, z: -28, w: 56, d: 0.6, h: 5.4, color: "#b7c5aa" },
  { x: -28, z: 0, w: 0.6, d: 56, h: 4.4, color: "#d4ad8e" },
  { x: 28, z: 0, w: 0.6, d: 56, h: 4.4, color: "#e7c6a3" },
  { x: 0, z: 28, w: 56, d: 0.6, h: 3.5, color: "#c4b8a1" },
  ...[-10.4, 0, 10.4].map((x) => ({
    x,
    z: -14,
    w: 6,
    d: 0.6,
    h: 5.4,
    color: "#e8b599",
  })),
  ...[-14, 14].flatMap((x) =>
    [-10, 10].map((z) => ({ x, z, w: 0.6, d: 8, h: 4.4, color: "#e7c6a3" })),
  ),
  { x: 0, z: 14, w: 12, d: 0.6, h: 2.6, color: "#dcb498" },
  { x: -20, z: -6, w: 8, d: 0.5, h: 2.2, color: "#a9ba91" },
  { x: 20, z: 7, w: 8, d: 0.5, h: 2.2, color: "#d6b499" },
  { x: -8, z: 21, w: 0.5, d: 8, h: 2.5, color: "#c5b29a" },
  { x: 8, z: 21, w: 0.5, d: 8, h: 2.5, color: "#c5b29a" },
  { x: -7, z: -5, w: 0.45, d: 9, h: 2.7, color: "#e9c5a3" },
  { x: 7, z: -6, w: 0.45, d: 7, h: 2.7, color: "#e9c5a3" },
  { x: -9.8, z: 4.5, w: 5, d: 0.5, h: 1.7, color: "#b2c3ac" },
  { x: 9.8, z: 4.5, w: 5, d: 0.5, h: 1.7, color: "#b2c3ac" },
];
export const FURNITURE = [
  { kind: "counter", x: -10.4, z: -10, w: 4.8, d: 1.25, h: 1.3 },
  { kind: "counter", x: 10.5, z: -10, w: 4.6, d: 1.25, h: 1.3 },
  { kind: "table", x: -3.7, z: -7, w: 1.8, d: 1.8, h: 1.05 },
  { kind: "table", x: 3.7, z: -7, w: 1.8, d: 1.8, h: 1.05 },
  { kind: "table", x: -3.7, z: 1, w: 1.8, d: 1.8, h: 1.05 },
  { kind: "table", x: 3.7, z: 1, w: 1.8, d: 1.8, h: 1.05 },
  { kind: "planter", x: 0, z: -2.8, w: 2.6, d: 2.6, h: 0.65 },
  { kind: "bench", x: -10.3, z: 8, w: 3.4, d: 0.85, h: 1.25 },
  { kind: "bench", x: 10.3, z: 8, w: 3.4, d: 0.85, h: 1.25 },
  ...[-21, 21].flatMap((x) =>
    [-12, 1, 18].map((z) => ({ kind: "table", x, z, w: 1.8, d: 1.8, h: 1.05 })),
  ),
  ...[-18, -6, 6, 18].map((x) => ({
    kind: "planter",
    x,
    z: -19,
    w: 2.6,
    d: 2.6,
    h: 0.65,
  })),
  ...[-21, 21].map((x) => ({
    kind: "counter",
    x,
    z: 9,
    w: 4.8,
    d: 1.25,
    h: 1.3,
  })),
  ...[-4, 4].map((x) => ({ kind: "stack", x, z: 21, w: 2.4, d: 2.4, h: 2.2 })),
  { kind: "stack", x: -21, z: 23, w: 3, d: 2.5, h: 2.5 },
  { kind: "bench", x: 0, z: -24, w: 3.4, d: 0.85, h: 1.25 },
];
const courtyardProps = [
  ["chair", -5.2, -7, 1.57],
  ["chair", -2.2, -7, -1.57],
  ["chair", 3.7, -8.5, 0],
  ["chair", 5.2, -7, -1.57],
  ["chair", -5.2, 1, 1.57],
  ["chair", -3.7, 2.5, 3.14],
  ["chair", 5.2, 1, -1.57],
  ["chair", 3.7, -0.5, 0],
  ["plant", -12, -12, 0],
  ["plant", -8, -12, 0],
  ["plant", 8, -12, 0],
  ["plant", 12, -12, 0],
  ["plant", -7.8, 3, 0],
  ["plant", 7.8, 3, 0],
  ["plant", -12, 11.5, 0],
  ["plant", 12, 11.5, 0],
  ["crate", -12, -7, 0],
  ["crate", -10.8, -6.8, 0.15],
  ["crate", -12, -5.8, 0],
  ["crate", 10, -7, 0],
  ["crate", 11.4, -6.7, -0.1],
  ["bin", -12.5, 2, 0],
  ["bin", 12.5, 2, 0],
  ["bin", -6, 11.5, 0],
  ["bin", 6, 11.5, 0],
  ["cone", -7, 7, 0],
  ["cone", -6, 8, 0],
  ["cone", 7, 7, 0],
  ["cone", 8, 6, 0],
  ["stool", -9, -2, 0],
  ["stool", -11, -1, 0],
  ["stool", 9, -2, 0],
  ["stool", 11, -1, 0],
  ["plant", -2, -12, 0],
  ["plant", 2, -12, 0],
  ["crate", -8.5, 11, 0],
  ["stool", 8.5, 11, 0],
];
const outerProps = [];
for (const side of [-1, 1]) {
  for (const z of [-23, -16, -2, 12, 23]) {
    outerProps.push(
      ["plant", side * 25, z, 0],
      ["crate", side * 23.6, z + 0.3, 0],
      ["bin", side * 17, z, 0],
    );
  }
  for (const x of [4, 11, 19]) {
    outerProps.push(
      ["stool", side * x, -24, 0],
      ["plant", side * x, -22, 0],
      ["crate", side * x, 25, 0],
      ["cone", side * x, 23, 0],
    );
  }
}
for (const x of [-21, 21])
  for (const z of [-12, 1, 18]) {
    outerProps.push(
      ["chair", x - 1.6, z, Math.PI / 2],
      ["chair", x + 1.6, z, -Math.PI / 2],
    );
  }
const elevatedProps = FURNITURE.flatMap((f) =>
  f.kind === "table"
    ? [
        ["tabletopPlant", f.x + 0.25, f.z + 0.15, 0, 1.09],
        ["notebook", f.x - 0.3, f.z - 0.15, 0, 1.09],
      ]
    : f.kind === "counter"
      ? [-1, 0, 1].map((i) => ["cup", f.x + i * 1.3, f.z, 0, 1.345])
      : [],
);
export const PROPS = [...courtyardProps, ...outerProps, ...elevatedProps].map(
  ([type, x, z, yaw, y = 0], i) => ({ id: `prop-${i}`, type, x, y, z, yaw }),
);
export const SOLIDS = [
  ...WALLS,
  ...FURNITURE.flatMap((f) =>
    f.kind === "bench"
      ? [
          { ...f, h: 0.61 },
          { ...f, z: f.z - 0.35, d: 0.12, h: 1.235 },
        ]
      : [
          {
            ...f,
            h: f.kind === "table" ? 1.09 : f.kind === "counter" ? 1.345 : f.h,
          },
        ],
  ),
  ...PROPS.map((p) => ({
    ...p,
    w: TYPES[p.type].radius * 2,
    d: TYPES[p.type].radius * 2,
    h: TYPES[p.type].height,
  })),
];
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const radius = (p) =>
  p.role === "hunter" ? 0.34 : TYPES[p.type]?.radius || 0.4;
export function canStand(x, z, r = 0.4, y = 0, height = 1.4) {
  return (
    Math.abs(x) < BOUNDS - r &&
    Math.abs(z) < BOUNDS - r &&
    !SOLIDS.some(
      (s) =>
        (s.y || 0) + s.h > y + 0.001 &&
        (s.y || 0) < y + height - 0.001 &&
        Math.abs(x - s.x) < s.w / 2 + r &&
        Math.abs(z - s.z) < s.d / 2 + r,
    )
  );
}
export function movePlayer(p, input, dt = STEP, slow = false) {
  let x = Number.isFinite(input.x) ? input.x : 0,
    z = Number.isFinite(input.z) ? input.z : 0;
  const length = Math.hypot(x, z);
  if (length > 1) {
    x /= length;
    z /= length;
  }
  const speed = (p.role === "hunter" ? 5.1 : 4.6) * (slow ? 0.42 : 1);
  const blend = 1 - Math.exp(-18 * dt);
  p.vx = (p.vx || 0) + (x * speed - (p.vx || 0)) * blend;
  p.vz = (p.vz || 0) + (z * speed - (p.vz || 0)) * blend;
  const r = radius(p);
  p.y ||= 0;
  p.vy ||= 0;
  const supported =
    p.y === 0 ||
    SOLIDS.some(
      (s) =>
        Math.abs(p.y - ((s.y || 0) + s.h)) < 0.001 &&
        Math.abs(p.x - s.x) < s.w / 2 + r &&
        Math.abs(p.z - s.z) < s.d / 2 + r,
    );
  if (
    input.jump === true &&
    !p.jumpHeld &&
    supported &&
    p.vy === 0 &&
    !p.caught
  )
    p.vy = 8.8;
  p.jumpHeld = input.jump === true;
  const previousY = p.y;
  p.vy -= 22 * dt;
  p.y = Math.max(0, p.y + p.vy * dt);
  // Resolve horizontal motion at the higher foot position before landing on edges.
  const collisionY = Math.max(previousY, p.y);
  const nx = p.x + p.vx * dt,
    nz = p.z + p.vz * dt;
  if (
    canStand(
      nx,
      p.z,
      r,
      collisionY,
      p.role === "hunter" ? 1.9 : TYPES[p.type].height,
    )
  )
    p.x = nx;
  else p.vx = 0;
  if (
    canStand(
      p.x,
      nz,
      r,
      collisionY,
      p.role === "hunter" ? 1.9 : TYPES[p.type].height,
    )
  )
    p.z = nz;
  else p.vz = 0;
  if (p.vy <= 0) {
    let floor = 0;
    for (const s of SOLIDS)
      if (
        (s.y || 0) + s.h <= previousY + 0.001 &&
        (s.y || 0) + s.h >= p.y &&
        Math.abs(p.x - s.x) < s.w / 2 + r &&
        Math.abs(p.z - s.z) < s.d / 2 + r
      )
        floor = Math.max(floor, (s.y || 0) + s.h);
    if (p.y <= floor) {
      p.y = floor;
      p.vy = 0;
    }
  }
  if (Number.isFinite(input.yaw)) p.yaw = input.yaw;
}
export function lineOfSight(a, b) {
  const startY = (a.y || 0) + Math.min(0.8, (TYPES[a.type]?.height || 1.6) / 2);
  const endY = (b.y || 0) + (TYPES[b.type]?.height || 1.6) / 2;
  const steps = Math.ceil(Math.hypot(distance(a, b), endY - startY) / 0.1);
  for (let i = 1; i < steps; i++) {
    const t = i / steps,
      x = a.x + (b.x - a.x) * t,
      z = a.z + (b.z - a.z) * t;
    if (
      [...WALLS, ...FURNITURE].some(
        (s) =>
          s.h > startY + (endY - startY) * t &&
          Math.abs(x - s.x) < s.w / 2 &&
          Math.abs(z - s.z) < s.d / 2,
      )
    )
      return false;
  }
  return true;
}
export function nearestCopyProp(player) {
  const centerY =
    (player.y || 0) + Math.min(0.8, (TYPES[player.type]?.height || 1.6) / 2);
  const reach = (p) =>
    Math.hypot(
      distance(player, p),
      (p.y || 0) + TYPES[p.type].height / 2 - centerY,
    );
  return PROPS.filter((p) => reach(p) < 2.7 && lineOfSight(player, p)).sort(
    (a, b) => reach(a) - reach(b),
  )[0];
}
const SPAWNS = [
  { x: 0, z: 7 },
  { x: -5.7, z: -10.5 },
  { x: 5.7, z: -10.5 },
  { x: -10, z: 1.5 },
  { x: 10, z: 1.5 },
  { x: -6, z: 5 },
  { x: 6, z: 5 },
  { x: 0, z: -10 },
  ...[-24, -18, -12, -6, 0, 6, 12, 18, 24].flatMap((x) =>
    [-25, -16, 17, 26].map((z) => ({ x, z })),
  ),
].filter((p) => canStand(p.x, p.z, 0.6));
export function spawnPoint(index = 0) {
  return { ...SPAWNS[index % SPAWNS.length] };
}
export function jailPoint(index = 0) {
  return {
    x: JAIL.x + ((index % 6) - 2.5) * 0.8,
    z: JAIL.z + (Math.floor(index / 6) - 2) * 0.7,
  };
}
const RESCUES = [];
for (let z = 8; z <= 12; z += 1)
  for (let x = -5; x <= 5; x += 1)
    if (canStand(x, z, 0.5)) RESCUES.push({ x, z });
export function rescuePoint(index = 0) {
  return { ...RESCUES[index % RESCUES.length] };
}

export const WEAPONS = {
  glock: {
    name: "Glock",
    range: 36,
    damage: 50,
    pellets: 1,
    spread: 0,
    magazine: 12,
    cooldown: 250,
    reload: 1400,
  },
  shotgun: {
    name: "Shotgun",
    range: 15,
    damage: 18,
    pellets: 9,
    spread: 0.105,
    magazine: 5,
    cooldown: 950,
    reload: 2200,
  },
};
export const shotgunUnlocked = (room, p, now) =>
  p.captures >= 2 ||
  (room.huntStartedAt > 0 && now - room.huntStartedAt >= 45000);
export function aimDirection(yaw, pitch) {
  return {
    x: -Math.sin(yaw) * Math.cos(pitch),
    y: -Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch),
  };
}
export function rayBox(origin, dir, box, maxDistance) {
  let near = 0,
    far = maxDistance;
  const mins = { x: box.x - box.w / 2, y: box.y || 0, z: box.z - box.d / 2 };
  const maxs = {
    x: box.x + box.w / 2,
    y: (box.y || 0) + box.h,
    z: box.z + box.d / 2,
  };
  for (const axis of ["x", "y", "z"]) {
    if (Math.abs(dir[axis]) < 1e-8) {
      if (origin[axis] < mins[axis] || origin[axis] > maxs[axis]) return null;
      continue;
    }
    let a = (mins[axis] - origin[axis]) / dir[axis],
      b = (maxs[axis] - origin[axis]) / dir[axis];
    if (a > b) [a, b] = [b, a];
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (near > far) return null;
  }
  return near;
}
const SHOT_SOLIDS = [
  ...WALLS,
  ...PROPS.map((p) => ({
    ...p,
    w: TYPES[p.type].radius * 2,
    d: TYPES[p.type].radius * 2,
    h: TYPES[p.type].height,
  })),
  ...FURNITURE.flatMap((f) =>
    f.kind === "table"
      ? [
          { ...f, y: 0.95, h: 0.15 },
          { ...f, w: 0.24, d: 0.24, h: 0.95 },
        ]
      : f.kind === "planter"
        ? [f, { ...f, w: 0.4, d: 0.4, h: 3.4 }]
        : [f],
  ),
];
export function traceShot(players, shooter, weapon, yaw, pitch) {
  const config = WEAPONS[weapon],
    origin = { x: shooter.x, y: (shooter.y || 0) + 1.65, z: shooter.z },
    hits = new Map(),
    rays = [];
  for (let i = 0; i < config.pellets; i++) {
    const angle = i * 2.399963,
      spread =
        i === 0 ? 0 : config.spread * Math.sqrt(i / (config.pellets - 1));
    const dir = aimDirection(
      yaw + Math.cos(angle) * spread,
      pitch + Math.sin(angle) * spread,
    );
    let closest =
        dir.y < 0 ? Math.min(config.range, -origin.y / dir.y) : config.range,
      target = null;
    for (const box of SHOT_SOLIDS) {
      const t = rayBox(origin, dir, box, closest);
      if (t !== null && t < closest) closest = t;
    }
    for (const p of players) {
      if (p.id === shooter.id || p.caught || !p.connected) continue;
      const r = radius(p),
        h = p.role === "hunter" ? 1.9 : TYPES[p.type].height;
      const t = rayBox(
        origin,
        dir,
        { x: p.x, y: p.y || 0, z: p.z, w: r * 2, d: r * 2, h },
        closest,
      );
      if (t !== null && t < closest) {
        closest = t;
        target = p;
      }
    }
    if (target?.role === "prop")
      hits.set(target.id, (hits.get(target.id) || 0) + config.damage);
    rays.push({
      x: origin.x + dir.x * closest,
      y: origin.y + dir.y * closest,
      z: origin.z + dir.z * closest,
    });
  }
  return { origin, rays, hits };
}
