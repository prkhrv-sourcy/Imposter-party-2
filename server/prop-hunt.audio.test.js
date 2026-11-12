import test from "node:test";
import assert from "node:assert/strict";
import { sound, prepareAudio } from "../client/src/screens/prop-hunt/audio.js";
import { TAUNTS } from "../client/src/screens/prop-hunt/taunts.js";
import { startRound, act } from "./prop-hunt.js";

function audioContext() {
  const nodes = [],
    starts = [];
  let reads = 0,
    buffers = 0;
  function node(kind) {
    const param = () => ({
      value: 0,
      setValueAtTime() {},
      exponentialRampToValueAtTime() {},
    });
    const n = {
      kind,
      gain: param(),
      offset: param(),
      frequency: param(),
      pan: param(),
      threshold: param(),
      knee: param(),
      ratio: param(),
      attack: param(),
      release: param(),
      disconnects: 0,
      connect(target) {
        this.target = target;
      },
      disconnect() {
        this.disconnects++;
      },
      start(at) {
        starts.push({ kind, at, node: this });
      },
      stop(at) {
        this.stopAt = at;
      },
    };
    nodes.push(n);
    return n;
  }
  const ctx = {
    state: "running",
    sampleRate: 8000,
    destination: {},
    get currentTime() {
      return 10 + ++reads * 0.001;
    },
    createBuffer(c, n) {
      buffers++;
      const data = new Float32Array(n);
      return { getChannelData: () => data };
    },
    createGain: () => node("gain"),
    createConstantSource: () => node("silence"),
    createStereoPanner: () => node("pan"),
    createDynamicsCompressor: () => node("compressor"),
    createOscillator: () => node("tone"),
    createBiquadFilter: () => node("filter"),
    createBufferSource: () => node("noise"),
  };
  return {
    ctx,
    nodes,
    starts,
    get reads() {
      return reads;
    },
    get buffers() {
      return buffers;
    },
  };
}

test("every gunshot plays one pre-generated buffer immediately, reuses it and cleans up", () => {
  const f = audioContext(),
    resources = prepareAudio(f.ctx);
  assert.equal(f.buffers, 3);
  for (const weapon of ["glock", "glock", "shotgun"]) {
    const count = f.starts.length,
      nodes = f.nodes.length;
    assert.equal(sound(f.ctx, "shot", 0, weapon), true);
    assert.equal(f.starts.length, count + 1);
    const shot = f.starts.at(-1);
    assert.equal(shot.node.buffer, resources.shots[weapon]);
    assert.equal(shot.at, undefined, "start immediately on the audio clock");
    assert.equal(f.buffers, 3);
    const created = f.nodes.slice(nodes);
    assert.deepEqual(
      created.map((n) => n.kind),
      ["noise"],
    );
    assert.equal(created[0].target, resources.gunBus);
    shot.node.onended();
    assert.ok(created.every((n) => n.disconnects === 1));
  }
});
test("all 12 taunts have distinct valid voices and use the same synchronized audio path", () => {
  assert.equal(TAUNTS.length, 12);
  assert.equal(new Set(TAUNTS.map((t) => t.id)).size, 12);
  assert.equal(new Set(TAUNTS.map((t) => JSON.stringify(t.tones))).size, 12);
  for (const taunt of TAUNTS) {
    for (const [from, to, duration, gain, delay, type] of taunt.tones) {
      assert.ok(
        from > 0 &&
          to > 0 &&
          duration > 0 &&
          gain > 0 &&
          gain < 1 &&
          delay >= 0,
      );
      assert.ok(["sine", "triangle", "square", "sawtooth"].includes(type));
    }
    const f = audioContext();
    prepareAudio(f.ctx);
    f.starts.length = 0;
    sound(f.ctx, "taunt", 0.4, "glock", 0.5, taunt.id);
    assert.equal(f.reads, 1);
    assert.ok(f.starts.length >= taunt.tones.length);
    assert.ok(
      f.starts.every((s) => Number.isFinite(s.at) && s.node.stopAt > s.at),
    );
  }
});
test("silent and suspended audio schedules nothing", () => {
  const f = audioContext();
  f.ctx.state = "suspended";
  assert.equal(sound(f.ctx, "shot"), false);
  assert.equal(f.starts.length, 0);
  f.ctx.state = "running";
  sound(f.ctx, "taunt", 0, "glock", 0, "whistle");
  assert.equal(f.starts.length, 0);
});
test("prop taunts are randomly assigned from the full set and persist for manual and rescue calls", () => {
  const r = {
    round: 0,
    players: Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      name: String(i),
      connected: true,
      score: 0,
    })),
  };
  startRound(r, 1000);
  const props = r.players.filter((p) => p.role === "prop"),
    valid = new Set(TAUNTS.map((t) => t.id));
  assert.equal(new Set(props.slice(0, 12).map((p) => p.tauntId)).size, 12);
  assert.ok(props.every((p) => valid.has(p.tauntId)));
  const p = props[0],
    assigned = p.tauntId;
  assert.equal(act(r, p, "taunt", 6000).event.tauntId, assigned);
  Object.assign(p, { x: -5.2, z: -5.7 });
  act(r, p, "change", 6500);
  assert.equal(p.tauntId, assigned);
  p.caught = true;
  p.tauntAt = 0;
  assert.equal(act(r, p, "taunt", 7000).event.tauntId, assigned);
});

test("persistent gun output survives full magazines and shotgun has distinct blast and pump energy", () => {
  const f = audioContext(),
    resources = prepareAudio(f.ctx);
  const bus = resources.gunBus;
  for (let i = 0; i < 60; i++) {
    sound(f.ctx, "shot", 0, i % 2 ? "glock" : "shotgun");
    f.starts.at(-1).node.onended();
  }
  assert.equal(bus.disconnects, 0);
  assert.equal(f.nodes.filter((n) => n.kind === "silence").length, 1);
  assert.equal(f.nodes.find((n) => n.kind === "silence").offset.value, 0);
  for (const [weapon, buffer] of Object.entries(resources.shots)) {
    const samples = buffer.getChannelData(0);
    assert.ok(samples.every(Number.isFinite));
    assert.ok(Math.max(...samples.map(Math.abs)) <= 0.951);
    const energy = (from, to) =>
      samples
        .slice(from * f.ctx.sampleRate, to * f.ctx.sampleRate)
        .reduce((sum, v) => sum + v * v, 0);
    assert.ok(energy(0, 0.01) > 0.01, "blast starts immediately");
    if (weapon === "glock") {
      const tail = samples.slice(
        0.025 * f.ctx.sampleRate,
        0.09 * f.ctx.sampleRate,
      );
      const rms = Math.sqrt(
        tail.reduce((sum, v) => sum + v * v, 0) / tail.length,
      );
      assert.ok(
        rms > 0.035,
        "Glock has a sustained audible report, not only a short click",
      );
    }
    if (weapon === "shotgun") {
      assert.ok(energy(0.32, 0.38) > energy(0.24, 0.3), "pump back");
      assert.ok(energy(0.49, 0.55) > energy(0.41, 0.47), "pump forward");
    }
  }
});
