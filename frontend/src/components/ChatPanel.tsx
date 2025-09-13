import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatError } from '../types/chat';
<<<<<<< HEAD
import { chatApi } from '../services/chatApi';
import { chatStorage } from '../utils/chatStorage';
import { useTimelineStore } from '../stores/timelineStore';
import { convertTimelineToRemotionFormat } from '../utils/timeline';

// Generate unique IDs for messages
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Message Bubble Component
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: '12px',
          backgroundColor: isUser ? '#0066cc' : '#2a2a2a',
          color: isUser ? 'white' : '#e0e0e0',
          fontSize: '14px',
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
=======
import type { VideoTimeline } from '../types/timeline';
import { chatApi } from '../services/chatApi';
import { chatStorage } from '../utils/chatStorage';

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px', padding: '0 16px' }}>
      <div style={{
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: '12px',
        backgroundColor: isUser ? '#007bff' : '#f1f3f5',
        color: isUser ? 'white' : '#333',
        fontSize: '14px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
>>>>>>> better-prompting
        {message.content}
      </div>
    </div>
  );
};

<<<<<<< HEAD
// Error Banner Component
const ErrorBanner: React.FC<{
  error: ChatError;
  onRetry: () => void;
  onDismiss: () => void;
}> = ({ error, onRetry, onDismiss }) => (
  <div
    style={{
      margin: '12px 16px',
      padding: '12px',
      backgroundColor: '#3a1f1f',
      border: '1px solid #5a2a2a',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#ff6b6b',
    }}
  >
    <div style={{ marginBottom: '8px' }}>{error.message}</div>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={onRetry}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          border: '1px solid #ff6b6b',
          borderRadius: '4px',
          backgroundColor: '#2a2a2a',
          color: '#ff6b6b',
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
      <button
        onClick={onDismiss}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          color: '#ff6b6b',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Dismiss
      </button>
    </div>
  </div>
);

