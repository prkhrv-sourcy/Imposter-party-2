import { GoogleGenAI } from '@google/genai';

const FALLBACK_CELEBRITIES = [
  {
    answer: 'Elon Musk',
    hints: [
      "I'm still madly in love with my X",
      "I promised everyone we'd move to the red planet... still working on that",
      "I named my kid like a WiFi password",
      "My cars don't need gas but my rockets definitely do",
      "I bought a social media platform and renamed it to a single letter"
    ]
  },
  {
    answer: 'Albert Einstein',
    hints: [
      "My hairdresser filed a missing persons report on me",
      "I proved that time flies when you're having fun... literally",
      "I wrote a love letter to the universe and it was only 5 characters long",
      "I left my homeland when a man with a tiny mustache got too powerful",
      "E equals mc squared was my mic drop moment"
    ]
  },
  {
    answer: 'Taylor Swift',
    hints: [
      "My exes have their own cinematic universe",
      "I made an entire stadium shake and scientists measured it",
      "I have more eras than a geology textbook",
      "I re-recorded my own music out of pure spite and made billions",
      "I'm a pop star who started in country and my last name means fast"
    ]
  },
  {
    answer: 'Leonardo DiCaprio',
    hints: [
      "I have a very strict dating policy involving the number 25",
      "An iceberg once ruined my love life",
      "The Academy made me wait over 20 years for my golden statue",
      "I fought a bear and somehow that's what finally won me an Oscar",
      "I was the king of the world on a sinking ship"
    ]
  },
  {
    answer: 'Cristiano Ronaldo',
    hints: [
      "SIUUUU is my battle cry",
      "I have more abs than most people have excuses",
      "I moved to a desert and broke every social media record",
      "I've scored in more countries than most people have visited",
      "I'm a Portuguese footballer who's rivals with a short Argentine"
    ]
  },
  {
    answer: 'Oprah Winfrey',
    hints: [
      "I once gave away cars to an entire audience and the internet never forgot",
      "My couch has heard more confessions than a priest",
      "I turned a talk show into a billion-dollar empire",
      "My book club can turn any novel into an instant bestseller",
      "You get a car! YOU get a car! EVERYBODY gets a car!"
    ]
  },
  {
    answer: 'Michael Jackson',
    hints: [
      "I wore one glove and nobody questioned it",
      "I could walk forward while moving backward and blew everyone's mind",
      "My pet chimp had a better social life than most humans",
      "I went from Jackson 5 to a thriller of a solo career",
      "I'm the King of Pop who moonwalked into music history"
    ]
  },
  {
    answer: 'Cleopatra',
    hints: [
      "I took milk baths before influencers made it cool",
      "I had a thing for powerful Roman men, especially ones named Julius",
      "A snake was involved in my dramatic exit from this world",
      "I ruled the land of pyramids and was the last of my dynasty",
      "I'm the most famous Queen of ancient Egypt"
    ]
  },
  {
    answer: 'Steve Jobs',
    hints: [
      "I made a fruit the most valuable brand in the world",
      "I wore the same outfit every day and called it visionary",
      "I got fired from my own company and came back to save it",
      "I convinced millions that they needed a phone without buttons",
      "I co-founded Apple and introduced the iPhone to the world"
    ]
  },
  {
    answer: 'Beyonce',
    hints: [
      "My fans are literally called an insect army",
      "I turned a lemonade stand into a cultural phenomenon",
      "I broke the internet by dropping an album without telling anyone",
      "I told everyone to put a ring on it",
      "I'm Queen Bey, married to Jay-Z, and I run the world"
    ]
  },
  {
    answer: 'Shakespeare',
    hints: [
      "I invented over 1,700 words because existing ones bored me",
      "To be or not to be... that was apparently MY question",
      "I wrote the original toxic relationship drama — two teens, a balcony, poison",
      "My theater was called the Globe and my works literally went worldwide",
      "I'm the Bard of Avon, history's most famous playwright"
    ]
  },
  {
    answer: 'Dwayne Johnson',
    hints: [
      "I used to ask people if they could detect what I was preparing",
      "I went from a wrestling ring to the highest-paid actor in Hollywood",
      "My eyebrow raise is more famous than most people's entire careers",
      "I'm technically a geological formation AND a movie star",
      "I'm The Rock — wrestler turned actor, known for action movies and raising one eyebrow"
    ]
  },
  {
    answer: 'Marie Curie',
    hints: [
      "My work literally glowed in the dark, and so did I eventually",
      "I collected Nobel Prizes like some people collect stamps — got two",
      "I moved from Poland to Paris for love and science",
      "My research element was so dangerous my notebooks are still radioactive",
      "I'm the first woman to win a Nobel Prize, known for discovering radium"
    ]
  },
  {
    answer: 'Gordon Ramsay',
    hints: [
      "I've made more people cry than most onions",
      "I call sandwiches 'idiot' more than I call them sandwiches",
      "My lamb sauce is perpetually missing",
      "I run restaurants with Michelin stars but I'm known for screaming in kitchens",
      "I'm a British celebrity chef famous for Hell's Kitchen and saying food is RAW"
    ]
  },
  {
    answer: 'Marilyn Monroe',
    hints: [
      "I stood over a subway grate and it became the most famous wardrobe malfunction in history",
      "I sang Happy Birthday in a way that made the president blush",
      "Diamonds were supposedly my closest companions",
      "I went from Norma Jeane to the biggest blonde bombshell of the 1950s",
      "I'm Hollywood's most iconic blonde, famous for 'Some Like It Hot'"
    ]
  },
  {
    answer: 'Snoop Dogg',
    hints: [
      "I turned 'izzle' into an entire dialect",
      "I went from gangsta rap to cooking shows and nobody batted an eye",
      "I carried the Olympic torch while looking absolutely fabulous",
      "My friendship with a white-haired TV cook is the most unlikely bromance ever",
      "I'm a Long Beach rapper who loves gin and juice and says 'fo shizzle'"
    ]
  },
  {
    answer: 'Frida Kahlo',
    hints: [
      "My eyebrows have more fans than most artists' entire portfolios",
      "I turned pain into paint and made suffering look beautiful",
      "My husband was also a famous painter but somehow even more dramatic than me",
      "A bus accident changed my life and I spent months painting from my bed",
      "I'm a Mexican artist famous for surreal self-portraits and a unibrow"
    ]
  },
  {
    answer: 'Muhammad Ali',
    hints: [
      "I floated and stung — turns out I was describing my fighting style, not a pool party",
      "I changed my name and the world had to deal with it",
      "I once trash-talked so well my opponent was defeated before the bell rang",
      "I refused to go to war and lost my title but won respect",
      "I'm The Greatest — a heavyweight boxing champion who could rhyme as well as fight"
    ]
  },
  {
    answer: 'Adele',
    hints: [
      "I have a habit of naming my work after my age like a time capsule",
      "I made an entire generation ugly cry in their cars",
      "I called from the other side and somehow everyone picked up",
      "I took a long break and came back like I never left — with a massive album",
      "I'm a British singer known for 'Hello', 'Rolling in the Deep', and making people weep"
    ]
  },
  {
    answer: 'Napoleon Bonaparte',
    hints: [
      "People keep saying I was short but actually I was average height — it was propaganda!",
      "I put a crown on my own head because nobody else was worthy of doing it",
      "A winter vacation to Russia turned out to be a terrible idea",
      "I got exiled, came back, then got exiled AGAIN to a smaller island",
      "I'm a French emperor who conquered most of Europe and met my end at Waterloo"
    ]
  },
  {
    answer: 'Bob Marley',
    hints: [
      "I told people not to worry about a thing and it became everyone's life motto",
      "I got shot and performed a concert two days later like it was nothing",
      "My hairstyle became a symbol of an entire movement",
      "I made a tiny Caribbean island the music capital of the world",
      "I'm a Jamaican reggae legend who sang 'One Love' and 'No Woman, No Cry'"
    ]
  },
  {
    answer: 'Mark Zuckerberg',
    hints: [
      "I rated people's attractiveness in college and somehow that became a trillion-dollar company",
      "I got played by Jesse Eisenberg and honestly it was pretty accurate",
      "My wardrobe is 90% the same gray t-shirt",
      "I renamed my entire company after a virtual world nobody asked for",
      "I'm the founder of Facebook who started it from a Harvard dorm room"
    ]
  },
  {
    answer: 'Serena Williams',
    hints: [
      "My sister and I turned a sport known for country clubs into a family business",
      "I've won more Grand Slams than most countries have tennis courts",
      "I once designed a catsuit that got banned from the French Open",
      "I served a tennis ball so hard it broke speed records",
      "I'm one of the greatest tennis players ever, with 23 Grand Slam titles"
    ]
  },
  {
    answer: 'Walt Disney',
    hints: [
      "I built an empire on a mouse — and not the computer kind",
      "I got fired from a newspaper for 'lacking imagination' — that aged well",
      "I froze... my legacy in theme parks and animated movies. Rumors about the other freezing are false",
      "I created a magic kingdom where adults pay hundreds of dollars to wear mouse ears",
      "I'm the man behind Mickey Mouse, Disneyland, and the happiest place on earth"
    ]
  },
  {
    answer: 'Lionel Messi',
    hints: [
      "I needed growth hormone shots as a kid — turned out to be a pretty good investment",
      "I had to leave my home country as a teenager to join a club in Catalonia",
      "I finally won the one trophy everyone said I'd never get — in a desert",
      "I have more Ballon d'Or awards than most teams have trophies",
      "I'm an Argentine footballer, considered the GOAT, who won the 2022 World Cup"
    ]
  },
  {
    answer: 'Lady Gaga',
    hints: [
      "I wore a dress made of meat and PETA had a meltdown",
      "I was born this way but I definitely was not born with that name",
      "I went from pop star to Oscar-nominated actress and back again",
      "I fell off a stage with a fan and turned it into a viral moment",
      "I'm a pop icon named after a Queen song, known for 'Bad Romance' and wild outfits"
    ]
  },
  {
    answer: 'Nikola Tesla',
    hints: [
      "I was in a current war and I won — alternating between genius and madness",
      "I fell in love with a pigeon and I'm not even embarrassed about it",
      "A billionaire named his car company after me centuries later",
      "I had a rivalry with Edison that makes Marvel rivalries look boring",
      "I'm a Serbian-American inventor who pioneered AC electricity and wireless technology"
    ]
  },
  {
    answer: 'Kim Kardashian',
    hints: [
      "I broke the internet with a magazine cover and a bottle of champagne",
      "I started as someone's closet organizer and ended up a billionaire",
      "My family turned cameras following us around into a media empire",
      "I'm studying law which surprised literally everyone including me",
      "I'm a reality TV star from the Kardashian family, married to Kanye, famous for... being famous"
    ]
  },
  {
    answer: 'Charles Darwin',
    hints: [
      "I took a cruise and it changed biology forever",
      "I stared at finch beaks for way too long and had a eureka moment",
      "My big idea made a lot of religious people very uncomfortable",
      "I waited 20 years to publish because I knew the drama it would cause",
      "I'm the British naturalist who wrote 'On the Origin of Species' and proposed evolution by natural selection"
    ]
  },
  {
    answer: 'Drake',
    hints: [
      "I started from the bottom and apparently I'm still reminding everyone",
      "I was a Canadian teenager in a wheelchair on TV before I picked up a mic",
      "My dance moves became memes and honestly I leaned into it",
      "I have beef with basically every other rapper at some point",
      "I'm a Toronto rapper and former Degrassi actor known for 'Hotline Bling' and 'God's Plan'"
    ]
  },
  {
    answer: 'Freddie Mercury',
    hints: [
      "I asked if this is real life or just fantasy, and people are still debating",
      "I had a vocal range so big it needed its own zip code",
      "I performed at Live Aid and it's still considered the greatest concert ever",
      "My mustache is more iconic than most people's entire careers",
      "I'm the legendary frontman of Queen who sang 'Bohemian Rhapsody'"
    ]
  },
  {
    answer: 'Pablo Picasso',
    hints: [
      "I looked at faces and thought 'what if the eyes were on the same side?'",
      "I had a blue period, and no, I don't mean I was sad about laundry",
      "I could draw like Raphael at age 12 but spent my life learning to draw like a child",
      "I painted a bombing and it became the most powerful anti-war statement in art history",
      "I'm a Spanish artist who co-founded Cubism and painted 'Guernica'"
    ]
  },
  {
    answer: 'Rihanna',
    hints: [
      "I haven't released an album in years but my makeup empire keeps printing money",
      "I sing about umbrellas but I look best in the rain without one",
      "I showed up to the Super Bowl halftime show visibly pregnant and still killed it",
      "I went from Barbados to Billionaire status",
      "I'm a Barbadian singer known for 'Umbrella' and 'Diamonds', and founder of Fenty Beauty"
    ]
  },
  {
    answer: 'Isaac Newton',
    hints: [
      "An apple fell on my head and instead of eating it, I invented physics",
      "I beefed with Leibniz over who invented calculus — the original academic drama",
      "I stuck a needle in my own eye for science and wrote about it casually",
      "I ran the Royal Mint and personally hunted down counterfeiters like a detective",
      "I'm the English scientist who discovered gravity and wrote 'Principia Mathematica'"
    ]
  },
  {
    answer: 'Arnold Schwarzenegger',
    hints: [
      "I said I'd be back so many times it became my entire personality",
      "I went from bodybuilding to movies to running the most populous US state",
      "My last name is a spelling bee's worst nightmare",
      "I was sent from the future to terminate things and then became a kindergarten cop",
      "I'm an Austrian-American actor and former California governor known for The Terminator"
    ]
  },
  {
    answer: 'Cardi B',
    hints: [
      "I went from stripping to rapping to Congress-level political commentary",
      "I threw a shoe at a fashion event and it became front page news",
      "OKURRR became a sound that haunts people's dreams",
      "I was a reality TV star before my rap career even started",
      "I'm a Bronx rapper known for 'Bodak Yellow' and 'WAP' who used to be on Love & Hip Hop"
    ]
  },
  {
    answer: 'Vincent van Gogh',
    hints: [
      "I gave someone a piece of my mind — and my ear — as a gift",
      "I only sold one painting while alive but now they're worth hundreds of millions",
      "I painted the night sky so beautifully that it ended up on everyone's dorm room wall",
      "I ate yellow paint because I thought it would put sunshine inside me",
      "I'm a Dutch post-impressionist painter known for 'Starry Night' and cutting off my ear"
    ]
  },
  {
    answer: 'Jeff Bezos',
    hints: [
      "I started selling books in a garage and ended up owning... everything",
      "I went to space in something that looked very suspicious",
      "I got so rich I bought a newspaper just to have something to read",
      "My smile got suspiciously bigger as my net worth grew",
      "I'm the founder of Amazon and one of the richest people on Earth"
    ]
  },
  {
    answer: 'Princess Diana',
    hints: [
      "I wore a revenge dress and invented an entire fashion genre",
      "My wedding was watched by 750 million people — no pressure",
      "I shook hands with AIDS patients when nobody else would",
      "My sons are a prince and a prince who moved to California",
      "I'm the People's Princess, first wife of King Charles III"
    ]
  },
  {
    answer: 'Usain Bolt',
    hints: [
      "I celebrated before crossing the finish line and STILL broke the world record",
      "My surname is literally what I do — run fast like electricity",
      "I eat chicken nuggets before Olympic finals and still win gold",
      "I posed for a photo mid-race and it became the most iconic sports image ever",
      "I'm a Jamaican sprinter, the fastest human ever, who ran 100m in 9.58 seconds"
    ]
  },
  {
    answer: 'Julia Roberts',
    hints: [
      "My smile is literally insured and worth every penny",
      "I was a pretty woman on Hollywood Boulevard and Richard Gere picked me up in a limo",
      "I ran away from weddings in multiple movies but eventually got married in real life",
      "I won an Oscar and thanked approximately 47 people in my speech",
      "I'm America's Sweetheart, known for 'Pretty Woman' and that megawatt smile"
    ]
  },
  {
    answer: 'Genghis Khan',
    hints: [
      "My family tree is less of a tree and more of an entire forest across Asia",
      "I turned horseback archery into a method of world domination",
      "About 1 in 200 men alive today might be related to me — I was busy",
      "I united warring nomadic tribes and built the largest land empire in history",
      "I'm the Mongol emperor who conquered half of the known world in the 13th century"
    ]
  },
  {
    answer: 'David Bowie',
    hints: [
      "I came from outer space — well, I played someone who did",
      "My eyes were different colors because of a schoolyard fight, not genetics",
      "I reinvented myself so many times even I lost count",
      "I was a Ziggy and a Thin White Duke and a Goblin King",
      "I'm a British rock icon known for 'Space Oddity', 'Heroes', and constantly changing personas"
    ]
  },
  {
    answer: 'Morgan Freeman',
    hints: [
      "My voice could narrate a grocery list and win an Oscar for it",
      "I've played God twice and honestly? Believable casting",
      "I have more freckles than most connect-the-dot puzzles",
      "I went from Electric Company to Shawshank and drove Miss Daisy along the way",
      "I'm an American actor known for my narration voice, 'The Shawshank Redemption', and playing God"
    ]
  },
  {
    answer: 'Billie Eilish',
    hints: [
      "I whisper into microphones and somehow fill entire arenas",
      "I wore baggy clothes so people would stop talking about my body — they talked about the clothes instead",
      "I made a hit song in my brother's bedroom and it went platinum",
      "I'm the youngest person to sweep the big four Grammy categories",
      "I'm a Gen Z pop star known for 'Bad Guy', green hair (sometimes), and whispery vocals"
    ]
  },
  {
    answer: 'Neil Armstrong',
    hints: [
      "I took a small step and turned it into the most quoted sentence in human history",
      "My commute to work was about 240,000 miles one way",
      "I was so calm during an emergency landing that my heart rate barely changed",
      "Conspiracy theorists think my biggest achievement was filmed in a studio",
      "I'm the first person to walk on the Moon during Apollo 11 in 1969"
    ]
  },
  {
    answer: 'Keanu Reeves',
    hints: [
      "I once sat alone on a bench eating a sandwich and the internet made me a meme of sadness",
      "I gave away millions from my movie salary to the special effects crew",
      "I dodged bullets in slow motion and it changed action movies forever",
      "I was excellent in a phone booth time machine before I became an assassin over a puppy",
      "I'm the actor behind Neo in The Matrix and John Wick, known as the internet's nicest person"
    ]
  },
  {
    answer: 'Malala Yousafzai',
    hints: [
      "I got shot for wanting to go to school and then went to Oxford",
      "I became the youngest Nobel Prize winner and I wasn't even old enough to vote",
      "I wrote a blog under a fake name that changed the world",
      "A bus ride home nearly ended my life but started a global movement",
      "I'm a Pakistani activist for girls' education who survived a Taliban attack"
    ]
  },
  {
    answer: 'Elvis Presley',
    hints: [
      "My hips were so dangerous they only showed me from the waist up on TV",
      "I lived in a mansion named after my girlfriend's estate — Graceland",
      "People keep spotting me in grocery stores decades after I supposedly died",
      "I served in the army and somehow got more famous",
      "I'm the King of Rock and Roll, known for 'Hound Dog' and a white jumpsuit"
    ]
  },
  {
    answer: 'Emma Watson',
    hints: [
      "I've been casting spells since I was 11 and graduated to the United Nations",
      "I hid books around the subway for strangers to find",
      "My character punched a bully and it was the most satisfying movie moment of the 2000s",
      "I went from a magical school to an Ivy League one",
      "I'm the actress who played Hermione Granger in Harry Potter and became a UN Women Goodwill Ambassador"
    ]
  },
];

