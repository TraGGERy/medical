'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Trophy, Target, Calendar, Star, Gift, Zap, Award, CheckCircle, Unlock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

type TabType = 'streak' | 'achievements' | 'rewards';

interface StreakTrackerProps {
  className?: string;
  onStreakUpdate?: (streak: StreakData) => void;
}

interface StreakData {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  lastCheckinDate: string | null;
  streakType: 'daily_checkin' | 'symptom_logging' | 'medication_adherence';
  milestones: Milestone[];
  rewards: Reward[];
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  target: number;
  achieved: boolean;
  achievedAt: string | null;
  reward: string;
  icon: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'title' | 'feature' | 'discount';
  unlockedAt: string;
  claimed: boolean;
  claimedAt: string | null;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ className = '', onStreakUpdate }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'streak' | 'achievements' | 'rewards'>('streak');
  const [showCelebration, setShowCelebration] = useState(false);

  const predefinedMilestones: Omit<Milestone, 'id' | 'achieved' | 'achievedAt'>[] = [
    {
      name: 'First Steps',
      description: 'Complete your first daily check-in',
      target: 1,
      reward: 'Health Tracker Badge',
      icon: '🎯'
    },
    {
      name: 'Getting Started',
      description: 'Maintain a 3-day check-in streak',
      target: 3,
      reward: 'Consistency Badge',
      icon: '🔥'
    },
    {
      name: 'Building Habits',
      description: 'Achieve a 7-day check-in streak',
      target: 7,
      reward: 'Week Warrior Badge',
      icon: '⭐'
    },
    {
      name: 'Committed',
      description: 'Reach a 14-day check-in streak',
      target: 14,
      reward: 'Dedication Badge',
      icon: '💪'
    },
    {
      name: 'Health Champion',
      description: 'Maintain a 30-day check-in streak',
      target: 30,
      reward: 'Champion Badge & Premium Features',
      icon: '👑'
    },
    {
      name: 'Wellness Master',
      description: 'Achieve a 60-day check-in streak',
      target: 60,
      reward: 'Master Badge & Health Insights',
      icon: '🏆'
    },
    {
      name: 'Legendary',
      description: 'Complete a 100-day check-in streak',
      target: 100,
      reward: 'Legendary Status & All Features',
      icon: '🌟'
    }
  ];

  const loadStreakData = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/health-calendar/streaks');
      if (!response.ok) {
        throw new Error('Failed to load streak data');
      }
      
      const data = await response.json();
      setStreakData(data.streak);
      
      if (onStreakUpdate) {
        onStreakUpdate(data.streak);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
      toast.error('Failed to load streak information');
    } finally {
      setLoading(false);
    }
  }, [onStreakUpdate]);

  useEffect(() => {
    if (user) {
      loadStreakData();
    }
  }, [user, loadStreakData]);

  const updateStreak = async (type: 'checkin' | 'symptom' | 'medication') => {
    try {
      const response = await fetch('/api/health-calendar/streaks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update streak');
      }
      
      const result = await response.json();
      
      if (result.milestoneAchieved) {
        setShowCelebration(true);
        toast.success(`🎉 Milestone achieved: ${result.milestone.name}!`);
        setTimeout(() => setShowCelebration(false), 3000);
      }
      
      await loadStreakData();
    } catch (error) {
      console.error('Error updating streak:', error);
      toast.error('Failed to update streak');
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      const response = await fetch(`/api/health-calendar/streaks/${rewardId}/claim`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim reward');
      }
      
      toast.success('Reward claimed successfully!');
      await loadStreakData();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    }
  };

  const getStreakColor = (streak: number): string => {
    if (streak >= 100) return 'from-purple-500 to-pink-500';
    if (streak >= 60) return 'from-yellow-400 to-orange-500';
    if (streak >= 30) return 'from-green-400 to-blue-500';
    if (streak >= 14) return 'from-blue-400 to-purple-500';
    if (streak >= 7) return 'from-orange-400 to-red-500';
    if (streak >= 3) return 'from-green-400 to-teal-500';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakMessage = (streak: number): string => {
    if (streak >= 100) return 'Legendary health champion! 🌟';
    if (streak >= 60) return 'Wellness master! Keep it up! 🏆';
    if (streak >= 30) return 'Health champion! Amazing dedication! 👑';
    if (streak >= 14) return "You&apos;re on fire! Great consistency! 💪";
    if (streak >= 7) return 'One week strong! Keep going! ⭐';
    if (streak >= 3) return 'Building great habits! 🔥';
    if (streak >= 1) return 'Great start! Keep it up! 🎯';
    return 'Start your health journey today! 💚';
  };

  const getNextMilestone = (): Milestone | null => {
    if (!streakData) return null;
    
    return predefinedMilestones
      .filter(m => m.target > streakData.currentStreak)
      .sort((a, b) => a.target - b.target)[0] as Milestone || null;
  };

  const getProgressToNextMilestone = (): number => {
    const nextMilestone = getNextMilestone();
    if (!nextMilestone || !streakData) return 0;
    
    return Math.min((streakData.currentStreak / nextMilestone.target) * 100, 100);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!streakData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <Flame className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Health Streak</h3>
          <p className="text-gray-600 mb-4">Complete daily check-ins to build healthy habits and earn rewards!</p>
          <button
            onClick={() => updateStreak('checkin')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Start Today
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-20 animate-pulse rounded-lg pointer-events-none z-10"></div>
      )}

      {/* Header */}
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 sm:p-3 bg-gradient-to-r ${getStreakColor(streakData.currentStreak)} rounded-lg`}>
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Health Streak</h2>
              <p className="text-sm sm:text-base text-gray-600 break-words">{getStreakMessage(streakData.currentStreak)}</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${getStreakColor(streakData.currentStreak)} bg-clip-text text-transparent`}>
              {streakData.currentStreak}
            </div>
            <div className="text-sm text-gray-600">days</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'streak', label: 'Streak', icon: Flame },
            { key: 'achievements', label: 'Achievements', icon: Trophy },
            { key: 'rewards', label: 'Rewards', icon: Gift }
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as TabType)}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation flex-1 ${
                  selectedTab === tab.key
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.key === 'streak' ? 'Streak' : tab.key === 'achievements' ? 'Goals' : 'Rewards'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {selectedTab === 'streak' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Current Streak Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-orange-50 rounded-lg p-3 sm:p-4 text-center">
                <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-orange-900">{streakData.currentStreak}</div>
                <div className="text-xs sm:text-sm text-orange-700">Current Streak</div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 text-center">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-yellow-900">{streakData.longestStreak}</div>
                <div className="text-xs sm:text-sm text-yellow-700">Longest Streak</div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-xl sm:text-2xl font-bold text-blue-900">{streakData.totalCheckins}</div>
                <div className="text-xs sm:text-sm text-blue-700">Total Check-ins</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
                <div className="text-lg sm:text-2xl font-bold text-green-900">
                  {streakData.lastCheckinDate ? (
                    differenceInDays(new Date(), new Date(streakData.lastCheckinDate)) === 0 ? 'Today' : 
                    differenceInDays(new Date(), new Date(streakData.lastCheckinDate)) === 1 ? 'Yesterday' :
                    `${differenceInDays(new Date(), new Date(streakData.lastCheckinDate))} days ago`
                  ) : 'Never'}
                </div>
                <div className="text-xs sm:text-sm text-green-700">Last Check-in</div>
              </div>
            </div>

            {/* Progress to Next Milestone */}
            {getNextMilestone() && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">Next Milestone</h3>
                    <p className="text-sm text-gray-600">{getNextMilestone()?.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {streakData.currentStreak}/{getNextMilestone()?.target}
                    </div>
                    <div className="text-sm text-gray-600">days</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full bg-gradient-to-r ${getStreakColor(streakData.currentStreak)} transition-all duration-500`}
                    style={{ width: `${getProgressToNextMilestone()}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-600">
                  {getNextMilestone()?.description}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => updateStreak('checkin')}
                className="flex items-center gap-3 p-3 sm:p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors touch-manipulation"
              >
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-orange-900 text-sm sm:text-base">Daily Check-in</div>
                  <div className="text-xs sm:text-sm text-orange-700">Log today&apos;s health</div>
                </div>
              </button>
              
              <button
                onClick={() => updateStreak('symptom')}
                className="flex items-center gap-3 p-3 sm:p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors touch-manipulation"
              >
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-red-900 text-sm sm:text-base">Log Symptom</div>
                  <div className="text-xs sm:text-sm text-red-700">Track symptoms</div>
                </div>
              </button>
              
              <button
                onClick={() => updateStreak('medication')}
                className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors touch-manipulation sm:col-span-2 lg:col-span-1"
              >
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-blue-900 text-sm sm:text-base">Medication</div>
                  <div className="text-xs sm:text-sm text-blue-700">Track adherence</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'achievements' && (
          <div className="space-y-3 sm:space-y-4">
            {predefinedMilestones.map((milestone, index) => {
              const achieved = streakData.currentStreak >= milestone.target;
              const progress = Math.min((streakData.currentStreak / milestone.target) * 100, 100);
              
              return (
                <div key={index} className={`rounded-lg p-3 sm:p-4 border-2 transition-all touch-manipulation ${
                  achieved 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className={`text-2xl sm:text-3xl flex-shrink-0 ${achieved ? 'grayscale-0' : 'grayscale'}`}>
                        {milestone.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={`font-semibold text-sm sm:text-base break-words ${
                          achieved ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {milestone.name}
                        </h3>
                        <p className={`text-xs sm:text-sm break-words ${
                          achieved ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {milestone.description}
                        </p>
                        <p className={`text-xs break-words ${
                          achieved ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          Reward: {milestone.reward}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      {achieved ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="font-medium text-sm sm:text-base">Completed</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            {streakData.currentStreak}/{milestone.target}
                          </div>
                          <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="h-2 rounded-full bg-orange-500 transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'rewards' && (
          <div className="space-y-3 sm:space-y-4">
            {streakData.rewards.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Rewards Yet</h3>
                <p className="text-sm sm:text-base text-gray-600 px-4">Complete milestones to unlock rewards and badges!</p>
              </div>
            ) : (
              streakData.rewards.map(reward => (
                <div key={reward.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="p-2 sm:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                        {reward.type === 'badge' && <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
                        {reward.type === 'title' && <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
                        {reward.type === 'feature' && <Unlock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
                        {reward.type === 'discount' && <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-base text-purple-900 break-words">{reward.name}</h3>
                        <p className="text-xs sm:text-sm text-purple-700 break-words">{reward.description}</p>
                        <p className="text-xs text-purple-600 break-words">
                          Unlocked {format(new Date(reward.unlockedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    {!reward.claimed && (
                      <button
                        onClick={() => claimReward(reward.id)}
                        className="px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm touch-manipulation flex-shrink-0"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakTracker;