import { TAUNTS } from "./taunts.js";
const audioResources = new WeakMap();

export function prepareAudio(ctx) {
  if (audioResources.has(ctx)) return audioResources.get(ctx);
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const mixer = ctx.createDynamicsCompressor();
  mixer.threshold.value = -12;
  mixer.knee.value = 15;
  mixer.ratio.value = 6;
  mixer.attack.value = 0.003;
  mixer.release.value = 0.15;
  mixer.connect(ctx.destination);
  const shots = {};
  for (const weapon of ["glock", "shotgun"]) {
    const shotgun = weapon === "shotgun";
    const clip = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * (shotgun ? 0.4 : 0.22)),
      ctx.sampleRate,
    );
    const samples = clip.getChannelData(0);
    let filtered = 0,
      phase = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / ctx.sampleRate,
        noise = data[i % data.length];
      const cutoff = (shotgun ? 4800 : 8500) * Math.exp(-t * 9);
      filtered +=
        (noise - filtered) *
        (1 - Math.exp((-2 * Math.PI * cutoff) / ctx.sampleRate));
      phase +=
        (2 * Math.PI * (shotgun ? 115 : 185) * Math.exp(-t * 12)) /
        ctx.sampleRate;
      const attack = Math.min(1, t / 0.0005);
      const fade = Math.min(1, (samples.length - i) / (ctx.sampleRate * 0.002));
      samples[i] =
        attack *
        fade *
        (filtered *
          (shotgun ? 0.9 : 0.65) *
          Math.exp(-t / (shotgun ? 0.045 : 0.022)) +
          Math.sin(phase) * 0.5 * Math.exp(-t / (shotgun ? 0.055 : 0.028)) +
          noise * 0.4 * Math.exp(-t / 0.004));
    }
    shots[weapon] = clip;
  }
  const resources = { buffer, mixer, shots };
  audioResources.set(ctx, resources);
  return resources;
}

// Gun clips are generated once on activation; firing only starts one cached source.
export function sound(
  ctx,
  kind,
  pan = 0,
  weapon = "glock",
  volume = 1,
  tauntId,
) {
  if (!ctx || ctx.state !== "running" || volume < 0.015) return;
  const resources = prepareAudio(ctx);
  const start = ctx.currentTime;
  const output = ctx.createGain(),
    stereo = ctx.createStereoPanner();
  output.gain.value = Math.min(1, volume) * (kind === "shot" ? 0.3 : 0.48);
  stereo.pan.value = pan;
  output.connect(stereo);
  // Gun transients bypass compressor look-ahead to keep the trigger responsive.
  stereo.connect(kind === "shot" ? ctx.destination : resources.mixer);
  if (kind === "shot") {
    const source = ctx.createBufferSource();
    source.buffer = resources.shots[weapon] || resources.shots.glock;
    source.connect(output);
    source.onended = () => {
      source.disconnect();
      output.disconnect();
      stereo.disconnect();
    };
    source.start(start);
    return;
  }
  let voices = 0;
  const ended = () => {
    if (--voices === 0) {
      output.disconnect();
      stereo.disconnect();
    }
  };
  function tone(
    freq,
    end,
    duration,
    gain,
    delay = 0,
    type = "sine",
    depth = 0,
    rate = 0,
  ) {
    const osc = ctx.createOscillator(),
      envelope = ctx.createGain(),
      t = start + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(end, t + duration);
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.exponentialRampToValueAtTime(gain, t + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    let vibrato, modulation;
    if (depth) {
      vibrato = ctx.createOscillator();
      modulation = ctx.createGain();
      vibrato.frequency.value = rate;
      modulation.gain.value = depth;
      vibrato.connect(modulation);
      modulation.connect(osc.frequency);
      vibrato.start(t);
      vibrato.stop(t + duration + 0.01);
    }
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value =
      type === "sawtooth" || type === "square" ? 2400 : 12000;
    osc.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    voices++;
    osc.start(t);
    osc.stop(t + duration + 0.01);
    osc.onended = () => {
      osc.disconnect();
      envelope.disconnect();
      filter.disconnect();
      vibrato?.disconnect();
      modulation?.disconnect();
      ended();
    };
  }
  function noise(duration, gain, cutoff, delay = 0) {
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      envelope = ctx.createGain(),
      t = start + delay;
    source.buffer = resources.buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, t);
    filter.frequency.exponentialRampToValueAtTime(350, t + duration);
    envelope.gain.setValueAtTime(gain, t);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    voices++;
    source.start(t);
    source.stop(t + duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      envelope.disconnect();
      ended();
    };
  }
  if (kind === "reload") {
    for (const delay of weapon === "shotgun"
      ? [0.03, 0.45, 1.1, 1.85]
      : [0.03, 0.55, 1.15]) {
      noise(0.055, 0.3, 5000, delay);
      tone(480, 160, 0.035, 0.13, delay, "triangle");
    }
  } else if (kind === "taunt" || kind === "help") {
    const taunt = TAUNTS.find((t) => t.id === tauntId) || TAUNTS[0];
    taunt.tones.forEach((voice) => tone(...voice));
  } else {
    const notes =
      kind === "catch"
        ? [660, 880, 1100]
        : kind === "hit"
          ? [1000]
          : kind === "hunt"
            ? [220, 330, 440]
            : [550, 740];
    notes.forEach((freq, i) =>
      tone(
        freq,
        freq * 0.98,
        0.16,
        0.15,
        i * 0.1,
        kind === "taunt" ? "triangle" : "sine",
      ),
    );
  }
}
