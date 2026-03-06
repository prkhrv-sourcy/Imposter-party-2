import React, { useState } from 'react';

export default function HomeScreen({ onCreateRoom, onJoinRoom }) {
  const [mode, setMode] = useState(null); // null, 'create', 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [maxRounds, setMaxRounds] = useState(3);
  const [turnDuration, setTurnDuration] = useState(30);
  const [voteDuration, setVoteDuration] = useState(20);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return setError('Enter your name!');
    onCreateRoom(name.trim(), { maxRounds, turnDuration, voteDuration });
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
