import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateWordsForCategory } from './gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

// Serve built client in production
app.use(express.static(join(__dirname, '..', 'client', 'dist')));

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const rooms = new Map();

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

function createRoom(hostId, hostName, settings) {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const avatarIndex = 0;
  const room = {
    code: roomCode,
    hostId,
    players: [{
      id: hostId,
      name: hostName,
      avatar: AVATARS[avatarIndex],
      avatarColor: AVATAR_COLORS[avatarIndex],
      alive: true,
      isImposter: false,
      hasDescribed: false,
      word: null
    }],
    settings: {
      maxRounds: settings.maxRounds || 3,
      maxPlayers: Math.min(settings.maxPlayers || 32, 32),
      turnDuration: settings.turnDuration || 30,
      voteDuration: settings.voteDuration || 20
    },
    state: 'lobby', // lobby, playing, describing, voting, roundResult, gameOver
    currentRound: 0,
    currentTurnIndex: 0,
    turnOrder: [],
    votes: {},
    category: null,
    word: null,
    descriptions: [],
    eliminatedThisRound: null,
    winner: null,
    timer: null,
    timerEnd: null
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
    hasDescribed: player.hasDescribed
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
  return {
    code: room.code,
    hostId: room.hostId,
    settings: room.settings,
    state: room.state,
    currentRound: room.currentRound,
    currentTurnIndex: room.currentTurnIndex,
    turnOrder: room.turnOrder,
    votes: (room.state === 'roundResult' || room.state === 'gameOver') ? room.votes : {},
    category: room.category,
    descriptions: room.descriptions,
    eliminatedThisRound: room.eliminatedThisRound,
    winner: room.winner,
    timerEnd: room.timerEnd,
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
    io.to(p.id).emit('room:update', getPublicRoom(room, p.id));
  });
}

function getAlivePlayers(room) {
  return room.players.filter(p => p.alive);
}

function startNextTurn(room) {
  const alive = getAlivePlayers(room);
  if (room.currentTurnIndex >= room.turnOrder.length) {
    startVoting(room);
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
  broadcastRoom(room);

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
}

function startVoting(room) {
  room.state = 'voting';
  room.votes = {};
  clearTimer(room);
  broadcastRoom(room);

  startTimer(room, room.settings.voteDuration, () => {
    resolveVotes(room);
  });
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

  if (tie || maxVotes === 0) {
    eliminated = null;
  }

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
        room.state = 'gameOver';
        room.winner = 'team';
        broadcastRoom(room);
        return;
      }
    }
  }

  const aliveAfter = getAlivePlayers(room);
  const imposterAlive = aliveAfter.some(p => p.isImposter);

  if (!imposterAlive) {
    room.state = 'gameOver';
    room.winner = 'team';
    broadcastRoom(room);
    return;
  }

  if (aliveAfter.length <= 2) {
    room.state = 'gameOver';
    room.winner = 'imposter';
    broadcastRoom(room);
    return;
  }

  room.currentRound++;
  if (room.currentRound >= room.settings.maxRounds) {
    room.state = 'gameOver';
    room.winner = 'imposter';
    broadcastRoom(room);
    return;
  }

  room.state = 'roundResult';
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
    generated = {
      category: 'Fruits',
      word: 'Mango',
      imposterWord: null
    };
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
  room.winner = null;
  room.eliminatedThisRound = null;

  const alive = getAlivePlayers(room);
  room.turnOrder = alive.map(p => p.id).sort(() => Math.random() - 0.5);
  room.currentTurnIndex = 0;

  broadcastRoom(room);

  setTimeout(() => {
    startNextTurn(room);
  }, 3000);

  return { success: true };
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('room:create', async ({ playerName, settings }, callback) => {
    const room = createRoom(socket.id, playerName, settings || {});
    socket.join(room.code);
    callback({ success: true, room: getPublicRoom(room, socket.id) });
  });

  socket.on('room:join', ({ roomCode, playerName }, callback) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return callback({ error: 'Room not found' });
    if (room.state !== 'lobby') return callback({ error: 'Game already in progress' });
    if (room.players.length >= room.settings.maxPlayers) return callback({ error: 'Room is full' });
    if (room.players.some(p => p.name === playerName)) return callback({ error: 'Name already taken' });

    const avatarIndex = room.players.length % AVATARS.length;
    room.players.push({
      id: socket.id,
      name: playerName,
      avatar: AVATARS[avatarIndex],
      avatarColor: AVATAR_COLORS[avatarIndex],
      alive: true,
      isImposter: false,
      hasDescribed: false,
      word: null
    });

    socket.join(room.code);
    broadcastRoom(room);
    callback({ success: true, room: getPublicRoom(room, socket.id) });
  });

  socket.on('game:start', async (_, callback) => {
    const room = [...rooms.values()].find(r => r.hostId === socket.id);
    if (!room) return callback({ error: 'You are not a host' });
    if (room.state !== 'lobby' && room.state !== 'gameOver') return callback({ error: 'Game already running' });

    const result = await startGame(room);
    callback(result);
  });

  socket.on('turn:describe', ({ text }, callback) => {
    const room = [...rooms.values()].find(r => r.players.some(p => p.id === socket.id));
    if (!room || room.state !== 'describing') return callback?.({ error: 'Not your turn' });

    const currentPlayerId = room.turnOrder[room.currentTurnIndex];
    if (currentPlayerId !== socket.id) return callback?.({ error: 'Not your turn' });

    const player = room.players.find(p => p.id === socket.id);
    clearTimer(room);

    room.descriptions.push({
      playerId: socket.id,
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

  socket.on('vote:cast', ({ targetId }, callback) => {
    const room = [...rooms.values()].find(r => r.players.some(p => p.id === socket.id));
    if (!room || room.state !== 'voting') return callback?.({ error: 'Not voting phase' });

    const voter = room.players.find(p => p.id === socket.id);
    if (!voter.alive) return callback?.({ error: 'You are eliminated' });
    if (targetId === socket.id) return callback?.({ error: 'Cannot vote for yourself' });

    room.votes[socket.id] = targetId;
    callback?.({ success: true });

    const alive = getAlivePlayers(room);
    if (Object.keys(room.votes).length >= alive.length) {
      resolveVotes(room);
    } else {
      broadcastRoom(room);
    }
  });

  socket.on('round:continue', (_, callback) => {
    const room = [...rooms.values()].find(r => r.hostId === socket.id);
    if (!room || room.state !== 'roundResult') return callback?.({ error: 'Cannot continue' });

    room.descriptions = [];
    room.players.forEach(p => { p.hasDescribed = false; });
    const alive = getAlivePlayers(room);
    room.turnOrder = alive.map(p => p.id).sort(() => Math.random() - 0.5);
    room.currentTurnIndex = 0;
    room.eliminatedThisRound = null;

    startNextTurn(room);
    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    for (const [code, room] of rooms) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex === -1) continue;

      if (room.state === 'lobby') {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          clearTimer(room);
          rooms.delete(code);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].id;
          }
          broadcastRoom(room);
        }
      } else {
        const player = room.players[playerIndex];
        player.alive = false;
        if (player.isImposter) {
          room.state = 'gameOver';
          room.winner = 'team';
          clearTimer(room);
        }
        broadcastRoom(room);
      }
      break;
    }
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
