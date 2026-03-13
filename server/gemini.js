import { GoogleGenAI } from '@google/genai';

const FALLBACK_CATEGORIES = [
  { category: 'Fruits', words: ['Mango', 'Banana', 'Strawberry', 'Pineapple', 'Watermelon', 'Kiwi'] },
  { category: 'Movies', words: ['Inception', 'Titanic', 'Avatar', 'Jaws', 'Frozen', 'Gladiator'] },
  { category: 'Animals', words: ['Elephant', 'Penguin', 'Chameleon', 'Dolphin', 'Flamingo', 'Octopus'] },
  { category: 'Countries', words: ['Japan', 'Brazil', 'Iceland', 'Egypt', 'Canada', 'Thailand'] },
  { category: 'Sports', words: ['Cricket', 'Tennis', 'Surfing', 'Fencing', 'Archery', 'Rugby'] },
  { category: 'Musical Instruments', words: ['Saxophone', 'Ukulele', 'Drums', 'Violin', 'Harmonica', 'Harp'] },
  { category: 'Food', words: ['Pizza', 'Sushi', 'Tacos', 'Croissant', 'Ramen', 'Gelato'] },
  { category: 'Occupations', words: ['Astronaut', 'Detective', 'Chef', 'Lifeguard', 'Pilot', 'Magician'] },
  { category: 'Landmarks', words: ['Eiffel Tower', 'Great Wall', 'Taj Mahal', 'Colosseum', 'Pyramids', 'Stonehenge'] },
  { category: 'Superheroes', words: ['Spider-Man', 'Batman', 'Wonder Woman', 'Thor', 'Wolverine', 'Aquaman'] },
];

export async function generateWordsForCategory(playerCount) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('No GEMINI_API_KEY set, using fallback categories');
    return useFallback();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a word game host. Pick a fun, interesting category and one specific word from that category for a party game. The word should be something most people know but specific enough to describe with clues.

Return ONLY valid JSON in this exact format, no markdown:
{"category": "Category Name", "word": "Specific Word"}

Be creative! Pick unusual but fun categories like "Things in a Haunted House", "Breakfast Foods Around the World", "Things That Glow", "Cartoon Characters", etc.`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    const text = result.text.trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      category: parsed.category,
      word: parsed.word,
      imposterWord: null
    };
  } catch (err) {
    console.error('[Word Game] Gemini error, falling back to presets:', err);
    return useFallback();
  }
}

function useFallback() {
  const cat = FALLBACK_CATEGORIES[Math.floor(Math.random() * FALLBACK_CATEGORIES.length)];
  const word = cat.words[Math.floor(Math.random() * cat.words.length)];
  return { category: cat.category, word, imposterWord: null };
}
