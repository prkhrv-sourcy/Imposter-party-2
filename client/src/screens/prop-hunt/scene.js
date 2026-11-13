import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { WALLS, FURNITURE, PROPS, TYPES, JAIL, BLIND } from "./world";

export function createScene(container, { low = false } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#bed9d8");
  scene.fog = new THREE.Fog("#bed9d8", 48, 120);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(67, 1, 0.08, 120);
  const materials = new Map(),
    geometries = new Map(),
    textures = [];
  function mat(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra }),
      );
    return materials.get(key);
  }
  function geometry(key, make) {
    if (!geometries.has(key)) geometries.set(key, make());
    return geometries.get(key);
  }
  function mesh(parent, geo, color, x, y, z, extra) {
    const m = new THREE.Mesh(geo, mat(color, extra));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(parent, w, h, d, color, x = 0, y = 0, z = 0, round = 0.04) {
    return mesh(
      parent,
      geometry(`b${w},${h},${d},${round}`, () =>
        round
          ? new RoundedBoxGeometry(w, h, d, 2, round)
          : new THREE.BoxGeometry(w, h, d),
      ),
      color,
      x,
      y,
      z,
    );
  }
  function cylinder(parent, rt, rb, h, color, x = 0, y = 0, z = 0) {
    return mesh(
      parent,
      geometry(
        `c${rt},${rb},${h}`,
        () => new THREE.CylinderGeometry(rt, rb, h, 12),
      ),
      color,
      x,
      y,
      z,
    );
  }
  function ball(parent, r, color, x = 0, y = 0, z = 0) {
    return mesh(
      parent,
      geometry(`s${r}`, () => new THREE.IcosahedronGeometry(r, 1)),
      color,
      x,
      y,
      z,
    );
  }
  function label(text, w, h, bg = "#275f59", fg = "#fff4de") {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 98px sans-serif";
    ctx.fillText(text, 512, 128, 940);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
    );
    m.userData.ownResources = true;
    return m;
  }
  scene.add(new THREE.HemisphereLight("#e4f4ff", "#b8916e", 2.3));
  const sun = new THREE.DirectionalLight("#fff1d0", 3.4);
  sun.position.set(-24, 46, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(low ? 2048 : 4096, low ? 2048 : 4096);
  Object.assign(sun.shadow.camera, {
    left: -43,
    right: 43,
    top: 43,
    bottom: -43,
    near: 1,
    far: 130,
  });
  sun.shadow.autoUpdate = false;
  sun.shadow.needsUpdate = true;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 3;
  scene.add(sun);
  const world = new THREE.Group();
  scene.add(world);
  box(world, 180, 0.3, 180, "#c1cec0", 0, -0.65, 0, 0);
  box(world, 56.8, 0.5, 56.8, "#ae9d86", 0, -0.3, 0);
  // A single tiled floor texture avoids hundreds of extra draw calls.
  const tile = document.createElement("canvas");
  tile.width = tile.height = 512;
  const tc = tile.getContext("2d");
  tc.fillStyle = "#d7c6aa";
  tc.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 4; x++)
    for (let y = 0; y < 4; y++) {
      tc.fillStyle = ["#d9c9ae", "#dfcfb6", "#d2c1a6", "#ddcbb0"][
        (x + y * 3) % 4
      ];
      tc.fillRect(x * 128 + 2, y * 128 + 2, 124, 124);
    }
  const tileTex = new THREE.CanvasTexture(tile);
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping;
  tileTex.repeat.set(14, 14);
  tileTex.colorSpace = THREE.SRGBColorSpace;
  textures.push(tileTex);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(56, 56),
    new THREE.MeshStandardMaterial({ map: tileTex, roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData.ownResources = true;
  world.add(floor);
  const cameraSolids = [];
  for (const w of WALLS) {
    const m = box(world, w.w, w.h, w.d, w.color, w.x, w.h / 2, w.z, 0.06);
    cameraSolids.push(m);
    box(world, w.w + 0.06, 0.13, w.d + 0.06, "#f5dfbd", w.x, w.h, w.z);
  }
  // Surrounding façades, recessed windows, striped awnings, and shop signs.
  for (const x of [-10.4, 0, 10.4]) {
    box(world, 5.4, 2.6, 0.15, "#396b69", x, 1.9, -13.63);
    box(world, 0.12, 2.6, 0.2, "#eed9b4", x, 1.9, -13.5);
    box(world, 5.4, 0.12, 0.2, "#eed9b4", x, 1.7, -13.5);
    const sign = label(
      x === 0 ? "HIDE & SEEK" : x < 0 ? "CAFÉ   MIMOSA" : "FLEUR MARKET",
      5.4,
      0.9,
    );
    sign.position.set(x, 4.3, -13.61);
    world.add(sign);
    for (let i = 0; i < 10; i++) {
      const awning = box(
        world,
        0.55,
        0.09,
        2.2,
        i % 2 ? "#f8e7c6" : "#cf7659",
        x - 2.48 + i * 0.55,
        3.45,
        -12.65,
        0.01,
      );
      awning.rotation.x = 0.13;
      box(
        world,
        0.55,
        0.3,
        0.08,
        i % 2 ? "#f8e7c6" : "#cf7659",
        x - 2.48 + i * 0.55,
        3.18,
        -11.57,
        0.02,
      );
    }
  }
  for (const side of [-1, 1])
    for (const z of [-10, 10]) {
      box(world, 0.12, 1.8, 2.6, "#588783", side * 13.65, 2.6, z);
      box(world, 0.18, 1.85, 0.1, "#f3d8b1", side * 13.53, 2.6, z);
      box(world, 0.18, 0.1, 2.6, "#f3d8b1", side * 13.53, 2.6, z);
      box(world, 0.5, 0.2, 3, "#f5dfbd", side * 13.5, 1.65, z);
    }
  for (const f of FURNITURE) {
    const g = new THREE.Group();
    g.position.set(f.x, 0, f.z);
    world.add(g);
    if (f.kind === "table") {
      cylinder(g, 0.94, 0.94, 0.14, "#f3d6a5", 0, 1.02);
      cylinder(g, 0.09, 0.12, 0.9, "#365f58", 0, 0.5);
      cylinder(g, 0.48, 0.48, 0.07, "#365f58", 0, 0.07);
    } else if (f.kind === "counter") {
      box(g, f.w, 1.2, f.d, "#7ba398", 0, 0.6);
      box(g, f.w + 0.15, 0.15, f.d + 0.15, "#f4ddb6", 0, 1.27);
      for (let i = -1; i <= 1; i++) {
        box(g, 1, 0.8, 0.08, "#527c72", i * 1.4, 0.65, f.d / 2 + 0.03);
      }
    } else if (f.kind === "bench") {
      for (let i = 0; i < 4; i++)
        box(g, f.w, 0.12, 0.17, "#b77d50", 0, 0.55, -0.3 + i * 0.2);
      for (let i = 0; i < 3; i++)
        box(g, f.w, 0.15, 0.12, "#c38e60", 0, 0.8 + i * 0.18, -0.35);
      for (const x of [-1.3, 1.3]) box(g, 0.12, 0.55, 0.65, "#365a54", x, 0.27);
    } else if (f.kind === "stack") {
      for (let i = 0; i < 3; i++) {
        box(
          g,
          f.w,
          f.h / 3 - 0.03,
          f.d,
          ["#b98857", "#c89965", "#d3ac7c"][i],
          0,
          ((i + 0.5) * f.h) / 3,
          0,
          0.04,
        );
        for (const x of [-f.w * 0.4, f.w * 0.4])
          box(
            g,
            0.1,
            f.h / 3,
            0.06,
            "#e1b889",
            x,
            ((i + 0.5) * f.h) / 3,
            f.d / 2 + 0.02,
            0.01,
          );
      }
    } else {
      cylinder(g, 1.3, 1.2, 0.65, "#d89877", 0, 0.32);
      cylinder(g, 1.17, 1.17, 0.04, "#705b43", 0, 0.65);
      cylinder(g, 0.15, 0.25, 3.4, "#99714f", 0, 2);
      ball(g, 1.5, "#78996d", 0, 3.8);
      ball(g, 1.1, "#91ab77", 0.9, 4.1, 0.2);
      ball(g, 1, "#668964", -0.9, 3.6, 0.1);
    }
    const collider = new THREE.Mesh(
      new THREE.BoxGeometry(f.w, f.h, f.d),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    collider.position.set(f.x, f.h / 2, f.z);
    scene.add(collider);
    collider.userData.ownResources = true;
    cameraSolids.push(collider);
  }
  const propMeshes = new Map();
  function makeProp(type) {
    const g = new THREE.Group(),
      c = TYPES[type]?.color || "#aaa";
    if (type === "tabletopPlant") {
      cylinder(g, 0.12, 0.09, 0.2, c, 0, 0.1);
      ball(g, 0.15, "#73995c", 0, 0.29);
    } else if (type === "cup") {
      cylinder(g, 0.18, 0.18, 0.38, c, 0, 0.19);
    } else if (type === "notebook") {
      box(g, 0.35, 0.025, 0.24, c, 0, 0.0125, 0, 0.01);
    } else if (type === "plant") {
      cylinder(g, 0.34, 0.24, 0.5, c, 0, 0.25);
      cylinder(g, 0.37, 0.37, 0.1, c, 0, 0.5);
      cylinder(g, 0.3, 0.3, 0.025, "#65513b", 0, 0.56);
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4;
        const leaf = ball(
          g,
          0.3,
          i % 2 ? "#6b9460" : "#91ac69",
          Math.sin(a) * 0.18,
          0.9 + (i % 3) * 0.15,
          Math.cos(a) * 0.18,
        );
        leaf.scale.set(0.55, 1.4, 0.6);
        leaf.rotation.z = Math.sin(a) * 0.6;
      }
    } else if (type === "chair") {
      box(g, 0.72, 0.12, 0.72, c, 0, 0.55);
      box(g, 0.72, 0.5, 0.12, c, 0, 0.99, -0.3);
      for (const x of [-0.27, 0.27])
        for (const z of [-0.27, 0.27])
          box(g, 0.08, 0.53, 0.08, "#385d53", x, 0.26, z);
      for (const x of [-0.28, 0.28])
        box(g, 0.08, 0.5, 0.08, "#385d53", x, 0.78, -0.29);
    } else if (type === "crate") {
      box(g, 0.85, 0.75, 0.85, c, 0, 0.4);
      for (let j = 0; j < 3; j++)
        for (const z of [-0.435, 0.435])
          box(g, 0.86, 0.025, 0.015, "#94623d", 0, 0.2 + j * 0.23, z, 0.005);
      for (const x of [-0.35, 0.35])
        for (const z of [-0.45, 0.45])
          box(g, 0.09, 0.8, 0.04, "#e0ad75", x, 0.4, z);
      for (let i = 0; i < 5; i++)
        ball(
          g,
          0.13,
          "#f1a34b",
          Math.sin(i * 2.4) * 0.24,
          0.83,
          Math.cos(i * 2.4) * 0.24,
        );
    } else if (type === "bin") {
      cylinder(g, 0.34, 0.3, 1, c, 0, 0.5);
      cylinder(g, 0.39, 0.39, 0.1, "#426c70", 0, 1.02);
      cylinder(g, 0.17, 0.17, 0.025, "#294b50", 0, 1.08);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        box(
          g,
          0.025,
          0.8,
          0.025,
          "#92b1ad",
          Math.sin(a) * 0.33,
          0.5,
          Math.cos(a) * 0.33,
          0.005,
        );
      }
    } else if (type === "cone") {
      box(g, 0.65, 0.08, 0.65, "#45595a", 0, 0.04);
      cylinder(g, 0.05, 0.27, 0.75, c, 0, 0.45);
      cylinder(g, 0.12, 0.17, 0.18, "#fff0ce", 0, 0.5);
    } else {
      cylinder(g, 0.36, 0.36, 0.12, c, 0, 0.7);
      for (const x of [-0.22, 0.22])
        for (const z of [-0.22, 0.22])
          box(g, 0.07, 0.64, 0.07, "#b48b64", x, 0.32, z);
    }
    return g;
  }
  for (const p of PROPS) {
    const g = makeProp(p.type);
    g.position.set(p.x, p.y || 0, p.z);
    g.rotation.y = p.yaw;
    g.userData.prop = p;
    world.add(g);
    propMeshes.set(p.id, g);
  }
  // Rescue zone, with a floor marking visible from both approach paths.
  const rescue = label("LOST & FOUND", 3.8, 0.75, "#d08764");
  rescue.rotation.x = -Math.PI / 2;
  rescue.position.set(JAIL.x, 0.025, JAIL.z + 1.3);
  world.add(rescue);
  const jailRing = mesh(
    world,
    geometry("jailring", () => new THREE.TorusGeometry(1.8, 0.045, 8, 64)),
    "#f2c976",
    JAIL.x,
    0.06,
    JAIL.z,
  );
  jailRing.rotation.x = Math.PI / 2;
  for (const x of [-2, 2]) {
    cylinder(world, 0.06, 0.06, 2.3, "#567e72", x, 1.15, 12.5);
    ball(world, 0.12, "#fff2b2", x, 2.35, 12.5);
  }
  const jailSign = label("RESCUE ZONE", 3.6, 0.55);
  jailSign.position.set(0, 2.3, 12.5);
  jailSign.rotation.y = Math.PI;
  world.add(jailSign);
  // Festoon lights across the square.
  for (const z of [-4, 5]) {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const x = -13 + (i * 26) / 30;
      pts.push(
        new THREE.Vector3(x, 5.3 - Math.sin((i / 30) * Math.PI) * 0.8, z),
      );
    }
    const wire = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts),
        40,
        0.018,
        4,
        false,
      ),
      mat("#575c4a"),
    );
    wire.userData.ownGeometry = true;
    world.add(wire);
    for (let i = 0; i < 13; i++) {
      const x = -12 + i * 2,
        y = 5.3 - Math.sin(((x + 13) / 26) * Math.PI) * 0.8;
      const bulb = ball(world, 0.09, "#ffedb3", x, y - 0.15, z);
      bulb.material = mat("#ffedb3", {
        emissive: "#ffcc6d",
        emissiveIntensity: 0.5,
      });
    }
  }
  // Distant silhouettes give the courtyard depth without external assets.
  for (let i = 0; i < 12; i++) {
    const x = -30 + i * 5.5;
    box(
      world,
      5,
      7 + (i % 4) * 2,
      5,
      ["#a9b7aa", "#d1bda7", "#b9b6a3"][i % 3],
      x,
      2,
      -37 - (i % 3) * 3,
      0.1,
    );
  }
  for (const [text, x, z, color] of [
    ["BOTANICAL WALK", 0, -27.6, "#4d7863"],
    ["THE LOADING YARD", 0, 27.6, "#8e6c4c"],
  ]) {
    const sign = label(text, 8, 1, color);
    sign.position.set(x, 2.8, z);
    if (z > 0) sign.rotation.y = Math.PI;
    world.add(sign);
  }
  for (const x of [-21, 21]) {
    const sign = label(x < 0 ? "THE GARDEN" : "WEEKEND MARKET", 6, 0.8);
    sign.position.set(x, 3.5, 8.9);
    world.add(sign);
    for (const z of [-12, 1, 18]) {
      cylinder(world, 0.045, 0.045, 3, "#766a50", x, 1.5, z);
      const canopy = cylinder(
        world,
        0.1,
        2.3,
        0.65,
        x < 0 ? "#e7c784" : "#c48267",
        x,
        3.2,
        z,
      );
      canopy.castShadow = true;
      for (const px of [-2, 2])
        cylinder(world, 0.04, 0.04, 2.5, "#7c8663", x + px, 1.25, -25);
    }
  }
  // Colored paving and arrows make the larger district readable at ground level.
  for (const [text, x, z, color] of [
    ["GARDEN ←", -10, 4, "#63896d"],
    ["MARKET →", 10, 4, "#bb8265"],
    ["YARD ↓", 0, 18, "#a88760"],
  ]) {
    const marker = label(text, 3.5, 0.75, color);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(x, 0.025, z);
    world.add(marker);
  }
  // Batch the static set by material so detailed props do not cost a draw call per part.
  world.updateMatrixWorld(true);
  const batches = new Map(),
    ownedMaterials = new Set();
  world.traverse((o) => {
    if (!o.isMesh) return;
    const cloned = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const geo = cloned.index ? cloned.toNonIndexed() : cloned;
    if (geo !== cloned) cloned.dispose();
    if (!batches.has(o.material)) batches.set(o.material, []);
    batches.get(o.material).push(geo);
    if (o.userData.ownResources) {
      ownedMaterials.add(o.material);
      o.geometry.dispose();
    } else if (o.userData.ownGeometry) o.geometry.dispose();
  });
  world.clear();
  for (const [material, parts] of batches) {
    const merged = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    const m = new THREE.Mesh(merged, material);
    m.castShadow = material.map !== tileTex;
    m.receiveShadow = true;
    m.userData.ownGeometry = true;
    world.add(m);
  }
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowCtx = shadowCanvas.getContext("2d"),
    gradient = shadowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(38,43,29,.32)");
  gradient.addColorStop(1, "rgba(38,43,29,0)");
  shadowCtx.fillStyle = gradient;
  shadowCtx.fillRect(0, 0, 64, 64);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  textures.push(shadowTexture);
  const contactMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
  });
  ownedMaterials.add(contactMaterial);
  const templates = new Map();
  function batchActor(g) {
    g.updateMatrixWorld(true);
    const groups = new Map();
    g.traverse((o) => {
      if (!o.isMesh) return;
      const c = o.geometry.clone().applyMatrix4(o.matrixWorld),
        part = c.index ? c.toNonIndexed() : c;
      if (part !== c) c.dispose();
      if (!groups.has(o.material)) groups.set(o.material, []);
      groups.get(o.material).push(part);
    });
    g.clear();
    for (const [material, parts] of groups) {
      const geo = mergeGeometries(parts);
      parts.forEach((p) => p.dispose());
      geometries.set(`actor-${geometries.size}`, geo);
      const m = new THREE.Mesh(geo, material);
      m.receiveShadow = true;
      g.add(m);
    }
    return g;
  }
  function gunModel(weapon) {
    const g = new THREE.Group(),
      steel = "#343e43",
      grip = "#232d30";
    if (weapon === "glock") {
      box(g, 0.12, 0.12, 0.43, steel, 0, 0, -0.12, 0.012);
      box(g, 0.11, 0.09, 0.32, grip, 0, -0.085, -0.08, 0.01);
      const handle = box(g, 0.105, 0.24, 0.13, grip, 0, -0.21, 0.04, 0.015);
      handle.rotation.x = -0.18;
      box(g, 0.045, 0.03, 0.045, "#101a1c", 0, 0.073, -0.29, 0.003);
      box(g, 0.1, 0.03, 0.025, "#101a1c", 0, 0.073, 0.06, 0.003);
      for (const x of [-0.029, 0.029])
        ball(g, 0.009, "#e3ebce", x, 0.083, 0.075);
      const bore = cylinder(
        g,
        0.035,
        0.035,
        0.015,
        "#121c1e",
        0,
        -0.015,
        -0.345,
      );
      bore.rotation.x = Math.PI / 2;
      for (let i = 0; i < 5; i++)
        box(
          g,
          0.124,
          0.09,
          0.01,
          "#566065",
          0,
          0.005,
          0.015 - i * 0.022,
          0.002,
        );
    } else {
      const barrel = cylinder(g, 0.045, 0.045, 0.83, steel, 0, 0, -0.28);
      barrel.rotation.x = Math.PI / 2;
      const tube = cylinder(g, 0.033, 0.033, 0.63, grip, 0, -0.09, -0.2);
      tube.rotation.x = Math.PI / 2;
      box(g, 0.14, 0.15, 0.3, steel, 0, -0.025, 0.17, 0.012);
      box(g, 0.14, 0.12, 0.27, "#a2744c", 0, -0.12, -0.18, 0.018);
      for (let i = 0; i < 6; i++)
        box(
          g,
          0.15,
          0.125,
          0.015,
          "#684e37",
          0,
          -0.12,
          -0.29 + i * 0.04,
          0.004,
        );
      const stock = box(g, 0.13, 0.21, 0.34, "#a2744c", 0, -0.11, 0.42, 0.022);
      stock.rotation.x = -0.15;
      box(g, 0.14, 0.24, 0.04, grip, 0, -0.13, 0.58, 0.01);
      ball(g, 0.012, "#e8c778", 0, 0.055, -0.65);
    }
    box(g, 0.1, 0.13, 0.16, "#d5a17a", 0.015, -0.23, 0.07, 0.035);
    return g;
  }
  const players = new Map();
  function playerMesh(p) {
    const key = p.role === "hunter" ? `hunter-${p.weapon || "glock"}` : p.type;
    let entry = players.get(p.id);
    if (entry?.key === key) return entry;
    if (entry) scene.remove(entry.group);
    let template = templates.get(key);
    if (!template) {
      const g = p.role === "hunter" ? new THREE.Group() : makeProp(p.type);
      if (p.role === "hunter") {
        box(g, 0.55, 0.75, 0.38, "#e9b65e", 0, 1.03);
        ball(g, 0.23, "#edc19e", 0, 1.65);
        cylinder(g, 0.29, 0.29, 0.12, "#426d63", 0, 1.86);
        for (const x of [-0.17, 0.17]) {
          box(g, 0.18, 0.65, 0.2, "#375b58", x, 0.34);
          box(g, 0.2, 0.13, 0.32, "#304949", x, 0.07, -0.05);
        }
        for (const x of [-0.38, 0.38])
          box(g, 0.16, 0.65, 0.18, "#e9b65e", x, 1.04);
        box(g, 0.38, 0.22, 0.2, "#315d59", 0, 1.62, -0.2);
        box(g, 0.28, 0.1, 0.02, "#b6dcd2", 0, 1.65, -0.31);
      }
      if (p.role === "hunter") {
        const gun = gunModel(p.weapon || "glock");
        gun.position.set(0.25, 1.1, -0.28);
        g.add(gun);
      }
      template = batchActor(g);
      templates.set(key, template);
    }
    const g = template.clone(true);
    const contact = new THREE.Mesh(
      geometry("contact", () => new THREE.PlaneGeometry(1.3, 1.3)),
      contactMaterial,
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.015;
    contact.scale.setScalar(
      p.role === "hunter" ? 1 : Math.min(1, (TYPES[p.type].radius * 2) / 1.3),
    );
    g.add(contact);
    g.position.set(p.x, p.y || 0, p.z);
    g.rotation.y = p.yaw || 0;
    scene.add(g);
    entry = { group: g, key, x: p.x, z: p.z };
    players.set(p.id, entry);
    return entry;
  }
  const gadget = new THREE.Group();
  camera.add(gadget);
  scene.add(camera);
  const guns = {};
  for (const weapon of ["glock", "shotgun"]) {
    const gun = gunModel(weapon);
    gun.position.set(0.29, -0.25, -0.55);
    gadget.add(gun);
    guns[weapon] = gun;
  }
  const flash = ball(gadget, 0.1, "#ffe8a5", 0.29, -0.25, -0.98);
  flash.material = mat("#ffe8a5", {
    emissive: "#ffc34d",
    emissiveIntensity: 4,
  });
  flash.visible = false;
  gadget.traverse((o) => {
    o.castShadow = false;
    o.receiveShadow = false;
  });
  gadget.visible = false;
  let recoil = 0,
    flashTime = 0,
    currentWeapon = "glock";
  function setWeapon(weapon = "glock", reloading = false) {
    currentWeapon = weapon;
    for (const [key, gun] of Object.entries(guns)) gun.visible = key === weapon;
    gadget.rotation.z = reloading ? -0.4 : 0;
    flash.position.z = weapon === "shotgun" ? -1.24 : -0.9;
  }
  const effects = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function effect(e) {
    if (e.kind === "blindThrow") {
      const start = e.path[0], end = e.path[e.path.length - 1];
      const grenade = new THREE.Group();
      cylinder(grenade, 0.16, 0.16, 0.38, "#235f58");
      for (const y of [-0.19, 0.19])
        cylinder(grenade, 0.18, 0.18, 0.07, "#344842", 0, y);
      const band = cylinder(grenade, 0.168, 0.168, 0.09, "#b8ffe5");
      band.material = mat("#b8ffe5", { emissive: "#76efc4", emissiveIntensity: 1.5 });
      cylinder(grenade, 0.07, 0.09, 0.1, "#b5c6b7", 0, 0.25);
      const lever = box(grenade, 0.07, 0.36, 0.06, "#d7dfcb", 0.17, 0.12);
      lever.rotation.z = 0.3;
      mesh(grenade, geometry("blindPin", () => new THREE.TorusGeometry(0.075, 0.014, 5, 12)), "#e2d5a8", -0.1, 0.28, 0);
      grenade.position.set(start.x, start.y, start.z);
      scene.add(grenade);
      effects.push({ mesh: grenade, age: 0, life: Math.max(0.01, end.t), path: e.path, spin: !reducedMotion });
      for (let i = 1; i <= (reducedMotion ? 0 : low ? 3 : 6); i++) {
        const trail = ball(scene, 0.1 - i * 0.009, "#a3ffe0", start.x, start.y, start.z);
        trail.material = new THREE.MeshBasicMaterial({ color: "#a3ffe0", transparent: true, depthWrite: false });
        effects.push({ mesh: trail, age: 0, life: Math.max(0.01, end.t), path: e.path, lag: i * 0.025, opacity: 0.45 });
      }
      return;
    }
    if (e.kind === "blindBurst") {
      const core = ball(scene, 0.15, "#d9ffeb", e.x, e.y, e.z);
      core.material = new THREE.MeshBasicMaterial({ color: "#d9ffeb", transparent: true, depthWrite: false });
      effects.push({ mesh: core, age: 0, life: 0.3, stationary: true, burst: true, opacity: 0.65 });
      for (let i = 0; i < 2; i++) {
        const ring = mesh(scene, geometry("blindWave", () => new THREE.TorusGeometry(1, 0.025, 6, 48)), "#a3ffe0", e.x, e.y + 0.05, e.z);
        ring.rotation.x = i ? -Math.PI / 3 : -Math.PI / 2;
        ring.material = new THREE.MeshBasicMaterial({ color: i ? "#ffe5ad" : "#a3ffe0", transparent: true, depthWrite: false });
        effects.push({ mesh: ring, age: 0, life: 0.55 + i * 0.15, stationary: true, wave: true });
      }
      const count = reducedMotion ? 0 : low ? 6 : 12;
      for (let i = 0; i < count; i++) {
        const spark = ball(scene, 0.055, "#c3ffe8", e.x, e.y, e.z);
        spark.material = new THREE.MeshBasicMaterial({ color: i % 3 ? "#c3ffe8" : "#ffe5ad", transparent: true });
        const angle = i * Math.PI * 2 / count;
        effects.push({ mesh: spark, age: 0, life: 0.55, vx: Math.cos(angle) * 4, vz: Math.sin(angle) * 4, vy: 1 + (i % 3) });
      }
      return;
    }
    if (e.kind === "fire") {
      recoil = e.weapon === "shotgun" ? 1.4 : 0.65;
      flashTime = 0.055;
      return;
    }
    if (e.kind === "shot") {
      for (const end of e.rays) {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(e.origin.x, e.origin.y, e.origin.z),
          new THREE.Vector3(end.x, end.y, end.z),
        ]);
        const line = new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({
            color: "#ffe0a0",
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          }),
        );
        scene.add(line);
        effects.push({
          mesh: line,
          age: 0,
          life: 0.085,
          stationary: true,
          ownGeometry: true,
        });
        const spark = ball(scene, 0.045, "#ffdf9a", end.x, end.y, end.z);
        spark.material = new THREE.MeshBasicMaterial({
          color: "#ffdf9a",
          transparent: true,
        });
        effects.push({ mesh: spark, age: 0, life: 0.16, stationary: true });
      }
      for (const hit of e.impacts)
        effect({
          kind: hit.caught ? "catch" : "hit",
          x: hit.x,
          y: hit.y,
          z: hit.z,
        });
      return;
    }
    if (e.kind === "reload") return;
    if (!Number.isFinite(e.x)) return;
    const color =
      e.kind === "catch"
        ? "#f49875"
        : e.kind === "scan"
          ? "#a3e5d4"
          : e.kind === "rescue"
            ? "#c9f19a"
            : "#ffe29a";
    const ring = mesh(
      scene,
      geometry("fxring", () => new THREE.TorusGeometry(0.6, 0.035, 6, 48)),
      color,
      e.x,
      (e.y || 0) + 0.1,
      e.z,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    effects.push({
      mesh: ring,
      age: 0,
      life: e.kind === "taunt" ? 2 : 1.2,
      ring: true,
    });
    if (["poof", "catch", "rescue", "taunt", "help"].includes(e.kind))
      for (let i = 0; i < 10; i++) {
        const m = ball(scene, 0.07, color, e.x, (e.y || 0) + 0.5, e.z);
        m.material = new THREE.MeshBasicMaterial({ color, transparent: true });
        const a = (i * Math.PI) / 5;
        effects.push({
          mesh: m,
          age: 0,
          life: 1,
          vx: Math.sin(a) * 1.4,
          vz: Math.cos(a) * 1.4,
          vy: 2 + (i % 3) * 0.5,
        });
      }
  }
  function updateEffects(dt) {
    recoil *= Math.exp(-16 * dt);
    flashTime -= dt;
    flash.visible = flashTime > 0;
    flash.scale.setScalar(currentWeapon === "shotgun" ? 1.5 : 1);
    gadget.position.z = -0.22 + recoil * 0.12;
    gadget.rotation.x = -recoil * 0.15;
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      e.age += dt;
      if (e.age > e.life) {
        scene.remove(e.mesh);
        e.mesh.material?.dispose();
        if (e.ownGeometry) e.mesh.geometry.dispose();
        effects.splice(i, 1);
        continue;
      }
      if (e.mesh.material) e.mesh.material.opacity = (e.opacity ?? 1) * (1 - e.age / e.life);
      if (e.path) {
        const pathTime = Math.max(0, Math.min(e.path[e.path.length - 1].t, e.age - (e.lag || 0)));
        const nextIndex = e.path.findIndex((point) => point.t >= pathTime);
        const next = e.path[Math.max(1, nextIndex)], prev = e.path[Math.max(0, nextIndex - 1)];
        const t = Math.min(1, (pathTime - prev.t) / Math.max(0.001, next.t - prev.t));
        e.mesh.position.set(prev.x + (next.x - prev.x) * t, prev.y + (next.y - prev.y) * t, prev.z + (next.z - prev.z) * t);
        if (e.spin) e.mesh.rotation.set(e.age * 9, e.age * 5, 0.4);
      }
      else if (e.wave) e.mesh.scale.setScalar(reducedMotion ? BLIND.radius : BLIND.radius * Math.min(1, e.age / 0.3));
      else if (e.burst) e.mesh.scale.setScalar(reducedMotion ? 2 : 1 + e.age * 12);
      else if (e.ring) e.mesh.scale.setScalar(1 + e.age * 4);
      else if (!e.stationary) {
        e.mesh.position.x += e.vx * dt;
        e.mesh.position.z += e.vz * dt;
        e.mesh.position.y += e.vy * dt;
        e.vy -= 5 * dt;
      }
    }
  }
  const raycaster = new THREE.Raycaster();
  function cameraPosition(target, desired) {
    const dir = desired.clone().sub(target),
      len = dir.length();
    raycaster.set(target, dir.normalize());
    raycaster.far = len;
    const hit = raycaster.intersectObjects(cameraSolids, false)[0];
    return hit
      ? target.clone().addScaledVector(dir, Math.max(0.3, hit.distance - 0.18))
      : desired;
  }
  function resize() {
    const w = container.clientWidth,
      h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    gadget.position.x = Math.min(0.03, camera.aspect * 0.24 - 0.36);
    gadget.position.y = -0.03;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  function dispose() {
    observer.disconnect();
    renderer.dispose();
    renderer.domElement.remove();
    for (const m of materials.values()) m.dispose();
    for (const g of geometries.values()) g.dispose();
    for (const t of textures) t.dispose();
    for (const m of ownedMaterials) m.dispose();
    scene.traverse((o) => {
      if (o.userData.ownResources) {
        o.geometry?.dispose();
        o.material?.dispose();
      }
      if (o.userData.ownGeometry) o.geometry.dispose();
    });
    effects.forEach((e) => {
      e.mesh.material?.dispose();
      if (e.ownGeometry) e.mesh.geometry.dispose();
    });
  }
  return {
    scene,
    camera,
    renderer,
    gadget,
    players,
    playerMesh,
    propMeshes,
    effect,
    setWeapon,
    updateEffects,
    cameraPosition,
    dispose,
  };
}
