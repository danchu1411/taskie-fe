import { motion } from 'framer-motion';
import { getLocalizedText } from '../i18n/quizCopy';
import { useAnimationConfig } from '../hooks/useAnimationConfig';

interface QuizCompleteProps {
  onComplete: () => void;
  locale?: 'vi' | 'en';
}

export function QuizComplete({ onComplete, locale = 'vi' }: QuizCompleteProps) {
  const title = getLocalizedText('success.title', locale);
  const message = getLocalizedText('success.message', locale);
  const ctaText = getLocalizedText('success.cta', locale);
  const { shouldAnimate } = useAnimationConfig();

  return (
    <motion.div 
      className="text-center py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldAnimate ? 0.4 : 0, ease: 'easeOut' }}
    >
      <div className="mb-6">
        <motion.div 
          className="text-6xl mb-4 inline-block"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={shouldAnimate ? { 
            type: 'spring',
            stiffness: 260,
            damping: 20,
            delay: 0.2
          } : { duration: 0 }}
        >
          <motion.span
            animate={shouldAnimate ? {
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            🎉
          </motion.span>
        </motion.div>
        
        <motion.h2 
          className="text-3xl font-bold text-gray-800 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldAnimate ? 0.3 : 0, delay: shouldAnimate ? 0.3 : 0 }}
        >
          {title}
        </motion.h2>
        
        <motion.p 
          className="text-lg text-gray-600 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldAnimate ? 0.3 : 0, delay: shouldAnimate ? 0.4 : 0 }}
        >
          {message}
        </motion.p>
      </div>
      
      <motion.button
        onClick={onComplete}
        whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
        whileTap={shouldAnimate ? { scale: 0.95 } : undefined}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldAnimate ? 0.3 : 0, delay: shouldAnimate ? 0.5 : 0 }}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        {ctaText}
      </motion.button>
    </motion.div>
  );
}
