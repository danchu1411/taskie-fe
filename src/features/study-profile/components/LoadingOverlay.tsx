import { motion } from 'framer-motion';
import { useAnimationConfig } from '../hooks/useAnimationConfig';
import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

/**
 * Full-screen loading overlay with backdrop blur
 * Includes fallback for devices that don't support backdrop-filter
 */
export function LoadingOverlay({ 
  message = 'Đang tải...', 
  isVisible 
}: LoadingOverlayProps) {
  const { shouldAnimate } = useAnimationConfig();
  const [supportsBackdropBlur, setSupportsBackdropBlur] = useState(true);
  
  // Check backdrop-filter support
  useEffect(() => {
    if (typeof CSS !== 'undefined' && CSS.supports) {
      const supported = CSS.supports('backdrop-filter', 'blur(8px)') || 
                       CSS.supports('-webkit-backdrop-filter', 'blur(8px)');
      setSupportsBackdropBlur(supported);
    } else {
      setSupportsBackdropBlur(false);
    }
  }, []);
  
  if (!isVisible) return null;
  
  // Use solid background as fallback if blur not supported (low-end devices)
  const backgroundClass = supportsBackdropBlur 
    ? 'bg-white/80 backdrop-blur-sm' 
    : 'bg-white/95';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldAnimate ? 0.2 : 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${backgroundClass}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          aria-hidden="true"
        />
        <motion.p 
          className="text-lg text-gray-700 font-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: shouldAnimate ? 0.1 : 0 }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  );
}