const FALLBACK_ANIMALS = [
  {
    answer: 'Lion',
    hints: [
      "I'm royalty, but I let the ladies do all the actual hunting",
      "I nap around 20 hours a day and everyone still calls me majestic, not lazy",
      "My roar can be heard for miles, mostly when I want everyone to know I'm around",
      "I live in prides on the African savanna and I've got a big golden mane",
      "I'm the 'King of the Jungle', even though I actually live in the grasslands",
    ],
  },
  {
    answer: 'Penguin',
    hints: [
      "I wear a tuxedo everywhere, even to breakfast",
      "I'm a bird, but I gave up on the whole flying thing ages ago",
      "I slide around on my belly because walking is honestly too much effort",
      "I huddle with thousands of friends in Antarctica to survive the freezing cold",
      "I'm a black-and-white flightless bird that waddles and loves the ice",
    ],
  },
  {
    answer: 'Octopus',
    hints: [
      "I have three hearts and honestly none of them can commit",
      "I can taste things with my arms — all eight of them",
      "When things get awkward I squirt ink and vanish like a magician",
      "I can change color and squeeze my whole body through a gap the size of a coin",
      "I'm a clever sea creature with eight arms and a big squishy head",
    ],
  },
  {
    answer: 'Kangaroo',
    hints: [
      "I keep my kids in a front pocket because babysitters are expensive",
      "I literally can't walk backward, so I only ever move forward in life",
      "I throw punches when I'm angry and I've got the calves to back it up",
      "I bounce across the Australian outback on two very powerful legs",
      "I'm the Australian marsupial that hops around with a baby in my pouch",
    ],
  },
  {
    answer: 'Elephant',
    hints: [
      "They say I never forget — a face, a watering hole, or a grudge",
      "My nose doubles as a hand, a hose, and a trumpet",
      "When it gets too hot I flap my giant ears like a pair of fans",
      "I'm the largest animal on land and I've got tusks made of ivory",
      "I'm the huge grey animal with a long trunk who's supposedly scared of mice",
    ],
  },
  {
    answer: 'Giraffe',
    hints: [
      "I've got the longest neck in the room but I still can't reach the point",
      "My tongue is purple and longer than your whole arm",
      "I only sleep a few minutes a day because lying down is a whole production",
      "I nibble leaves from the very tallest trees on the African savanna",
      "I'm the tallest animal in the world, covered in spots with a giant neck",
    ],
  },
  {
    answer: 'Owl',
    hints: [
      "I can spin my head almost all the way around and it freaks everyone out",
      "I'm up all night and somehow everyone assumes that makes me wise",
      "I keep asking 'who?' but I never actually want an answer",
      "I hunt in total silence at night with huge eyes and sharp talons",
      "I'm the nocturnal bird known for hooting and looking very wise",
    ],
  },
  {
    answer: 'Chameleon',
    hints: [
      "I change my outfit to match my mood and my surroundings",
      "My two eyes work independently, so I'm literally looking both ways at once",
      "My tongue shoots out faster than you can blink to snatch lunch",
      "I'm a lizard that blends into any background to hide from trouble",
      "I'm the color-changing reptile with a curly tail and swiveling eyes",
    ],
  },
  {
    answer: 'Dolphin',
    hints: [
      "I sleep with only half my brain at a time — ultimate multitasker",
      "I chat in clicks and whistles and even call each friend by a name",
      "I love showing off with flips and jumps even when nobody asked",
      "I'm a super-smart sea mammal that swims in pods and 'sees' with sound",
      "I'm the friendly grey ocean mammal famous for leaping and echolocation",
    ],
  },
  {
    answer: 'Sloth',
    hints: [
      "I do everything in slow motion, including finishing this hint",
      "I only climb down from my tree about once a week for a bathroom break",
      "Algae actually grows on me because I move too slowly to shake it off",
      "I hang upside down in the rainforest canopy for most of the day",
      "I'm the slowest mammal alive, hanging around trees in Central America",
    ],
  },
];

