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
      return { getChannelData: () => new Float32Array(n) };
    },
    createGain: () => node("gain"),
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

test("gun layers share one audio timestamp, reuse warmed noise, and clean up on audio completion", () => {
  const f = audioContext();
  prepareAudio(f.ctx);
  assert.equal(f.buffers, 1);
  sound(f.ctx, "shot", 0, "glock");
  assert.equal(f.reads, 1);
  assert.equal(f.starts[0].at, 10.001);
  assert.equal(f.nodes.find((n) => n.kind === "pan").target, f.ctx.destination);
  assert.equal(f.buffers, 1);
  assert.equal(new Set(f.starts.slice(0, 3).map((s) => s.at)).size, 1);
  const output = f.nodes.find((n) => n.kind === "gain");
  assert.equal(output.disconnects, 0);
  for (const s of f.starts) s.node.onended?.();
  assert.equal(output.disconnects, 1);
  sound(f.ctx, "shot", 0, "shotgun");
  assert.equal(f.buffers, 1);
  assert.equal(f.reads, 2);
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
  sound(f.ctx, "shot");
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
