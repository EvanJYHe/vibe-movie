export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface ChatApiRequest {
  messages: ChatMessage[];
}

export interface ChatApiResponse {
  id: string;
  content: string;
}

export interface ChatError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
}

export interface StorageData {
  messages: ChatMessage[];
  lastUpdated: number;
}