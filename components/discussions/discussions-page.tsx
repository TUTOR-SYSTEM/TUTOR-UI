"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessageSquareDot,
  Paperclip,
  Search,
  Send,
  Users,
  User,
  GraduationCap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import UsageGuides, {
  type UsageGuideStep,
} from "@/components/ui/usage-guide.ui";
import { CHAT_AVAILABLE } from "@/lib/chat/availability";
import { useChatSocket } from "@/hooks/useChatSocket.hook";
import { useUserStatus } from "@/hooks/useUserStatus.hook";
import { useSocket } from "@/components/providers/socket.provider";
import {
  useConversations,
  useMessages,
  useMarkAsRead,
  useChatableUsers,
  useCreateDirectConversation,
  type Conversation,
  type Message as ChatMessage,
  type ChatableUser,
} from "@/hooks/useChat.hook";
import { useAuthStore } from "@/zustand/auth.store";

/* ─── Types ─── */

type SenderType = "ADMIN" | "TUTOR" | "STUDENT" | "PARENT";

/* ─── Helpers ─── */

const getRoleIcon = (role: string) => {
  switch (role) {
    case "ADMIN":
      return Shield;
    case "TUTOR":
      return GraduationCap;
    case "STUDENT":
      return User;
    case "PARENT":
      return Users;
    default:
      return User;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "TUTOR":
      return "Giáo viên";
    case "STUDENT":
      return "Học sinh";
    case "PARENT":
      return "Phụ huynh";
    default:
      return role;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "TUTOR":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "STUDENT":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "PARENT":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
};

const getAvatarBg = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-500";
    case "TUTOR":
      return "bg-blue-500";
    case "STUDENT":
      return "bg-emerald-500";
    case "PARENT":
      return "bg-violet-500";
    default:
      return "bg-gray-500";
  }
};

/* ─── Sub-components ─── */

const Avatar = ({
  initials,
  bgClass,
  size = "md",
}: {
  initials: string;
  bgClass: string;
  size?: "sm" | "md" | "lg";
}) => (
  <span
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
      bgClass,
      size === "sm" && "size-8 text-xs",
      size === "md" && "size-10 text-sm",
      size === "lg" && "size-12 text-base",
    )}
  >
    {initials}
  </span>
);

