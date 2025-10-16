import { useState, useEffect, useRef } from 'react';
import type { StatsOverview, StreakPeriod } from '../../../lib/types';

interface StreakVisualizationProps {
  overview: StatsOverview | null;
  streakHistory: StreakPeriod[] | null;
  isLoading?: boolean;
}

interface MilestoneProps {
  target: number;
  achieved: boolean;
}

function Milestone({ target, achieved }: MilestoneProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        achieved 
          ? 'bg-green-100 text-green-600' 
          : 'bg-slate-100 text-slate-400'
      }`}>
        {achieved ? '✓' : target}
      </div>
      <span className={`text-sm ${achieved ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
        {target} days
      </span>
    </div>
  );
}

export default function StreakVisualization({ overview, isLoading }: StreakVisualizationProps) {
  const [displayStreak, setDisplayStreak] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const previousStreakRef = useRef(0);

  useEffect(() => {
    if (isLoading) {
      setDisplayStreak(0);
      return;
    }

    const targetStreak = overview?.currentStreak || 0;
    const previousStreak = previousStreakRef.current;
    
    // Check if streak increased
    if (targetStreak > previousStreak && previousStreak > 0) {
      setIsAnimating(true);
      setShowCelebration(true);
      
      // Hide celebration after animation
      setTimeout(() => setShowCelebration(false), 2000);
    }

    const duration = 1000; // 1 second
    const steps = 60; // 60fps
    const increment = targetStreak / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newValue = Math.min(Math.floor(increment * currentStep), targetStreak);
      setDisplayStreak(newValue);

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayStreak(targetStreak);
        setIsAnimating(false);
        previousStreakRef.current = targetStreak;
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [overview?.currentStreak, isLoading]);

  const milestones = [
    { target: 3, achieved: displayStreak >= 3 },
    { target: 7, achieved: displayStreak >= 7 },
    { target: 14, achieved: displayStreak >= 14 },
    { target: 30, achieved: displayStreak >= 30 },
  ];

  const nextMilestone = milestones.find(m => !m.achieved);
  const progressToNext = nextMilestone 
    ? Math.min((displayStreak / nextMilestone.target) * 100, 100)
    : 100;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Streak Progress</h3>
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-slate-100 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Streak Progress</h3>
        <div className="text-center text-slate-500">
          <p>No streak data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Streak Progress</h3>
      
      {/* Current Streak Display */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <div className={`w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-3 mx-auto transition-all duration-500 ${
            showCelebration ? 'scale-110 shadow-lg shadow-orange-200' : 'scale-100'
          }`}>
            <span className={`text-4xl transition-all duration-500 ${
              showCelebration ? 'animate-bounce' : ''
            }`}>🔥</span>
          </div>
          <div className={`absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full transition-all duration-500 ${
            isAnimating ? 'scale-125 bg-green-500' : 'scale-100'
          }`}>
            {displayStreak}
          </div>
          
          {/* Celebration overlay */}
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-30 animate-pulse"></div>
              <div className="absolute -top-4 -left-4 text-yellow-400 text-lg animate-ping">✨</div>
              <div className="absolute -top-2 -right-4 text-yellow-400 text-lg animate-ping" style={{ animationDelay: '0.5s' }}>✨</div>
              <div className="absolute -bottom-2 -left-2 text-yellow-400 text-lg animate-ping" style={{ animationDelay: '1s' }}>✨</div>
            </div>
          )}
        </div>
        
        <h4 className={`text-2xl font-bold mb-1 transition-all duration-500 ${
          showCelebration ? 'text-orange-600 scale-105' : 'text-slate-900'
        }`}>
          {displayStreak} day{displayStreak !== 1 ? 's' : ''}
        </h4>
        
        <p className={`text-sm transition-all duration-500 ${
          showCelebration ? 'text-orange-600 font-medium' : 'text-slate-600'
        }`}>
          {showCelebration ? '🔥 Streak increased!' : 'Current streak'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Progress to next milestone</span>
          <span className="text-sm text-slate-500">
            {nextMilestone ? `${Math.round(progressToNext)}%` : 'Complete!'}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressToNext}%` }}
          ></div>
        </div>
        {nextMilestone && (
          <p className="text-xs text-slate-500 mt-1">
            {nextMilestone.target - displayStreak} more days to reach {nextMilestone.target} days
          </p>
        )}
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-slate-700 mb-3">Milestones</h5>
        {milestones.map((milestone) => (
          <Milestone
            key={milestone.target}
            target={milestone.target}
            achieved={milestone.achieved}
          />
        ))}
      </div>

      {/* Best Streak */}
      {overview.longestStreak > overview.currentStreak && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Best streak</span>
            <span className="text-sm font-medium text-slate-900">
              {overview.longestStreak} days
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