const FALLBACK_CITIES = [
  {
    answer: 'Paris',
    hints: [
      "People travel from everywhere just to kiss under my iron lady",
      "I'm the capital of love, croissants, and dramatic shrugging",
      "A small painting of a faintly smiling woman lives in my most famous museum",
      "My iron tower lights up and sparkles for a few minutes every hour after dark",
      "I'm the capital of France, home to the Eiffel Tower and the Louvre",
    ],
  },
  {
    answer: 'New York City',
    hints: [
      "I'm so busy that I supposedly never actually sleep",
      "A giant green lady holds up a torch to welcome newcomers to me",
      "I numbered most of my streets because naming them all was too much effort",
      "I've got a big central park, bright lights on Broadway, and yellow taxis everywhere",
      "I'm the American city nicknamed 'the Big Apple', home to Times Square",
    ],
  },
  {
    answer: 'Tokyo',
    hints: [
      "I'm a place where the far future and ancient tradition share the same train",
      "My busiest crossing sends more people across at once than some towns hold",
      "I glow with neon, vending machines on every corner, and very polite crowds",
      "I'm the capital of Japan and one of the most populous cities on Earth",
      "I'm the Japanese megacity known for sushi, anime, and bullet trains",
    ],
  },
  {
    answer: 'London',
    hints: [
      "My most famous clock tower is actually named after the giant bell inside it",
      "I've got palace guards who won't crack a smile no matter what you do",
      "You can ride my giant riverside wheel or hop on my red double-decker buses",
      "I'm the capital of England, home to Big Ben and Buckingham Palace",
      "I'm the British city on the Thames with black cabs and a bridge that opens up",
    ],
  },
  {
    answer: 'Eiffel Tower',
    hints: [
      "I was only supposed to be temporary, but I overstayed by more than a century",
      "People called me a hideous eyesore when I was built; now they can't stop photographing me",
      "I'm made of iron and I actually grow a bit taller in summer when the metal expands",
      "I stand tall over a certain French capital and sparkle every night",
      "I'm the famous iron tower and symbol of Paris",
    ],
  },
  {
    answer: 'Great Wall of China',
    hints: [
      "I'm so long that people wrongly swear you can see me from space",
      "It took several dynasties and a lot of complaining to finally finish me",
      "I was built to keep unwanted visitors out; now I invite millions in",
      "I snake across mountains for thousands of miles in a single country",
      "I'm the enormous ancient wall that stretches across northern China",
    ],
  },
  {
    answer: 'Rome',
    hints: [
      "All roads supposedly lead to me, which explains my terrible traffic",
      "I've got an entire tiny separate country tucked inside me",
      "Toss a coin into my most famous fountain and you're promised to return",
      "My ancient stone arena once packed in crowds to watch gladiators",
      "I'm the capital of Italy, home to the Colosseum and the Vatican",
    ],
  },
  {
    answer: 'Pyramids of Giza',
    hints: [
      "I'm the last of the ancient wonders still standing after thousands of years",
      "Pharaohs used me as a very fancy, very permanent bedroom",
      "People still argue about exactly how I was built without any machines",
      "I rise out of the Egyptian desert in a giant triangular shape",
      "I'm the ancient pyramids near Cairo, built as tombs for kings",
    ],
  },
  {
    answer: 'Sydney',
    hints: [
      "My most famous building looks like a stack of sails that forgot the boat",
      "I've got a giant 'coat-hanger' bridge that people climb for fun",
      "I'm the harbor city where locals surf before breakfast",
      "I'm Australia's most famous city, known for Bondi Beach",
      "I'm the Aussie city with a sail-shaped Opera House and Harbour Bridge",
    ],
  },
  {
    answer: 'Venice',
    hints: [
      "My streets are made of water and my taxis float",
      "I'm slowly sinking but I refuse to make a big deal out of it",
      "Couples drift through me in long black boats steered by singing men",
      "I'm the Italian city of canals, masquerade masks, and carnival",
      "I'm the romantic Italian city with no roads — only canals and gondolas",
    ],
  },
];

const FALLBACK_MOVIES = [
  {
    answer: 'Titanic',
    hints: [
      "I promised you the whole ocean and then took that a little too literally",
      "There was definitely room for two on that floating door, whatever anyone says",
      "A rich girl and a poor artist fall in love aboard a doomed ship",
      "I'm the 1997 blockbuster where an iceberg ruins absolutely everything",
      "I'm the movie with Jack, Rose, and a very famous sinking ship",
    ],
  },
  {
    answer: 'The Lion King',
    hints: [
      "I'll teach you a two-word phrase for a problem-free philosophy",
      "A young prince runs away after his uncle does something unforgivable at a stampede",
      "Everything the light touches is part of my kingdom",
      "I'm the Disney animated classic set on the African savanna",
      "I'm the movie about Simba, Mufasa, and 'Hakuna Matata'",
    ],
  },
  {
    answer: 'Friends',
    hints: [
      "Six pals basically live in a coffee shop and never seem to do any work",
      "I'll be there for you — and I clap four times about it",
      "One of us was 'on a break' and we are STILL arguing about it",
      "I'm the 90s sitcom set in New York with Ross, Rachel, and Central Perk",
      "I'm the show about six friends hanging out in a purple-doored apartment",
    ],
  },
  {
    answer: 'Star Wars',
    hints: [
      "A long time ago, in a galaxy far, far away, I began",
      "The villain turned out to be the hero's own father — quite the plot twist",
      "May a certain mystical energy be with you, always",
      "I'm the space saga with lightsabers, the Force, and Darth Vader",
      "I'm the sci-fi epic with Luke Skywalker and the Death Star",
    ],
  },
  {
    answer: 'Harry Potter',
    hints: [
      "A boy finds out he's a wizard on his eleventh birthday",
      "My hero has a lightning scar and a nose-less enemy who must not be named",
      "Platform nine and three-quarters is where the adventure boards",
      "I'm the film series about a young wizard at a school of magic",
      "I'm the movies about Hogwarts, wands, and 'the boy who lived'",
    ],
  },
  {
    answer: 'Jurassic Park',
    hints: [
      "I spared no expense bringing the distant past back to life",
      "Life, uh, finds a way — usually a way out of the enclosure",
      "Cloned dinosaurs on a remote island: what could possibly go wrong?",
      "I'm the movie where a T. rex escapes and terrorizes the visitors",
      "I'm the blockbuster about a theme park full of resurrected dinosaurs",
    ],
  },
  {
    answer: 'Breaking Bad',
    hints: [
      "A high school chemistry teacher decides crime pays better than teaching",
      "I'm the one who knocks — remember that",
      "Say my name, and you'll know exactly who's in charge",
      "I'm the TV series about Walter White building a criminal empire",
      "I'm the show where a mild teacher becomes a kingpin called Heisenberg",
    ],
  },
  {
    answer: 'Frozen',
    hints: [
      "A certain catchy song about 'letting go' took over every household",
      "One sister freezes everything she touches and runs off to the mountains",
      "It turns out true love was between two sisters, not a prince",
      "I'm the Disney animated hit with Elsa, Anna, and a snowman named Olaf",
      "I'm the movie where a queen builds an ice castle and sings 'Let It Go'",
    ],
  },
  {
    answer: 'The Matrix',
    hints: [
      "Take the red pill and I'll show you how deep the rabbit hole goes",
      "There is no spoon, and honestly there never was",
      "Reality turns out to be a simulation, and one man learns to dodge bullets",
      "I'm the sci-fi film where Neo discovers the world is a computer program",
      "I'm the movie with green falling code, black trench coats, and 'bullet time'",
    ],
  },
  {
    answer: 'Game of Thrones',
    hints: [
      "Winter is coming, and I've been warning you about it for years",
      "You either win me or you die — there's no middle ground",
      "I've got dragons, backstabbing families, and a very uncomfortable iron chair",
      "I'm the fantasy series about noble houses fighting for the Iron Throne",
      "I'm the HBO show set in Westeros with the Starks and the Lannisters",
    ],
  },
];

