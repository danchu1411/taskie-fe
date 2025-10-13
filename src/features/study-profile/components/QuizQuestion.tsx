import { motion } from 'framer-motion';
import type { QuizQuestion } from '../utils/quizQuestions';
import { getQuestionText, getOptionText } from '../utils/quizQuestions';
import { useAnimationConfig, ANIMATION_VARIANTS } from '../hooks/useAnimationConfig';

interface QuizQuestionProps {
  question: QuizQuestion;
  selectedValue?: number;
  onSelect: (value: number) => void;
  locale?: 'vi' | 'en';
}

export function QuizQuestionCard({ question, selectedValue, onSelect, locale = 'vi' }: QuizQuestionProps) {
  const questionText = getQuestionText(question.id, locale);
  const { shouldAnimate } = useAnimationConfig();

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-md p-6 mb-6"
      initial="hidden"
      animate="visible"
      variants={shouldAnimate ? ANIMATION_VARIANTS.container : undefined}
    >
      <motion.h3 
        className="text-xl font-semibold text-gray-800 mb-6"
        variants={shouldAnimate ? ANIMATION_VARIANTS.itemSlideLeft : undefined}
      >
        {questionText}
      </motion.h3>
      
      <div className="space-y-3">
        {question.options.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => onSelect(option.value)}
            variants={shouldAnimate ? ANIMATION_VARIANTS.itemSlideLeft : undefined}
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            className={`w-full p-4 rounded-lg border-2 transition-colors duration-200 text-left ${
              selectedValue === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-md'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <motion.span 
                className="text-2xl"
                animate={selectedValue === option.value && shouldAnimate ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{ duration: 0.3 }}
              >
                {option.icon}
              </motion.span>
              <span className="font-medium">
                {getOptionText(option.labelKey, locale)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
