import React, { useState, useEffect } from 'react';
import PlayerCard from '../components/PlayerCard';
import Timer from '../components/Timer';
import Avatar from '../components/Avatar';

export default function GameScreen({ room, myId, onDescribe, onVote, onContinue }) {
  const [clueText, setClueText] = useState('');
  const [votedFor, setVotedFor] = useState(null);

  const me = room.players.find(p => p.id === myId);
  const isHost = room.hostId === myId;
  const currentTurnPlayer = room.state === 'describing'
    ? room.players.find(p => p.id === room.turnOrder[room.currentTurnIndex])
    : null;
  const isMyTurn = currentTurnPlayer?.id === myId;

  useEffect(() => {
    setVotedFor(null);
  }, [room.state]);

  const handleDescribe = () => {
    if (!clueText.trim()) return;
    onDescribe(clueText.trim());
    setClueText('');
  };

  const handleVote = (targetId) => {
    setVotedFor(targetId);
    onVote(targetId);
  };

  const voteCounts = {};
  if (room.state === 'roundResult' || room.state === 'gameOver') {
    Object.values(room.votes).forEach(id => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
    });
  }

  return (
    <div className="min-h-screen flex flex-col p-4 pt-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-white/40 text-sm">Category</div>
          <div className="text-xl font-bold text-purple-300">{room.category}</div>
        </div>
        <div className="text-center">
          <div className="text-white/40 text-sm">Round</div>
          <div className="text-xl font-bold text-indigo-300">
            {room.currentRound + 1}/{room.settings.maxRounds}
          </div>
        </div>
        <Timer endTime={room.timerEnd} />
      </div>

      {/* My word */}
      {me && room.state !== 'gameOver' && (
        <div className={`glass rounded-2xl p-4 mb-6 text-center animate-fade-in ${me.isImposter ? 'border-red-500/30 bg-red-500/5' : ''}`}>
          {me.isImposter ? (
            <div>
              <span className="text-red-400 text-lg font-bold">{'\u{1F47F}'} You are the IMPOSTER!</span>
              <p className="text-white/40 text-sm mt-1">You don't know the word or category. Blend in!</p>
            </div>
          ) : (
            <div>
              <span className="text-white/50 text-sm">Your word:</span>
              <div className="text-3xl font-bold text-emerald-400 mt-1">{me.word}</div>
            </div>
          )}
        </div>
      )}

      {/* Players grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 mb-6">
        {room.players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isMe={player.id === myId}
            isHost={player.id === room.hostId}
            isTurn={currentTurnPlayer?.id === player.id}
            votingMode={room.state === 'voting' && me?.alive}
            votedFor={votedFor}
            onVote={handleVote}
            voteCount={voteCounts[player.id]}
          />
        ))}
      </div>

      {/* Descriptions log */}
      {room.descriptions.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-6 max-h-60 overflow-y-auto">
          <h3 className="text-white/50 text-sm font-semibold mb-3">Clues Given</h3>
          <div className="space-y-3">
            {room.descriptions.map((desc, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-up">
                <Avatar avatar={desc.avatar} color={desc.avatarColor} size="sm" />
                <div>
                  <span className="text-white/60 text-sm font-semibold">{desc.playerName}</span>
                  <p className="text-white text-sm mt-0.5">"{desc.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Describing phase - current turn */}
      {room.state === 'describing' && (
        <div className="glass-strong rounded-2xl p-6 text-center animate-slide-up">
          <Timer endTime={room.timerEnd} large />
          {isMyTurn ? (
            <div className="mt-4">
              <h3 className="text-xl font-bold text-yellow-300 mb-4">
                {'\u{1F3A4}'} Your turn! Give a clue
              </h3>
              <div className="flex gap-3 max-w-lg mx-auto">
                <input
                  type="text"
                  value={clueText}
                  onChange={e => setClueText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDescribe()}
                  placeholder={me?.isImposter ? 'Describe something convincing...' : 'Describe your word...'}
                  maxLength={200}
                  autoFocus
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white
                    placeholder-white/30 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
                />
                <button
                  onClick={handleDescribe}
                  disabled={!clueText.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold
                    hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Avatar
                avatar={currentTurnPlayer?.avatar}
                color={currentTurnPlayer?.avatarColor}
                size="lg"
                highlight
                className="mx-auto mb-3"
              />
              <h3 className="text-lg font-semibold text-white/70">
                {currentTurnPlayer?.name} is thinking of a clue...
              </h3>
            </div>
          )}
        </div>
      )}

      {/* Voting phase */}
      {room.state === 'voting' && (
        <div className="glass-strong rounded-2xl p-6 text-center animate-slide-up">
          <Timer endTime={room.timerEnd} large />
          <h3 className="text-2xl font-bold text-red-300 mb-2 mt-4">
            {'\u{1F5F3}\uFE0F'} Vote for the Imposter!
          </h3>
          <p className="text-white/40 text-sm">
            {me?.alive
              ? (votedFor ? 'Vote cast! Waiting for others...' : 'Click a player above to vote')
              : 'You are eliminated. Watching the vote...'}
          </p>
        </div>
      )}

      {/* Round result */}
      {room.state === 'roundResult' && (
        <div className="glass-strong rounded-2xl p-6 text-center animate-bounce-in">
          {room.eliminatedThisRound ? (
            <div>
              <Avatar
                avatar={room.eliminatedThisRound.avatar}
                color={room.eliminatedThisRound.avatarColor}
                size="lg"
                alive={false}
                className="mx-auto mb-3"
              />
              <h3 className="text-2xl font-bold mb-2">
                {room.eliminatedThisRound.name} was eliminated!
              </h3>
              <p className={`text-lg font-semibold ${room.eliminatedThisRound.wasImposter ? 'text-green-400' : 'text-red-400'}`}>
                {room.eliminatedThisRound.wasImposter ? 'They WERE the imposter!' : 'They were NOT the imposter...'}
              </p>

              {/* Vote breakdown */}
              <div className="mt-4 space-y-2">
                <h4 className="text-white/50 text-sm">Vote Breakdown</h4>
                {Object.entries(room.votes).map(([voterId, targetId]) => {
                  const voter = room.players.find(p => p.id === voterId);
                  const target = room.players.find(p => p.id === targetId);
                  return (
                    <div key={voterId} className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-white/60">{voter?.name}</span>
                      <span className="text-white/30">{'\u2192'}</span>
                      <span className="text-red-300">{target?.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-2xl font-bold text-yellow-300 mb-2">No one was eliminated!</h3>
              <p className="text-white/50">It was a tie or no votes were cast.</p>
            </div>
          )}

          {isHost && (
            <button
              onClick={onContinue}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold
                hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/30"
            >
              Next Round {'\u2192'}
            </button>
          )}
          {!isHost && (
            <p className="mt-4 text-white/40 text-sm animate-pulse">Waiting for host to continue...</p>
          )}
        </div>
      )}

      {/* Game Over */}
      {room.state === 'gameOver' && <GameOverOverlay room={room} myId={myId} isHost={isHost} onRestart={onContinue} />}
    </div>
  );
}

function GameOverOverlay({ room, myId, isHost, onRestart }) {
  const me = room.players.find(p => p.id === myId);
  const imposter = room.players.find(p => p.isImposter);
  const teamWon = room.winner === 'team';
  const iWon = (teamWon && !me?.isImposter) || (!teamWon && me?.isImposter);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in">
        <div className="text-6xl mb-4">
          {teamWon ? '\u{1F389}' : '\u{1F47F}'}
        </div>
        <h2 className="text-3xl font-bold mb-2">
          {teamWon ? (
            <span className="text-green-400">Team Wins!</span>
          ) : (
            <span className="text-red-400">Imposter Wins!</span>
          )}
        </h2>
        <p className="text-xl mb-4">
          {iWon ? (
            <span className="text-yellow-300">You won! {'\u{1F3C6}'}</span>
          ) : (
            <span className="text-white/60">Better luck next time!</span>
          )}
        </p>

        {imposter && (
          <div className="glass rounded-2xl p-4 mb-6">
            <p className="text-white/50 text-sm mb-2">The imposter was:</p>
            <div className="flex items-center justify-center gap-3">
              <Avatar avatar={imposter.avatar} color={imposter.avatarColor} size="md" />
              <span className="text-xl font-bold text-red-400">{imposter.name}</span>
            </div>
            <p className="text-white/40 text-sm mt-2">
              The word was: <span className="text-emerald-400 font-bold">{room.word || room.players.find(p => !p.isImposter)?.word}</span>
            </p>
          </div>
        )}

        {/* Final vote breakdown */}
        {Object.keys(room.votes).length > 0 && (
          <div className="mb-6">
            <h4 className="text-white/50 text-sm mb-2">Final Votes</h4>
            {Object.entries(room.votes).map(([voterId, targetId]) => {
              const voter = room.players.find(p => p.id === voterId);
              const target = room.players.find(p => p.id === targetId);
              return (
                <div key={voterId} className="flex items-center justify-center gap-2 text-sm">
                  <span className="text-white/60">{voter?.name}</span>
                  <span className="text-white/30">{'\u2192'}</span>
                  <span className="text-red-300">{target?.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* All players reveal */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {room.players.map(p => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <Avatar avatar={p.avatar} color={p.avatarColor} size="sm" alive={p.alive} />
              <span className="text-xs text-white/60 truncate max-w-[60px]">{p.name}</span>
              {p.isImposter && <span className="text-xs text-red-400">{'\u{1F47F}'}</span>}
            </div>
          ))}
        </div>

        {isHost && (
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-lg
              hover:scale-105 active:scale-95 transition-all shadow-lg shadow-green-500/30"
          >
            Play Again!
          </button>
        )}
      </div>
    </div>
  );
}
