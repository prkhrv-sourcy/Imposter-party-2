import { GoogleGenAI } from '@google/genai';

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
  {
    person: 'Snoop Dogg',
    hints: [
      "I turned 'izzle' into an entire dialect",
      "I went from gangsta rap to cooking shows and nobody batted an eye",
      "I carried the Olympic torch while looking absolutely fabulous",
      "My friendship with a white-haired TV cook is the most unlikely bromance ever",
      "I'm a Long Beach rapper who loves gin and juice and says 'fo shizzle'"
    ]
  },
  {
    person: 'Frida Kahlo',
    hints: [
      "My eyebrows have more fans than most artists' entire portfolios",
      "I turned pain into paint and made suffering look beautiful",
      "My husband was also a famous painter but somehow even more dramatic than me",
      "A bus accident changed my life and I spent months painting from my bed",
      "I'm a Mexican artist famous for surreal self-portraits and a unibrow"
    ]
  },
  {
    person: 'Muhammad Ali',
    hints: [
      "I floated and stung — turns out I was describing my fighting style, not a pool party",
      "I changed my name and the world had to deal with it",
      "I once trash-talked so well my opponent was defeated before the bell rang",
      "I refused to go to war and lost my title but won respect",
      "I'm The Greatest — a heavyweight boxing champion who could rhyme as well as fight"
    ]
  },
  {
    person: 'Adele',
    hints: [
      "I have a habit of naming my work after my age like a time capsule",
      "I made an entire generation ugly cry in their cars",
      "I called from the other side and somehow everyone picked up",
      "I took a long break and came back like I never left — with a massive album",
      "I'm a British singer known for 'Hello', 'Rolling in the Deep', and making people weep"
    ]
  },
  {
    person: 'Napoleon Bonaparte',
    hints: [
      "People keep saying I was short but actually I was average height — it was propaganda!",
      "I put a crown on my own head because nobody else was worthy of doing it",
      "A winter vacation to Russia turned out to be a terrible idea",
      "I got exiled, came back, then got exiled AGAIN to a smaller island",
      "I'm a French emperor who conquered most of Europe and met my end at Waterloo"
    ]
  },
  {
    person: 'Bob Marley',
    hints: [
      "I told people not to worry about a thing and it became everyone's life motto",
      "I got shot and performed a concert two days later like it was nothing",
      "My hairstyle became a symbol of an entire movement",
      "I made a tiny Caribbean island the music capital of the world",
      "I'm a Jamaican reggae legend who sang 'One Love' and 'No Woman, No Cry'"
    ]
  },
  {
    person: 'Mark Zuckerberg',
    hints: [
      "I rated people's attractiveness in college and somehow that became a trillion-dollar company",
      "I got played by Jesse Eisenberg and honestly it was pretty accurate",
      "My wardrobe is 90% the same gray t-shirt",
      "I renamed my entire company after a virtual world nobody asked for",
      "I'm the founder of Facebook who started it from a Harvard dorm room"
    ]
  },
  {
    person: 'Serena Williams',
    hints: [
      "My sister and I turned a sport known for country clubs into a family business",
      "I've won more Grand Slams than most countries have tennis courts",
      "I once designed a catsuit that got banned from the French Open",
      "I served a tennis ball so hard it broke speed records",
      "I'm one of the greatest tennis players ever, with 23 Grand Slam titles"
    ]
  },
  {
    person: 'Walt Disney',
    hints: [
      "I built an empire on a mouse — and not the computer kind",
      "I got fired from a newspaper for 'lacking imagination' — that aged well",
      "I froze... my legacy in theme parks and animated movies. Rumors about the other freezing are false",
      "I created a magic kingdom where adults pay hundreds of dollars to wear mouse ears",
      "I'm the man behind Mickey Mouse, Disneyland, and the happiest place on earth"
    ]
  },
  {
    person: 'Lionel Messi',
    hints: [
      "I needed growth hormone shots as a kid — turned out to be a pretty good investment",
      "I had to leave my home country as a teenager to join a club in Catalonia",
      "I finally won the one trophy everyone said I'd never get — in a desert",
      "I have more Ballon d'Or awards than most teams have trophies",
      "I'm an Argentine footballer, considered the GOAT, who won the 2022 World Cup"
    ]
  },
  {
    person: 'Lady Gaga',
    hints: [
      "I wore a dress made of meat and PETA had a meltdown",
      "I was born this way but I definitely was not born with that name",
      "I went from pop star to Oscar-nominated actress and back again",
      "I fell off a stage with a fan and turned it into a viral moment",
      "I'm a pop icon named after a Queen song, known for 'Bad Romance' and wild outfits"
    ]
  },
  {
    person: 'Nikola Tesla',
    hints: [
      "I was in a current war and I won — alternating between genius and madness",
      "I fell in love with a pigeon and I'm not even embarrassed about it",
      "A billionaire named his car company after me centuries later",
      "I had a rivalry with Edison that makes Marvel rivalries look boring",
      "I'm a Serbian-American inventor who pioneered AC electricity and wireless technology"
    ]
  },
  {
    person: 'Kim Kardashian',
    hints: [
      "I broke the internet with a magazine cover and a bottle of champagne",
      "I started as someone's closet organizer and ended up a billionaire",
      "My family turned cameras following us around into a media empire",
      "I'm studying law which surprised literally everyone including me",
      "I'm a reality TV star from the Kardashian family, married to Kanye, famous for... being famous"
    ]
  },
  {
    person: 'Charles Darwin',
    hints: [
      "I took a cruise and it changed biology forever",
      "I stared at finch beaks for way too long and had a eureka moment",
      "My big idea made a lot of religious people very uncomfortable",
      "I waited 20 years to publish because I knew the drama it would cause",
      "I'm the British naturalist who wrote 'On the Origin of Species' and proposed evolution by natural selection"
    ]
  },
  {
    person: 'Drake',
    hints: [
      "I started from the bottom and apparently I'm still reminding everyone",
      "I was a Canadian teenager in a wheelchair on TV before I picked up a mic",
      "My dance moves became memes and honestly I leaned into it",
      "I have beef with basically every other rapper at some point",
      "I'm a Toronto rapper and former Degrassi actor known for 'Hotline Bling' and 'God's Plan'"
    ]
  },
  {
    person: 'Freddie Mercury',
    hints: [
      "I asked if this is real life or just fantasy, and people are still debating",
      "I had a vocal range so big it needed its own zip code",
      "I performed at Live Aid and it's still considered the greatest concert ever",
      "My mustache is more iconic than most people's entire careers",
      "I'm the legendary frontman of Queen who sang 'Bohemian Rhapsody'"
    ]
  },
  {
    person: 'Pablo Picasso',
    hints: [
      "I looked at faces and thought 'what if the eyes were on the same side?'",
      "I had a blue period, and no, I don't mean I was sad about laundry",
      "I could draw like Raphael at age 12 but spent my life learning to draw like a child",
      "I painted a bombing and it became the most powerful anti-war statement in art history",
      "I'm a Spanish artist who co-founded Cubism and painted 'Guernica'"
    ]
  },
  {
    person: 'Rihanna',
    hints: [
      "I haven't released an album in years but my makeup empire keeps printing money",
      "I sing about umbrellas but I look best in the rain without one",
      "I showed up to the Super Bowl halftime show visibly pregnant and still killed it",
      "I went from Barbados to Billionaire status",
      "I'm a Barbadian singer known for 'Umbrella' and 'Diamonds', and founder of Fenty Beauty"
    ]
  },
  {
    person: 'Isaac Newton',
    hints: [
      "An apple fell on my head and instead of eating it, I invented physics",
      "I beefed with Leibniz over who invented calculus — the original academic drama",
      "I stuck a needle in my own eye for science and wrote about it casually",
      "I ran the Royal Mint and personally hunted down counterfeiters like a detective",
      "I'm the English scientist who discovered gravity and wrote 'Principia Mathematica'"
    ]
  },
  {
    person: 'Arnold Schwarzenegger',
    hints: [
      "I said I'd be back so many times it became my entire personality",
      "I went from bodybuilding to movies to running the most populous US state",
      "My last name is a spelling bee's worst nightmare",
      "I was sent from the future to terminate things and then became a kindergarten cop",
      "I'm an Austrian-American actor and former California governor known for The Terminator"
    ]
  },
  {
    person: 'Cardi B',
    hints: [
      "I went from stripping to rapping to Congress-level political commentary",
      "I threw a shoe at a fashion event and it became front page news",
      "OKURRR became a sound that haunts people's dreams",
      "I was a reality TV star before my rap career even started",
      "I'm a Bronx rapper known for 'Bodak Yellow' and 'WAP' who used to be on Love & Hip Hop"
    ]
  },
  {
    person: 'Vincent van Gogh',
    hints: [
      "I gave someone a piece of my mind — and my ear — as a gift",
      "I only sold one painting while alive but now they're worth hundreds of millions",
      "I painted the night sky so beautifully that it ended up on everyone's dorm room wall",
      "I ate yellow paint because I thought it would put sunshine inside me",
      "I'm a Dutch post-impressionist painter known for 'Starry Night' and cutting off my ear"
    ]
  },
  {
    person: 'Jeff Bezos',
    hints: [
      "I started selling books in a garage and ended up owning... everything",
      "I went to space in something that looked very suspicious",
      "I got so rich I bought a newspaper just to have something to read",
      "My smile got suspiciously bigger as my net worth grew",
      "I'm the founder of Amazon and one of the richest people on Earth"
    ]
  },
  {
    person: 'Princess Diana',
    hints: [
      "I wore a revenge dress and invented an entire fashion genre",
      "My wedding was watched by 750 million people — no pressure",
      "I shook hands with AIDS patients when nobody else would",
      "My sons are a prince and a prince who moved to California",
      "I'm the People's Princess, first wife of King Charles III"
    ]
  },
  {
    person: 'Usain Bolt',
    hints: [
      "I celebrated before crossing the finish line and STILL broke the world record",
      "My surname is literally what I do — run fast like electricity",
      "I eat chicken nuggets before Olympic finals and still win gold",
      "I posed for a photo mid-race and it became the most iconic sports image ever",
      "I'm a Jamaican sprinter, the fastest human ever, who ran 100m in 9.58 seconds"
    ]
  },
  {
    person: 'Julia Roberts',
    hints: [
      "My smile is literally insured and worth every penny",
      "I was a pretty woman on Hollywood Boulevard and Richard Gere picked me up in a limo",
      "I ran away from weddings in multiple movies but eventually got married in real life",
      "I won an Oscar and thanked approximately 47 people in my speech",
      "I'm America's Sweetheart, known for 'Pretty Woman' and that megawatt smile"
    ]
  },
  {
    person: 'Genghis Khan',
    hints: [
      "My family tree is less of a tree and more of an entire forest across Asia",
      "I turned horseback archery into a method of world domination",
      "About 1 in 200 men alive today might be related to me — I was busy",
      "I united warring nomadic tribes and built the largest land empire in history",
      "I'm the Mongol emperor who conquered half of the known world in the 13th century"
    ]
  },
  {
    person: 'David Bowie',
    hints: [
      "I came from outer space — well, I played someone who did",
      "My eyes were different colors because of a schoolyard fight, not genetics",
      "I reinvented myself so many times even I lost count",
      "I was a Ziggy and a Thin White Duke and a Goblin King",
      "I'm a British rock icon known for 'Space Oddity', 'Heroes', and constantly changing personas"
    ]
  },
  {
    person: 'Morgan Freeman',
    hints: [
      "My voice could narrate a grocery list and win an Oscar for it",
      "I've played God twice and honestly? Believable casting",
      "I have more freckles than most connect-the-dot puzzles",
      "I went from Electric Company to Shawshank and drove Miss Daisy along the way",
      "I'm an American actor known for my narration voice, 'The Shawshank Redemption', and playing God"
    ]
  },
  {
    person: 'Billie Eilish',
    hints: [
      "I whisper into microphones and somehow fill entire arenas",
      "I wore baggy clothes so people would stop talking about my body — they talked about the clothes instead",
      "I made a hit song in my brother's bedroom and it went platinum",
      "I'm the youngest person to sweep the big four Grammy categories",
      "I'm a Gen Z pop star known for 'Bad Guy', green hair (sometimes), and whispery vocals"
    ]
  },
  {
    person: 'Neil Armstrong',
    hints: [
      "I took a small step and turned it into the most quoted sentence in human history",
      "My commute to work was about 240,000 miles one way",
      "I was so calm during an emergency landing that my heart rate barely changed",
      "Conspiracy theorists think my biggest achievement was filmed in a studio",
      "I'm the first person to walk on the Moon during Apollo 11 in 1969"
    ]
  },
  {
    person: 'Keanu Reeves',
    hints: [
      "I once sat alone on a bench eating a sandwich and the internet made me a meme of sadness",
      "I gave away millions from my movie salary to the special effects crew",
      "I dodged bullets in slow motion and it changed action movies forever",
      "I was excellent in a phone booth time machine before I became an assassin over a puppy",
      "I'm the actor behind Neo in The Matrix and John Wick, known as the internet's nicest person"
    ]
  },
  {
    person: 'Malala Yousafzai',
    hints: [
      "I got shot for wanting to go to school and then went to Oxford",
      "I became the youngest Nobel Prize winner and I wasn't even old enough to vote",
      "I wrote a blog under a fake name that changed the world",
      "A bus ride home nearly ended my life but started a global movement",
      "I'm a Pakistani activist for girls' education who survived a Taliban attack"
    ]
  },
  {
    person: 'Elvis Presley',
    hints: [
      "My hips were so dangerous they only showed me from the waist up on TV",
      "I lived in a mansion named after my girlfriend's estate — Graceland",
      "People keep spotting me in grocery stores decades after I supposedly died",
      "I served in the army and somehow got more famous",
      "I'm the King of Rock and Roll, known for 'Hound Dog' and a white jumpsuit"
    ]
  },
  {
    person: 'Emma Watson',
    hints: [
      "I've been casting spells since I was 11 and graduated to the United Nations",
      "I hid books around the subway for strangers to find",
      "My character punched a bully and it was the most satisfying movie moment of the 2000s",
      "I went from a magical school to an Ivy League one",
      "I'm the actress who played Hermione Granger in Harry Potter and became a UN Women Goodwill Ambassador"
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
    const ai = new GoogleGenAI({ apiKey });

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

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = result.text.trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.person || !parsed.hints || parsed.hints.length !== 5) {
      throw new Error('Invalid response format');
    }

    return { person: parsed.person, hints: parsed.hints };
  } catch (err) {
    console.error('[Famous Faces] Gemini error, falling back to presets:', err);
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
