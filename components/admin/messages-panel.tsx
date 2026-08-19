"use client";

import { authClient } from "@/lib/auth-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  MailCheck,
  MessageSquare,
  Search,
  Send,
  UserRound,
} from "lucide-react";

type ChatUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  createdAt: string;
};

type ChatMessage = {
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

const DEFAULT_SUBJECT = "";
const DEFAULT_BODY = "";

export default function MessagesPanel({
  initialUserId,
}: {
  initialUserId?: string;
}) {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialUserId ?? null);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = authClient.useSession();
  const myId = session?.user?.id;

  const fetchUsers = useCallback(async () => {
    const { data, error } = await authClient.admin.listUsers({
      query: { limit: 200, sortBy: "createdAt", sortDirection: "desc" },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setUsers((data?.users as unknown as ChatUser[]) ?? []);
  }, []);

  const fetchMessages = useCallback(async () => {
    const res = await fetch("/api/admin/messages");
    if (!res.ok) {
      toast.error("Failed to load messages");
      return;
    }
    setMessages(await res.json());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([fetchUsers(), fetchMessages()]);
      if (cancelled) return;
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUsers, fetchMessages]);

  useEffect(() => {
    if (!initialUserId) return;
    const known = users.some((u) => u.id === initialUserId);
    if (known) return;
    authClient.admin
      .getUser({ query: { id: initialUserId } })
      .then(({ data, error }) => {
        if (error) return;
        const fresh = data as unknown as ChatUser;
        setUsers((prev) =>
          prev.some((u) => u.id === fresh.id) ? prev : [fresh, ...prev],
        );
      });
  }, [initialUserId, users]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, messages]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;

  const thread = useMemo(
    () =>
      messages
        .filter(
          (m) => m.recipientId === selectedId || m.senderId === selectedId,
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, selectedId],
  );

  const countFor = (userId: string) =>
    messages.filter(
      (m) => m.recipientId === userId || m.senderId === userId,
    ).length;

  const handleSend = async () => {
    if (!selectedId) return;
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }
    setSending(true);
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: selectedId,
        subject: subject.trim(),
        message: body.trim(),
      }),
    });
    const data = (await res.json().catch(() => null)) as
      | { error?: string }
      | null;
    setSending(false);
    setSubject(DEFAULT_SUBJECT);
    setBody(DEFAULT_BODY);
    await fetchMessages();
    if (!res.ok) {
      toast.error(data?.error ?? "Failed to send message");
      return;
    }
    toast.success("Message sent to their inbox");
  };

  return (
    <div className="flex h-[calc(100dvh-7rem)] min-h-[520px] flex-col">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
          Messages
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Send security notices to users. Emails are delivered straight to
          their inbox via Brevo.
        </p>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white sm:flex-row dark:border-neutral-700 dark:bg-neutral-900">
        <aside className="flex max-h-[45vh] w-full flex-col border-b border-slate-300 sm:max-h-none sm:w-72 sm:shrink-0 sm:border-b-0 sm:border-r dark:border-neutral-700">
          <div className="shrink-0 border-b border-slate-300 p-3 dark:border-neutral-700">
            <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 dark:border-neutral-700">
              <Search className="size-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search users…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent py-2 text-sm outline-none dark:text-slate-50"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="size-4 animate-spin" />
                Loading…
              </p>
            ) : filteredUsers.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                No users found.
              </p>
            ) : (
              filteredUsers.map((u) => {
                const active = u.id === selectedId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(u.id);
                      setSubject(DEFAULT_SUBJECT);
                      setBody(DEFAULT_BODY);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active
                        ? "bg-blue-50 dark:bg-neutral-800"
                        : "hover:bg-slate-50 dark:hover:bg-neutral-800/60"
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                        {u.name ?? u.email}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {u.email}
                      </p>
                    </div>
                    {countFor(u.id) > 0 && (
                      <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {countFor(u.id)}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-[#efeae2] dark:bg-neutral-900">
          {selectedUser ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-slate-300/70 bg-white px-4 py-2.5 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {(selectedUser.name ?? selectedUser.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {selectedUser.name ?? selectedUser.email}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {selectedUser.email}
                  </p>
                </div>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Emails go to their inbox
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4">
                {thread.map((m) => {
                  const fromAdmin = m.senderId === myId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-lg px-3 py-2 shadow-sm ${
                          fromAdmin
                            ? m.status === "failed"
                              ? "rounded-tr-none bg-red-50 dark:bg-red-950"
                              : "rounded-tr-none bg-[#d9fdd3] dark:bg-[#005c4b]"
                            : "rounded-tl-none bg-white dark:bg-neutral-800"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
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
                          {fromAdmin &&
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
                })}
                <div ref={threadEndRef} />
              </div>

              <div className="flex shrink-0 items-end gap-2 border-t border-slate-300/70 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-50"
                  />
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={2}
                    placeholder="Type a security notice…"
                    className="w-full resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !selectedId}
                  aria-label="Send email"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Send className="size-5" />
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm dark:bg-neutral-800">
                <MessageSquare className="size-7" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  Select a user to start a conversation
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Pick a user from the list to review their account and send a
                  security notice.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500">
                <UserRound className="size-4" />
                Emails are delivered via Brevo to the user&apos;s inbox
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

