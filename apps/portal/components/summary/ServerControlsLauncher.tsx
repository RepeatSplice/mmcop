"use client"

import { useState } from "react"
import { Settings2 } from "lucide-react"
import { ServerControlsModal } from "@/components/summary/ServerControlsModal"

export function ServerControlsLauncher(props: {
  workspaceId: string
  initial: { online: boolean; playerCount: number; maxPlayers: number } | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] text-fg-muted hover:text-fg hover:bg-surface-2"
      >
        <Settings2 className="h-3 w-3" strokeWidth={1.75} />
        Manage
      </button>
      <ServerControlsModal
        open={open}
        onClose={() => setOpen(false)}
        workspaceId={props.workspaceId}
        initial={props.initial}
      />
    </>
  )
}
