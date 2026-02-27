import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiClock, FiMail, FiTrash2, FiEdit2, FiPlay, FiPause,
  FiChevronRight, FiCalendar, FiZap, FiPlus, FiX, FiEye
} from 'react-icons/fi';
import schedulerService from '../../services/schedulerService';
import './ScheduleList.css';

const ScheduleList = ({ isOpen, onClose, onCreateNew, onRefresh }) => {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSchedules();
    }
  }, [isOpen, onRefresh]);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await schedulerService.getSchedules();
      setSchedules(data || []);
    } catch (err) {
      setError('Failed to load schedules');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSchedule = async (scheduleId) => {
    try {
      await schedulerService.toggleSchedule(scheduleId);
      fetchSchedules();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await schedulerService.deleteSchedule(scheduleId);
      fetchSchedules();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const viewResults = async (schedule) => {
    try {
      setSelectedSchedule(schedule);
      const data = await schedulerService.getResults(schedule._id);
      setResults(data.results || []);
      setShowResults(true);
    } catch (err) {
      console.error('Fetch results error:', err);
    }
  };

  const formatFrequency = (schedule) => {
    if (schedule.frequency === 'daily') return 'Daily';
    if (schedule.frequency === 'monthly') return 'Monthly (1st)';
    if (schedule.frequency === 'weekly') {
      const days = schedule.days?.map(d => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(', ');
      return `Weekly (${days})`;
    }
    return schedule.frequency;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    return `${h > 12 ? h - 12 : h}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="schedule-sidebar"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
    >
      <div className="schedule-sidebar-header">
        <div className="sidebar-title">
          <FiClock />
          <h3>Scheduled Prompts</h3>
        </div>
        <button className="sidebar-close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      <div className="schedule-sidebar-content">
        {/* Create New Button */}
        <button className="create-schedule-btn" onClick={onCreateNew}>
          <FiPlus />
          <span>Create New Schedule</span>
        </button>

        {isLoading ? (
          <div className="schedules-loading">
            <div className="loading-spinner"></div>
            <p>Loading schedules...</p>
          </div>
        ) : error ? (
          <div className="schedules-error">
            <p>{error}</p>
            <button onClick={fetchSchedules}>Retry</button>
          </div>
        ) : schedules.length === 0 ? (
          <div className="schedules-empty">
            <FiClock className="empty-icon" />
            <h4>No Scheduled Prompts</h4>
            <p>Create a schedule to get AI responses delivered to your email automatically.</p>
          </div>
        ) : (
          <div className="schedules-list">
            <AnimatePresence>
              {schedules.map((schedule) => (
                <motion.div
                  key={schedule._id}
                  className={`schedule-card ${!schedule.isActive ? 'inactive' : ''}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <div className="schedule-card-header">
                    <div className={`status-indicator ${schedule.isActive ? 'active' : 'paused'}`}>
                      {schedule.isActive ? <FiPlay /> : <FiPause />}
                    </div>
                    <div className="schedule-info">
                      <p className="schedule-prompt">{schedule.prompt}</p>
                      <div className="schedule-meta">
                        <span className="meta-item">
                          <FiCalendar />
                          {formatFrequency(schedule)}
                        </span>
                        <span className="meta-item">
                          <FiClock />
                          {formatTime(schedule.time)}
                        </span>
                        {schedule.emailResults && (
                          <span className="meta-item email-badge">
                            <FiMail />
                            Email
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="schedule-stats">
                    <div className="stat">
                      <span className="stat-value">{schedule.runCount || 0}</span>
                      <span className="stat-label">Runs</span>
                    </div>
                    {schedule.lastRun && (
                      <div className="stat">
                        <span className="stat-value">
                          {new Date(schedule.lastRun).toLocaleDateString()}
                        </span>
                        <span className="stat-label">Last Run</span>
                      </div>
                    )}
                  </div>

                  <div className="schedule-actions">
                    <button
                      className="action-btn view"
                      onClick={() => viewResults(schedule)}
                      title="View Results"
                    >
                      <FiEye />
                    </button>
                    <button
                      className={`action-btn toggle ${schedule.isActive ? 'active' : ''}`}
                      onClick={() => toggleSchedule(schedule._id)}
                      title={schedule.isActive ? 'Pause' : 'Resume'}
                    >
                      {schedule.isActive ? <FiPause /> : <FiPlay />}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteSchedule(schedule._id)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Results Modal */}
      <AnimatePresence>
        {showResults && selectedSchedule && (
          <motion.div
            className="results-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResults(false)}
          >
            <motion.div
              className="results-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="results-header">
                <h3>Schedule Results</h3>
                <button onClick={() => setShowResults(false)}>
                  <FiX />
                </button>
              </div>
              <div className="results-content">
                <div className="results-prompt">
                  <strong>Prompt:</strong> {selectedSchedule.prompt}
                </div>
                {results.length === 0 ? (
                  <div className="no-results">
                    <FiZap />
                    <p>No results yet. The schedule will run at the configured time.</p>
                  </div>
                ) : (
                  <div className="results-list">
                    {results.map((result) => (
                      <div key={result._id} className={`result-item ${result.error ? 'error' : ''}`}>
                        <div className="result-time">
                          {new Date(result.executedAt).toLocaleString()}
                        </div>
                        <div className="result-response">
                          {result.response}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ScheduleList;
