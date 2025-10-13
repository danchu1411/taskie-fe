import { useStudyProfileData } from '../hooks/useStudyProfileData';
import { Chronotype, FocusStyle, WorkStyle } from '../../../lib/types';

interface StudyProfileSummaryProps {
  onEdit: () => void;
}

function getChronotypeLabel(value: Chronotype): string {
  switch (value) {
    case Chronotype.MorningWarrior: return 'Morning Warrior';
    case Chronotype.NightOwl: return 'Night Owl';
    case Chronotype.Flexible: return 'Flexible';
    default: return 'Unknown';
  }
}

function getFocusStyleLabel(value: FocusStyle): string {
  switch (value) {
    case FocusStyle.DeepFocus: return 'Deep Focus';
    case FocusStyle.SprintWorker: return 'Sprint Worker';
    case FocusStyle.Multitasker: return 'Multitasker';
    default: return 'Unknown';
  }
}

function getWorkStyleLabel(value: WorkStyle): string {
  switch (value) {
    case WorkStyle.DeadlineDriven: return 'Deadline Driven';
    case WorkStyle.SteadyPacer: return 'Steady Pacer';
    default: return 'Unknown';
  }
}

function getChronotypeIcon(value: Chronotype): string {
  switch (value) {
    case Chronotype.MorningWarrior: return '🌅';
    case Chronotype.NightOwl: return '🌙';
    case Chronotype.Flexible: return '🔄';
    default: return '❓';
  }
}

function getFocusStyleIcon(value: FocusStyle): string {
  switch (value) {
    case FocusStyle.DeepFocus: return '🎯';
    case FocusStyle.SprintWorker: return '⚡';
    case FocusStyle.Multitasker: return '🔀';
    default: return '❓';
  }
}

function getWorkStyleIcon(value: WorkStyle): string {
  switch (value) {
    case WorkStyle.DeadlineDriven: return '⏰';
    case WorkStyle.SteadyPacer: return '📊';
    default: return '❓';
  }
}

function ProfileItem({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string; 
  icon: string; 
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-sm text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function StudyProfileSummary({ onEdit }: StudyProfileSummaryProps) {
  const { profile, isLoading } = useStudyProfileData();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Chưa có Study Profile
        </h3>
        <p className="text-gray-600 mb-4">
          Hoàn thành quiz để AI hiểu bạn hơn và đưa ra gợi ý phù hợp
        </p>
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Tạo Study Profile
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3 mb-6">
        <ProfileItem 
          label="Chronotype" 
          value={getChronotypeLabel(profile.chronotype)}
          icon={getChronotypeIcon(profile.chronotype)}
        />
        <ProfileItem 
          label="Focus Style" 
          value={getFocusStyleLabel(profile.focusStyle)}
          icon={getFocusStyleIcon(profile.focusStyle)}
        />
        <ProfileItem 
          label="Work Style" 
          value={getWorkStyleLabel(profile.workStyle)}
          icon={getWorkStyleIcon(profile.workStyle)}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date(profile.updated_at).toLocaleDateString('vi-VN')}
        </p>
        <button
          onClick={onEdit}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Chỉnh sửa
        </button>
      </div>
    </div>
  );
}
