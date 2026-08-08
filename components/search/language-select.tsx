"use client"

import { LanguageFlag } from "@/components/language-flag"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Language } from "@/lib/wordreference"
import { cn } from "@/lib/utils"

interface LanguageSelectProps {
  value: string
  onValueChange: (value: string) => void
  languages: Language[]
  showFlags?: boolean
  id?: string
  "aria-label"?: string
}

export function LanguageSelect({
  value,
  onValueChange,
  languages,
  showFlags = false,
  id,
  "aria-label": ariaLabel,
}: LanguageSelectProps) {
  const items = Object.fromEntries(
    languages.map((lang) => [lang.code, lang.label])
  )

  return (
    <Select
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      items={items}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(showFlags ? "w-[11.5rem]" : "w-[10.5rem]")}
      >
        <SelectValue>
          {(selected: string | null) => {
            const lang = languages.find((l) => l.code === selected)
            if (!lang) return selected
            return (
              <span className="inline-flex items-center gap-1.5">
                {showFlags && <LanguageFlag code={lang.code} />}
                <span>{lang.label}</span>
              </span>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="inline-flex items-center gap-1.5">
              {showFlags && <LanguageFlag code={lang.code} />}
              <span>{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
