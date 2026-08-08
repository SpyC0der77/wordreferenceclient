"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useState, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { LookupResult, Section, Sense } from "@/lib/wordreference"
import { cn } from "@/lib/utils"

interface ResultsProps {
  result: LookupResult | null
  isLoading: boolean
  error?: string | null
  fromLabel?: string
  toLabel?: string
  onSuggestion: (term: string) => void
}

export function Results({
  result,
  isLoading,
  error,
  fromLabel = "From",
  toLabel = "To",
  onSuggestion,
}: ResultsProps) {
  if (error && !result) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (isLoading && !result) {
    return <ResultsSkeleton fromLabel={fromLabel} toLabel={toLabel} />
  }

  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">
        Type a word and press Enter to look it up.
      </p>
    )
  }

  if (result.notFound) {
    return (
      <div className={cn("grid gap-3", isLoading && "opacity-60")}>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-sm">{result.message ?? "No translation found."}</p>
        {result.suggestions.length > 0 && (
          <div className="grid gap-2">
            <p className="text-xs text-muted-foreground">Did you mean?</p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1">
              {result.suggestions.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="text-sm underline underline-offset-2 hover:text-foreground"
                    onClick={() => onSuggestion(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-8", isLoading && "opacity-60 pointer-events-none")}>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result.sections.map((section) => (
        <SectionTable
          key={section.id}
          section={section}
          fromLabel={fromLabel}
          toLabel={toLabel}
        />
      ))}
    </div>
  )
}

function ResultsSkeleton({
  fromLabel,
  toLabel,
}: {
  fromLabel: string
  toLabel: string
}) {
  return (
    <div className="overflow-x-auto" aria-hidden>
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th colSpan={3} className="px-3 py-2.5 text-left">
              <span className="inline-block h-4 w-40 animate-pulse rounded bg-muted" />
            </th>
          </tr>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="w-[32%] px-3 py-1.5 text-left font-bold">{fromLabel}</th>
            <th className="w-[28%] px-3 py-1.5 text-left font-bold">Sense</th>
            <th className="w-[40%] px-3 py-1.5 text-left font-bold">{toLabel}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-border/60",
                i % 2 === 0 ? "bg-muted/45" : "bg-background"
              )}
            >
              <td className="px-3 py-2.5">
                <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-muted" />
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-block h-3.5 w-32 animate-pulse rounded bg-muted" />
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-block h-3.5 w-28 animate-pulse rounded bg-muted" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionTable({
  section,
  fromLabel,
  toLabel,
}: {
  section: Section
  fromLabel: string
  toLabel: string
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th
              colSpan={3}
              className="px-3 py-2.5 text-left font-heading text-sm font-bold tracking-tight"
            >
              {section.title}
            </th>
          </tr>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="w-[32%] px-3 py-1.5 text-left font-bold">{fromLabel}</th>
            <th className="w-[28%] px-3 py-1.5 text-left font-bold">Sense</th>
            <th className="w-[40%] px-3 py-1.5 text-left font-bold">{toLabel}</th>
          </tr>
        </thead>
        <tbody>{renderSenseRows(section.senses)}</tbody>
      </table>
    </div>
  )
}

function renderSenseRows(senses: Sense[]) {
  const rows: ReactNode[] = []
  let defIndex = 0

  for (const [senseIndex, sense] of senses.entries()) {
    const register = sense.register?.join(", ")
    const first = sense.to[0]
    const rest = sense.to.slice(1)
    const keyBase = sense.id ?? `sense-${senseIndex}`

    const mainZebra = defIndex % 2 === 0
    defIndex += 1
    rows.push(
      <tr
        key={`${keyBase}-main`}
        className={cn(
          "align-top border-b border-border/60",
          mainZebra ? "bg-muted/45" : "bg-background"
        )}
      >
        <td className="px-3 py-2.5">
          <span className="font-medium">{sense.from}</span>
          {sense.fromPos && (
            <span className="ml-1.5 text-xs text-muted-foreground italic">{sense.fromPos}</span>
          )}
        </td>
        <td className="px-3 py-2.5 text-muted-foreground">
          {sense.sense}
          {register && <span className="mt-0.5 block text-xs">[{register}]</span>}
        </td>
        <td className="px-3 py-2.5">
          {first ? <TranslationCell translation={first} /> : null}
        </td>
      </tr>
    )

    for (const [i, translation] of rest.entries()) {
      const zebra = defIndex % 2 === 0
      defIndex += 1
      rows.push(
        <tr
          key={`${keyBase}-to-${i}`}
          className={cn(
            "align-top border-b border-border/60",
            zebra ? "bg-muted/45" : "bg-background"
          )}
        >
          <td className="px-3 py-1.5" />
          <td className="px-3 py-1.5 text-xs text-muted-foreground">
            {translation.note ? `(${translation.note})` : null}
          </td>
          <td className="px-3 py-1.5">
            <TranslationCell translation={translation} hideNote />
          </td>
        </tr>
      )
    }

    if (sense.examples.length > 0) {
      rows.push(
        <tr key={`${keyBase}-examples`} className="border-b border-border bg-background">
          <td colSpan={3} className="px-3 py-2.5">
            <ul className="grid gap-2.5">
              {sense.examples.map((example, i) => {
                const copyText = [example.from, example.to].filter(Boolean).join("\n")
                return (
                  <li
                    key={i}
                    className="group grid gap-0.5 border-l-2 border-border pl-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid gap-0.5">
                        {example.from && (
                          <p className="text-muted-foreground italic">{example.from}</p>
                        )}
                        {example.to && (
                          <p className="italic text-foreground/90">{example.to}</p>
                        )}
                      </div>
                      {copyText && <CopyButton text={copyText} label="Copy example" />}
                    </div>
                  </li>
                )
              })}
            </ul>
          </td>
        </tr>
      )
    }
  }

  return rows
}

function TranslationCell({
  translation,
  hideNote = false,
}: {
  translation: { text: string; pos?: string; note?: string }
  hideNote?: boolean
}) {
  return (
    <div className="group flex items-start justify-between gap-2">
      <span>
        <span>{translation.text}</span>
        {translation.pos && (
          <span className="ml-1.5 text-xs text-muted-foreground italic">{translation.pos}</span>
        )}
        {!hideNote && translation.note && (
          <span className="ml-1.5 text-xs text-muted-foreground">({translation.note})</span>
        )}
      </span>
      <CopyButton text={translation.text} label="Copy translation" />
    </div>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn(
        "shrink-0 text-muted-foreground opacity-60 transition-all group-hover:opacity-100 focus-visible:opacity-100",
        copied && "text-foreground opacity-100"
      )}
      aria-label={copied ? "Copied" : label}
      onClick={handleCopy}
    >
      {copied ? (
        <CheckIcon
          key="check"
          className="animate-in zoom-in-50 fade-in-0 spin-in-90 duration-200"
        />
      ) : (
        <CopyIcon
          key="copy"
          className="animate-in fade-in-0 zoom-in-95 duration-150"
        />
      )}
    </Button>
  )
}
