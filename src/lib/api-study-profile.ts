import api from './api';
import type { StudyProfile, StudyProfileFormData } from './types';

export async function getStudyProfile(): Promise<StudyProfile | null> {
  try {
    const response = await api.get<StudyProfile>('/study-profile');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function saveStudyProfile(data: StudyProfileFormData): Promise<StudyProfile> {
  console.log('saveStudyProfile', data);
  const response = await api.post<StudyProfile>('/study-profile', data);
  return response.data;
}
