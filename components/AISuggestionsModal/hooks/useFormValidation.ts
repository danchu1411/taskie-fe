import { useState, useCallback } from 'react';
import type { ManualInput, FormErrors, UseFormValidationReturn } from '../types';

const useFormValidation = (): UseFormValidationReturn => {
  const [formData, setFormData] = useState<ManualInput>({
    title: '',
    description: '',
    duration_minutes: 60,
    deadline: '',
    preferred_window: undefined,
    target_task_id: undefined
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateTitle = useCallback((title: string): string | undefined => {
    if (!title.trim()) return 'Title is required';
    if (title.length < 1) return 'Title must be at least 1 character';
    if (title.length > 120) return 'Title must not exceed 120 characters';
    return undefined;
  }, []);

  const validateDescription = useCallback((description: string): string | undefined => {
    if (description && description.length > 500) {
      return 'Description must not exceed 500 characters';
    }
    return undefined;
  }, []);

  const validateDuration = useCallback((duration: number): string | undefined => {
    if (duration < 15) return 'Duration must be at least 15 minutes';
    if (duration > 180) return 'Duration must not exceed 180 minutes';
    if (duration % 15 !== 0) return 'Duration must be a multiple of 15 minutes';
    return undefined;
  }, []);

  const validateDeadline = useCallback((deadline: string): string | undefined => {
    if (!deadline) return 'Deadline is required';
    
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      
      if (isNaN(deadlineDate.getTime())) {
        return 'Invalid deadline format. Please use ISO 8601 format';
      }
      
      if (deadlineDate <= now) {
        return 'Deadline must be in the future';
      }
      
      // Check if deadline is too far in the future (optional business rule)
      const maxDeadline = new Date();
      maxDeadline.setFullYear(maxDeadline.getFullYear() + 1);
      if (deadlineDate > maxDeadline) {
        return 'Deadline must be within 1 year from now';
      }
      
    } catch (error) {
      return 'Invalid deadline format';
    }
    
    return undefined;
  }, []);

  const validatePreferredWindow = useCallback((window: [string, string] | undefined): string | undefined => {
    if (!window) return undefined;
    
    try {
      const [start, end] = window;
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Invalid preferred window format. Please use ISO 8601 format';
      }
      
      if (startDate >= endDate) {
        return 'Start time must be before end time';
      }
      
      // Check if window is reasonable (at least 1 hour, max 24 hours)
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      
      if (durationHours < 1) {
        return 'Preferred window must be at least 1 hour';
      }
      
      if (durationHours > 24) {
        return 'Preferred window must not exceed 24 hours';
      }
      
    } catch (error) {
      return 'Invalid preferred window format';
    }
    
    return undefined;
  }, []);

  const validateTargetTask = useCallback((taskId: string | undefined): string | undefined => {
    if (taskId && taskId.trim().length === 0) {
      return 'Task ID cannot be empty';
    }
    return undefined;
  }, []);

  // Handle backend validation errors
  const setBackendErrors = useCallback((backendErrors: Record<string, string>) => {
    setErrors(backendErrors);
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Update field with validation
  const updateField = useCallback((field: keyof ManualInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);


  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    const titleError = validateTitle(formData.title);
    if (titleError) newErrors.title = titleError;
    
    const descriptionError = validateDescription(formData.description || '');
    if (descriptionError) newErrors.description = descriptionError;
    
    const durationError = validateDuration(formData.duration_minutes);
    if (durationError) newErrors.duration_minutes = durationError;
    
    const deadlineError = validateDeadline(formData.deadline);
    if (deadlineError) newErrors.deadline = deadlineError;
    
    const windowError = validatePreferredWindow(formData.preferred_window);
    if (windowError) newErrors.preferred_window = windowError;
    
    const taskError = validateTargetTask(formData.target_task_id);
    if (taskError) newErrors.target_task_id = taskError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateTitle, validateDescription, validateDuration, validateDeadline, validatePreferredWindow, validateTargetTask]);

  // Check if form is valid (without setting errors)
  const isValid = useCallback((): boolean => {
    return !validateTitle(formData.title) &&
           !validateDescription(formData.description || '') &&
           !validateDuration(formData.duration_minutes) &&
           !validateDeadline(formData.deadline) &&
           !validatePreferredWindow(formData.preferred_window) &&
           !validateTargetTask(formData.target_task_id);
  }, [formData, validateTitle, validateDescription, validateDuration, validateDeadline, validatePreferredWindow, validateTargetTask]);

  // Handle form submission
  const submitForm = useCallback(async (): Promise<void> => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (!validateForm()) {
        throw new Error('Form validation failed');
      }
      
      // Form is valid, ready for API call
      console.log('Form submitted:', formData);
      
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, isSubmitting]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      duration_minutes: 60,
      deadline: '',
      preferred_window: undefined,
      target_task_id: undefined
    });
    setErrors({});
    setIsSubmitting(false);
  }, []);

  // Get form summary for debugging
  const getFormSummary = useCallback(() => {
    return {
      formData,
      errors,
      isValid: isValid(),
      isSubmitting,
      hasErrors: Object.keys(errors).length > 0
    };
  }, [formData, errors, isValid, isSubmitting]);

  return {
    formData,
    errors,
    isValid: isValid(),
    updateField,
    validateForm,
    submitForm,
    resetForm,
    getFormSummary,
    setBackendErrors,
    clearAllErrors
  };
};

export default useFormValidation;
