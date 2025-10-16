import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

interface UseStreakConfettiReturn {
  showConfetti: () => void;
  showFireConfetti: () => void;
  showCelebrationConfetti: () => void;
}

/**
 * Custom hook for streak celebration confetti animations
 * Provides different confetti effects for streak milestones
 */
export function useStreakConfetti(): UseStreakConfettiReturn {
  const lastConfettiRef = useRef<number>(0);
  const CONFETTI_DEBOUNCE_MS = 1000; // Prevent overlapping animations

  /**
   * Basic confetti burst from center
   */
  const showConfetti = useCallback(() => {
    const now = Date.now();
    
    // Debounce rapid calls
    if (now - lastConfettiRef.current < CONFETTI_DEBOUNCE_MS) {
      return;
    }
    lastConfettiRef.current = now;

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
      });
    } catch (error) {
      console.warn('Confetti animation failed:', error);
    }
  }, []);

  /**
   * Fire-themed confetti with orange/red colors
   */
  const showFireConfetti = useCallback(() => {
    const now = Date.now();
    
    if (now - lastConfettiRef.current < CONFETTI_DEBOUNCE_MS) {
      return;
    }
    lastConfettiRef.current = now;

    try {
      // Main fire burst
      confetti({
        particleCount: 150,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ff6b35', '#f7931e', '#ffd23f', '#ff6b6b', '#ff8e53'],
        shapes: ['circle', 'square'],
        scalar: 1.2
      });

      // Secondary burst after delay
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#ff6b35', '#f7931e', '#ffd23f'],
          shapes: ['circle'],
          scalar: 0.8
        });
      }, 200);

    } catch (error) {
      console.warn('Fire confetti animation failed:', error);
    }
  }, []);

  /**
   * Celebration confetti for major milestones
   */
  const showCelebrationConfetti = useCallback(() => {
    const now = Date.now();
    
    if (now - lastConfettiRef.current < CONFETTI_DEBOUNCE_MS) {
      return;
    }
    lastConfettiRef.current = now;

    try {
      // Multiple bursts for celebration
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Left side burst
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
        });

        // Right side burst
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
        });
      }, 250);

    } catch (error) {
      console.warn('Celebration confetti animation failed:', error);
    }
  }, []);

  return {
    showConfetti,
    showFireConfetti,
    showCelebrationConfetti
  };
}
