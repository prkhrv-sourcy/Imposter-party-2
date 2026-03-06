import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateWordsForCategory } from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(join(__dirname, '..', 'client', 'dist')));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = new Map();
// Maps persistent playerId -> current socketId
const playerSockets = new Map();
// Maps socketId -> persistent playerId
const socketPlayers = new Map();

const AVATARS = [
  'fox', 'cat', 'dog', 'panda', 'koala', 'rabbit', 'owl', 'penguin',
  'bear', 'tiger', 'lion', 'monkey', 'frog', 'duck', 'whale', 'dolphin',
  'octopus', 'unicorn', 'dragon', 'phoenix', 'wolf', 'deer', 'raccoon',
  'sloth', 'otter', 'hedgehog', 'flamingo', 'parrot', 'turtle', 'bee',
  'butterfly', 'snail'
];

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#F1948A', '#AED6F1', '#D7BDE2', '#A3E4D7', '#FAD7A0', '#A9CCE3',
  '#D5F5E3', '#FADBD8', '#E8DAEF', '#D6EAF8', '#FCF3CF', '#D5D8DC',
  '#ABEBC6', '#F9E79F', '#AED6F1', '#F5CBA7', '#D2B4DE', '#A9DFBF',
  '#F5B7B1', '#85C1E9'
];

const TITLES = {
  detective: { name: 'Master Detective', color: '#FFD700' },
  serial: { name: 'Serial Imposter', color: '#FF4444' },
  trust: { name: 'Trust Issues', color: '#9B59B6' },
  survivor: { name: 'Survivor', color: '#2ECC71' },
  rookie: { name: 'Rookie', color: '#95A5A6' },
};

function getTitle(stats) {
  if (stats.imposterWins >= 3) return TITLES.serial;
  if (stats.teamWins >= 5) return TITLES.detective;
  if (stats.votesCast >= 20) return TITLES.trust;
  if (stats.gamesPlayed >= 10) return TITLES.survivor;
  return TITLES.rookie;
}

// Helper: get the socket ID for a player, for emitting
function getSocketId(playerId) {
  return playerSockets.get(playerId);
}

// Helper: find room by player ID
function findRoomByPlayer(playerId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === playerId)) return room;
  }
  return null;
}

function createRoom(playerId, playerName, settings) {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = {
    code: roomCode,
    hostId: playerId,
    players: [{
      id: playerId,
      name: playerName,
      avatar: AVATARS[0],
      avatarColor: AVATAR_COLORS[0],
      alive: true,
      isImposter: false,
      hasDescribed: false,
      word: null,
      connected: true,
      stats: { gamesPlayed: 0, teamWins: 0, imposterWins: 0, votesCast: 0 }
    }],
    settings: {
      maxRounds: settings.maxRounds || 3,
      maxPlayers: Math.min(settings.maxPlayers || 32, 32),
      turnDuration: settings.turnDuration || 30,
      discussionDuration: settings.discussionDuration || 45,
      voteDuration: settings.voteDuration || 20,
      theme: settings.theme || 'space'
    },
    state: 'lobby',
    currentRound: 0,
    currentTurnIndex: 0,
    turnOrder: [],
    votes: {},
    voteRevealOrder: [],
    voteRevealIndex: 0,
    category: null,
    word: null,
    descriptions: [],
    chatMessages: [],
    eliminatedThisRound: null,
    winner: null,
    timer: null,
    timerEnd: null,
    scores: {}
  };
  rooms.set(roomCode, room);
  return room;
}

function getPublicPlayer(player, gameState, requesterId) {
  const pub = {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    avatarColor: player.avatarColor,
    alive: player.alive,
    hasDescribed: player.hasDescribed,
    connected: player.connected,
    stats: player.stats,
    title: getTitle(player.stats)
  };
  if (gameState === 'gameOver') {
    pub.isImposter = player.isImposter;
    pub.word = player.word;
  }
  if (player.id === requesterId) {
    pub.word = player.word;
    pub.isImposter = player.isImposter;
  }
  return pub;
}

