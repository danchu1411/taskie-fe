interface QuizProgressProps {
  progress: number;
  currentStep: number;
  totalQuestions: number;
}

export function QuizProgress({ progress, currentStep, totalQuestions }: QuizProgressProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Câu hỏi {currentStep + 1} / {totalQuestions}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progress)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
