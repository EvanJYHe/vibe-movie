import type { ChatApiRequest, ChatApiResponse, ChatError, ChatMessage } from '../types/chat';
import type { VideoTimeline } from '../types/timeline';

const CHAT_ENDPOINT = '/api/chat';

class ChatApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(messages: ChatMessage[], timeline?: VideoTimeline, videoFile?: File): Promise<ChatApiResponse> {
    try {
      const formData = new FormData();
      formData.append('messages', JSON.stringify(messages));
      if (timeline) {
        formData.append('timeline', JSON.stringify(timeline));
      }
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const response = await fetch(`${this.baseUrl}${CHAT_ENDPOINT}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response));
      }

      const data: ChatApiResponse = await response.json();

      if (!data.id || !data.content) {
        throw new Error('Invalid response format from chat API');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw this.createChatError(error.message);
      }
      throw this.createChatError('An unexpected error occurred');
    }
  }

  private async handleErrorResponse(response: Response): Promise<string> {
    try {
      const errorData = await response.json();
      return errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
  }

  private createChatError(message: string, statusCode?: number): ChatError {
    return {
      message,
      statusCode,
      code: statusCode ? `HTTP_${statusCode}` : 'API_ERROR'
    };
  }

  private getBearerToken(): string | null {
    // For MVP, just return null - auth can be added later
    // Could check localStorage, cookies, or environment variables
    return null;
  }
}

// Export singleton instance
export const chatApi = new ChatApiClient();

// Export class for testing or custom instances
export { ChatApiClient };