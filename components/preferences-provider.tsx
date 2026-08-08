"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

const SHOW_FLAGS_KEY = "wr:show-flags"

interface PreferencesContextValue {
  showFlags: boolean
  setShowFlags: (value: boolean) => void
  mounted: boolean
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [showFlags, setShowFlagsState] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setShowFlagsState(localStorage.getItem(SHOW_FLAGS_KEY) === "1")
    setMounted(true)
  }, [])

  function setShowFlags(value: boolean) {
    setShowFlagsState(value)
    localStorage.setItem(SHOW_FLAGS_KEY, value ? "1" : "0")
  }

  return (
    <PreferencesContext.Provider value={{ showFlags, setShowFlags, mounted }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider")
  return ctx
}
