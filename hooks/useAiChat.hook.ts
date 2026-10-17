"use client";

import { useCallback, useState } from "react";

import { getErrorMessage } from "@/lib/axios";
import { unwrapApiData } from "@/lib/axios/api-unwrap";
import { usePost } from "@/lib/axios/query";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Chỉ gửi tin nhắn mới: gateway bỏ `history` và server giữ lịch sử theo userId. */
interface ChatRequest {
  message: string;
}

/** Shape returned by `POST /ai-chat/chat` after the Nest response envelope is unwrapped. */
interface ChatReply {
  reply: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Xin chào! Tôi là trợ lý AI. Bạn có thể hỏi tôi về lớp học, lịch học, học phí, bài tập, điểm số hay chương trình học của mình.",
};

/**
 * Conversation state + send logic for the AI chat widget. Hiển thị lịch sử ở FE; ngữ cảnh
 * hội thoại do server giữ theo userId.
 */
export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const mutation = usePost<unknown, ChatRequest>("/ai-chat/chat");

  const sendMessage = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || mutation.isPending) return;

      setMessages((prev) => [...prev, { role: "user", content }]);

      try {
        const body = await mutation.mutateAsync({ message: content });
        const { reply } = unwrapApiData<ChatReply>(body);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reply || "Xin lỗi, tôi chưa có câu trả lời.",
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: getErrorMessage(
              error,
              "Đã có lỗi xảy ra, vui lòng thử lại sau.",
            ),
          },
        ]);
      }
    },
    [mutation],
  );

  const reset = useCallback(() => setMessages([WELCOME_MESSAGE]), []);

  return {
    messages,
    sendMessage,
    reset,
    isSending: mutation.isPending,
  };
}
