import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { StudyProfileEnforcementBanner } from '../study-profile/components/StudyProfileEnforcementBanner';
import AISuggestionsModal from '../../../components/AISuggestionsModal';

interface AISuggestionsPageProps {
  onNavigate: (path: string) => void;
}

export function AISuggestionsPage({ onNavigate }: AISuggestionsPageProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTakeQuiz = () => {
    onNavigate('/study-profile/quiz');
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = (scheduleEntryId: string) => {
    console.log('Schedule entry created:', scheduleEntryId);
    // TODO: Refresh data or show success message
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">AI Suggestions</h1>
          <p className="text-gray-600 mt-2">Get personalized task and schedule recommendations</p>
        </div>

        {/* Study Profile Enforcement */}
        {!user?.hasStudyProfile && (
          <StudyProfileEnforcementBanner 
            onTakeQuiz={handleTakeQuiz}
            variant="soft"
          />
        )}

        {/* AI Suggestions Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Generate Suggestions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button 
              onClick={handleOpenModal}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-medium text-gray-800">AI Schedule Suggestions</h3>
              <p className="text-sm text-gray-600">Get AI-powered schedule recommendations</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-medium text-gray-800">Checklist Suggestions</h3>
              <p className="text-sm text-gray-600">Break down tasks into actionable steps</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-medium text-gray-800">Mixed Suggestions</h3>
              <p className="text-sm text-gray-600">Combined task and checklist recommendations</p>
            </button>
          </div>

          {/* Sample Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Recent Suggestions</h3>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Morning Study Session</h4>
                    <p className="text-sm text-gray-600">9:00 AM - 11:00 AM</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Based on your Morning Warrior chronotype
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      Accept
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 text-sm">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Deep Focus Block</h4>
                    <p className="text-sm text-gray-600">2:00 PM - 4:00 PM</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Optimized for your Deep Focus style
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      Accept
                    </button>
                    <button className="text-gray-500 hover:text-gray-700 text-sm">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
