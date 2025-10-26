export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export interface Letter {
  char: string;
  status: LetterStatus;
}

export interface WordTheme {
  id: string;
  name: string;
  description: string;
  words: string[];
  isPremium: boolean;
}

export interface GameMode {
  type: 'daily' | 'unlimited' | 'themed';
  theme?: WordTheme;
}

export interface GameState {
  currentWord: string;
  guesses: string[];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  attempts: number;
  maxAttempts: number;
  wave: number;
  score: number;
  streak: number;
}

export interface Statistics {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
  bestWave: number;
  winDistribution: Record<number, number>;
}

export interface UserProgress {
  isPremium: boolean;
  unlockedThemes: string[];
  statistics: Statistics;
  lastPlayedDaily: string | null;
  dailyCompleted: boolean;
}
