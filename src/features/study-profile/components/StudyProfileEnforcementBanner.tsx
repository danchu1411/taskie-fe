interface StudyProfileEnforcementBannerProps {
  onTakeQuiz: () => void;
  variant?: 'soft' | 'hard';
}

export function StudyProfileEnforcementBanner({ 
  onTakeQuiz, 
  variant = 'soft' 
}: StudyProfileEnforcementBannerProps) {
  if (variant === 'hard') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-red-500 text-xl">🚫</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Study Profile Required
            </h3>
            <p className="text-red-700 mb-4">
              You must complete your Study Profile before using AI Suggestions. 
              This helps us provide more personalized recommendations.
            </p>
            <button
              onClick={onTakeQuiz}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Complete Study Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Soft enforcement (default)
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-3">
        <div className="text-blue-500 text-xl">💡</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Improve AI Suggestions
          </h3>
          <p className="text-blue-700 mb-4">
            Complete your Study Profile to get more personalized AI suggestions 
            tailored to your learning style and preferences.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onTakeQuiz}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Take Quiz
            </button>
            <button
              onClick={() => {/* Dismiss banner */}}
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
