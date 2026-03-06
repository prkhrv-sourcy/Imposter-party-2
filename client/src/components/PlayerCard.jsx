import React from 'react';
import Avatar from './Avatar';

export default function PlayerCard({
  player, isMe, isHost, isTurn, onVote, votingMode, votedFor, voteCount
}) {
  const canVote = votingMode && player.alive && !isMe;

  return (
    <div
      onClick={() => canVote && onVote?.(player.id)}
      className={`
        glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all duration-300
        ${isTurn ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/20' : ''}
        ${canVote ? 'cursor-pointer hover:scale-105 hover:bg-white/10 active:scale-95' : ''}
        ${votedFor === player.id ? 'ring-2 ring-red-400 bg-red-500/10' : ''}
        ${isMe ? 'bg-indigo-500/10' : ''}
        ${!player.alive ? 'opacity-50' : ''}
        animate-fade-in
      `}
    >
      <Avatar
        avatar={player.avatar}
        color={player.avatarColor}
        size="md"
        alive={player.alive}
        highlight={isTurn}
      />
      <div className="text-center">
        <div className="font-semibold text-sm truncate max-w-[100px]">
          {player.name}
          {isMe && <span className="text-indigo-400 ml-1">(you)</span>}
        </div>
        {isHost && (
          <span className="text-xs text-yellow-400">{'\u{1F451}'} Host</span>
        )}
        {player.isImposter !== undefined && player.isImposter && (
          <span className="text-xs text-red-400 font-bold block">{'\u{1F47F}'} IMPOSTER</span>
        )}
      </div>
      {voteCount !== undefined && voteCount > 0 && (
        <div className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full font-bold">
          {voteCount} vote{voteCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
