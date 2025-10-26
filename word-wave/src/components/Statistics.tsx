import React from 'react';
import type { Statistics as StatsType } from '../types';

interface StatisticsProps {
  statistics: StatsType;
}

export const Statistics: React.FC<StatisticsProps> = ({ statistics }) => {
  const winRate = statistics.gamesPlayed > 0
    ? Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100)
    : 0;

  const maxDistribution = Math.max(...Object.values(statistics.winDistribution), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{statistics.gamesPlayed}</div>
          <div className="text-sm text-gray-600">Played</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="text-3xl font-bold text-green-600">{winRate}%</div>
          <div className="text-sm text-gray-600">Win Rate</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
          <div className="text-3xl font-bold text-yellow-600">{statistics.currentStreak}</div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">{statistics.maxStreak}</div>
          <div className="text-sm text-gray-600">Max Streak</div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Guess Distribution</h3>
        {[1, 2, 3, 4, 5, 6].map((attempt) => {
          const count = statistics.winDistribution[attempt] || 0;
          const percentage = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;

          return (
            <div key={attempt} className="flex items-center gap-2">
              <span className="text-sm font-medium w-4">{attempt}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${Math.max(percentage, count > 0 ? 10 : 0)}%` }}
                >
                  {count > 0 && (
                    <span className="text-xs font-bold text-white">{count}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center space-y-2">
        <div className="text-sm text-gray-600">Total Score</div>
        <div className="text-3xl font-bold text-indigo-600">{statistics.totalScore.toLocaleString()}</div>
      </div>

      {statistics.bestWave > 1 && (
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-600">Best Wave</div>
          <div className="text-2xl font-bold text-pink-600">Wave {statistics.bestWave}</div>
        </div>
      )}
    </div>
  );
};
