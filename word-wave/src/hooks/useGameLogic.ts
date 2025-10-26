import { useState, useCallback } from 'react';
import type { GameState, LetterStatus, GameMode } from '../types';
import { getRandomWord, getDailyWord, isValidWord, WORD_THEMES } from '../data/words';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

export const useGameLogic = (mode: GameMode) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const word = mode.type === 'daily'
      ? getDailyWord()
      : mode.type === 'themed' && mode.theme
        ? getRandomWord(mode.theme)
        : getRandomWord(WORD_THEMES[0]);

    return {
      currentWord: word,
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      wave: 1,
      score: 0,
      streak: 0,
    };
  });

  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState('');

  // Check letter status in the word
  const getLetterStatus = useCallback((letter: string, position: number, _word: string): LetterStatus => {
    const targetWord = gameState.currentWord;

    if (targetWord[position] === letter) {
      return 'correct';
    }

    if (targetWord.includes(letter)) {
      return 'present';
    }

    return 'absent';
  }, [gameState.currentWord]);

  // Add a letter to current guess
  const addLetter = useCallback((letter: string) => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.currentGuess.length >= WORD_LENGTH) return;

    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess + letter,
    }));
  }, [gameState.gameStatus, gameState.currentGuess.length]);

  // Remove last letter
  const removeLetter = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentGuess: prev.currentGuess.slice(0, -1),
    }));
  }, []);

  // Submit guess
  const submitGuess = useCallback(() => {
    if (gameState.currentGuess.length !== WORD_LENGTH) {
      setMessage('Not enough letters');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (!isValidWord(gameState.currentGuess)) {
      setMessage('Not a valid word');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const newGuesses = [...gameState.guesses, gameState.currentGuess];
    const isCorrect = gameState.currentGuess === gameState.currentWord;
    const attemptsUsed = newGuesses.length;

    let newGameStatus: 'playing' | 'won' | 'lost' = 'playing';
    let newScore = gameState.score;
    let newStreak = gameState.streak;

    if (isCorrect) {
      newGameStatus = 'won';
      // Score based on attempts used (fewer attempts = higher score)
      newScore += (MAX_ATTEMPTS - attemptsUsed + 1) * 100;
      newStreak += 1;
      setMessage('Excellent!');
    } else if (attemptsUsed >= MAX_ATTEMPTS) {
      newGameStatus = 'lost';
      newStreak = 0;
      setMessage(`The word was ${gameState.currentWord}`);
    } else {
      setMessage('');
    }

    setGameState(prev => ({
      ...prev,
      guesses: newGuesses,
      currentGuess: '',
      attempts: attemptsUsed,
      gameStatus: newGameStatus,
      score: newScore,
      streak: newStreak,
    }));
  }, [gameState]);

  // Start next wave (for unlimited mode)
  const nextWave = useCallback(() => {
    const theme = mode.type === 'themed' && mode.theme ? mode.theme : WORD_THEMES[0];
    const newWord = getRandomWord(theme);

    setGameState(prev => ({
      currentWord: newWord,
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      wave: prev.wave + 1,
      score: prev.score,
      streak: prev.streak,
    }));
    setMessage('');
  }, [mode]);

  // Reset game
  const resetGame = useCallback(() => {
    const word = mode.type === 'daily'
      ? getDailyWord()
      : mode.type === 'themed' && mode.theme
        ? getRandomWord(mode.theme)
        : getRandomWord(WORD_THEMES[0]);

    setGameState({
      currentWord: word,
      guesses: [],
      currentGuess: '',
      gameStatus: 'playing',
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      wave: 1,
      score: 0,
      streak: 0,
    });
    setMessage('');
  }, [mode]);

  return {
    gameState,
    addLetter,
    removeLetter,
    submitGuess,
    getLetterStatus,
    nextWave,
    resetGame,
    shake,
    message,
  };
};
