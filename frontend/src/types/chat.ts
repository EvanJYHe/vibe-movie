type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface ChatApiResponse {
  id: string;
  content: string;
  timeline?: unknown;
}

export interface ChatError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface StorageData {
  messages: ChatMessage[];
  lastUpdated: number;
}
