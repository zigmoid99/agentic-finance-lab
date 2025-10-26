import { useState, useEffect, useMemo } from 'react';
import type { GameMode, LetterStatus } from './types';
import { useGameLogic } from './hooks/useGameLogic';
import { useLocalStorage } from './hooks/useLocalStorage';
import { WORD_THEMES } from './data/words';
import { WordGrid } from './components/WordGrid';
import { Keyboard } from './components/Keyboard';
import { Modal } from './components/Modal';
import { Statistics } from './components/Statistics';

type Screen = 'menu' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>({ type: 'unlimited' });
  const [showStats, setShowStats] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  const {
    statistics,
    userProgress,
    updateStatistics,
    markDailyCompleted,
    checkDailyAvailable,
    upgradeToPremium,
  } = useLocalStorage();

  const {
    gameState,
    addLetter,
    removeLetter,
    submitGuess,
    getLetterStatus,
    nextWave,
    resetGame,
    shake,
    message,
  } = useGameLogic(gameMode);

  // Track used letters for keyboard coloring
  const usedLetters = useMemo(() => {
    const letterMap = new Map<string, LetterStatus>();
    gameState.guesses.forEach((guess) => {
      guess.split('').forEach((letter, index) => {
        const status = getLetterStatus(letter, index, guess);
        const currentStatus = letterMap.get(letter);

        // Priority: correct > present > absent
        if (!currentStatus ||
            (status === 'correct') ||
            (status === 'present' && currentStatus !== 'correct')) {
          letterMap.set(letter, status);
        }
      });
    });
    return letterMap;
  }, [gameState.guesses, getLetterStatus]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game' || gameState.gameStatus !== 'playing') return;

      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        removeLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, gameState.gameStatus, addLetter, removeLetter, submitGuess]);

  // Show game over modal
  useEffect(() => {
    if (gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') {
      setTimeout(() => setShowGameOver(true), 1500);
      updateStatistics(
        gameState.gameStatus === 'won',
        gameState.attempts,
        gameState.score,
        gameState.wave
      );

      if (gameMode.type === 'daily' && gameState.gameStatus === 'won') {
        markDailyCompleted();
      }
    }
  }, [gameState.gameStatus]);

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setScreen('game');
    resetGame();
  };

  const handleBackToMenu = () => {
    setScreen('menu');
    setShowGameOver(false);
    resetGame();
  };

  const handleNextWave = () => {
    setShowGameOver(false);
    nextWave();
  };

  const handlePlayAgain = () => {
    setShowGameOver(false);
    resetGame();
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = WORD_THEMES.find((t) => t.id === themeId);
    if (theme) {
      if (theme.isPremium && !userProgress.isPremium) {
        setShowPremium(true);
      } else {
        startGame({ type: 'themed', theme });
      }
    }
  };

  if (screen === 'menu') {
    const dailyAvailable = checkDailyAvailable();

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-bounce-in">
            <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Word Wave
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Ride the waves of words!
            </p>

            <div className="space-y-3">
              <button
                onClick={() => startGame({ type: 'daily' })}
                disabled={!dailyAvailable}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 ${
                  dailyAvailable
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {dailyAvailable ? '🌟 Daily Challenge' : '✓ Daily Complete'}
              </button>

              <button
                onClick={() => startGame({ type: 'unlimited' })}
                className="w-full py-4 px-6 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105"
              >
                🎮 Unlimited Mode
              </button>

              <div className="pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Choose a Theme:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {WORD_THEMES.map((theme) => {
                    const locked = theme.isPremium && !userProgress.isPremium;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeSelect(theme.id)}
                        className={`p-3 rounded-lg font-medium text-sm transition-all ${
                          locked
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700 hover:from-pink-200 hover:to-purple-200'
                        }`}
                      >
                        {locked && '🔒 '}
                        {theme.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setShowStats(true)}
                className="w-full py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                📊 Statistics
              </button>

              {!userProgress.isPremium && (
                <button
                  onClick={() => setShowPremium(true)}
                  className="w-full py-3 px-6 rounded-xl font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all"
                >
                  ⭐ Go Premium
                </button>
              )}
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              Score: {statistics.totalScore.toLocaleString()} | Streak: {statistics.currentStreak}
            </div>
          </div>
        </div>

        <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Your Statistics">
          <Statistics statistics={statistics} />
        </Modal>

        <Modal isOpen={showPremium} onClose={() => setShowPremium(false)} title="Premium Features">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">🌟 Premium Benefits</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Unlock all themed word collections</li>
                <li>✓ Tech & Digital words</li>
                <li>✓ Space & Cosmos words</li>
                <li>✓ Food & Cuisine words</li>
                <li>✓ Support development & get future updates</li>
              </ul>
            </div>

            <button
              onClick={() => {
                upgradeToPremium();
                setShowPremium(false);
              }}
              className="w-full py-3 px-6 rounded-lg font-bold text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all"
            >
              Upgrade to Premium - $2.99
            </button>

            <p className="text-xs text-gray-500 text-center">
              * This is a demo. In production, this would integrate with App Store/Google Play billing.
            </p>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleBackToMenu}
            className="px-4 py-2 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-100 transition-all"
          >
            ← Menu
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">Word Wave</h1>
            {gameMode.type === 'unlimited' && (
              <div className="text-sm text-white/80">Wave {gameState.wave}</div>
            )}
          </div>

          <button
            onClick={() => setShowStats(true)}
            className="px-4 py-2 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-100 transition-all"
          >
            📊
          </button>
        </div>

        {/* Score and Info */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex justify-around text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">{gameState.score}</div>
              <div className="text-xs opacity-80">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{gameState.streak}</div>
              <div className="text-xs opacity-80">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{gameState.attempts}/{gameState.maxAttempts}</div>
              <div className="text-xs opacity-80">Attempts</div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="text-center mb-4">
            <div className="inline-block bg-white px-6 py-2 rounded-full text-gray-800 font-semibold animate-bounce-in">
              {message}
            </div>
          </div>
        )}

        {/* Game Grid */}
        <div className="flex-1 flex items-center justify-center">
          <WordGrid
            guesses={gameState.guesses}
            currentGuess={gameState.currentGuess}
            maxAttempts={gameState.maxAttempts}
            wordLength={5}
            getLetterStatus={getLetterStatus}
            shake={shake}
          />
        </div>

        {/* Keyboard */}
        <div className="pb-4">
          <Keyboard
            onKeyPress={addLetter}
            onEnter={submitGuess}
            onBackspace={removeLetter}
            usedLetters={usedLetters}
            disabled={gameState.gameStatus !== 'playing'}
          />
        </div>

        {/* Game Over Modal */}
        <Modal
          isOpen={showGameOver}
          onClose={() => setShowGameOver(false)}
          title={gameState.gameStatus === 'won' ? '🎉 Victory!' : '😢 Game Over'}
        >
          <div className="space-y-4">
            <div className="text-center">
              {gameState.gameStatus === 'won' ? (
                <p className="text-lg">Congratulations! You solved it in {gameState.attempts} attempts!</p>
              ) : (
                <div>
                  <p className="text-lg mb-2">The word was:</p>
                  <p className="text-3xl font-bold text-indigo-600">{gameState.currentWord}</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-indigo-600">{gameState.score}</div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{gameState.wave}</div>
                  <div className="text-sm text-gray-600">Wave</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {gameMode.type === 'unlimited' && gameState.gameStatus === 'won' && (
                <button
                  onClick={handleNextWave}
                  className="w-full py-3 px-6 rounded-lg font-bold text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 transition-all"
                >
                  🌊 Next Wave
                </button>
              )}

              {gameMode.type !== 'daily' && (
                <button
                  onClick={handlePlayAgain}
                  className="w-full py-3 px-6 rounded-lg font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all"
                >
                  Play Again
                </button>
              )}

              <button
                onClick={handleBackToMenu}
                className="w-full py-3 px-6 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Your Statistics">
          <Statistics statistics={statistics} />
        </Modal>
      </div>
    </div>
  );
}

export default App;
