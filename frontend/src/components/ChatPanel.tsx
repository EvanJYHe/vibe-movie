import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatError } from '../types/chat';
import { chatApi } from '../services/chatApi';
import { chatStorage } from '../utils/chatStorage';

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
          backgroundColor: isUser ? '#007bff' : '#f1f3f5',
          color: isUser ? 'white' : '#333',
          fontSize: '14px',
          lineHeight: '1.4',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
  );
};

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
      backgroundColor: '#fee',
      border: '1px solid #fcc',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#d63384',
    }}
  >
    <div style={{ marginBottom: '8px' }}>{error.message}</div>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={onRetry}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          border: '1px solid #d63384',
          borderRadius: '4px',
          backgroundColor: 'white',
          color: '#d63384',
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
          color: '#d63384',
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
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '400px',
        margin: '20px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: '16px', fontSize: '16px', color: '#333' }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
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
            backgroundColor: '#dc3545',
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
export const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);

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

  const saveMessages = useCallback((newMessages: ChatMessage[]) => {
    chatStorage.saveHistory(newMessages);
  }, []);

  const handleSendMessage = async (content = inputValue.trim()) => {
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
    setLastFailedMessage(null);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(newMessages);

      const assistantMessage: ChatMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        createdAt: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
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
        width: '400px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
          AI Chat
        </h3>
        <button
          onClick={handleClearHistory}
          disabled={messages.length === 0}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: 'white',
            color: '#666',
            cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
            opacity: messages.length === 0 ? 0.5 : 1,
          }}
        >
          Clear
        </button>
      </div>

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
                backgroundColor: '#f1f3f5',
                color: '#666',
                fontSize: '14px',
                fontStyle: 'italic',
              }}
            >
              AI is typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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
          borderTop: '1px solid #eee',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for newline)"
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '20px',
              maxHeight: '100px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
            aria-label="Chat message input"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!canSend}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: canSend ? '#007bff' : '#e9ecef',
              color: canSend ? 'white' : '#6c757d',
              cursor: canSend ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
            }}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>

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
    </div>
  );
};