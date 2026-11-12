// Each voice: start Hz, end Hz, seconds, gain, delay, waveform, vibrato depth/rate.
export const TAUNTS = [
  {
    id: "whistle",
    name: "Whistle",
    tones: [
      [1100, 1700, 0.28, 0.24, 0, "sine"],
      [1700, 1200, 0.35, 0.22, 0.3, "sine", 24, 9],
    ],
  },
  {
    id: "boing",
    name: "Spring boing",
    tones: [
      [650, 110, 0.75, 0.28, 0, "triangle", 70, 18],
      [1000, 180, 0.45, 0.07, 0, "sine", 35, 22],
    ],
  },
  {
    id: "bike-horn",
    name: "Bike horn",
    tones: [
      [410, 370, 0.23, 0.2, 0, "sawtooth"],
      [520, 470, 0.23, 0.13, 0, "sawtooth"],
      [410, 370, 0.3, 0.2, 0.32, "sawtooth"],
    ],
  },
  {
    id: "clown-horn",
    name: "Clown honk",
    tones: [
      [270, 220, 0.28, 0.23, 0, "square"],
      [335, 290, 0.28, 0.12, 0, "triangle"],
      [450, 180, 0.5, 0.2, 0.3, "sawtooth"],
    ],
  },
  {
    id: "duck",
    name: "Rubber duck",
    tones: [
      [750, 370, 0.16, 0.22, 0, "sawtooth", 80, 28],
      [830, 420, 0.2, 0.22, 0.23, "sawtooth", 85, 25],
    ],
  },
  {
    id: "slide",
    name: "Slide whistle",
    tones: [
      [350, 1900, 0.38, 0.23, 0, "sine"],
      [1900, 250, 0.5, 0.23, 0.4, "sine"],
    ],
  },
  {
    id: "ufo",
    name: "UFO wobble",
    tones: [
      [650, 430, 0.85, 0.2, 0, "sine", 210, 7],
      [1300, 860, 0.8, 0.06, 0, "triangle", 120, 7],
    ],
  },
  {
    id: "giggle",
    name: "Cartoon giggle",
    tones: [
      [420, 240, 0.12, 0.22, 0, "triangle"],
      [520, 300, 0.12, 0.22, 0.17, "triangle"],
      [650, 370, 0.12, 0.22, 0.34, "triangle"],
      [800, 330, 0.22, 0.22, 0.51, "triangle"],
    ],
  },
  {
    id: "bubbles",
    name: "Bubble pops",
    tones: [
      [420, 1300, 0.09, 0.28, 0, "sine"],
      [550, 1600, 0.08, 0.22, 0.17, "sine"],
      [350, 1050, 0.11, 0.26, 0.31, "sine"],
      [700, 2000, 0.08, 0.2, 0.5, "sine"],
    ],
  },
  {
    id: "doorbell",
    name: "Ding dong",
    tones: [
      [880, 880, 0.42, 0.23, 0, "sine"],
      [1320, 1320, 0.23, 0.07, 0, "sine"],
      [660, 660, 0.6, 0.24, 0.38, "sine"],
      [990, 990, 0.3, 0.06, 0.38, "sine"],
    ],
  },
  {
    id: "trumpet",
    name: "Toy trumpet",
    tones: [
      [392, 392, 0.14, 0.16, 0, "sawtooth"],
      [494, 494, 0.14, 0.16, 0.17, "sawtooth"],
      [587, 587, 0.4, 0.17, 0.34, "sawtooth", 8, 7],
    ],
  },
  {
    id: "trombone",
    name: "Sad trombone",
    tones: [
      [330, 310, 0.22, 0.18, 0, "sawtooth"],
      [294, 275, 0.22, 0.18, 0.25, "sawtooth"],
      [262, 245, 0.22, 0.18, 0.5, "sawtooth"],
      [220, 95, 0.65, 0.2, 0.75, "sawtooth", 12, 6],
    ],
  },
];
export const tauntName = (id) =>
  TAUNTS.find((t) => t.id === id)?.name || "Whistle";
