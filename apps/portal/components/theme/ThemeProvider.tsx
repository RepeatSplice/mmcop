"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = "monarch-theme"

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light"
}

function readThemeFromDom(): Theme | null {
  if (typeof document === "undefined") return null
  const t = document.documentElement.dataset.theme
  return t === "light" || t === "dark" ? t : null
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light"
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // ignore
  }
  return readThemeFromDom() ?? getSystemTheme()
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme())

  useEffect(() => {
    const initial = readStoredTheme()
    setThemeState(initial)
    applyTheme(initial)
  }, [])

  const value = useMemo<ThemeContextValue>(() => {
    function setTheme(t: Theme) {
      setThemeState(t)
      applyTheme(t)
      try {
        window.localStorage.setItem(STORAGE_KEY, t)
      } catch {
        // ignore
      }
    }
    function toggleTheme() {
      setTheme(theme === "dark" ? "light" : "dark")
    }
    return { theme, setTheme, toggleTheme }
  }, [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
