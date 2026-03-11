import React from 'react';

const GAMES = [
  {
    id: 'imposter-party',
    name: 'Imposter Party',
    icon: '\u{1F47F}',
    tagline: 'Find the imposter. Trust no one.',
    description: 'One player is the imposter who doesn\'t know the secret word. Give clues, discuss, and vote to find them!',
    gradient: 'from-indigo-500 to-purple-600',
    glow: 'shadow-indigo-500/30',
    players: '3-32',
    time: '10-30 min',
  },
  {
    id: 'famous-faces',
    name: 'Famous Faces',
    icon: '\u{1F929}',
    tagline: 'Guess the celebrity from hilarious hints!',
    description: '5 cryptic, funny hints are revealed one by one. Race to guess the famous person before anyone else!',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/30',
    players: '2-32',
    time: '10-20 min',
  },
];

export default function HubScreen({ onSelectGame }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12 animate-bounce-in">
        <h1 className="text-5xl md:text-7xl font-bold mb-2">
          <span className="bg-gradient-to-r from-amber-300 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            GAME NIGHT
          </span>
        </h1>
        <p className="text-white/50 mt-4 text-lg">Pick a game and party with your friends!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl animate-slide-up">
        {GAMES.map((game, i) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className={`glass-strong rounded-3xl p-6 text-left transition-all duration-300
              hover:scale-[1.03] active:scale-[0.98] hover:bg-white/15 group`}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {game.icon}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{game.name}</h2>
            <p className={`text-sm font-semibold bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent mb-3`}>
              {game.tagline}
            </p>
            <p className="text-white/40 text-sm mb-4">{game.description}</p>
            <div className="flex gap-4 text-xs text-white/30">
              <span>{game.players} players</span>
              <span>{game.time}</span>
            </div>
            <div className={`mt-4 inline-block px-4 py-2 bg-gradient-to-r ${game.gradient} rounded-xl
              text-sm font-bold shadow-lg ${game.glow} group-hover:shadow-xl transition-all`}>
              Play Now
            </div>
          </button>
        ))}
      </div>

      <p className="text-white/20 text-sm mt-12">More games coming soon...</p>
    </div>
  );
}
