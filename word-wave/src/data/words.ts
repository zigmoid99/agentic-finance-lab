import type { WordTheme } from '../types';

export const WORD_THEMES: WordTheme[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional 5-letter words for everyone',
    isPremium: false,
    words: [
      'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
      'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIGN', 'ALIKE', 'ALIVE', 'ALLOW',
      'ALONE', 'ALONG', 'ALTER', 'ANGEL', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY',
      'ARENA', 'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWAKE',
      'AWARD', 'AWARE', 'BADLY', 'BAKER', 'BASIC', 'BEACH', 'BEING', 'BELOW', 'BENCH', 'BIBLE',
      'BIRTH', 'BLACK', 'BLADE', 'BLAME', 'BLANK', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BOOST',
      'BOOTH', 'BOUND', 'BRAIN', 'BRAND', 'BREAD', 'BREAK', 'BREED', 'BRIEF', 'BRING', 'BROAD',
      'BROKE', 'BROWN', 'BUILD', 'BUYER', 'CABLE', 'CARRY', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR',
      'CHART', 'CHASE', 'CHEAP', 'CHECK', 'CHEST', 'CHIEF', 'CHILD', 'CHINA', 'CHOSE', 'CIVIL',
      'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK', 'CLOCK', 'CLOSE', 'COACH', 'COAST', 'COULD',
      'COUNT', 'COURT', 'COVER', 'CRAFT', 'CRASH', 'CRAZY', 'CREAM', 'CRIME', 'CROSS', 'CROWD',
      'CROWN', 'CYCLE', 'DAILY', 'DANCE', 'DATED', 'DEALT', 'DEATH', 'DEBUT', 'DELAY', 'DELTA',
      'DENSE', 'DEPTH', 'DOING', 'DOUBT', 'DOZEN', 'DRAFT', 'DRAMA', 'DRANK', 'DRAWN', 'DREAM',
      'DRESS', 'DRILL', 'DRINK', 'DRIVE', 'DROVE', 'DYING', 'EAGER', 'EARLY', 'EARTH', 'EIGHT',
      'ELECT', 'ELITE', 'EMPTY', 'ENEMY', 'ENJOY', 'ENTER', 'ENTRY', 'EQUAL', 'ERROR', 'EVENT',
      'EVERY', 'EXACT', 'EXIST', 'EXTRA', 'FAITH', 'FALSE', 'FAULT', 'FIBER', 'FIELD', 'FIFTH',
      'FIFTY', 'FIGHT', 'FINAL', 'FIRST', 'FIXED', 'FLASH', 'FLEET', 'FLOOR', 'FLUID', 'FOCUS',
      'FORCE', 'FORTH', 'FORTY', 'FORUM', 'FOUND', 'FRAME', 'FRANK', 'FRAUD', 'FRESH', 'FRONT',
      'FRUIT', 'FULLY', 'FUNNY', 'GIANT', 'GIVEN', 'GLASS', 'GLOBE', 'GOING', 'GRACE', 'GRADE',
      'GRAND', 'GRANT', 'GRASS', 'GREAT', 'GREEN', 'GROSS', 'GROUP', 'GROWN', 'GUARD', 'GUESS',
    ],
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Words inspired by the natural world',
    isPremium: false,
    words: [
      'BEACH', 'BLOOM', 'CORAL', 'CREEK', 'EARTH', 'FIELD', 'FLAME', 'FLORA', 'FRUIT', 'GRASS',
      'GREEN', 'GROVE', 'OCEAN', 'PLANT', 'RIVER', 'STONE', 'STORM', 'TREES', 'WATER', 'WAVES',
      'CLOUD', 'DAISY', 'FAUNA', 'FLORA', 'FROST', 'MAPLE', 'MOONS', 'MOUNT', 'PEAKS', 'PETAL',
      'SHORE', 'SOLAR', 'THORN', 'TIDES', 'TULIP', 'WINDS', 'WOODS',
    ],
  },
  {
    id: 'tech',
    name: 'Tech & Digital',
    description: 'Modern technology and digital terms',
    isPremium: true,
    words: [
      'ADMIN', 'AGILE', 'ALERT', 'ALPHA', 'BYTES', 'CACHE', 'CLICK', 'CLOUD', 'CODEC', 'CRYPT',
      'DEBUG', 'DELTA', 'DRAFT', 'EMAIL', 'ERROR', 'FIBER', 'FLASH', 'FRAME', 'GAMMA', 'HTTPS',
      'IMAGE', 'INDEX', 'INPUT', 'LOGIC', 'LOGIN', 'MACRO', 'MEDIA', 'MODEM', 'MOUSE', 'NODES',
      'PATCH', 'PIXEL', 'QUERY', 'QUEUE', 'REGEX', 'RESET', 'ROUTE', 'SCALE', 'SCOPE', 'SHELL',
      'STACK', 'SWIFT', 'SYNCS', 'TESTS', 'TOKEN', 'TRACE', 'USERS', 'VALUE', 'VIRUS', 'WAVES',
    ],
  },
  {
    id: 'space',
    name: 'Space & Cosmos',
    description: 'Explore the universe with astronomical words',
    isPremium: true,
    words: [
      'ASTRO', 'ATLAS', 'COMET', 'COSMOS', 'EARTH', 'LUNAR', 'MARS', 'MOON', 'NEBULA', 'ORBIT',
      'PHASE', 'PLUTO', 'PROBE', 'QUARK', 'RADIO', 'ROCKS', 'SOLAR', 'SPACE', 'STARS', 'TITAN',
      'VENUS', 'VOIDS', 'ZONES',
    ],
  },
  {
    id: 'food',
    name: 'Food & Cuisine',
    description: 'Delicious words from the culinary world',
    isPremium: true,
    words: [
      'APPLE', 'BACON', 'BAGEL', 'BASIL', 'BEANS', 'BREAD', 'BRINE', 'BROTH', 'CANDY', 'CARBS',
      'CHARD', 'CREAM', 'CRISP', 'CURRY', 'DATES', 'DOUGH', 'FEAST', 'FLOUR', 'FRUIT', 'FUDGE',
      'GRAPE', 'GRILL', 'HERBS', 'HONEY', 'JUICE', 'LEMON', 'MANGO', 'MELON', 'OLIVE', 'ONION',
      'PASTA', 'PEACH', 'PEARL', 'PIZZA', 'PLATE', 'PRUNE', 'SALAD', 'SAUCE', 'SPICE', 'STEAK',
      'SUGAR', 'SUSHI', 'SWEET', 'SYRUP', 'TOAST', 'WAFER', 'WHEAT',
    ],
  },
];

// Get a random word from a theme
export const getRandomWord = (theme: WordTheme): string => {
  const randomIndex = Math.floor(Math.random() * theme.words.length);
  return theme.words[randomIndex];
};

// Get daily word (deterministic based on date)
export const getDailyWord = (): string => {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const classicTheme = WORD_THEMES[0];
  const index = dayOfYear % classicTheme.words.length;
  return classicTheme.words[index];
};

// Validate if a word is a valid English word (simple check for now)
export const isValidWord = (word: string): boolean => {
  // In a production app, you'd use a comprehensive dictionary API
  // For now, we'll accept any 5-letter word
  return word.length === 5 && /^[A-Z]+$/.test(word);
};
