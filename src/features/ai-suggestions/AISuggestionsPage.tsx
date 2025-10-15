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
    // Show success message and refresh data
    alert(`✅ Schedule entry created successfully! ID: ${scheduleEntryId}`);
    setIsModalOpen(false);
    // TODO: In production, integrate with actual data refresh
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🤖 AI Suggestions
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Get personalized task and schedule recommendations powered by AI
          </p>
          <p className="text-gray-500">
            Optimize your study schedule based on your learning patterns and preferences
          </p>
        </div>

        {/* Study Profile Enforcement */}
        {!user?.hasStudyProfile && (
          <div className="mb-8">
            <StudyProfileEnforcementBanner 
              onTakeQuiz={handleTakeQuiz}
              variant="soft"
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Primary Action */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Generate AI Schedule Suggestions
                </h2>
                <p className="text-gray-600 mb-6">
                  Tell us about your task and let AI find the perfect time slots for you
                </p>
                
                <button 
                  onClick={handleOpenModal}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  🚀 Start Creating Suggestions
                </button>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">⏰</div>
                  <h3 className="font-semibold text-gray-800">Smart Scheduling</h3>
                  <p className="text-sm text-gray-600">AI finds optimal time slots</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-semibold text-gray-800">Personalized</h3>
                  <p className="text-sm text-gray-600">Based on your preferences</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-800">Analytics</h3>
                  <p className="text-sm text-gray-600">Track your productivity</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                📈 Recent Activity
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-800">Morning Study Session</p>
                      <p className="text-sm text-gray-600">9:00 AM - 11:00 AM • Accepted</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-800">Deep Focus Block</p>
                      <p className="text-sm text-gray-600">2:00 PM - 4:00 PM • Pending</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">1 day ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ Quick Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={handleOpenModal}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="font-medium text-gray-800">AI Schedule</p>
                      <p className="text-sm text-gray-600">Generate suggestions</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <p className="font-medium text-gray-800">Task Checklist</p>
                      <p className="text-sm text-gray-600">Break down tasks</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🔄</span>
                    <div>
                      <p className="font-medium text-gray-800">Mixed Mode</p>
                      <p className="text-sm text-gray-600">Combined suggestions</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 This Week</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Suggestions Generated</span>
                  <span className="font-semibold text-blue-600">12</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Accepted</span>
                  <span className="font-semibold text-green-600">8</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-purple-600">67%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Time Saved</span>
                  <span className="font-semibold text-orange-600">4.5h</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-3">💡 Pro Tip</h3>
              <p className="text-sm opacity-90">
                The more specific you are about your task requirements, the better AI can optimize your schedule timing.
              </p>
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