const FALLBACK_FOODS = [
  {
    answer: 'Pizza',
    hints: [
      "I'm a circle, but I come in triangles and leave in a square box",
      "Some people put pineapple on me and start actual arguments about it",
      "I was born in Italy but America turned me into a delivery empire",
      "I'm dough topped with tomato sauce, melted cheese, and whatever you like",
      "I'm the round Italian dish served in slices at every party",
    ],
  },
  {
    answer: 'Sushi',
    hints: [
      "I'm proof that raw fish and rice can be classier than you",
      "I often come rolled up and I insist you eat me with two little sticks",
      "A tiny dab of my green paste will absolutely destroy your sinuses",
      "I'm the Japanese dish of vinegared rice, seaweed, and often raw fish",
      "I'm the rolled Japanese food you dip in soy sauce and eat with chopsticks",
    ],
  },
  {
    answer: 'Tacos',
    hints: [
      "I tend to fall apart the second you bite me, and that's part of my charm",
      "I've got my own celebrated day of the week",
      "I'm a folded shell hugging meat, cheese, salsa, and a squeeze of lime",
      "I'm the Mexican handheld dish stuffed with fillings in a tortilla",
      "I'm the folded Mexican food most famous on 'Tuesday'",
    ],
  },
  {
    answer: 'Ice Cream',
    hints: [
      "I give you a brain freeze and yet you keep coming back for more",
      "I'll melt all over your hand if you take too long admiring me",
      "I come in a cone, a cup, or straight from the tub at 2am",
      "I'm the frozen sweet treat that comes in flavors like vanilla and chocolate",
      "I'm the cold creamy dessert you scoop into a cone on a hot day",
    ],
  },
  {
    answer: 'Coffee',
    hints: [
      "I'm the reason a lot of people are even functional before 9am",
      "Folks pay five dollars for me daily and then wonder why they're broke",
      "I come from a bean, but I'm nobody's vegetable",
      "I'm the hot caffeinated drink brewed to wake you up in the morning",
      "I'm the morning beverage made from roasted beans, often with milk",
    ],
  },
  {
    answer: 'Hamburger',
    hints: [
      "I'm a patty living the good life between two soft buns",
      "Both a clown and a king claim to make the best version of me",
      "Lay a slice of cheese on me and suddenly I've got a whole new name",
      "I'm the grilled beef patty in a bun with lettuce, tomato, and sauce",
      "I'm the classic fast-food sandwich flipped fresh off the grill",
    ],
  },
  {
    answer: 'Chocolate',
    hints: [
      "I melt in your mouth, and tragically sometimes in your pocket",
      "I come from a bean but I'm the opposite of healthy, and I don't care",
      "People hand me over in heart-shaped boxes to say sorry or 'I love you'",
      "I'm the sweet brown treat made from cocoa",
      "I'm the candy that comes in bars — dark, milk, and white",
    ],
  },
  {
    answer: 'Popcorn',
    hints: [
      "I explode the moment things heat up — that's my entire personality",
      "You can't properly watch a movie without a bucket of me",
      "I start as a hard little kernel and end as a fluffy cloud",
      "I'm the snack that pops in the microwave or at the cinema",
      "I'm the buttery puffed-corn snack you munch at the movies",
    ],
  },
  {
    answer: 'Ramen',
    hints: [
      "I'm one of the few meals where loudly slurping is actually encouraged",
      "I went from cheap student survival food to a gourmet obsession",
      "I'm noodles swimming in a rich broth, often with a soft egg on top",
      "I'm the Japanese noodle soup best eaten piping hot",
      "I'm the beloved Japanese noodle bowl with broth, pork, and egg",
    ],
  },
];

