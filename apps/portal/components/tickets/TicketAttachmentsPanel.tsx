"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { TicketAttachment } from "@/components/tickets/ticket-detail-types"

export function TicketAttachmentsPanel(props: {
  ticketId: string
  canEdit: boolean
  attachments: TicketAttachment[]
  onUploaded: (items: TicketAttachment[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadFiles(files: FileList | null) {
    if (!props.canEdit || !files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      for (const f of Array.from(files)) fd.append("files", f)
      const res = await fetch(`/api/tickets/${props.ticketId}/attachments`, {
        method: "POST",
        body: fd,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as { attachments: TicketAttachment[] }
      props.onUploaded(data.attachments)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <section className="border border-border bg-surface-1 rounded-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-fg">Attachments</h3>
        <span className="text-xs text-fg-muted">{props.attachments.length}</span>
      </div>

      {props.canEdit ? (
        <div
          className={cn(
            "mt-3 rounded-md border border-dashed px-4 py-6 text-center transition-colors",
            dragOver ? "border-monarch-500 bg-surface-2" : "border-border bg-surface/50"
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            void uploadFiles(e.dataTransfer.files)
          }}
        >
          <p className="text-sm text-fg-muted">Drop files here or</p>
          <button
            type="button"
            className="mt-1 text-sm text-fg underline underline-offset-2"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => void uploadFiles(e.currentTarget.files)}
          />
          {uploading ? <p className="mt-2 text-xs text-fg-subtle">Uploading…</p> : null}
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {props.attachments.length === 0 ? (
          <p className="text-sm text-fg-muted">No attachments yet.</p>
        ) : (
          props.attachments.map((a) => {
            const isImage = a.mimeType.startsWith("image/")
            return (
              <div key={a.id} className="rounded-md border border-border bg-surface p-3">
                <a
                  href={a.url}
                  className="text-sm text-fg hover:underline break-all"
                  target="_blank"
                  rel="noreferrer"
                >
                  {a.fileName}
                </a>
                <p className="mt-1 text-[10px] text-fg-muted">
                  {a.mimeType} · {Math.round(a.byteSize / 1024)} KB ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </p>
                {isImage ? (
                  <a href={a.url} target="_blank" rel="noreferrer" className="mt-2 block">
                    <img
                      src={a.url}
                      alt={a.fileName}
                      className="w-full max-h-40 object-cover rounded border border-border"
                    />
                  </a>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
