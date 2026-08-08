"use client"

import { ArrowLeftRightIcon, SearchIcon, XIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useQueryState, parseAsString } from "nuqs"
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react"

import { LanguageFlag } from "@/components/language-flag"
import { PreferencesDialog } from "@/components/preferences-dialog"
import { usePreferences } from "@/components/preferences-provider"
import { LanguageSelect } from "@/components/search/language-select"
import { Results } from "@/components/search/results"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  clearRecentSearches,
  pushRecentSearch,
  readRecentSearches,
  type RecentSearch,
} from "@/lib/recent-searches"
import {
  canSwap,
  getLanguageLabel,
  getSourceLanguages,
  getTargetsFor,
  isValidDict,
  toDictCode,
  type LookupResult,
  type Suggestion,
} from "@/lib/wordreference"
import { cn } from "@/lib/utils"

const SOURCE_LANGUAGES = getSourceLanguages()

function termFromSlug(slug: string | string[] | undefined): string {
  if (!slug) return ""
  const parts = Array.isArray(slug) ? slug : [slug]
  if (parts.length === 0) return ""
  if (parts.length >= 2 && isValidDict(parts[0]!)) {
    return parts
      .slice(1)
      .map((part) => decodeURIComponent(part))
      .join(" ")
  }
  return parts.map((part) => decodeURIComponent(part)).join(" ")
}

function dictFromSlug(slug: string | string[] | undefined): string | null {
  if (!slug) return null
  const parts = Array.isArray(slug) ? slug : [slug]
  if (parts.length >= 2 && isValidDict(parts[0]!)) return parts[0]!
  return null
}

function searchPath(term: string, dictCode: string | null): string {
  const encoded = encodeURIComponent(term.trim())
  if (dictCode) return `/${dictCode}/${encoded}`
  return `/${encoded}`
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  )
}

