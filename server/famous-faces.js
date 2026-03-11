import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_ROUNDS = [
  {
    person: 'Elon Musk',
    hints: [
      "I'm still madly in love with my X",
      "I promised everyone we'd move to the red planet... still working on that",
      "I named my kid like a WiFi password",
      "My cars don't need gas but my rockets definitely do",
      "I bought a social media platform and renamed it to a single letter"
    ]
  },
  {
    person: 'Albert Einstein',
    hints: [
      "My hairdresser filed a missing persons report on me",
      "I proved that time flies when you're having fun... literally",
      "I wrote a love letter to the universe and it was only 5 characters long",
      "I left my homeland when a man with a tiny mustache got too powerful",
      "E equals mc squared was my mic drop moment"
    ]
  },
  {
    person: 'Taylor Swift',
    hints: [
      "My exes have their own cinematic universe",
      "I made an entire stadium shake and scientists measured it",
      "I have more eras than a geology textbook",
      "I re-recorded my own music out of pure spite and made billions",
      "I'm a pop star who started in country and my last name means fast"
    ]
  },
  {
    person: 'Leonardo DiCaprio',
    hints: [
      "I have a very strict dating policy involving the number 25",
      "An iceberg once ruined my love life",
      "The Academy made me wait over 20 years for my golden statue",
      "I fought a bear and somehow that's what finally won me an Oscar",
      "I was the king of the world on a sinking ship"
    ]
  },
  {
    person: 'Cristiano Ronaldo',
    hints: [
      "SIUUUU is my battle cry",
      "I have more abs than most people have excuses",
      "I moved to a desert and broke every social media record",
      "I've scored in more countries than most people have visited",
      "I'm a Portuguese footballer who's rivals with a short Argentine"
    ]
  },
  {
    person: 'Oprah Winfrey',
    hints: [
      "I once gave away cars to an entire audience and the internet never forgot",
      "My couch has heard more confessions than a priest",
      "I turned a talk show into a billion-dollar empire",
      "My book club can turn any novel into an instant bestseller",
      "You get a car! YOU get a car! EVERYBODY gets a car!"
    ]
  },
  {
    person: 'Michael Jackson',
    hints: [
      "I wore one glove and nobody questioned it",
      "I could walk forward while moving backward and blew everyone's mind",
      "My pet chimp had a better social life than most humans",
      "I went from Jackson 5 to a thriller of a solo career",
      "I'm the King of Pop who moonwalked into music history"
    ]
  },
  {
    person: 'Cleopatra',
    hints: [
      "I took milk baths before influencers made it cool",
      "I had a thing for powerful Roman men, especially ones named Julius",
      "A snake was involved in my dramatic exit from this world",
      "I ruled the land of pyramids and was the last of my dynasty",
      "I'm the most famous Queen of ancient Egypt"
    ]
  },
  {
    person: 'Steve Jobs',
    hints: [
      "I made a fruit the most valuable brand in the world",
      "I wore the same outfit every day and called it visionary",
      "I got fired from my own company and came back to save it",
      "I convinced millions that they needed a phone without buttons",
      "I co-founded Apple and introduced the iPhone to the world"
    ]
  },
  {
    person: 'Beyonce',
    hints: [
      "My fans are literally called an insect army",
      "I turned a lemonade stand into a cultural phenomenon",
      "I broke the internet by dropping an album without telling anyone",
      "I told everyone to put a ring on it",
      "I'm Queen Bey, married to Jay-Z, and I run the world"
    ]
  },
  {
    person: 'Shakespeare',
    hints: [
      "I invented over 1,700 words because existing ones bored me",
      "To be or not to be... that was apparently MY question",
      "I wrote the original toxic relationship drama — two teens, a balcony, poison",
      "My theater was called the Globe and my works literally went worldwide",
      "I'm the Bard of Avon, history's most famous playwright"
    ]
  },
  {
    person: 'Dwayne Johnson',
    hints: [
      "I used to ask people if they could detect what I was preparing",
      "I went from a wrestling ring to the highest-paid actor in Hollywood",
      "My eyebrow raise is more famous than most people's entire careers",
      "I'm technically a geological formation AND a movie star",
      "I'm The Rock — wrestler turned actor, known for action movies and raising one eyebrow"
    ]
  },
  {
    person: 'Marie Curie',
    hints: [
      "My work literally glowed in the dark, and so did I eventually",
      "I collected Nobel Prizes like some people collect stamps — got two",
      "I moved from Poland to Paris for love and science",
      "My research element was so dangerous my notebooks are still radioactive",
      "I'm the first woman to win a Nobel Prize, known for discovering radium"
    ]
  },
  {
    person: 'Gordon Ramsay',
    hints: [
      "I've made more people cry than most onions",
      "I call sandwiches 'idiot' more than I call them sandwiches",
      "My lamb sauce is perpetually missing",
      "I run restaurants with Michelin stars but I'm known for screaming in kitchens",
      "I'm a British celebrity chef famous for Hell's Kitchen and saying food is RAW"
    ]
  },
  {
    person: 'Marilyn Monroe',
    hints: [
      "I stood over a subway grate and it became the most famous wardrobe malfunction in history",
      "I sang Happy Birthday in a way that made the president blush",
      "Diamonds were supposedly my closest companions",
      "I went from Norma Jeane to the biggest blonde bombshell of the 1950s",
      "I'm Hollywood's most iconic blonde, famous for 'Some Like It Hot'"
    ]
  },
];

