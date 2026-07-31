import type {
  ChatApiResponse,
  ChatError,
  ChatMessage,
} from "../types/chat";
import type { VideoTimeline, MediaAsset } from "../types/timeline";
import { useTimelineStore } from "../stores/timelineStore";
import { apiUrl } from "./api";

class ChatApiClient {
  async sendMessage(
    messages: ChatMessage[],
    timeline?: VideoTimeline,
    videoFile?: File,
    assets?: MediaAsset[]
  ): Promise<ChatApiResponse> {
    try {
      const formData = new FormData();
      formData.append("messages", JSON.stringify(messages));
      if (timeline) {
        formData.append("timeline", JSON.stringify(timeline));
      }
      if (assets) {
        formData.append("assets", JSON.stringify(assets));
      }
      if (videoFile) {
        formData.append("video", videoFile);
      }

      const response = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await this.handleErrorResponse(response));
      }

      const data: ChatApiResponse = await response.json();

      if (!data.id || !data.content) {
        throw new Error("Invalid response format from chat API");
      }

      if (data.timeline) {
        useTimelineStore.getState().loadTimelineFromAI(data.timeline);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw this.createChatError(error.message);
      }
      throw this.createChatError("An unexpected error occurred");
    }
  }

  private async handleErrorResponse(response: Response): Promise<string> {
    try {
      const errorData = await response.json();
      return (
        errorData.error ||
        errorData.message ||
        `HTTP ${response.status}: ${response.statusText}`
      );
    } catch {
      return `HTTP ${response.status}: ${response.statusText}`;
    }
  }

  private createChatError(message: string, statusCode?: number): ChatError {
    return {
      message,
      statusCode,
      code: statusCode ? `HTTP_${statusCode}` : "API_ERROR",
    };
  }

}

export const chatApi = new ChatApiClient();
