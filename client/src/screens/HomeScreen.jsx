import React, { useState } from 'react';

const THEMES = [
  { id: 'space', name: 'Space Station', icon: '\u{1F680}', desc: 'Among the stars' },
  { id: 'noir', name: 'Detective Noir', icon: '\u{1F575}\uFE0F', desc: 'Mysterious vibes' },
  { id: 'jungle', name: 'Jungle Safari', icon: '\u{1F335}', desc: 'Wild & tropical' },
];

export default function HomeScreen({ onCreateRoom, onJoinRoom, initialRoomCode = '' }) {
  const [mode, setMode] = useState(initialRoomCode ? 'join' : null);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [maxRounds, setMaxRounds] = useState(3);
  const [turnDuration, setTurnDuration] = useState(30);
  const [discussionDuration, setDiscussionDuration] = useState(45);
  const [voteDuration, setVoteDuration] = useState(20);
  const [theme, setTheme] = useState('space');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return setError('Enter your name!');
    onCreateRoom(name.trim(), { maxRounds, turnDuration, discussionDuration, voteDuration, theme });
  };

  const handleJoin = () => {
    if (!name.trim()) return setError('Enter your name!');
    if (!roomCode.trim()) return setError('Enter room code!');
    onJoinRoom(name.trim(), roomCode.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12 animate-bounce-in">
        <h1 className="text-6xl md:text-8xl font-bold mb-2">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            IMPOSTER
          </span>
        </h1>
        <h2 className="text-4xl md:text-6xl font-bold text-white/90">
          PARTY
        </h2>
        <p className="text-white/50 mt-4 text-lg">Find the imposter. Trust no one.</p>
      </div>

      {!mode && (
        <div className="flex gap-4 animate-slide-up">
          <button
            onClick={() => setMode('create')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl font-bold text-lg
              hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-500/30"
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className="px-8 py-4 glass-strong rounded-2xl font-bold text-lg
              hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Join Room
          </button>
        </div>
      )}

      {mode && (
        <div className="glass-strong rounded-3xl p-8 w-full max-w-md animate-slide-up">
          <button
            onClick={() => { setMode(null); setError(''); }}
            className="text-white/50 hover:text-white mb-4 text-sm"
          >
            {'\u2190'} Back
          </button>

          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white
                  placeholder-white/30 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400
                  transition-all"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="text-white/60 text-sm mb-1 block">Room Code</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center
                    text-2xl tracking-[0.3em] placeholder-white/30 focus:outline-none focus:border-indigo-400
                    focus:ring-1 focus:ring-indigo-400 transition-all font-mono"
                />
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-3 pt-2">
                {/* Theme picker */}
                <div>
                  <label className="text-white/60 text-sm mb-2 block">Theme</label>
                  <div className="grid grid-cols-3 gap-2">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-3 rounded-xl text-center transition-all duration-200 ${
                          theme === t.id
                            ? 'bg-indigo-500/30 ring-2 ring-indigo-400 scale-105'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-2xl">{t.icon}</div>
                        <div className="text-xs text-white/70 mt-1">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-1 flex justify-between">
                    <span>Max Rounds</span>
                    <span className="text-indigo-400">{maxRounds}</span>
                  </label>
                  <input
                    type="range" min="1" max="10" value={maxRounds}
                    onChange={e => setMaxRounds(+e.target.value)}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 flex justify-between">
                    <span>Turn Duration</span>
                    <span className="text-indigo-400">{turnDuration}s</span>
                  </label>
                  <input
                    type="range" min="10" max="60" step="5" value={turnDuration}
                    onChange={e => setTurnDuration(+e.target.value)}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 flex justify-between">
                    <span>Discussion Time</span>
                    <span className="text-indigo-400">{discussionDuration}s</span>
                  </label>
                  <input
                    type="range" min="15" max="120" step="5" value={discussionDuration}
                    onChange={e => setDiscussionDuration(+e.target.value)}
                    className="w-full accent-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 flex justify-between">
                    <span>Vote Duration</span>
                    <span className="text-indigo-400">{voteDuration}s</span>
                  </label>
                  <input
                    type="range" min="10" max="60" step="5" value={voteDuration}
                    onChange={e => setVoteDuration(+e.target.value)}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm animate-shake">{error}</p>
            )}

            <button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-lg
                hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-indigo-500/30"
            >
              {mode === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
