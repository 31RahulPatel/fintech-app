import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  FiSend, FiTrash2, FiZap, FiTrendingUp,
  FiDollarSign, FiPieChart, FiShield, FiRefreshCw, FiChevronDown,
  FiClock, FiMenu
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import schedulerService from '../../services/schedulerService';
import ScheduleModal from '../../components/ScheduleModal/ScheduleModal';
import ScheduleList from '../../components/ScheduleList/ScheduleList';
import './Chatbot.css';

const Chatbot = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduleList, setShowScheduleList] = useState(false);
  const [scheduleRefresh, setScheduleRefresh] = useState(0);
  const [promptToSchedule, setPromptToSchedule] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const quickActions = [
    { icon: <FiTrendingUp />, label: 'Market Analysis', prompt: 'Give me a detailed analysis of the current Indian stock market situation, including Nifty 50 and Sensex trends.' },
    { icon: <FiDollarSign />, label: 'SIP Guide', prompt: 'I want to start investing in SIP. Explain the best strategies for a beginner with ₹10,000 monthly budget.' },
    { icon: <FiPieChart />, label: 'Portfolio Review', prompt: 'Help me create a diversified investment portfolio with moderate risk tolerance for a 10-year horizon.' },
    { icon: <FiShield />, label: 'Tax Planning', prompt: 'What are the best tax-saving investment options under Section 80C and 80D for salaried employees in India?' },
    { icon: <FiZap />, label: 'Crypto Update', prompt: 'What is the current state of cryptocurrency markets? Should I invest in Bitcoin or Ethereum right now?' },
    { icon: <FiRefreshCw />, label: 'Mutual Funds', prompt: 'Compare large-cap, mid-cap, and small-cap mutual funds. Which category is best for long-term wealth creation?' },
  ];

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/chatbot/chat/history?limit=50');
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages.map((msg, i) => ({
            id: msg._id || i,
            type: msg.role === 'user' ? 'user' : 'bot',
            text: msg.content,
            timestamp: new Date(msg.timestamp)
          })));
        }
      } catch (err) {
        console.log('No previous chat history');
      }
    };
    loadHistory();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      const res = await api.post('/chatbot/chat', { message: text.trim() });
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: res.data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to get response. Please try again.';
      setError(errorMsg);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = () => sendMessage(inputValue);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  const clearChat = async () => {
    try {
      await api.delete('/chatbot/chat/history');
    } catch (e) {
      // Silent fail
    }
    setMessages([]);
    setError(null);
  };

  // Schedule functions
  const handleCreateSchedule = async (scheduleData) => {
    try {
      await schedulerService.createSchedule(scheduleData);
      setScheduleRefresh(prev => prev + 1);
    } catch (err) {
      throw new Error(err.message || 'Failed to create schedule');
    }
  };

  const openScheduleModal = (prompt = '') => {
    setPromptToSchedule(prompt);
    setShowScheduleModal(true);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={`chatbot-page ${theme === 'dark' ? 'chatbot-dark' : ''}`}>
      <div className="chat-layout">
        <div className="chat-main-area">
          {/* Top Bar */}
          <div className="chat-topbar">
            <div className="chat-topbar-left">
              <div className="bazar-logo-icon">
                <FiZap />
              </div>
              <div>
                <h2>Bazar.ai</h2>
                <span className="status-badge">
                  <span className="status-dot"></span>
                  Powered by Groq AI
                </span>
              </div>
            </div>
            <div className="chat-topbar-right">
              <button 
                className="schedule-list-btn" 
                onClick={() => setShowScheduleList(true)} 
                title="View Scheduled Prompts"
              >
                <FiClock />
                <span>Schedules</span>
              </button>
              {hasMessages && (
                <button className="clear-chat-btn" onClick={clearChat} title="Clear chat">
                  <FiTrash2 />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            className="chat-messages"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            {!hasMessages ? (
              <div className="chat-welcome">
                <motion.div
                  className="welcome-content"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="welcome-icon">
                    <FiZap />
                  </div>
                  <h1>Welcome to Bazar.ai</h1>
                  <p>Your AI-powered financial assistant. Ask me anything about investments, market analysis, tax planning, or financial strategies.</p>

                  <div className="quick-actions-grid">
                    {quickActions.map((action, i) => (
                      <motion.button
                        key={i}
                        className="quick-action-card"
                        onClick={() => handleQuickAction(action.prompt)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div className="quick-action-icon">{action.icon}</div>
                        <span>{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <div className="messages-list">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`chat-msg ${message.type} ${message.isError ? 'error' : ''}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="chat-msg-inner">
                        {message.type === 'bot' && (
                          <div className="msg-avatar bot-icon">
                            <FiZap />
                          </div>
                        )}
                        <div className="msg-bubble">
                          {message.type === 'bot' ? (
                            <div className="markdown-body">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p>{message.text}</p>
                          )}
                          <span className="msg-time">{formatTime(message.timestamp)}</span>
                        </div>
                        {message.type === 'user' && (
                          <div className="msg-avatar user-icon">
                            {user?.firstName?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    className="chat-msg bot"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="chat-msg-inner">
                      <div className="msg-avatar bot-icon">
                        <FiZap />
                      </div>
                      <div className="msg-bubble typing-bubble">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {showScrollDown && (
              <button className="scroll-down-btn" onClick={scrollToBottom}>
                <FiChevronDown />
              </button>
            )}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            {error && (
              <div className="chat-error">
                <span>{error}</span>
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}
            <div className="chat-input-wrapper">
              <button
                className="schedule-btn"
                onClick={() => openScheduleModal(inputValue)}
                title="Schedule this prompt"
              >
                <FiClock />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask Bazar.ai anything about finance..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isTyping}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
              >
                <FiSend />
              </button>
            </div>
            <p className="chat-disclaimer">
              Bazar.ai can make mistakes. Consult a financial advisor for personalized investment advice.
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setPromptToSchedule('');
        }}
        onSubmit={handleCreateSchedule}
        initialPrompt={promptToSchedule}
      />

      {/* Schedule List Sidebar */}
      <AnimatePresence>
        {showScheduleList && (
          <ScheduleList
            isOpen={showScheduleList}
            onClose={() => setShowScheduleList(false)}
            onCreateNew={() => {
              setShowScheduleList(false);
              openScheduleModal();
            }}
            onRefresh={scheduleRefresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;
