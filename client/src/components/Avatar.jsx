import React from 'react';

const AVATAR_EMOJIS = {
  fox: '\u{1F98A}', cat: '\u{1F431}', dog: '\u{1F436}', panda: '\u{1F43C}',
  koala: '\u{1F428}', rabbit: '\u{1F430}', owl: '\u{1F989}', penguin: '\u{1F427}',
  bear: '\u{1F43B}', tiger: '\u{1F42F}', lion: '\u{1F981}', monkey: '\u{1F435}',
  frog: '\u{1F438}', duck: '\u{1F986}', whale: '\u{1F433}', dolphin: '\u{1F42C}',
  octopus: '\u{1F419}', unicorn: '\u{1F984}', dragon: '\u{1F432}', phoenix: '\u{1F985}',
  wolf: '\u{1F43A}', deer: '\u{1F98C}', raccoon: '\u{1F99D}', sloth: '\u{1F9A5}',
  otter: '\u{1F9A6}', hedgehog: '\u{1F994}', flamingo: '\u{1F9A9}', parrot: '\u{1F99C}',
  turtle: '\u{1F422}', bee: '\u{1F41D}', butterfly: '\u{1F98B}', snail: '\u{1F40C}'
};

export default function Avatar({ avatar, color, size = 'md', alive = true, highlight = false, className = '' }) {
  const sizes = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-3xl',
    lg: 'w-20 h-20 text-5xl',
    xl: 'w-28 h-28 text-7xl'
  };

  return (
    <div
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center
        transition-all duration-300 relative
        ${alive ? '' : 'opacity-40 grayscale'}
        ${highlight ? 'animate-pulse-glow ring-2 ring-indigo-400' : ''}
        ${className}
      `}
      style={{
        background: `linear-gradient(135deg, ${color}33, ${color}66)`,
        border: `2px solid ${color}`,
        boxShadow: alive ? `0 4px 15px ${color}44` : 'none'
      }}
    >
      <span className={alive ? '' : 'opacity-50'}>
        {AVATAR_EMOJIS[avatar] || '\u{1F47E}'}
      </span>
      {!alive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red-400 text-2xl font-bold">{'\u2716'}</span>
        </div>
      )}
    </div>
  );
}
