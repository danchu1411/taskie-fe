import { useState, useCallback } from 'react';
import { ManualInput, FormErrors, UseFormValidationReturn } from '../types';

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
    if (!title.trim()) return 'Tiêu đề là bắt buộc';
    if (title.length > 120) return 'Tiêu đề không được quá 120 ký tự';
    return undefined;
  }, []);

  const validateDescription = useCallback((description: string): string | undefined => {
    if (description && description.length > 500) {
      return 'Mô tả không được quá 500 ký tự';
    }
    return undefined;
  }, []);

  const validateDuration = useCallback((duration: number): string | undefined => {
    if (!duration || duration < 15 || duration > 180) {
      return 'Thời lượng phải từ 15 đến 180 phút';
    }
    if (duration % 15 !== 0) {
      return 'Thời lượng phải là bội số của 15 phút';
    }
    return undefined;
  }, []);

  const validateDeadline = useCallback((deadline: string): string | undefined => {
    if (!deadline) return 'Deadline là bắt buộc';
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    if (isNaN(deadlineDate.getTime())) {
      return 'Deadline không hợp lệ';
    }
    
    if (deadlineDate <= now) {
      return 'Deadline phải là thời gian trong tương lai';
    }
    
    return undefined;
  }, []);

  const validatePreferredWindow = useCallback((window: [string, string] | undefined): string | undefined => {
    if (!window) return undefined;
    
    const [start, end] = window;
    if (!start || !end) return 'Vui lòng chọn cả thời gian bắt đầu và kết thúc';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 'Thời gian không hợp lệ';
    }
    
    if (startDate >= endDate) {
      return 'Thời gian bắt đầu phải trước thời gian kết thúc';
    }
    
    return undefined;
  }, []);

  const validateTargetTask = useCallback((taskId: string | undefined): string | undefined => {
    if (taskId && taskId.trim().length === 0) {
      return 'Task ID không được để trống';
    }
    return undefined;
  }, []);

  // Update field with validation
  const updateField = useCallback((field: keyof ManualInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validate specific field
  const validateField = useCallback((field: keyof ManualInput, value: any): string | undefined => {
    switch (field) {
      case 'title':
        return validateTitle(value);
      case 'description':
        return validateDescription(value || '');
      case 'duration_minutes':
        return validateDuration(value);
      case 'deadline':
        return validateDeadline(value);
      case 'preferred_window':
        return validatePreferredWindow(value);
      case 'target_task_id':
        return validateTargetTask(value);
      default:
        return undefined;
    }
  }, [validateTitle, validateDescription, validateDuration, validateDeadline, validatePreferredWindow, validateTargetTask]);

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
    getFormSummary
  };
};

export default useFormValidation;
