import type { VideoTimeline } from './timeline';

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface ChatApiResponse {
  id: string;
  content: string;
  timeline?: VideoTimeline;
}

export interface ChatError {
  message: string;
  code?: string;
}

export interface StorageData {
  messages: ChatMessage[];
  lastUpdated: number;
}