function getPublicRoom(room, requesterId) {
  const requester = room.players.find(p => p.id === requesterId);
  const isImposter = requester?.isImposter && room.state !== 'gameOver';

  let visibleVotes = {};
  if (room.state === 'voteReveal') {
    room.voteRevealOrder.slice(0, room.voteRevealIndex).forEach(voterId => {
      visibleVotes[voterId] = room.votes[voterId];
    });
  } else if (room.state === 'roundResult' || room.state === 'gameOver') {
    visibleVotes = room.votes;
  }

  return {
    code: room.code,
    hostId: room.hostId,
    settings: room.settings,
    state: room.state,
    currentRound: room.currentRound,
    currentTurnIndex: room.currentTurnIndex,
    turnOrder: room.turnOrder,
    votes: visibleVotes,
    voteRevealIndex: room.voteRevealIndex,
    voteRevealTotal: room.voteRevealOrder.length,
    category: isImposter ? '???' : room.category,
    descriptions: room.descriptions,
    chatMessages: room.chatMessages,
    eliminatedThisRound: room.eliminatedThisRound,
    winner: room.winner,
    timerEnd: room.timerEnd,
    scores: room.scores,
    players: room.players.map(p => getPublicPlayer(p, room.state, requesterId))
  };
}

function clearTimer(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
    room.timerEnd = null;
  }
}

function startTimer(room, durationSec, callback) {
  clearTimer(room);
  room.timerEnd = Date.now() + durationSec * 1000;
  room.timer = setTimeout(callback, durationSec * 1000);
}

function broadcastRoom(room) {
  room.players.forEach(p => {
    const sid = getSocketId(p.id);
    if (sid) {
      io.to(sid).emit('room:update', getPublicRoom(room, p.id));
    }
  });
}

function getAlivePlayers(room) {
  return room.players.filter(p => p.alive);
}

function startNextTurn(room) {
  if (room.currentTurnIndex >= room.turnOrder.length) {
    startDiscussion(room);
    return;
  }

  const currentPlayerId = room.turnOrder[room.currentTurnIndex];
  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  if (!currentPlayer || !currentPlayer.alive) {
    room.currentTurnIndex++;
    startNextTurn(room);
    return;
  }

  room.state = 'describing';
  startTimer(room, room.settings.turnDuration, () => {
    room.descriptions.push({
      playerId: currentPlayerId,
      playerName: currentPlayer.name,
      text: '(ran out of time)',
      avatar: currentPlayer.avatar,
      avatarColor: currentPlayer.avatarColor
    });
    currentPlayer.hasDescribed = true;
    room.currentTurnIndex++;
    startNextTurn(room);
  });
  broadcastRoom(room);
}

function startDiscussion(room) {
  room.state = 'discussing';
  room.chatMessages = [];
  startTimer(room, room.settings.discussionDuration, () => {
    startVoting(room);
  });
  broadcastRoom(room);
}

function startVoting(room) {
  room.state = 'voting';
  room.votes = {};
  startTimer(room, room.settings.voteDuration, () => {
    startVoteReveal(room);
  });
  broadcastRoom(room);
}

function startVoteReveal(room) {
  clearTimer(room);
  room.state = 'voteReveal';
  room.voteRevealOrder = Object.keys(room.votes).sort(() => Math.random() - 0.5);
  room.voteRevealIndex = 0;
  broadcastRoom(room);
  revealNextVote(room);
}

function revealNextVote(room) {
  if (room.voteRevealIndex >= room.voteRevealOrder.length) {
    setTimeout(() => resolveVotes(room), 1500);
    return;
  }
  room.voteRevealIndex++;
  broadcastRoom(room);
  room.timer = setTimeout(() => revealNextVote(room), 1200);
}

function resolveVotes(room) {
  clearTimer(room);
  const alive = getAlivePlayers(room);
  const voteCounts = {};
  alive.forEach(p => { voteCounts[p.id] = 0; });

  Object.values(room.votes).forEach(votedId => {
    if (voteCounts[votedId] !== undefined) {
      voteCounts[votedId]++;
    }
  });

  let maxVotes = 0;
  let eliminated = null;
  let tie = false;

  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = playerId;
      tie = false;
    } else if (count === maxVotes && count > 0) {
      tie = true;
    }
  });

  if (tie || maxVotes === 0) eliminated = null;

  room.eliminatedThisRound = null;

  if (eliminated) {
    const player = room.players.find(p => p.id === eliminated);
    if (player) {
      player.alive = false;
      room.eliminatedThisRound = {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        avatarColor: player.avatarColor,
        wasImposter: player.isImposter
      };
      if (player.isImposter) {
        endGame(room, 'team');
        return;
      }
    }
  }

  const aliveAfter = getAlivePlayers(room);
  if (!aliveAfter.some(p => p.isImposter)) {
    endGame(room, 'team');
    return;
  }
  if (aliveAfter.length <= 2) {
    endGame(room, 'imposter');
    return;
  }

  room.currentRound++;
  if (room.currentRound >= room.settings.maxRounds) {
    endGame(room, 'imposter');
    return;
  }

  room.state = 'roundResult';
  broadcastRoom(room);
}

