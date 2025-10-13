import { getLocalizedText } from '../i18n/quizCopy';

interface QuizCompleteProps {
  onComplete: () => void;
  locale?: 'vi' | 'en';
}

export function QuizComplete({ onComplete, locale = 'vi' }: QuizCompleteProps) {
  const title = getLocalizedText('success.title', locale);
  const message = getLocalizedText('success.message', locale);
  const ctaText = getLocalizedText('success.cta', locale);

  return (
    <div className="text-center py-12">
      <div className="mb-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {title}
        </h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          {message}
        </p>
      </div>
      
      <button
        onClick={onComplete}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        {ctaText}
      </button>
    </div>
  );
}
