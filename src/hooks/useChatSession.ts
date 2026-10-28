/**
 * useChatSession — quản lý phiên trò chuyện (CA-096.02)
 *
 * Tách ra từ App.tsx:
 * - Danh sách tin nhắn và thao tác append/reset/clear
 * - ID phiên đang hoạt động, tạo phiên mới
 * - Lưu lịch sử chat vào SQLite (invoke save_chat_message)
 * - Load tin nhắn từ phiên lịch sử (handleSelectSession)
 * - Cảnh báo khi lưu thất bại
 * - Theo dõi revision khi hội thoại thay đổi
 */
import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { ChatMessage, ChatSession } from "../types";

export const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Chào bạn. v1.0.1 tập trung chat-first, tùy biến giao diện và các luồng local đã có.",
};

export function createMessageId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface ChatSessionResult {
  messages: ChatMessage[];
  activeSessionId: string;
  historyPersistenceWarning: string | null;
  revision: number;
  appendMessage: (msg: ChatMessage) => void;
  appendAssistant: (content: string, payload?: Partial<ChatMessage>) => void;
  /** Đặt lại messages về chỉ có welcome message. Chỉ gọi 1 lần (dùng ref). */
  resetToWelcome: () => void;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  startNewChat: (
    inputRefOrCb?: React.RefObject<HTMLTextAreaElement | null> | (() => void),
  ) => Promise<void>;
  handleSelectSession: (
    session: ChatSession,
    onSelect?: ((v: string) => void) | (() => void),
  ) => Promise<void>;
}

export function useChatSession(): ChatSessionResult {
  // Đảm bảo welcome message chỉ set 1 lần duy nhất trong toàn vòng đời app.
  const welcomeShownRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [activeSessionId, setActiveSessionId] = useState<string>("default");
  const [historyPersistenceWarning, setHistoryPersistenceWarning] = useState<string | null>(null);
  const [revision, setRevision] = useState<number>(0);

  function appendMessage(message: ChatMessage) {
    setMessages((current) => {
      const next = [...current, message];
      return next.length > 150 ? next.slice(-150) : next;
    });
    setRevision((r) => r + 1);

    if (message.role === "user" || message.role === "assistant") {
      invoke("save_chat_message", {
        sessionId: activeSessionId,
        role: message.role,
        content: message.content,
      })
        .then(() => setHistoryPersistenceWarning(null))
        .catch((err) => {
          const safeError = String(err ?? "");
          if (safeError.includes("Chưa bật lưu lịch sử")) return;
          console.warn("Lỗi lưu lịch sử chat local.", { errorType: typeof err });
          setHistoryPersistenceWarning(
            "Lịch sử chat local chưa lưu được. Hội thoại hiện tại vẫn hoạt động.",
          );
        });
    }
  }

  function appendAssistant(content: string, payload: Partial<ChatMessage> = {}) {
    appendMessage({ id: createMessageId(), role: "assistant", content, ...payload });
  }

  function resetToWelcome() {
    if (!welcomeShownRef.current) {
      welcomeShownRef.current = true;
      setMessages([welcomeMessage]);
      setRevision((r) => r + 1);
    }
  }

  function clearMessages() {
    setMessages([welcomeMessage]);
    setRevision((r) => r + 1);
  }

  async function startNewChat(
    inputRefOrCb?: React.RefObject<HTMLTextAreaElement | null> | (() => void),
  ) {
    try {
      const enabled = await invoke<string>("get_setting_cmd", {
        key: "chatHistoryEnabled",
        fallback: "false",
      });
      if (enabled === "true") {
        const newSess = await invoke<{ id: string }>("create_chat_session", {
          title: "Cuộc trò chuyện mới",
        });
        setActiveSessionId(newSess.id);
      } else {
        setActiveSessionId("default");
      }
    } catch (err) {
      console.error("Lỗi khi tạo phiên mới:", err);
      setActiveSessionId("default");
    }

    setMessages([welcomeMessage]);
    setRevision((r) => r + 1);
    if (typeof inputRefOrCb === "function") {
      inputRefOrCb();
    } else if (inputRefOrCb && "current" in inputRefOrCb) {
      window.setTimeout(() => inputRefOrCb.current?.focus(), 0);
    }
  }

  async function handleSelectSession(
    session: ChatSession,
    onSelect?: ((v: string) => void) | (() => void),
  ) {
    setActiveSessionId(session.id);
    try {
      const msgs = await invoke<
        Array<{ id: number; role: string; content: string; createdAt: string }>
      >("get_session_messages", { sessionId: session.id });
      if (msgs && msgs.length > 0) {
        const chatMsgs: ChatMessage[] = msgs.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(chatMsgs);
      } else {
        setMessages([welcomeMessage]);
      }
    } catch (err) {
      console.error("Lỗi đọc tin nhắn phiên:", err);
      setMessages([welcomeMessage]);
    }
    setRevision((r) => r + 1);
    if (typeof onSelect === "function") {
      onSelect("chat");
    }
  }

  return {
    messages,
    activeSessionId,
    historyPersistenceWarning,
    revision,
    appendMessage,
    appendAssistant,
    resetToWelcome,
    clearMessages,
    setMessages,
    startNewChat,
    handleSelectSession,
  };
}
