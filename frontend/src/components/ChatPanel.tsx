import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ChatMessage, ChatError } from '../types/chat';
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
        {message.content}
      </div>
    </div>
  );
};

interface ChatPanelProps {
  timeline: VideoTimeline;
  onTimelineUpdate: (timeline: VideoTimeline) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ timeline, onTimelineUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [inputValue, setInputValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(chatStorage.loadHistory());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessages = useCallback((newMessages: ChatMessage[]) => {
    chatStorage.saveHistory(newMessages);
  }, []);

  const handleSendMessage = async () => {
    const content = inputValue.trim();
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
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage(newMessages, timeline);

      const assistantMessage: ChatMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        createdAt: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);

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
          Clear
        </button>
      </div>

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
              AI is typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
            style={{
              flex: 1,
              minHeight: '20px',
              maxHeight: '100px',
              padding: '8px 12px',
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
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: inputValue.trim() && !isLoading ? '#007bff' : '#e9ecef',
              color: inputValue.trim() && !isLoading ? 'white' : '#6c757d',
              cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};