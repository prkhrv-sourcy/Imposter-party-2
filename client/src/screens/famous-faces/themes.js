// Shared theme metadata for Famous Faces.
// Keys MUST stay in sync with the THEMES registry in server/famous-faces.js
// ('mix' is client-only sugar — the server resolves it per round).

export const FF_THEMES = [
  { key: 'celebrities', label: 'Celebrities',        emoji: '\u{1F3AD}', noun: 'celebrity',     blurb: 'Famous people' },
  { key: 'animals',     label: 'Animals',            emoji: '\u{1F43E}', noun: 'animal',        blurb: 'Creatures great & small' },
  { key: 'cities',      label: 'Cities & Landmarks', emoji: '\u{1F3D9}', noun: 'place',         blurb: 'Cities & world wonders' },
  { key: 'movies',      label: 'Movies & TV',        emoji: '\u{1F3AC}', noun: 'movie or show', blurb: 'Films & TV shows' },
  { key: 'foods',       label: 'Foods & Drinks',     emoji: '\u{1F354}', noun: 'food or drink', blurb: 'Tasty things' },
  { key: 'mix',         label: 'Surprise Mix',       emoji: '\u{1F3B2}', noun: 'answer',        blurb: 'A random theme each round' },
];

const THEME_MAP = Object.fromEntries(FF_THEMES.map(t => [t.key, t]));

export function getTheme(key) {
  return THEME_MAP[key] || THEME_MAP.celebrities;
}
