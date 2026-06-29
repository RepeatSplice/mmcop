"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import {
  mergeTicketActivity,
  type TicketActivityItem,
} from "@/lib/ticket-activity"
import type { TicketActivityEvent, TicketComment } from "@/components/tickets/ticket-detail-types"
import {
  MentionAutocomplete,
  useMentionState,
  type MentionMember,
} from "@/components/chat/MentionAutocomplete"

type Tab = "all" | "comments" | "history"

function ActivityRow(props: { item: TicketActivityItem }) {
  const isComment = props.item.kind === "comment"
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5",
        isComment ? "border-border bg-surface" : "border-transparent bg-surface-2/50"
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
        {props.item.authorName || "System"} · {new Date(props.item.createdAt).toLocaleString()}
        {isComment ? " · Comment" : " · Change"}
      </p>
      <p className="mt-1 text-sm text-fg whitespace-pre-wrap">{props.item.text}</p>
    </div>
  )
}

export function TicketActivityPanel(props: {
  workspaceId: string
  ticketId: string
  canEdit: boolean
  initialComments: TicketComment[]
  initialEvents: TicketActivityEvent[]
  members?: MentionMember[]
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mention = useMentionState(props.members ?? [])
  const [tab, setTab] = useState<Tab>("all")
  const [comments, setComments] = useState<TicketComment[]>(props.initialComments)
  const [liveEvents, setLiveEvents] = useState<TicketActivityEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialEventIdsRef = useRef(new Set<string>())

  useEffect(() => {
    initialEventIdsRef.current = new Set(props.initialEvents.map((e) => e.id))
    setLiveEvents((prev) => prev.filter((e) => !initialEventIdsRef.current.has(e.id)))
  }, [props.initialEvents])

  const seedEvents = useMemo(() => {
    const seen = new Set<string>()
    const merged: TicketActivityEvent[] = []
    for (const e of [...props.initialEvents, ...liveEvents]) {
      if (seen.has(e.id)) continue
      seen.add(e.id)
      merged.push(e)
    }
    return merged
  }, [props.initialEvents, liveEvents])

  const timeline = useMemo(
    () =>
      mergeTicketActivity(
        comments.map((c) => ({
          id: c.id,
          authorName: c.authorName,
          body: c.body,
          createdAt: c.createdAt,
        })),
        seedEvents.map((e) => ({
          id: e.id,
          type: e.type,
          body: e.body,
          createdAt: e.createdAt,
          actorName: e.actorName,
        }))
      ),
    [comments, seedEvents]
  )

  const filtered = useMemo(() => {
    if (tab === "comments") return timeline.filter((i) => i.kind === "comment")
    if (tab === "history") return timeline.filter((i) => i.kind === "history")
    return timeline
  }, [tab, timeline])

  const sseUrl = useMemo(() => {
    const sp = new URLSearchParams({ workspaceId: props.workspaceId, ticketId: props.ticketId })
    return `/api/realtime/activity?${sp.toString()}`
  }, [props.workspaceId, props.ticketId])

  useEffect(() => {
    const es = new EventSource(sseUrl)
    setConnected(false)
    es.addEventListener("open", () => setConnected(true))
    es.addEventListener("error", () => setConnected(false))
    es.addEventListener("activity", (msg) => {
      try {
        const data = JSON.parse((msg as MessageEvent).data) as {
          id: string
          type: string
          body: string
          createdAt: string
        }
        if (data.type === "ticket.comment") return
        setLiveEvents((prev) => {
          if (prev.some((e) => e.id === data.id)) return prev
          if (initialEventIdsRef.current.has(data.id)) return prev
          return [
            ...prev,
            {
              id: data.id,
              type: data.type,
              body: data.body,
              createdAt: data.createdAt,
              actorName: null,
            },
          ].slice(-100)
        })
      } catch {
        // ignore
      }
    })
    return () => es.close()
  }, [sseUrl, props.initialEvents])

  async function postComment() {
    const body = newComment.trim()
    if (!body) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/tickets/${props.ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { comment: TicketComment }
      setComments((prev) => [...prev, data.comment])
      setNewComment("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to post")
    } finally {
      setBusy(false)
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "comments", label: "Comments" },
    { id: "history", label: "History" },
  ]

  return (
    <div className="border border-border bg-surface-1 rounded-lg overflow-hidden">
      <div className="px-4 pt-4 flex items-center justify-between gap-3 border-b border-border">
        <div className="flex items-center gap-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "text-sm pb-3 -mb-px border-b-2 transition-colors",
                tab === t.id
                  ? "text-fg border-monarch-500"
                  : "text-fg-muted border-transparent hover:text-fg"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-fg-subtle pb-3">{connected ? "Live" : "…"}</span>
      </div>

      <div className="p-4 space-y-3 min-h-[120px]">
        {filtered.length === 0 ? (
          <p className="text-sm text-fg-muted">No activity yet.</p>
        ) : (
          filtered.map((item) => <ActivityRow key={item.id} item={item} />)
        )}
      </div>

      {props.canEdit ? (
        <div className="px-4 pb-4 space-y-2 border-t border-border pt-4">
          <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-fg-subtle">
            Add a comment
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value)
                mention.handleTextChange(
                  e.target.value,
                  e.target.selectionStart ?? e.target.value.length
                )
              }}
              onSelect={(e) => {
                const el = e.currentTarget
                mention.handleTextChange(el.value, el.selectionStart ?? el.value.length)
              }}
              onKeyDown={(e) => {
                if (mention.isOpen && mention.onKeyDown(e)) return
                if ((e.key === "Enter" && (e.metaKey || e.ctrlKey)) && newComment.trim()) {
                  e.preventDefault()
                  void postComment()
                }
              }}
              placeholder="Write an update…  Use @ to mention a teammate."
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-fg/25"
            />
            <MentionAutocomplete
              state={mention}
              onSelect={(label) => {
                const { newValue, caret } = mention.applySelection(label, newComment)
                setNewComment(newValue)
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
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <Button
            type="button"
            size="sm"
            onClick={() => void postComment()}
            isLoading={busy}
            disabled={!newComment.trim()}
          >
            Post
          </Button>
        </div>
      ) : null}
    </div>
  )
}
