import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiMail, FiCalendar, FiZap, FiChevronDown } from 'react-icons/fi';
import './ScheduleModal.css';

const ScheduleModal = ({ isOpen, onClose, onSubmit, initialPrompt = '' }) => {
  const [formData, setFormData] = useState({
    prompt: initialPrompt,
    frequency: 'daily',
    time: '09:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    emailResults: true,
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const weekDays = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.prompt.trim()) {
      newErrors.prompt = 'Prompt is required';
    }
    if (formData.frequency === 'weekly' && formData.days.length === 0) {
      newErrors.days = 'Select at least one day';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      setFormData({
        prompt: '',
        frequency: 'daily',
        time: '09:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        emailResults: true,
        endDate: ''
      });
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to create schedule' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="schedule-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="schedule-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="schedule-modal-header">
            <div className="schedule-modal-title">
              <FiClock className="title-icon" />
              <h2>Schedule Prompt</h2>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="schedule-form">
            {/* Prompt Input */}
            <div className="form-group">
              <label>
                <FiZap className="label-icon" />
                Your Prompt
              </label>
              <textarea
                name="prompt"
                value={formData.prompt}
                onChange={handleChange}
                placeholder="E.g., Give me today's market analysis for Indian stocks..."
                rows={4}
                className={errors.prompt ? 'error' : ''}
              />
              {errors.prompt && <span className="error-text">{errors.prompt}</span>}
            </div>

            {/* Frequency */}
            <div className="form-group">
              <label>
                <FiCalendar className="label-icon" />
                Frequency
              </label>
              <div className="select-wrapper">
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly (1st of each month)</option>
                </select>
                <FiChevronDown className="select-icon" />
              </div>
            </div>

            {/* Days Selection (for weekly) */}
            {formData.frequency === 'weekly' && (
              <div className="form-group">
                <label>Select Days</label>
                <div className="days-selector">
                  {weekDays.map(day => (
                    <button
                      key={day.value}
                      type="button"
                      className={`day-btn ${formData.days.includes(day.value) ? 'active' : ''}`}
                      onClick={() => toggleDay(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {errors.days && <span className="error-text">{errors.days}</span>}
              </div>
            )}

            {/* Time */}
            <div className="form-group">
              <label>
                <FiClock className="label-icon" />
                Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
              />
            </div>

            {/* End Date (Optional) */}
            <div className="form-group">
              <label>
                <FiCalendar className="label-icon" />
                End Date (Optional)
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Email Results */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="emailResults"
                  checked={formData.emailResults}
                  onChange={handleChange}
                />
                <span className="checkmark"></span>
                <FiMail className="label-icon" />
                Send results to my email
              </label>
            </div>

            {errors.submit && (
              <div className="submit-error">{errors.submit}</div>
            )}

            {/* Actions */}
            <div className="schedule-modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <FiClock />
                    Schedule Prompt
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScheduleModal;
