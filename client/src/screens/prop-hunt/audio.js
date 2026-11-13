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
  // Keep Chrome's output graph active between short shots instead of reconnecting it.
  const gunBus = ctx.createGain();
  gunBus.gain.value = 0.4;
  gunBus.connect(ctx.destination);
  const silence = ctx.createConstantSource();
  silence.offset.value = 0;
  silence.connect(gunBus);
  silence.start();
  const shots = {};
  for (const weapon of ["glock", "shotgun"]) {
    const shotgun = weapon === "shotgun";
    const clip = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * (shotgun ? 0.85 : 0.32)),
      ctx.sampleRate,
    );
    const samples = clip.getChannelData(0);
    let filtered = 0,
      phase = 0,
      peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const t = i / ctx.sampleRate,
        noise = data[i % data.length];
      const cutoff = (shotgun ? 6500 : 8500) * Math.exp(-t * 7);
      filtered +=
        (noise - filtered) *
        (1 - Math.exp((-2 * Math.PI * cutoff) / ctx.sampleRate));
      phase +=
        (2 *
          Math.PI *
          ((shotgun ? 45 : 60) + (shotgun ? 90 : 125) * Math.exp(-t * 24))) /
        ctx.sampleRate;
      const attack = Math.min(1, t / 0.0005);
      const fade = Math.min(1, (samples.length - i) / (ctx.sampleRate * 0.002));
      let value =
        attack *
        (filtered *
          (shotgun ? 1.15 : 1.0) *
          Math.exp(-t / (shotgun ? 0.065 : 0.048)) +
          Math.sin(phase) *
            (shotgun ? 0.65 : 0.5) *
            Math.exp(-t / (shotgun ? 0.075 : 0.04)) +
          noise * (shotgun ? 0.7 : 0.4) * Math.exp(-t / 0.004));
      if (!shotgun) {
        // Keep the pistol report audible beyond its initial transient.
        value += filtered * 0.16 * Math.exp(-t / 0.085);
        const slide = t - 0.075;
        if (slide >= 0)
          value +=
            Math.min(1, slide / 0.002) *
            Math.exp(-slide / 0.012) *
            (noise * 0.1 + Math.sin(2 * Math.PI * 1600 * slide) * 0.04);
      }
      if (shotgun) {
        value += filtered * 0.14 * Math.exp(-t / 0.18);
        for (const [delay, gain] of [
          [0.024, 0.12],
          [0.055, 0.07],
        ]) {
          const offset = Math.round(delay * ctx.sampleRate);
          if (i >= offset) value += samples[i - offset] * gain;
        }
        for (const [delay, gain, frequency] of [
          [0.32, 0.16, 750],
          [0.49, 0.22, 1250],
        ]) {
          const u = t - delay;
          if (u >= 0)
            value +=
              Math.min(1, u / 0.002) *
              Math.exp(-u / 0.022) *
              (noise * gain + Math.sin(2 * Math.PI * frequency * u) * 0.07);
        }
      }
      samples[i] = value * fade;
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    const gain = (shotgun ? 0.95 : 0.92) / Math.max(peak, 0.001);
    for (let i = 0; i < samples.length; i++) samples[i] *= gain;
    shots[weapon] = clip;
  }
  const resources = { buffer, mixer, shots, gunBus };
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
  if (!ctx || ctx.state !== "running" || volume < 0.015) return false;
  const resources = prepareAudio(ctx);
  if (kind === "shot") {
    const source = ctx.createBufferSource();
    source.buffer = resources.shots[weapon] || resources.shots.glock;
    let gain, stereo;
    if (pan === 0 && volume === 1) {
      source.connect(resources.gunBus);
    } else {
      gain = ctx.createGain();
      stereo = ctx.createStereoPanner();
      gain.gain.value = Math.min(1, volume);
      stereo.pan.value = pan;
      source.connect(gain);
      gain.connect(stereo);
      stereo.connect(resources.gunBus);
    }
    source.onended = () => {
      source.disconnect();
      gain?.disconnect();
      stereo?.disconnect();
    };
    source.start();
    return true;
  }
  const start = ctx.currentTime;
  const output = ctx.createGain(),
    stereo = ctx.createStereoPanner();
  output.gain.value = Math.min(1, volume) * 0.48;
  stereo.pan.value = pan;
  output.connect(stereo);
  stereo.connect(resources.mixer);
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
  if (kind === "blindThrow") {
    noise(0.035, 0.22, 6500);
    tone(1900, 950, 0.045, 0.12, 0, "triangle");
    noise(0.24, 0.24, 2200, 0.04);
    tone(380, 130, 0.2, 0.09, 0.04);
  } else if (kind === "blindBurst") {
    noise(0.16, 0.65, 9000);
    tone(170, 48, 0.32, 0.5);
    noise(0.48, 0.22, 2400, 0.025);
    tone(1180, 620, 0.55, 0.07, 0.035);
    tone(1770, 930, 0.42, 0.035, 0.05);
  } else if (kind === "reload") {
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
