import { FileIcon, Download } from "lucide-react"
import type { ChatAttachmentDto } from "@/lib/chat-attachments"

export function ChatMessageAttachments(props: {
  attachments: ChatAttachmentDto[]
  invert?: boolean
}) {
  if (props.attachments.length === 0) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      {props.attachments.map((a) => {
        const isImage = a.mimeType.startsWith("image/")
        if (isImage) {
          return (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-md border border-border/60 max-w-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.fileName}
                className="max-h-64 w-auto object-contain bg-surface"
                loading="lazy"
              />
            </a>
          )
        }

        return (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className={
              props.invert
                ? "inline-flex max-w-xs items-center gap-2 rounded-md border border-surface/30 bg-surface/10 px-3 py-2 text-xs text-surface hover:bg-surface/20"
                : "inline-flex max-w-xs items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-fg hover:bg-surface"
            }
          >
            <FileIcon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.5} />
            <span className="truncate">{a.fileName}</span>
            <Download className="h-3.5 w-3.5 shrink-0 opacity-60" strokeWidth={1.5} />
          </a>
        )
      })}
    </div>
  )
}
