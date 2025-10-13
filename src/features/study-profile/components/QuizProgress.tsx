import { motion } from 'framer-motion';
import { useAnimationConfig } from '../hooks/useAnimationConfig';

interface QuizProgressProps {
  progress: number;
  currentStep: number;
  totalQuestions: number;
}

export function QuizProgress({ progress, currentStep, totalQuestions }: QuizProgressProps) {
  const { shouldAnimate } = useAnimationConfig();
  
  return (
    <motion.div 
      className="w-full mb-8"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldAnimate ? 0.3 : 0 }}
    >
      <div className="flex justify-between items-center mb-2">
        <motion.span 
          className="text-sm font-medium text-gray-700"
          key={`step-${currentStep}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldAnimate ? 0.2 : 0 }}
        >
          Câu hỏi {currentStep + 1} / {totalQuestions}
        </motion.span>
        <motion.span 
          className="text-sm text-gray-500"
          key={`progress-${Math.round(progress)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldAnimate ? 0.2 : 0 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div 
          className="bg-blue-600 h-2 rounded-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ 
            duration: shouldAnimate ? 0.5 : 0, 
            ease: 'easeOut'
          }}
        />
      </div>
    </motion.div>
  );
}
