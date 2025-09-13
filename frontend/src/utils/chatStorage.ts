import type { ChatMessage, StorageData } from '../types/chat';

const STORAGE_KEY = 'vibe-chat-history';
const MAX_MESSAGES = 1000; // Future pruning limit

class ChatStorage {
  private storageKey: string;

  constructor(key = STORAGE_KEY) {
    this.storageKey = key;
  }

  /**
   * Load chat history from localStorage
   */
  loadHistory(): ChatMessage[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return [];
      }

      const data: StorageData = JSON.parse(stored);

      // Validate data structure
      if (!data.messages || !Array.isArray(data.messages)) {
        console.warn('Invalid chat history format, starting fresh');
        return [];
      }

      // Validate message structure
      const validMessages = data.messages.filter(this.isValidMessage);

      if (validMessages.length !== data.messages.length) {
        console.warn('Some chat messages were invalid and filtered out');
      }

      return validMessages;
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }

  /**
   * Save chat history to localStorage
   */
  saveHistory(messages: ChatMessage[]): boolean {
    try {
      const data: StorageData = {
        messages: this.pruneMessages(messages),
        lastUpdated: Date.now()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save chat history:', error);
      // Could be quota exceeded or localStorage disabled
      return false;
    }
  }

  /**
   * Clear all chat history
   */
  clearHistory(): boolean {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Failed to clear chat history:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStorageInfo(): { messageCount: number; lastUpdated: number | null } {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return { messageCount: 0, lastUpdated: null };
      }

      const data: StorageData = JSON.parse(stored);
      return {
        messageCount: data.messages?.length || 0,
        lastUpdated: data.lastUpdated || null
      };
    } catch {
      return { messageCount: 0, lastUpdated: null };
    }
  }

  private isValidMessage(message: any): message is ChatMessage {
    return (
      typeof message === 'object' &&
      typeof message.id === 'string' &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.content === 'string' &&
      typeof message.createdAt === 'number'
    );
  }

  private pruneMessages(messages: ChatMessage[]): ChatMessage[] {
    // For MVP, just limit by count. Could add time-based or size-based pruning
    if (messages.length <= MAX_MESSAGES) {
      return messages;
    }

    // Keep most recent messages
    return messages.slice(-MAX_MESSAGES);
  }
}

// Export singleton instance
export const chatStorage = new ChatStorage();

// Export class for testing or custom instances
export { ChatStorage };