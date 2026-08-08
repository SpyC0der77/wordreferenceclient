import { getLanguageFlagUrl } from "@/lib/language-flags"
import { cn } from "@/lib/utils"

interface LanguageFlagProps {
  code: string
  className?: string
}

export function LanguageFlag({ code, className }: LanguageFlagProps) {
  const src = getLanguageFlagUrl(code, 40)
  if (!src) return null

  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny remote flag asset
    <img
      src={src}
      alt=""
      width={16}
      height={12}
      loading="lazy"
      decoding="async"
      className={cn("inline-block h-3 w-4 shrink-0 rounded-[2px] object-cover", className)}
      aria-hidden
    />
  )
}
