"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck, Send } from "lucide-react";

type UserMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  status?: string;
  createdAt: string;
  sender: { id: string; name: string; email: string };
  recipient: { id: string; name: string; email: string };
};

export default function UserMessagesPanel({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch("/api/user/messages");
    if (!res.ok) {
      toast.error("Failed to load messages");
      return;
    }
    setMessages(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchMessages();
      if (cancelled) return;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMessages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const res = await fetch("/api/user/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = (await res.json().catch(() => null)) as
      | { error?: string }
      | null;
    setSending(false);
    setDraft("");
    await fetchMessages();
    if (!res.ok) {
      toast.error(data?.error ?? "Failed to send reply");
      return;
    }
    toast.success("Reply sent to the security team");
  };

  const threadAdmin =
    [...messages].reverse().find((m) => m.recipientId === userId)?.sender ??
    null;

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Messages
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Chat with the SECURE LOGIN security team. Replies go straight to your
          admin.
        </p>
      </div>

      <div className="mt-6 flex h-[calc(100dvh-16rem)] min-h-[420px] flex-col overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-300/70 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {(threadAdmin?.name ?? threadAdmin?.email ?? "S").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
              {threadAdmin?.name ?? "SECURE LOGIN security team"}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {threadAdmin?.email ?? "Admin support"}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-[#efeae2] p-4 dark:bg-neutral-900">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </p>
          ) : messages.length === 0 ? (
            <p className="rounded-lg bg-white/70 px-4 py-3 text-center text-sm text-slate-500 shadow-sm dark:bg-neutral-800/70 dark:text-slate-400">
              No messages yet. When the security team contacts you about your
              account, you can reply here.
            </p>
          ) : (
            messages.map((m) => {
              const fromAdmin = m.recipientId === userId;
              return (
                <div
                  key={m.id}
                  className={`flex ${fromAdmin ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-lg px-3 py-2 shadow-sm ${
                      fromAdmin
                        ? "rounded-tl-none bg-white dark:bg-neutral-800"
                        : "rounded-tr-none bg-[#d9fdd3] dark:bg-[#005c4b]"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {m.subject}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-100">
                      {m.body}
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        {new Date(m.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!fromAdmin &&
                        (m.status === "failed" ? (
                          <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                            Not delivered
                          </span>
                        ) : (
                          <MailCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={threadEndRef} />
        </div>

        <div className="flex shrink-0 items-end gap-2 border-t border-slate-300/70 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            placeholder="Type a reply…"
            className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            aria-label="Send reply"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}