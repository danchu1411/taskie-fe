import React, { useEffect } from 'react';
import type { ManualInput, FormErrors } from './types';
import useFormValidation from './hooks/useFormValidation';
import './styles/Form.css';

interface ManualInputFormProps {
  onSubmit: (data: ManualInput) => void;
  isLoading?: boolean;
  validationErrors?: FormErrors;
  onClearErrors?: () => void;
}

const ManualInputForm: React.FC<ManualInputFormProps> = ({
  onSubmit,
  isLoading = false,
  validationErrors,
  onClearErrors
}) => {
  const {
    formData,
    errors,
    isValid,
    updateField,
    submitForm,
    setBackendErrors
  } = useFormValidation();

  // Handle external validation errors from backend
  useEffect(() => {
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setBackendErrors(validationErrors as Record<string, string>);
    }
  }, [validationErrors, setBackendErrors]);

  // Clear errors when user starts typing
  const handleFieldChange = (field: keyof ManualInput, value: any) => {
    updateField(field, value);
    if (onClearErrors) {
      onClearErrors();
    }
  };

  // Duration options (15-minute increments)
  const durationOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1h' },
    { value: 75, label: '1h 15min' },
    { value: 90, label: '1h 30min' },
    { value: 105, label: '1h 45min' },
    { value: 120, label: '2h' },
    { value: 135, label: '2h 15min' },
    { value: 150, label: '2h 30min' },
    { value: 165, label: '2h 45min' },
    { value: 180, label: '3h' }
  ];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isLoading) {
      console.warn('⚠️ Form already submitting, ignoring duplicate submission');
      return;
    }
    
    try {
      await submitForm();
      onSubmit(formData);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  // Format date for input
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16);
  };

  // Get minimum datetime (now + 1 hour)
  const getMinDateTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return formatDateForInput(now);
  };

  return (
    <form className="manual-input-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h3 className="form-section-title">📝 Session Information</h3>
        
        {/* Title Field */}
        <div className="form-field">
          <label htmlFor="title" className="form-label">
            Title <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Example: Math Chapter 2 Review"
            maxLength={120}
          />
          <div className="form-field-footer">
            <span className="char-counter">
              {formData.title.length}/120
            </span>
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>
        </div>

        {/* Description Field */}
        <div className="form-field">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Detailed description of the session (optional)"
            maxLength={500}
            rows={3}
          />
          <div className="form-field-footer">
            <span className="char-counter">
              {(formData.description || '').length}/500
            </span>
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
        </div>

        {/* Duration Field */}
        <div className="form-field">
          <label htmlFor="duration" className="form-label">
            Duration <span className="required">*</span>
          </label>
          <select
            id="duration"
            className="form-select"
            value={formData.duration_minutes}
            onChange={(e) => updateField('duration_minutes', parseInt(e.target.value))}
          >
            {durationOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Deadline Field */}
        <div className="form-field">
          <label htmlFor="deadline" className="form-label">
            Deadline <span className="required">*</span>
          </label>
          <input
            id="deadline"
            type="datetime-local"
            className={`form-input ${errors.deadline ? 'error' : ''}`}
            value={formData.deadline}
            onChange={(e) => updateField('deadline', e.target.value)}
            min={getMinDateTime()}
          />
          {errors.deadline && <span className="error-message">{errors.deadline}</span>}
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">⏰ Preferred Time Window (Optional)</h3>
        
        {/* Preferred Window Fields */}
        <div className="form-field-group">
          <div className="form-field">
            <label htmlFor="preferred-start" className="form-label">
              Start Time
            </label>
            <input
              id="preferred-start"
              type="datetime-local"
              className={`form-input ${errors.preferred_window ? 'error' : ''}`}
              value={formData.preferred_window?.[0] || ''}
              onChange={(e) => {
                const start = e.target.value;
                const end = formData.preferred_window?.[1] || '';
                updateField('preferred_window', start ? [start, end] : undefined);
              }}
              min={getMinDateTime()}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="preferred-end" className="form-label">
              End Time
            </label>
            <input
              id="preferred-end"
              type="datetime-local"
              className={`form-input ${errors.preferred_window ? 'error' : ''}`}
              value={formData.preferred_window?.[1] || ''}
              onChange={(e) => {
                const start = formData.preferred_window?.[0] || '';
                const end = e.target.value;
                updateField('preferred_window', end ? [start, end] : undefined);
              }}
              min={formData.preferred_window?.[0] || getMinDateTime()}
            />
          </div>
        </div>
        
        {errors.preferred_window && (
          <span className="error-message">{errors.preferred_window}</span>
        )}
      </div>

      {/* Submit Button */}
      <div className="form-actions">
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || !isValid}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Generating suggestions...
            </>
          ) : (
            <>
              🤖 Generate
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ManualInputForm;
