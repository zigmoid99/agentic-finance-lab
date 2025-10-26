import React from 'react';
import type { LetterStatus } from '../types';

interface WordGridProps {
  guesses: string[];
  currentGuess: string;
  maxAttempts: number;
  wordLength: number;
  getLetterStatus: (letter: string, position: number, word: string) => LetterStatus;
  shake?: boolean;
}

export const WordGrid: React.FC<WordGridProps> = ({
  guesses,
  currentGuess,
  maxAttempts,
  wordLength,
  getLetterStatus,
  shake = false,
}) => {
  const getStatusColor = (status: LetterStatus): string => {
    const colors = {
      correct: 'bg-green-500 border-green-600 text-white',
      present: 'bg-yellow-500 border-yellow-600 text-white',
      absent: 'bg-gray-500 border-gray-600 text-white',
      empty: 'bg-white border-gray-300 text-gray-800',
    };
    return colors[status];
  };

  const renderRow = (word: string, rowIndex: number, isCurrentGuess: boolean = false) => {
    const letters = word.padEnd(wordLength, ' ').split('');

    return (
      <div
        key={rowIndex}
        className={`flex gap-2 justify-center mb-2 ${shake && isCurrentGuess ? 'animate-shake' : ''}`}
      >
        {letters.map((letter, letterIndex) => {
          const status = letter === ' ' || isCurrentGuess
            ? 'empty'
            : getLetterStatus(letter, letterIndex, word);

          const filled = letter !== ' ';

          return (
            <div
              key={letterIndex}
              className={`
                w-14 h-14 border-2 rounded flex items-center justify-center
                text-2xl font-bold uppercase
                transition-all duration-300
                ${getStatusColor(status)}
                ${filled && !isCurrentGuess ? 'animate-flip' : ''}
                ${filled && isCurrentGuess ? 'border-gray-500 scale-105' : ''}
              `}
              style={{
                animationDelay: `${letterIndex * 100}ms`,
              }}
            >
              {letter !== ' ' ? letter : ''}
            </div>
          );
        })}
      </div>
    );
  };

  const emptyRows = maxAttempts - guesses.length - (currentGuess ? 1 : 0);

  return (
    <div className="my-6">
      {guesses.map((guess, index) => renderRow(guess, index, false))}
      {currentGuess && renderRow(currentGuess, guesses.length, true)}
      {Array.from({ length: emptyRows }).map((_, index) =>
        renderRow('', guesses.length + (currentGuess ? 1 : 0) + index, false)
      )}
    </div>
  );
};
