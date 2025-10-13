import { useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * Custom hook for animation configuration with accessibility support
 * Automatically respects user's reduced-motion preferences
 */
export function useAnimationConfig() {
  const shouldReduceMotion = useReducedMotion();
  
  return useMemo(() => ({
    // Whether animations should be enabled
    shouldAnimate: !shouldReduceMotion,
    
    // Basic transition config
    transition: shouldReduceMotion 
      ? { duration: 0 } 
      : { duration: 0.3, ease: 'easeOut' },
    
    // Page transition variants
    pageTransition: shouldReduceMotion
      ? { opacity: 1 }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: -10 }
        },
    
    // Question slide transition
    questionTransition: shouldReduceMotion
      ? { opacity: 1 }
      : {
          initial: { opacity: 0, x: 20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -20 }
        },
    
    // Stagger config for lists
    staggerConfig: {
      staggerChildren: shouldReduceMotion ? 0 : 0.1,
      delayChildren: shouldReduceMotion ? 0 : 0.05
    }
  }), [shouldReduceMotion]);
}

/**
 * Animation variants for common patterns
 * Memoized outside component to avoid re-creation
 */
export const ANIMATION_VARIANTS = {
  // Container with stagger children
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05
      }
    }
  },
  
  // Item that fades and slides in from left
  itemSlideLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  },
  
  // Item that fades and slides in from right
  itemSlideRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  },
  
  // Fade in/out
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  },
  
  // Scale up/down
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  }
} as const;

