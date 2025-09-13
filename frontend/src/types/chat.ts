<<<<<<< HEAD
=======
import type { VideoTimeline } from './timeline';

>>>>>>> better-prompting
export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
<<<<<<< HEAD
  metadata?: Record<string, any>;
}

export interface ChatApiRequest {
  messages: ChatMessage[];
=======
>>>>>>> better-prompting
}

export interface ChatApiResponse {
  id: string;
  content: string;
<<<<<<< HEAD
  timeline?: any; // VideoTimeline from backend
=======
  timeline?: VideoTimeline;
>>>>>>> better-prompting
}

export interface ChatError {
  message: string;
  code?: string;
<<<<<<< HEAD
  statusCode?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
=======
>>>>>>> better-prompting
}

export interface StorageData {
  messages: ChatMessage[];
  lastUpdated: number;
}