// Theme registry. Each concrete theme drives both the Gemini prompt and the
// offline fallback pool. 'mix' is not listed here — it resolves to a random
// concrete theme per round (see resolveThemeKey).
const THEMES = {
  celebrities: {
    key: 'celebrities',
    label: 'Celebrities',
    noun: 'famous person',
    pick: 'a UNIVERSALLY well-known famous person (alive or dead, real — NOT fictional). Someone most adults worldwide would recognize. Think world leaders, mega celebrities, legendary athletes, iconic scientists, or historic figures.',
    persona: 'as if the famous person is describing themselves',
    fallback: FALLBACK_CELEBRITIES,
  },
  animals: {
    key: 'animals',
    label: 'Animals',
    noun: 'animal',
    pick: 'a well-known animal that almost anyone would instantly recognize (mammal, bird, reptile, sea creature, or insect — e.g. lion, penguin, octopus, kangaroo). Avoid obscure species.',
    persona: 'as if the animal is describing itself',
    fallback: FALLBACK_ANIMALS,
  },
  cities: {
    key: 'cities',
    label: 'Cities & Landmarks',
    noun: 'place',
    pick: 'a world-famous city or landmark most people would recognize (e.g. Paris, Tokyo, New York City, the Eiffel Tower, the Great Wall of China).',
    persona: 'as if the city or landmark is describing itself',
    fallback: FALLBACK_CITIES,
  },
  movies: {
    key: 'movies',
    label: 'Movies & TV',
    noun: 'movie or show',
    pick: 'a globally famous movie or TV show most people would recognize (e.g. Titanic, Friends, Breaking Bad, Star Wars, The Lion King).',
    persona: "as if the movie or show is describing itself, hinting at its plot, characters, or famous quotes WITHOUT ever saying its own title",
    fallback: FALLBACK_MOVIES,
  },
  foods: {
    key: 'foods',
    label: 'Foods & Drinks',
    noun: 'food or drink',
    pick: 'a common, well-known food or drink most people around the world would recognize (e.g. pizza, sushi, tacos, coffee, ice cream).',
    persona: 'as if the food or drink is describing itself',
    fallback: FALLBACK_FOODS,
  },
};

