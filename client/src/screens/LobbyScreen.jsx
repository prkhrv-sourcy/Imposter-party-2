import React from 'react';
import Avatar from '../components/Avatar';

export default function LobbyScreen({ room, myId, onStartGame }) {
  const isHost = room.hostId === myId;
  const canStart = room.players.length >= 3;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-12">
      <div className="text-center mb-8 animate-bounce-in">
        <h2 className="text-2xl font-bold text-white/70 mb-2">Room Code</h2>
        <div className="glass-strong inline-block px-8 py-4 rounded-2xl">
          <span className="text-5xl font-bold tracking-[0.3em] font-mono bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {room.code}
          </span>
        </div>
        <p className="text-white/40 mt-2 text-sm">Share this code with friends!</p>
      </div>

      <div className="glass rounded-3xl p-6 w-full max-w-2xl mb-8">
        <h3 className="text-lg font-semibold text-white/70 mb-4">
          Players ({room.players.length}/{room.settings.maxPlayers})
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {room.players.map((player, i) => (
            <div key={player.id} className="flex flex-col items-center gap-1 animate-bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <Avatar avatar={player.avatar} color={player.avatarColor} size="md" />
              <span className="text-xs text-white/70 truncate max-w-[80px] text-center">
                {player.name}
                {player.id === myId && <span className="text-indigo-400"> (you)</span>}
              </span>
              {player.id === room.hostId && (
                <span className="text-xs text-yellow-400">{'\u{1F451}'}</span>
              )}
            </div>
          ))}

          {Array.from({ length: Math.max(0, 3 - room.players.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex flex-col items-center gap-1 opacity-20">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                <span className="text-2xl">?</span>
              </div>
              <span className="text-xs text-white/30">waiting...</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-4 w-full max-w-md text-center mb-6">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-white/40">Rounds</div>
            <div className="text-xl font-bold text-indigo-400">{room.settings.maxRounds}</div>
          </div>
          <div>
            <div className="text-white/40">Turn</div>
            <div className="text-xl font-bold text-indigo-400">{room.settings.turnDuration}s</div>
          </div>
          <div>
            <div className="text-white/40">Vote</div>
            <div className="text-xl font-bold text-indigo-400">{room.settings.voteDuration}s</div>
          </div>
        </div>
      </div>

      {isHost ? (
        <button
          onClick={onStartGame}
          disabled={!canStart}
          className={`
            px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-200 shadow-lg
            ${canStart
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-95 shadow-green-500/30'
              : 'bg-gray-700 cursor-not-allowed opacity-50'
            }
          `}
        >
          {canStart ? 'Start Game!' : `Need ${3 - room.players.length} more player${3 - room.players.length !== 1 ? 's' : ''}`}
        </button>
      ) : (
        <div className="text-white/50 text-lg animate-pulse">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}