export function SearchApp() {
  const { showFlags } = usePreferences()
  const router = useRouter()
  const params = useParams<{ slug?: string | string[] }>()
  const pathTerm = termFromSlug(params.slug)
  const pathDict = dictFromSlug(params.slug)

  const [from, setFrom] = useQueryState("from", parseAsString.withDefault("en"))
  const [to, setTo] = useQueryState("to", parseAsString.withDefault("es"))

  const [input, setInput] = useState(pathTerm)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [result, setResult] = useState<LookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recent, setRecent] = useState<RecentSearch[]>([])
  const [showRecent, setShowRecent] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipSuggestRef = useRef(false)
  const requestIdRef = useRef(0)
  const appliedPathDictRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const targets = getTargetsFor(from)
  const dict = toDictCode(from, to)
  const swapEnabled = canSwap(from, to)
  const hasInput = input.trim().length > 0

  const syncToTarget = useEffectEvent((nextFrom: string, nextTo: string) => {
    const available = getTargetsFor(nextFrom)
    if (!available.some((l) => l.code === nextTo) && available[0]) {
      void setTo(available[0].code)
    }
  })

  const applyPathDict = useEffectEvent((dictCode: string) => {
    if (dictCode.length !== 4) return
    const nextFrom = dictCode.slice(0, 2)
    const nextTo = dictCode.slice(2)
    void setFrom(nextFrom)
    void setTo(nextTo)
  })

  useEffect(() => {
    setRecent(readRecentSearches())
  }, [])

  useEffect(() => {
    syncToTarget(from, to)
  }, [from, to])

  useEffect(() => {
    if (pathDict && pathDict !== appliedPathDictRef.current) {
      appliedPathDictRef.current = pathDict
      applyPathDict(pathDict)
    }
  }, [pathDict])

  useEffect(() => {
    setInput(pathTerm)
  }, [pathTerm])

  useEffect(() => {
    if (!pathTerm.trim()) {
      document.title = "WordReference"
      return
    }
    document.title = `${pathTerm.trim()} · ${from.toUpperCase()}→${to.toUpperCase()}`
  }, [pathTerm, from, to])

  useEffect(() => {
    if (!pathTerm.trim() || !dict) {
      if (!pathTerm.trim()) setResult(null)
      return
    }
    lookup(pathTerm.trim(), dict)
  }, [pathTerm, dict])

  useEffect(() => {
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const query = input.trim()
    if (!dict || query.length < 2 || query === pathTerm.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(dict, query)
    }, 200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [input, dict, pathTerm])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
        return
      }

      if (e.key === "Escape") {
        if (showSuggestions) {
          e.preventDefault()
          setShowSuggestions(false)
          setActiveIndex(-1)
          return
        }
        if (document.activeElement === inputRef.current) {
          e.preventDefault()
          inputRef.current?.blur()
          setShowRecent(false)
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showSuggestions])

  async function fetchSuggestions(dictCode: string, query: string) {
    try {
      const res = await fetch(
        `/api/autocomplete?dict=${encodeURIComponent(dictCode)}&query=${encodeURIComponent(query)}`
      )
      if (!res.ok) return
      const data = (await res.json()) as { suggestions: Suggestion[] }
      setSuggestions(data.suggestions.slice(0, 12))
      setActiveIndex(-1)
      setShowSuggestions(true)
      setShowRecent(false)
    } catch {
      setSuggestions([])
    }
  }

  function lookup(term: string, dictCode: string) {
    const id = ++requestIdRef.current
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/translate?dict=${encodeURIComponent(dictCode)}&w=${encodeURIComponent(term)}`
        )
        if (!res.ok) {
          if (id === requestIdRef.current) setError("Lookup failed. Try again.")
          return
        }
        const data = (await res.json()) as LookupResult
        if (id === requestIdRef.current) {
          setResult(data)
          if (!data.notFound) {
            setRecent(
              pushRecentSearch({
                term,
                dict: dictCode,
                from: dictCode.slice(0, 2),
                to: dictCode.slice(2),
              })
            )
          }
        }
      } catch {
        if (id === requestIdRef.current) setError("Lookup failed. Try again.")
      }
    })
  }

  function submitTerm(term: string, nextDict = dict) {
    const trimmed = term.trim()
    if (!trimmed || !nextDict) return
    skipSuggestRef.current = true
    setShowSuggestions(false)
    setSuggestions([])
    setShowRecent(false)
    setInput(trimmed)
    inputRef.current?.blur()
    router.push(searchPath(trimmed, nextDict))
  }

  function clearSearch() {
    skipSuggestRef.current = true
    setInput("")
    setSuggestions([])
    setShowSuggestions(false)
    setShowRecent(false)
    setResult(null)
    setError(null)
    inputRef.current?.focus()
    router.push("/")
  }

  function handleSwap() {
    if (!swapEnabled) return
    const nextFrom = to
    const nextTo = from
    void setFrom(nextFrom)
    void setTo(nextTo)
    const nextDict = toDictCode(nextFrom, nextTo)
    if (pathTerm.trim() && nextDict) {
      router.replace(searchPath(pathTerm.trim(), nextDict))
    }
  }

  function handleFromChange(nextFrom: string) {
    void setFrom(nextFrom)
    const available = getTargetsFor(nextFrom)
    const nextTo = available.some((l) => l.code === to) ? to : available[0]?.code
    if (nextTo && nextTo !== to) void setTo(nextTo)
    const nextDict = nextTo ? toDictCode(nextFrom, nextTo) : null
    if (pathTerm.trim() && nextDict) {
      router.replace(searchPath(pathTerm.trim(), nextDict))
    }
  }

  function handleToChange(nextTo: string) {
    void setTo(nextTo)
    const nextDict = toDictCode(from, nextTo)
    if (pathTerm.trim() && nextDict) {
      router.replace(searchPath(pathTerm.trim(), nextDict))
    }
  }

  function openRecent(item: RecentSearch) {
    void setFrom(item.from)
    void setTo(item.to)
    submitTerm(item.term, item.dict)
  }

  const canShowRecent =
    showRecent &&
    !showSuggestions &&
    recent.length > 0 &&
    input.trim().length < 2

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-10 sm:px-6">
      <div className="sticky top-0 z-30 -mx-4 border-b border-border/70 bg-background/90 px-4 pt-6 pb-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <header className="mb-4 flex items-center justify-between gap-4">
          <h1 className="font-heading text-xl font-semibold tracking-tight">WordReference</h1>
          <PreferencesDialog />
        </header>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (showSuggestions && suggestions.length > 0) {
              const index = activeIndex >= 0 ? activeIndex : 0
              submitTerm(suggestions[index]!.term)
              return
            }
            submitTerm(input)
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSelect
              aria-label="Entry language"
              value={from}
              onValueChange={handleFromChange}
              languages={SOURCE_LANGUAGES}
              showFlags={showFlags}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Swap languages"
              disabled={!swapEnabled}
              onClick={handleSwap}
            >
              <ArrowLeftRightIcon />
            </Button>
            <LanguageSelect
              aria-label="Exit language"
              value={to}
              onValueChange={handleToChange}
              languages={targets}
              showFlags={showFlags}
            />
          </div>

          <div className="relative">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  setShowRecent(true)
                  if (suggestions.length && input.trim() !== pathTerm.trim()) {
                    setShowSuggestions(true)
                  }
                }}
                onBlur={() => {
                  blurRef.current = setTimeout(() => {
                    setShowSuggestions(false)
                    setShowRecent(false)
                  }, 150)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (showSuggestions) {
                      e.preventDefault()
                      setShowSuggestions(false)
                      setActiveIndex(-1)
                    }
                    return
                  }
                  if (!showSuggestions || suggestions.length === 0) return
                  if (e.key === "ArrowDown") {
                    e.preventDefault()
                    setActiveIndex((i) => (i + 1) % suggestions.length)
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault()
                    setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
                  } else if (e.key === "Enter") {
                    e.preventDefault()
                    const index = activeIndex >= 0 ? activeIndex : 0
                    submitTerm(suggestions[index]!.term)
                  }
                }}
                placeholder="Search a word…"
                autoComplete="off"
                spellCheck={false}
                className={cn("pl-8", hasInput ? "pr-9" : "pr-3")}
                aria-autocomplete="list"
                aria-expanded={showSuggestions || canShowRecent}
              />
              {hasInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearSearch}
                >
                  <XIcon />
                </Button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul
                role="listbox"
                className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
              >
                {suggestions.map((suggestion, index) => (
                  <li key={`${suggestion.term}-${suggestion.lang}-${index}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm",
                        index === activeIndex
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => submitTerm(suggestion.term)}
                    >
                      <span>{suggestion.term}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground uppercase">
                        {showFlags && <LanguageFlag code={suggestion.lang} />}
                        <span>{suggestion.lang}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {canShowRecent && (
              <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <p className="text-xs text-muted-foreground">Recent</p>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      clearRecentSearches()
                      setRecent([])
                    }}
                  >
                    Clear
                  </button>
                </div>
                <ul role="listbox" className="max-h-64 overflow-auto p-1 pt-0">
                  {recent.map((item) => (
                    <li key={`${item.dict}-${item.term}`}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => openRecent(item)}
                      >
                        <span>{item.term}</span>
                        <span className="text-xs text-muted-foreground uppercase">
                          {item.from}→{item.to}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {!dict && (
            <p className="text-xs text-destructive">
              No dictionary for this language pair. Pick another exit language.
            </p>
          )}
        </form>
      </div>

      <div className="mt-8">
        <Results
          result={result}
          isLoading={isPending}
          error={error}
          fromLabel={getLanguageLabel(from)}
          toLabel={getLanguageLabel(to)}
          onSuggestion={submitTerm}
        />
      </div>
    </div>
  )
}