const CONCRETE_THEME_KEYS = Object.keys(THEMES);

// Normalize whatever the client sent into a valid configured theme selection.
// 'mix' is preserved; anything unknown falls back to celebrities.
function validThemeKey(key) {
  if (key === 'mix') return 'mix';
  return THEMES[key] ? key : 'celebrities';
}

// Turn a configured selection into the concrete theme for a single round.
// 'mix' picks a random concrete theme each time it's called.
function resolveThemeKey(configured) {
  if (configured === 'mix') {
    return CONCRETE_THEME_KEYS[Math.floor(Math.random() * CONCRETE_THEME_KEYS.length)];
  }
  return THEMES[configured] ? configured : 'celebrities';
}

// Pre-fetch queue: keyed by room code, each holds an array of pre-generated rounds
const prefetchQueue = new Map();
const PREFETCH_TARGET = 3; // Keep this many rounds buffered ahead

async function generateRoundFromGemini(theme, usedAnswers) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const avoidList = usedAnswers.length > 0
    ? `\n\nIMPORTANT: Do NOT pick any of these answers (already used this game): ${usedAnswers.join(', ')}`
    : '';

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a game host for "Famous Faces" — a party game where players guess a hidden answer from funny, cryptic hints.

The theme for this round is "${theme.label}". Pick ${theme.pick}

Generate exactly 5 hints about it. The hints should be FUNNY, WITTY, and use WORDPLAY/PUNS.

Rules for hints:
- Hint 1: Extremely cryptic. Uses puns, double meanings, or obscure references. Nearly impossible to guess from this alone.
- Hint 2: Still cryptic but introduces a second angle or reference.
- Hint 3: Getting clearer. References something it's well-known for, but described indirectly or humorously.
- Hint 4: More direct and specific. Most people should start guessing correctly here.
- Hint 5: Almost a giveaway, but still written in a fun, humorous way.

Each hint should be 1-2 sentences max. Write them in first person ${theme.persona}. Never write the answer itself inside any hint.

