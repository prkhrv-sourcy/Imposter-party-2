import React, { useState } from 'react';

export default function FamousFacesHome({ onCreateRoom, onJoinRoom, onBack, initialRoomCode = '' }) {
  const [mode, setMode] = useState(initialRoomCode ? 'join' : null);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [rounds, setRounds] = useState(5);
  const [roundDuration, setRoundDuration] = useState(90);
  const [hintInterval, setHintInterval] = useState(10);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return setError('Enter your name!');
    onCreateRoom(name.trim(), { rounds, roundDuration, hintInterval });
  };

  const handleJoin = () => {
    if (!name.trim()) return setError('Enter your name!');
    if (!roomCode.trim()) return setError('Enter room code!');
    onJoinRoom(name.trim(), roomCode.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <button
        onClick={onBack}
        className="fixed top-4 left-4 text-white/40 hover:text-white text-sm z-50 flex items-center gap-1"
      >
        {'\u2190'} Back to Games
      </button>

      <div className="text-center mb-12 animate-bounce-in">
        <div className="text-6xl mb-4">{'\u{1F929}'}</div>
        <h1 className="text-5xl md:text-7xl font-bold mb-2">
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
            FAMOUS
          </span>
        </h1>
        <h2 className="text-3xl md:text-5xl font-bold text-white/90">
          FACES
        </h2>
        <p className="text-white/50 mt-4 text-lg">Guess the celebrity from hilarious hints!</p>
      </div>

      {!mode && (
        <div className="flex gap-4 animate-slide-up">
          <button
            onClick={() => setMode('create')}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl font-bold text-lg
              hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-amber-500/30"
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
                  placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400
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
                    text-2xl tracking-[0.3em] placeholder-white/30 focus:outline-none focus:border-amber-400
                    focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                />
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-white/60 text-sm mb-1 flex justify-between">
                    <span>Rounds</span>
                    <span className="text-amber-400">{rounds}</span>
                  </label>
                  <input
                    type="range" min="1" max="15" value={rounds}
                    onChange={e => setRounds(+e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 flex justify-between">
                    <span>Round Duration</span>
                    <span className="text-amber-400">{roundDuration}s</span>
                  </label>
                  <input
                    type="range" min="30" max="180" step="10" value={roundDuration}
                    onChange={e => setRoundDuration(+e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-1 flex justify-between">
                    <span>Hint Reveal Interval</span>
                    <span className="text-amber-400">{hintInterval}s</span>
                  </label>
                  <input
                    type="range" min="5" max="30" step="5" value={hintInterval}
                    onChange={e => setHintInterval(+e.target.value)}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm animate-shake">{error}</p>
            )}

            <button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold text-lg
                hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-500/30"
            >
              {mode === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
