import React, { useState, useEffect, useCallback } from 'react';
import { socket } from './socket';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';

export default function App() {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('room:update', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:update');
      socket.disconnect();
    };
  }, []);

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

      {/* Screens */}
      {!room && (
        <HomeScreen onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}
      {room && room.state === 'lobby' && (
        <LobbyScreen room={room} myId={socket.id} onStartGame={handleStartGame} />
      )}
      {room && room.state !== 'lobby' && (
        <GameScreen
          room={room}
          myId={socket.id}
          onDescribe={handleDescribe}
          onVote={handleVote}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
