import { useState, useEffect } from 'react';
import type { Statistics, UserProgress } from '../types';

const STORAGE_KEYS = {
  STATISTICS: 'wordwave_statistics',
  USER_PROGRESS: 'wordwave_user_progress',
};

const DEFAULT_STATISTICS: Statistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  totalScore: 0,
  bestWave: 0,
  winDistribution: {},
};

const DEFAULT_USER_PROGRESS: UserProgress = {
  isPremium: false,
  unlockedThemes: ['classic', 'nature'],
  statistics: DEFAULT_STATISTICS,
  lastPlayedDaily: null,
  dailyCompleted: false,
};

export const useLocalStorage = () => {
  const [statistics, setStatistics] = useState<Statistics>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.STATISTICS);
    return stored ? JSON.parse(stored) : DEFAULT_STATISTICS;
  });

  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    return stored ? JSON.parse(stored) : DEFAULT_USER_PROGRESS;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(statistics));
  }, [statistics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(userProgress));
  }, [userProgress]);

  const updateStatistics = (won: boolean, attempts: number, score: number, wave: number) => {
    setStatistics(prev => {
      const newStats = { ...prev };
      newStats.gamesPlayed += 1;

      if (won) {
        newStats.gamesWon += 1;
        newStats.currentStreak += 1;
        newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak);
        newStats.winDistribution[attempts] = (newStats.winDistribution[attempts] || 0) + 1;
      } else {
        newStats.currentStreak = 0;
      }

      newStats.totalScore += score;
      newStats.bestWave = Math.max(newStats.bestWave, wave);

      return newStats;
    });
  };

  const markDailyCompleted = () => {
    const today = new Date().toDateString();
    setUserProgress(prev => ({
      ...prev,
      lastPlayedDaily: today,
      dailyCompleted: true,
    }));
  };

  const checkDailyAvailable = (): boolean => {
    const today = new Date().toDateString();
    return userProgress.lastPlayedDaily !== today;
  };

  const upgradeToPremium = () => {
    setUserProgress(prev => ({
      ...prev,
      isPremium: true,
      unlockedThemes: ['classic', 'nature', 'tech', 'space', 'food'],
    }));
  };

  const resetAllData = () => {
    setStatistics(DEFAULT_STATISTICS);
    setUserProgress(DEFAULT_USER_PROGRESS);
    localStorage.clear();
  };

  return {
    statistics,
    userProgress,
    updateStatistics,
    markDailyCompleted,
    checkDailyAvailable,
    upgradeToPremium,
    resetAllData,
  };
};
