import React, { useState, useEffect, useRef } from 'react';
import PlayerCard from '../components/PlayerCard';
import Timer from '../components/Timer';
import Avatar from '../components/Avatar';

function Confetti() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#82E0AA', '#F7DC6F', '#BB8FCE'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`
          }}
        />
      ))}
    </div>
  );
}

function VoteRevealCard({ voter, target, revealed }) {
  return (
    <div className={`
      flex items-center justify-center gap-3 py-2 px-4 rounded-xl transition-all duration-500
      ${revealed ? 'opacity-100 scale-100 bg-white/5' : 'opacity-0 scale-75'}
    `}>
      <div className="flex items-center gap-2">
        <Avatar avatar={voter?.avatar} color={voter?.avatarColor} size="sm" />
        <span className="text-white/70 text-sm font-medium">{voter?.name}</span>
      </div>
      <span className="text-red-400 font-bold text-lg">{'\u2192'}</span>
      <div className="flex items-center gap-2">
        <Avatar avatar={target?.avatar} color={target?.avatarColor} size="sm" />
        <span className="text-red-300 text-sm font-medium">{target?.name}</span>
      </div>
    </div>
  );
}

export default function GameScreen({ room, myId, onDescribe, onVote, onContinue, onChat, onSkipDiscussion }) {
  const [clueText, setClueText] = useState('');
  const [chatText, setChatText] = useState('');
  const [votedFor, setVotedFor] = useState(null);
  const chatEndRef = useRef(null);

  const me = room.players.find(p => p.id === myId);
  const isHost = room.hostId === myId;
  const currentTurnPlayer = room.state === 'describing'
    ? room.players.find(p => p.id === room.turnOrder[room.currentTurnIndex])
    : null;
  const isMyTurn = currentTurnPlayer?.id === myId;

  const theme = room.settings.theme || 'space';
  const themeClasses = {
    space: 'bg-gradient-to-b from-indigo-950/50 to-purple-950/50',
    noir: 'bg-gradient-to-b from-gray-950/50 to-amber-950/30',
    jungle: 'bg-gradient-to-b from-emerald-950/50 to-green-950/50'
  };

  useEffect(() => {
    setVotedFor(null);
  }, [room.state]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chatMessages?.length]);

  const handleDescribe = () => {
    if (!clueText.trim()) return;
    onDescribe(clueText.trim());
    setClueText('');
  };

  const handleVote = (targetId) => {
    setVotedFor(targetId);
    onVote(targetId);
  };

  const handleChat = () => {
    if (!chatText.trim()) return;
    onChat(chatText.trim());
    setChatText('');
  };

  const voteCounts = {};
  if (room.state === 'roundResult' || room.state === 'gameOver' || room.state === 'voteReveal') {
    Object.values(room.votes).forEach(id => {
      voteCounts[id] = (voteCounts[id] || 0) + 1;
    });
  }

  // Scoreboard sorted
  const scoreboard = Object.entries(room.scores || {})
    .map(([id, score]) => ({ player: room.players.find(p => p.id === id), score }))
    .filter(s => s.player)
    .sort((a, b) => b.score - a.score);

  return (
    <div className={`min-h-screen flex flex-col p-4 pt-8 max-w-4xl mx-auto ${themeClasses[theme] || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-white/40 text-sm">Category</div>
          <div className={`text-xl font-bold ${room.category === '???' ? 'text-red-400' : 'text-purple-300'}`}>
            {room.category}
          </div>
        </div>
        <div className="text-center">
          <div className="text-white/40 text-sm">Round</div>
          <div className="text-xl font-bold text-indigo-300">
            {room.currentRound + 1}/{room.settings.maxRounds}
          </div>
        </div>
        {room.state !== 'voteReveal' && <Timer endTime={room.timerEnd} />}
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
            votingMode={false}
            votedFor={null}
            onVote={null}
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

      {/* Describing phase */}
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

      {/* Discussion phase */}
      {room.state === 'discussing' && (
        <div className="glass-strong rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-orange-300">
              {'\u{1F4AC}'} Discussion Time!
            </h3>
            <div className="flex items-center gap-3">
              <Timer endTime={room.timerEnd} />
              {isHost && (
                <button
                  onClick={onSkipDiscussion}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg
                    text-white/60 hover:text-white transition-all"
                >
                  Skip to Vote
                </button>
              )}
            </div>
          </div>
          <p className="text-white/40 text-sm mb-4">Debate who the imposter might be. Accuse, defend, bluff!</p>

          {/* Chat messages */}
          <div className="bg-black/20 rounded-xl p-3 mb-3 max-h-48 overflow-y-auto space-y-2">
            {(!room.chatMessages || room.chatMessages.length === 0) && (
              <p className="text-white/20 text-sm text-center py-4">No messages yet. Start the discussion!</p>
            )}
            {room.chatMessages?.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2 animate-fade-in ${msg.playerId === myId ? 'flex-row-reverse' : ''}`}>
                <Avatar avatar={msg.avatar} color={msg.avatarColor} size="sm" />
                <div className={`max-w-[70%] ${msg.playerId === myId ? 'text-right' : ''}`}>
                  <span className="text-white/50 text-xs">{msg.playerName}</span>
                  <div className={`text-sm px-3 py-1.5 rounded-xl mt-0.5 ${
                    msg.playerId === myId ? 'bg-indigo-500/30 text-white' : 'bg-white/10 text-white/90'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          {me?.alive && (
            <div className="flex gap-2">
              <input
                type="text"
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Type your message..."
                maxLength={300}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                  placeholder-white/30 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
              />
              <button
                onClick={handleChat}
                disabled={!chatText.trim()}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-sm
                  hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* Voting phase */}
      {room.state === 'voting' && (
        <div className="glass-strong rounded-2xl p-6 animate-slide-up">
          <div className="text-center mb-4">
            <Timer endTime={room.timerEnd} large />
            <h3 className="text-2xl font-bold text-red-300 mt-4 mb-1">
              {'\u{1F5F3}\uFE0F'} Who is the Imposter?
            </h3>
            <p className="text-white/40 text-sm">
              {!me?.alive
                ? 'You are eliminated. Watching the vote...'
                : votedFor
                  ? 'Vote cast! Waiting for others...'
                  : 'Tap a player below to cast your vote'}
            </p>
          </div>

          {me?.alive && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {room.players.filter(p => p.alive && p.id !== myId).map(player => (
                <button
                  key={player.id}
                  onClick={() => !votedFor && handleVote(player.id)}
                  disabled={!!votedFor}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                    ${votedFor === player.id
                      ? 'ring-2 ring-red-400 bg-red-500/20 scale-105'
                      : votedFor
                        ? 'opacity-40 cursor-not-allowed bg-white/5'
                        : 'bg-white/5 hover:bg-red-500/10 hover:ring-1 hover:ring-red-400/50 hover:scale-[1.02] active:scale-95 cursor-pointer'
                    }
                  `}
                >
                  <Avatar avatar={player.avatar} color={player.avatarColor} size="sm" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{player.name}</div>
                    {player.title && (
                      <div className="text-xs" style={{ color: player.title.color }}>{player.title.name}</div>
                    )}
                  </div>
                  {votedFor === player.id ? (
                    <span className="text-red-400 text-xs font-bold px-2 py-1 bg-red-500/20 rounded-full">VOTED</span>
                  ) : !votedFor && (
                    <span className="text-white/30 text-xs font-medium px-2 py-1 bg-white/5 rounded-full">Vote</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dramatic vote reveal */}
      {room.state === 'voteReveal' && (
        <div className="glass-strong rounded-2xl p-6 text-center animate-slide-up">
          <h3 className="text-2xl font-bold text-amber-300 mb-4">
            {'\u{1F3AD}'} Revealing Votes...
          </h3>
          <div className="space-y-2 max-w-sm mx-auto">
            {Object.entries(room.votes).map(([voterId, targetId], i) => {
              const voter = room.players.find(p => p.id === voterId);
              const target = room.players.find(p => p.id === targetId);
              const isRevealed = i < room.voteRevealIndex;
              return (
                <VoteRevealCard
                  key={voterId}
                  voter={voter}
                  target={target}
                  revealed={isRevealed}
                />
              );
            })}
          </div>
          <p className="text-white/30 text-sm mt-4 animate-pulse">
            {room.voteRevealIndex}/{room.voteRevealTotal} votes revealed...
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
      {room.state === 'gameOver' && (
        <GameOverOverlay room={room} myId={myId} isHost={isHost} onRestart={onContinue} scoreboard={scoreboard} />
      )}
    </div>
  );
}

function GameOverOverlay({ room, myId, isHost, onRestart, scoreboard }) {
  const me = room.players.find(p => p.id === myId);
  const imposter = room.players.find(p => p.isImposter);
  const teamWon = room.winner === 'team';
  const iWon = (teamWon && !me?.isImposter) || (!teamWon && me?.isImposter);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {teamWon && <Confetti />}

      <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in max-h-[90vh] overflow-y-auto">
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
              <div className="text-left">
                <span className="text-xl font-bold text-red-400">{imposter.name}</span>
                {imposter.title && (
                  <div className="text-xs font-semibold" style={{ color: imposter.title.color }}>
                    {imposter.title.name}
                  </div>
                )}
              </div>
            </div>
            <p className="text-white/40 text-sm mt-2">
              The word was: <span className="text-emerald-400 font-bold">{room.word || room.players.find(p => !p.isImposter)?.word}</span>
            </p>
          </div>
        )}

        {/* Scoreboard */}
        {scoreboard.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-6">
            <h4 className="text-white/50 text-sm mb-3 font-semibold">Scoreboard</h4>
            <div className="space-y-2">
              {scoreboard.map((entry, i) => (
                <div key={entry.player.id} className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-sm w-5">{i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}.`}</span>
                    <Avatar avatar={entry.player.avatar} color={entry.player.avatarColor} size="sm" />
                    <div className="text-left">
                      <span className="text-white/80 text-sm">{entry.player.name}</span>
                      {entry.player.title && (
                        <div className="text-xs" style={{ color: entry.player.title.color }}>
                          {entry.player.title.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-indigo-400 font-bold">{entry.score} pts</span>
                </div>
              ))}
            </div>
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