// Confirm Dialog Component
const ConfirmDialog: React.FC<{
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ message, onConfirm, onCancel }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}
    onClick={onCancel}
  >
    <div
      style={{
        backgroundColor: '#2a2a2a',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '400px',
        margin: '20px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: '16px', fontSize: '16px', color: '#e0e0e0' }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            border: '1px solid #3a3a3a',
            borderRadius: '4px',
            backgroundColor: '#1a1a1a',
            color: '#e0e0e0',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
    </div>
  </div>
);

// Main ChatPanel Component
interface ChatPanelProps {
  width?: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ width = 400 }) => {
=======
interface ChatPanelProps {
  timeline: VideoTimeline;
  onTimelineUpdate: (timeline: VideoTimeline) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ timeline, onTimelineUpdate }) => {
>>>>>>> better-prompting
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [inputValue, setInputValue] = useState('');
<<<<<<< HEAD
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Get timeline data from store
  const { tracks, assets } = useTimelineStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Load messages on mount
  useEffect(() => {
    const savedMessages = chatStorage.loadHistory();
    setMessages(savedMessages);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Announce new assistant messages to screen readers
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant' && liveRegionRef.current) {
      liveRegionRef.current.textContent = `AI: ${lastMessage.content}`;
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
=======

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(chatStorage.loadHistory());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
>>>>>>> better-prompting

  const saveMessages = useCallback((newMessages: ChatMessage[]) => {
    chatStorage.saveHistory(newMessages);
  }, []);

<<<<<<< HEAD
  const handleSendMessage = async (content = inputValue.trim()) => {
=======
  const handleSendMessage = async () => {
    const content = inputValue.trim();
>>>>>>> better-prompting
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    setInputValue('');
    setError(null);
<<<<<<< HEAD
    setLastFailedMessage(null);
    setIsLoading(true);

    try {
      // Convert current timeline to Remotion format for AI context
      const timeline = convertTimelineToRemotionFormat(tracks, assets);
      const response = await chatApi.sendMessage(newMessages, timeline, videoFile || undefined);
=======
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(newMessages, timeline);
>>>>>>> better-prompting

      const assistantMessage: ChatMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        createdAt: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);

<<<<<<< HEAD
      // Handle timeline updates from AI
      if (response.timeline) {
        // TODO: Apply timeline updates to the store
        console.log('Received timeline update from AI:', response.timeline);
      }

      // Clear video file after sending
      if (videoFile) {
        setVideoFile(null);
      }
    } catch (err) {
      console.error('Chat API error:', err);
      setError(err as ChatError);
      setLastFailedMessage(content);
    } finally {
      setIsLoading(false);
      // Restore focus to input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow newline
        return;
      } else {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  const handleClearHistory = () => {
    setShowConfirm(true);
  };

  const confirmClearHistory = () => {
    setMessages([]);
    chatStorage.clearHistory();
    setShowConfirm(false);
    setError(null);
    setLastFailedMessage(null);
    inputRef.current?.focus();
  };

  const canSend = inputValue.trim().length > 0 && !isLoading;

  return (
    <div
      style={{
        width: `${width}px`,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        borderLeft: '1px solid #3a3a3a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #3a3a3a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#252525',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#e0e0e0' }}>
          AI Chat
        </h3>
        <button
          onClick={handleClearHistory}
          disabled={messages.length === 0}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #4a4a4a',
            borderRadius: '4px',
            backgroundColor: '#3a3a3a',
            color: '#999',
            cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
            opacity: messages.length === 0 ? 0.5 : 1,
          }}
        >
=======
      if (response.timeline) {
        onTimelineUpdate(response.timeline);
      }
    } catch (err) {
      setError(err as ChatError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    chatStorage.clearHistory();
    setError(null);
  };

  return (
    <div style={{
      width: '400px',
      height: '600px',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>AI Chat</h3>
        <button onClick={clearChat} disabled={messages.length === 0} style={{
          padding: '4px 8px',
          fontSize: '12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
          opacity: messages.length === 0 ? 0.5 : 1,
        }}>
>>>>>>> better-prompting
          Clear
        </button>
      </div>

<<<<<<< HEAD
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0',
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              padding: '40px 20px',
            }}
          >
            Message the AI to get started...
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '12px',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#2a2a2a',
                color: '#999',
                fontSize: '14px',
                fontStyle: 'italic',
              }}
            >
=======
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '14px', padding: '40px 20px' }}>
            Message the AI to get started...
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 16px' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#f1f3f5',
              color: '#666',
              fontSize: '14px',
              fontStyle: 'italic',
            }}>
>>>>>>> better-prompting
              AI is typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

<<<<<<< HEAD
      {/* Error Banner */}
      {error && (
        <ErrorBanner
          error={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Composer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #3a3a3a',
        }}
      >
        {/* Video file display */}
        {videoFile && (
          <div style={{
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #3a3a3a',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '14px', color: '#e0e0e0', flex: 1 }}>
              📹 {videoFile.name}
            </span>
            <button
              onClick={() => setVideoFile(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Remove video"
            >
              ✕
            </button>
          </div>
        )}

=======
      {error && (
        <div style={{
          margin: '12px 16px',
          padding: '12px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#d63384',
        }}>
          {error.message}
        </div>
      )}

      <div style={{ padding: '16px', borderTop: '1px solid #eee' }}>
>>>>>>> better-prompting
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
<<<<<<< HEAD
            placeholder="Type a message... (Shift+Enter for newline)"
=======
            placeholder="Type a message..."
>>>>>>> better-prompting
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '20px',
              maxHeight: '100px',
              padding: '8px 12px',
<<<<<<< HEAD
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
              backgroundColor: '#2a2a2a',
              color: '#e0e0e0',
            }}
            aria-label="Chat message input"
          />
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setVideoFile(file);
            }}
            style={{ display: 'none' }}
            id="video-upload"
          />
          <button
            onClick={() => document.getElementById('video-upload')?.click()}
            style={{
              padding: '8px',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              backgroundColor: videoFile ? '#0066cc' : '#2a2a2a',
              color: videoFile ? 'white' : '#e0e0e0',
              cursor: 'pointer',
              fontSize: '16px',
            }}
            title="Upload video for analysis"
          >
            📹
          </button>
          <button
            onClick={() => handleSendMessage()}
            disabled={!canSend}
=======
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
>>>>>>> better-prompting
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
<<<<<<< HEAD
              backgroundColor: canSend ? '#0066cc' : '#3a3a3a',
              color: canSend ? 'white' : '#666',
              cursor: canSend ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
            }}
            aria-label="Send message"
=======
              backgroundColor: inputValue.trim() && !isLoading ? '#007bff' : '#e9ecef',
              color: inputValue.trim() && !isLoading ? 'white' : '#6c757d',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
            }}
>>>>>>> better-prompting
          >
            Send
          </button>
        </div>
      </div>
<<<<<<< HEAD

      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to clear all chat history? This action cannot be undone."
          onConfirm={confirmClearHistory}
          onCancel={() => setShowConfirm(false)}
        />
      )}
=======
>>>>>>> better-prompting
    </div>
  );
};