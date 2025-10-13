import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getStudyProfile, saveStudyProfile } from '../../../lib/api-study-profile';
import type { StudyProfile, StudyProfileFormData } from '../../../lib/types';

export function useStudyProfileData() {
  const { updateUserProfile, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['study-profile'],
    queryFn: getStudyProfile,
    enabled: !!user?.hasStudyProfile
  });

  const saveProfileMutation = useMutation<StudyProfile, unknown, StudyProfileFormData>({
    mutationFn: saveStudyProfile,
    onSuccess: (newProfile) => {
      // CRITICAL: Update auth state immediately to sync hasStudyProfile
      updateUserProfile({ hasStudyProfile: true });
      
      // Update React Query cache
      queryClient.setQueryData(['study-profile'], newProfile);
    }
  });

  return { 
    profile, 
    isLoading, 
    error, 
    saveProfile: saveProfileMutation.mutate,
    isSaving: saveProfileMutation.isPending,
    saveError: saveProfileMutation.error
  };
}