const getInitials = (firstName?: string, lastName?: string) => {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

/* ─── Usage Guide ─── */

const USAGE_GUIDE_STEPS: UsageGuideStep[] = [
  {
    n: 1,
    title: "Tìm kiếm",
    body: (
      <>
        Dùng ô tìm kiếm để tìm cuộc trò chuyện với{" "}
        <span className="font-semibold text-[#16302b]">
          giáo viên, học sinh, phụ huynh
        </span>
        .
      </>
    ),
  },
  {
    n: 2,
    title: "Chọn hội thoại",
    body: (
      <>
        Nhấn một thẻ để mở khung chat bên phải; số tin{" "}
        <span className="font-semibold text-[#16302b]">chưa đọc</span> tự
        động về 0.
      </>
    ),
  },
  {
    n: 3,
    title: "Gửi tin nhắn",
    body: (
      <>
        Nhập nội dung rồi nhấn{" "}
        <span className="font-semibold text-[#0E9F8E]">Enter</span> để gửi;{" "}
        <span className="font-semibold text-[#16302b]">Shift+Enter</span> để
        xuống dòng.
      </>
    ),
  },
  {
    n: 4,
    title: "Phân quyền chat",
    body: (
      <>
        <span className="font-semibold text-[#16302b]">Admin</span> chat được
        với mọi người. <span className="font-semibold text-[#16302b]">
          Giáo viên
        </span>{" "}
        chat với học sinh/phụ huynh trong lớp.{" "}
        <span className="font-semibold text-[#16302b]">Học sinh</span> chat
        với bạn cùng lớp.
      </>
    ),
  },
];

/* ─── Main component ─── */

/** Chat UI; only mounted when `CHAT_AVAILABLE` (its hooks fire `/chat/*` requests). */
const ChatDiscussionsPage = () => {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [activeTab, setActiveTab] = useState<"conversations" | "users">("conversations");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { isConnected } = useSocket();
  const { isOnline } = useUserStatus();

  const { data: conversations = [], isLoading: isLoadingConversations } = useConversations();
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(activeId);
  const markAsRead = useMarkAsRead();
  const { data: chatableUsers = [], isLoading: isLoadingUsers } = useChatableUsers();
  const createDirectConversation = useCreateDirectConversation();

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const handleSocketMessage = useCallback(
    (message: {
      id: string;
      conversationId: string;
      senderId: string;
      senderRole: string;
      content: string;
      timestamp: string;
    }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
    [queryClient],
  );

  const handleTypingStart = useCallback((data: { userId: string; conversationId: string }) => {
    setTypingUsers((prev) => new Map(prev).set(data.conversationId, data.userId));
  }, []);

  const handleTypingStop = useCallback((data: { userId: string; conversationId: string }) => {
    setTypingUsers((prev) => {
      const next = new Map(prev);
      next.delete(data.conversationId);
      return next;
    });
  }, []);

  const { sendMessage: sendSocketMessage, startTyping, stopTyping } = useChatSocket({
    conversationId: activeId ?? undefined,
    onMessage: handleSocketMessage,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
  });

  const filtered = conversations.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    if (c.name?.toLowerCase().includes(term)) return true;
    return c.participants.some(
      (p) =>
        p.firstName?.toLowerCase().includes(term) ||
        p.lastName?.toLowerCase().includes(term),
    );
  });

  /* Scroll to bottom when conversation changes or new message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, messages.length]);

  const openConversation = (id: string) => {
    setActiveId(id);
    markAsRead.mutate(id);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeId) return;

    sendSocketMessage(text);
    setDraft("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    if (e.target.value.length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const getConversationTitle = (conv: Conversation) => {
    if (conv.name) return conv.name;
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUser?.id);
    if (otherParticipant) {
      return `${otherParticipant.lastName ?? ""} ${otherParticipant.firstName ?? ""}`.trim();
    }
    return "Cuộc trò chuyện";
  };

  const getConversationSubtitle = (conv: Conversation) => {
    if (conv.type === "CLASS") return `Lớp: ${conv.name}`;
    if (conv.type === "GROUP") return `${conv.participants.length} thành viên`;
    const otherParticipant = conv.participants.find((p) => p.userId !== currentUser?.id);
    return otherParticipant ? getRoleLabel(otherParticipant.role) : "";
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p.userId !== currentUser?.id);
  };

  const handleStartConversation = async (userId: string) => {
    const conv = await createDirectConversation.mutateAsync(userId);
    if (conv?.id) {
      setActiveId(conv.id);
      setActiveTab("conversations");
    }
  };

  const filteredUsers = chatableUsers.filter((u) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
    return name.includes(term);
  });

  return (
    <div
      className="flex flex-col gap-4 pb-4"
      style={{ height: "calc(100vh - 175px)" }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tin nhắn
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Trao đổi với giáo viên, học sinh và phụ huynh.
          </p>
        </div>
        {totalUnread > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <MessageSquareDot className="size-4" />
            {totalUnread} tin chưa đọc
          </span>
        )}
      </div>

      {/* Two-panel chat layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-card">
        {/* ── Left: conversation list + users ── */}
        <div className="flex w-72 shrink-0 flex-col border-r xl:w-80">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab("conversations")}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === "conversations"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Cuộc trò chuyện
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === "users"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Người dùng
            </button>
          </div>

          {/* Search */}
          <div className="border-b p-3">
            <label className="flex h-9 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground focus-within:ring-1 focus-within:ring-primary">
              <Search className="size-3.5 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === "conversations" ? "Tìm cuộc trò chuyện..." : "Tìm người dùng..."}
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </label>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "conversations" ? (
              isLoadingConversations ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Đang tải...
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <MessageSquareDot className="size-8 opacity-30" />
                  Không tìm thấy cuộc trò chuyện
                </div>
              ) : (
                filtered.map((conv) => {
                  const otherParticipant = getOtherParticipant(conv);
                  const title = getConversationTitle(conv);
                  const subtitle = getConversationSubtitle(conv);
                  const avatarInitials = otherParticipant
                    ? getInitials(otherParticipant.firstName, otherParticipant.lastName)
                    : conv.type === "GROUP"
                      ? conv.participants.length.toString()
                      : "CL";
                  const avatarBg = otherParticipant
                    ? getAvatarBg(otherParticipant.role)
                    : "bg-gray-500";

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => openConversation(conv.id)}
                      className={cn(
                        "flex w-full items-start gap-3 border-b px-3 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted/40",
                        activeId === conv.id && "bg-primary/5 hover:bg-primary/5",
                      )}
                    >
                      <Avatar initials={avatarInitials} bgClass={avatarBg} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-sm font-semibold">
                            {title}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-xs text-muted-foreground">
                            {subtitle}
                          </span>
                          {conv.unreadCount > 0 && (
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {otherParticipant && (
                          <span
                            className={cn(
                              "mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              getRoleColor(otherParticipant.role),
                            )}
                          >
                            {getRoleLabel(otherParticipant.role)}
                          </span>
                        )}
                        {conv.lastMessage && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              isLoadingUsers ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Đang tải...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <Users className="size-8 opacity-30" />
                  Không tìm thấy người dùng
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleStartConversation(user.id)}
                    className="flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/40"
                  >
                    <Avatar
                      initials={getInitials(user.firstName, user.lastName)}
                      bgClass={getAvatarBg(user.role)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">
                          {`${user.lastName ?? ""} ${user.firstName ?? ""}`.trim()}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            getRoleColor(user.role),
                          )}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      {user.hasConversation && (
                        <span className="text-xs text-muted-foreground">
                          Đã có tin nhắn
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )
            )}
          </div>
        </div>

        {/* ── Right: conversation view ── */}
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquareDot className="size-12 opacity-20" />
            <p className="text-sm">Chọn cuộc trò chuyện để bắt đầu</p>
          </div>
        ) : (
          <div className="flex flex-1 min-w-0 flex-col">
            {/* Conversation header */}
            <div className="flex items-center gap-3 border-b px-5 py-3.5">
              {(() => {
                const otherParticipant = getOtherParticipant(active);
                const title = getConversationTitle(active);
                const subtitle = getConversationSubtitle(active);
                const avatarInitials = otherParticipant
                  ? getInitials(otherParticipant.firstName, otherParticipant.lastName)
                  : active.type === "GROUP"
                    ? active.participants.length.toString()
                    : "CL";
                const avatarBg = otherParticipant
                  ? getAvatarBg(otherParticipant.role)
                  : "bg-gray-500";
                const otherUserId = otherParticipant?.userId;

                return (
                  <>
                    <Avatar initials={avatarInitials} bgClass={avatarBg} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{title}</span>
                        {otherParticipant && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              getRoleColor(otherParticipant.role),
                            )}
                          >
                            {getRoleLabel(otherParticipant.role)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    {otherUserId && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex size-2 rounded-full",
                            isOnline(otherUserId) ? "bg-emerald-500" : "bg-gray-400",
                          )}
                        />
                        <span className="text-xs text-muted-foreground">
                          {isOnline(otherUserId) ? "Đang hoạt động" : "Offine"}
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isCurrentUser = msg.senderId === currentUser?.id;
                    const senderParticipant = active.participants.find(
                      (p) => p.userId === msg.senderId,
                    );
                    const showAvatar =
                      idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-end gap-2",
                          isCurrentUser && "flex-row-reverse",
                        )}
                      >
                        <div className="size-8 shrink-0">
                          {showAvatar &&
                            (senderParticipant ? (
                              <Avatar
                                initials={getInitials(
                                  senderParticipant.firstName,
                                  senderParticipant.lastName,
                                )}
                                bgClass={getAvatarBg(senderParticipant.role)}
                                size="sm"
                              />
                            ) : (
                              <span className="flex size-8 items-center justify-center rounded-full bg-gray-500 text-xs font-bold text-white">
                                ??
                              </span>
                            ))}
                        </div>

                        <div
                          className={cn(
                            "flex max-w-[65%] flex-col gap-0.5",
                            isCurrentUser && "items-end",
                          )}
                        >
                          {showAvatar && (
                            <span className="px-1 text-xs text-muted-foreground">
                              {isCurrentUser
                                ? "Bạn"
                                : senderParticipant
                                  ? `${senderParticipant.lastName ?? ""} ${senderParticipant.firstName ?? ""}`.trim()
                                  : "Unknown"}
                            </span>
                          )}
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                              isCurrentUser
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm bg-muted text-foreground",
                            )}
                          >
                            {msg.content}
                          </div>
                          <span className="px-1 text-[11px] text-muted-foreground">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t px-4 py-3">
              <div className="flex items-end gap-2 rounded-xl border bg-muted/30 px-3 py-2">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  style={{ maxHeight: "120px", overflowY: "auto" }}
                />
                <div className="flex shrink-0 items-center gap-1 pb-0.5">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Đính kèm"
                  >
                    <Paperclip className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!draft.trim()}
                    className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                    aria-label="Gửi"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
              {activeId && typingUsers.has(activeId) && (
                <p className="mt-1.5 text-center text-[11px] text-primary">
                  Đang nhập...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <UsageGuides steps={USAGE_GUIDE_STEPS} />
    </div>
  );
};

export const DiscussionsPage = () => {
  if (CHAT_AVAILABLE) return <ChatDiscussionsPage />;
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card py-16 text-center">
      <MessageSquareDot className="size-8 text-muted-foreground/50" />
      <p className="text-sm font-medium">Tính năng thảo luận tạm thời chưa khả dụng.</p>
      <p className="text-xs text-muted-foreground">Vui lòng quay lại sau.</p>
    </div>
  );
};
