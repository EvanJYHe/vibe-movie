import type { ChatApiResponse, ChatError, ChatMessage } from '../types/chat';
import type { VideoTimeline } from '../types/timeline';

const API_URL = 'http://localhost:3001/api/chat';

async function sendMessage(
  messages: ChatMessage[],
  timeline?: VideoTimeline
): Promise<ChatApiResponse> {
  const formData = new FormData();
  formData.append('messages', JSON.stringify(messages));

  if (timeline) {
    formData.append('timeline', JSON.stringify(timeline));
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    const error: ChatError = {
      message: errorData.message || `HTTP ${response.status}`,
      code: 'API_ERROR'
    };
    throw error;
  }

  return response.json();
}

export const chatApi = { sendMessage };