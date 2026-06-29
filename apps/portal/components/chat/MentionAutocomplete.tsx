"use client"

import { useCallback, useMemo, useState } from "react"
import { AtSign } from "lucide-react"

export type MentionMember = {
  userId: string
  name: string
  email: string | null
}

type MentionState = ReturnType<typeof useMentionState>

/**
 * Tracks the @mention popup state for a textarea. We look at the caret position
 * to detect `@token` immediately preceding the caret and surface a filtered list
 * of members.
 */
export function useMentionState(members: MentionMember[]) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [anchor, setAnchor] = useState<{ start: number; end: number } | null>(null)
  const [highlight, setHighlight] = useState(0)

  const matches = useMemo(() => {
    if (!isOpen) return []
    const q = query.toLowerCase()
    return members
      .filter((m) => {
        if (!q) return true
        const name = m.name?.toLowerCase() ?? ""
        const local = m.email?.split("@")[0]?.toLowerCase() ?? ""
        return name.includes(q) || local.includes(q)
      })
      .slice(0, 7)
  }, [isOpen, query, members])

  const handleTextChange = useCallback(
    (value: string, caret: number) => {
      const before = value.slice(0, caret)
      const m = /(^|[\s\n])@([a-zA-Z0-9._-]{0,32})$/.exec(before)
      if (!m) {
        setIsOpen(false)
        setQuery("")
        setAnchor(null)
        setHighlight(0)
        return
      }
      const token = m[2] ?? ""
      const start = caret - token.length - 1 // include '@'
      setIsOpen(true)
      setQuery(token)
      setAnchor({ start, end: caret })
      setHighlight(0)
    },
    []
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!isOpen || matches.length === 0) return false
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlight((h) => Math.min(matches.length - 1, h + 1))
        return true
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlight((h) => Math.max(0, h - 1))
        return true
      }
      if (e.key === "Escape") {
        setIsOpen(false)
        return true
      }
      return false
    },
    [isOpen, matches.length]
  )

  const applySelection = useCallback(
    (token: string, currentValue: string) => {
      const a = anchor
      if (!a) return { newValue: currentValue, caret: currentValue.length }
      const before = currentValue.slice(0, a.start)
      const after = currentValue.slice(a.end)
      const insert = `@${token} `
      const newValue = before + insert + after
      const caret = before.length + insert.length
      setIsOpen(false)
      setAnchor(null)
      setQuery("")
      return { newValue, caret }
    },
    [anchor]
  )

  return {
    isOpen,
    matches,
    highlight,
    setHighlight,
    handleTextChange,
    onKeyDown,
    applySelection,
  }
}

function tokenForMember(m: MentionMember): string {
  const local = m.email?.split("@")[0]
  if (local) return local
  return (m.name || "").replace(/\s+/g, "").toLowerCase() || "user"
}

export function MentionAutocomplete({
  state,
  onSelect,
}: {
  state: MentionState
  onSelect: (label: string) => void
}) {
  if (!state.isOpen || state.matches.length === 0) return null
  return (
    <div className="absolute bottom-full left-0 mb-1 w-64 max-h-64 overflow-auto rounded-md border border-border bg-surface shadow-lg z-20">
      <ul className="py-1">
        {state.matches.map((m, idx) => {
          const token = tokenForMember(m)
          const isActive = idx === state.highlight
          return (
            <li key={m.userId}>
              <button
                type="button"
                onMouseEnter={() => state.setHighlight(idx)}
                onClick={() => onSelect(token)}
                className={
                  "w-full text-left px-2.5 py-1.5 text-[12px] flex items-center gap-2 " +
                  (isActive ? "bg-surface-2 text-fg" : "text-fg-muted hover:bg-surface-2 hover:text-fg")
                }
              >
                <AtSign className="h-3.5 w-3.5 text-fg-subtle" strokeWidth={1.75} />
                <span className="font-medium">{m.name || token}</span>
                <span className="text-fg-subtle text-[11px] truncate ml-auto">@{token}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