function endGame(room, winner) {
  room.state = 'gameOver';
  room.winner = winner;

  room.players.forEach(p => {
    p.stats.gamesPlayed++;
    if (!room.scores[p.id]) room.scores[p.id] = 0;

    if (winner === 'team' && !p.isImposter) {
      p.stats.teamWins++;
      room.scores[p.id] += 10;
    } else if (winner === 'imposter' && p.isImposter) {
      p.stats.imposterWins++;
      room.scores[p.id] += 25;
    } else if (winner === 'team' && p.isImposter) {
      room.scores[p.id] += 5;
    }
  });

  Object.keys(room.votes).forEach(voterId => {
    const voter = room.players.find(p => p.id === voterId);
    if (voter) voter.stats.votesCast++;
  });

  broadcastRoom(room);
}

async function startGame(room) {
  if (room.players.length < 3) {
    return { error: 'Need at least 3 players to start' };
  }

  let generated;
  try {
    generated = await generateWordsForCategory(room.players.length);
  } catch (err) {
    console.error('Gemini error, using fallback:', err.message);
    generated = { category: 'Fruits', word: 'Mango', imposterWord: null };
  }

  room.category = generated.category;
  room.word = generated.word;

  const imposterIndex = Math.floor(Math.random() * room.players.length);
  room.players.forEach((p, i) => {
    p.alive = true;
    p.hasDescribed = false;
    p.isImposter = i === imposterIndex;
    p.word = i === imposterIndex ? null : generated.word;
  });

  room.state = 'playing';
  room.currentRound = 0;
  room.descriptions = [];
  room.chatMessages = [];
  room.winner = null;
  room.eliminatedThisRound = null;
  room.voteRevealOrder = [];
  room.voteRevealIndex = 0;

  const alive = getAlivePlayers(room);
  room.turnOrder = alive.map(p => p.id).sort(() => Math.random() - 0.5);
  room.currentTurnIndex = 0;

  broadcastRoom(room);

  setTimeout(() => startNextTurn(room), 3000);

  return { success: true };
}