let usedFallbackIndices = new Set();

async function generateFamousPerson() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('No GEMINI_API_KEY set, using fallback for Famous Faces');
    return useFallback();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a game host for "Famous Faces" — a party game where players guess famous people from funny, cryptic hints.

Pick a UNIVERSALLY well-known famous person (alive or dead, real — NOT fictional). They should be someone most adults worldwide would recognize. Think: world leaders, mega celebrities, legendary athletes, iconic scientists, historic figures.

Generate exactly 5 hints about them. The hints should be FUNNY, WITTY, and use WORDPLAY/PUNS.

Rules for hints:
- Hint 1: Extremely cryptic. Uses puns, double meanings, or obscure references. Nearly impossible to guess from this alone.
- Hint 2: Still cryptic but introduces a second angle or reference.
- Hint 3: Getting clearer. References something they're well-known for, but described indirectly or humorously.
- Hint 4: More direct and specific. Most people should start guessing correctly here.
- Hint 5: Almost a giveaway, but still written in a fun, humorous way.

Each hint should be 1-2 sentences max. Write them in first person as if the famous person is describing themselves.

Return ONLY valid JSON, no markdown:
{"person": "Full Name", "hints": ["hint1", "hint2", "hint3", "hint4", "hint5"]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.person || !parsed.hints || parsed.hints.length !== 5) {
      throw new Error('Invalid response format');
    }

    return { person: parsed.person, hints: parsed.hints };
  } catch (err) {
    console.error('Gemini API error for Famous Faces:', err.message);
    return useFallback();
  }
}

function useFallback() {
  // Try to avoid repeats
  if (usedFallbackIndices.size >= FALLBACK_ROUNDS.length) {
    usedFallbackIndices.clear();
  }
  let idx;
  do {
    idx = Math.floor(Math.random() * FALLBACK_ROUNDS.length);
  } while (usedFallbackIndices.has(idx));
  usedFallbackIndices.add(idx);
  return { ...FALLBACK_ROUNDS[idx] };
}

function isCorrectGuess(guess, answer) {
  const normalize = s => s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const g = normalize(guess);
  const a = normalize(answer);

  if (!g || g.length < 2) return false;
  if (g === a) return true;

  // Last name match
  const parts = a.split(/\s+/);
  if (parts.length > 1) {
    const lastName = parts[parts.length - 1];
    if (g === lastName && lastName.length >= 3) return true;
  }

  // Full name contained
  if (g.includes(a)) return true;

  // Remove spaces and check
  const gNoSpace = g.replace(/\s+/g, '');
  const aNoSpace = a.replace(/\s+/g, '');
  if (gNoSpace === aNoSpace) return true;

  return false;
}

function createFFRoom(playerId, playerName, settings, { rooms, AVATARS, AVATAR_COLORS }) {
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = {
    code: roomCode,
    gameType: 'famous-faces',
    hostId: playerId,
    players: [{
      id: playerId,
      name: playerName,
      avatar: AVATARS[0],
      avatarColor: AVATAR_COLORS[0],
      connected: true,
    }],
    settings: {
      rounds: settings.rounds || 5,
      roundDuration: settings.roundDuration || 90,
      hintInterval: settings.hintInterval || 10,
      maxPlayers: 32,
    },
    state: 'lobby',
    currentRound: 0,
    answer: null,
    hints: [],
    hintsRevealed: 0,
    correctGuesses: {},
    guessFeed: [],
    scores: {},
    roundScores: {},
    timer: null,
    timerEnd: null,
    hintTimers: [],
  };
  rooms.set(roomCode, room);
  return room;
}