Return ONLY valid JSON, no markdown:
{"answer": "The Answer", "hints": ["hint1", "hint2", "hint3", "hint4", "hint5"]}${avoidList}`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = result.text.trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.answer || !parsed.hints || parsed.hints.length !== 5) {
      throw new Error('Invalid response format');
    }

    return { answer: parsed.answer, hints: parsed.hints, source: 'gemini', theme: theme.key };
  } catch (err) {
    console.error(`[Famous Faces] Gemini error (${theme.key}):`, err.message);
    return null;
  }
}

function useFallback(theme, usedAnswers) {
  const pool = theme.fallback;
  // Filter out already-used fallbacks
  const available = pool.filter(r => !usedAnswers.includes(r.answer.toLowerCase()));

  const pick = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]
    : pool[Math.floor(Math.random() * pool.length)]; // all used — reuse any

  return { answer: pick.answer, hints: pick.hints, source: 'fallback', theme: theme.key };
}

async function generateRound(theme, usedAnswers = []) {
  // Try Gemini first, fall back to local
  const result = await generateRoundFromGemini(theme, usedAnswers);
  if (result && !usedAnswers.includes(result.answer.toLowerCase())) {
    return result;
  }
  return useFallback(theme, usedAnswers);
}

// Get or create the prefetch state for a room
function getRoomQueue(roomCode) {
  if (!prefetchQueue.has(roomCode)) {
    prefetchQueue.set(roomCode, { queue: [], usedAnswers: [], filling: false, theme: 'celebrities' });
  }
  return prefetchQueue.get(roomCode);
}

// Set the configured theme for a room's prefetch queue (call before fillQueue)
function setRoomTheme(roomCode, theme) {
  getRoomQueue(roomCode).theme = validThemeKey(theme);
}

// Fill the prefetch queue in the background
function fillQueue(roomCode) {
  const state = getRoomQueue(roomCode);
  if (state.filling) return;
  const needed = PREFETCH_TARGET - state.queue.length;
  if (needed <= 0) return;

  state.filling = true;
  // Fire off generation calls in parallel. For 'mix' each round resolves to a
  // random concrete theme, so hint styles vary round to round.
  const promises = [];
  for (let i = 0; i < needed; i++) {
    const theme = THEMES[resolveThemeKey(state.theme)];
    promises.push(
      generateRound(theme, state.usedAnswers).then(result => {
        // Double-check no dup snuck in
        if (!state.usedAnswers.includes(result.answer.toLowerCase())) {
          state.usedAnswers.push(result.answer.toLowerCase());
          state.queue.push(result);
        }
      }).catch(err => {
        console.error('[Famous Faces] Prefetch error:', err.message);
      })
    );
  }
  Promise.all(promises).finally(() => {
    state.filling = false;
    console.log(`[Famous Faces] Queue for ${roomCode}: ${state.queue.length} rounds buffered`);
  });
}

// Pull next round from queue, or generate on-demand if queue is empty
async function getNextRound(roomCode) {
  const state = getRoomQueue(roomCode);

  if (state.queue.length > 0) {
    const round = state.queue.shift();
    // Refill in background
    fillQueue(roomCode);
    return round;
  }

  // Queue empty — generate on demand
  const theme = THEMES[resolveThemeKey(state.theme)];
  const result = await generateRound(theme, state.usedAnswers);
  state.usedAnswers.push(result.answer.toLowerCase());
  // Start filling for next rounds
  fillQueue(roomCode);
  return result;
}

// Clean up prefetch state when room is destroyed
export function cleanupFFPrefetch(roomCode) {
  prefetchQueue.delete(roomCode);
}

function isCorrectGuess(guess, answer, { lastWordMatch = false } = {}) {
  const normalize = s => s.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  // Ignore a leading article so "The Lion King" matches "Lion King", etc.
  const stripArticle = s => s.replace(/^(?:the|a|an)\s+/, '');

  // Normalize roman numerals to digits and vice versa for flexible matching
  const romanToDigit = s => s
    .replace(/\bviii\b/g, '8').replace(/\bvii\b/g, '7').replace(/\bvi\b/g, '6')
    .replace(/\biv\b/g, '4').replace(/\bv\b/g, '5')
    .replace(/\biii\b/g, '3').replace(/\bii\b/g, '2').replace(/\bi\b/g, '1')
    .replace(/\bix\b/g, '9').replace(/\bx\b/g, '10');
  const digitToRoman = s => s
    .replace(/\b10\b/g, 'x').replace(/\b9\b/g, 'ix').replace(/\b8\b/g, 'viii')
    .replace(/\b7\b/g, 'vii').replace(/\b6\b/g, 'vi').replace(/\b5\b/g, 'v')
    .replace(/\b4\b/g, 'iv').replace(/\b3\b/g, 'iii').replace(/\b2\b/g, 'ii')
    .replace(/\b1\b/g, 'i');

  const matchesAny = (g, a) => {
    if (g === a) return true;
    // Try with roman→digit normalization on both sides
    if (romanToDigit(g) === romanToDigit(a)) return true;
    if (digitToRoman(g) === digitToRoman(a)) return true;
    return false;
  };

  const g = normalize(guess);
  const a = normalize(answer);

  if (!g || g.length < 2) return false;
  if (matchesAny(g, a)) return true;

  // Match ignoring leading articles on either side
  if (matchesAny(stripArticle(g), stripArticle(a))) return true;

  // Last-word (surname) match — only for people, where "Einstein" should count.
  // Disabled for other themes so "China" doesn't win "Great Wall of China".
  if (lastWordMatch) {
    const parts = stripArticle(a).split(/\s+/);
    if (parts.length > 1) {
      const lastName = parts[parts.length - 1];
      if (g === lastName && lastName.length >= 3) return true;
    }
  }

  // Full answer contained in the guess
  if (g.includes(a)) return true;

  // Remove spaces and check (article-stripped)
  const gNoSpace = stripArticle(g).replace(/\s+/g, '');
  const aNoSpace = stripArticle(a).replace(/\s+/g, '');
  if (matchesAny(gNoSpace, aNoSpace)) return true;

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
      theme: validThemeKey(settings.theme),
      maxPlayers: 32,
    },
    state: 'lobby',
    currentRound: 0,
    answer: null,
    currentTheme: null,
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

  // Start pre-fetching rounds (in the chosen theme) as soon as the room exists
  setRoomTheme(roomCode, room.settings.theme);
  fillQueue(roomCode);

  return room;
}

// Build answer blanks with progressively revealed letters
// Returns array of words, each word is array of { letter, revealed }
function buildAnswerBlanks(answer, hintsRevealed, roomCode) {
  const words = answer.split(' ');

  // Determine reveal percentage based on hints
  // Hint 1-3: no letters, Hint 4: ~15%, Hint 5: ~30%
  const revealPercent = hintsRevealed <= 3 ? 0
    : hintsRevealed === 4 ? 0.15
    : 0.3;

  if (revealPercent === 0) {
    // Just return blanks with word lengths
    return words.map(word => word.split('').map(() => null));
  }

  // Use roomCode as seed for consistent reveals across broadcasts
  // (so the same letters stay revealed, not random new ones each time)
  return words.map((word, wi) => {
    const letters = word.split('');
    const totalToReveal = Math.max(1, Math.floor(letters.length * revealPercent));

    // Deterministic shuffle of indices using roomCode + word index as seed
    const seed = hashCode(roomCode + wi);
    const scramble = i => {
      // Mix seed and index thoroughly to avoid clustering
      let h = seed ^ (i * 2654435761);
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^ (h >>> 16)) >>> 0;
    };
    const indices = letters
      .map((_, i) => i)
      .sort((a, b) => scramble(a) - scramble(b));

    const revealSet = new Set(indices.slice(0, totalToReveal));

    return letters.map((ch, i) => revealSet.has(i) ? ch : null);
  });
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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
    // Concrete theme of the current round (matters most for Surprise Mix).
    // Falls back to the configured selection before the first round starts.
    theme: room.currentTheme || room.settings.theme,
    answer: showAnswer ? room.answer : (hasGuessed ? room.answer : null),
    answerBlanks: room.answer
      ? buildAnswerBlanks(room.answer, room.hintsRevealed, room.code)
      : [],
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
  const roundData = await getNextRound(room.code);
  room.answer = roundData.answer;
  room.currentTheme = roundData.theme;
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
        cleanupFFPrefetch(room.code);
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

    // Reset prefetch queue on new game
    if (room.state === 'gameOver') {
      cleanupFFPrefetch(room.code);
    }

    // Initialize scores
    room.players.forEach(p => {
      if (!room.scores[p.id]) room.scores[p.id] = 0;
    });

    // Start pre-fetching future rounds in background (in the room's theme)
    setRoomTheme(room.code, room.settings.theme);
    fillQueue(room.code);

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

    // Surname matching only makes sense for people ("Einstein" → Albert Einstein).
    const correct = isCorrectGuess(guess, room.answer, {
      lastWordMatch: room.currentTheme === 'celebrities',
    });

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
            cleanupFFPrefetch(room.code);
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
