import { StudyProfileSummary } from '../study-profile/components/StudyProfileSummary';

interface SettingsPageProps {
  onNavigate: (path: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const handleEditProfile = () => {
    onNavigate('/study-profile/quiz');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-600 mt-2">Quản lý cài đặt và thông tin cá nhân</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Study Profile Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Study Profile</h2>
              <div className="text-2xl">🧠</div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Thông tin về phong cách học tập và làm việc của bạn để AI đưa ra gợi ý phù hợp.
            </p>
            
            <StudyProfileSummary onEdit={handleEditProfile} />
          </div>

          {/* Other Settings Sections */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Preferences</h2>
              <div className="text-2xl">⚙️</div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Cài đặt cá nhân và tùy chọn ứng dụng.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Theme</p>
                  <p className="text-sm text-gray-600">Light mode</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Change
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Language</p>
                  <p className="text-sm text-gray-600">Tiếng Việt</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Change
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Notifications</p>
                  <p className="text-sm text-gray-600">Email notifications enabled</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Account</h2>
            <div className="text-2xl">👤</div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Password</p>
                <p className="text-sm text-gray-600">Last changed 3 months ago</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Change Password
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Email</p>
                <p className="text-sm text-gray-600">user@example.com</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Update Email
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-800">Delete Account</p>
                <p className="text-sm text-red-600">Permanently delete your account and data</p>
              </div>
              <button className="text-red-600 hover:text-red-700 font-medium">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