function getPublicFFRoom(room, requesterId) {
  const showAnswer = room.state === 'roundResult' || room.state === 'gameOver';
  const hasGuessed = !!room.correctGuesses[requesterId];

  return {
    code: room.code,
    gameType: 'famous-faces',
    hostId: room.hostId,
    settings: room.settings,
    state: room.state,
    currentRound: room.currentRound,
    answer: showAnswer ? room.answer : (hasGuessed ? room.answer : null),
    hints: room.hints.slice(0, room.hintsRevealed),
    totalHints: 5,
    hintsRevealed: room.hintsRevealed,
    correctGuesses: Object.fromEntries(
      Object.entries(room.correctGuesses).map(([pid, data]) => [pid, { score: data.score, hintsAtGuess: data.hintsAtGuess }])
    ),
    guessFeed: room.guessFeed.slice(-50),
    scores: room.scores,
    roundScores: room.roundScores,
    timerEnd: room.timerEnd,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      avatarColor: p.avatarColor,
      connected: p.connected,
    })),
  };
}

function broadcastFFRoom(room, io, getSocketId) {
  room.players.forEach(p => {
    const sid = getSocketId(p.id);
    if (sid) {
      io.to(sid).emit('room:update', getPublicFFRoom(room, p.id));
    }
  });
}

function clearFFTimers(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
  if (room.hintTimers) {
    room.hintTimers.forEach(t => clearTimeout(t));
    room.hintTimers = [];
  }
  room.timerEnd = null;
}

function calculateScore(hintsAtGuess, timeRemaining) {
  const hintsBonus = (6 - hintsAtGuess) * 100; // 500, 400, 300, 200, 100
  const timeBonus = Math.floor(timeRemaining);
  return hintsBonus + timeBonus;
}

async function startFFRound(room, io, getSocketId) {
  const roundData = await generateFamousPerson();
  room.answer = roundData.person;
  room.hints = roundData.hints;
  room.hintsRevealed = 1;
  room.correctGuesses = {};
  room.guessFeed = [];
  room.roundScores = {};
  room.state = 'playing';

  const duration = room.settings.roundDuration;
  room.timerEnd = Date.now() + duration * 1000;

  // Main round timer
  room.timer = setTimeout(() => {
    endFFRound(room, io, getSocketId);
  }, duration * 1000);

  // Schedule hint reveals
  room.hintTimers = [];
  for (let i = 2; i <= 5; i++) {
    const delay = (i - 1) * room.settings.hintInterval * 1000;
    if (delay < duration * 1000) {
      const timer = setTimeout(() => {
        if (room.state === 'playing') {
          room.hintsRevealed = i;
          broadcastFFRoom(room, io, getSocketId);
        }
      }, delay);
      room.hintTimers.push(timer);
    }
  }

  broadcastFFRoom(room, io, getSocketId);
}

function endFFRound(room, io, getSocketId) {
  clearFFTimers(room);

  // Check if there are more rounds
  room.currentRound++;
  if (room.currentRound >= room.settings.rounds) {
    room.state = 'gameOver';
  } else {
    room.state = 'roundResult';
  }

  broadcastFFRoom(room, io, getSocketId);
}

function checkAllGuessed(room, io, getSocketId) {
  const allGuessed = room.players.every(p => !p.connected || room.correctGuesses[p.id]);
  if (allGuessed) {
    // End round early - everyone got it
    setTimeout(() => {
      if (room.state === 'playing') {
        endFFRound(room, io, getSocketId);
      }
    }, 1500);
  }
}

