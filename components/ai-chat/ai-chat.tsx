"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, User, Square, Sparkles } from "lucide-react";
import { usePost } from "@/lib/axios/query";
import { unwrapApiData } from "@/lib/axios/api-unwrap";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AiChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Lịch sử hội thoại được server giữ theo userId; FE chỉ gửi tin nhắn mới.
  const chatMutation = usePost<unknown, { message: string }>("/ai-chat/chat");

  const isLoading = chatMutation.isPending;

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    chatMutation.mutate(
      { message: text },
      {
        onSuccess: (res) => {
          const data = unwrapApiData<{ reply: string }>(res);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data?.reply ?? "" },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.",
            },
          ]);
        },
      },
    );
  }, [input, isLoading, chatMutation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-[#12b3a0] to-[#0e9f8e]">
          <Sparkles className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#16302b]">AI Trợ lý</h2>
          <p className="text-xs text-[#8AA09B]">
            Hỏi bất cứ điều gì về việc học
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-6 py-4"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#f0faf7]">
              <Bot className="size-8 text-[#12b3a0]" />
            </div>
            <h3 className="text-lg font-semibold text-[#16302b]">
              Chào bạn! Tôi có thể giúp gì?
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#8AA09B]">
              Hãy hỏi tôi về lịch học, bài tập, hoặc bất cứ điều gì liên quan
              đến việc học của bạn.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[80%] gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  msg.role === "user" ? "bg-[#12b3a0]" : "bg-[#e8f5f2]"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="size-4 text-white" />
                ) : (
                  <Bot className="size-4 text-[#12b3a0]" />
                )}
              </div>
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#12b3a0] text-white"
                    : "bg-[#f5f8f7] text-[#16302b]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e8f5f2]">
                <Bot className="size-4 text-[#12b3a0]" />
              </div>
              <div className="rounded-2xl bg-[#f5f8f7] px-4 py-2.5">
                <div className="flex gap-1">
                  <span
                    className="size-2 animate-bounce rounded-full bg-[#12b3a0]"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="size-2 animate-bounce rounded-full bg-[#12b3a0]"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="size-2 animate-bounce rounded-full bg-[#12b3a0]"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t px-6 py-4">
        <div className="flex items-end gap-2 rounded-2xl border border-[#E7EEEC] bg-white px-4 py-3 focus-within:border-[#12b3a0] focus-within:ring-1 focus-within:ring-[#12b3a0]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-[#16302b] outline-none placeholder:text-[#8AA09B]"
            style={{ maxHeight: "120px" }}
          />
          {isLoading ? (
            <button
              type="button"
              disabled
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f5f2] text-[#8AA09B]"
            >
              <Square className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#12b3a0] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
