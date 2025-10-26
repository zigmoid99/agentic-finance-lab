import React from 'react';
import type { LetterStatus } from '../types';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  usedLetters: Map<string, LetterStatus>;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  onEnter,
  onBackspace,
  usedLetters,
  disabled = false,
}) => {
  const getKeyClass = (key: string): string => {
    if (key === 'ENTER' || key === 'BACK') {
      return 'bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4';
    }

    const status = usedLetters.get(key);
    if (!status || status === 'empty') {
      return 'bg-gray-300 hover:bg-gray-400 text-gray-800';
    }

    const statusColors = {
      correct: 'bg-green-500 text-white',
      present: 'bg-yellow-500 text-white',
      absent: 'bg-gray-500 text-white',
      empty: 'bg-gray-300 text-gray-800',
    };

    return statusColors[status];
  };

  const handleKeyClick = (key: string) => {
    if (disabled) return;

    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACK') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex justify-center gap-1 mb-2"
        >
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyClick(key)}
              disabled={disabled}
              className={`
                ${getKeyClass(key)}
                ${key === 'ENTER' || key === 'BACK' ? 'text-xs' : ''}
                py-4 px-2 min-w-[32px] rounded font-bold
                transition-all duration-200 transform
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {key === 'BACK' ? '⌫' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
