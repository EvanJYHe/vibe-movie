import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useShallow } from "zustand/react/shallow";
import type { ChatMessage, ChatError } from "../types/chat";
import { chatApi } from "../services/chatApi";
import { chatStorage } from "../utils/chatStorage";
import { useTimelineStore } from "../stores/timelineStore";
import { convertTimelineToRemotionFormat } from "../utils/timeline";
import { StudioIcon } from "./StudioIcon";
import "./ChatPanel.css";

const generateId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

function formatMessageTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <article className={`director-message ${isUser ? "is-user" : ""}`}>
      <span className="director-message__meta">
        {isUser ? "You" : "AI"} · {formatMessageTime(message.createdAt)}
      </span>
      <p className="director-message__body">{message.content}</p>
    </article>
  );
}

function ErrorBanner({
  error,
  onRetry,
  onDismiss,
}: {
  error: ChatError;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="chat-error-banner" role="alert">
      <div>
        <strong>AI lost the thread</strong>
        <span>{error.message}</span>
      </div>
      <div className="chat-error-actions">
        <button className="chat-error-button" onClick={onRetry} type="button">
          Retry
        </button>
        <button
          aria-label="Dismiss error"
          className="chat-error-button"
          onClick={onDismiss}
          type="button"
        >
          <StudioIcon name="x" size={13} />
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="chat-confirm-backdrop" onClick={onCancel}>
      <div
        aria-labelledby="clear-director-title"
        aria-modal="true"
        className="chat-confirm-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="chat-confirm-mark">
          <StudioIcon name="trash" size={18} />
        </div>
        <h2 id="clear-director-title">Clear conversation?</h2>
        <p className="chat-confirm-text">{message}</p>
        <div className="chat-confirm-actions">
          <button className="chat-confirm-btn" onClick={onCancel} type="button">
            Keep it
          </button>
          <button
            className="chat-confirm-btn chat-confirm-btn--danger"
            onClick={onConfirm}
            type="button"
          >
            Clear history
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChatPanelProps {
  width?: number;
}

export function ChatPanel({ width = 400 }: ChatPanelProps) {
  const [activePanel, setActivePanel] = useState<"direct" | "inspect">(
    "direct"
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    chatStorage.loadHistory()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const { tracks, assets, selectedClipIds, updateClip } = useTimelineStore(
    useShallow((state) => ({
      tracks: state.tracks,
      assets: state.assets,
      selectedClipIds: state.selectedClipIds,
      updateClip: state.updateClip,
    }))
  );
  const selectedClip = tracks
    .flatMap((track) => track.clips)
    .find((clip) => selectedClipIds.includes(clip.id));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && liveRegionRef.current) {
      liveRegionRef.current.textContent = `AI: ${lastMessage.content}`;
    }
  }, [messages]);

  const saveMessages = useCallback((nextMessages: ChatMessage[]) => {
    chatStorage.saveHistory(nextMessages);
  }, []);

  const handleSendMessage = async (content = inputValue.trim()) => {
    if (!content || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      createdAt: Date.now(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveMessages(nextMessages);
    setInputValue("");
    setError(null);
    setLastFailedMessage(null);
    setIsLoading(true);

    try {
      const timeline = convertTimelineToRemotionFormat(tracks, assets);
      const response = await chatApi.sendMessage(
        nextMessages,
        timeline,
        videoFile || undefined,
        assets
      );

      const assistantMessage: ChatMessage = {
        id: response.id,
        role: "assistant",
        content: response.content,
        createdAt: Date.now(),
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
      setVideoFile(null);
    } catch (caughtError) {
      console.error("Chat API error:", caughtError);
      setError(caughtError as ChatError);
      setLastFailedMessage(content);
    } finally {
      setIsLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      void handleSendMessage(lastFailedMessage);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSendMessage();
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
    <div className="chat-panel-root" style={{ width: `${width}px` }}>
      <div
        aria-label="Inspector mode"
        className="inspector-tabs"
        role="tablist"
      >
        <button
          aria-selected={activePanel === "direct"}
          className="inspector-tab"
          onClick={() => setActivePanel("direct")}
          role="tab"
          type="button"
        >
          Direct
        </button>
        <button
          aria-selected={activePanel === "inspect"}
          className="inspector-tab"
          onClick={() => setActivePanel("inspect")}
          role="tab"
          type="button"
        >
          Inspect
        </button>
        <button
          aria-label="Clear AI conversation"
          className="inspector-icon-button inspector-clear-button"
          disabled={messages.length === 0}
          onClick={() => setShowConfirm(true)}
          title="Clear AI conversation"
          type="button"
        >
          <StudioIcon name="trash" size={14} />
        </button>
      </div>

      {activePanel === "direct" ? (
        <section className="director-panel" role="tabpanel">
          <div className="director-conversation">
            {messages.length === 0 ? (
              <div className="director-empty">
                <h3>Shape the cut in plain language.</h3>
                <p>
                  Ask for pacing, structure, titles, captions, or a cleaner
                  transition. The current timeline travels with every prompt.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}

            {isLoading && (
              <article className="director-message director-message--typing">
                <span className="director-message__meta">AI · now</span>
                <p className="director-message__body">
                  Reading the sequence
                  <span className="typing-cursor" aria-hidden="true" />
                </p>
              </article>
            )}

            <div className="prompt-suggestions" aria-label="Prompt suggestions">
              {["Find jump cuts", "Tighten the opening", "Draft captions"].map(
                (prompt) => (
                  <button
                    className="prompt-chip"
                    key={prompt}
                    onClick={() => {
                      setInputValue(prompt);
                      inputRef.current?.focus();
                    }}
                    type="button"
                  >
                    {prompt}
                  </button>
                )
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <ErrorBanner
              error={error}
              onDismiss={() => setError(null)}
              onRetry={handleRetry}
            />
          )}

          <form className="director-composer" onSubmit={handleSubmit}>
            {videoFile && (
              <div className="chat-file-pill">
                <StudioIcon name="video" size={13} />
                <span>{videoFile.name}</span>
                <button
                  aria-label="Remove attached video"
                  onClick={() => setVideoFile(null)}
                  type="button"
                >
                  <StudioIcon name="x" size={12} />
                </button>
              </div>
            )}
            <label className="sr-only" htmlFor="director-prompt">
              Describe an edit
            </label>
            <textarea
              aria-label="Describe an edit"
              className="chat-textarea"
              disabled={isLoading}
              id="director-prompt"
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the cut you want…"
              ref={inputRef}
              value={inputValue}
            />
            <div className="director-composer__tools">
              <div className="director-composer__left">
                <input
                  accept="video/*"
                  className="chat-hidden-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setVideoFile(file);
                  }}
                  ref={fileInputRef}
                  type="file"
                />
                <button
                  aria-label="Attach video"
                  className="inspector-icon-button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach video"
                  type="button"
                >
                  <StudioIcon name="attach" size={15} />
                </button>
                <span className="timeline-attached">Timeline attached</span>
              </div>
              <button
                className="director-send"
                disabled={!canSend}
                type="submit"
              >
                <span>Direct</span>
                <StudioIcon name="send" size={14} />
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="inspect-panel" role="tabpanel">
          <header className="inspector-section-head">
            <div className="inspector-title-wrap">
              <h2>{selectedClip?.name || "Nothing selected"}</h2>
              <span>
                {selectedClip
                  ? `${selectedClip.type} clip · ${selectedClip.duration.toFixed(
                      2
                    )}s`
                  : "Select a clip on the timeline"}
              </span>
            </div>
            <StudioIcon name="more" size={16} />
          </header>

          {selectedClip ? (
            <div className="properties">
              <section className="property-group">
                <h3>Identity</h3>
                <label className="property-row">
                  <span>Name</span>
                  <input
                    onChange={(event) =>
                      updateClip(selectedClip.id, { name: event.target.value })
                    }
                    type="text"
                    value={selectedClip.name}
                  />
                </label>
                <div className="property-row property-row--read-only">
                  <span>Start</span>
                  <output>{selectedClip.startTime.toFixed(2)} s</output>
                </div>
                <div className="property-row property-row--read-only">
                  <span>Duration</span>
                  <output>{selectedClip.duration.toFixed(2)} s</output>
                </div>
              </section>

              <section className="property-group">
                <h3>Transform</h3>
                <label className="property-row">
                  <span>Scale</span>
                  <input
                    min="0"
                    onChange={(event) =>
                      updateClip(selectedClip.id, {
                        scale: Number(event.target.value),
                      })
                    }
                    step="0.05"
                    type="number"
                    value={selectedClip.scale ?? 1}
                  />
                </label>
                <label className="property-row">
                  <span>Rotation</span>
                  <input
                    onChange={(event) =>
                      updateClip(selectedClip.id, {
                        rotation: Number(event.target.value),
                      })
                    }
                    step="1"
                    type="number"
                    value={selectedClip.rotation ?? 0}
                  />
                </label>
                <label className="property-row">
                  <span>Opacity</span>
                  <input
                    max="1"
                    min="0"
                    onChange={(event) =>
                      updateClip(selectedClip.id, {
                        opacity: Number(event.target.value),
                      })
                    }
                    step="0.05"
                    type="number"
                    value={selectedClip.opacity ?? 1}
                  />
                </label>
              </section>

              {(selectedClip.type === "video" ||
                selectedClip.type === "audio") && (
                <section className="property-group">
                  <h3>Audio</h3>
                  <label className="property-row">
                    <span>Volume</span>
                    <input
                      max="1"
                      min="0"
                      onChange={(event) =>
                        updateClip(selectedClip.id, {
                          volume: Number(event.target.value),
                        })
                      }
                      step="0.05"
                      type="number"
                      value={selectedClip.volume ?? 1}
                    />
                  </label>
                </section>
              )}
            </div>
          ) : (
            <div className="inspect-empty">
              <StudioIcon name="pointer" size={22} />
              <h3>Select a clip to inspect it.</h3>
              <p>
                Timing, transform, opacity, and audio controls will appear
                here.
              </p>
            </div>
          )}
        </section>
      )}

      <div
        aria-atomic="true"
        aria-live="polite"
        className="chat-live-region"
        ref={liveRegionRef}
      />

      {showConfirm && (
        <ConfirmDialog
          message="This removes the local AI conversation. Your timeline and media stay exactly as they are."
          onCancel={() => setShowConfirm(false)}
          onConfirm={confirmClearHistory}
        />
      )}
    </div>
  );
}
