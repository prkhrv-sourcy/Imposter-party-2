import React, { useState, useEffect, useCallback } from 'react';
import { socket, playerId } from './socket';
import HubScreen from './screens/HubScreen';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import FamousFacesHome from './screens/famous-faces/FamousFacesHome';
import FamousFacesLobby from './screens/famous-faces/FamousFacesLobby';
import FamousFacesGame from './screens/famous-faces/FamousFacesGame';

function getInitialGame() {
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game');
  if (game) return game;
  // Backward compat: if ?room= is present without ?game=, assume imposter-party
  if (params.get('room')) return 'imposter-party';
  return null;
}

function getInitialRoomCode() {
  return new URLSearchParams(window.location.search).get('room') || '';
}

export default function App() {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [currentGame, setCurrentGame] = useState(getInitialGame);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:update', (updatedRoom) => {
      setRoom(updatedRoom);
      // Sync currentGame from room's gameType
      if (updatedRoom?.gameType) {
        setCurrentGame(updatedRoom.gameType);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:update');
      socket.disconnect();
    };
  }, []);

  // === Imposter Party handlers ===
  const handleCreateRoom = useCallback((name, settings) => {
    socket.emit('room:create', { playerName: name, settings }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        setRoom(res.room);
        setError('');
      }
    });
  }, []);

  const handleJoinRoom = useCallback((name, code) => {
    socket.emit('room:join', { playerName: name, roomCode: code }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        setRoom(res.room);
        setError('');
      }
    });
  }, []);

  const handleStartGame = useCallback(() => {
    socket.emit('game:start', null, (res) => {
      if (res.error) setError(res.error);
    });
  }, []);

  const handleDescribe = useCallback((text) => {
    socket.emit('turn:describe', { text }, (res) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleVote = useCallback((targetId) => {
    socket.emit('vote:cast', { targetId }, (res) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleChat = useCallback((text) => {
    socket.emit('chat:send', { text }, (res) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleSkipDiscussion = useCallback(() => {
    socket.emit('discussion:skip', null, (res) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (room?.state === 'gameOver') {
      socket.emit('game:start', null, (res) => {
        if (res?.error) setError(res.error);
      });
    } else {
      socket.emit('round:continue', null, (res) => {
        if (res?.error) setError(res.error);
      });
    }
  }, [room?.state]);

  // === Famous Faces handlers ===
  const handleFFCreateRoom = useCallback((name, settings) => {
    socket.emit('ff:room:create', { playerName: name, settings }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        setRoom(res.room);
        setError('');
      }
    });
  }, []);

  const handleFFJoinRoom = useCallback((name, code) => {
    socket.emit('ff:room:join', { playerName: name, roomCode: code }, (res) => {
      if (res.error) {
        setError(res.error);
      } else {
        setRoom(res.room);
        setError('');
      }
    });
  }, []);

  const handleFFStartGame = useCallback(() => {
    socket.emit('ff:game:start', null, (res) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleFFGuess = useCallback((text, localCallback) => {
    socket.emit('ff:guess', { text }, (res) => {
      if (res?.error) {
        setError(res.error);
      } else if (localCallback) {
        localCallback(res);
      }
    });
  }, []);

  const handleFFContinue = useCallback(() => {
    socket.emit('ff:continue', null, (res) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  const handleFFPlayAgain = useCallback(() => {
    socket.emit('ff:game:start', null, (res) => {
      if (res?.error) setError(res.error);
    });
  }, []);

  // === Navigation ===
  const handleSelectGame = useCallback((gameId) => {
    setCurrentGame(gameId);
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('game', gameId);
    window.history.pushState({}, '', url);
  }, []);

  const handleBackToHub = useCallback(() => {
    setCurrentGame(null);
    setRoom(null);
    const url = new URL(window.location);
    url.searchParams.delete('game');
    url.searchParams.delete('room');
    window.history.pushState({}, '', url);
  }, []);

  // Figure out which game type we're dealing with
  const gameType = room?.gameType || null;
  const isFamousFaces = gameType === 'famous-faces' || currentGame === 'famous-faces';

  return (
    <div className="relative">
      {/* Connection indicator */}
      <div className={`fixed top-3 right-3 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
        {connected ? 'Connected' : 'Reconnecting...'}
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur px-6 py-3 rounded-xl text-white font-medium animate-slide-up">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-white/70 hover:text-white">{'\u2716'}</button>
        </div>
      )}

      {/* Hub Screen - no room, no game selected */}
      {!room && !currentGame && (
        <HubScreen onSelectGame={handleSelectGame} />
      )}

      {/* Imposter Party flow */}
      {!room && currentGame === 'imposter-party' && (
        <HomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBack={handleBackToHub}
          initialRoomCode={getInitialRoomCode()}
        />
      )}
      {room && !isFamousFaces && room.state === 'lobby' && (
        <LobbyScreen room={room} myId={playerId} onStartGame={handleStartGame} />
      )}
      {room && !isFamousFaces && room.state !== 'lobby' && (
        <GameScreen
          room={room}
          myId={playerId}
          onDescribe={handleDescribe}
          onVote={handleVote}
          onContinue={handleContinue}
          onChat={handleChat}
          onSkipDiscussion={handleSkipDiscussion}
        />
      )}

      {/* Famous Faces flow */}
      {!room && currentGame === 'famous-faces' && (
        <FamousFacesHome
          onCreateRoom={handleFFCreateRoom}
          onJoinRoom={handleFFJoinRoom}
          onBack={handleBackToHub}
          initialRoomCode={getInitialRoomCode()}
        />
      )}
      {room && isFamousFaces && room.state === 'lobby' && (
        <FamousFacesLobby room={room} myId={playerId} onStartGame={handleFFStartGame} />
      )}
      {room && isFamousFaces && room.state !== 'lobby' && (
        <FamousFacesGame
          room={room}
          myId={playerId}
          onGuess={handleFFGuess}
          onContinue={handleFFContinue}
          onPlayAgain={handleFFPlayAgain}
        />
      )}
    </div>
  );
}
