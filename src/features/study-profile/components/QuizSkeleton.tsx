import { motion } from 'framer-motion';

/**
 * Skeleton loading state for quiz
 * Shows while initial data is loading
 */
export function QuizSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      {/* Progress skeleton */}
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 animate-pulse" />
      </div>
      
      {/* Question skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4 mb-6">
          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
        
        {/* Options skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className="h-16 bg-gray-200 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
      
      {/* Navigation skeleton */}
      <div className="flex justify-between items-center pt-6">
        <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
      </div>
    </motion.div>
  );
}

