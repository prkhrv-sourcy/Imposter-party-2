import React, { useState, useEffect, useRef } from 'react';
import Timer from '../../components/Timer';
import Avatar from '../../components/Avatar';

function Confetti() {
  const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6'];
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

function HintCard({ hint, index, revealed, isNew }) {
  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-xl transition-all duration-500
      ${revealed
        ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 opacity-100 translate-y-0'
        : 'bg-white/5 border border-white/5 opacity-40 translate-y-0'
      }
      ${isNew ? 'animate-bounce-in' : ''}
    `}>
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0
        ${revealed
          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
          : 'bg-white/10 text-white/30'
        }
      `}>
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        {revealed ? (
          <p className="text-white/90 text-sm md:text-base leading-relaxed">"{hint}"</p>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-3 bg-white/10 rounded-full flex-1 max-w-[200px]" />
            <span className="text-white/20 text-xs">
              {'\u{1F512}'} Locked
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FamousFacesGame({ room, myId, onGuess, onContinue, onPlayAgain }) {
  const [guessText, setGuessText] = useState('');
  const [guessResult, setGuessResult] = useState(null);
  const [prevHintsRevealed, setPrevHintsRevealed] = useState(0);
  const feedEndRef = useRef(null);

  const me = room.players.find(p => p.id === myId);
  const isHost = room.hostId === myId;
  const hasGuessedCorrectly = !!room.correctGuesses?.[myId];

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.guessFeed?.length]);

  useEffect(() => {
    if (room.state === 'playing') {
      setPrevHintsRevealed(room.hintsRevealed);
    }
  }, [room.hintsRevealed, room.state]);

  useEffect(() => {
    setGuessText('');
    setGuessResult(null);
  }, [room.currentRound, room.state]);

  const handleGuess = () => {
    if (!guessText.trim() || hasGuessedCorrectly) return;
    onGuess(guessText.trim(), (result) => {
      if (result.correct) {
        setGuessResult({ correct: true, score: result.score });
      } else {
        setGuessResult({ correct: false });
        setTimeout(() => setGuessResult(null), 1500);
      }
    });
    setGuessText('');
  };

  // Build scoreboard
  const scoreboard = room.players
    .map(p => ({
      player: p,
      score: room.scores?.[p.id] || 0,
      roundScore: room.roundScores?.[p.id] || 0,
      guessedCorrectly: !!room.correctGuesses?.[p.id],
    }))
    .sort((a, b) => b.score - a.score);

  const hints = room.hints || [];
  const totalHints = room.totalHints || 5;

  return (
    <div className="min-h-screen flex flex-col p-4 pt-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{'\u{1F929}'}</span>
          <div>
            <div className="text-white/40 text-sm">Famous Faces</div>
            <div className="text-lg font-bold text-amber-300">
              Round {room.currentRound + 1}/{room.settings.rounds}
            </div>
          </div>
        </div>
        {room.state === 'playing' && <Timer endTime={room.timerEnd} />}
      </div>

      {/* Main game area - responsive layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Left: Hints + Guess */}
        <div className="flex-1 space-y-4">
          {/* Playing state */}
          {room.state === 'playing' && (
            <>
              {/* Big timer */}
              <div className="glass-strong rounded-2xl p-6 text-center">
                <Timer endTime={room.timerEnd} large />
                <p className="text-white/40 text-sm mt-2">
                  {hasGuessedCorrectly
                    ? 'You got it! Waiting for others...'
                    : `Hint ${room.hintsRevealed}/${totalHints} revealed`
                  }
                </p>
              </div>

              {/* Hints */}
              <div className="space-y-3">
                {Array.from({ length: totalHints }).map((_, i) => (
                  <HintCard
                    key={i}
                    hint={hints[i]}
                    index={i}
                    revealed={i < room.hintsRevealed}
                    isNew={i === room.hintsRevealed - 1 && room.hintsRevealed > prevHintsRevealed}
                  />
                ))}
              </div>

              {/* Guess input */}
              {!hasGuessedCorrectly ? (
                <div className="glass-strong rounded-2xl p-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={guessText}
                      onChange={e => setGuessText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGuess()}
                      placeholder="Type your guess..."
                      maxLength={100}
                      autoFocus
                      className={`flex-1 px-4 py-3 bg-white/5 border rounded-xl text-white
                        placeholder-white/30 focus:outline-none transition-all
                        ${guessResult?.correct === false
                          ? 'border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400 animate-shake'
                          : 'border-white/10 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                        }`}
                    />
                    <button
                      onClick={handleGuess}
                      disabled={!guessText.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold
                        hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-lg shadow-amber-500/30"
                    >
                      Guess
                    </button>
                  </div>
                  {guessResult?.correct === false && (
                    <p className="text-red-400 text-sm mt-2 animate-fade-in">Not quite! Try again...</p>
                  )}
                </div>
              ) : (
                <div className="glass-strong rounded-2xl p-4 text-center border border-green-500/20 bg-green-500/5">
                  <span className="text-green-400 font-bold text-lg">
                    {'\u2705'} You guessed it! +{room.correctGuesses[myId]?.score} pts
                  </span>
                  {room.answer && (
                    <p className="text-white/50 text-sm mt-1">
                      The answer is <span className="text-amber-400 font-bold">{room.answer}</span>
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Round Result */}
          {room.state === 'roundResult' && (
            <div className="glass-strong rounded-2xl p-8 text-center animate-bounce-in">
              <div className="text-5xl mb-4">{'\u{1F3AD}'}</div>
              <h2 className="text-3xl font-bold text-white mb-2">It was...</h2>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-6">
                {room.answer}
              </h3>

              {/* Who got it right */}
              <div className="glass rounded-2xl p-4 mb-6">
                <h4 className="text-white/50 text-sm mb-3 font-semibold">Round Results</h4>
                <div className="space-y-2">
                  {scoreboard.map(entry => (
                    <div key={entry.player.id} className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar avatar={entry.player.avatar} color={entry.player.avatarColor} size="sm" />
                        <span className="text-white/80 text-sm">{entry.player.name}</span>
                      </div>
                      {entry.roundScore > 0 ? (
                        <span className="text-green-400 font-bold text-sm">+{entry.roundScore} pts</span>
                      ) : (
                        <span className="text-white/30 text-sm">No guess</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <button
                  onClick={onContinue}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold
                    hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/30"
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
            <GameOver room={room} myId={myId} isHost={isHost} onPlayAgain={onPlayAgain} scoreboard={scoreboard} />
          )}
        </div>

        {/* Right sidebar: Leaderboard + Guess Feed */}
        <div className="lg:w-80 space-y-4">
          {/* Leaderboard */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-amber-400 font-bold text-sm mb-3 flex items-center gap-2">
              {'\u{1F3C6}'} Leaderboard
            </h3>
            <div className="space-y-2">
              {scoreboard.map((entry, i) => (
                <div
                  key={entry.player.id}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300
                    ${entry.player.id === myId ? 'bg-amber-500/10 border border-amber-500/20' : ''}
                    ${entry.guessedCorrectly && room.state === 'playing' ? 'opacity-100' : ''}
                  `}
                >
                  <span className="text-white/30 text-xs w-5 text-center">
                    {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}.`}
                  </span>
                  <Avatar avatar={entry.player.avatar} color={entry.player.avatarColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate">
                      {entry.player.name}
                      {entry.player.id === myId && <span className="text-amber-400 text-xs"> (you)</span>}
                    </div>
                    {room.state === 'playing' && entry.guessedCorrectly && (
                      <div className="text-green-400 text-xs">{'\u2705'} +{entry.roundScore}</div>
                    )}
                  </div>
                  <span className="text-amber-400 font-bold text-sm">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guess Feed */}
          {room.state === 'playing' && room.guessFeed && room.guessFeed.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <h3 className="text-white/50 font-bold text-sm mb-3 flex items-center gap-2">
                {'\u{1F4AC}'} Guess Feed
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {room.guessFeed.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 animate-fade-in">
                    <Avatar avatar={entry.avatar} color={entry.avatarColor} size="sm" />
                    <div className="flex-1 min-w-0">
                      <span className="text-white/50 text-xs">{entry.playerName}</span>
                      {entry.correct ? (
                        <div className="text-green-400 text-sm font-semibold">
                          {'\u2705'} Guessed correctly!
                        </div>
                      ) : (
                        <div className="text-red-400/70 text-sm">
                          "{entry.text}" {'\u274C'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={feedEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GameOver({ room, myId, isHost, onPlayAgain, scoreboard }) {
  const winner = scoreboard[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Confetti />

      <div className="glass-strong rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in max-h-[90vh] overflow-y-auto">
        <div className="text-6xl mb-4">{'\u{1F3C6}'}</div>
        <h2 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Game Over!
          </span>
        </h2>

        {/* Last round answer */}
        {room.answer && (
          <div className="glass rounded-xl p-3 mb-4">
            <p className="text-white/40 text-xs">Last answer</p>
            <p className="text-amber-400 font-bold text-lg">{room.answer}</p>
          </div>
        )}

        {/* Winner */}
        {winner && (
          <div className="mb-6">
            <p className="text-white/50 text-sm mb-2">Winner</p>
            <div className="flex items-center justify-center gap-3">
              <Avatar avatar={winner.player.avatar} color={winner.player.avatarColor} size="lg" />
              <div className="text-left">
                <div className="text-2xl font-bold text-amber-400">{winner.player.name}</div>
                <div className="text-white/50 text-sm">{winner.score} points</div>
              </div>
            </div>
          </div>
        )}

        {/* Full scoreboard */}
        <div className="glass rounded-2xl p-4 mb-6">
          <h4 className="text-white/50 text-sm mb-3 font-semibold">Final Standings</h4>
          <div className="space-y-2">
            {scoreboard.map((entry, i) => (
              <div key={entry.player.id} className={`flex items-center gap-3 justify-between p-2 rounded-lg
                ${entry.player.id === myId ? 'bg-amber-500/10' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-sm w-5">
                    {i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : `${i + 1}.`}
                  </span>
                  <Avatar avatar={entry.player.avatar} color={entry.player.avatarColor} size="sm" />
                  <span className="text-white/80 text-sm">{entry.player.name}</span>
                </div>
                <span className="text-amber-400 font-bold">{entry.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-bold text-lg
              hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/30"
          >
            Play Again!
          </button>
        )}
      </div>
    </div>
  );
}