io.on('connection', (socket) => {
  const playerId = socket.handshake.auth.playerId;
  if (!playerId) {
    socket.disconnect();
    return;
  }

  // Register socket mapping
  playerSockets.set(playerId, socket.id);
  socketPlayers.set(socket.id, playerId);
  console.log(`Player connected: ${playerId} (socket ${socket.id})`);

  // Check if this player is already in a room (reconnection)
  const existingRoom = findRoomByPlayer(playerId);
  if (existingRoom) {
    const player = existingRoom.players.find(p => p.id === playerId);
    if (player) {
      player.connected = true;
      console.log(`Player ${playerId} reconnected to room ${existingRoom.code}`);
      // Send current room state to reconnected player
      socket.emit('room:update', getPublicRoom(existingRoom, playerId));
      broadcastRoom(existingRoom);
    }
  }

  socket.on('room:create', async ({ playerName, settings }, callback) => {
    // Leave existing room first
    const oldRoom = findRoomByPlayer(playerId);
    if (oldRoom) leaveRoom(playerId, oldRoom);

    const room = createRoom(playerId, playerName, settings || {});
    callback({ success: true, room: getPublicRoom(room, playerId) });
  });

  socket.on('room:join', ({ roomCode, playerName }, callback) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return callback({ error: 'Room not found' });
    if (room.state !== 'lobby') return callback({ error: 'Game already in progress' });
    if (room.players.length >= room.settings.maxPlayers) return callback({ error: 'Room is full' });

    // Check if already in this room
    const existing = room.players.find(p => p.id === playerId);
    if (existing) {
      existing.connected = true;
      broadcastRoom(room);
      return callback({ success: true, room: getPublicRoom(room, playerId) });
    }

    if (room.players.some(p => p.name === playerName)) return callback({ error: 'Name already taken' });

    // Leave old room
    const oldRoom = findRoomByPlayer(playerId);
    if (oldRoom) leaveRoom(playerId, oldRoom);

    const avatarIndex = room.players.length % AVATARS.length;
    room.players.push({
      id: playerId,
      name: playerName,
      avatar: AVATARS[avatarIndex],
      avatarColor: AVATAR_COLORS[avatarIndex],
      alive: true,
      isImposter: false,
      hasDescribed: false,
      word: null,
      connected: true,
      stats: { gamesPlayed: 0, teamWins: 0, imposterWins: 0, votesCast: 0 }
    });

    broadcastRoom(room);
    callback({ success: true, room: getPublicRoom(room, playerId) });
  });

  socket.on('game:start', async (_, callback) => {
    const room = [...rooms.values()].find(r => r.hostId === playerId);
    if (!room) return callback({ error: 'You are not a host' });
    if (room.state !== 'lobby' && room.state !== 'gameOver') return callback({ error: 'Game already running' });

    const result = await startGame(room);
    callback(result);
  });

  socket.on('turn:describe', ({ text }, callback) => {
    const room = findRoomByPlayer(playerId);
    if (!room || room.state !== 'describing') return callback?.({ error: 'Not your turn' });

    const currentPlayerId = room.turnOrder[room.currentTurnIndex];
    if (currentPlayerId !== playerId) return callback?.({ error: 'Not your turn' });

    const player = room.players.find(p => p.id === playerId);
    clearTimer(room);

    room.descriptions.push({
      playerId,
      playerName: player.name,
      text: text.substring(0, 200),
      avatar: player.avatar,
      avatarColor: player.avatarColor
    });
    player.hasDescribed = true;
    room.currentTurnIndex++;

    callback?.({ success: true });
    startNextTurn(room);
  });

  socket.on('chat:send', ({ text }, callback) => {
    const room = findRoomByPlayer(playerId);
    if (!room || room.state !== 'discussing') return callback?.({ error: 'Not discussion phase' });

    const player = room.players.find(p => p.id === playerId);
    if (!player.alive) return callback?.({ error: 'You are eliminated' });

    room.chatMessages.push({
      playerId,
      playerName: player.name,
      avatar: player.avatar,
      avatarColor: player.avatarColor,
      text: text.substring(0, 300),
      timestamp: Date.now()
    });

    callback?.({ success: true });
    broadcastRoom(room);
  });

  socket.on('vote:cast', ({ targetId }, callback) => {
    const room = findRoomByPlayer(playerId);
    if (!room || room.state !== 'voting') return callback?.({ error: 'Not voting phase' });

    const voter = room.players.find(p => p.id === playerId);
    if (!voter.alive) return callback?.({ error: 'You are eliminated' });
    if (targetId === playerId) return callback?.({ error: 'Cannot vote for yourself' });

    room.votes[playerId] = targetId;
    callback?.({ success: true });

    const alive = getAlivePlayers(room);
    if (Object.keys(room.votes).length >= alive.length) {
      startVoteReveal(room);
    } else {
      broadcastRoom(room);
    }
  });

  socket.on('round:continue', (_, callback) => {
    const room = [...rooms.values()].find(r => r.hostId === playerId);
    if (!room || room.state !== 'roundResult') return callback?.({ error: 'Cannot continue' });

    room.descriptions = [];
    room.chatMessages = [];
    room.players.forEach(p => { p.hasDescribed = false; });
    const alive = getAlivePlayers(room);
    room.turnOrder = alive.map(p => p.id).sort(() => Math.random() - 0.5);
    room.currentTurnIndex = 0;
    room.eliminatedThisRound = null;
    room.voteRevealOrder = [];
    room.voteRevealIndex = 0;

    startNextTurn(room);
    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    const pid = socketPlayers.get(socket.id);
    if (!pid) return;

    console.log(`Player disconnected: ${pid} (socket ${socket.id})`);

    // Only clean up if this is still the active socket for this player
    if (playerSockets.get(pid) === socket.id) {
      playerSockets.delete(pid);
    }
    socketPlayers.delete(socket.id);

    const room = findRoomByPlayer(pid);
    if (!room) return;

    const player = room.players.find(p => p.id === pid);
    if (!player) return;

    player.connected = false;

    if (room.state === 'lobby') {
      // In lobby: give them 10 seconds to reconnect before removing
      setTimeout(() => {
        // Check if still disconnected
        if (!playerSockets.has(pid)) {
          const idx = room.players.findIndex(p => p.id === pid);
          if (idx !== -1) {
            room.players.splice(idx, 1);
            if (room.players.length === 0) {
              clearTimer(room);
              rooms.delete(room.code);
            } else {
              if (room.hostId === pid) {
                room.hostId = room.players[0].id;
              }
              broadcastRoom(room);
            }
          }
        }
      }, 10000);
    } else {
      // During game: mark disconnected but don't eliminate immediately
      // Give them 30 seconds to reconnect
      setTimeout(() => {
        if (!playerSockets.has(pid)) {
          player.alive = false;
          if (player.isImposter) {
            endGame(room, 'team');
          }
          broadcastRoom(room);
        }
      }, 30000);
    }

    broadcastRoom(room);
  });
});

function leaveRoom(playerId, room) {
  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) return;

  if (room.state === 'lobby') {
    room.players.splice(idx, 1);
    if (room.players.length === 0) {
      clearTimer(room);
      rooms.delete(room.code);
    } else {
      if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
      }
      broadcastRoom(room);
    }
  }
}

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
