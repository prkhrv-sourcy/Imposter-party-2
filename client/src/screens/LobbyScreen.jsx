import React, { useState } from 'react';
import Avatar from '../components/Avatar';

export default function LobbyScreen({ room, myId, onStartGame }) {
  const isHost = room.hostId === myId;
  const canStart = room.players.length >= 3;
  const [copied, setCopied] = useState(false);

  const shareLink = `${window.location.origin}?room=${room.code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Imposter Party!',
          text: `Join my game with code ${room.code}`,
          url: shareLink
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-12">
      <div className="text-center mb-6 animate-bounce-in">
        <h2 className="text-2xl font-bold text-white/70 mb-2">Room Code</h2>
        <div className="glass-strong inline-block px-8 py-4 rounded-2xl">
          <span className="text-5xl font-bold tracking-[0.3em] font-mono bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {room.code}
          </span>
        </div>
      </div>

      {/* Share link */}
      <div className="flex gap-2 mb-8 animate-fade-in">
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
            ${copied
              ? 'bg-green-500/20 text-green-400'
              : 'glass hover:bg-white/10 text-white/70 hover:text-white'
            }`}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={handleShare}
          className="px-4 py-2 glass rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          Share
        </button>
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
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-white/40">Rounds</div>
            <div className="text-xl font-bold text-indigo-400">{room.settings.maxRounds}</div>
          </div>
          <div>
            <div className="text-white/40">Turn</div>
            <div className="text-xl font-bold text-indigo-400">{room.settings.turnDuration}s</div>
          </div>
          <div>
            <div className="text-white/40">Discuss</div>
            <div className="text-xl font-bold text-indigo-400">{room.settings.discussionDuration}s</div>
          </div>
          <div>
            <div className="text-white/40">Vote</div>
            <div className="text-xl font-bold text-indigo-400">{room.settings.voteDuration}s</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-white/30">
          Theme: {room.settings.theme === 'space' ? '\u{1F680} Space Station' : room.settings.theme === 'noir' ? '\u{1F575}\uFE0F Detective Noir' : '\u{1F335} Jungle Safari'}
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
