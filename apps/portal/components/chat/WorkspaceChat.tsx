"use client"

import Link from "next/link"
import { signIn } from "next-auth/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, BellOff, Loader2, MessageSquare, Paperclip, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatAttachmentDto } from "@/lib/chat-attachments"
import { PageShell } from "@/components/layout/PageShell"
import { ChatMessageAttachments } from "@/components/chat/ChatMessageAttachments"
import { ChatAiSummary } from "@/components/chat/ChatAiSummary"
import { MentionAutocomplete, useMentionState, type MentionMember } from "@/components/chat/MentionAutocomplete"

export type ChatMessageDto = {
  id: string
  body: string
  authorUserId: string | null
  authorDiscordId: string | null
  authorDisplayName: string
  source: "PORTAL" | "DISCORD"
  createdAt: string
  attachments: ChatAttachmentDto[]
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function WorkspaceChat(props: {
  workspaceId: string
  workspaceSlug: string
  viewerUserId: string
  canPost: boolean
  discordProvisioned: boolean
  hasDiscordLinked: boolean
  initialMessages: ChatMessageDto[]
  initialHasMore?: boolean
  members?: MentionMember[]
}) {
  const [messages, setMessages] = useState<ChatMessageDto[]>(props.initialMessages)
  const [hasMore, setHasMore] = useState(props.initialHasMore ?? false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [draft, setDraft] = useState("")
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [chatNotifyMode, setChatNotifyMode] = useState<"MENTIONS" | "ALL" | null>(null)
  const mention = useMentionState(props.members ?? [])

  useEffect(() => {
    void fetch(`/api/workspaces/${props.workspaceId}/chat/read`, { method: "POST" })
    void fetch("/api/notifications/by-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "chat", workspaceId: props.workspaceId }),
    }).catch(() => {})
    void fetch("/api/me/notification-prefs")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.notifyChatMode) setChatNotifyMode(j.notifyChatMode as "MENTIONS" | "ALL")
      })
      .catch(() => {})
  }, [props.workspaceId])

  async function toggleChatNotifyMode() {
    const next: "MENTIONS" | "ALL" = chatNotifyMode === "ALL" ? "MENTIONS" : "ALL"
    setChatNotifyMode(next)
    try {
      await fetch("/api/me/notification-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyChatMode: next }),
      })
    } catch {
      /* revert silently on failure */
    }
  }
  const shouldStickToBottomRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (shouldStickToBottomRef.current) scrollToBottom()
  }, [messages.length, scrollToBottom])

  async function loadOlder() {
    if (!hasMore || loadingMore || messages.length === 0) return
    const oldest = messages[0]
    if (!oldest) return

    setLoadingMore(true)
    const list = listRef.current
    const prevHeight = list?.scrollHeight ?? 0

    try {
      const url = `/api/workspaces/${props.workspaceId}/chat/messages?cursor=${encodeURIComponent(oldest.createdAt)}&limit=50`
      const res = await fetch(url)
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as {
        messages: ChatMessageDto[]
        nextCursor: string | null
      }
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id))
        const older = data.messages.filter((m) => !ids.has(m.id))
        return [...older, ...prev]
      })
      setHasMore(Boolean(data.nextCursor))
      requestAnimationFrame(() => {
        if (list) list.scrollTop = list.scrollHeight - prevHeight
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load older messages")
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    if (!props.discordProvisioned) return

    const url = `/api/realtime/chat?workspaceId=${encodeURIComponent(props.workspaceId)}`
    const es = new EventSource(url)

    es.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data) as ChatMessageDto
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          shouldStickToBottomRef.current = true
          return [...prev, msg]
        })
      } catch {
        /* ignore */
      }
    })

    return () => es.close()
  }, [props.workspaceId, props.discordProvisioned])

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    setPendingFiles((prev) => {
      const next = [...prev, ...Array.from(fileList)]
      return next.slice(0, 5)
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function send() {
    const body = draft.trim()
    if ((!body && pendingFiles.length === 0) || !props.canPost) return

    setSending(true)
    setError(null)
    try {
      const form = new FormData()
      if (body) form.set("body", body)
      for (const f of pendingFiles) form.append("files", f)

      const res = await fetch(`/api/workspaces/${props.workspaceId}/chat/messages`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { message: ChatMessageDto }
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message.id)) return prev
        return [...prev, data.message]
      })
      setDraft("")
      setPendingFiles([])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  if (!props.discordProvisioned) {
    return (
      <PageShell>
        <div className="px-5 py-16 text-center bg-surface-1">
          <MessageSquare className="mx-auto h-10 w-10 text-fg-subtle/40" strokeWidth={1.25} />
          <p className="mt-4 text-sm font-medium text-fg">Discord not connected</p>
          <p className="mt-1 text-xs text-fg-muted max-w-md mx-auto">
            This workspace does not have Discord channels yet. An admin can provision them from
            settings.
          </p>
          <Link
            href={`/workspace/${props.workspaceSlug}/settings/integrations`}
            className="mt-6 inline-flex h-9 items-center rounded-md border border-border px-4 text-[11px] font-medium text-fg hover:bg-surface-2"
          >
            Integrations
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="flex flex-col h-[min(70vh,calc(100vh-220px))] bg-surface-1">
        <div className="px-5 py-4 border-b border-border flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-sm font-medium text-fg">Chat</h1>
            <p className="text-xs text-fg-muted">
              Synced with your workspace Discord #chat — text, images, and files
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void toggleChatNotifyMode()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-fg-muted hover:text-fg hover:bg-surface-2"
              title={
                chatNotifyMode === "ALL"
                  ? "Notifying for every message — click to switch to mentions only"
                  : "Notifying for @mentions only — click to switch to all messages"
              }
            >
              {chatNotifyMode === "ALL" ? (
                <Bell className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <BellOff className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
              {chatNotifyMode === "ALL" ? "All messages" : "Mentions only"}
            </button>
            {!props.hasDiscordLinked ? (
              <button
                type="button"
                onClick={() => void signIn("discord")}
                className="text-[11px] text-fg-muted hover:text-fg underline"
              >
                Connect Discord for channel access
              </button>
            ) : null}
          </div>
        </div>

        <div className="px-5 pt-3">
          <ChatAiSummary workspaceId={props.workspaceId} />
        </div>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          onScroll={() => {
            const el = listRef.current
            if (!el) return
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
            shouldStickToBottomRef.current = nearBottom
          }}
        >
          {hasMore ? (
            <div className="flex justify-center pb-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadOlder()}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-[11px] font-display uppercase tracking-widest text-fg-muted hover:bg-surface-2 hover:text-fg disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Load older messages
              </button>
            </div>
          ) : null}
          {messages.length === 0 ? (
            <p className="text-sm text-fg-muted text-center py-12">No messages yet. Say hello.</p>
          ) : (
            messages.map((m) => {
              const isSelf = m.authorUserId === props.viewerUserId
              const hasBody = Boolean(m.body?.trim())
              return (
                <div
                  key={m.id}
                  className={cn("flex flex-col max-w-[85%]", isSelf ? "ml-auto items-end" : "items-start")}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-fg">{m.authorDisplayName}</span>
                    {m.source === "DISCORD" ? (
                      <span className="text-[10px] text-fg-subtle">Discord</span>
                    ) : null}
                    <span className="text-[10px] text-fg-subtle tabular-nums">
                      {formatTime(m.createdAt)}
                    </span>
                  </div>
                  {(hasBody || m.attachments.length === 0) && (
                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap break-words",
                        isSelf
                          ? "border-fg/30 bg-fg text-surface"
                          : "border-border bg-surface"
                      )}
                    >
                      {hasBody ? m.body : null}
                    </div>
                  )}
                  <ChatMessageAttachments attachments={m.attachments} invert={isSelf} />
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {props.canPost ? (
          <div className="border-t border-border px-5 py-4">
            {pendingFiles.length > 0 ? (
              <ul className="mb-3 flex flex-wrap gap-2">
                {pendingFiles.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 text-[11px] text-fg-muted"
                  >
                    <span className="max-w-[140px] truncate">{f.name}</span>
                    <span className="text-fg-subtle">{formatFileSize(f.size)}</span>
                    <button
                      type="button"
                      onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                      className="text-fg-subtle hover:text-fg"
                      aria-label="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || pendingFiles.length >= 5}
                className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-fg-muted hover:text-fg hover:bg-surface-2 disabled:opacity-50"
                aria-label="Attach files"
              >
                <Paperclip className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    mention.handleTextChange(e.target.value, e.target.selectionStart ?? e.target.value.length)
                  }}
                  onKeyDown={(e) => {
                    if (mention.isOpen) {
                      if (mention.onKeyDown(e)) return
                    }
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  onSelect={(e) => {
                    const el = e.currentTarget
                    mention.handleTextChange(el.value, el.selectionStart ?? el.value.length)
                  }}
                  placeholder="Message the team…"
                  rows={2}
                  className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-fg/25"
                />
                <MentionAutocomplete
                  state={mention}
                  onSelect={(label) => {
                    const { newValue, caret } = mention.applySelection(label, draft)
                    setDraft(newValue)
                    requestAnimationFrame(() => {
                      const ta = textareaRef.current
                      if (ta) {
                        ta.focus()
                        ta.setSelectionRange(caret, caret)
                      }
                    })
                  }}
                />
              </div>
              <button
                type="button"
                disabled={sending || (draft.trim().length === 0 && pendingFiles.length === 0)}
                onClick={() => void send()}
                className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-md border border-fg bg-fg text-surface disabled:opacity-50"
                aria-label="Send"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-fg-subtle">Up to 5 files, 25 MB each. Images show inline.</p>
            {error ? <p className="mt-2 text-[11px] text-red-600 dark:text-red-400">{error}</p> : null}
          </div>
        ) : (
          <p className="px-5 py-3 text-xs text-fg-muted border-t border-border">
            View-only members cannot post messages.
          </p>
        )}
      </div>
    </PageShell>
  )
}