export function setupFamousFaces(io, socket, playerId, shared) {
  const { rooms, playerSockets, getSocketId, findRoomByPlayer, AVATARS, AVATAR_COLORS } = shared;

  // Handle reconnection for FF rooms
  const existingRoom = findRoomByPlayer(playerId);
  if (existingRoom && existingRoom.gameType === 'famous-faces') {
    const player = existingRoom.players.find(p => p.id === playerId);
    if (player) {
      player.connected = true;
      broadcastFFRoom(existingRoom, io, getSocketId);
    }
  }

  function leaveFFRoom(pid, room) {
    const idx = room.players.findIndex(p => p.id === pid);
    if (idx === -1) return;

    if (room.state === 'lobby') {
      room.players.splice(idx, 1);
      if (room.players.length === 0) {
        clearFFTimers(room);
        rooms.delete(room.code);
      } else {
        if (room.hostId === pid) {
          room.hostId = room.players[0].id;
        }
        broadcastFFRoom(room, io, getSocketId);
      }
    }
  }

  socket.on('ff:room:create', async ({ playerName, settings }, callback) => {
    const oldRoom = findRoomByPlayer(playerId);
    if (oldRoom && oldRoom.gameType === 'famous-faces') leaveFFRoom(playerId, oldRoom);

    const room = createFFRoom(playerId, playerName, settings || {}, { rooms, AVATARS, AVATAR_COLORS });
    callback({ success: true, room: getPublicFFRoom(room, playerId) });
  });

  socket.on('ff:room:join', ({ roomCode, playerName }, callback) => {
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return callback({ error: 'Room not found' });
    if (room.gameType !== 'famous-faces') return callback({ error: 'Wrong game type' });
    if (room.state !== 'lobby') return callback({ error: 'Game already in progress' });
    if (room.players.length >= room.settings.maxPlayers) return callback({ error: 'Room is full' });

    const existing = room.players.find(p => p.id === playerId);
    if (existing) {
      existing.connected = true;
      broadcastFFRoom(room, io, getSocketId);
      return callback({ success: true, room: getPublicFFRoom(room, playerId) });
    }

    if (room.players.some(p => p.name === playerName)) return callback({ error: 'Name already taken' });

    const oldRoom = findRoomByPlayer(playerId);
    if (oldRoom) leaveFFRoom(playerId, oldRoom);

    const avatarIndex = room.players.length % AVATARS.length;
    room.players.push({
      id: playerId,
      name: playerName,
      avatar: AVATARS[avatarIndex],
      avatarColor: AVATAR_COLORS[avatarIndex],
      connected: true,
    });

    broadcastFFRoom(room, io, getSocketId);
    callback({ success: true, room: getPublicFFRoom(room, playerId) });
  });

  socket.on('ff:game:start', async (_, callback) => {
    const room = findRoomByPlayer(playerId);
    if (!room || room.gameType !== 'famous-faces') return callback({ error: 'Not in a Famous Faces room' });
    if (room.hostId !== playerId) return callback({ error: 'Only the host can start' });
    if (room.state !== 'lobby' && room.state !== 'gameOver') return callback({ error: 'Game already running' });

    if (room.players.length < 2) return callback({ error: 'Need at least 2 players' });

    // Reset scores if starting fresh from gameOver
    if (room.state === 'gameOver') {
      room.scores = {};
      room.currentRound = 0;
    }

    // Initialize scores
    room.players.forEach(p => {
      if (!room.scores[p.id]) room.scores[p.id] = 0;
    });

    await startFFRound(room, io, getSocketId);
    callback({ success: true });
  });

  socket.on('ff:guess', ({ text }, callback) => {
    const room = findRoomByPlayer(playerId);
    if (!room || room.gameType !== 'famous-faces' || room.state !== 'playing') {
      return callback?.({ error: 'Cannot guess right now' });
    }

    if (room.correctGuesses[playerId]) {
      return callback?.({ error: 'You already guessed correctly!' });
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) return callback?.({ error: 'Player not found' });

    const guess = text.substring(0, 100).trim();
    if (!guess) return callback?.({ error: 'Empty guess' });

    const correct = isCorrectGuess(guess, room.answer);

    if (correct) {
      const timeRemaining = Math.max(0, (room.timerEnd - Date.now()) / 1000);
      const score = calculateScore(room.hintsRevealed, timeRemaining);

      room.correctGuesses[playerId] = {
        time: Date.now(),
        hintsAtGuess: room.hintsRevealed,
        score,
      };

      room.roundScores[playerId] = score;
      room.scores[playerId] = (room.scores[playerId] || 0) + score;

      room.guessFeed.push({
        playerId,
        playerName: player.name,
        avatar: player.avatar,
        avatarColor: player.avatarColor,
        text: null, // Don't reveal the answer
        correct: true,
        timestamp: Date.now(),
      });

      callback?.({ success: true, correct: true, score });
      broadcastFFRoom(room, io, getSocketId);
      checkAllGuessed(room, io, getSocketId);
    } else {
      room.guessFeed.push({
        playerId,
        playerName: player.name,
        avatar: player.avatar,
        avatarColor: player.avatarColor,
        text: guess,
        correct: false,
        timestamp: Date.now(),
      });

      callback?.({ success: true, correct: false });
      broadcastFFRoom(room, io, getSocketId);
    }
  });

  socket.on('ff:continue', async (_, callback) => {
    const room = findRoomByPlayer(playerId);
    if (!room || room.gameType !== 'famous-faces') return callback?.({ error: 'Not in a Famous Faces room' });
    if (room.hostId !== playerId) return callback?.({ error: 'Only the host can continue' });
    if (room.state !== 'roundResult') return callback?.({ error: 'Cannot continue now' });

    await startFFRound(room, io, getSocketId);
    callback?.({ success: true });
  });
}

// Handle FF-specific disconnect logic
export function handleFFDisconnect(playerId, room, io, getSocketId, rooms) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) return;

  player.connected = false;

  if (room.state === 'lobby') {
    setTimeout(() => {
      if (!getSocketId(playerId)) {
        const idx = room.players.findIndex(p => p.id === playerId);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          if (room.players.length === 0) {
            clearFFTimers(room);
            rooms.delete(room.code);
          } else {
            if (room.hostId === playerId) {
              room.hostId = room.players[0].id;
            }
            broadcastFFRoom(room, io, getSocketId);
          }
        }
      }
    }, 10000);
  }

  broadcastFFRoom(room, io, getSocketId);
}
