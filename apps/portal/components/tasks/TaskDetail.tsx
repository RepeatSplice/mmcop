"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Textarea } from "@/components/ui/Input"
import { ActivityFeed } from "@/components/realtime/ActivityFeed"

type Member = {
  id: string
  name: string | null
  email: string | null
  role: string
}

type Comment = {
  id: string
  authorId: string | null
  authorName: string
  body: string
  createdAt: string
}

type Task = {
  id: string
  key: string
  title: string
  description: string | null
  status: string
  discipline: string
  priority: number
  sprint: { id: string; name: string; status: string } | null
  assignee: { id: string; name: string | null; email: string | null } | null
  createdBy: { id: string; name: string | null; email: string | null }
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

function isoToDateValue(iso: string | null) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  } catch {
    return ""
  }
}

function dateValueToIso(value: string) {
  if (!value) return null
  const d = new Date(`${value}T00:00:00.000Z`)
  return d.toISOString()
}

export function TaskDetail(props: {
  canEdit: boolean
  workspaceId: string
  workspaceSlug: string
  task: Task
  members: Member[]
  comments: Comment[]
}) {
  const [tab, setTab] = useState<"comments" | "history">("comments")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(props.task.title)
  const [description, setDescription] = useState(props.task.description ?? "")
  const [status, setStatus] = useState(props.task.status)
  const [assigneeId, setAssigneeId] = useState(props.task.assignee?.id ?? "")
  const [dueDate, setDueDate] = useState(isoToDateValue(props.task.dueDate))
  const [comments, setComments] = useState<Comment[]>(props.comments)
  const [newComment, setNewComment] = useState("")

  const assigneeLabel = useMemo(() => {
    if (!assigneeId) return "Unassigned"
    const m = props.members.find((x) => x.id === assigneeId)
    return m?.name || m?.email || "Member"
  }, [assigneeId, props.members])

  async function patch(payload: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${props.task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: props.workspaceId, ...payload }),
      })
      if (!res.ok) throw new Error(await res.text())
    } catch (e: any) {
      setError(e?.message || "Failed to save")
      throw e
    } finally {
      setSaving(false)
    }
  }

  async function saveMain() {
    if (!props.canEdit) return
    await patch({
      title,
      description: description.trim() ? description : null,
    })
  }

  async function onStatusChange(next: string) {
    setStatus(next)
    if (!props.canEdit) return
    await patch({ status: next })
  }

  async function onAssigneeChange(next: string) {
    setAssigneeId(next)
    if (!props.canEdit) return
    await patch({ assigneeId: next ? next : null })
  }

  async function onDueDateChange(next: string) {
    setDueDate(next)
    if (!props.canEdit) return
    await patch({ dueDate: next ? dateValueToIso(next) : null })
  }

  async function postComment() {
    if (!props.canEdit) return
    const body = newComment.trim()
    if (!body) return

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/tasks/${props.task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { comment: Comment }
      setComments((prev) => [...prev, data.comment])
      setNewComment("")
    } catch (e: any) {
      setError(e?.message || "Failed to post comment")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-6">
        <div className="border border-border bg-surface-1 p-6">
          <p className="text-xs text-fg-muted">
            {props.task.key} • {status} • {props.task.discipline}
          </p>
          <input
            className="mt-2 w-full bg-transparent text-2xl font-display uppercase tracking-wide text-fg focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!props.canEdit}
            aria-label="Title"
          />

          <div className="mt-4">
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!props.canEdit}
              placeholder="Add a description…"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            <Button type="button" onClick={saveMain} isLoading={saving} disabled={!props.canEdit}>
              Save
            </Button>
          </div>
        </div>

        <div className="border border-border bg-surface-1">
          <div className="px-4 pt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("comments")}
              className={
                tab === "comments"
                  ? "text-sm text-fg border-b-2 border-monarch-500 pb-2"
                  : "text-sm text-fg-muted hover:text-fg pb-2"
              }
            >
              Comments
            </button>
            <button
              type="button"
              onClick={() => setTab("history")}
              className={
                tab === "history"
                  ? "text-sm text-fg border-b-2 border-monarch-500 pb-2"
                  : "text-sm text-fg-muted hover:text-fg pb-2"
              }
            >
              History
            </button>
          </div>

          <div className="p-6">
            {tab === "comments" ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-fg-muted">No comments yet.</p>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="border border-border bg-surface p-3">
                        <p className="text-[10px] font-display uppercase tracking-widest text-fg-subtle">
                          {c.authorName} • {new Date(c.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-fg-muted whitespace-pre-wrap">{c.body}</p>
                      </div>
                    ))
                  )}
                </div>

                {props.canEdit ? (
                  <div className="space-y-3">
                    <Textarea
                      label="Add comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write an update…"
                    />
                    <Button
                      type="button"
                      onClick={postComment}
                      isLoading={saving}
                      disabled={!newComment.trim()}
                    >
                      Post
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : (
              <ActivityFeed workspaceId={props.workspaceId} taskId={props.task.id} />
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="border border-border bg-surface-1 p-4">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">Details</p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fg-muted">Status</p>
              <select
                className="bg-surface border border-border px-2 py-1 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                disabled={!props.canEdit}
              >
                {["BACKLOG", "PLANNED", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fg-muted">Assignee</p>
              <select
                className="bg-surface border border-border px-2 py-1 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
                value={assigneeId}
                onChange={(e) => onAssigneeChange(e.target.value)}
                disabled={!props.canEdit}
                aria-label="Assignee"
              >
                <option value="">{assigneeLabel}</option>
                <option value="">Unassigned</option>
                {props.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email || m.id} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fg-muted">Due date</p>
              <input
                type="date"
                className="bg-surface border border-border px-2 py-1 text-sm text-fg focus:outline-none focus:border-monarch-500 transition-colors"
                value={dueDate}
                onChange={(e) => onDueDateChange(e.target.value)}
                disabled={!props.canEdit}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fg-muted">Sprint</p>
              <p className="text-sm text-fg text-right">
                {props.task.sprint ? props.task.sprint.name : <span className="text-fg-subtle">None</span>}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-fg-muted">Priority</p>
              <p className="text-sm text-fg">{props.task.priority}</p>
            </div>
          </div>
        </div>

        <div className="border border-border bg-surface-1 p-4">
          <p className="font-display text-[11px] uppercase tracking-[0.2em] text-fg-subtle">Meta</p>
          <div className="mt-3 space-y-2 text-xs text-fg-muted">
            <p>
              Reporter:{" "}
              <span className="text-fg">{props.task.createdBy.name || props.task.createdBy.email || "User"}</span>
            </p>
            <p>
              Created: <span className="text-fg">{new Date(props.task.createdAt).toLocaleString()}</span>
            </p>
            <p>
              Updated: <span className="text-fg">{new Date(props.task.updatedAt).toLocaleString()}</span>
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

